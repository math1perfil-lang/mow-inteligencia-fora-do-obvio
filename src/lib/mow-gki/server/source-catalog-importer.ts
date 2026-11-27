import type { OpenAlexWorkCandidate, OpenAlexWorksPage } from "./openalex-client";

/** Licenças abertas das quais o importador tenta baixar o texto. */
const OPEN_LICENSE = /^(cc0|cc-by(-sa|-nc|-nd|-nc-sa|-nc-nd)?|public-domain|pd)(-[0-9.]+)?$/i;
const MAX_BODY_BYTES = 5_000_000;
const MAX_TEXT_CHARS = 2_000_000;
const MIN_TEXT_CHARS = 2_000;

export interface CatalogSourceItem {
  provider: "openalex";
  provider_record_id: string;
  title: string;
  source_type: string;
  canonical_url: string;
  doi: string | null;
  publication_year: number | null;
  language: string | null;
  authors: string[];
  open_access_url: string | null;
  license: string | null;
}

export interface UpsertedSource {
  sourceId: string;
  recordId: string;
  inserted: boolean;
}

export interface FetchedText {
  contentType: string;
  body: string;
  byteLength: number;
  finalUrl: string;
}

export interface SourceCatalogImporterDeps {
  searchWorks(query: string, options: { perPage: number }): Promise<OpenAlexWorksPage>;
  upsertSources(domain: string, items: CatalogSourceItem[]): Promise<UpsertedSource[]>;
  /** Retorna null quando a página não pôde ser baixada. */
  fetchText(url: string): Promise<FetchedText | null>;
  storeText(input: {
    sourceId: string;
    text: string;
    format: "plain" | "html_stripped";
    license: string | null;
    originUrl: string;
  }): Promise<void>;
}

export interface ImportRequest {
  domain: string;
  queries: string[];
  perQuery: number;
  fullText: boolean;
}

export interface ImportReport {
  found: number;
  inserted: number;
  updated: number;
  textStored: number;
  textSkipped: Record<string, number>;
  queryErrors: string[];
}

export function toCatalogItem(work: OpenAlexWorkCandidate): CatalogSourceItem {
  const oa = work.bestOpenAccessLocation;
  return {
    provider: "openalex",
    provider_record_id: work.providerRecordId,
    title: work.title,
    source_type: work.publicationType,
    canonical_url: work.doi ?? work.providerRecordUrl,
    doi: work.doi,
    publication_year: work.publicationYear,
    language: work.language,
    authors: work.authors.slice(0, 50),
    open_access_url: oa?.pdfUrl ?? oa?.landingPageUrl ?? work.openAccessSignal.url,
    license: oa?.license ?? null,
  };
}

/** Bloqueia endereços locais e literais de IP (defesa básica contra SSRF). */
export function isSafePublicHttpsUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;
  if (host.includes(":") || /^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  return host.includes(".");
}

export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|nav|header|footer)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr|br|section|article)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type SkipReason =
  | "no_open_license"
  | "no_url"
  | "unsafe_url"
  | "download_failed"
  | "pdf_not_supported"
  | "unsupported_type"
  | "too_large"
  | "too_short";

export async function importSourceCatalog(
  deps: SourceCatalogImporterDeps,
  request: ImportRequest,
): Promise<ImportReport> {
  const report: ImportReport = {
    found: 0,
    inserted: 0,
    updated: 0,
    textStored: 0,
    textSkipped: {},
    queryErrors: [],
  };
  const skip = (reason: SkipReason) => {
    report.textSkipped[reason] = (report.textSkipped[reason] ?? 0) + 1;
  };
  const seen = new Set<string>();

  for (const query of request.queries) {
    let works: OpenAlexWorkCandidate[];
    try {
      works = (await deps.searchWorks(query, { perPage: request.perQuery })).results;
    } catch {
      report.queryErrors.push(query);
      continue;
    }
    const fresh = works.filter((work) => !seen.has(work.providerRecordId));
    for (const work of fresh) seen.add(work.providerRecordId);
    if (fresh.length === 0) continue;

    const items = fresh.map(toCatalogItem);
    const saved = await deps.upsertSources(request.domain, items);
    report.found += saved.length;
    report.inserted += saved.filter((row) => row.inserted).length;
    report.updated += saved.filter((row) => !row.inserted).length;
    if (!request.fullText) continue;

    const byRecord = new Map(saved.map((row) => [row.recordId, row.sourceId]));
    for (const item of items) {
      const sourceId = byRecord.get(item.provider_record_id);
      if (!sourceId) continue;
      if (!item.license || !OPEN_LICENSE.test(item.license.trim())) {
        skip("no_open_license");
        continue;
      }
      const work = fresh.find(
        (candidate) => candidate.providerRecordId === item.provider_record_id,
      );
      const url = work?.bestOpenAccessLocation?.landingPageUrl ?? null;
      if (!url) {
        skip(item.open_access_url?.toLowerCase().endsWith(".pdf") ? "pdf_not_supported" : "no_url");
        continue;
      }
      if (!isSafePublicHttpsUrl(url)) {
        skip("unsafe_url");
        continue;
      }
      const fetched = await deps.fetchText(url);
      if (!fetched) {
        skip("download_failed");
        continue;
      }
      if (!isSafePublicHttpsUrl(fetched.finalUrl)) {
        skip("unsafe_url");
        continue;
      }
      if (fetched.byteLength > MAX_BODY_BYTES) {
        skip("too_large");
        continue;
      }
      const type = fetched.contentType.toLowerCase();
      if (type.includes("pdf")) {
        skip("pdf_not_supported");
        continue;
      }
      const isHtml = type.includes("text/html");
      if (!isHtml && !type.includes("text/plain")) {
        skip("unsupported_type");
        continue;
      }
      const text = (isHtml ? htmlToText(fetched.body) : fetched.body.trim()).slice(
        0,
        MAX_TEXT_CHARS,
      );
      if (text.length < MIN_TEXT_CHARS) {
        skip("too_short");
        continue;
      }
      await deps.storeText({
        sourceId,
        text,
        format: isHtml ? "html_stripped" : "plain",
        license: item.license,
        originUrl: fetched.finalUrl,
      });
      report.textStored += 1;
    }
  }
  return report;
}

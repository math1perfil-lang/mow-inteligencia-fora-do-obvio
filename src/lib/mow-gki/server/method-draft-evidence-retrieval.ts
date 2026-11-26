import { sourceRightsSearchRowsSchema } from "./source-rights-review-contract";
import { evaluateSourceContentUse, sourceRightsReviewSnapshotSchema } from "./source-rights-policy";
import type { SourceRightsSearchRow } from "./source-rights-review-contract";

const MAX_RESPONSE_BYTES = 1_000_000;
const MAX_EVIDENCE_ITEMS = 6;
const MAX_FETCH_ATTEMPTS = 12;
const MAX_EVIDENCE_CHARS = 20_000;
const MIN_EVIDENCE_CHARS = 120;
const DEFAULT_TIMEOUT_MS = 5_000;
const REQUIRED_USES = ["internal_content_analysis", "commercial_method_derivation"] as const;

type EvidenceFetch = typeof fetch;
export type RetrievedMethodEvidence = {
  evidenceId: string;
  sourceId: string;
  title: string;
  url: string;
  content: string;
  contentKind: "source_page_extract";
  rightsReview: ReturnType<typeof sourceRightsReviewSnapshotSchema.parse>;
};
export type EvidenceRetrievalResult = {
  evidence: RetrievedMethodEvidence[];
  eligibleSources: number;
  unreadableSources: number;
};

function safePublicHttpsUrl(value: string | null): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      url.hash ||
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host.endsWith(".test") ||
      !host.includes(".") ||
      host.includes(":") ||
      /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_match, number: string) => {
      const codePoint = Number(number);
      return Number.isInteger(codePoint) && codePoint > 0 && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : " ";
    })
    .replace(/&#x([\da-f]+);/gi, (_match, hex: string) => {
      const codePoint = Number.parseInt(hex, 16);
      return Number.isInteger(codePoint) && codePoint > 0 && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : " ";
    });
}

export function extractSourcePageText(body: string, contentType: string): string | null {
  const type = contentType.toLowerCase();
  if (type.includes("application/pdf") || type.includes("application/octet-stream")) return null;
  if (type.includes("text/plain")) {
    const plain = body.replace(/\s+/g, " ").trim();
    return plain.length >= MIN_EVIDENCE_CHARS ? plain.slice(0, MAX_EVIDENCE_CHARS) : null;
  }
  if (!type.includes("text/html") && !type.includes("application/xhtml+xml")) return null;
  const bodyMatch = /<body\b[^>]*>([\s\S]*?)<\/body\s*>/i.exec(body);
  let html = bodyMatch?.[1] ?? body;
  html = html
    .replace(
      /<(script|style|svg|noscript|template|nav|header|footer|form|iframe)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
      " ",
    )
    .replace(/<(br|hr)\b[^>]*>/gi, "\n")
    .replace(/<\/(p|div|article|section|li|h[1-6]|blockquote|tr)\s*>/gi, "\n")
    .replace(/<[^>]*>/g, " ");
  const text = decodeHtmlEntities(html)
    .replace(/[\t\r ]+/g, " ")
    .replace(/\n\s*/g, "\n")
    .trim();
  return text.length >= MIN_EVIDENCE_CHARS ? text.slice(0, MAX_EVIDENCE_CHARS) : null;
}

async function readBodyWithLimit(response: Response): Promise<string | null> {
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_RESPONSE_BYTES) return null;
  if (!response.body) return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }
  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(combined);
  } catch {
    return null;
  }
}

function rightsSnapshot(source: SourceRightsSearchRow) {
  return sourceRightsReviewSnapshotSchema.safeParse({
    status: source.decision_status,
    permittedUses: source.permitted_uses,
    restrictions: source.restrictions?.trim() ? [source.restrictions] : [],
    restrictionsReviewed: source.restrictions_reviewed,
    restrictionsSatisfied: source.restrictions_satisfied,
    evidenceUrl: source.rights_evidence_url,
    reviewerId: source.reviewed_by,
    reviewedAt: source.reviewed_at,
    validUntil: source.valid_until,
  });
}

export async function retrieveAuthorizedMethodEvidence(
  rowsValue: unknown,
  options: { fetchImplementation?: EvidenceFetch; evaluatedAt?: Date; timeoutMs?: number } = {},
): Promise<EvidenceRetrievalResult> {
  const rows = sourceRightsSearchRowsSchema.safeParse(rowsValue);
  const now = options.evaluatedAt ?? new Date();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (!rows.success || !(now instanceof Date) || !Number.isFinite(now.getTime())) {
    return { evidence: [], eligibleSources: 0, unreadableSources: 0 };
  }
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const eligible: Array<{
    row: SourceRightsSearchRow;
    rightsReview: RetrievedMethodEvidence["rightsReview"];
    url: URL;
  }> = [];
  for (const row of rows.data) {
    const url = safePublicHttpsUrl(row.canonical_url);
    const parsedReview = rightsSnapshot(row);
    if (!url || !parsedReview.success) continue;
    const review = parsedReview.data;
    if (REQUIRED_USES.some((use) => !evaluateSourceContentUse(review, use, now).allowed)) continue;
    eligible.push({ row, rightsReview: review, url });
  }

  const evidence: RetrievedMethodEvidence[] = [];
  let unreadableSources = 0;
  for (const source of eligible.slice(0, MAX_FETCH_ATTEMPTS)) {
    if (evidence.length >= MAX_EVIDENCE_ITEMS) break;
    try {
      const response = await fetchImplementation(source.url, {
        method: "GET",
        headers: { Accept: "text/html,application/xhtml+xml,text/plain;q=0.9" },
        redirect: "error",
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        unreadableSources += 1;
        continue;
      }
      const raw = await readBodyWithLimit(response);
      const content = raw
        ? extractSourcePageText(raw, response.headers.get("content-type") ?? "")
        : null;
      if (!content) {
        unreadableSources += 1;
        continue;
      }
      evidence.push({
        evidenceId: crypto.randomUUID(),
        sourceId: source.row.source_id,
        title: source.row.title,
        url: source.url.toString(),
        content,
        contentKind: "source_page_extract",
        rightsReview: source.rightsReview,
      });
    } catch {
      unreadableSources += 1;
    }
  }
  return { evidence, eligibleSources: eligible.length, unreadableSources };
}

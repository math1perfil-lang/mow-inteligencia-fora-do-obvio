import { openAlexQuerySchema } from "../openalex-query.schema";
import {
  externalJsonSourcesConfigSchema,
  externalSourceCandidateSchema,
  type ExternalJsonSourceConfig,
  type ExternalSourceCandidate,
  type ExternalSourceProviderStatus,
  type ExternalSourceSearchPage,
} from "./external-source.schema";

const MAX_CONFIGURATION_LENGTH = 64_000;
const MAX_RESPONSE_LENGTH = 1_000_000;
const DEFAULT_TIMEOUT_MS = 12_000;
const MAX_TOTAL_RESULTS = 200;

type Environment = Record<string, string | undefined>;
type FailureCode = Exclude<ExternalSourceProviderStatus["failureCode"], null>;

class ProviderRequestError extends Error {
  readonly code: FailureCode;

  constructor(code: FailureCode) {
    super("A fonte externa não concluiu a consulta.");
    this.name = "ProviderRequestError";
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readAtPath(value: unknown, path: string): unknown {
  let current: unknown = value;
  for (const segment of path.split(".")) {
    if (!isRecord(current) || !Object.hasOwn(current, segment)) return undefined;
    current = current[segment];
  }
  return current;
}

function readText(value: unknown, max = 2_000): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 && text.length <= max ? text : null;
}

function readHttpsUrl(value: unknown): string | null {
  const text = readText(value, 4_000);
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function readDoi(value: unknown): string | null {
  const text = readText(value, 500);
  if (!text) return null;
  const doi = text.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
  if (!/^10\.\d{4,9}\/.+/i.test(doi)) return null;
  const url = `https://doi.org/${doi}`;
  return readHttpsUrl(url);
}

function readYear(value: unknown): number | null {
  const year = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(year) && year >= 1400 && year <= 3000 ? year : null;
}

function mapPublicationType(value: unknown): ExternalSourceCandidate["publicationType"] {
  const text = readText(value, 100)?.toLowerCase();
  if (text === "article" || text === "review" || text === "preprint") return "article";
  if (text === "book" || text === "book-chapter") return "book";
  if (text === "dissertation" || text === "report" || text === "document") return "document";
  return "other";
}

function readAuthors(value: unknown, authorNamePath?: string): string[] {
  if (!Array.isArray(value)) return [];
  const authors = value
    .map((entry) => {
      if (typeof entry === "string") return readText(entry, 500);
      if (authorNamePath) return readText(readAtPath(entry, authorNamePath), 500);
      return null;
    })
    .filter((author): author is string => author !== null);
  return authors.slice(0, 100);
}

function normalizeCandidate(
  provider: ExternalJsonSourceConfig,
  record: unknown,
): ExternalSourceCandidate | null {
  if (!isRecord(record)) return null;
  const id = readText(readAtPath(record, provider.fields.id), 300);
  const title = readText(readAtPath(record, provider.fields.title));
  const url = readHttpsUrl(readAtPath(record, provider.fields.url));
  if (!id || !title || !url) return null;

  const doiValue = provider.fields.doi ? readAtPath(record, provider.fields.doi) : null;
  const yearValue = provider.fields.publicationYear
    ? readAtPath(record, provider.fields.publicationYear)
    : null;
  const languageValue = provider.fields.language
    ? readAtPath(record, provider.fields.language)
    : null;
  const typeValue = provider.fields.publicationType
    ? readAtPath(record, provider.fields.publicationType)
    : null;
  const authorsValue = provider.fields.authors ? readAtPath(record, provider.fields.authors) : null;

  const candidate = {
    providerId: provider.id,
    providerLabel: provider.label,
    providerRecordId: id,
    providerRecordUrl: url,
    metadataLicense: provider.metadataLicense ?? null,
    title,
    publicationType: mapPublicationType(typeValue),
    doi: readDoi(doiValue),
    publicationYear: readYear(yearValue),
    language: readText(languageValue, 64),
    authors: readAuthors(authorsValue, provider.fields.authorName),
    contentRightsAssessment: "unassessed",
  } satisfies ExternalSourceCandidate;
  const parsed = externalSourceCandidateSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

function getFailureCode(error: unknown): FailureCode {
  if (error instanceof ProviderRequestError) return error.code;
  if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
    return "timeout";
  }
  return "upstream_error";
}

export function parseExternalSourceConfiguration(
  raw: string | undefined,
): ExternalJsonSourceConfig[] {
  if (!raw?.trim()) return [];
  if (raw.length > MAX_CONFIGURATION_LENGTH)
    throw new TypeError("Configuração de fontes inválida.");

  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    throw new TypeError("Configuração de fontes inválida.");
  }

  const parsed = externalJsonSourcesConfigSchema.safeParse(decoded);
  if (!parsed.success) throw new TypeError("Configuração de fontes inválida.");
  return parsed.data;
}

export interface ConfiguredSourceSearchClientOptions {
  configuration?: string;
  environment?: Environment;
  fetchImplementation?: typeof fetch;
  timeoutMs?: number;
}

export class ConfiguredSourceSearchClient {
  private readonly providers: ExternalJsonSourceConfig[];
  private readonly environment: Environment;
  private readonly fetchImplementation: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: ConfiguredSourceSearchClientOptions = {}) {
    this.providers = parseExternalSourceConfiguration(options.configuration);
    this.environment = options.environment ?? process.env;
    this.fetchImplementation = options.fetchImplementation ?? globalThis.fetch.bind(globalThis);
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    if (!Number.isInteger(this.timeoutMs) || this.timeoutMs < 1) {
      throw new RangeError("timeoutMs deve ser um inteiro positivo.");
    }
  }

  get isConfigured(): boolean {
    return this.providers.some(
      (provider) => !provider.auth || Boolean(this.environment[provider.auth.envVar]?.trim()),
    );
  }

  async search(query: string, perPage = 10): Promise<ExternalSourceSearchPage> {
    const parsedQuery = openAlexQuerySchema.safeParse(query);
    if (!parsedQuery.success) throw new TypeError("Use somente termos temáticos curtos.");
    if (!Number.isInteger(perPage) || perPage < 1 || perPage > 20) {
      throw new RangeError("perPage deve ser um inteiro entre 1 e 20.");
    }

    if (this.providers.length === 0) {
      return { state: "not_configured", results: [], providers: [] };
    }

    const outcomes = await Promise.all(
      this.providers.map((provider) => this.searchProvider(provider, parsedQuery.data, perPage)),
    );
    const providers = outcomes.map((outcome) => outcome.status);
    const results = outcomes.flatMap((outcome) => outcome.results).slice(0, MAX_TOTAL_RESULTS);
    const availableCount = providers.filter((provider) => provider.status === "available").length;
    const failedCount = providers.filter((provider) => provider.status === "unavailable").length;
    const notConfiguredCount = providers.filter(
      (provider) => provider.status === "not_configured",
    ).length;

    let state: ExternalSourceSearchPage["state"];
    if (availableCount === 0 && failedCount === 0) state = "not_configured";
    else if (availableCount === 0) state = "unavailable";
    else if (failedCount > 0 || notConfiguredCount > 0) state = "partial";
    else state = "complete";

    return { state, results, providers };
  }

  private async searchProvider(
    provider: ExternalJsonSourceConfig,
    query: string,
    perPage: number,
  ): Promise<{ status: ExternalSourceProviderStatus; results: ExternalSourceCandidate[] }> {
    const apiKey = provider.auth ? this.environment[provider.auth.envVar]?.trim() : undefined;
    if (provider.auth && !apiKey) {
      return {
        status: {
          providerId: provider.id,
          providerLabel: provider.label,
          status: "not_configured",
          resultCount: 0,
          failureCode: null,
        },
        results: [],
      };
    }

    try {
      const url = new URL(provider.endpoint);
      url.searchParams.set(provider.queryParameter, query);
      if (provider.limitParameter) {
        url.searchParams.set(
          provider.limitParameter,
          String(Math.min(perPage, provider.maxResults)),
        );
      }

      const headers = new Headers({ Accept: "application/json" });
      if (provider.auth && apiKey) {
        headers.set(provider.auth.headerName, `${provider.auth.prefix ?? ""}${apiKey}`);
      }

      const response = await this.fetchImplementation(url, {
        method: "GET",
        headers,
        redirect: "error",
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) {
        const failureCode: FailureCode =
          response.status === 429
            ? "rate_limited"
            : response.status === 401 || response.status === 403
              ? "auth_failed"
              : "upstream_error";
        throw new ProviderRequestError(failureCode);
      }

      const contentLength = Number(response.headers.get("content-length"));
      if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_LENGTH) {
        throw new ProviderRequestError("invalid_response");
      }
      const body = await response.text();
      if (body.length > MAX_RESPONSE_LENGTH) throw new ProviderRequestError("invalid_response");

      let payload: unknown;
      try {
        payload = JSON.parse(body);
      } catch {
        throw new ProviderRequestError("invalid_response");
      }

      const records = readAtPath(payload, provider.resultsPath);
      if (!Array.isArray(records)) throw new ProviderRequestError("invalid_response");
      const results = records
        .slice(0, Math.min(perPage, provider.maxResults))
        .map((record) => normalizeCandidate(provider, record))
        .filter((candidate): candidate is ExternalSourceCandidate => candidate !== null);
      return {
        status: {
          providerId: provider.id,
          providerLabel: provider.label,
          status: "available",
          resultCount: results.length,
          failureCode: null,
        },
        results,
      };
    } catch (error) {
      const failureCode = getFailureCode(error);
      return {
        status: {
          providerId: provider.id,
          providerLabel: provider.label,
          status: "unavailable",
          resultCount: 0,
          failureCode,
        },
        results: [],
      };
    }
  }
}

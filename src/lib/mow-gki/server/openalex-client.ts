import { openAlexDoiUrlSchema, openAlexWorkCandidateSchema } from "./openalex-candidate.schema";
import type { OpenAlexLocation, OpenAlexWorkCandidate } from "./openalex-candidate.schema";

const OPENALEX_WORKS_URL = "https://api.openalex.org/works";
const OPENALEX_SELECT = [
  "id",
  "doi",
  "title",
  "publication_year",
  "type",
  "language",
  "authorships",
].join(",");
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_PAGE_SIZE = 100;
const DEFAULT_TIMEOUT_MS = 15_000;

type JsonRecord = Record<string, unknown> & {
  id?: unknown;
  doi?: unknown;
  title?: unknown;
  display_name?: unknown;
  publication_year?: unknown;
  type?: unknown;
  language?: unknown;
  authorships?: unknown;
  author?: unknown;
  results?: unknown;
  meta?: unknown;
  next_cursor?: unknown;
  count?: unknown;
};

export interface OpenAlexClientOptions {
  /** Supply only from trusted server code; never from browser input or a client bundle. */
  apiKey?: string;
  fetchImplementation?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface OpenAlexSearchOptions {
  perPage?: number;
  cursor?: string;
}

/**
 * A bibliographic discovery candidate, not a rights decision or a verified source.
 * Search is title-only and abstracts/full-text are neither queried nor returned.
 */
export type { OpenAlexLocation, OpenAlexWorkCandidate } from "./openalex-candidate.schema";

export interface OpenAlexWorksPage {
  results: OpenAlexWorkCandidate[];
  nextCursor: string | null;
  resultCount: number | null;
}

export class OpenAlexApiError extends Error {
  readonly status: number;
  readonly retryAfterSeconds: number | null;

  constructor(status: number, retryAfterSeconds: number | null = null) {
    super(`OpenAlex API request failed with HTTP ${status}.`);
    this.name = "OpenAlexApiError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readHttpsUrl(value: unknown): string | null {
  const text = readString(value);
  if (!text) return null;

  try {
    const url = new URL(text);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function openAlexId(value: unknown): string | null {
  const text = readString(value);
  if (!text) return null;

  const match = /^(?:https:\/\/openalex\.org\/)?(W\d+)$/i.exec(text);
  return match?.[1]?.toUpperCase() ?? null;
}

function mapPublicationType(value: string | null): OpenAlexWorkCandidate["publicationType"] {
  if (value === "article" || value === "review" || value === "preprint") return "article";
  if (value === "book" || value === "book-chapter") return "book";
  if (value === "dissertation" || value === "report" || value === "standard") {
    return "document";
  }
  return "other";
}

function normalizeWork(value: unknown): OpenAlexWorkCandidate | null {
  if (!isRecord(value)) return null;

  const providerRecordId = openAlexId(value.id);
  const title = readString(value.title) ?? readString(value.display_name);
  if (!providerRecordId || !title) return null;

  const doiUrl = readHttpsUrl(value.doi);
  const doi = doiUrl && openAlexDoiUrlSchema.safeParse(doiUrl).success ? doiUrl : null;
  const year = value.publication_year;
  const publicationYear =
    typeof year === "number" && Number.isInteger(year) && year >= 1400 && year <= 3000
      ? year
      : null;
  const authorships = Array.isArray(value.authorships) ? value.authorships : [];
  const authors = authorships
    .map((authorship) => {
      if (!isRecord(authorship) || !isRecord(authorship.author)) return null;
      return readString(authorship.author.display_name);
    })
    .filter((name): name is string => name !== null);

  const candidate = {
    provider: "openalex",
    providerRecordId,
    providerRecordUrl: `https://openalex.org/works/${providerRecordId}`,
    metadataLicense: "CC0",
    title,
    publicationType: mapPublicationType(readString(value.type)),
    doi,
    publicationYear,
    language: readString(value.language),
    authors,
    primaryLocation: null,
    bestOpenAccessLocation: null,
    openAccessSignal: { isOpenAccess: null, status: null, url: null },
    contentRightsAssessment: "unassessed",
  } satisfies OpenAlexWorkCandidate;
  const parsedCandidate = openAlexWorkCandidateSchema.safeParse(candidate);
  return parsedCandidate.success ? parsedCandidate.data : null;
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, Math.ceil((date - Date.now()) / 1000)) : null;
}

export class OpenAlexClient {
  private readonly options: OpenAlexClientOptions;
  private readonly fetchImplementation: typeof fetch;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor(options: OpenAlexClientOptions = {}) {
    this.options = options;
    this.fetchImplementation = options.fetchImplementation ?? globalThis.fetch.bind(globalThis);
    this.sleep =
      options.sleep ??
      ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
    this.maxRetries = options.maxRetries ?? 2;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    if (!Number.isInteger(this.maxRetries) || this.maxRetries < 0 || this.maxRetries > 5) {
      throw new RangeError("maxRetries deve ser um inteiro entre 0 e 5.");
    }
    if (!Number.isInteger(this.timeoutMs) || this.timeoutMs < 1) {
      throw new RangeError("timeoutMs deve ser um inteiro positivo.");
    }
    if (options.apiKey !== undefined && options.apiKey.trim().length === 0) {
      throw new TypeError("apiKey, quando informado, não pode estar vazio.");
    }
  }

  async searchWorks(
    query: string,
    { perPage = 10, cursor = "*" }: OpenAlexSearchOptions = {},
  ): Promise<OpenAlexWorksPage> {
    if (query.trim().length === 0) {
      throw new TypeError("A consulta OpenAlex não pode estar vazia.");
    }
    if (!Number.isInteger(perPage) || perPage < 1 || perPage > MAX_PAGE_SIZE) {
      throw new RangeError(`perPage deve ser um inteiro entre 1 e ${MAX_PAGE_SIZE}.`);
    }
    if (cursor.trim().length === 0) throw new TypeError("O cursor OpenAlex não pode estar vazio.");
    if (cursor !== "*" && !this.options.apiKey) {
      throw new Error("A paginação OpenAlex além da primeira página exige uma API key.");
    }

    const url = new URL(OPENALEX_WORKS_URL);
    // OpenAlex supports the scoped search parameter; using title avoids abstract/full-text matching.
    url.searchParams.set("search.title", query.trim());
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("cursor", cursor);
    url.searchParams.set("select", OPENALEX_SELECT);

    const headers = new Headers({ Accept: "application/json" });
    if (this.options.apiKey) headers.set("Authorization", `Bearer ${this.options.apiKey}`);

    for (let attempt = 0; ; attempt += 1) {
      let response: Response;
      try {
        response = await this.fetchImplementation(url, {
          method: "GET",
          headers,
          signal: AbortSignal.timeout(this.timeoutMs),
        });
      } catch (error) {
        if (attempt >= this.maxRetries) throw error;
        await this.sleep(Math.min(1000 * 2 ** attempt, 30_000));
        continue;
      }

      if (!response.ok) {
        const apiError = new OpenAlexApiError(
          response.status,
          parseRetryAfter(response.headers.get("retry-after")),
        );
        if (!RETRYABLE_STATUSES.has(response.status) || attempt >= this.maxRetries) {
          throw apiError;
        }
        const delaySeconds = apiError.retryAfterSeconds ?? 2 ** attempt;
        await this.sleep(Math.min(delaySeconds * 1000, 30_000));
        continue;
      }

      const payload: unknown = await response.json();
      if (!isRecord(payload) || !Array.isArray(payload.results)) {
        throw new TypeError("Resposta OpenAlex inválida: esperada uma lista results.");
      }

      const meta = isRecord(payload.meta) ? payload.meta : {};
      const nextCursor = readString(meta.next_cursor);
      const resultCount =
        typeof meta.count === "number" && Number.isInteger(meta.count) && meta.count >= 0
          ? meta.count
          : null;

      return {
        results: payload.results
          .map(normalizeWork)
          .filter((candidate): candidate is OpenAlexWorkCandidate => candidate !== null),
        nextCursor,
        resultCount,
      };
    }
  }
}

import { createServerOnlyFn } from "@tanstack/react-start";
import { openAlexQuerySchema } from "../openalex-query.schema";
import type { OpenAlexClient, OpenAlexSearchOptions, OpenAlexWorksPage } from "./openalex-client";
import { mayAccessGkiFromOwnerEvidence } from "./gki-owner-access-contract";

const RESEARCH_RUN_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_REQUEST_KEYS = new Set(["researchRunId", "query", "perPage", "cursor"]);
const MAX_CURSOR_LENGTH = 2_048;

type JsonRecord = Record<string, unknown>;

export type ResearchLifecycleState = "draft" | "in_progress" | "completed";

/** Identity must be resolved from a trusted server session, never from request data. */
export interface AuthenticatedResearchActor {
  userId: string;
}

export type OpenAlexDiscoveryLeaseAcquisition =
  | { status: "acquired"; leaseId: string }
  | { status: "forbidden" }
  | { status: "not_found" }
  | { status: "not_in_progress" };

export interface OpenAlexDiscoveryDependencies {
  resolveAuthenticatedActor: () => Promise<AuthenticatedResearchActor | null>;
  /** Must use the existing server-side Factory owner process; caller/request data is not evidence. */
  resolveOwnerAccessEvidence: (actorId: string) => Promise<unknown>;
  /**
   * Must atomically validate access to this exact run and its `in_progress` state while creating
   * a lease. Finalization must not commit while any lease is active; leases need crash recovery.
   */
  acquireAuthorizedInProgressLease: (
    actorId: string,
    researchRunId: string,
  ) => Promise<OpenAlexDiscoveryLeaseAcquisition>;
  /** Release the active-search lease, including when the upstream call fails. */
  releaseDiscoveryLease: (leaseId: string) => Promise<void>;
  openAlexClient: Pick<OpenAlexClient, "searchWorks">;
}

export interface OpenAlexDiscoveryRequest {
  researchRunId: string;
  /** Short topic keywords only; never pass the full company brief or personal data. */
  query: string;
  perPage?: number;
  cursor?: string;
}

export type OpenAlexDiscoveryErrorCode =
  | "invalid_request"
  | "unauthenticated"
  | "forbidden"
  | "research_not_found"
  | "research_not_in_progress"
  | "lease_unavailable";

export class OpenAlexDiscoveryError extends Error {
  readonly code: OpenAlexDiscoveryErrorCode;

  constructor(code: OpenAlexDiscoveryErrorCode, message: string) {
    super(message);
    this.name = "OpenAlexDiscoveryError";
    this.code = code;
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function containsControlCharacters(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (
      codePoint !== undefined &&
      (codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f))
    ) {
      return true;
    }
  }
  return false;
}

function invalidRequest(message: string): never {
  throw new OpenAlexDiscoveryError("invalid_request", message);
}

function parseRequest(input: unknown): OpenAlexDiscoveryRequest {
  if (!isRecord(input)) return invalidRequest("A solicitação OpenAlex deve ser um objeto.");
  if (Object.keys(input).some((key) => !ALLOWED_REQUEST_KEYS.has(key))) {
    return invalidRequest("A solicitação contém campos não permitidos.");
  }

  const researchRunId = input["researchRunId"];
  if (typeof researchRunId !== "string" || !RESEARCH_RUN_ID.test(researchRunId)) {
    return invalidRequest("researchRunId deve ser um UUID canônico.");
  }

  const rawQuery = input["query"];
  if (typeof rawQuery !== "string") return invalidRequest("query deve ser uma string.");
  const parsedQuery = openAlexQuerySchema.safeParse(rawQuery);
  if (!parsedQuery.success) {
    return invalidRequest(parsedQuery.error.issues[0]?.message ?? "query inválida.");
  }
  const query = parsedQuery.data;
  if (containsControlCharacters(query)) return invalidRequest("query não pode conter controles.");

  const perPage = input["perPage"];
  if (
    perPage !== undefined &&
    (!Number.isInteger(perPage) || (perPage as number) < 1 || (perPage as number) > 100)
  ) {
    return invalidRequest("perPage deve ser um inteiro entre 1 e 100.");
  }

  const rawCursor = input["cursor"];
  let cursor: string | undefined;
  if (rawCursor !== undefined) {
    if (typeof rawCursor !== "string") return invalidRequest("cursor deve ser uma string.");
    cursor = rawCursor.trim();
    if (
      cursor.length === 0 ||
      Array.from(cursor).length > MAX_CURSOR_LENGTH ||
      containsControlCharacters(cursor)
    ) {
      return invalidRequest(
        `cursor deve conter de 1 a ${MAX_CURSOR_LENGTH} caracteres sem controles.`,
      );
    }
  }

  return {
    researchRunId,
    query,
    ...(perPage === undefined ? {} : { perPage: perPage as number }),
    ...(cursor === undefined ? {} : { cursor }),
  };
}

function leaseError(status: Exclude<OpenAlexDiscoveryLeaseAcquisition["status"], "acquired">) {
  switch (status) {
    case "forbidden":
      return new OpenAlexDiscoveryError("forbidden", "A pessoa não pode pesquisar nesta execução.");
    case "not_found":
      return new OpenAlexDiscoveryError(
        "research_not_found",
        "Execução de pesquisa não encontrada.",
      );
    case "not_in_progress":
      return new OpenAlexDiscoveryError(
        "research_not_in_progress",
        "A descoberta OpenAlex só pode ocorrer durante uma pesquisa em andamento.",
      );
  }
}

/**
 * Builds a server-only use case, not an HTTP/API route. Real adapters must resolve the session,
 * atomically authorize and lease the active run, and block completion until lease release.
 * Search returns unverified candidates only; this function never persists or curates them.
 */
export function createOpenAlexDiscoveryService(dependencies: OpenAlexDiscoveryDependencies) {
  return createServerOnlyFn(async (input: unknown): Promise<OpenAlexWorksPage> => {
    const request = parseRequest(input);
    const actor = await dependencies.resolveAuthenticatedActor();
    const actorId = actor?.userId.trim();

    if (!actorId) {
      throw new OpenAlexDiscoveryError("unauthenticated", "É necessária uma sessão autenticada.");
    }

    let ownerEvidence: unknown;
    try {
      ownerEvidence = await dependencies.resolveOwnerAccessEvidence(actorId);
    } catch {
      throw new OpenAlexDiscoveryError(
        "forbidden",
        "É necessário ser owner ativo da Factory para acessar o GKI.",
      );
    }
    if (!mayAccessGkiFromOwnerEvidence(ownerEvidence)) {
      throw new OpenAlexDiscoveryError(
        "forbidden",
        "É necessário ser owner ativo da Factory para acessar o GKI.",
      );
    }

    const acquisition = await dependencies.acquireAuthorizedInProgressLease(
      actorId,
      request.researchRunId,
    );
    if (acquisition.status !== "acquired") throw leaseError(acquisition.status);

    const leaseId = typeof acquisition.leaseId === "string" ? acquisition.leaseId.trim() : "";

    try {
      if (!leaseId) {
        throw new OpenAlexDiscoveryError(
          "lease_unavailable",
          "Não foi possível reservar a pesquisa.",
        );
      }
      const searchOptions: OpenAlexSearchOptions = {
        ...(request.perPage === undefined ? {} : { perPage: request.perPage }),
        ...(request.cursor === undefined ? {} : { cursor: request.cursor }),
      };
      return await dependencies.openAlexClient.searchWorks(request.query, searchOptions);
    } finally {
      await dependencies.releaseDiscoveryLease(leaseId);
    }
  });
}

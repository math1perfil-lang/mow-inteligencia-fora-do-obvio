import { createServerOnlyFn } from "@tanstack/react-start";
import { openAlexQuerySchema } from "../openalex-query.schema";
import { mayAccessGkiFromOwnerEvidence } from "./gki-owner-access-contract";
import type { ExternalSourceSearchPage } from "./external-source.schema";
import type {
  AuthenticatedResearchActor,
  OpenAlexDiscoveryLeaseAcquisition,
} from "./openalex-discovery-service";

const RESEARCH_RUN_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_REQUEST_KEYS = new Set(["researchRunId", "query", "perPage"]);

export interface ExternalSourceDiscoveryDependencies {
  resolveAuthenticatedActor: () => Promise<AuthenticatedResearchActor | null>;
  resolveOwnerAccessEvidence: (actorId: string) => Promise<unknown>;
  acquireAuthorizedInProgressLease: (
    actorId: string,
    researchRunId: string,
  ) => Promise<OpenAlexDiscoveryLeaseAcquisition>;
  releaseDiscoveryLease: (leaseId: string) => Promise<void>;
  sourceClient: {
    isConfigured: boolean;
    search: (query: string, perPage?: number) => Promise<ExternalSourceSearchPage>;
  };
}

export interface ExternalSourceDiscoveryRequest {
  researchRunId: string;
  query: string;
  perPage?: number;
}

export class ExternalSourceDiscoveryError extends Error {
  readonly code:
    | "invalid_request"
    | "unauthenticated"
    | "forbidden"
    | "research_not_found"
    | "research_not_in_progress"
    | "lease_unavailable";

  constructor(code: ExternalSourceDiscoveryError["code"], message: string) {
    super(message);
    this.name = "ExternalSourceDiscoveryError";
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRequest(input: unknown): ExternalSourceDiscoveryRequest {
  if (!isRecord(input) || Object.keys(input).some((key) => !ALLOWED_REQUEST_KEYS.has(key))) {
    throw new ExternalSourceDiscoveryError("invalid_request", "Solicitação inválida.");
  }
  const researchRunId = input["researchRunId"];
  if (typeof researchRunId !== "string" || !RESEARCH_RUN_ID.test(researchRunId)) {
    throw new ExternalSourceDiscoveryError("invalid_request", "Solicitação inválida.");
  }
  const parsedQuery = openAlexQuerySchema.safeParse(input["query"]);
  if (!parsedQuery.success) {
    throw new ExternalSourceDiscoveryError(
      "invalid_request",
      "Use somente termos temáticos curtos.",
    );
  }
  const perPage = input["perPage"];
  if (
    perPage !== undefined &&
    (!Number.isInteger(perPage) || (perPage as number) < 1 || (perPage as number) > 20)
  ) {
    throw new ExternalSourceDiscoveryError("invalid_request", "Solicitação inválida.");
  }
  return {
    researchRunId,
    query: parsedQuery.data,
    ...(perPage === undefined ? {} : { perPage: perPage as number }),
  };
}

function leaseError(status: Exclude<OpenAlexDiscoveryLeaseAcquisition["status"], "acquired">) {
  switch (status) {
    case "forbidden":
      return new ExternalSourceDiscoveryError(
        "forbidden",
        "A pessoa não pode pesquisar nesta execução.",
      );
    case "not_found":
      return new ExternalSourceDiscoveryError(
        "research_not_found",
        "Execução de pesquisa não encontrada.",
      );
    case "not_in_progress":
      return new ExternalSourceDiscoveryError(
        "research_not_in_progress",
        "A execução não está em andamento.",
      );
  }
}

export function createExternalSourceDiscoveryService(
  dependencies: ExternalSourceDiscoveryDependencies,
) {
  return createServerOnlyFn(async (input: unknown): Promise<ExternalSourceSearchPage> => {
    const request = parseRequest(input);
    const actor = await dependencies.resolveAuthenticatedActor();
    const actorId = actor?.userId.trim();
    if (!actorId) {
      throw new ExternalSourceDiscoveryError("unauthenticated", "Sessão autenticada obrigatória.");
    }

    let ownerEvidence: unknown;
    try {
      ownerEvidence = await dependencies.resolveOwnerAccessEvidence(actorId);
    } catch {
      throw new ExternalSourceDiscoveryError(
        "forbidden",
        "Acesso interno à Factory não autorizado.",
      );
    }
    if (!mayAccessGkiFromOwnerEvidence(ownerEvidence)) {
      throw new ExternalSourceDiscoveryError(
        "forbidden",
        "Acesso interno à Factory não autorizado.",
      );
    }

    if (!dependencies.sourceClient.isConfigured) {
      return { state: "not_configured", results: [], providers: [] };
    }

    const acquisition = await dependencies.acquireAuthorizedInProgressLease(
      actorId,
      request.researchRunId,
    );
    if (acquisition.status !== "acquired") throw leaseError(acquisition.status);
    const leaseId = acquisition.leaseId.trim();
    if (!leaseId) {
      throw new ExternalSourceDiscoveryError(
        "lease_unavailable",
        "Não foi possível reservar a execução.",
      );
    }

    try {
      return await dependencies.sourceClient.search(request.query, request.perPage);
    } finally {
      await dependencies.releaseDiscoveryLease(leaseId);
    }
  });
}

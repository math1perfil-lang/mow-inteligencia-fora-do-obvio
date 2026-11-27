import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database, Json } from "@/integrations/supabase/types";
import { getSupabase } from "@/lib/supabase";
import { z } from "zod";
import { toOpenAlexFailureToken } from "./openalex-error-messages";
import { toMethodDraftFailureToken } from "./method-draft-errors";
import { openAlexQuerySchema } from "./openalex-query.schema";
import {
  OpenAlexDiscoveryError,
  createOpenAlexDiscoveryService,
} from "./server/openalex-discovery-service";
import { OpenAlexClient } from "./server/openalex-client";
import { PROBLEM_DOMAINS } from "@/lib/method-factory/brief-schema";
import { importSourceCatalog, type FetchedText } from "./server/source-catalog-importer";
import { ConfiguredSourceSearchClient } from "./server/configured-source-search-client";
import { generateMethodDraft } from "./server/method-draft-service";
import { retrieveAuthorizedMethodEvidence } from "./server/method-draft-evidence-retrieval";
import {
  buildMethodDraftBriefFromReview,
  buildMethodDraftCatalogQueries,
  generateMethodDraftInputSchema,
} from "./server/method-draft-workflow";
import { sourceRightsReviewSnapshotSchema } from "./server/source-rights-policy";
import {
  recordedSourceRightsReviewSchema,
  sourceRightsReviewSubmissionSchema,
  sourceRightsSearchInputSchema,
  sourceRightsSearchRowsSchema,
  toRightsReviewRpcPayload,
} from "./server/source-rights-review-contract";
import {
  ExternalSourceDiscoveryError,
  createExternalSourceDiscoveryService,
} from "./server/external-source-discovery-service";
import { asGkiSupabaseClient } from "./server/gki-supabase-types";
import {
  openAlexResearchRunSummariesSchema,
  openAlexResearchRunSummarySchema,
  startOpenAlexResearchRunInputSchema,
  type OpenAlexResearchRunSummary,
} from "./research-run.schema";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
};
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type GkiRpc = ReturnType<typeof asGkiSupabaseClient>;
type AuthContext = { userId?: string; supabase?: unknown };
type VerifiedGkiContext = {
  gkiActorId?: string;
  gkiRpc?: GkiRpc;
  gkiRuns?: OpenAlexResearchRunSummary[];
};

function setPrivateNoStoreHeaders() {
  setResponseHeaders(new Headers(NO_STORE_HEADERS));
}

function getGkiRpc(value: unknown): GkiRpc {
  if (
    typeof value !== "object" ||
    value === null ||
    typeof (value as { rpc?: unknown }).rpc !== "function"
  ) {
    throw new Error("Sessão GKI indisponível.");
  }
  return asGkiSupabaseClient(value as SupabaseClient<Database>);
}

function getVerifiedContext(context: unknown): {
  actorId: string;
  rpc: GkiRpc;
  runs: OpenAlexResearchRunSummary[];
} {
  const record = context as VerifiedGkiContext;
  const actorId = record.gkiActorId?.trim();
  if (!actorId || !record.gkiRpc || !record.gkiRuns) throw new Error("Acesso GKI indisponível.");
  return { actorId, rpc: record.gkiRpc, runs: record.gkiRuns };
}

async function assertActiveGkiOwner(rpc: GkiRpc): Promise<OpenAlexResearchRunSummary[]> {
  // The owner-only RPC gates this request; run summaries remain server-only and never reach the UI.
  const { data, error } = await rpc.rpc("gki_list_openalex_research_runs", {});
  const parsed = openAlexResearchRunSummariesSchema.safeParse(data);
  if (error || !parsed.success) {
    throw new Error("O GKI está disponível somente para owner ativo da Factory.");
  }
  return parsed.data;
}

const forwardSupabaseSession = createMiddleware({ type: "function" }).client(async ({ next }) => {
  // Transporta o access token somente em Authorization; nunca o aceita em function data.
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw new Error("Não foi possível ler a sessão Supabase atual.");
  const token = data.session?.access_token;
  return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
});

const activeGkiOwnerMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next, context }) => {
    const authContext = context as unknown as AuthContext;
    const actorId = authContext.userId?.trim();
    if (!actorId) throw new Error("Sessão autenticada obrigatória.");

    const rpc = getGkiRpc(authContext.supabase);
    const runs = await assertActiveGkiOwner(rpc);
    return next({ context: { gkiActorId: actorId, gkiRpc: rpc, gkiRuns: runs } });
  },
);

const protectedGkiMiddleware = [
  forwardSupabaseSession,
  requireSupabaseAuth,
  activeGkiOwnerMiddleware,
] as const;

const noInputSchema = z.object({}).strict();
const searchOpenAlexSchema = z
  .object({
    researchRunId: z.string().uuid(),
    query: openAlexQuerySchema,
    confirmTopicOnly: z.literal(true),
    perPage: z.number().int().min(1).max(20).optional(),
  })
  .strict();
const briefIdInputSchema = z.object({ briefId: z.string().uuid() }).strict();

function recordOf(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

async function loadBriefReview(rpc: GkiRpc, briefId: string): Promise<Record<string, unknown>> {
  const { data, error } = await rpc.rpc("mow_factory_get_brief_review", {
    p_brief_id: briefId,
  });
  const record = recordOf(Array.isArray(data) ? data[0] : data);
  if (error || !record) throw new Error("BRIEF_UNAVAILABLE");
  return record;
}

export const verifyOpenAlexOwner = createServerFn({ method: "POST" })
  .middleware(protectedGkiMiddleware)
  .validator((input: unknown) => noInputSchema.parse(input))
  .handler(async () => {
    setPrivateNoStoreHeaders();
    return { activeOwner: true as const };
  });

export const getMethodDraftBriefOptions = createServerFn({ method: "POST" })
  .middleware(protectedGkiMiddleware)
  .validator((input: unknown) => briefIdInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    setPrivateNoStoreHeaders();
    const { rpc } = getVerifiedContext(context);
    const review = await loadBriefReview(rpc, data.briefId);
    if (review["status"] !== "in_review") throw new Error("BRIEF_NOT_IN_REVIEW");
    const payload = recordOf(review["payload"]);
    const pains = Array.isArray(review["pains"]) ? review["pains"] : [];
    if (!payload || pains.length > 20) throw new Error("BRIEF_UNAVAILABLE");
    return {
      businessType: typeof payload["businessType"] === "string" ? payload["businessType"] : "",
      pains: pains.flatMap((value, index) => {
        const pain = recordOf(value);
        if (!pain || typeof pain["title"] !== "string") return [];
        return [
          {
            index,
            title: pain["title"],
            domain: typeof pain["domain"] === "string" ? pain["domain"] : "",
            urgency: typeof pain["urgency"] === "string" ? pain["urgency"] : "",
          },
        ];
      }),
    };
  });

// Candidate RPCs remain unusable until their reviewed SQL migration is authorized and applied.
// These actions are owner-only; neither caller-supplied reviewer identity nor timestamps are accepted.
export const searchSourceRightsForReview = createServerFn({ method: "POST" })
  .middleware(protectedGkiMiddleware)
  .validator((input: unknown) => sourceRightsSearchInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    setPrivateNoStoreHeaders();
    const { rpc } = getVerifiedContext(context);
    const { data: rows, error } = await rpc.rpc("gki_search_source_rights_reviews_v1", {
      p_search: data.query,
      p_limit: 25,
    });
    const parsed = sourceRightsSearchRowsSchema.safeParse(rows);
    if (error || !parsed.success) {
      throw new Error("A fila privada de revisão de direitos ainda não está disponível.");
    }
    return parsed.data;
  });

export const recordSourceRightsReview = createServerFn({ method: "POST" })
  .middleware(protectedGkiMiddleware)
  .validator((input: unknown) => sourceRightsReviewSubmissionSchema.parse(input))
  .handler(async ({ data, context }) => {
    setPrivateNoStoreHeaders();
    const { rpc } = getVerifiedContext(context);
    const { data: rows, error } = await rpc.rpc("gki_record_source_rights_review_v1", {
      p_source_id: data.sourceId,
      p_review_input: toRightsReviewRpcPayload(data),
    });
    const parsed = recordedSourceRightsReviewSchema.safeParse(Array.isArray(rows) ? rows[0] : null);
    if (error || !parsed.success) {
      throw new Error(
        "A revisão não foi registrada. Verifique os campos e a configuração interna.",
      );
    }
    return parsed.data;
  });

export const startOpenAlexResearchRun = createServerFn({ method: "POST" })
  .middleware(protectedGkiMiddleware)
  .validator((input: unknown) => startOpenAlexResearchRunInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    setPrivateNoStoreHeaders();
    const { rpc } = getVerifiedContext(context);
    const { data: rows, error } = await rpc.rpc("gki_start_openalex_research_run", {
      p_source_brief_id: data.sourceBriefId,
      p_question: data.question,
      p_scope: "",
    });

    const row = Array.isArray(rows) ? rows[0] : null;
    const parsed = openAlexResearchRunSummarySchema.safeParse(row);
    if (error || !parsed.success) {
      throw new Error(
        "Não foi possível iniciar a pesquisa. O briefing precisa existir e estar em revisão interna.",
      );
    }
    return parsed.data;
  });

export const searchConfiguredSourcesForRun = createServerFn({ method: "POST" })
  .middleware(protectedGkiMiddleware)
  .validator((input: unknown) => searchOpenAlexSchema.parse(input))
  .handler(async ({ data, context }) => {
    setPrivateNoStoreHeaders();
    const { actorId, rpc, runs } = getVerifiedContext(context);
    const boundRun = runs.find((run) => run.id === data.researchRunId);
    if (!boundRun || boundRun.question !== data.query) {
      throw new Error("A busca deve corresponder aos termos curtos registrados na execução GKI.");
    }

    let sourceClient: ConfiguredSourceSearchClient;
    try {
      sourceClient = new ConfiguredSourceSearchClient({
        configuration: process.env["MOW_GKI_RESEARCH_PROVIDERS_JSON"] ?? "",
      });
    } catch {
      throw new Error("A configuração privada das fontes externas está inválida no servidor.");
    }

    const service = createExternalSourceDiscoveryService({
      resolveAuthenticatedActor: async () => ({ userId: actorId }),
      resolveOwnerAccessEvidence: async (candidateActorId) =>
        candidateActorId === actorId ? "verified_active_owner" : "unverified",
      acquireAuthorizedInProgressLease: async (candidateActorId, researchRunId) => {
        if (candidateActorId !== actorId) return { status: "forbidden" as const };
        const { data: leaseId, error } = await rpc.rpc("gki_acquire_openalex_discovery_lease", {
          p_research_run_id: researchRunId,
        });
        if (error) {
          if (error.code === "42501") return { status: "forbidden" as const };
          if (error.code === "P0002") return { status: "not_found" as const };
          if (error.code === "55000") return { status: "not_in_progress" as const };
          throw new ExternalSourceDiscoveryError(
            "lease_unavailable",
            "Não foi possível reservar esta execução para a consulta.",
          );
        }
        if (typeof leaseId !== "string" || !UUID_PATTERN.test(leaseId)) {
          throw new ExternalSourceDiscoveryError(
            "lease_unavailable",
            "A reserva da execução retornou um identificador inválido.",
          );
        }
        return { status: "acquired" as const, leaseId };
      },
      releaseDiscoveryLease: async (leaseId) => {
        const { data: released, error } = await rpc.rpc("gki_release_openalex_discovery_lease", {
          p_lease_token: leaseId,
        });
        if (error || released !== true) {
          throw new ExternalSourceDiscoveryError(
            "lease_unavailable",
            "Não foi possível liberar a reserva GKI.",
          );
        }
      },
      sourceClient,
    });

    try {
      return await service({
        researchRunId: data.researchRunId,
        query: data.query,
        ...(data.perPage === undefined ? {} : { perPage: data.perPage }),
      });
    } catch {
      throw new Error("Não foi possível consultar as fontes externas autorizadas.");
    }
  });

export const searchOpenAlexForRun = createServerFn({ method: "POST" })
  .middleware(protectedGkiMiddleware)
  .validator((input: unknown) => searchOpenAlexSchema.parse(input))
  .handler(async ({ data, context }) => {
    setPrivateNoStoreHeaders();
    const { actorId, rpc, runs } = getVerifiedContext(context);
    const apiKey = process.env["OPENALEX_API_KEY"]?.trim();
    if (!apiKey) {
      throw new Error(toOpenAlexFailureToken({ code: "provider_not_configured" }));
    }
    const boundRun = runs.find((run) => run.id === data.researchRunId);
    if (!boundRun || boundRun.question !== data.query) {
      throw new Error("A busca deve corresponder aos termos curtos registrados na execução GKI.");
    }

    const service = createOpenAlexDiscoveryService({
      resolveAuthenticatedActor: async () => ({ userId: actorId }),
      // Derived only from the successful server-side active-owner RPC in this request's middleware.
      resolveOwnerAccessEvidence: async (candidateActorId) =>
        candidateActorId === actorId ? "verified_active_owner" : "unverified",
      acquireAuthorizedInProgressLease: async (candidateActorId, researchRunId) => {
        if (candidateActorId !== actorId) return { status: "forbidden" as const };
        const { data: leaseId, error } = await rpc.rpc("gki_acquire_openalex_discovery_lease", {
          p_research_run_id: researchRunId,
        });
        if (error) {
          if (error.code === "42501") return { status: "forbidden" as const };
          if (error.code === "P0002") return { status: "not_found" as const };
          if (error.code === "55000") return { status: "not_in_progress" as const };
          throw new OpenAlexDiscoveryError(
            "lease_unavailable",
            "Não foi possível reservar esta pesquisa para a consulta.",
          );
        }
        if (typeof leaseId !== "string" || !UUID_PATTERN.test(leaseId)) {
          throw new OpenAlexDiscoveryError(
            "lease_unavailable",
            "A reserva da pesquisa retornou um identificador inválido.",
          );
        }
        return { status: "acquired" as const, leaseId };
      },
      releaseDiscoveryLease: async (leaseId) => {
        const { data: released, error } = await rpc.rpc("gki_release_openalex_discovery_lease", {
          p_lease_token: leaseId,
        });
        if (error || released !== true) {
          throw new OpenAlexDiscoveryError(
            "lease_unavailable",
            "Não foi possível liberar a reserva GKI.",
          );
        }
      },
      openAlexClient: new OpenAlexClient({ apiKey }),
    });

    try {
      return await service({
        researchRunId: data.researchRunId,
        query: data.query,
        ...(data.perPage === undefined ? {} : { perPage: data.perPage }),
      });
    } catch (error) {
      throw new Error(toOpenAlexFailureToken(error));
    }
  });

export const generateMethodDraftForBrief = createServerFn({ method: "POST" })
  .middleware(protectedGkiMiddleware)
  .validator((input: unknown) => generateMethodDraftInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    setPrivateNoStoreHeaders();
    const { actorId, rpc } = getVerifiedContext(context);
    void actorId;
    try {
      const briefValue = await loadBriefReview(rpc, data.briefId);
      const brief = buildMethodDraftBriefFromReview(briefValue, data.painIndex);
      const catalogQueries = buildMethodDraftCatalogQueries(briefValue, data.painIndex);
      const catalogResults = await Promise.all(
        catalogQueries.map((query) =>
          rpc.rpc("gki_search_source_rights_reviews_v1", { p_search: query, p_limit: 50 }),
        ),
      );
      if (catalogResults.some(({ error, data: rows }) => error || !Array.isArray(rows))) {
        throw new Error("METHOD_DRAFT_CATALOG_UNAVAILABLE");
      }
      const catalogRows = new Map<string, unknown>();
      for (const { data: rows } of catalogResults) {
        for (const row of rows as unknown[]) {
          const record = recordOf(row);
          const sourceId = record?.["source_id"];
          if (typeof sourceId === "string" && !catalogRows.has(sourceId)) {
            catalogRows.set(sourceId, row);
          }
        }
      }
      const retrieval = await retrieveAuthorizedMethodEvidence(
        [...catalogRows.values()].slice(0, 50),
      );
      if (retrieval.evidence.length === 0) throw new Error("METHOD_DRAFT_NO_AUTHORIZED_TEXT");
      const evidence = await Promise.all(
        retrieval.evidence.map(async (item) => {
          const { data: latestRows, error } = await rpc.rpc("gki_search_source_rights_reviews_v1", {
            p_search: item.title.slice(0, 100),
            p_limit: 50,
          });
          if (error || !Array.isArray(latestRows))
            throw new Error("METHOD_DRAFT_RIGHTS_RECHECK_FAILED");
          const matches = latestRows.filter((row) => {
            const record = recordOf(row);
            return (
              record?.["source_id"] === item.sourceId &&
              record["title"] === item.title &&
              record["canonical_url"] === item.url
            );
          });
          if (matches.length !== 1) throw new Error("METHOD_DRAFT_SOURCE_CHANGED");
          const current = recordOf(matches[0]);
          if (!current) throw new Error("METHOD_DRAFT_RIGHTS_RECHECK_FAILED");
          const rightsReview = sourceRightsReviewSnapshotSchema.parse({
            status: current["decision_status"],
            permittedUses: current["permitted_uses"],
            restrictions:
              typeof current["restrictions"] === "string" && current["restrictions"].trim()
                ? [current["restrictions"]]
                : [],
            restrictionsReviewed: current["restrictions_reviewed"],
            restrictionsSatisfied: current["restrictions_satisfied"],
            evidenceUrl: current["rights_evidence_url"],
            reviewerId: current["reviewed_by"],
            reviewedAt: current["reviewed_at"],
            validUntil: current["valid_until"],
          });
          return { ...item, rightsReview };
        }),
      );

      const generated = await generateMethodDraft(brief, evidence);
      const evidenceManifest = evidence.map(
        ({ content: _content, rightsReview: _rightsReview, ...item }) => item,
      );
      const { data: savedValue, error: saveError } = await rpc.rpc("gki_record_method_draft_v1", {
        p_brief_id: data.briefId,
        p_draft: generated.draft,
        p_evidence_manifest: evidenceManifest,
        p_model_id: generated.modelId,
        p_prompt_version: generated.promptVersion,
      });

      const savedRecord = Array.isArray(savedValue) ? savedValue[0] : savedValue;
      const savedId =
        typeof savedRecord === "object" && savedRecord !== null && "draft_id" in savedRecord
          ? (savedRecord as { draft_id?: unknown }).draft_id
          : null;
      const persistenceUnavailable = saveError?.code === "PGRST202" || saveError?.code === "42883";
      const persistenceFailed = Boolean(saveError && !persistenceUnavailable);

      return {
        draft: generated.draft,
        modelId: generated.modelId,
        promptVersion: generated.promptVersion,
        evidence: evidence.map(
          ({ content: _content, rightsReview: _rightsReview, ...item }) => item,
        ),
        evidenceStats: {
          found: evidence.length,
          eligible: retrieval.eligibleSources,
          unreadable: retrieval.unreadableSources,
        },
        persisted: typeof savedId === "string" && UUID_PATTERN.test(savedId),
        draftId: typeof savedId === "string" && UUID_PATTERN.test(savedId) ? savedId : null,
        persistenceUnavailable,
        persistenceFailed,
      };
    } catch (error) {
      throw new Error(toMethodDraftFailureToken(error));
    }
  });

const importSourceCatalogSchema = z
  .object({
    domain: z.enum(PROBLEM_DOMAINS),
    queries: z.array(openAlexQuerySchema).min(1).max(10),
    perQuery: z.number().int().min(1).max(25).default(10),
    fullText: z.boolean().default(false),
  })
  .strict();

async function downloadPublicText(url: string): Promise<FetchedText | null> {
  try {
    const response = await fetch(url, {
      headers: { Accept: "text/html,text/plain;q=0.9" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return null;
    const declared = Number(response.headers.get("content-length") ?? 0);
    const contentType = response.headers.get("content-type") ?? "";
    if (declared > 5_000_000) {
      return { contentType, body: "", byteLength: declared, finalUrl: response.url || url };
    }
    const body = await response.text();
    return { contentType, body, byteLength: body.length, finalUrl: response.url || url };
  } catch {
    return null;
  }
}

/** Importa obras da OpenAlex para o acervo de fontes (somente owner ativo). */
export const importSourceCatalogForDomain = createServerFn({ method: "POST" })
  .middleware(protectedGkiMiddleware)
  .validator((input: unknown) => importSourceCatalogSchema.parse(input))
  .handler(async ({ data, context }) => {
    setPrivateNoStoreHeaders();
    const { rpc } = getVerifiedContext(context);
    const apiKey = process.env["OPENALEX_API_KEY"]?.trim();
    const client = new OpenAlexClient(apiKey ? { apiKey } : {});
    return importSourceCatalog(
      {
        searchWorks: (query, options) => client.searchWorks(query, { perPage: options.perPage }),
        upsertSources: async (domain, items) => {
          const { data: rows, error } = await rpc.rpc("gki_upsert_sources_v1", {
            p_domain: domain,
            p_items: items as unknown as Json,
          });
          if (error || !Array.isArray(rows)) throw new Error("CATALOG_UPSERT_FAILED");
          return rows.map((row) => ({
            sourceId: row.out_source_id,
            recordId: row.out_record_id,
            inserted: row.out_inserted,
          }));
        },
        fetchText: downloadPublicText,
        storeText: async (input) => {
          const { error } = await rpc.rpc("gki_store_source_text_v1", {
            p_source_id: input.sourceId,
            p_text: input.text,
            p_format: input.format,
            p_license: input.license,
            p_origin_url: input.originUrl,
          });
          if (error) throw new Error("CATALOG_TEXT_FAILED");
        },
      },
      data,
    );
  });

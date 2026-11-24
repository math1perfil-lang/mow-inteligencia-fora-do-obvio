import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { getSupabase } from "@/lib/supabase";
import { z } from "zod";
import { toOpenAlexFailureToken } from "./openalex-error-messages";
import { openAlexQuerySchema } from "./openalex-query.schema";
import {
  OpenAlexDiscoveryError,
  createOpenAlexDiscoveryService,
} from "./server/openalex-discovery-service";
import { OpenAlexClient } from "./server/openalex-client";
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

export const verifyOpenAlexOwner = createServerFn({ method: "POST" })
  .middleware(protectedGkiMiddleware)
  .validator((input: unknown) => noInputSchema.parse(input))
  .handler(async () => {
    setPrivateNoStoreHeaders();
    return { activeOwner: true as const };
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

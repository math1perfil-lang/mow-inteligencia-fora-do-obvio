import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getSupabase } from "@/lib/supabase";
import {
  clientSolutionProgressInputSchema,
  clientSolutionSnapshotSchema,
  type ClientSolutionSnapshot,
} from "./client-solution-contract";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
};
const UUID = z.string().uuid();
const TOKEN = /^[a-f0-9]{64}$/;
const EMPTY_INPUT = z.object({}).strict();
const PUBLISH_INPUT = z
  .object({
    briefId: UUID,
    draftId: UUID,
    snapshot: clientSolutionSnapshotSchema,
    inviteeEmail: z.string().trim().email().max(320),
    expiresInDays: z.number().int().min(1).max(30),
  })
  .strict();
const ACCEPT_INPUT = z.object({ token: z.string().max(128) }).strict();
const PROGRESS_INPUT = clientSolutionProgressInputSchema;
const RELEASE_PROGRESS_INPUT = z.object({ releaseId: UUID }).strict();

interface RpcResult {
  data: unknown;
  error: { code?: string; message?: string } | null;
}
interface RpcClient {
  rpc(name: string, args?: Record<string, unknown>): PromiseLike<RpcResult>;
}
interface AuthContext {
  userId?: string;
  supabase?: unknown;
}
interface ActorContext {
  actorId: string;
  rpc: RpcClient;
}

export type ClientSolutionRecord = {
  releaseId: string;
  version: number;
  snapshot: ClientSolutionSnapshot;
  releasedAt: string;
};
export type ClientSolutionProgressRecord = {
  stepId: string;
  status: "not_started" | "in_progress" | "blocked" | "completed";
  note: string;
  updatedAt: string;
};

function setNoStore() {
  setResponseHeaders(new Headers(NO_STORE_HEADERS));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function newInviteToken(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function browserSessionMiddleware() {
  return createMiddleware({ type: "function" }).client(async ({ next }) => {
    if (typeof window === "undefined") return next();
    try {
      const { data } = await getSupabase().auth.getSession();
      const token = data.session?.access_token;
      if (token) return next({ headers: { Authorization: `Bearer ${token}` } });
    } catch {
      // The server authentication middleware rejects missing or invalid sessions.
    }
    return next();
  });
}

const authenticatedActorMiddleware = createMiddleware({ type: "function" })
  .middleware([browserSessionMiddleware(), requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const auth = context as unknown as AuthContext;
    const rpc = auth.supabase as RpcClient | undefined;
    if (!auth.userId || !rpc || typeof rpc.rpc !== "function") throw new Error("Unauthorized");
    return next({ context: { clientActorId: auth.userId, clientRpc: rpc } });
  });

const ownerMiddleware = createMiddleware({ type: "function" })
  .middleware([authenticatedActorMiddleware])
  .server(async ({ next, context }) => {
    const actor = context as unknown as ActorContext;
    // Use the existing authenticated owner-only RPC: the internal schema predicate is not
    // exposed through the public PostgREST facade and its argument name is not assumed here.
    const { data, error } = await actor.rpc.rpc("gki_list_openalex_research_runs", {});
    if (error || !Array.isArray(data)) throw new Error("Unauthorized");
    return next();
  });

function getActor(context: unknown): ActorContext {
  const value = context as { clientActorId?: unknown; clientRpc?: unknown };
  if (
    typeof value.clientActorId !== "string" ||
    typeof value.clientRpc !== "object" ||
    value.clientRpc === null ||
    typeof (value.clientRpc as { rpc?: unknown }).rpc !== "function"
  ) {
    throw new Error("Unauthorized");
  }
  return { actorId: value.clientActorId, rpc: value.clientRpc as RpcClient };
}

function assertNoRpcError(result: RpcResult, code: string) {
  if (result.error) throw new Error(code);
}

export const createClientSolutionRelease = createServerFn({ method: "POST" })
  .middleware([ownerMiddleware])
  .validator((input: unknown) => PUBLISH_INPUT.parse(input))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ releaseId: string; invitePath: string; version: number }> => {
      setNoStore();
      const { rpc } = getActor(context);
      const token = newInviteToken();
      const tokenHash = await sha256Hex(token);
      const expiresAt = new Date(
        Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000,
      ).toISOString();
      const result = await rpc.rpc("mow_factory_publish_client_solution_v1", {
        p_brief_id: data.briefId,
        p_draft_id: data.draftId,
        p_snapshot: data.snapshot,
        p_invitee_email: data.inviteeEmail.trim().toLowerCase(),
        p_token_hash: tokenHash,
        p_expires_at: expiresAt,
      });
      assertNoRpcError(result, "CLIENT_SOLUTION_RELEASE_FAILED");
      const row = asRecord(asArray(result.data)[0] ?? result.data);
      const releaseId = row?.["release_id"];
      const version = row?.["release_version"];
      if (
        typeof releaseId !== "string" ||
        !UUID.safeParse(releaseId).success ||
        typeof version !== "number"
      ) {
        throw new Error("CLIENT_SOLUTION_RELEASE_FAILED");
      }
      // The raw secret is returned only once, to the authenticated owner that created the invitation.
      return { releaseId, invitePath: `/method-factory/solution#${token}`, version };
    },
  );

export const acceptClientSolutionInvite = createServerFn({ method: "POST" })
  .middleware([authenticatedActorMiddleware])
  .validator((input: unknown) => ACCEPT_INPUT.parse(input))
  .handler(async ({ data, context }): Promise<{ accepted: boolean }> => {
    setNoStore();
    if (!TOKEN.test(data.token)) return { accepted: false };
    const { rpc } = getActor(context);
    const result = await rpc.rpc("mow_factory_accept_client_solution_invite_v1", {
      p_token_hash: await sha256Hex(data.token),
    });
    return { accepted: !result.error && result.data === true };
  });

export const listClientSolutions = createServerFn({ method: "GET" })
  .middleware([authenticatedActorMiddleware])
  .validator((input: unknown) => EMPTY_INPUT.parse(input))
  .handler(async ({ context }): Promise<ClientSolutionRecord[]> => {
    setNoStore();
    const { rpc } = getActor(context);
    const result = await rpc.rpc("mow_factory_list_client_solutions_v1");
    assertNoRpcError(result, "CLIENT_SOLUTION_LIST_FAILED");
    return asArray(result.data).map((value) => {
      const row = asRecord(value);
      const releaseId = row?.["release_id"];
      const version = row?.["release_version"];
      const releasedAt = row?.["released_at"];
      if (
        typeof releaseId !== "string" ||
        !UUID.safeParse(releaseId).success ||
        typeof version !== "number" ||
        typeof releasedAt !== "string"
      )
        throw new Error("CLIENT_SOLUTION_LIST_FAILED");
      return {
        releaseId,
        version,
        snapshot: clientSolutionSnapshotSchema.parse(row?.["snapshot"]),
        releasedAt,
      };
    });
  });

export const listClientSolutionProgress = createServerFn({ method: "GET" })
  .middleware([authenticatedActorMiddleware])
  .validator((input: unknown) => RELEASE_PROGRESS_INPUT.parse(input))
  .handler(async ({ data, context }): Promise<ClientSolutionProgressRecord[]> => {
    setNoStore();
    const { rpc } = getActor(context);
    const result = await rpc.rpc("mow_factory_list_client_solution_progress_v1", {
      p_release_id: data.releaseId,
    });
    assertNoRpcError(result, "CLIENT_SOLUTION_PROGRESS_FAILED");
    return asArray(result.data).map((value) => {
      const row = asRecord(value);
      const status = row?.["status"];
      if (
        typeof row?.["step_id"] !== "string" ||
        !["not_started", "in_progress", "blocked", "completed"].includes(String(status)) ||
        typeof row?.["note"] !== "string" ||
        typeof row?.["updated_at"] !== "string"
      )
        throw new Error("CLIENT_SOLUTION_PROGRESS_FAILED");
      return {
        stepId: row["step_id"] as string,
        status: status as ClientSolutionProgressRecord["status"],
        note: row["note"] as string,
        updatedAt: row["updated_at"] as string,
      };
    });
  });

export const updateClientSolutionProgress = createServerFn({ method: "POST" })
  .middleware([authenticatedActorMiddleware])
  .validator((input: unknown) => PROGRESS_INPUT.parse(input))
  .handler(async ({ data, context }): Promise<{ updated: boolean }> => {
    setNoStore();
    const { rpc } = getActor(context);
    const result = await rpc.rpc("mow_factory_update_client_solution_progress_v1", {
      p_release_id: data.releaseId,
      p_step_id: data.stepId,
      p_status: data.status,
      p_note: data.note,
    });
    return { updated: !result.error && result.data === true };
  });

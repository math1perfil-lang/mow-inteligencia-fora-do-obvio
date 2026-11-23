import { createClient } from "@supabase/supabase-js";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getSupabase } from "@/lib/supabase";
import { executeMethodApprovalIfReady } from "@/lib/method-factory/approval-gate";
import {
  BRIEF_STEPS,
  parseProblemEntries,
  pickVisibleValues,
  validateBrief,
  type ProblemEntry,
  type Values,
} from "@/lib/method-factory/brief-schema";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
};
const TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RECEIPT_PATTERN = /^[A-F0-9]{10}$/;
const TOKEN_INPUT = z.object({ token: z.string().max(128) }).strict();
const INVITE_INPUT = z
  .object({
    name: z.string().trim().min(1).max(200),
    industry: z.string().trim().max(200).default(""),
    relationshipType: z.enum(["internal", "related_company", "external_pilot", "client"]),
    expiresInDays: z.number().int().min(1).max(30),
  })
  .strict();
const SUBMISSION_INPUT = z
  .object({
    token: z.string().max(128),
    values: z
      .record(z.string(), z.string().max(50_000))
      .refine(
        (values) => Object.keys(values).length <= 40 && JSON.stringify(values).length <= 55_000,
      ),
    confirmInternalUse: z.boolean(),
  })
  .strict();
const UUID_INPUT = z.object({ id: z.string().uuid() }).strict();
const APPROVAL_INPUT = z.object({ methodVersionId: z.string().uuid() }).strict();
const REVIEW_INPUT = z
  .object({
    briefId: z.string().uuid(),
    status: z.enum(["in_review", "needs_clarification", "archived"]),
  })
  .strict();

interface DbError {
  message?: string;
  code?: string;
}

interface DbResult {
  data: unknown;
  error: DbError | null;
}

interface RpcClient {
  rpc(functionName: string, args?: Record<string, unknown>): PromiseLike<DbResult>;
}

interface OperatorContext {
  factoryOperatorId: string;
  factoryRpc: RpcClient;
}

interface AuthMiddlewareContext {
  userId?: string;
  supabase?: unknown;
}

let anonymousRpcClient: RpcClient | null = null;

function setNoStoreHeaders() {
  setResponseHeaders(new Headers(NO_STORE_HEADERS));
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));

    // Publishable keys are API keys, not user JWTs. The gateway receives them via apikey.
    if (
      (supabaseKey.startsWith("sb_publishable_") || supabaseKey.startsWith("sb_secret_")) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function getAnonymousRpcClient(): RpcClient {
  if (anonymousRpcClient) return anonymousRpcClient;
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Factory public Supabase client unavailable");

  const client = createClient(url, key, {
    global: { fetch: createSupabaseFetch(key) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  anonymousRpcClient = client as unknown as RpcClient;
  return anonymousRpcClient;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => asRecord(item) !== null);
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

function toJsonValue(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) return value.map(toJsonValue);
  const record = asRecord(value);
  if (!record) return null;
  return Object.fromEntries(Object.entries(record).map(([key, item]) => [key, toJsonValue(item)]));
}

function toJsonObject(value: unknown): JsonObject {
  const converted = toJsonValue(value);
  return typeof converted === "object" && converted !== null && !Array.isArray(converted)
    ? converted
    : {};
}

function resultError(result: DbResult): boolean {
  return result.error !== null;
}

async function callRpc(
  client: RpcClient,
  functionName: string,
  args?: Record<string, unknown>,
): Promise<DbResult> {
  return (await client.rpc(functionName, args)) as DbResult;
}

function getOperatorRpc(context: unknown): RpcClient {
  const factoryRpc = asRecord(context)?.["factoryRpc"];
  if (
    typeof factoryRpc !== "object" ||
    factoryRpc === null ||
    typeof (factoryRpc as { rpc?: unknown }).rpc !== "function"
  ) {
    throw new Error("Unauthorized");
  }
  return factoryRpc as RpcClient;
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

function normalizeBriefValues(input: Record<string, string>): Values | null {
  const allFields = BRIEF_STEPS.flatMap((step) => step.fields);
  const allowed = new Set(allFields.map((field) => field.id));
  if (
    Object.keys(input).length > allFields.length ||
    Object.keys(input).some((key) => !allowed.has(key))
  ) {
    return null;
  }
  return Object.fromEntries(
    Object.entries(pickVisibleValues(input)).map(([fieldId, value]) => [fieldId, value.trim()]),
  );
}

function browserAuthHeadersMiddleware() {
  return createMiddleware({ type: "function" }).client(async ({ next }) => {
    if (typeof window === "undefined") return next();
    try {
      const { data } = await getSupabase().auth.getSession();
      const token = data.session?.access_token;
      if (token) return next({ headers: { Authorization: `Bearer ${token}` } });
    } catch {
      // The server-side middleware rejects requests without a valid Supabase session.
    }
    return next();
  });
}

const operatorMiddleware = createMiddleware({ type: "function" })
  .middleware([browserAuthHeadersMiddleware(), requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const authContext = context as unknown as AuthMiddlewareContext;
    const userId = authContext.userId;
    const supabase = authContext.supabase as RpcClient | undefined;
    if (!userId || !supabase || typeof (supabase as { rpc?: unknown }).rpc !== "function") {
      throw new Error("Unauthorized");
    }

    const result = await callRpc(supabase, "mow_factory_is_active_operator");
    if (result.error || result.data !== true) throw new Error("Unauthorized");
    return next({ context: { factoryOperatorId: userId, factoryRpc: supabase } });
  });

export interface InviteCreationResult {
  id: string;
  path: string;
  expiresAt: string;
}

export const createFactoryInvite = createServerFn({ method: "POST" })
  .middleware([operatorMiddleware])
  .validator(INVITE_INPUT)
  .handler(async ({ data, context }): Promise<InviteCreationResult> => {
    setNoStoreHeaders();
    const token = newInviteToken();
    const tokenHash = await sha256Hex(token);
    const expiresAt = new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000).toISOString();
    const result = await callRpc(getOperatorRpc(context), "mow_factory_create_invite", {
      p_name: data.name,
      p_industry: data.industry,
      p_relationship_type: data.relationshipType,
      p_token_hash: tokenHash,
      p_expires_at: expiresAt,
    });
    if (resultError(result) || typeof result.data !== "string" || !UUID_PATTERN.test(result.data)) {
      throw new Error("Invite creation failed");
    }
    return { id: result.data, path: `/method-factory/intake#${token}`, expiresAt };
  });

export const revokeFactoryInvite = createServerFn({ method: "POST" })
  .middleware([operatorMiddleware])
  .validator(UUID_INPUT)
  .handler(async ({ data, context }): Promise<{ revoked: boolean }> => {
    setNoStoreHeaders();
    const result = await callRpc(getOperatorRpc(context), "mow_factory_revoke_invite", {
      p_invite_id: data.id,
    });
    return { revoked: !resultError(result) && result.data === true };
  });

export const checkFactoryInvite = createServerFn({ method: "POST" })
  .validator(TOKEN_INPUT)
  .handler(async ({ data }): Promise<{ valid: boolean }> => {
    setNoStoreHeaders();
    if (!TOKEN_PATTERN.test(data.token)) return { valid: false };
    try {
      const result = await callRpc(getAnonymousRpcClient(), "mow_factory_check_invite", {
        p_token_hash: await sha256Hex(data.token),
      });
      return { valid: !resultError(result) && result.data === true };
    } catch {
      return { valid: false };
    }
  });

export interface BriefSubmissionResult {
  ok: boolean;
  receiptCode?: string;
  error?: "invalid_or_expired_invite" | "invalid_brief" | "temporarily_unavailable";
}

export const submitFactoryBrief = createServerFn({ method: "POST" })
  .validator(SUBMISSION_INPUT)
  .handler(async ({ data }): Promise<BriefSubmissionResult> => {
    setNoStoreHeaders();
    if (!data.confirmInternalUse || !TOKEN_PATTERN.test(data.token)) {
      return { ok: false, error: "invalid_or_expired_invite" };
    }
    const values = normalizeBriefValues(data.values);
    if (!values || Object.keys(validateBrief(values)).length > 0) {
      return { ok: false, error: "invalid_brief" };
    }
    const pains = parseProblemEntries(values["pains"]);
    if (pains.length < 1 || pains.length > 20) return { ok: false, error: "invalid_brief" };

    const payloadValues = Object.fromEntries(
      Object.entries(values).filter(([key]) => key !== "pains"),
    );
    const payload = {
      ...payloadValues,
      acknowledgements: { internalUseConfirmed: true },
    };
    try {
      const result = await callRpc(getAnonymousRpcClient(), "mow_factory_submit_invited_brief", {
        p_token_hash: await sha256Hex(data.token),
        p_payload: payload,
        p_pains: pains.map((pain) => ({
          title: pain.title.trim(),
          domain: pain.domain,
          urgency: pain.urgency,
          description: pain.description.trim(),
          impact: pain.impact.trim(),
        })),
      });
      if (resultError(result)) return { ok: false, error: "temporarily_unavailable" };
      const response = asRecord(result.data);
      const receiptCode = response?.["receipt_code"];
      if (
        response?.["ok"] !== true ||
        typeof receiptCode !== "string" ||
        !RECEIPT_PATTERN.test(receiptCode)
      ) {
        return { ok: false, error: "invalid_or_expired_invite" };
      }
      // Intake acknowledges receipt only; internal research/analysis runs separately.
      return { ok: true, receiptCode };
    } catch {
      return { ok: false, error: "temporarily_unavailable" };
    }
  });

export interface FactoryInboxItem {
  id: string;
  status: string;
  submittedAt: string;
  company: string;
  industry: string;
  relationshipType: string;
  pains: Array<{ title: string; domain: string; urgency: string }>;
  analysisStatus: string | null;
  analysisRunId: string | null;
  methodVersionId: string | null;
}

export const listFactoryInbox = createServerFn({ method: "GET" })
  .middleware([operatorMiddleware])
  .validator(z.object({}).strict())
  .handler(async ({ context }): Promise<FactoryInboxItem[]> => {
    setNoStoreHeaders();
    const result = await callRpc(getOperatorRpc(context), "mow_factory_list_inbox");
    if (result.error) throw new Error("Factory inbox unavailable");
    return asRecordArray(result.data).map((row) => {
      const organization = asRecord(row["organizations"]) ?? {};
      const pains = asRecordArray(row["pain_points"]);
      const runs = asRecordArray(row["analysis_runs"]).sort((a, b) =>
        String(b["created_at"] ?? "").localeCompare(String(a["created_at"] ?? "")),
      );
      const latestRun = runs[0];
      return {
        id: String(row["id"] ?? ""),
        status: String(row["status"] ?? "received"),
        submittedAt: String(row["submitted_at"] ?? ""),
        company: String(organization["name"] ?? "Empresa sem nome"),
        industry: String(organization["industry"] ?? ""),
        relationshipType: String(organization["relationship_type"] ?? ""),
        pains: pains.map((pain) => ({
          title: String(pain["title"] ?? "Dor sem título"),
          domain: String(pain["domain"] ?? "Ainda não sei"),
          urgency: String(pain["urgency"] ?? "Ainda não sei"),
        })),
        analysisStatus: latestRun ? String(latestRun["status"] ?? "") : null,
        analysisRunId: typeof latestRun?.["id"] === "string" ? latestRun["id"] : null,
        methodVersionId:
          typeof latestRun?.["method_version_id"] === "string"
            ? latestRun["method_version_id"]
            : null,
      };
    });
  });

export interface FactoryBriefReview {
  id: string;
  status: string;
  submittedAt: string;
  payload: JsonObject;
  pains: Array<JsonObject>;
  analysis: JsonObject | null;
  analysisStatus: string | null;
  analysisRunId: string | null;
  methodVersionId: string | null;
  inputDigest: string | null;
}

export const getFactoryBriefReview = createServerFn({ method: "GET" })
  .middleware([operatorMiddleware])
  .validator(UUID_INPUT)
  .handler(async ({ data, context }): Promise<FactoryBriefReview | null> => {
    setNoStoreHeaders();
    const result = await callRpc(getOperatorRpc(context), "mow_factory_get_brief_review", {
      p_brief_id: data.id,
    });
    if (result.error) throw new Error("Factory brief unavailable");
    const row = asRecord(result.data);
    if (!row) return null;
    const runs = asRecordArray(row["analysis_runs"]).sort((a, b) =>
      String(b["created_at"] ?? "").localeCompare(String(a["created_at"] ?? "")),
    );
    const latestRun = runs[0];
    return {
      id: String(row["id"] ?? ""),
      status: String(row["status"] ?? "received"),
      submittedAt: String(row["submitted_at"] ?? ""),
      payload: toJsonObject(row["payload"]),
      pains: asRecordArray(row["pain_points"])
        .sort((a, b) => Number(a["position"] ?? 0) - Number(b["position"] ?? 0))
        .map(toJsonObject),
      analysis: latestRun?.["result"] ? toJsonObject(latestRun["result"]) : null,
      analysisStatus: typeof latestRun?.["status"] === "string" ? latestRun["status"] : null,
      analysisRunId: typeof latestRun?.["id"] === "string" ? latestRun["id"] : null,
      methodVersionId:
        typeof latestRun?.["method_version_id"] === "string"
          ? latestRun["method_version_id"]
          : null,
      inputDigest:
        typeof latestRun?.["input_digest"] === "string" ? latestRun["input_digest"] : null,
    };
  });

export const updateFactoryBriefStatus = createServerFn({ method: "POST" })
  .middleware([operatorMiddleware])
  .validator(REVIEW_INPUT)
  .handler(async ({ data, context }): Promise<{ updated: boolean }> => {
    setNoStoreHeaders();
    const result = await callRpc(getOperatorRpc(context), "mow_factory_update_brief_status", {
      p_brief_id: data.briefId,
      p_status: data.status,
    });
    return { updated: !resultError(result) && result.data === true };
  });

export const checkFactoryOperatorAccess = createServerFn({ method: "GET" })
  .middleware([operatorMiddleware])
  .validator(z.object({}).strict())
  .handler(async () => ({ active: true }));
export const approveFactoryMethodVersion = createServerFn({ method: "POST" })
  .middleware([operatorMiddleware])
  .validator(APPROVAL_INPUT)
  .handler(async ({ data, context }): Promise<{ approved: boolean }> => {
    setNoStoreHeaders();
    const approved = await executeMethodApprovalIfReady(async () => {
      const result = await callRpc(getOperatorRpc(context), "mow_factory_approve_method_version", {
        p_method_version_id: data.methodVersionId,
      });
      return !resultError(result) && result.data === true;
    });
    return { approved };
  });

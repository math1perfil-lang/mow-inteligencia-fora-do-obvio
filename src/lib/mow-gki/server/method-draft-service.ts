import {
  prepareMethodDraftRequest,
  validateMethodDraftCitations,
  type MethodDraftOutput,
} from "./method-draft-contract";

const MODEL_ID = "gpt-6.1-sol";
const PROMPT_VERSION = "mow-method-draft-evidence-synthesis/v1";
const MAX_COMPLETION_TOKENS = 4_096;

type ModelCatalogEntry = {
  id?: unknown;
  capabilities?: { supports_response_format_json_schema?: unknown };
};

type ChatResponse = {
  error?: unknown;
  choices?: Array<{ message?: { content?: unknown } }>;
};

type ServerEnvironment = Record<string, string | undefined>;

export type MethodDraftServiceErrorCode =
  | "llm_not_configured"
  | "model_unavailable"
  | "provider_request_failed"
  | "empty_model_response"
  | "invalid_model_output";

export class MethodDraftServiceError extends Error {
  constructor(readonly code: MethodDraftServiceErrorCode) {
    super("A síntese metodológica não pôde ser concluída com segurança.");
    this.name = "MethodDraftServiceError";
  }
}

export interface MethodDraftServiceOptions {
  environment?: ServerEnvironment;
  fetchImplementation?: typeof fetch;
  evaluatedAt?: Date;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function endpoint(base: string, path: string): string {
  return new URL(path, `${base.replace(/\/+$/, "")}/`).toString();
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new MethodDraftServiceError("provider_request_failed");
  }
}

function assertJsonSchemaModel(catalog: unknown): void {
  if (!isRecord(catalog) || !Array.isArray(catalog["data"])) {
    throw new MethodDraftServiceError("model_unavailable");
  }
  const model = catalog["data"].find(
    (entry): entry is ModelCatalogEntry => isRecord(entry) && entry["id"] === MODEL_ID,
  );
  if (model?.capabilities?.supports_response_format_json_schema !== true) {
    throw new MethodDraftServiceError("model_unavailable");
  }
}

const string = (maxLength: number) => ({ type: "string", minLength: 1, maxLength });
const citationIds = {
  type: "array",
  minItems: 1,
  maxItems: 10,
  items: { type: "string", format: "uuid" },
};

export const METHOD_DRAFT_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: string(200),
    executiveRationale: string(2_000),
    evidenceFindings: {
      type: "array",
      minItems: 1,
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          finding: string(1_000),
          evidenceIds: citationIds,
          confidence: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["finding", "evidenceIds", "confidence"],
      },
    },
    methodSteps: {
      type: "array",
      minItems: 3,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          order: { type: "integer", minimum: 1, maximum: 30 },
          name: string(160),
          action: string(1_000),
          ownerRole: string(120),
          duration: string(80),
          inputs: { type: "array", maxItems: 12, items: string(200) },
          outputs: { type: "array", maxItems: 12, items: string(200) },
          evidenceIds: citationIds,
        },
        required: [
          "order",
          "name",
          "action",
          "ownerRole",
          "duration",
          "inputs",
          "outputs",
          "evidenceIds",
        ],
      },
    },
    measures: {
      type: "array",
      minItems: 1,
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          metric: string(160),
          definition: string(500),
          cadence: string(80),
          targetSetting: string(300),
          evidenceIds: citationIds,
        },
        required: ["metric", "definition", "cadence", "targetSetting", "evidenceIds"],
      },
    },
    risks: {
      type: "array",
      minItems: 1,
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        properties: { risk: string(300), mitigation: string(500) },
        required: ["risk", "mitigation"],
      },
    },
    limitations: { type: "array", minItems: 1, maxItems: 20, items: string(500) },
    openQuestions: { type: "array", maxItems: 20, items: string(500) },
    adaptationNotes: string(1_000),
  },
  required: [
    "title",
    "executiveRationale",
    "evidenceFindings",
    "methodSteps",
    "measures",
    "risks",
    "limitations",
    "openQuestions",
    "adaptationNotes",
  ],
} as const;

export async function generateMethodDraft(
  brief: unknown,
  evidence: unknown,
  options: MethodDraftServiceOptions = {},
): Promise<{ draft: MethodDraftOutput; modelId: string; promptVersion: string }> {
  const prepared = prepareMethodDraftRequest(brief, evidence, options.evaluatedAt ?? new Date());
  const environment = options.environment ?? process.env;
  const base = environment["BUILT_IN_FORGE_API_URL"]?.trim();
  const apiKey = environment["BUILT_IN_FORGE_API_KEY"]?.trim();
  if (!base || !apiKey) throw new MethodDraftServiceError("llm_not_configured");
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

  let catalogResponse: Response;
  try {
    catalogResponse = await fetchImplementation(endpoint(base, "/v1/models"), {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new MethodDraftServiceError("provider_request_failed");
  }
  if (!catalogResponse.ok) throw new MethodDraftServiceError("provider_request_failed");
  assertJsonSchemaModel(await readJson(catalogResponse));

  let completionResponse: Response;
  try {
    completionResponse = await fetchImplementation(endpoint(base, "/v1/chat/completions"), {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(120_000),
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          { role: "system", content: prepared.systemPrompt },
          { role: "user", content: prepared.userPrompt },
        ],
        max_completion_tokens: MAX_COMPLETION_TOKENS,
        reasoning: { effort: "medium" },
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "mow_method_draft",
            strict: true,
            schema: METHOD_DRAFT_RESPONSE_SCHEMA,
          },
        },
      }),
    });
  } catch {
    throw new MethodDraftServiceError("provider_request_failed");
  }
  if (!completionResponse.ok) throw new MethodDraftServiceError("provider_request_failed");

  const payload = await readJson(completionResponse);
  if (!isRecord(payload) || payload["error"]) {
    throw new MethodDraftServiceError("provider_request_failed");
  }
  const choices = payload["choices"];
  const content =
    Array.isArray(choices) && isRecord(choices[0])
      ? (choices[0]["message"] as { content?: unknown } | undefined)?.content
      : null;
  if (typeof content !== "string" || !content.trim()) {
    throw new MethodDraftServiceError("empty_model_response");
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(content);
  } catch {
    throw new MethodDraftServiceError("invalid_model_output");
  }
  try {
    return {
      draft: validateMethodDraftCitations(decoded, evidence),
      modelId: MODEL_ID,
      promptVersion: PROMPT_VERSION,
    };
  } catch {
    throw new MethodDraftServiceError("invalid_model_output");
  }
}

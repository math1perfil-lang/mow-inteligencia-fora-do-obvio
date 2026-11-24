export const OPENALEX_FAILURE_TOKEN_PREFIX = "MOW_OPENALEX_FAILURE:";

const SAFE_FAILURE_MESSAGES = {
  rate_limited:
    "O OpenAlex pediu uma pausa por limite de frequência. Mantenha esta execução e aguarde o tempo indicado antes de tentar novamente.",
  rate_limit_unknown:
    "O OpenAlex recusou a consulta com HTTP 429, mas não informou se foi limite de frequência ou de cota. A repetição está bloqueada até a equipe MOW verificar a chave e o uso.",
  budget_exhausted:
    "A cota diária do OpenAlex foi atingida. A equipe MOW precisa verificar a cota ou o saldo; repetir agora não resolverá.",
  provider_not_configured:
    "A chave OpenAlex não está configurada no servidor. A equipe MOW precisa cadastrar OPENALEX_API_KEY antes de repetir esta execução.",
  plan_required:
    "O OpenAlex informou que esta operação exige um plano com acesso. A equipe MOW deve revisar a configuração antes de repetir.",
  provider_unavailable:
    "O OpenAlex está temporariamente indisponível ou não respondeu. Mantenha esta execução e tente novamente mais tarde.",
  timeout:
    "A consulta ao OpenAlex excedeu o tempo limite. Mantenha esta execução e tente novamente mais tarde.",
  provider_rejected:
    "O OpenAlex recusou a solicitação. Mantenha esta execução e informe a equipe MOW para revisar a integração.",
  access_or_run:
    "A sessão ou execução não foi autorizada para esta busca. Atualize o acesso e, se persistir, informe a equipe MOW.",
  run_state:
    "A execução não está em um estado pesquisável. Não crie outra execução; informe a equipe MOW.",
  lease:
    "A reserva da consulta não pôde ser obtida ou liberada. Aguarde alguns minutos e tente novamente nesta mesma execução.",
  unexpected:
    "A consulta não foi concluída. Tente novamente sem criar outra execução; se persistir, informe o ID à equipe MOW.",
} as const;

export type OpenAlexFailureCode = keyof typeof SAFE_FAILURE_MESSAGES;

type ErrorLike = {
  code?: unknown;
  message?: unknown;
  name?: unknown;
  status?: unknown;
  rateLimitReason?: unknown;
  retryAfterSeconds?: unknown;
};

type ParsedFailureToken = {
  code: OpenAlexFailureCode;
  retryAfterSeconds: number | null;
};

const RETRYABLE_RATE_LIMIT_REASONS = new Set([
  "requests_per_second",
  "broad_boolean_query",
  "wide_or_filter",
  "semantic_search",
  "new_account_pacing",
]);

function asErrorLike(error: unknown): ErrorLike | null {
  return typeof error === "object" && error !== null ? (error as ErrorLike) : null;
}

function isFailureCode(value: string): value is OpenAlexFailureCode {
  return Object.hasOwn(SAFE_FAILURE_MESSAGES, value);
}

function readFailureToken(error: unknown): ParsedFailureToken | null {
  const value = asErrorLike(error);
  const message = typeof value?.message === "string" ? value.message : "";
  const match = new RegExp(`${OPENALEX_FAILURE_TOKEN_PREFIX}([a-z_]+)(?::(\\d+))?`).exec(message);
  const rawCode = match?.[1];
  if (!rawCode || !isFailureCode(rawCode)) return null;

  const seconds = match[2] === undefined ? null : Number(match[2]);
  return {
    code: rawCode,
    retryAfterSeconds:
      seconds !== null && Number.isSafeInteger(seconds) && seconds >= 0 ? seconds : null,
  };
}

export function classifyOpenAlexFailure(error: unknown): OpenAlexFailureCode {
  const value = asErrorLike(error);
  const reason = value?.rateLimitReason;
  if (reason === "daily_budget" || reason === "not_enough_credits") return "budget_exhausted";
  if (reason === "plan_upgrade_required") return "plan_required";
  if (typeof reason === "string" && RETRYABLE_RATE_LIMIT_REASONS.has(reason)) {
    return "rate_limited";
  }

  const status = value?.status;
  if (status === 429) return "rate_limit_unknown";
  if (typeof status === "number" && status >= 500 && status <= 599) {
    return "provider_unavailable";
  }
  if (typeof status === "number" && status >= 400 && status <= 499) {
    return "provider_rejected";
  }

  switch (value?.code) {
    case "provider_not_configured":
      return "provider_not_configured";
    case "unauthenticated":
    case "forbidden":
      return "access_or_run";
    case "research_not_found":
    case "research_not_in_progress":
      return "run_state";
    case "lease_unavailable":
      return "lease";
  }

  if (value?.name === "TimeoutError" || value?.name === "AbortError") return "timeout";
  return "unexpected";
}

export function toOpenAlexFailureToken(error: unknown): string {
  const code = classifyOpenAlexFailure(error);
  const value = asErrorLike(error);
  const rawSeconds = value?.retryAfterSeconds;
  const seconds = typeof rawSeconds === "number" ? rawSeconds : Number.NaN;
  if (code === "rate_limited" && Number.isFinite(seconds) && seconds >= 0) {
    return `${OPENALEX_FAILURE_TOKEN_PREFIX}${code}:${Math.min(86_400, Math.max(1, Math.ceil(seconds)))}`;
  }
  return `${OPENALEX_FAILURE_TOKEN_PREFIX}${code}`;
}

export function getOpenAlexFailureCode(error: unknown): OpenAlexFailureCode | null {
  return readFailureToken(error)?.code ?? null;
}

export function getOpenAlexRetryAfterSeconds(error: unknown): number | null {
  const token = readFailureToken(error);
  if (token?.code !== "rate_limited") return null;
  return token.retryAfterSeconds;
}

export function getOpenAlexFailureNotice(error: unknown): string {
  const token = readFailureToken(error);
  if (!token) return SAFE_FAILURE_MESSAGES.unexpected;

  if (token.code === "rate_limited" && token.retryAfterSeconds !== null) {
    const seconds = token.retryAfterSeconds;
    const unit = seconds === 1 ? "segundo" : "segundos";
    return `O OpenAlex pediu uma pausa de ${seconds} ${unit} por limite de frequência. Mantenha esta execução; o botão de nova tentativa será liberado depois da espera.`;
  }

  return SAFE_FAILURE_MESSAGES[token.code];
}

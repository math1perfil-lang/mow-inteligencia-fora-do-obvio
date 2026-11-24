export const OPENALEX_FAILURE_TOKEN_PREFIX = "MOW_OPENALEX_FAILURE:";

const SAFE_FAILURE_MESSAGES = {
  rate_limited:
    "O OpenAlex limitou temporariamente as consultas. Aguarde um pouco e tente novamente nesta mesma execução; não crie outra.",
  provider_unavailable:
    "O OpenAlex está temporariamente indisponível ou não respondeu. Aguarde e tente novamente nesta mesma execução.",
  timeout:
    "A consulta ao OpenAlex excedeu o tempo limite. Aguarde e tente novamente nesta mesma execução.",
  provider_rejected:
    "O OpenAlex recusou a solicitação. Mantenha esta execução e informe a equipe MOW para revisar a consulta.",
  access_or_run:
    "A sessão ou execução não foi autorizada para esta busca. Atualize o acesso e, se persistir, informe a equipe MOW.",
  run_state:
    "A execução não está em um estado pesquisável. Não crie outra execução; informe a equipe MOW.",
  lease:
    "A reserva da consulta não pôde ser obtida ou liberada. Aguarde alguns minutos e tente novamente nesta mesma execução.",
  unexpected:
    "A consulta não foi concluída. Tente novamente sem criar outra execução; se persistir, informe o ID à equipe MOW.",
} as const;

type OpenAlexFailureCode = keyof typeof SAFE_FAILURE_MESSAGES;

type ErrorLike = {
  code?: unknown;
  message?: unknown;
  name?: unknown;
  status?: unknown;
};

function asErrorLike(error: unknown): ErrorLike | null {
  return typeof error === "object" && error !== null ? (error as ErrorLike) : null;
}

export function classifyOpenAlexFailure(error: unknown): OpenAlexFailureCode {
  const value = asErrorLike(error);
  const status = value?.status;
  if (status === 429) return "rate_limited";
  if (typeof status === "number" && status >= 500 && status <= 599) {
    return "provider_unavailable";
  }
  if (typeof status === "number" && status >= 400 && status <= 499) {
    return "provider_rejected";
  }

  switch (value?.code) {
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
  return `${OPENALEX_FAILURE_TOKEN_PREFIX}${classifyOpenAlexFailure(error)}`;
}

export function getOpenAlexFailureNotice(error: unknown): string {
  const value = asErrorLike(error);
  const message = typeof value?.message === "string" ? value.message : "";
  const match = new RegExp(`${OPENALEX_FAILURE_TOKEN_PREFIX}([a-z_]+)`).exec(message);
  const code = match?.[1];

  return code && code in SAFE_FAILURE_MESSAGES
    ? SAFE_FAILURE_MESSAGES[code as OpenAlexFailureCode]
    : SAFE_FAILURE_MESSAGES.unexpected;
}

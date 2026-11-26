export const METHOD_DRAFT_FAILURE_TOKEN_PREFIX = "MOW_METHOD_DRAFT_FAILURE:";

const SAFE_FAILURE_MESSAGES = {
  brief_unavailable: "Não foi possível localizar o briefing ou verificar seu acesso interno.",
  brief_not_in_review: "O briefing não está em revisão interna; nenhum método foi gerado.",
  pain_unavailable: "Não há uma dor válida selecionada no briefing para gerar o método.",
  brief_incomplete: "O briefing não contém o tipo de negócio e os detalhes mínimos da dor.",
  catalog_unavailable:
    "O catálogo privado de fontes está indisponível no servidor. A geração não foi concluída.",
  no_authorized_text:
    "Não foi encontrado texto legível em fontes com autorização vigente para análise e derivação metodológica. Resultados OpenAlex são apenas metadados e não substituem esse conteúdo.",
  rights_recheck_failed:
    "Não foi possível revalidar os direitos das fontes. Nenhum rascunho foi gerado.",
  source_changed: "Uma fonte mudou desde a busca. Revise novamente os direitos e tente outra vez.",
  llm_not_configured:
    "O serviço de geração por IA não está disponível no runtime da aplicação. A equipe MOW precisa verificar a integração de IA do servidor.",
  model_unavailable:
    "O modelo de geração não está disponível para saída estruturada neste runtime. A equipe MOW precisa revisar a configuração.",
  provider_request_failed:
    "O serviço de geração por IA não respondeu corretamente. Tente novamente mais tarde; se persistir, informe a equipe MOW.",
  empty_model_response: "O modelo não retornou conteúdo para o rascunho. Nenhum método foi salvo.",
  invalid_model_output:
    "A resposta do modelo não passou pela validação do método e das citações. Nenhum rascunho foi salvo.",
  persistence_failed:
    "O método foi elaborado, mas não pôde ser salvo para revisão interna. Nenhuma aprovação foi registrada.",
  invalid_input: "Os dados não passaram pela validação de segurança; nenhum método foi gerado.",
  unexpected:
    "Não foi possível concluir a geração. Nenhum método foi aprovado; confira o estado do serviço e tente novamente.",
} as const;

export type MethodDraftFailureCode = keyof typeof SAFE_FAILURE_MESSAGES;
const FAILURE_CODES = new Set<string>(Object.keys(SAFE_FAILURE_MESSAGES));

function errorRecord(error: unknown): Record<string, unknown> | null {
  return typeof error === "object" && error !== null ? (error as Record<string, unknown>) : null;
}

function failureCode(error: unknown): MethodDraftFailureCode {
  const record = errorRecord(error);
  const code = record?.["code"];
  if (typeof code === "string" && FAILURE_CODES.has(code)) {
    return code as MethodDraftFailureCode;
  }

  const message = typeof record?.["message"] === "string" ? record["message"] : "";
  const token = new RegExp(`${METHOD_DRAFT_FAILURE_TOKEN_PREFIX}([a-z_]+)`).exec(message)?.[1];
  if (token && FAILURE_CODES.has(token)) return token as MethodDraftFailureCode;

  const knownMessages: Record<string, MethodDraftFailureCode> = {
    BRIEF_UNAVAILABLE: "brief_unavailable",
    BRIEF_NOT_IN_REVIEW: "brief_not_in_review",
    METHOD_DRAFT_CATALOG_UNAVAILABLE: "catalog_unavailable",
    METHOD_DRAFT_NO_AUTHORIZED_TEXT: "no_authorized_text",
    METHOD_DRAFT_RIGHTS_RECHECK_FAILED: "rights_recheck_failed",
    METHOD_DRAFT_SOURCE_CHANGED: "source_changed",
    METHOD_DRAFT_SAVE_FAILED: "persistence_failed",
  };
  return knownMessages[message] ?? "unexpected";
}

export function toMethodDraftFailureToken(error: unknown): string {
  return `${METHOD_DRAFT_FAILURE_TOKEN_PREFIX}${failureCode(error)}`;
}

export function getMethodDraftFailureNotice(error: unknown): string {
  const code = failureCode(error);
  return SAFE_FAILURE_MESSAGES[code];
}

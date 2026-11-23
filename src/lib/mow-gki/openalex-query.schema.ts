import { z } from "zod";

const MAX_QUERY_LENGTH = 160;
const MAX_QUERY_WORDS = 12;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+/i;
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/g;
const CREDENTIAL_PATTERN = /\b(?:password|senha|api[_\s-]?key|access[_\s-]?token)\s*[:=]\s*\S+/iu;

function containsPhoneLikeSequence(query: string): boolean {
  return (query.match(PHONE_PATTERN) ?? []).some(
    (candidate) => (candidate.match(/\d/g)?.length ?? 0) >= 9,
  );
}

/**
 * Conservative guard against accidental briefing/PII submission. It cannot identify all personal
 * or confidential content; the operator must still submit topic keywords only.
 */
export const openAlexQuerySchema = z
  .string()
  .trim()
  .min(1, "Digite termos temáticos para a busca.")
  .max(MAX_QUERY_LENGTH, `Use no máximo ${MAX_QUERY_LENGTH} caracteres na busca.`)
  .superRefine((query, context) => {
    if (query.split(/\s+/u).length > MAX_QUERY_WORDS) {
      context.addIssue({
        code: "custom",
        message: `Use até ${MAX_QUERY_WORDS} termos temáticos; não cole um briefing.`,
      });
    }

    if (EMAIL_PATTERN.test(query)) {
      context.addIssue({ code: "custom", message: "Não inclua endereços de e-mail na busca." });
    }

    if (URL_PATTERN.test(query)) {
      context.addIssue({ code: "custom", message: "Não inclua URLs na busca OpenAlex." });
    }

    if (containsPhoneLikeSequence(query)) {
      context.addIssue({ code: "custom", message: "Não inclua números de telefone na busca." });
    }

    if (CREDENTIAL_PATTERN.test(query)) {
      context.addIssue({ code: "custom", message: "Não inclua credenciais na busca." });
    }

    if (/[\r\n]/u.test(query)) {
      context.addIssue({ code: "custom", message: "Use uma única linha de termos temáticos." });
    }
  });

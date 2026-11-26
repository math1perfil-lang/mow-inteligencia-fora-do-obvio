import { z } from "zod";
import { methodDraftBriefSchema } from "./method-draft-contract";

const uuidSchema = z.string().uuid();
const httpsUrlSchema = z
  .string()
  .trim()
  .url()
  .max(2_048)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  });

export const methodDraftEvidenceSubmissionSchema = z
  .object({
    evidenceId: uuidSchema,
    sourceId: uuidSchema,
    title: z.string().trim().min(1).max(500),
    url: httpsUrlSchema,
    content: z.string().trim().min(40).max(20_000),
    contentKind: z.enum([
      "full_text",
      "abstract",
      "report_section",
      "case_study",
      "source_page_extract",
    ]),
  })
  .strict();

export const generateMethodDraftInputSchema = z
  .object({
    briefId: uuidSchema,
    painIndex: z.number().int().min(0).max(19),
  })
  .strict();

export type MethodDraftEvidenceSubmission = z.infer<typeof methodDraftEvidenceSubmissionSchema>;
export type GenerateMethodDraftInput = z.infer<typeof generateMethodDraftInputSchema>;

export class MethodDraftWorkflowError extends Error {
  constructor(
    readonly code:
      "brief_unavailable" | "brief_not_in_review" | "pain_unavailable" | "brief_incomplete",
  ) {
    super("O rascunho não pôde ser preparado com segurança.");
    this.name = "MethodDraftWorkflowError";
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown, maxLength = 1_500): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function uniqueText(values: unknown[]): string[] {
  return [...new Set(values.map((value) => text(value, 500)).filter(Boolean))].slice(0, 30);
}

const CONTEXT_FIELDS: Array<[string, string]> = [
  ["platformDescription", "Oferta e atividade"],
  ["businessModel", "Modelo de sustentação/valor"],
  ["stage", "Estágio"],
  ["userGroups", "Públicos atendidos"],
  ["payer", "Quem paga ou financia"],
  ["geography", "Abrangência geográfica"],
  ["digitalOffering", "Oferta digital"],
  ["digitalJourney", "Jornada digital"],
  ["digitalConstraints", "Restrições digitais"],
  ["professionalServices", "Serviços profissionais"],
  ["professionalWorkflow", "Fluxo profissional"],
  ["professionalConstraints", "Restrições profissionais"],
  ["salesProcess", "Processo de vendas"],
  ["salesChannels", "Canais comerciais"],
  ["salesConstraints", "Restrições comerciais"],
  ["productionFlow", "Fluxo de produção/entrega"],
  ["productionBottleneck", "Gargalos de produção"],
  ["productionQuality", "Qualidade e retrabalho"],
  ["careServices", "Serviços de cuidado"],
  ["careCapacity", "Capacidade de atendimento"],
  ["careConstraints", "Restrições de cuidado"],
  ["learningOutcome", "Resultado de aprendizagem"],
  ["learningProcess", "Processo de formação"],
  ["learningConstraints", "Restrições de aprendizagem"],
  ["fieldServiceFlow", "Fluxo de serviço local/campo"],
  ["fieldServiceCapacity", "Capacidade de serviço"],
  ["fieldServiceQuality", "Verificação de qualidade"],
  ["socialPurpose", "Finalidade pública/social"],
  ["socialOutcome", "Resultado social pretendido"],
  ["socialConstraints", "Restrições de impacto"],
  ["otherActivity", "Descrição da atividade"],
  ["attempts", "Tentativas anteriores"],
  ["desiredResult", "Resultado desejado"],
  ["resources", "Recursos disponíveis"],
  ["horizon", "Horizonte de tempo"],
];

export function buildMethodDraftBriefFromReview(reviewValue: unknown, painIndex: number) {
  const review = asRecord(reviewValue);
  if (!review) throw new MethodDraftWorkflowError("brief_unavailable");
  if (review["status"] !== "in_review") throw new MethodDraftWorkflowError("brief_not_in_review");

  const payload = asRecord(review["payload"]);
  const pains = Array.isArray(review["pains"]) ? review["pains"].map(asRecord) : [];
  if (!payload) throw new MethodDraftWorkflowError("brief_unavailable");
  const pain = pains[painIndex];
  if (!pain) throw new MethodDraftWorkflowError("pain_unavailable");

  const businessType = text(payload["businessType"], 300);
  const painTitle = text(pain["title"], 140);
  const painDescription = text(pain["description"], 1_500);
  if (!businessType || !painTitle || painDescription.length < 5) {
    throw new MethodDraftWorkflowError("brief_incomplete");
  }

  const context = CONTEXT_FIELDS.flatMap(([key, label]) => {
    const value = text(payload[key], 500);
    return value ? [`${label}: ${value}`] : [];
  })
    .join("\n")
    .slice(0, 4_000);
  const constraints = uniqueText([
    payload["constraints"],
    payload["restrictions"],
    payload["digitalConstraints"],
    payload["professionalConstraints"],
    payload["salesConstraints"],
    payload["productionBottleneck"],
    payload["productionQuality"],
    payload["careConstraints"],
    payload["learningConstraints"],
    payload["fieldServiceCapacity"],
    payload["fieldServiceQuality"],
    payload["socialConstraints"],
  ]);
  const successCriteria = uniqueText([payload["successCriteria"], payload["desiredResult"]]);
  const painParts = [
    painTitle,
    text(pain["domain"], 100) ? `Área: ${text(pain["domain"], 100)}` : "",
    text(pain["urgency"], 100) ? `Prioridade: ${text(pain["urgency"], 100)}` : "",
    painDescription,
    text(pain["impact"], 600) ? `Impacto informado: ${text(pain["impact"], 600)}` : "",
  ].filter(Boolean);
  const parsed = methodDraftBriefSchema.safeParse({
    businessType,
    pain: painParts.join("\n"),
    context,
    constraints,
    successCriteria,
  });
  if (!parsed.success) throw new MethodDraftWorkflowError("brief_incomplete");
  return parsed.data;
}

/** Search terms stay inside the private MOW catalog RPC; no briefing text is sent to providers. */
export function buildMethodDraftCatalogQueries(reviewValue: unknown, painIndex: number): string[] {
  const review = asRecord(reviewValue);
  const payload = review ? asRecord(review["payload"]) : null;
  const pains = review && Array.isArray(review["pains"]) ? review["pains"].map(asRecord) : [];
  const pain = pains[painIndex];
  if (!payload || !pain || review?.["status"] !== "in_review") {
    throw new MethodDraftWorkflowError("pain_unavailable");
  }
  const title = text(pain["title"], 80);
  const domain = text(pain["domain"], 40);
  const description = text(pain["description"], 80);
  return [...new Set([title, [title, domain].filter(Boolean).join(" "), description])]
    .map((query) => query.trim().slice(0, 100))
    .filter((query) => query.length >= 2)
    .slice(0, 3);
}

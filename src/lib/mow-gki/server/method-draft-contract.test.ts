import { describe, expect, it } from "vitest";
import {
  MethodDraftInputError,
  methodDraftOutputSchema,
  prepareMethodDraftRequest,
  validateMethodDraftCitations,
} from "./method-draft-contract";

const SOURCE_ID = "00000000-0000-4000-8000-000000000001";
const EVIDENCE_ID = "00000000-0000-4000-8000-000000000002";
const REVIEWER_ID = "00000000-0000-4000-8000-000000000003";
const UNKNOWN_EVIDENCE_ID = "00000000-0000-4000-8000-000000000004";
const NOW = new Date("2026-11-24T12:00:00.000Z");

const brief = {
  businessType: "Escritório de advocacia",
  pain: "Atrasos recorrentes na triagem de novos casos.",
  context: "Equipe pequena, atendimento multicanal e forte exigência de confidencialidade.",
  constraints: ["Não expor dados de clientes", "Sem contratação adicional no piloto"],
  successCriteria: ["Reduzir o tempo de triagem sem elevar erros"],
};

function authorizedEvidence() {
  return {
    evidenceId: EVIDENCE_ID,
    sourceId: SOURCE_ID,
    title: "Estudo sintético de gestão de processos",
    url: "https://example.org/study",
    content:
      "Texto sintético de teste: descreve um processo de triagem, critérios de priorização e uma métrica de tempo de ciclo sem qualquer dado real.",
    contentKind: "report_section" as const,
    rightsReview: {
      status: "explicit_permission",
      permittedUses: ["internal_content_analysis", "commercial_method_derivation"],
      restrictions: [],
      restrictionsReviewed: true,
      restrictionsSatisfied: true,
      evidenceUrl: "https://example.org/permission",
      reviewerId: REVIEWER_ID,
      reviewedAt: "2026-11-20T10:00:00.000Z",
      validUntil: "2027-11-20",
    },
  };
}

function validDraft(evidenceId = EVIDENCE_ID) {
  return {
    title: "Triagem jurídica orientada por risco",
    executiveRationale:
      "Rascunho sintético que adapta o fluxo de triagem ao contexto de um escritório jurídico.",
    evidenceFindings: [
      {
        finding: "Critérios explícitos podem apoiar uma priorização consistente.",
        evidenceIds: [evidenceId],
        confidence: "medium" as const,
      },
    ],
    methodSteps: [
      {
        order: 1,
        name: "Definir critérios de entrada",
        action:
          "Registrar critérios mínimos e categorias de urgência sem incluir dados identificáveis.",
        ownerRole: "Sócio responsável pela área",
        duration: "1 semana",
        inputs: ["Categorias de serviço"],
        outputs: ["Critérios aprovados"],
        evidenceIds: [evidenceId],
      },
      {
        order: 2,
        name: "Testar o fluxo",
        action: "Aplicar os critérios em uma amostra interna minimizada e revisar divergências.",
        ownerRole: "Coordenador de atendimento",
        duration: "2 semanas",
        inputs: ["Critérios aprovados"],
        outputs: ["Registro de divergências"],
        evidenceIds: [evidenceId],
      },
      {
        order: 3,
        name: "Ajustar e monitorar",
        action: "Ajustar o fluxo e acompanhar tempo de triagem e taxa de reclassificação.",
        ownerRole: "Equipe de operações jurídicas",
        duration: "Revisão quinzenal",
        inputs: ["Resultados do piloto"],
        outputs: ["Versão revisada do fluxo"],
        evidenceIds: [evidenceId],
      },
    ],
    measures: [
      {
        metric: "Tempo de triagem",
        definition: "Tempo entre a entrada do pedido e sua classificação inicial.",
        cadence: "Semanal",
        targetSetting: "Definir a meta após medir a linha de base do escritório.",
        evidenceIds: [evidenceId],
      },
    ],
    risks: [
      {
        risk: "Critérios podem refletir diferenças entre áreas jurídicas.",
        mitigation: "Validar cada categoria com os responsáveis e reavaliar no piloto.",
      },
    ],
    limitations: ["Evidência sintética de teste; não constitui achado de pesquisa real."],
    openQuestions: ["Quais categorias e prazos internos devem ser priorizados?"],
    adaptationNotes:
      "A proposta se adapta a um escritório jurídico e evita presumir um produto ou plataforma tecnológica.",
  };
}

describe("method draft evidence contract", () => {
  it("does not treat search metadata as content evidence", () => {
    expect(() => prepareMethodDraftRequest(brief, [], NOW)).toThrowError(MethodDraftInputError);
    expect(() =>
      prepareMethodDraftRequest(brief, [{ ...authorizedEvidence(), content: "" }], NOW),
    ).toThrowError(MethodDraftInputError);
  });

  it("blocks source material unless both internal analysis and commercial derivation are explicitly authorized", () => {
    const evidence = authorizedEvidence();
    evidence.rightsReview = {
      ...evidence.rightsReview,
      status: "pending",
      permittedUses: ["catalog_metadata", "link_and_citation"],
    };
    try {
      prepareMethodDraftRequest(brief, [evidence], NOW);
      throw new Error("Expected source-rights block");
    } catch (error) {
      expect(error).toBeInstanceOf(MethodDraftInputError);
      expect((error as MethodDraftInputError).code).toBe("content_rights_not_authorized");
    }
  });

  it("prepares a private draft request with business-specific adaptation and authorized evidence only", () => {
    const prepared = prepareMethodDraftRequest(brief, [authorizedEvidence()], NOW);
    expect(prepared.systemPrompt).toContain("nunca um método aprovado");
    expect(prepared.systemPrompt).toContain("não presuma que o negócio seja de tecnologia.");
    expect(prepared.userPrompt).toContain(brief.businessType);
    expect(prepared.userPrompt).toContain(EVIDENCE_ID);
    expect(prepared.userPrompt).toContain("Texto sintético de teste");
  });

  it("accepts traceable output and rejects fabricated citation IDs", () => {
    const parsed = methodDraftOutputSchema.parse(validDraft());
    expect(validateMethodDraftCitations(parsed, [authorizedEvidence()]).title).toBe(parsed.title);
    expect(() =>
      validateMethodDraftCitations(validDraft(UNKNOWN_EVIDENCE_ID), [authorizedEvidence()]),
    ).toThrow(MethodDraftInputError);
  });
});

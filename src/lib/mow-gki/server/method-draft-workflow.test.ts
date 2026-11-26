import { describe, expect, it } from "vitest";
import {
  buildMethodDraftBriefFromReview,
  buildMethodDraftCatalogQueries,
  generateMethodDraftInputSchema,
} from "./method-draft-workflow";

const review = {
  status: "in_review",
  payload: {
    businessType: "Serviços profissionais, incluindo jurídico",
    company: "Nome de empresa que não deve ser enviado",
    platformDescription: "Atendimento jurídico consultivo fictício.",
    professionalWorkflow: "Triagem, análise, atendimento e conclusão.",
    professionalConstraints: "Preservar confidencialidade e sigilo.",
    successCriteria: "Reduzir o tempo até a triagem inicial.",
    contact: "contato@example.test",
  },
  pains: [
    {
      title: "Atraso na triagem",
      domain: "Operações e processos",
      urgency: "Alta",
      description: "Solicitações ficam sem classificação inicial por vários dias.",
      impact: "Perda de previsibilidade do atendimento.",
    },
  ],
};

describe("method-draft-workflow", () => {
  it("builds a business-specific brief while omitting company identity and contact fields", () => {
    const result = buildMethodDraftBriefFromReview(review, 0);

    expect(result.businessType).toBe("Serviços profissionais, incluindo jurídico");
    expect(result.pain).toContain("Atraso na triagem");
    expect(result.context).toContain(
      "Fluxo profissional: Triagem, análise, atendimento e conclusão.",
    );
    expect(result.context).not.toContain("Nome de empresa");
    expect(result.context).not.toContain("contato@example.test");
    expect(result.constraints).toContain("Preservar confidencialidade e sigilo.");
    expect(result.successCriteria).toContain("Reduzir o tempo até a triagem inicial.");
  });

  it("fails closed when the brief is not in internal review or the selected pain is missing", () => {
    expect(() => buildMethodDraftBriefFromReview({ ...review, status: "received" }, 0)).toThrow();
    expect(() => buildMethodDraftBriefFromReview(review, 1)).toThrow();
  });

  it("accepts only the briefing and selected pain; evidence cannot be supplied by the browser", () => {
    const valid = {
      briefId: "00000000-0000-4000-8000-000000000001",
      painIndex: 0,
    };
    expect(generateMethodDraftInputSchema.safeParse(valid).success).toBe(true);
    expect(
      generateMethodDraftInputSchema.safeParse({
        ...valid,
        evidence: [{ content: "Conteúdo não confiável enviado pelo navegador" }],
      }).success,
    ).toBe(false);
  });

  it("derives bounded private-catalog search terms without using company/contact fields", () => {
    const queries = buildMethodDraftCatalogQueries(review, 0);
    expect(queries).toContain("Atraso na triagem");
    expect(queries.join(" ")).not.toContain("Nome de empresa");
    expect(queries.join(" ")).not.toContain("contato@example.test");
    expect(queries.every((query) => query.length <= 100)).toBe(true);
  });
});

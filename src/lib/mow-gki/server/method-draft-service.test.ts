import { describe, expect, it, vi } from "vitest";
import { MethodDraftServiceError, generateMethodDraft } from "./method-draft-service";

const EVIDENCE_ID = "00000000-0000-4000-8000-000000000002";
const SOURCE_ID = "00000000-0000-4000-8000-000000000001";
const REVIEWER_ID = "00000000-0000-4000-8000-000000000003";
const UNKNOWN_ID = "00000000-0000-4000-8000-000000000004";
const now = new Date("2026-11-24T12:00:00.000Z");

const brief = {
  businessType: "Escritório de advocacia",
  pain: "Atrasos recorrentes na triagem de novos casos.",
  context: "Equipe pequena com canais de atendimento variados.",
  constraints: ["Não expor dados de clientes"],
  successCriteria: ["Reduzir o tempo de triagem"],
};

const evidence = {
  evidenceId: EVIDENCE_ID,
  sourceId: SOURCE_ID,
  title: "Trecho autorizado de teste",
  url: "https://example.org/evidence",
  content: "Conteúdo sintético descrevendo priorização, triagem e monitoramento do tempo de ciclo.",
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

function draft(evidenceId = EVIDENCE_ID) {
  return {
    title: "Triagem orientada por risco",
    executiveRationale: "Rascunho sintético para teste com adaptação a serviços jurídicos.",
    evidenceFindings: [
      {
        finding: "Critérios explícitos podem apoiar priorização.",
        evidenceIds: [evidenceId],
        confidence: "medium",
      },
    ],
    methodSteps: [
      {
        order: 1,
        name: "Definir critérios",
        action: "Registrar critérios mínimos e urgências.",
        ownerRole: "Sócio responsável",
        duration: "1 semana",
        inputs: ["Categorias"],
        outputs: ["Critérios"],
        evidenceIds: [evidenceId],
      },
      {
        order: 2,
        name: "Testar o fluxo",
        action: "Aplicar critérios em amostra minimizada.",
        ownerRole: "Coordenação",
        duration: "2 semanas",
        inputs: ["Critérios"],
        outputs: ["Resultados"],
        evidenceIds: [evidenceId],
      },
      {
        order: 3,
        name: "Monitorar",
        action: "Acompanhar tempo e reclassificações.",
        ownerRole: "Operações",
        duration: "Quinzenal",
        inputs: ["Resultados"],
        outputs: ["Ajustes"],
        evidenceIds: [evidenceId],
      },
    ],
    measures: [
      {
        metric: "Tempo de triagem",
        definition: "Tempo até classificação inicial.",
        cadence: "Semanal",
        targetSetting: "Definir após medir linha de base.",
        evidenceIds: [evidenceId],
      },
    ],
    risks: [
      {
        risk: "Critérios podem variar por área.",
        mitigation: "Revisar com responsáveis durante o piloto.",
      },
    ],
    limitations: ["Fixture sintético; não representa pesquisa real."],
    openQuestions: ["Quais categorias devem ser priorizadas?"],
    adaptationNotes:
      "A proposta considera serviços jurídicos e não pressupõe operação de tecnologia.",
  };
}

function mockResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

const environment = {
  BUILT_IN_FORGE_API_URL: "https://llm.example.test",
  BUILT_IN_FORGE_API_KEY: "server-only-test-key",
};

describe("method draft LLM service", () => {
  it("fails closed when only legacy MANUS_API variables are present instead of WebDev runtime credentials", async () => {
    const fetchImplementation = vi.fn();
    await expect(
      generateMethodDraft(brief, [evidence], {
        environment: {
          MANUS_API_URL: "https://legacy.example.test",
          MANUS_API_KEY: "legacy-test-key",
        },
        fetchImplementation,
        evaluatedAt: now,
      }),
    ).rejects.toMatchObject({
      code: "llm_not_configured",
    });
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it("fails closed when the project's live catalog does not expose the selected JSON-schema model", async () => {
    const fetchImplementation = vi
      .fn()
      .mockResolvedValue(mockResponse({ data: [{ id: "another-model" }] }));
    await expect(
      generateMethodDraft(brief, [evidence], {
        environment,
        fetchImplementation,
        evaluatedAt: now,
      }),
    ).rejects.toMatchObject({
      code: "model_unavailable",
    });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it("checks rights before calling the provider", async () => {
    const fetchImplementation = vi.fn();
    const pendingEvidence = {
      ...evidence,
      rightsReview: {
        ...evidence.rightsReview,
        status: "pending",
        permittedUses: ["catalog_metadata"],
      },
    };
    await expect(
      generateMethodDraft(brief, [pendingEvidence], {
        environment,
        fetchImplementation,
        evaluatedAt: now,
      }),
    ).rejects.toBeInstanceOf(Error);
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it("produces a schema-validated draft only after catalog validation and rejects unknown citations", async () => {
    const fetchImplementation = vi
      .fn()
      .mockResolvedValueOnce(
        mockResponse({
          data: [
            { id: "gpt-6.1-sol", capabilities: { supports_response_format_json_schema: true } },
          ],
        }),
      )
      .mockResolvedValueOnce(
        mockResponse({ choices: [{ message: { content: JSON.stringify(draft()) } }] }),
      );

    const result = await generateMethodDraft(brief, [evidence], {
      environment,
      fetchImplementation,
      evaluatedAt: now,
    });
    expect(result.modelId).toBe("gpt-6.1-sol");
    expect(result.draft.methodSteps).toHaveLength(3);
    expect(fetchImplementation).toHaveBeenCalledTimes(2);
    const completionRequest = JSON.parse(fetchImplementation.mock.calls[1]![1]!.body as string);
    expect(completionRequest.messages[1].content).toContain("Escritório de advocacia");
    expect(completionRequest.response_format.json_schema.strict).toBe(true);

    const invalidFetch = vi
      .fn()
      .mockResolvedValueOnce(
        mockResponse({
          data: [
            { id: "gpt-6.1-sol", capabilities: { supports_response_format_json_schema: true } },
          ],
        }),
      )
      .mockResolvedValueOnce(
        mockResponse({ choices: [{ message: { content: JSON.stringify(draft(UNKNOWN_ID)) } }] }),
      );
    await expect(
      generateMethodDraft(brief, [evidence], {
        environment,
        fetchImplementation: invalidFetch,
        evaluatedAt: now,
      }),
    ).rejects.toBeInstanceOf(MethodDraftServiceError);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildClientSolutionSnapshot,
  clientSolutionProgressInputSchema,
  clientSolutionSnapshotSchema,
} from "./client-solution-contract";

const internalDraft = {
  title: "Método de melhoria operacional",
  executiveRationale: "Racional interno que não deve sair para o cliente.",
  evidenceFindings: [
    {
      finding: "Achado interno privado",
      evidenceIds: ["11111111-1111-4111-8111-111111111111"],
      confidence: "medium",
    },
  ],
  methodSteps: [1, 2, 3].map((order) => ({
    order,
    name: `Etapa ${order}`,
    action: `Ação operacional detalhada da etapa ${order}.`,
    ownerRole: "Equipe responsável",
    duration: "Uma semana",
    inputs: ["Informação necessária"],
    outputs: ["Resultado de trabalho"],
    evidenceIds: ["11111111-1111-4111-8111-111111111111"],
  })),
  measures: [
    {
      metric: "Indicador de execução",
      definition: "Definição do indicador observado durante a aplicação.",
      cadence: "Semanal",
      targetSetting: "Definir uma linha de base e uma meta com a equipe.",
      evidenceIds: ["11111111-1111-4111-8111-111111111111"],
    },
  ],
  risks: [{ risk: "Risco interno", mitigation: "Mitigação interna." }],
  limitations: ["Limitação interna."],
  openQuestions: ["Pergunta interna pendente."],
  adaptationNotes: "Notas internas de adaptação do método ao negócio.",
};

const evidenceManifest = [
  {
    title: "Nome interno de material",
    url: "https://private.example/source",
    sourceId: "22222222-2222-4222-8222-222222222222",
  },
];

describe("client solution projection", () => {
  it("allowlists only execution fields and omits all evidence/internal-analysis properties", () => {
    const result = buildClientSolutionSnapshot(
      internalDraft,
      "Objetivo claro para orientar a execução da solução.",
    );
    const serialized = JSON.stringify(result);

    expect(result.methodSteps).toHaveLength(3);
    expect(result.methodSteps[0]?.id).toBe("step-1");
    expect(result.measures[0]).not.toHaveProperty("evidenceIds");
    expect(serialized).not.toContain("evidenceFindings");
    expect(serialized).not.toContain("executiveRationale");
    expect(serialized).not.toContain("evidenceIds");
    expect(serialized).not.toContain("Nome interno de material");
    expect(serialized).not.toContain("private.example");
    expect(serialized).not.toContain("Achado interno privado");
    expect(serialized).not.toContain("Risco interno");
    expect(serialized).not.toContain("Pergunta interna pendente");
    expect(serialized).not.toContain("Notas internas");
  });

  it("rejects extra internal fields in a client snapshot", () => {
    const projected = buildClientSolutionSnapshot(
      internalDraft,
      "Objetivo claro para orientar a execução da solução.",
    );
    expect(() =>
      clientSolutionSnapshotSchema.parse({ ...projected, evidence: evidenceManifest }),
    ).toThrow();
    expect(() =>
      clientSolutionSnapshotSchema.parse({ ...projected, briefing: "contexto privado" }),
    ).toThrow();
  });

  it("validates individual progress input and rejects arbitrary status, identity, or release fields", () => {
    const validProgress = {
      releaseId: "33333333-3333-4333-8333-333333333333",
      stepId: "step-2",
      status: "in_progress",
      note: "Iniciamos a atividade.",
    };
    expect(clientSolutionProgressInputSchema.safeParse(validProgress).success).toBe(true);
    expect(
      clientSolutionProgressInputSchema.safeParse({
        ...validProgress,
        stepId: "step-99",
        status: "approved",
      }).success,
    ).toBe(false);
    expect(
      clientSolutionProgressInputSchema.safeParse({ ...validProgress, userId: "other-account" })
        .success,
    ).toBe(false);
    expect(
      clientSolutionProgressInputSchema.safeParse({ ...validProgress, isOwner: true }).success,
    ).toBe(false);
    expect(
      clientSolutionProgressInputSchema.safeParse({ ...validProgress, briefing: "private data" })
        .success,
    ).toBe(false);
  });
});

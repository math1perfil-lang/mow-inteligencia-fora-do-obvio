import { describe, expect, it } from "vitest";
import { PROBLEM_DOMAINS } from "./brief-schema";
import {
  KNOWLEDGE_AREAS,
  MATERIAL_PRIORITY,
  MATERIAL_TYPES,
  PROPOSED_CROSSCUTTING_AREAS,
  selectKnowledgeForProblems,
} from "./knowledge-selection";

describe("selectKnowledgeForProblems — taxonomia candidata local", () => {
  it("usa as 25 áreas originais sem duplicar ou substituir os nomes", () => {
    expect(KNOWLEDGE_AREAS).toHaveLength(25);
    expect(new Set(KNOWLEDGE_AREAS).size).toBe(25);
    expect(KNOWLEDGE_AREAS).toContain("Produtividade e desempenho empresarial");
    expect(PROPOSED_CROSSCUTTING_AREAS).toEqual(["Sustentabilidade e impacto"]);
  });

  it("classifica os 15 tipos de material nas quatro funções de uso", () => {
    expect(MATERIAL_TYPES).toHaveLength(15);
    const categorized = Object.values(MATERIAL_PRIORITY).flat();
    expect(new Set(categorized).size).toBe(15);
    expect(new Set(categorized)).toEqual(new Set(MATERIAL_TYPES));
    expect(MATERIAL_PRIORITY.discoveryOnly).toEqual([
      "Currículos oficiais",
      "Catálogos de disciplinas",
      "Ementas e syllabi",
      "Bibliografias recomendadas",
    ]);
  });

  it("mapeia todas as áreas substantivas do briefing sem forçar setor ou área para Outro", () => {
    const result = selectKnowledgeForProblems(PROBLEM_DOMAINS.map((domain) => ({ domain })));

    expect(result.status).toContain("nenhuma fonte pesquisada");
    expect(result.mappings.map(({ problemDomain }) => problemDomain)).toEqual(
      PROBLEM_DOMAINS.filter((domain) => domain !== "Outro" && domain !== "Ainda não sei"),
    );
    expect(result.needsClarification).toEqual(["Outro", "Ainda não sei"]);
    expect(result.candidateAreas).toContain("Estratégia empresarial");
    expect(result.candidateAreas).toContain("Gestão de riscos");
    expect(result.proposedCrosscuttingAreas).toEqual(["Sustentabilidade e impacto"]);
    expect(result.safeguards).toContain(
      "Nenhuma fonte real foi consultada; toda saída exige revisão humana.",
    );
  });

  it("mantém áreas condicionais separadas até que haja contexto", () => {
    const result = selectKnowledgeForProblems([{ domain: "Operações e processos" }]);

    expect(result.candidateAreas).toEqual(["Gestão de operações", "Gestão de processos"]);
    expect(result.conditionalAreas).toEqual([
      "Produtividade e desempenho empresarial",
      "Logística e cadeia de suprimentos",
    ]);
  });

  it("deduplica áreas em dores múltiplas e remove condicionais já selecionadas como candidatas", () => {
    const result = selectKnowledgeForProblems([
      { domain: "Comercial e vendas" },
      { domain: "Marketing e publicidade" },
      { domain: "Dados e analytics" },
    ]);

    expect(result.candidateAreas.filter((area) => area === "Marketing")).toHaveLength(1);
    expect(result.conditionalAreas).not.toContain("Análise de dados e métodos quantitativos");
  });

  it("não atribui áreas a entradas inválidas e mantém a necessidade de esclarecimento separada", () => {
    const result = selectKnowledgeForProblems([
      { domain: "Área inexistente" },
      { domain: "Ainda não sei" },
    ]);

    expect(result.mappings).toEqual([]);
    expect(result.candidateAreas).toEqual([]);
    expect(result.needsClarification).toEqual(["Ainda não sei"]);
  });
});

import { describe, expect, it } from "vitest";
import { analyzeMethodBrief, generateMethodDraft, type MethodFactorySource } from "./analysis";
import type { ProblemEntry, Values } from "./brief-schema";

const values: Values = {
  company: "Oficina Aurora",
  platformDescription: "Conecta oficinas a fornecedores.",
  stage: "Em operação",
  desiredResult: "Reduzir atrasos no atendimento.",
  constraints: "Não alterar dados de clientes.",
  successCriteria: "Acordar indicador antes do teste.",
};

const problems: ProblemEntry[] = [
  {
    title: "Poucas solicitações qualificadas",
    domain: "Marketing e publicidade",
    urgency: "Alta",
    description: "A equipe relata poucas solicitações qualificadas.",
    impact: "A equipe relata dificuldade para planejar.",
  },
  {
    title: "Conversão inconsistente",
    domain: "Comercial e vendas",
    urgency: "Média",
    description: "A equipe relata variação no avanço das propostas.",
    impact: "A equipe quer compreender as etapas.",
  },
  {
    title: "Registro manual",
    domain: "Operações e processos",
    urgency: "Baixa",
    description: "Há registro manual, conforme informado.",
    impact: "O briefing não quantifica o impacto.",
  },
];

const sources: MethodFactorySource[] = [
  {
    id: "authorized",
    title: "Referência de marketing autorizada",
    canonical_url: "https://example.org/marketing",
    domain_tags: ["Marketing e publicidade"],
    rights_status: "Material próprio autorizado",
    permitted_uses: ["análise interna", "uso comercial"],
  },
  {
    id: "public",
    title: "Referência pública de vendas",
    canonical_url: "https://example.org/vendas",
    domain_tags: ["Comercial e vendas"],
    rights_status: "Público: apenas referência",
    permitted_uses: ["consulta pública"],
    restrictions: "Não reproduzir nem usar como material de treinamento.",
  },
  {
    id: "pending",
    title: "Referência com licença pendente",
    canonical_url: "https://example.org/processos",
    domain_tags: ["Operações e processos"],
    rights_status: "Direitos pendentes",
    permitted_uses: ["análise interna"],
  },
  {
    id: "cc-by-nc-sa",
    title: "OpenStax — 15.3 Steps in the Personal Selling Process",
    canonical_url: "https://example.org/openstax-selling",
    domain_tags: ["Comercial e vendas"],
    rights_status: "licenca_aberta",
    permitted_uses: ["análise interna", "NonCommercial"],
    restrictions: "NonCommercial; uso comercial não permitido.",
  },
];

describe("analyzeMethodBrief", () => {
  it("decompõe um briefing multiárea e sinaliza somente dependência coberta por regra explícita", () => {
    const result = analyzeMethodBrief({ values, pains: problems, sources: [] });

    expect(result.engine).toBe("rules-v1");
    expect(result.dores_decompostas).toHaveLength(3);
    expect(result.dores_decompostas.map((pain) => pain.área)).toEqual([
      "Marketing e publicidade",
      "Comercial e vendas",
      "Operações e processos",
    ]);
    expect(result.sinais_de_dependência).toHaveLength(1);
    expect(result.sinais_de_dependência[0]?.regra).toBe("aquisição-conversão");
    expect(result.sinais_de_dependência[0]?.natureza).toContain("não é fato confirmado");
    expect(result.plano_de_conhecimento.candidateAreas).toContain("Gestão de processos");
    expect(result.plano_de_conhecimento.conditionalAreas).toContain(
      "Logística e cadeia de suprimentos",
    );
    expect(result.plano_de_conhecimento.materialPriority.primaryEvidence).toContain(
      "Artigos científicos",
    );
    expect(result.plano_de_conhecimento.status).toContain("nenhuma fonte pesquisada");
    expect(result.rascunho_de_método.passos.map((step) => step.etapa)).toEqual([
      "1. Medir a linha de base",
      "2. Mapear processo ou jornada",
      "3. Testar uma intervenção pequena",
      "4. Avaliar e decidir",
    ]);
    expect(
      result.rascunho_de_método.adaptações_por_domínio.every(
        (item) => item.atribuição === "Proposta MOW; não atribuída a uma fonte",
      ),
    ).toBe(true);
  });

  it("corresponde etiquetas de áreas de conhecimento, mas não ativa áreas condicionais", () => {
    const knowledgeAreaSource: MethodFactorySource = {
      ...sources[0]!,
      id: "knowledge-area-tag",
      title: "Fonte sintética marcada com área de processo",
      domain_tags: ["Gestão de processos"],
    };
    const conditionalAreaSource: MethodFactorySource = {
      ...sources[0]!,
      id: "conditional-area-tag",
      title: "Fonte sintética marcada com logística condicional",
      domain_tags: ["Logística e cadeia de suprimentos"],
    };
    const result = analyzeMethodBrief({
      values,
      pains: [problems[2]!],
      sources: [knowledgeAreaSource, conditionalAreaSource],
    });

    expect(result.fontes_relacionadas.map((source) => source.id)).toContain("knowledge-area-tag");
    expect(result.fontes_relacionadas.map((source) => source.id)).not.toContain(
      "conditional-area-tag",
    );
    expect(result.plano_de_conhecimento.conditionalAreas).toContain(
      "Logística e cadeia de suprimentos",
    );
  });

  it("trata fontes públicas e pendentes somente como referências de metadados, respeitando direitos", () => {
    const result = analyzeMethodBrief({ values, pains: problems, sources });
    const authorized = result.fontes_relacionadas.find((source) => source.id === "authorized");
    const publicReference = result.fontes_relacionadas.find((source) => source.id === "public");
    const pending = result.fontes_relacionadas.find((source) => source.id === "pending");
    const nonCommercial = result.fontes_relacionadas.find((source) => source.id === "cc-by-nc-sa");

    expect(authorized?.uso_interno_elegível).toBe(true);
    expect(publicReference?.uso_interno_elegível).toBe(false);
    expect(publicReference?.nota).toContain("não constitui evidência do caso");
    expect(publicReference?.restrições).toBe(
      "Não reproduzir nem usar como material de treinamento.",
    );
    expect(pending?.uso_interno_elegível).toBe(false);
    expect(pending?.classificação).toContain("Referência apenas");
    expect(nonCommercial?.uso_interno_elegível).toBe(false);
    expect(nonCommercial?.classificação).toContain("Referência apenas");
    expect(result.disponibilidade_de_fontes).toContain("não evidência do caso");

    const draft = generateMethodDraft({ values, pains: problems, sources });
    expect(draft.citations.find((citation) => citation.sourceId === "cc-by-nc-sa")?.useType).toBe(
      "reference_only",
    );
  });

  it("reconhece os enums snake_case do banco sem ampliar direitos implícitos", () => {
    const databaseSource: MethodFactorySource = {
      ...sources[0]!,
      id: "database-authorized",
      rights_status: "material_proprio_autorizado",
      permitted_uses: ["analise_interna", "uso_comercial"],
    };
    const result = analyzeMethodBrief({ values, pains: problems, sources: [databaseSource] });

    expect(result.fontes_relacionadas[0]?.uso_interno_elegível).toBe(true);
    expect(
      analyzeMethodBrief({
        values,
        pains: problems,
        sources: [{ ...databaseSource, permitted_uses: ["analise_interna"] }],
      }).fontes_relacionadas[0]?.uso_interno_elegível,
    ).toBe(false);
  });

  it("expõe lacunas de medição sem inventar números, fatos ou validação", () => {
    const result = analyzeMethodBrief({
      values: { company: "Iniciativa sem dados" },
      pains: [problems[0]!],
      sources: [],
    });

    expect(
      result.lacunas_e_perguntas.some((item) => item.pergunta.toLowerCase().includes("indicador")),
    ).toBe(true);
    expect(result.rascunho_de_método.métricas_e_definições[0]).toContain(
      "não fornece valores medidos",
    );
    expect(result.dores_decompostas[0]?.prioridade_percebida).toBe("Alta");
    expect(result.dores_decompostas[0]?.nota_de_medida).toContain("não é frequência");
    expect(result.resumo_factual.fatos.map((fact) => fact.valor)).toEqual(["Iniciativa sem dados"]);
    expect(result.hipóteses.every((hypothesis) => hypothesis.marca.includes("não é fato"))).toBe(
      true,
    );
    expect(result.status).toContain("não aprovado nem validado");
    expect(result.rascunho_de_método.status).toContain("não aprovado nem validado");
  });

  it("não duplica o JSON serializado de dores entre os fatos textuais do resumo", () => {
    const result = analyzeMethodBrief({
      values: { ...values, pains: JSON.stringify(problems) },
      pains: problems,
      sources: [],
    });

    expect(result.resumo_factual.fatos.some((fact) => fact.campo === "pains")).toBe(false);
    expect(result.resumo_factual.texto).not.toContain('"title":"Poucas solicitações qualificadas"');
    expect(result.dores_decompostas).toHaveLength(problems.length);
  });

  it("declara ausência de fontes elegíveis quando não recebe fontes", () => {
    const result = analyzeMethodBrief({ values: {}, pains: [], sources: [] });

    expect(result.fontes_relacionadas).toEqual([]);
    expect(result.disponibilidade_de_fontes).toContain("Não há fonte relacionada elegível");
    expect(result.resumo_factual.texto).toContain("não contém campos textuais preenchidos");
    expect(result.lacunas_e_perguntas.length).toBeGreaterThan(0);
    expect(result.status).toContain("não aprovado nem validado");
  });
});

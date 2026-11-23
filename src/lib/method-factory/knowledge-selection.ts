import { PROBLEM_DOMAINS, type ProblemEntry } from "./brief-schema";

export const KNOWLEDGE_AREAS = [
  "Administração geral",
  "Estratégia empresarial",
  "Gestão organizacional",
  "Liderança",
  "Comportamento organizacional",
  "Gestão de pessoas e recursos humanos",
  "Finanças corporativas",
  "Contabilidade gerencial",
  "Marketing",
  "Gestão de operações",
  "Gestão de processos",
  "Logística e cadeia de suprimentos",
  "Empreendedorismo",
  "Inovação",
  "Transformação digital",
  "Tecnologia aplicada à gestão",
  "Economia empresarial",
  "Análise de dados e métodos quantitativos",
  "Governança corporativa",
  "Ética empresarial",
  "Gestão de mudanças",
  "Gestão de projetos",
  "Gestão de riscos",
  "Desenvolvimento organizacional",
  "Produtividade e desempenho empresarial",
] as const;

export const PROPOSED_CROSSCUTTING_AREAS = ["Sustentabilidade e impacto"] as const;

export const MATERIAL_TYPES = [
  "Currículos oficiais",
  "Catálogos de disciplinas",
  "Ementas e syllabi",
  "Bibliografias recomendadas",
  "Livros acadêmicos",
  "Artigos científicos",
  "Working papers",
  "Teses e dissertações",
  "Estudos de caso empresariais",
  "Relatórios de pesquisa",
  "Materiais de educação executiva",
  "Métodos e frameworks de gestão",
  "Ferramentas de diagnóstico empresarial",
  "Modelos de tomada de decisão",
  "Estudos de aplicação prática e resultados",
] as const;

export type KnowledgeArea = (typeof KNOWLEDGE_AREAS)[number];
export type ProposedCrosscuttingArea = (typeof PROPOSED_CROSSCUTTING_AREAS)[number];
export type MaterialType = (typeof MATERIAL_TYPES)[number];
type ProblemDomain = (typeof PROBLEM_DOMAINS)[number];

export const MATERIAL_PRIORITY = {
  primaryEvidence: [
    "Artigos científicos",
    "Relatórios de pesquisa",
    "Estudos de aplicação prática e resultados",
    "Livros acadêmicos",
    "Estudos de caso empresariais",
  ],
  methodDesignRequiresValidation: [
    "Métodos e frameworks de gestão",
    "Ferramentas de diagnóstico empresarial",
    "Modelos de tomada de decisão",
  ],
  contextualAndProvisional: [
    "Working papers",
    "Teses e dissertações",
    "Materiais de educação executiva",
  ],
  discoveryOnly: [
    "Currículos oficiais",
    "Catálogos de disciplinas",
    "Ementas e syllabi",
    "Bibliografias recomendadas",
  ],
} as const satisfies Record<string, readonly MaterialType[]>;

export interface ProblemKnowledgeMapping {
  problemDomain: ProblemDomain;
  candidateAreas: readonly KnowledgeArea[];
  conditionalAreas: readonly KnowledgeArea[];
  proposedCrosscuttingAreas: readonly ProposedCrosscuttingArea[];
  rationale: string;
}

export interface KnowledgeSelection {
  status: "Candidato taxonômico — nenhuma fonte pesquisada";
  mappings: ProblemKnowledgeMapping[];
  candidateAreas: KnowledgeArea[];
  conditionalAreas: KnowledgeArea[];
  proposedCrosscuttingAreas: ProposedCrosscuttingArea[];
  needsClarification: ProblemDomain[];
  materialPriority: typeof MATERIAL_PRIORITY;
  safeguards: string[];
}

const PROBLEM_TO_KNOWLEDGE: Partial<
  Record<ProblemDomain, Omit<ProblemKnowledgeMapping, "problemDomain">>
> = {
  "Comercial e vendas": {
    candidateAreas: [
      "Estratégia empresarial",
      "Marketing",
      "Produtividade e desempenho empresarial",
    ],
    conditionalAreas: ["Análise de dados e métodos quantitativos"],
    proposedCrosscuttingAreas: [],
    rationale:
      "Sugerir mercado, estratégia e desempenho; métodos quantitativos dependem de dados ou medição descritos.",
  },
  Finanças: {
    candidateAreas: ["Finanças corporativas", "Contabilidade gerencial"],
    conditionalAreas: ["Gestão de riscos", "Análise de dados e métodos quantitativos"],
    proposedCrosscuttingAreas: [],
    rationale:
      "Separar decisões financeiras de controle gerencial; risco e análise dependem do problema e dos dados descritos.",
  },
  "Marketing e publicidade": {
    candidateAreas: ["Marketing"],
    conditionalAreas: ["Análise de dados e métodos quantitativos"],
    proposedCrosscuttingAreas: [],
    rationale:
      "Usar marketing como eixo; métricas ou coordenação interna só entram quando descritas no problema.",
  },
  "Estratégia e modelo de negócio": {
    candidateAreas: ["Estratégia empresarial", "Administração geral"],
    conditionalAreas: ["Economia empresarial", "Empreendedorismo"],
    proposedCrosscuttingAreas: [],
    rationale:
      "Tratar administração geral como síntese; economia e empreendedorismo dependem do contexto de mercado ou de criação/validação de iniciativa.",
  },
  "Operações e processos": {
    candidateAreas: ["Gestão de operações", "Gestão de processos"],
    conditionalAreas: [
      "Produtividade e desempenho empresarial",
      "Logística e cadeia de suprimentos",
    ],
    proposedCrosscuttingAreas: [],
    rationale:
      "Mapear fluxo e processo; desempenho e cadeia de suprimentos dependem de métricas ou de fornecedores, estoque e logística mencionados.",
  },
  "Produto e tecnologia": {
    candidateAreas: ["Tecnologia aplicada à gestão"],
    conditionalAreas: [
      "Inovação",
      "Transformação digital",
      "Gestão de mudanças",
      "Gestão de projetos",
    ],
    proposedCrosscuttingAreas: [],
    rationale:
      "O domínio selecionado menciona produto/tecnologia; inovação, transformação, mudança e projeto só são priorizados se a descrição confirmar essa relação.",
  },
  "Dados e analytics": {
    candidateAreas: ["Análise de dados e métodos quantitativos"],
    conditionalAreas: [
      "Produtividade e desempenho empresarial",
      "Governança corporativa",
      "Ética empresarial",
      "Gestão de riscos",
    ],
    proposedCrosscuttingAreas: [],
    rationale:
      "Começar por definição, qualidade e uso da medida; controles adicionais dependem do tipo de dado e decisão descritos.",
  },
  "Experiência e sucesso do cliente": {
    candidateAreas: ["Marketing", "Gestão de processos"],
    conditionalAreas: [
      "Comportamento organizacional",
      "Gestão de operações",
      "Análise de dados e métodos quantitativos",
    ],
    proposedCrosscuttingAreas: [],
    rationale:
      "Conectar jornada e execução; equipes, capacidade ou métricas entram quando houver sinais no briefing.",
  },
  "Pessoas e organização": {
    candidateAreas: [
      "Gestão organizacional",
      "Liderança",
      "Comportamento organizacional",
      "Gestão de pessoas e recursos humanos",
    ],
    conditionalAreas: ["Desenvolvimento organizacional", "Gestão de mudanças"],
    proposedCrosscuttingAreas: [],
    rationale:
      "Sugerir desenho, liderança e práticas de pessoas; desenvolvimento e mudança dependem do tipo de transformação descrita.",
  },
  "Parcerias e ecossistema": {
    candidateAreas: ["Estratégia empresarial", "Gestão organizacional", "Governança corporativa"],
    conditionalAreas: ["Inovação", "Gestão de projetos"],
    proposedCrosscuttingAreas: [],
    rationale:
      "Mapear valor, papéis e decisões entre partes; inovação e projeto dependem do propósito da parceria.",
  },
  "Jurídico, risco e compliance": {
    candidateAreas: ["Gestão de riscos", "Governança corporativa", "Ética empresarial"],
    conditionalAreas: ["Gestão de processos"],
    proposedCrosscuttingAreas: [],
    rationale:
      "Usar risco, governança e ética como lentes; qualquer recomendação deve ser revisada por profissional competente e não substitui aconselhamento jurídico.",
  },
  "Sustentabilidade e impacto": {
    candidateAreas: ["Governança corporativa", "Ética empresarial", "Gestão de riscos"],
    conditionalAreas: [
      "Produtividade e desempenho empresarial",
      "Análise de dados e métodos quantitativos",
    ],
    proposedCrosscuttingAreas: ["Sustentabilidade e impacto"],
    rationale:
      "A lista original não tem essa área como item próprio; marcá-la como extensão proposta e manter governança/ética/risco como referências taxonômicas existentes.",
  },
};

const UNMAPPED_DOMAINS = new Set<ProblemDomain>(["Outro", "Ainda não sei"]);

function unique<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

export function selectKnowledgeForProblems(
  problems: readonly Pick<ProblemEntry, "domain">[],
): KnowledgeSelection {
  const mappings: ProblemKnowledgeMapping[] = [];
  const needsClarification: ProblemDomain[] = [];

  for (const problem of problems) {
    const domain = PROBLEM_DOMAINS.find((candidate) => candidate === problem.domain);
    if (!domain) continue;
    if (UNMAPPED_DOMAINS.has(domain)) {
      needsClarification.push(domain);
      continue;
    }

    const mapping = PROBLEM_TO_KNOWLEDGE[domain];
    if (mapping) mappings.push({ problemDomain: domain, ...mapping });
  }

  return {
    status: "Candidato taxonômico — nenhuma fonte pesquisada",
    mappings,
    candidateAreas: unique(mappings.flatMap(({ candidateAreas }) => candidateAreas)),
    conditionalAreas: unique(mappings.flatMap(({ conditionalAreas }) => conditionalAreas)).filter(
      (area) => !mappings.some(({ candidateAreas }) => candidateAreas.includes(area)),
    ),
    proposedCrosscuttingAreas: unique(
      mappings.flatMap(({ proposedCrosscuttingAreas }) => proposedCrosscuttingAreas),
    ),
    needsClarification: unique(needsClarification),
    materialPriority: MATERIAL_PRIORITY,
    safeguards: [
      "A seleção é uma hipótese de organização baseada somente nas áreas de problema informadas.",
      "Áreas condicionais são pistas para esclarecer, não fatos nem recomendações automáticas.",
      "Direitos devem ser aprovados por material e por finalidade; a confidencialidade interna não é licença.",
      "Referências apenas ou direitos pendentes não autorizam armazenamento ou processamento do conteúdo.",
      "Currículos, catálogos, ementas e bibliografias são para descoberta, não prova de eficácia.",
      "Nenhuma fonte real foi consultada; toda saída exige revisão humana.",
    ],
  };
}

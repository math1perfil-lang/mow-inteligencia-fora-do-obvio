import type { ProblemEntry, Values } from "./brief-schema";

export interface KnowledgeSource {
  id: string;
  title: string;
  canonical_url: string;
  domain_tags: readonly string[];
  rights_status: string;
  permitted_uses: readonly string[];
  restrictions?: string;
  reliability_note?: string;
}

/** Nome legado para compatibilidade com consumidores existentes. */
export type MethodFactorySource = KnowledgeSource;

export interface AnalysisInput {
  values: Values;
  pains: readonly ProblemEntry[];
  sources: readonly KnowledgeSource[];
}

export interface BriefingFact {
  campo: string;
  valor: string;
  atribuição: "Informado no briefing";
}

export interface DecomposedPain {
  índice: number;
  título: string;
  área: string;
  descrição: string;
  impacto_informado: string;
  prioridade_percebida: string;
  nota_de_medida: string;
}

export interface ClarificationQuestion {
  pergunta: string;
  motivo: string;
  relacionada_a?: string;
}

export interface ExplicitDependencySignal {
  regra: string;
  áreas: readonly [string, string];
  sinal: string;
  natureza: "Possível dependência a verificar; não é fato confirmado";
}

export interface RelatedSource {
  id: string;
  título: string;
  url_canônica: string;
  domínios_correspondentes: string[];
  status_de_direitos: string;
  usos_permitidos_declarados: string[];
  uso_interno_elegível: boolean;
  classificação:
    "Referência interna elegível" | "Referência apenas; uso não autorizado ou pendente";
  nota: string;
  restrições?: string;
  nota_de_confiabilidade?: string;
}

export interface MethodPlan {
  status: "Rascunho interno — não aprovado nem validado";
  objetivo: string;
  premissas: string[];
  limites: string[];
  passos: Array<{
    etapa: string;
    descrição: string;
    responsável_sugerido: string;
    instrumentos: string[];
  }>;
  adaptações_por_domínio: Array<{
    domínio: string;
    proposta: string;
    atribuição: "Proposta MOW; não atribuída a uma fonte";
  }>;
  métricas_e_definições: string[];
  riscos: string[];
  resultados_esperados: string[];
}

export interface MethodDraft extends MethodFactoryAnalysis {
  title: string;
  summary: string;
  hypotheses: Array<{
    text: string;
    label: "Hipótese — requer teste; não é fato";
    relatedPain: string;
  }>;
  clarificationQuestions: Array<{ question: string; reason: string; relatedTo?: string }>;
  steps: MethodPlan["passos"];
  citations: Array<{
    sourceId: string;
    locator: string | null;
    contributionNote: string;
    useType: "eligible_method_reference" | "reference_only";
  }>;
  limitations: string[];
  traceability: {
    inputPainCount: number;
    sourceIdsConsidered: string[];
    dependencyRulesApplied: string[];
    summaryAttribution: "Provided briefing; not independently verified";
    sourceContentConsulted: false;
    humanReviewRequired: true;
  };
}

export interface MethodFactoryAnalysis {
  version: 1;
  engine: "rules-v1";
  status: "Rascunho interno — não aprovado nem validado";
  resumo_factual: {
    atribuição: "Briefing fornecido; não verificado independentemente";
    texto: string;
    fatos: BriefingFact[];
  };
  dores_decompostas: DecomposedPain[];
  lacunas_e_perguntas: ClarificationQuestion[];
  hipóteses: Array<{
    texto: string;
    marca: "Hipótese — requer teste; não é fato";
    dor_relacionada: string;
  }>;
  sinais_de_dependência: ExplicitDependencySignal[];
  fontes_relacionadas: RelatedSource[];
  disponibilidade_de_fontes: string;
  rascunho_de_método: MethodPlan;
  limitações: string[];
}

const FIELD_LABELS: Readonly<Record<string, string>> = {
  company: "Empresa ou iniciativa",
  platformDescription: "Descrição da plataforma",
  businessModel: "Modelo de negócio",
  stage: "Estágio informado",
  userGroups: "Grupos de usuários informados",
  payer: "Pagador e valor informado",
  geography: "Região informada",
  desiredResult: "Resultado desejado informado",
  attempts: "Tentativas anteriores informadas",
  partnerTypes: "Tipos de parceiros informados",
  partnerValue: "Valor de parcerias informado",
  partnerDefinition: "Definição de sucesso de parceria informada",
  partnerBottleneck: "Gargalo de parceria informado",
  partnerMeasurement: "Medição de parcerias informada",
  partnerMetrics: "Métricas de parcerias informadas",
  partnerPeriod: "Período das métricas de parcerias informado",
  partnerUnit: "Unidade das métricas de parcerias informada",
  acquisitionChannels: "Canais de aquisição informados",
  activationEvent: "Evento de ativação informado",
  userMeasurement: "Medição de usuários informada",
  userMetrics: "Métricas de usuários informadas",
  userPeriod: "Período das métricas de usuários informado",
  userUnit: "Unidade das métricas de usuários informada",
  sourceLink: "Link de referência informado",
  materialsDescription: "Descrição de materiais informada",
  rightsStatus: "Status de direitos informado",
  rightsDetails: "Detalhes de direitos informados",
  constraints: "Restrições informadas",
  resources: "Recursos e dependências informados",
  horizon: "Horizonte informado",
  successCriteria: "Critérios de sucesso informados",
  restrictions: "Outras restrições informadas",
};

const KNOWN_DOMAINS = [
  "Comercial e vendas",
  "Finanças",
  "Marketing e publicidade",
  "Estratégia e modelo de negócio",
  "Operações e processos",
  "Produto e tecnologia",
  "Dados e analytics",
  "Experiência e sucesso do cliente",
  "Pessoas e organização",
  "Parcerias e ecossistema",
  "Jurídico, risco e compliance",
  "Sustentabilidade e impacto",
] as const;

const DEPENDENCY_RULES: ReadonlyArray<{
  id: string;
  domains: readonly [string, string];
  signal: string;
}> = [
  {
    id: "aquisição-conversão",
    domains: ["Marketing e publicidade", "Comercial e vendas"],
    signal:
      "Pode haver articulação entre atração e conversão; mapear o percurso e validar pontos de passagem e responsáveis.",
  },
  {
    id: "processo-tecnologia",
    domains: ["Operações e processos", "Produto e tecnologia"],
    signal:
      "Pode haver dependência entre o processo operacional e o suporte tecnológico; verificar etapas e ferramentas no mapeamento.",
  },
  {
    id: "jornada-operação",
    domains: ["Experiência e sucesso do cliente", "Operações e processos"],
    signal:
      "A experiência relatada e a execução operacional podem se relacionar; verificar a sequência da jornada antes de propor mudança.",
  },
  {
    id: "parceria-comercial",
    domains: ["Parcerias e ecossistema", "Comercial e vendas"],
    signal:
      "A gestão de parcerias e as atividades comerciais podem compartilhar etapas; confirmar o fluxo e os papéis envolvidos.",
  },
];

const ALLOWED_INTERNAL_USES = new Set([
  "análise interna",
  "analise interna",
  "analise_interna",
  "internal analysis",
  "internal-analysis",
  "internal_analysis",
  "análise",
  "analise",
  "analysis",
  "pesquisa interna",
  "internal research",
  "desenvolvimento de método",
  "desenvolvimento de metodo",
  "method development",
  "method-development",
]);

const ALLOWED_COMMERCIAL_USES = new Set([
  "uso comercial",
  "uso_comercial",
  "commercial use",
  "commercial-use",
  "commercial_use",
  "commercial",
]);

function normalize(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function unique(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = normalize(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isNonEmpty(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function makeFacts(values: Values): BriefingFact[] {
  return Object.entries(values)
    .filter((entry): entry is [string, string] => entry[0] !== "pains" && isNonEmpty(entry[1]))
    .map(([key, value]) => ({
      campo: FIELD_LABELS[key] ?? key,
      valor: value,
      atribuição: "Informado no briefing",
    }));
}

function decomposePain(problem: ProblemEntry, index: number): DecomposedPain {
  return {
    índice: index + 1,
    título: problem.title,
    área: problem.domain,
    descrição: problem.description,
    impacto_informado: problem.impact,
    prioridade_percebida: problem.urgency,
    nota_de_medida:
      "Prioridade percebida no briefing; não é frequência, severidade ou impacto medido.",
  };
}

function makeQuestions(values: Values, problems: readonly ProblemEntry[]): ClarificationQuestion[] {
  const questions: ClarificationQuestion[] = [];
  const askIfMissing = (key: string, question: string, reason: string) => {
    if (!isNonEmpty(values[key])) questions.push({ pergunta: question, motivo: reason });
  };

  askIfMissing(
    "desiredResult",
    "Que resultado observável deve mudar e para quem?",
    "O briefing não informou um resultado desejado específico.",
  );
  askIfMissing(
    "successCriteria",
    "Que critério acordado indicará avanço, sem presumir sucesso?",
    "Não há critério de sucesso informado.",
  );
  askIfMissing(
    "constraints",
    "Quais limites, atividades fora de escopo ou salvaguardas devem ser respeitados?",
    "Não há restrições registradas no campo correspondente.",
  );
  askIfMissing(
    "stage",
    "Em que estágio está a iniciativa no momento?",
    "O estágio não foi informado e pode afetar a viabilidade do teste.",
  );

  const hasPartnerPain = problems.some(
    (problem) => normalize(problem.domain) === normalize("Parcerias e ecossistema"),
  );
  const hasUserPain = problems.some((problem) =>
    [
      "Comercial e vendas",
      "Marketing e publicidade",
      "Experiência e sucesso do cliente",
      "Dados e analytics",
    ].some((domain) => normalize(problem.domain) === normalize(domain)),
  );
  if (hasPartnerPain) {
    if (!isNonEmpty(values["partnerMetrics"])) {
      questions.push({
        pergunta:
          "Que indicador agregado de parcerias pode ser definido para a linha de base, ou confirmam que ainda não há métrica?",
        motivo:
          "Não há métrica de parcerias descrita no briefing; não se presume que exista medição.",
        relacionada_a: "Parcerias e ecossistema",
      });
    }
    if (
      normalize(values["partnerMeasurement"] ?? "") === normalize("Temos dados agregados") &&
      !isNonEmpty(values["partnerPeriod"])
    ) {
      questions.push({
        pergunta: "A que período se referem os dados agregados de parcerias?",
        motivo: "O período é necessário para interpretar uma linha de base.",
        relacionada_a: "Parcerias e ecossistema",
      });
    }
  }
  if (hasUserPain) {
    if (!isNonEmpty(values["userMetrics"])) {
      questions.push({
        pergunta:
          "Que indicador agregado de aquisição, ativação ou uso pode ser definido para a linha de base, ou confirmam que ainda não há métrica?",
        motivo:
          "Não há métrica de usuários descrita no briefing; não se presume que exista medição.",
      });
    }
    if (
      normalize(values["userMeasurement"] ?? "") === normalize("Temos dados agregados") &&
      !isNonEmpty(values["userPeriod"])
    ) {
      questions.push({
        pergunta: "A que período se referem os dados agregados de usuários?",
        motivo: "O período é necessário para interpretar uma linha de base.",
      });
    }
  }
  if (problems.length === 0) {
    questions.push({
      pergunta: "Quais são de uma a vinte dores que devem ser analisadas?",
      motivo: "Nenhuma dor foi fornecida à função.",
    });
  }
  return questions;
}

function makeHypotheses(problems: readonly ProblemEntry[]) {
  return problems.map((problem) => ({
    texto: `Uma intervenção pequena, escolhida após mapear a dor “${problem.title}”, poderá alterar um indicador acordado; isso precisa ser testado e não é afirmado pelo briefing.`,
    marca: "Hipótese — requer teste; não é fato" as const,
    dor_relacionada: problem.title,
  }));
}

function makeDependencies(problems: readonly ProblemEntry[]): ExplicitDependencySignal[] {
  const domains = new Set(problems.map((problem) => normalize(problem.domain)));
  return DEPENDENCY_RULES.filter(
    (rule) => domains.has(normalize(rule.domains[0])) && domains.has(normalize(rule.domains[1])),
  ).map((rule) => ({
    regra: rule.id,
    áreas: rule.domains,
    sinal: rule.signal,
    natureza: "Possível dependência a verificar; não é fato confirmado",
  }));
}

function sourceMayBeUsedInternally(source: MethodFactorySource): boolean {
  const status = normalize(source.rights_status);
  const statusAllowsUse =
    status === normalize("Material próprio autorizado") ||
    status === normalize("Licença/autorização específica") ||
    status === normalize("Licença aberta") ||
    status === "material_proprio_autorizado" ||
    status === "autorizacao_especifica" ||
    status === "licenca_aberta" ||
    status === "dominio_publico_confirmado" ||
    status === "open license";
  const declaredUses = source.permitted_uses.map(normalize);
  const internalUseAllowed = declaredUses.some((use) => ALLOWED_INTERNAL_USES.has(use));
  const commercialUseAllowed = declaredUses.some((use) => ALLOWED_COMMERCIAL_USES.has(use));
  return (
    statusAllowsUse &&
    internalUseAllowed &&
    commercialUseAllowed &&
    !isNonEmpty(source.restrictions)
  );
}

function makeRelatedSources(
  sources: readonly MethodFactorySource[],
  problems: readonly ProblemEntry[],
): RelatedSource[] {
  const painDomains = new Set(problems.map((problem) => normalize(problem.domain)));
  return sources
    .map((source) => {
      const matchingDomains = unique(source.domain_tags).filter((tag) =>
        painDomains.has(normalize(tag)),
      );
      if (matchingDomains.length === 0) return undefined;
      const eligible = sourceMayBeUsedInternally(source);
      return {
        id: source.id,
        título: source.title,
        url_canônica: source.canonical_url,
        domínios_correspondentes: matchingDomains,
        status_de_direitos: source.rights_status,
        usos_permitidos_declarados: [...source.permitted_uses],
        uso_interno_elegível: eligible,
        classificação: eligible
          ? "Referência interna elegível"
          : "Referência apenas; uso não autorizado ou pendente",
        nota: eligible
          ? "Relação por metadados de domínio; não constitui evidência do caso nem validação do método. Nenhum conteúdo integral foi consultado."
          : "A fonte não constitui evidência do caso: referência de metadados apenas; consulta pública, direitos pendentes, uso declarado insuficiente ou restrição não autorizam processamento automático.",
        ...(isNonEmpty(source.restrictions) ? { restrições: source.restrictions } : {}),
        ...(isNonEmpty(source.reliability_note)
          ? { nota_de_confiabilidade: source.reliability_note }
          : {}),
      };
    })
    .filter((source): source is RelatedSource => source !== undefined);
}

function makeAdaptations(
  problems: readonly ProblemEntry[],
): MethodFactoryAnalysis["rascunho_de_método"]["adaptações_por_domínio"] {
  const domains = unique(problems.map((problem) => problem.domain));
  return domains
    .filter((domain) => KNOWN_DOMAINS.some((known) => normalize(known) === normalize(domain)))
    .map((domain) => {
      let proposal =
        "Definir com a equipe um evento observável do domínio e verificar sua sequência no mapeamento, sem presumir desempenho atual.";
      switch (normalize(domain)) {
        case normalize("Comercial e vendas"):
          proposal =
            "Proposta MOW: mapear etapas do funil comercial, critérios de passagem e perdas registradas, se houver; testar uma mudança em uma etapa delimitada.";
          break;
        case normalize("Finanças"):
          proposal =
            "Proposta MOW: definir unidade, período e regra de cálculo financeira com a pessoa responsável antes de comparar linha de base e teste.";
          break;
        case normalize("Marketing e publicidade"):
          proposal =
            "Proposta MOW: delimitar canal, público e evento de resposta; comparar apenas períodos ou grupos compatíveis e disponíveis.";
          break;
        case normalize("Operações e processos"):
          proposal =
            "Proposta MOW: desenhar etapas, entradas, saídas, esperas e retrabalho observável; testar uma alteração local sem presumir causa.";
          break;
        case normalize("Produto e tecnologia"):
          proposal =
            "Proposta MOW: escolher uma tarefa ou fluxo delimitado, instrumentar eventos mínimos e verificar privacidade antes de qualquer teste.";
          break;
        case normalize("Dados e analytics"):
          proposal =
            "Proposta MOW: acordar definição, origem, unidade, janela temporal e qualidade do indicador antes de estabelecer a linha de base.";
          break;
        case normalize("Experiência e sucesso do cliente"):
          proposal =
            "Proposta MOW: mapear uma jornada delimitada e combinar sinal comportamental agregado com feedback voluntário, sem identificar pessoas.";
          break;
        case normalize("Pessoas e organização"):
          proposal =
            "Proposta MOW: esclarecer papéis, carga de trabalho e participação voluntária; evitar métricas individuais ou uso punitivo.";
          break;
        case normalize("Parcerias e ecossistema"):
          proposal =
            "Proposta MOW: mapear contribuições, etapas e definições de parceria com dados agregados e autorização apropriada.";
          break;
        case normalize("Jurídico, risco e compliance"):
          proposal =
            "Proposta MOW: incluir revisão da pessoa responsável por risco/compliance como condição prévia, sem substituir orientação especializada.";
          break;
        case normalize("Sustentabilidade e impacto"):
          proposal =
            "Proposta MOW: acordar limite, unidade e fonte do indicador de impacto e explicitar efeitos indiretos a observar.";
          break;
        case normalize("Estratégia e modelo de negócio"):
          proposal =
            "Proposta MOW: explicitar o segmento e a hipótese de valor a testar; não interpretar intenção como demanda observada.";
          break;
      }
      return {
        domínio: domain,
        proposta: proposal,
        atribuição: "Proposta MOW; não atribuída a uma fonte" as const,
      };
    });
}

function makeMethod(values: Values, problems: readonly ProblemEntry[]): MethodPlan {
  const desiredResult = values["desiredResult"]?.trim();
  const uniqueDomains = unique(problems.map((problem) => problem.domain));
  const objective = desiredResult
    ? `Explorar, sem presumir sucesso, o resultado desejado informado: “${desiredResult}”.`
    : "Acordar com a equipe qual resultado observável vale explorar antes de selecionar a intervenção.";

  return {
    status: "Rascunho interno — não aprovado nem validado",
    objetivo: objective,
    premissas: [
      "O conteúdo fornecido no briefing é relato da parte solicitante, não verificação independente.",
      "A prioridade informada representa percepção; não representa medida de frequência, severidade ou impacto.",
      "Indicadores, eventos, período, unidade e critérios do teste serão acordados antes de medir.",
      "Qualquer intervenção requer responsável, autorização, salvaguardas e viabilidade confirmadas pela equipe.",
    ],
    limites: [
      "Não inferir causalidade a partir de uma comparação simples ou de dados incompletos.",
      "Não usar referências públicas ou de direitos pendentes como evidência do caso; não reproduzir conteúdo de fonte.",
      "Não incluir dados pessoais ou sensíveis; trabalhar com agregação e minimização de dados.",
      ...(isNonEmpty(values["constraints"])
        ? [`Limite informado no briefing: ${values["constraints"].trim()}`]
        : []),
      ...(isNonEmpty(values["restrictions"])
        ? [`Restrição informada no briefing: ${values["restrictions"].trim()}`]
        : []),
    ],
    passos: [
      {
        etapa: "1. Medir a linha de base",
        descrição:
          "Selecionar com a equipe um indicador observável, definir numerador/denominador quando aplicável, fonte, unidade e janela temporal; registrar a disponibilidade e limitações dos dados. Não há valores medidos presumidos nesta análise.",
        responsável_sugerido:
          "Pessoa responsável pela operação ou pelo indicador, com apoio de análise de dados quando disponível.",
        instrumentos: [
          "Ficha de definição do indicador",
          "Registro agregado existente ou contagem manual autorizada",
          "Registro de período e limitações",
        ],
      },
      {
        etapa: "2. Mapear processo ou jornada",
        descrição: `Descrever etapas, atores por papel, entradas, saídas, esperas e pontos de decisão relacionados às dores informadas${uniqueDomains.length ? ` nas áreas: ${uniqueDomains.join(", ")}` : ""}; validar o mapa com pessoas envolvidas, sem atribuir causas não observadas.`,
        responsável_sugerido:
          "Facilitador de processos ou pesquisa, com representantes voluntários das áreas envolvidas.",
        instrumentos: [
          "Mapa de processo ou jornada",
          "Roteiro de observação/entrevista sem dados identificáveis",
          "Registro de hipóteses e evidências separadas",
        ],
      },
      {
        etapa: "3. Testar uma intervenção pequena",
        descrição:
          "Escolher uma mudança reversível e delimitada com a equipe; pré-definir público/escopo, duração, salvaguardas, indicador e critério de interrupção. Não executar antes das autorizações necessárias.",
        responsável_sugerido:
          "Responsável operacional pela área-piloto, com aprovação da pessoa patrocinadora e das funções de risco pertinentes.",
        instrumentos: [
          "Plano de teste curto",
          "Lista de verificação de autorização e riscos",
          "Registro agregado de execução",
        ],
      },
      {
        etapa: "4. Avaliar e decidir",
        descrição:
          "Comparar observações com a linha de base considerando janela, unidade, cobertura e fatores concorrentes; registrar incertezas e decidir continuar, ajustar ou interromper. Não declarar causalidade sem desenho apropriado.",
        responsável_sugerido:
          "Pessoa responsável pelo indicador e facilitador, com revisão humana da equipe solicitante.",
        instrumentos: [
          "Quadro antes/durante/depois com definições iguais",
          "Registro de limitações e desvios",
          "Revisão humana da decisão",
        ],
      },
    ],
    adaptações_por_domínio: makeAdaptations(problems),
    métricas_e_definições: [
      "Linha de base: indicador acordado por domínio e período, medido antes da intervenção; o briefing não fornece valores medidos por esta função.",
      "Taxa (se aplicável): contagem de eventos que atendem à definição acordada ÷ contagem elegível no mesmo período × 100; definir evento, elegibilidade, unidade e fonte antes de usar.",
      "Tempo (se aplicável): diferença entre horário de início e fim de uma etapa definida; especificar unidade e tratamento de casos incompletos.",
      "Critério de avaliação: comparar com o critério de sucesso informado ou acordado antes do teste; distinguir observação, percepção e hipótese.",
    ],
    riscos: [
      "Tratar prioridade percebida como resultado medido ou usar métricas sem unidade, período ou definição consistente.",
      "Selecionar uma mudança sem entender dependências do processo ou sem participação das pessoas afetadas.",
      "Exposição de dados pessoais, acesso ou uso incompatível com direitos e autorizações.",
      "Viés de seleção, variação temporal e fatores concorrentes podem limitar a interpretação do teste.",
      "Amostra pequena ou ausência de dados pode impedir conclusão; registrar isso em vez de preencher lacunas por suposição.",
    ],
    resultados_esperados: [
      "Definições acordadas de indicador e linha de base, ou registro explícito de que os dados não estão disponíveis.",
      "Mapa validado de processo/jornada e lista separada de fatos informados, lacunas e hipóteses.",
      "Registro do teste pequeno, das salvaguardas e da comparação observada, sem promessa de melhoria.",
      "Decisão documentada de continuar, ajustar ou interromper, sujeita a revisão humana.",
    ],
  };
}

/**
 * Produz um rascunho interno reproduzível somente a partir do briefing e de
 * metadados de fontes. Não busca, abre nem reproduz o conteúdo das referências.
 */
export function analyzeMethodBrief(input: AnalysisInput): MethodFactoryAnalysis {
  const facts = makeFacts(input.values);
  const summaryText = facts.length
    ? facts.map((fact) => `${fact.campo}: ${fact.valor}`).join("; ")
    : "O briefing não contém campos textuais preenchidos. Nenhum fato contextual foi acrescentado.";
  const relatedSources = makeRelatedSources(input.sources, input.pains);
  const hasEligibleSource = relatedSources.some((source) => source.uso_interno_elegível);

  return {
    version: 1,
    engine: "rules-v1",
    status: "Rascunho interno — não aprovado nem validado",
    resumo_factual: {
      atribuição: "Briefing fornecido; não verificado independentemente",
      texto: summaryText,
      fatos: facts,
    },
    dores_decompostas: input.pains.map(decomposePain),
    lacunas_e_perguntas: makeQuestions(input.values, input.pains),
    hipóteses: makeHypotheses(input.pains),
    sinais_de_dependência: makeDependencies(input.pains),
    fontes_relacionadas: relatedSources,
    disponibilidade_de_fontes: hasEligibleSource
      ? "Há fontes relacionadas por domínio cujos metadados declaram status e uso interno elegíveis. São referências de metadados, não evidência do caso nem validação do método."
      : "Não há fonte relacionada elegível para uso interno por domínio com os metadados recebidos; referências apenas ou direitos pendentes não foram usadas como conteúdo ou evidência do caso.",
    rascunho_de_método: makeMethod(input.values, input.pains),
    limitações: [
      "Versão determinística baseada em regras explícitas e metadados; não realiza compreensão semântica por LLM.",
      "Não consulta o conteúdo integral das referências; domínio, título, URL e declarações de direitos são tratados somente como metadados fornecidos.",
      "Não confirma direitos, confiabilidade, fatos do briefing, relações causais ou disponibilidade dos dados de forma independente.",
      "As relações entre áreas só são sinalizadas para pares cobertos por regras explícitas; ausência de sinal não prova ausência de dependência.",
      "Todo resultado é rascunho interno e exige revisão humana antes de uso ou execução; não é aprovado nem validado.",
    ],
  };
}

/**
 * Adaptador estável para integração: os nomes de propriedades em inglês são
 * aliases JSON-serializáveis dos campos detalhados em português abaixo.
 */
export function generateMethodDraft(input: AnalysisInput): MethodDraft {
  const analysis = analyzeMethodBrief(input);
  const company = input.values["company"]?.trim();
  return {
    ...analysis,
    title: company ? `Rascunho de método — ${company}` : "Rascunho interno de método",
    summary: analysis.resumo_factual.texto,
    hypotheses: analysis.hipóteses.map((hypothesis) => ({
      text: hypothesis.texto,
      label: "Hipótese — requer teste; não é fato",
      relatedPain: hypothesis.dor_relacionada,
    })),
    clarificationQuestions: analysis.lacunas_e_perguntas.map((item) => ({
      question: item.pergunta,
      reason: item.motivo,
      ...(item.relacionada_a ? { relatedTo: item.relacionada_a } : {}),
    })),
    steps: analysis.rascunho_de_método.passos,
    citations: analysis.fontes_relacionadas.map((source) => ({
      sourceId: source.id,
      locator: null,
      contributionNote:
        "Correspondência de domínio por metadados apenas; nenhum conteúdo da fonte foi consultado nem usado como evidência do caso.",
      useType: source.uso_interno_elegível ? "eligible_method_reference" : "reference_only",
    })),
    limitations: analysis.limitações,
    traceability: {
      inputPainCount: input.pains.length,
      sourceIdsConsidered: input.sources.map((source) => source.id),
      dependencyRulesApplied: analysis.sinais_de_dependência.map((signal) => signal.regra),
      summaryAttribution: "Provided briefing; not independently verified",
      sourceContentConsulted: false,
      humanReviewRequired: true,
    },
  };
}

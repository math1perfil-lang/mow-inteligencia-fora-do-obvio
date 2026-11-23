export type AreaId =
  | "vendas"
  | "marketing"
  | "atendimento"
  | "rh"
  | "financeiro"
  | "operacoes"
  | "gestao"
  | "dados";

export interface Area {
  id: AreaId;
  name: string;
  /** Tarefa recorrente real da área, usada nos exemplos e tarefas. */
  tarefa: string;
  /** Estudo de caso curto (fictício) da área. */
  caso: string;
  indicadores: string[];
  /** Modelo de prompt com [campos] para o aluno preencher. */
  template: string;
  /** Projeto final da trilha. */
  entrega: string;
  /** O que NUNCA colar na IA nesta área. */
  sensivel: string;
  /** Palavras que indicam aderência do prompt à área. */
  palavras: string[];
}

export const AREAS: Area[] = [
  {
    id: "vendas",
    name: "Vendas e Pré-vendas",
    tarefa: "preparar uma proposta comercial e a abordagem para um prospect",
    caso: "Uma distribuidora fictícia perde 40% das propostas por falta de follow-up estruturado e por propostas genéricas.",
    indicadores: [
      "Taxa de conversão de propostas",
      "Tempo de resposta ao lead",
      "Ciclo médio de venda",
    ],
    template:
      "Papel: você é um consultor de vendas B2B.\nContexto: vendo [produto/serviço] para [segmento do cliente]; o cliente fictício tem [dor principal].\nTarefa: elabore uma proposta de uma página e 3 perguntas de descoberta.\nFormato: título, problema, solução, próximos passos, em tópicos.\nCritérios: tom consultivo, sem prometer resultados que não possam ser comprovados.\nRevisão: liste o que preciso validar com o cliente antes de enviar.",
    entrega: "Sistema de prompts de vendas: prospecção, proposta, follow-up e objeções",
    sensivel: "dados pessoais de leads, preços negociados e contratos de clientes",
    palavras: [
      "lead",
      "proposta",
      "cliente",
      "prospect",
      "venda",
      "vendas",
      "objeção",
      "follow-up",
      "funil",
      "comercial",
    ],
  },
  {
    id: "marketing",
    name: "Marketing e Conteúdo",
    tarefa: "planejar e produzir conteúdo para uma campanha",
    caso: "Um time fictício publica muito, mas sem padrão de tom e sem ligação com metas de geração de demanda.",
    indicadores: ["Alcance e engajamento", "Leads gerados por campanha", "Custo por lead"],
    template:
      "Papel: você é estrategista de conteúdo.\nContexto: marca [nome fictício] do setor [setor], público [persona], objetivo [meta da campanha].\nTarefa: proponha um calendário de 2 semanas com 3 formatos de conteúdo.\nFormato: tabela com data, canal, tema, chamada para ação.\nCritérios: tom [tom de voz], sem afirmações que precisem de fonte sem indicá-la.\nRevisão: marque o que precisa de checagem de fatos.",
    entrega: "Sistema de prompts de marketing: pauta, copy, revisão de tom e relatório de campanha",
    sensivel:
      "listas de contatos, dados de campanhas ainda não públicas e imagens com direitos de terceiros",
    palavras: [
      "campanha",
      "conteúdo",
      "público",
      "persona",
      "canal",
      "tom",
      "marca",
      "engajamento",
      "copy",
      "post",
    ],
  },
  {
    id: "atendimento",
    name: "Atendimento e Suporte",
    tarefa: "responder clientes com clareza e padronizar respostas recorrentes",
    caso: "Um suporte fictício repete as mesmas 20 dúvidas e o tempo de primeira resposta passa de 6 horas.",
    indicadores: [
      "Tempo de primeira resposta",
      "Resolução no primeiro contato",
      "Satisfação (CSAT)",
    ],
    template:
      "Papel: você é analista de suporte sênior.\nContexto: produto [produto fictício]; a dúvida frequente é [dúvida]; o cliente está [estado emocional].\nTarefa: escreva uma resposta empática e um passo a passo de solução.\nFormato: saudação, solução em até 5 passos, encerramento.\nCritérios: linguagem simples, sem prometer prazos que eu não confirmei.\nRevisão: aponte quando o caso deve ser escalado a um humano.",
    entrega: "Sistema de prompts de atendimento: respostas-modelo, triagem e escalonamento",
    sensivel: "nome, documento, contato e histórico individual de clientes",
    palavras: [
      "cliente",
      "chamado",
      "ticket",
      "resposta",
      "suporte",
      "atendimento",
      "escalar",
      "solução",
      "dúvida",
      "satisfação",
    ],
  },
  {
    id: "rh",
    name: "RH e Gestão de Pessoas",
    tarefa: "descrever vagas, estruturar entrevistas e comunicar com o time",
    caso: "Um RH fictício demora para abrir vagas porque cada descrição é escrita do zero e sem critérios claros.",
    indicadores: ["Tempo de contratação", "Qualidade da triagem", "Engajamento do time"],
    template:
      "Papel: você é especialista em recrutamento.\nContexto: vaga de [cargo] em [área], nível [nível], competências [lista].\nTarefa: monte a descrição da vaga e um roteiro de entrevista por competências.\nFormato: seções de responsabilidades, requisitos, perguntas e critérios de avaliação.\nCritérios: linguagem inclusiva e sem critérios discriminatórios.\nRevisão: indique o que deve ser validado com o gestor e com o jurídico.",
    entrega: "Sistema de prompts de RH: vagas, roteiros, feedbacks e comunicados",
    sensivel:
      "dados de candidatos e colaboradores, avaliações individuais e informações de saúde ou remuneração",
    palavras: [
      "vaga",
      "candidato",
      "entrevista",
      "competência",
      "colaborador",
      "time",
      "onboarding",
      "feedback",
      "cargo",
      "talento",
    ],
  },
  {
    id: "financeiro",
    name: "Financeiro e Controladoria",
    tarefa: "explicar variações, organizar fechamentos e preparar relatórios gerenciais",
    caso: "Uma controladoria fictícia gasta 3 dias por mês explicando variações de despesas para a diretoria.",
    indicadores: [
      "Tempo de fechamento",
      "Precisão do orçamento",
      "Desvio entre previsto e realizado",
    ],
    template:
      "Papel: você é analista de controladoria.\nContexto: despesas fictícias de [centro de custo] com variação de [percentual] frente ao orçado.\nTarefa: estruture a explicação da variação em fatos, hipóteses e recomendações.\nFormato: resumo executivo de 5 linhas e tabela com causa, evidência necessária e ação.\nCritérios: não inventar números; marque o que depende de confirmação.\nRevisão: liste as conferências que preciso fazer nos lançamentos antes de apresentar.",
    entrega:
      "Sistema de prompts financeiros: análise de variação, relatório gerencial e checklist de fechamento",
    sensivel:
      "dados financeiros reais não publicados, contas bancárias e informações de clientes ou fornecedores",
    palavras: [
      "variação",
      "orçamento",
      "despesa",
      "receita",
      "fechamento",
      "caixa",
      "custo",
      "relatório",
      "previsto",
      "realizado",
    ],
  },
  {
    id: "operacoes",
    name: "Operações e Logística",
    tarefa: "mapear processos, escrever procedimentos e reduzir retrabalho",
    caso: "Uma operação fictícia tem entregas atrasadas porque cada turno executa o processo de um jeito.",
    indicadores: ["Prazo de entrega (OTIF)", "Retrabalho", "Tempo de ciclo do processo"],
    template:
      "Papel: você é analista de processos.\nContexto: processo de [nome do processo] com as etapas atuais [etapas] e o problema [gargalo].\nTarefa: mapeie o processo, aponte gargalos e proponha um procedimento padrão (SOP).\nFormato: lista numerada de etapas com responsável, entrada, saída e controle.\nCritérios: etapas verificáveis, sem jargões.\nRevisão: indique o que precisa ser testado em campo antes de padronizar.",
    entrega: "Sistema de prompts de operações: mapeamento, SOP, checklist e análise de causa",
    sensivel:
      "dados de fornecedores, contratos logísticos e informações de segurança de instalações",
    palavras: [
      "processo",
      "etapa",
      "entrega",
      "gargalo",
      "sop",
      "procedimento",
      "turno",
      "estoque",
      "retrabalho",
      "prazo",
    ],
  },
  {
    id: "gestao",
    name: "Gestão, Liderança e Projetos",
    tarefa: "planejar projetos, alinhar prioridades e conduzir reuniões",
    caso: "Um gestor fictício abre a semana com 14 prioridades e nenhuma decisão registrada nas reuniões.",
    indicadores: ["Entregas no prazo", "Decisões registradas", "Bloqueios resolvidos por semana"],
    template:
      "Papel: você é um assistente de gestão de projetos.\nContexto: projeto [nome fictício] com prazo [data], equipe de [N] pessoas e riscos [lista].\nTarefa: monte um plano de ação para 4 semanas com responsáveis e marcos.\nFormato: tabela com ação, responsável, prazo e critério de pronto.\nCritérios: priorize por impacto e esforço; destaque dependências.\nRevisão: liste as premissas que preciso confirmar com a equipe.",
    entrega:
      "Sistema de prompts de gestão: planos de ação, atas, priorização e comunicação de decisões",
    sensivel: "avaliações de desempenho, decisões estratégicas não divulgadas e dados de pessoas",
    palavras: [
      "projeto",
      "prioridade",
      "equipe",
      "marco",
      "prazo",
      "decisão",
      "reunião",
      "risco",
      "plano",
      "entrega",
    ],
  },
  {
    id: "dados",
    name: "Dados, BI e Análise de Negócios",
    tarefa: "interpretar dados, validar hipóteses e comunicar insights",
    caso: "Um time de BI fictício entrega dashboards, mas as áreas não sabem qual decisão cada gráfico apoia.",
    indicadores: [
      "Decisões apoiadas por análise",
      "Tempo para entregar uma análise",
      "Confiabilidade dos dados",
    ],
    template:
      "Papel: você é analista de dados sênior.\nContexto: conjunto de dados fictício de [tema] com colunas [colunas] e a pergunta de negócio [pergunta].\nTarefa: proponha o plano de análise, as hipóteses e como validá-las.\nFormato: passos numerados, métricas, riscos de viés e como comunicar o resultado.\nCritérios: separe fatos, hipóteses e recomendações; não conclua sem evidência.\nRevisão: liste as verificações de qualidade dos dados antes da análise.",
    entrega:
      "Sistema de prompts de dados: plano de análise, validação de hipóteses, narrativa de insights",
    sensivel:
      "bases com dados pessoais, dados de clientes identificáveis e métricas internas confidenciais",
    palavras: [
      "dados",
      "métrica",
      "hipótese",
      "análise",
      "indicador",
      "dashboard",
      "coluna",
      "tendência",
      "insight",
      "amostra",
    ],
  },
];

export const AREA_BY_ID: Record<AreaId, Area> = Object.fromEntries(
  AREAS.map((a) => [a.id, a]),
) as Record<AreaId, Area>;

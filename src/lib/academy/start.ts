import type { AreaId } from "./areas";

/** Conteúdo do Módulo Start (antigo Módulo 0) — MOW Academy · IA Corporativa. */

export const START_STEPS = [
  "Boas-vindas",
  "Como funciona",
  "Diagnóstico",
  "Escolha da trilha",
  "Fundamentos",
  "Onde a IA ajuda",
  "Framework PACTO",
  "Mini-desafio",
  "Primeiro prompt",
  "Feedback",
  "Perfil de Uso de IA",
  "Checklist",
] as const;

export const WELCOME_GOALS = [
  "Criar prompts claros, completos e reutilizáveis.",
  "Usar IA para tarefas reais da sua área.",
  "Organizar reuniões, tarefas, relatórios e decisões.",
  "Produzir e-mails, apresentações, análises e documentos com mais qualidade.",
  "Analisar informações e gerar insights com responsabilidade.",
  "Melhorar atendimento, vendas, marketing, RH, operações e gestão.",
  "Proteger dados confidenciais.",
  "Validar respostas antes de usá-las.",
  "Criar uma biblioteca pessoal de prompts.",
  "Construir seu Sistema de Prompts Corporativo.",
];

export const NOT_THIS_COURSE = [
  "Um curso apenas de “prompts prontos”.",
  "Um curso técnico de programação.",
  "Um curso sobre substituir pessoas por IA.",
  "Um curso que ensina a confiar cegamente em respostas de IA.",
  "Um curso genérico, sem aplicação prática.",
];

export const JOURNEY: [string, string][] = [
  ["Diagnóstico", "Entender seu perfil, área e objetivos"],
  ["Trilha personalizada", "Adaptar exemplos e tarefas à sua realidade"],
  ["Aulas curtas", "Explicar conceitos de forma prática"],
  ["Tarefas", "Aplicar o aprendizado ao trabalho real"],
  ["Feedback", "Avaliar e melhorar suas entregas"],
  ["Biblioteca de prompts", "Guardar prompts úteis e reutilizáveis"],
  ["Progresso", "Acompanhar sua evolução"],
  ["Projeto final", "Criar seu Sistema de Prompts Corporativo"],
];

/* ------------------------------- diagnóstico ------------------------------ */

export type DiagQuestion = {
  id: string;
  q: string;
  type: "single" | "multi" | "text";
  options?: string[];
  required?: boolean;
};

export const AREA_OPTIONS: { label: string; id: AreaId | "outra" }[] = [
  { label: "Vendas e Pré-vendas", id: "vendas" },
  { label: "Marketing e Conteúdo", id: "marketing" },
  { label: "Atendimento e Suporte", id: "atendimento" },
  { label: "RH e Gestão de Pessoas", id: "rh" },
  { label: "Financeiro e Controladoria", id: "financeiro" },
  { label: "Operações e Logística", id: "operacoes" },
  { label: "Gestão, Liderança e Projetos", id: "gestao" },
  { label: "Dados, BI e Análise de Negócios", id: "dados" },
  { label: "Outra", id: "outra" },
];

export const NIVEL_OPTIONS = [
  "Nunca usei IA no trabalho.",
  "Já usei, mas de forma básica.",
  "Uso com frequência, mas sem método.",
  "Uso com método e quero avançar.",
];

export const DIAG: DiagQuestion[] = [
  {
    id: "area",
    q: "Em qual área você atua principalmente?",
    type: "single",
    options: AREA_OPTIONS.map((a) => a.label),
    required: true,
  },
  { id: "cargo", q: "Qual é o seu cargo ou função atual?", type: "text", required: true },
  {
    id: "nivel",
    q: "Qual é o seu nível de experiência com IA?",
    type: "single",
    options: NIVEL_OPTIONS,
    required: true,
  },
  {
    id: "ferramentas",
    q: "Quais ferramentas de IA você já utiliza?",
    type: "multi",
    options: ["ChatGPT", "Claude", "Gemini", "Microsoft Copilot", "Perplexity", "Outra", "Nenhuma"],
    required: true,
  },
  {
    id: "objetivo",
    q: "Qual é o seu principal objetivo com IA?",
    type: "single",
    options: [
      "Aumentar produtividade.",
      "Melhorar a qualidade das entregas.",
      "Acelerar vendas.",
      "Melhorar atendimento.",
      "Organizar rotinas.",
      "Analisar dados.",
      "Apoiar decisões.",
      "Reduzir retrabalho.",
      "Automatizar tarefas.",
    ],
    required: true,
  },
  { id: "tarefas", q: "Quais tarefas você gostaria de acelerar ou melhorar com IA?", type: "text" },
  {
    id: "entregas",
    q: "Quais entregas você produz com mais frequência?",
    type: "multi",
    options: [
      "E-mails",
      "Relatórios",
      "Apresentações",
      "Planos de ação",
      "Propostas comerciais",
      "Análises",
      "Atas de reunião",
      "Documentos internos",
      "Respostas a clientes",
      "Outras",
    ],
  },
  {
    id: "rotina",
    q: "Qual é o seu tipo de rotina?",
    type: "single",
    options: [
      "Operacional: execução de tarefas e processos.",
      "Analítica: análise de dados, indicadores e informações.",
      "De liderança: gestão de pessoas, prioridades e decisões.",
      "Estratégica: planejamento, posicionamento e decisões de negócio.",
    ],
  },
  { id: "indicadores", q: "Quais indicadores são importantes no seu trabalho?", type: "text" },
  {
    id: "sensivel",
    q: "Quais informações você não pode compartilhar com ferramentas de IA?",
    type: "text",
  },
  { id: "desafios", q: "Quais são os seus maiores desafios hoje?", type: "text" },
  {
    id: "usa",
    q: "Você já usa IA em alguma tarefa do trabalho?",
    type: "single",
    options: [
      "Sim, com frequência.",
      "Sim, ocasionalmente.",
      "Já testei, mas não uso regularmente.",
      "Ainda não uso.",
    ],
  },
];

/* --------------------------------- trilhas -------------------------------- */

export interface Trilha {
  id: AreaId;
  n: number;
  nome: string;
  descricao: string;
  tarefas: string[];
  exemplos: string[];
  indicadores: string[];
  projeto: string;
  importante?: string;
  papel: string;
  exemploPrompt: string;
}

export const TRILHAS: Trilha[] = [
  {
    id: "vendas",
    n: 1,
    nome: "Vendas e Pré-vendas",
    descricao:
      "Para profissionais que atuam em prospecção, vendas, pré-vendas, relacionamento comercial, contas, parcerias ou crescimento de receita.",
    tarefas: [
      "Prospecção de clientes.",
      "Qualificação de leads.",
      "Preparação de reuniões comerciais.",
      "Criação de propostas.",
      "Follow-up.",
      "Análise de pipeline.",
      "Resposta a objeções.",
    ],
    exemplos: [
      "Criar e-mails de prospecção personalizados.",
      "Analisar conversas e identificar objeções.",
      "Preparar roteiros de reunião.",
      "Criar resumos de propostas.",
      "Priorizar oportunidades do pipeline.",
    ],
    indicadores: [
      "Conversão.",
      "Tempo de ciclo comercial.",
      "Taxa de resposta.",
      "Número de reuniões agendadas.",
      "Receita gerada.",
      "Taxa de fechamento.",
    ],
    projeto:
      "Criar um Kit Comercial com IA, incluindo persona, proposta, sequência de e-mails, objeções e follow-up.",
    papel: "consultor comercial sênior",
    exemploPrompt: `Papel: Atue como consultor comercial sênior.

Ação: Crie um e-mail de primeiro contato para um potencial cliente.

Contexto:
- Empresa: [nome]
- Produto ou serviço: [descrição]
- Público-alvo: [descrição]
- Principal benefício: [benefício]

Tom: Profissional, consultivo e objetivo.

Output:
- Assunto
- Corpo do e-mail
- Chamada para ação

Restrições:
- Não invente informações.
- Máximo de 150 palavras.`,
  },
  {
    id: "marketing",
    n: 2,
    nome: "Marketing e Conteúdo",
    descricao:
      "Para profissionais de marketing, conteúdo, branding, comunicação, growth, mídia paga e relacionamento com público.",
    tarefas: [
      "Criação de conteúdo.",
      "Planejamento de campanhas.",
      "Análise de concorrentes.",
      "Criação de personas.",
      "Escrita de e-mails.",
      "Planejamento editorial.",
      "Análise de desempenho.",
    ],
    exemplos: [
      "Criar ideias de conteúdo.",
      "Adaptar textos para diferentes canais.",
      "Criar calendário editorial.",
      "Analisar concorrentes.",
      "Criar campanhas e anúncios.",
    ],
    indicadores: [
      "Alcance.",
      "Engajamento.",
      "Conversão.",
      "Leads gerados.",
      "Tráfego.",
      "Custo por lead.",
    ],
    projeto: "Criar um Plano de Conteúdo e Campanhas com IA para um produto, serviço ou marca.",
    papel: "estrategista de conteúdo",
    exemploPrompt: `Papel: Atue como estrategista de conteúdo.

Ação: Crie cinco ideias de posts para LinkedIn sobre [tema].

Contexto:
- Público-alvo: [descrição]
- Objetivo: [objetivo]
- Tom da marca: [tom]

Tom: Profissional, claro e envolvente.

Output:
- Cinco ideias de posts
- Para cada ideia: título, gancho, estrutura e chamada para ação

Restrições:
- Não use clichês.
- Não invente dados.`,
  },
  {
    id: "atendimento",
    n: 3,
    nome: "Atendimento e Suporte",
    descricao:
      "Para profissionais de atendimento, suporte, customer success, relacionamento com cliente e operações de serviço.",
    tarefas: [
      "Responder solicitações.",
      "Classificar tickets.",
      "Criar respostas padrão.",
      "Analisar reclamações.",
      "Criar FAQs.",
      "Melhorar jornada do cliente.",
    ],
    exemplos: [
      "Classificar solicitações.",
      "Criar respostas empáticas.",
      "Resumir histórico de atendimento.",
      "Identificar temas recorrentes.",
      "Criar FAQs e macros.",
    ],
    indicadores: [
      "Tempo de primeira resposta.",
      "Tempo de resolução.",
      "Taxa de resolução no primeiro contato.",
      "Satisfação do cliente.",
      "Volume de tickets.",
      "Retrabalho.",
    ],
    projeto:
      "Criar um Kit de Atendimento com IA, incluindo triagem, respostas, FAQs e análise de reclamações.",
    papel: "especialista em atendimento ao cliente",
    exemploPrompt: `Papel: Atue como especialista em atendimento ao cliente.

Ação: Crie uma resposta empática para a solicitação abaixo.

Contexto:
- Situação: [descrição]
- Cliente: [perfil]
- Solução disponível: [informação]
- Próximo passo: [informação]

Tom: Empático, claro e profissional.

Output:
- Resposta pronta para envio
- Tom empático
- Próximo passo claro

Restrições:
- Não prometa soluções que não existem.
- Não invente informações.`,
  },
  {
    id: "rh",
    n: 4,
    nome: "RH e Gestão de Pessoas",
    descricao:
      "Para profissionais de RH, recrutamento, desenvolvimento, cultura, treinamento e gestão de pessoas.",
    tarefas: [
      "Criar vagas.",
      "Triar currículos.",
      "Preparar entrevistas.",
      "Criar treinamentos.",
      "Dar feedback.",
      "Comunicar mudanças internas.",
    ],
    exemplos: [
      "Estruturar descrições de vagas.",
      "Criar roteiros de entrevista.",
      "Preparar planos de desenvolvimento.",
      "Organizar feedback.",
      "Criar materiais de treinamento.",
    ],
    indicadores: [
      "Tempo de contratação.",
      "Qualidade da contratação.",
      "Retenção.",
      "Engajamento.",
      "Satisfação do colaborador.",
      "Conclusão de treinamentos.",
    ],
    projeto: "Criar um Kit de Recrutamento e Desenvolvimento com IA.",
    importante:
      "A IA pode ajudar a organizar informações, mas não deve decidir sozinha sobre contratações, demissões, avaliações de desempenho ou decisões que afetem pessoas.",
    papel: "analista de RH",
    exemploPrompt: `Papel: Atue como analista de RH.

Ação: Estruture uma descrição de vaga para a posição abaixo.

Contexto:
- Cargo: [cargo]
- Área: [área]
- Principais responsabilidades: [informação]
- Requisitos: [informação]

Tom: Profissional, claro e inclusivo.

Output:
- Título da vaga
- Responsabilidades
- Requisitos
- Diferenciais
- Informações sobre a empresa

Restrições:
- Não use linguagem discriminatória.
- Não invente requisitos.`,
  },
  {
    id: "financeiro",
    n: 5,
    nome: "Financeiro e Controladoria",
    descricao:
      "Para profissionais de financeiro, controladoria, contabilidade, tesouraria, planejamento financeiro e análise de custos.",
    tarefas: [
      "Análise de custos.",
      "Relatórios financeiros.",
      "Fluxo de caixa.",
      "Conciliação.",
      "Análise de indicadores.",
      "Apresentações gerenciais.",
    ],
    exemplos: [
      "Resumir relatórios financeiros.",
      "Identificar variações relevantes.",
      "Estruturar análises de custo.",
      "Criar resumos executivos.",
      "Preparar apresentações para diretoria.",
    ],
    indicadores: [
      "Margem.",
      "Custos.",
      "Fluxo de caixa.",
      "Inadimplência.",
      "Rentabilidade.",
      "Prazo de recebimento.",
    ],
    projeto: "Criar um Relatório Executivo Financeiro com IA.",
    importante:
      "A IA pode apoiar a análise, mas não substitui validação contábil, financeira, tributária ou jurídica.",
    papel: "analista financeiro sênior",
    exemploPrompt: `Papel: Atue como analista financeiro sênior.

Ação: Resuma o relatório financeiro abaixo e destaque riscos e oportunidades.

Contexto:
- Período: [período]
- Área: [área]
- Indicadores prioritários: [informação]

Tom: Executivo, objetivo e analítico.

Output:
- Resumo executivo
- Principais variações
- Riscos
- Oportunidades
- Recomendações

Restrições:
- Use apenas os dados fornecidos.
- Não invente números.`,
  },
  {
    id: "operacoes",
    n: 6,
    nome: "Operações e Logística",
    descricao:
      "Para profissionais de operações, supply chain, logística, produção, qualidade, facilities e melhoria contínua.",
    tarefas: [
      "Mapear processos.",
      "Criar procedimentos.",
      "Analisar gargalos.",
      "Controlar indicadores.",
      "Criar checklists.",
      "Melhorar rotinas.",
    ],
    exemplos: [
      "Mapear processos.",
      "Criar SOPs.",
      "Identificar gargalos.",
      "Criar planos de melhoria.",
      "Organizar indicadores operacionais.",
    ],
    indicadores: [
      "Prazo.",
      "Produtividade.",
      "Custo operacional.",
      "Qualidade.",
      "Retrabalho.",
      "Disponibilidade.",
    ],
    projeto: "Criar um Plano de Melhoria de Processo com IA.",
    papel: "consultor de processos",
    exemploPrompt: `Papel: Atue como consultor de processos.

Ação: Mapeie o processo abaixo e identifique gargalos e oportunidades de melhoria.

Contexto:
- Processo: [descrição]
- Etapas atuais: [informação]
- Problemas identificados: [informação]

Tom: Objetivo, prático e orientado a melhoria.

Output:
- Fluxo atual
- Gargalos
- Oportunidades
- Plano de ação

Restrições:
- Não invente etapas.
- Use apenas as informações fornecidas.`,
  },
  {
    id: "gestao",
    n: 7,
    nome: "Gestão, Liderança e Projetos",
    descricao:
      "Para gestores, líderes, coordenadores, gerentes de projeto e profissionais responsáveis por times, decisões e resultados.",
    tarefas: [
      "Conduzir reuniões.",
      "Definir prioridades.",
      "Criar planos de ação.",
      "Acompanhar indicadores.",
      "Comunicar decisões.",
      "Gerenciar projetos.",
    ],
    exemplos: [
      "Criar pautas de reunião.",
      "Transformar anotações em ata.",
      "Criar planos de ação.",
      "Preparar relatórios de status.",
      "Organizar decisões e responsáveis.",
    ],
    indicadores: [
      "Cumprimento de prazos.",
      "Progresso de projetos.",
      "Produtividade do time.",
      "Qualidade das entregas.",
      "Engajamento.",
      "Resultado estratégico.",
    ],
    projeto: "Criar um Sistema de Gestão Semanal com IA.",
    papel: "facilitador executivo",
    exemploPrompt: `Papel: Atue como facilitador executivo.

Ação: Transforme as anotações abaixo em ata, decisões e plano de ação.

Contexto:
- Reunião: [tema]
- Participantes: [nomes ou funções]
- Objetivo: [objetivo]

Tom: Profissional, claro e objetivo.

Output:
- Resumo da reunião
- Decisões
- Responsáveis
- Prazos
- Próximos passos

Restrições:
- Não invente decisões.
- Use apenas as informações fornecidas.`,
  },
  {
    id: "dados",
    n: 8,
    nome: "Dados, BI e Análise de Negócios",
    descricao:
      "Para profissionais de dados, BI, analytics, planejamento, pesquisa, inteligência de mercado e análise de negócios.",
    tarefas: [
      "Analisar bases.",
      "Criar relatórios.",
      "Identificar tendências.",
      "Criar dashboards.",
      "Gerar insights.",
      "Apoiar decisões.",
    ],
    exemplos: [
      "Limpar e organizar dados.",
      "Identificar padrões.",
      "Criar hipóteses de análise.",
      "Resumir relatórios.",
      "Criar recomendações baseadas em evidências.",
    ],
    indicadores: [
      "Receita.",
      "Conversão.",
      "Retenção.",
      "Custo.",
      "Produtividade.",
      "Qualidade dos dados.",
    ],
    projeto: "Criar um Relatório Executivo com IA a partir de uma base ou relatório real.",
    importante:
      "A IA pode ajudar a interpretar dados, mas não substitui validação estatística, qualidade dos dados e análise crítica.",
    papel: "analista de dados",
    exemploPrompt: `Papel: Atue como analista de dados.

Ação: Analise a base abaixo e proponha três hipóteses de negócio.

Contexto:
- Objetivo da análise: [objetivo]
- Período: [período]
- Indicadores prioritários: [informação]

Tom: Analítico, objetivo e executivo.

Output:
- Resumo dos dados
- Três hipóteses
- Evidências disponíveis
- Próximas análises recomendadas

Restrições:
- Não invente dados.
- Diferencie fatos de hipóteses.`,
  },
];

export const TRILHA_BY_ID = Object.fromEntries(TRILHAS.map((t) => [t.id, t])) as Record<
  AreaId,
  Trilha
>;

/* ------------------------------- fundamentos ------------------------------ */

export interface Fundamento {
  id: string;
  titulo: string;
  corpo: string[];
  lista?: string[];
  codigo?: { rotulo: string; texto: string }[];
  regra?: string;
  check: { q: string; options: string[]; answer: number; why: string };
}

export const FUNDAMENTOS: Fundamento[] = [
  {
    id: "ia-generativa",
    titulo: "O que é IA generativa",
    corpo: [
      "IA generativa é uma tecnologia capaz de criar conteúdos — como textos, imagens, códigos, áudios ou vídeos — a partir de instruções fornecidas por uma pessoa.",
      "No contexto corporativo, a IA generativa é especialmente útil para tarefas que envolvem linguagem, organização, análise e criação de primeiras versões.",
      "Ela pode ajudar você a:",
    ],
    lista: [
      "Escrever e revisar textos.",
      "Resumir documentos.",
      "Organizar ideias.",
      "Criar rascunhos.",
      "Analisar informações.",
      "Classificar demandas.",
      "Preparar reuniões.",
      "Criar planos.",
      "Gerar hipóteses.",
    ],
    check: {
      q: "Em que tipo de tarefa a IA generativa é especialmente útil no trabalho?",
      options: [
        "Tarefas de linguagem, organização, análise e criação de primeiras versões.",
        "Substituir a decisão final de contratações.",
        "Garantir que todo número esteja correto sem conferência.",
      ],
      answer: 0,
      why: "Ela é forte em linguagem e organização. A decisão e a conferência continuam humanas.",
    },
  },
  {
    id: "prompt",
    titulo: "O que é um prompt",
    corpo: [
      "Um prompt é a instrução que você entrega à IA para orientar a resposta que ela deve produzir.",
      "Um prompt pode ser simples, mas esse tipo de pedido costuma gerar uma resposta genérica. Um prompt profissional é mais completo.",
    ],
    codigo: [
      { rotulo: "Prompt simples", texto: "Escreva um e-mail para um cliente." },
      {
        rotulo: "Prompt profissional",
        texto: `Atue como consultor comercial sênior.

Escreva um e-mail de follow-up para um cliente que participou de uma reunião comercial há três dias.

Contexto:
- Empresa: [nome da empresa]
- Produto ou serviço apresentado: [descrição]
- Principal interesse do cliente: [informação]
- Objeção levantada: [informação]
- Próximo passo desejado: agendar reunião de alinhamento

Tom: profissional, consultivo e objetivo.

Formato:
- Assunto
- Corpo do e-mail
- Chamada para ação final

Restrições:
- Não prometa condições comerciais.
- Não invente informações.
- Máximo de 150 palavras.`,
      },
    ],
    check: {
      q: "Por que o prompt profissional costuma funcionar melhor que o simples?",
      options: [
        "Porque é mais longo, independente do conteúdo.",
        "Porque traz papel, contexto, formato e restrições que orientam a resposta.",
        "Porque usa palavras técnicas.",
      ],
      answer: 1,
      why: "Não é o tamanho: são as informações que reduzem a chance de uma resposta genérica.",
    },
  },
  {
    id: "contexto",
    titulo: "O que é contexto",
    corpo: [
      "Contexto é o conjunto de informações que ajuda a IA a entender a tarefa.",
      "Quanto mais relevante for o contexto, maior a chance de a resposta ser útil. Contexto pode incluir:",
    ],
    lista: [
      "Objetivo da tarefa.",
      "Público-alvo.",
      "Empresa ou área.",
      "Produto ou serviço.",
      "Restrições.",
      "Dados disponíveis.",
      "Tom desejado.",
      "Formato esperado.",
      "Critérios de qualidade.",
    ],
    check: {
      q: "Qual afirmação sobre contexto está correta?",
      options: [
        "Quanto mais informação, melhor — mesmo irrelevante.",
        "Quanto mais relevante o contexto, maior a chance de uma resposta útil.",
        "Contexto só importa em tarefas de análise de dados.",
      ],
      answer: 1,
      why: "A palavra-chave é relevante: informação que ajuda a entender a tarefa.",
    },
  },
  {
    id: "alucinacao",
    titulo: "O que é alucinação",
    corpo: [
      "Alucinação é quando a IA produz uma informação incorreta, inventada ou sem base real, mas a apresenta com aparência de verdade.",
      "Por exemplo, ela pode citar uma estatística, uma norma, uma data, uma cláusula contratual ou um dado de mercado que não existe ou está desatualizado.",
    ],
    regra: "Sempre valide informações críticas antes de usá-las.",
    check: {
      q: "A IA citou uma estatística que parece perfeita para o seu relatório. O que fazer?",
      options: [
        "Usar, pois a resposta foi bem escrita.",
        "Validar a fonte e o número antes de usar.",
        "Pedir à própria IA se ela tem certeza e usar a resposta.",
      ],
      answer: 1,
      why: "A aparência de verdade não é prova. Dados críticos exigem fonte verificável.",
    },
  },
  {
    id: "vies",
    titulo: "O que é viés",
    corpo: [
      "Viés é uma distorção que pode aparecer nas respostas da IA, muitas vezes refletindo padrões presentes nos dados usados para treiná-la.",
      "Isso é especialmente importante em temas como:",
    ],
    lista: [
      "Contratação.",
      "Avaliação de pessoas.",
      "Diversidade.",
      "Perfil de clientes.",
      "Decisões sensíveis.",
      "Comunicação pública.",
    ],
    regra: "Revise recomendações que envolvam pessoas, decisões sensíveis ou generalizações.",
    check: {
      q: "Em qual situação o risco de viés exige mais atenção?",
      options: [
        "Corrigir a ortografia de um texto interno.",
        "Recomendação sobre quem contratar ou promover.",
        "Formatar uma tabela.",
      ],
      answer: 1,
      why: "Decisões sobre pessoas podem reproduzir distorções e afetam direitos e oportunidades.",
    },
  },
  {
    id: "dado-sensivel",
    titulo: "O que é dado sensível",
    corpo: [
      "Dado sensível é qualquer informação que possa identificar uma pessoa ou expor informações confidenciais de uma empresa.",
      "Exemplos:",
    ],
    lista: [
      "Nome completo.",
      "CPF.",
      "Endereço.",
      "Telefone.",
      "E-mail pessoal.",
      "Dados bancários.",
      "Informações de saúde.",
      "Salário.",
      "Avaliações de desempenho.",
      "Contratos confidenciais.",
      "Estratégias comerciais.",
      "Dados de clientes.",
    ],
    regra:
      "Não insira dados sensíveis em ferramentas de IA sem autorização e sem conhecer as políticas de privacidade e segurança da ferramenta.",
    check: {
      q: "Qual alternativa é mais segura para treinar um prompt?",
      options: [
        "Colar o contrato real do cliente.",
        "Usar um exemplo fictício ou anonimizado.",
        "Colar a planilha de salários do time.",
      ],
      answer: 1,
      why: "Dados fictícios ou anonimizados permitem praticar sem expor ninguém.",
    },
  },
  {
    id: "revisao-humana",
    titulo: "O que é revisão humana",
    corpo: [
      "Revisão humana é a verificação feita por uma pessoa antes de usar uma resposta gerada por IA.",
      "A IA pode ajudar a criar, organizar e acelerar. Mas a responsabilidade final pela qualidade, veracidade e adequação da entrega é humana.",
    ],
    regra: "Use IA como apoio, não como substituta do seu julgamento.",
    check: {
      q: "Quem responde pela qualidade final de uma entrega feita com apoio de IA?",
      options: ["A ferramenta de IA.", "O profissional que usa e entrega o conteúdo.", "Ninguém."],
      answer: 1,
      why: "A responsabilidade final é sempre humana.",
    },
  },
];

/* ---------------------------- onde a IA ajuda ----------------------------- */

export const IA_AJUDA: [string, string][] = [
  ["Redigir e-mails", "Cria rascunhos, ajusta tom e melhora clareza"],
  ["Resumir documentos", "Extrai pontos principais e organiza informações"],
  ["Preparar reuniões", "Cria pautas, roteiros e planos de ação"],
  ["Analisar feedbacks", "Identifica temas, padrões e oportunidades"],
  ["Criar conteúdo", "Gera ideias, estruturas e primeiras versões"],
  ["Organizar processos", "Cria checklists, SOPs e fluxos"],
  ["Analisar dados", "Levanta hipóteses e organiza insights"],
  ["Preparar apresentações", "Estrutura mensagens, tópicos e narrativas"],
  ["Padronizar respostas", "Cria macros, FAQs e modelos"],
  ["Apoiar decisões", "Organiza opções, riscos e critérios"],
];

export const IA_NAO_DECIDE = [
  "Contratação ou demissão.",
  "Avaliação de desempenho.",
  "Decisões financeiras críticas.",
  "Análises jurídicas definitivas.",
  "Comunicação de crise.",
  "Decisões sobre saúde ou segurança.",
  "Uso de dados pessoais ou sensíveis.",
  "Decisões estratégicas de alto impacto.",
];

/* ---------------------------------- PACTO --------------------------------- */

export const PACTO: { letra: string; nome: string; pergunta: string; detalhe: string }[] = [
  {
    letra: "P",
    nome: "Papel",
    pergunta: "Quem a IA deve ser?",
    detalhe:
      "Exemplo: analista financeiro sênior, consultor comercial, especialista em atendimento, redator corporativo, analista de dados.",
  },
  {
    letra: "A",
    nome: "Ação",
    pergunta: "O que ela deve fazer?",
    detalhe:
      "Exemplo: analisar, resumir, criar, revisar, comparar, classificar, estruturar ou planejar.",
  },
  {
    letra: "C",
    nome: "Contexto",
    pergunta: "Quais informações ela precisa receber?",
    detalhe: "Informações necessárias para a IA entender a tarefa.",
  },
  {
    letra: "T",
    nome: "Tom",
    pergunta: "Como deve soar a resposta?",
    detalhe: "Como a resposta deve soar para o público que vai lê-la.",
  },
  {
    letra: "O",
    nome: "Output",
    pergunta: "Qual deve ser o formato da entrega?",
    detalhe: "Formato da entrega: tabela, tópicos, e-mail, resumo executivo.",
  },
];

export const PACTO_EXEMPLO = `Papel: Atue como analista de vendas sênior.

Ação: Analise o pipeline abaixo e identifique as três oportunidades com maior probabilidade de fechamento.

Contexto:
- Empresa B2B.
- Ciclo médio de vendas de 45 dias.
- Foco em contratos anuais.
- Público-alvo: médias empresas.

Tom: Direto, executivo e orientado a decisão.

Output:
- Tabela com oportunidade, risco, próxima ação e prioridade.
- Resumo executivo com recomendações.`;

/* ------------------------------- mini-desafio ----------------------------- */

export const MINI_OPCOES = [
  "IA pode apoiar, com revisão humana.",
  "IA não deve decidir sozinha.",
  "IA pode apoiar, mas exige validação de fontes.",
  "IA não deve receber essas informações.",
];

export const MINI_SITUACOES: { texto: string; correta: number; porque: string }[] = [
  {
    texto: "Redigir um e-mail de follow-up para um cliente.",
    correta: 0,
    porque:
      "A IA pode criar uma primeira versão do e-mail, mas o profissional deve revisar informações, tom, promessas e dados do cliente.",
  },
  {
    texto: "Decidir a demissão de um colaborador.",
    correta: 1,
    porque:
      "Decisões que afetam pessoas exigem análise humana, contexto interno, critérios éticos, políticas da empresa e responsabilidade legal.",
  },
  {
    texto: "Resumir uma reunião e criar uma ata.",
    correta: 0,
    porque:
      "A IA pode organizar anotações e extrair decisões, mas o responsável deve revisar nomes, decisões, prazos e responsabilidades.",
  },
  {
    texto: "Analisar um contrato e indicar riscos jurídicos.",
    correta: 2,
    porque:
      "A IA pode ajudar a organizar cláusulas e levantar pontos de atenção, mas a análise jurídica definitiva deve ser feita por um profissional qualificado.",
  },
  {
    texto: "Criar ideias de campanha para uma nova oferta.",
    correta: 0,
    porque:
      "A IA pode gerar ideias e estruturas, mas a estratégia, a marca e a mensagem final devem ser validadas pela equipe.",
  },
  {
    texto: "Aprovar uma contratação com base apenas em uma análise de IA.",
    correta: 1,
    porque:
      "Contratações exigem avaliação humana, contexto, critérios justos e responsabilidade da empresa.",
  },
  {
    texto: "Organizar um plano de ação a partir das decisões de uma reunião.",
    correta: 0,
    porque:
      "A IA pode estruturar o plano, mas o gestor deve validar prioridades, prazos e responsáveis.",
  },
  {
    texto: "Inserir dados pessoais de clientes em uma ferramenta de IA sem autorização.",
    correta: 3,
    porque:
      "Dados pessoais e confidenciais só devem ser usados quando houver autorização, base legal e políticas de segurança adequadas.",
  },
];

/* ------------------------------ primeiro prompt --------------------------- */

export const TAREFAS_PROMPT = [
  "Redigir um e-mail profissional.",
  "Preparar uma reunião.",
  "Resumir um documento.",
  "Analisar um feedback.",
  "Criar um plano de ação.",
  "Organizar um processo.",
  "Criar um conteúdo.",
  "Analisar um relatório.",
  "Preparar uma proposta.",
  "Responder a um cliente.",
  "Outra tarefa.",
];

export const MODELO_PROMPT = `Papel: Atue como [função especializada].

Ação: [o que a IA deve fazer].

Contexto:
- [informação relevante 1]
- [informação relevante 2]
- [informação relevante 3]

Tom: [tom desejado].

Output: [formato da entrega].

Restrições:
- Não invente informações.
- Use apenas os dados fornecidos.
- [outras restrições].`;

/* -------------------------------- avaliação ------------------------------- */

export type StartTier = "Excelente" | "Bom, com ajustes" | "Precisa melhorar" | "Precisa refazer";

export const START_CRITERIA = [
  { id: "clareza", label: "Clareza", pergunta: "O objetivo está claro?", peso: 20 },
  { id: "papel", label: "Papel", pergunta: "O papel da IA está definido?", peso: 15 },
  { id: "contexto", label: "Contexto", pergunta: "Há informações suficientes?", peso: 20 },
  { id: "formato", label: "Formato", pergunta: "O formato da entrega está definido?", peso: 15 },
  {
    id: "restricoes",
    label: "Restrições",
    pergunta: "Há limites e regras de segurança?",
    peso: 15,
  },
  {
    id: "aplicabilidade",
    label: "Aplicabilidade",
    pergunta: "O prompt resolve uma tarefa real?",
    peso: 15,
  },
] as const;

export type StartCriterionId = (typeof START_CRITERIA)[number]["id"];

export const FEEDBACK_MODELOS: Record<StartTier, string> = {
  Excelente:
    "Excelente trabalho. Seu prompt está claro, estruturado e aplicável à sua área. Ele define o papel da IA, o objetivo, o contexto, o formato e as restrições necessárias. Agora, teste o prompt com uma situação real e salve a melhor versão na sua biblioteca.",
  "Bom, com ajustes":
    "Bom trabalho. Seu prompt já tem uma base sólida. Para melhorar, adicione mais contexto, defina o formato de saída e inclua restrições claras. Também vale especificar o público-alvo e os critérios de qualidade esperados.",
  "Precisa melhorar":
    "Seu prompt precisa de mais estrutura. Defina claramente o papel da IA, a ação esperada, o contexto, o tom, o formato da entrega e as restrições. Evite pedidos genéricos como “faça uma análise” ou “escreva um texto”.",
  "Precisa refazer":
    "Este prompt ainda está muito genérico. Refaça-o usando o framework PACTO. Comece definindo quem a IA deve ser, o que ela deve fazer, quais informações ela precisa receber, como deve soar a resposta e qual deve ser o formato da entrega.",
};

export interface StartEvaluation {
  /** 0 a 100, ponderado pelos pesos. */
  total: number;
  tier: StartTier;
  items: { id: StartCriterionId; label: string; peso: number; score: number; note: string }[];
  fortes: string[];
  melhorar: string[];
  sugestoes: string[];
  melhorado: string;
  avisos: string[];
}

const PLACEHOLDER = /\[[^\]]{1,80}\]/g;
const RX = {
  papel: /(papel\s*:|atue como|aja como|voc[eê] [eé] (um|uma)|na fun[cç][aã]o de)/i,
  acao: /(a[cç][aã]o\s*:|\b(crie|analise|resuma|escreva|redija|revise|compare|classifique|estruture|planeje|elabore|organize|mapeie|transforme|liste|proponha|identifique|prepare|responda)\b)/i,
  contexto:
    /(contexto\s*:|p[uú]blico|empresa|cliente|per[ií]odo|objetivo|situa[cç][aã]o|produto|processo)/i,
  tom: /(tom\s*:|tom de|linguagem|estilo)/i,
  formato:
    /(output\s*:|formato\s*:|formato de|tabela|t[oó]picos|resumo executivo|assunto|lista|passos|entrega\s*:)/i,
  restricoes:
    /(restri[cç][oõ]es?\s*:|n[aã]o invente|use apenas|apenas (os )?dados|m[aá]ximo de|n[aã]o prometa|n[aã]o use|evite|diferencie fatos)/i,
  seguranca:
    /(n[aã]o invente|use apenas|apenas (os )?dados|dados fict[ií]cios|sem dados pessoais|n[aã]o inclua dados)/i,
};

const SENSIVEL: [RegExp, string][] = [
  [/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/, "Parece haver um CPF no texto."],
  [/[\w.+-]+@[\w-]+\.[\w.-]+/, "Parece haver um e-mail no texto."],
  [/\(?\b\d{2}\)?\s?9?\d{4}-?\d{4}\b/, "Parece haver um telefone no texto."],
  [/\b(senha|password|token|chave de api)\s*[:=]/i, "Parece haver credenciais no texto."],
];

const clamp = (n: number) => Math.max(0, Math.min(10, n));

export function evaluateStart(
  prompt: string,
  opts: { palavras?: string[]; papelSugerido?: string },
): StartEvaluation {
  const text = prompt.trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const placeholders = (text.match(PLACEHOLDER) ?? []).length;
  const bullets = (text.match(/^\s*[-•*]\s+\S/gm) ?? []).length;
  const avisos = SENSIVEL.filter(([rx]) => rx.test(text)).map(([, m]) => m);
  const low = text.toLowerCase();
  const areaHits = (opts.palavras ?? []).filter((p) => low.includes(p.toLowerCase())).length;

  const hasPapel = RX.papel.test(text);
  const hasAcao = RX.acao.test(text);
  const hasContexto = RX.contexto.test(text);
  const hasTom = RX.tom.test(text);
  const hasFormato = RX.formato.test(text);
  const hasRestr = RX.restricoes.test(text);
  const hasSeg = RX.seguranca.test(text);

  const raw: Record<StartCriterionId, { score: number; note: string }> = {
    clareza: {
      score: clamp(
        (hasAcao ? 5 : 1) + (words >= 25 ? 3 : words >= 12 ? 1.5 : 0) + (hasTom ? 2 : 0),
      ),
      note: hasAcao
        ? "A ação pedida à IA aparece no texto."
        : "Não ficou claro o que a IA deve fazer. Comece por um verbo: analise, resuma, crie.",
    },
    papel: {
      score: hasPapel ? 10 : 0,
      note: hasPapel
        ? "O papel da IA está definido."
        : `Defina quem a IA deve ser, por exemplo: “Atue como ${opts.papelSugerido ?? "especialista da sua área"}”.`,
    },
    contexto: {
      score: clamp(
        (hasContexto ? 3 : 0) +
          Math.min(4, bullets * 1.3) +
          (words >= 60 ? 3 : words >= 35 ? 1.5 : 0),
      ),
      note:
        bullets >= 3 && words >= 35
          ? "Há contexto em tópicos, o que ajuda a IA a entender a tarefa."
          : "Adicione contexto: público, objetivo, dados disponíveis e critérios de qualidade, em tópicos.",
    },
    formato: {
      score: hasFormato ? (/(output|formato)\s*:/i.test(text) ? 10 : 7) : 0,
      note: hasFormato
        ? "O formato da entrega foi indicado."
        : "Defina o formato da entrega: tabela, tópicos, e-mail pronto, resumo executivo.",
    },
    restricoes: {
      score: clamp((hasRestr ? 6 : 0) + (hasSeg ? 4 : 0)),
      note: hasRestr
        ? "Há limites e regras de segurança."
        : "Inclua restrições: “Não invente informações”, “Use apenas os dados fornecidos”, limite de tamanho.",
    },
    aplicabilidade: {
      score: clamp(
        (words >= 30 ? 4 : 1) +
          Math.min(4, areaHits * 2) +
          (placeholders === 0 ? 2 : placeholders <= 2 ? 1 : 0) -
          (avisos.length ? 3 : 0),
      ),
      note:
        placeholders > 2
          ? "Ainda há muitos campos [entre colchetes] sem preencher. Troque por dados reais (fictícios ou anonimizados)."
          : areaHits > 0
            ? "O prompt usa vocabulário da sua área e parece resolver uma tarefa real."
            : "Aproxime o prompt de uma tarefa real da sua rotina, citando termos e entregas da sua área.",
    },
  };

  const items = START_CRITERIA.map((c) => ({
    id: c.id,
    label: c.label,
    peso: c.peso,
    score: Math.round(raw[c.id].score * 10) / 10,
    note: raw[c.id].note,
  }));
  const bruto = Math.round(items.reduce((acc, i) => acc + (i.score / 10) * i.peso, 0));
  // Modelo com campos [entre colchetes] ainda não preenchidos não pode passar de "Precisa melhorar".
  const total = placeholders >= 3 ? Math.min(bruto, 60) : bruto;
  const tier: StartTier =
    total >= 85
      ? "Excelente"
      : total >= 65
        ? "Bom, com ajustes"
        : total >= 40
          ? "Precisa melhorar"
          : "Precisa refazer";

  const fortes = items.filter((i) => i.score >= 8).map((i) => `${i.label}: ${i.note}`);
  const fracos = items.filter((i) => i.score < 6);
  const melhorar = fracos.map((i) => `${i.label}: ${i.note}`);
  const sugestoes: string[] = [];
  if (!hasTom) sugestoes.push("Inclua uma linha “Tom:” para orientar a voz da resposta.");
  if (!/revis|valide|confira|fonte/i.test(text))
    sugestoes.push("Peça à IA que liste o que você deve revisar ou validar antes de usar.");
  if (placeholders > 0)
    sugestoes.push(
      "Troque os campos [entre colchetes] por informações reais, sem dados sensíveis.",
    );
  if (!sugestoes.length)
    sugestoes.push("Teste o prompt com uma situação real e ajuste o que sair genérico.");
  if (avisos.length)
    sugestoes.unshift("Remova dados pessoais ou credenciais e use exemplos fictícios.");

  const pre = hasPapel
    ? ""
    : `Papel: Atue como ${opts.papelSugerido ?? "especialista da sua área"}.\n\n`;
  const extra: string[] = [];
  if (!hasTom) extra.push("Tom: Profissional, claro e objetivo.");
  if (!hasFormato)
    extra.push("Output:\n- Resumo executivo\n- Pontos de atenção\n- Próximos passos");
  if (!hasRestr)
    extra.push(
      "Restrições:\n- Não invente informações.\n- Use apenas os dados fornecidos.\n- Liste o que devo revisar antes de usar.",
    );
  const melhorado = `${pre}${text}${extra.length ? `\n\n${extra.join("\n\n")}` : ""}`;

  return { total, tier, items, fortes, melhorar, sugestoes, melhorado, avisos };
}

/* ----------------------------- perfil de uso de IA ------------------------- */

export interface StartDiag {
  [id: string]: string | string[] | undefined;
}

const asText = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v.join(", ") : (v ?? "").toString().trim();

export function buildPerfil(args: { diag: StartDiag; trilha: Trilha; prompt: string }): string {
  const { diag, trilha, prompt } = args;
  const ferr = asText(diag["ferramentas"]) || "Nenhuma";
  const regras = [
    "Não inserir dados pessoais, confidenciais ou estratégicos sem autorização.",
    "Revisar respostas antes de usar.",
    "Não tratar a IA como fonte definitiva de verdade.",
    "Pedir fontes quando a tarefa envolver pesquisa.",
    "Manter revisão humana em decisões sensíveis.",
  ];
  const linhas = [
    "MEU PERFIL DE USO DE IA",
    "",
    `Área de atuação: ${trilha.nome}`,
    `Cargo ou função: ${asText(diag["cargo"]) || "—"}`,
    `Nível de experiência: ${asText(diag["nivel"]) || "—"}`,
    `Ferramenta principal: ${ferr.split(",")[0]!.trim()}`,
    `Objetivo principal: ${asText(diag["objetivo"]) || "—"}`,
    `Trilha recomendada: ${trilha.nome} — projeto final: ${trilha.projeto}`,
    `Tarefas prioritárias: ${asText(diag["tarefas"]) || trilha.tarefas.slice(0, 3).join(" ")}`,
    `Entregas frequentes: ${asText(diag["entregas"]) || "—"}`,
    `Tipo de rotina: ${asText(diag["rotina"]) || "—"}`,
    `Indicadores importantes: ${asText(diag["indicadores"]) || trilha.indicadores.slice(0, 3).join(" ")}`,
    `Informações que não posso compartilhar: ${asText(diag["sensivel"]) || "A definir com a política da minha empresa."}`,
    `Principais desafios: ${asText(diag["desafios"]) || "—"}`,
    `Oportunidades de uso de IA: ${trilha.exemplos.slice(0, 3).join(" ")}`,
    `Primeiro prompt criado: ${prompt.trim().split("\n")[0] ?? "—"}…`,
    `Regras de segurança: ${regras.join(" ")}`,
    "Próximo passo: Iniciar o Módulo 1 — Fundamentos de IA Corporativa.",
  ];
  return linhas.join("\n");
}

/* --------------------------------- checklist ------------------------------- */

export const CHECKLIST = [
  "Concluí o diagnóstico.",
  "Escolhi minha trilha.",
  "Entendi os fundamentos de IA corporativa.",
  "Entendi o framework PACTO.",
  "Completei o mini-desafio.",
  "Criei meu primeiro prompt.",
  "Recebi feedback sobre meu prompt.",
  "Gerei meu Perfil de Uso de IA.",
  "Defini minhas regras de segurança.",
  "Estou pronto para iniciar o Módulo 1.",
];

export const REGRAS_SEGURANCA = [
  "Não inserir dados pessoais, confidenciais ou estratégicos sem autorização.",
  "Revisar respostas antes de usar.",
  "Não tratar IA como fonte definitiva de verdade.",
  "Pedir fontes quando a tarefa envolver pesquisa.",
  "Separar fatos, opiniões, hipóteses e recomendações.",
  "Manter revisão humana em decisões sensíveis.",
  "Não delegar decisões sensíveis à IA.",
  "Usar IA como apoio, não como substituta do julgamento humano.",
];

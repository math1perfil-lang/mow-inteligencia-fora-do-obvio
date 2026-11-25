/**
 * Trilha RH e Gestão de Pessoas — Módulo 1: IA na prática do RH.
 * Conteúdo editorial da MOW Academy. Empresa, pessoas e dados 100% fictícios.
 */

export const RH_TRACK_ID = "rh_gestao_pessoas";
export const RH_MODULE_ID = "rh_m1";
export const RH_MODALIDADE =
  "Autoavaliação guiada por rubrica — não houve avaliação automática por modelo";
export const RH_MIN_NOTA = 70;
export const RH_QUIZ_MIN = 10;
export const RH_AVISO_FICCAO = "Empresa e dados inteiramente fictícios";

export const RH_OPENING = {
  title: "IA em RH: menos improviso, mais qualidade no cuidado com pessoas.",
  paragraphs: [
    "Uma vaga mal escrita pode afastar profissionais qualificados. Um comunicado sobre benefícios pode prometer uma regra que não existe. Um plano de onboarding pode esquecer o acompanhamento de quem acabou de chegar.",
    "A IA pode ajudar a organizar esses trabalhos, mas não conhece automaticamente a política da sua empresa, o contexto de cada pessoa ou os limites da sua atuação. O seu papel não diminui: muda de apenas produzir para também orientar, conferir e decidir.",
    "Neste módulo, você usará uma empresa fictícia para construir quatro entregas reais de RH. Vai aprender a transformar uma demanda em instrução, identificar erros convincentes e revisar o resultado antes de qualquer uso.",
    "Ao terminar, terá um Kit Inicial de IA para RH e um plano seguro para começar um piloto. Aqui, produtividade não é só produzir mais texto: é reduzir retrabalho sem perder confiança, equidade e responsabilidade.",
  ],
  button: "Montar meu kit de RH",
  notice: "Prática com dados fictícios. Nenhum dado de colaborador é necessário.",
  objetivos: [
    "Localizar oportunidades de IA na jornada do colaborador e nos serviços de RH.",
    "Distinguir produzir um rascunho de tomar uma decisão que afeta uma pessoa.",
    "Desenhar uma tarefa com fonte, saída, limites, responsável e conferência.",
    "Produzir descrição de vaga, plano de onboarding, FAQ interno e roteiro de desenvolvimento a partir de fontes fictícias.",
    "Identificar exigências irrelevantes, promessa não autorizada, regra inventada e exposição desnecessária de dados.",
    "Conferir contagens e taxas simples em um conjunto fictício agregado de onboarding.",
    "Registrar uma melhoria de prompt com teste documentado.",
    "Propor um piloto de baixo risco, com métricas e critérios de interrupção.",
  ],
};

export const RH_UNITS = [
  { title: "Onde a IA se encaixa no RH", min: 25 },
  { title: "Dados, vieses e limites de decisão", min: 35 },
  { title: "Da demanda de RH ao prompt verificável", min: 25 },
  { title: "Laboratório de atração e descrição de vaga", min: 35 },
  { title: "Laboratório de onboarding e atendimento interno", min: 45 },
  { title: "Laboratório de desenvolvimento e apoio à liderança", min: 30 },
  { title: "Evidências, indicadores e controle de qualidade", min: 30 },
  { title: "Kit final, avaliação e piloto", min: 35 },
];

export const NIVEIS_PRATICA = [
  { id: "guiado", nome: "Guiado", desc: "Dicas e formulário por campos." },
  { id: "assistido", nome: "Assistido", desc: "Você recebe o caso, tenta e solicita dicas." },
  {
    id: "desafio",
    nome: "Desafio",
    desc: "Você recebe o problema e os critérios, sem solução inicial.",
  },
] as const;
export type NivelPratica = (typeof NIVEIS_PRATICA)[number]["id"];

/* ------------------------------ caso transversal --------------------------- */

export const HORIZONTE = {
  nome: "Horizonte Serviços",
  intro:
    "A Horizonte Serviços é uma empresa fictícia de serviços B2B com 180 colaboradores. O RH tem quatro profissionais e atende recrutamento, integração, desenvolvimento e solicitações internas. Demandas transacionais de folha e benefícios são tratadas com apoio de departamento pessoal. Não há chatbot nem automação aprovados.",
  dificuldades: [
    "Pedidos de vaga chegam incompletos.",
    "Os gestores fazem integração de formas diferentes.",
    "Perguntas sobre treinamentos se repetem.",
    "Planos de desenvolvimento costumam ser genéricos.",
  ],
  nota: "Esses relatos não provam causas nem autorizam concluir que a equipe tem baixo desempenho.",
  autorizacao:
    "A direção autorizou apenas um piloto fictício de produção de rascunhos e checklists para este curso. Não há autorização para analisar pessoas reais ou publicar automaticamente.",
};

export interface Fonte {
  id: "F1" | "F2" | "F3" | "F4" | "F5";
  titulo: string;
  linhas: string[];
}

export const FONTES: Fonte[] = [
  {
    id: "F1",
    titulo: "Requisição de vaga",
    linhas: [
      "Cargo: assistente de operações de pessoas.",
      "Missão: apoiar organização de registros e atendimento interno.",
      "Atividades: atualizar controles; organizar agenda de integração; acompanhar solicitações de colaboradores; encaminhar dúvidas aos responsáveis.",
      "Requisitos confirmados: comunicação escrita; organização de informações; conhecimentos básicos de planilhas.",
      "Não informados: salário, benefícios, local, modalidade, jornada, prazo de candidatura e canal oficial de inscrição.",
      "Observação inadequada recebida na requisição: “preferência por pessoa jovem, sem filhos e com boa aparência”. Essa anotação deve ser sinalizada para revisão, não convertida em critério de seleção.",
      "Não existem currículos de candidatos neste caso.",
    ],
  },
  {
    id: "F2",
    titulo: "Diretriz fictícia de onboarding, versão didática 1",
    linhas: [
      "Antes da entrada: RH envia agenda aprovada; gestor define uma pessoa de referência; TI verifica as permissões necessárias por canal oficial.",
      "Dia 1: boas-vindas; apresentação da equipe; orientação sobre canais de suporte e políticas disponíveis.",
      "Primeira semana: gestor alinha responsabilidades e prioridades; RH realiza uma conversa de acompanhamento.",
      "Dia 30: gestor e profissional revisam dúvidas e necessidades de aprendizagem.",
      "RH coordena agenda; gestor valida atividades da função; TI concede acessos. Um assistente de IA não concede acesso nem pede senha.",
      "Não informados: nomes, horários individuais, plataformas, local de encontro e data de admissão.",
      "Adaptações de acessibilidade devem ser combinadas por canal adequado, sem divulgar diagnóstico ou informações pessoais à equipe.",
    ],
  },
  {
    id: "F3",
    titulo: "Política fictícia de apoio a treinamento, versão didática 1",
    linhas: [
      "Uma solicitação deve informar objetivo de aprendizagem, vínculo com atividades e custo estimado quando houver.",
      "O gestor analisa pertinência e disponibilidade; o RH orienta o fluxo após essa análise.",
      "Não há reembolso automático nem aprovação garantida.",
      "Não informados: teto de valor, prazo de resposta, elegibilidade detalhada, lista de fornecedores, regra para cursos já comprados e plataforma de solicitação.",
      "Canal fictício de orientação: Central de Pessoas. Não criar endereço de e-mail, link ou telefone.",
      "Assuntos sobre reembolso ou elegibilidade não previstos devem ser encaminhados ao RH, não resolvidos por inferência.",
    ],
  },
  {
    id: "F4",
    titulo: "Caso fictício de desenvolvimento",
    linhas: [
      "Função: assistente de operações de pessoas.",
      "Objetivo acordado: melhorar a clareza dos registros de atendimento.",
      "Evidências observáveis fornecidas: em duas simulações didáticas, o registro não trouxe próximo passo; em uma simulação, havia texto duplicado.",
      "Perspectiva do profissional: pede um exemplo de registro esperado e prática com devolutiva.",
      "Recursos confirmados: modelo de registro e uma sessão de acompanhamento por semana, durante três semanas.",
      "Não informados: nome, avaliação global, histórico de desempenho, condição de saúde, personalidade, remuneração ou possibilidade de promoção.",
      "As simulações não autorizam rotular a pessoa como desorganizada nem atribuir falta de comprometimento.",
    ],
  },
  {
    id: "F5",
    titulo: "Base fictícia agregada de onboarding",
    linhas: [
      "Março: 20 ingressantes; 15 com checklist inicial concluído no prazo didático.",
      "Abril: 25 ingressantes; 20 com checklist inicial concluído no prazo didático.",
      "Maio: total de ingressantes não informado; 18 checklists concluídos no prazo didático.",
      "Prazo didático: conclusão até o fim da primeira semana. Essa definição serve apenas ao caso, não é norma legal.",
      "Não há dados de satisfação, retenção, produtividade, motivo de pendência ou informação individual.",
      "Não existe vínculo demonstrado entre a variação e o uso de IA.",
    ],
  },
];
export const FONTE_BY_ID = Object.fromEntries(FONTES.map((f) => [f.id, f])) as Record<
  Fonte["id"],
  Fonte
>;
export const fonteTexto = (id: Fonte["id"]) =>
  `${id} — ${FONTE_BY_ID[id].titulo}\n${FONTE_BY_ID[id].linhas.join("\n")}`;

/* ---------------------------------- ciclo ---------------------------------- */

export const CICLO_RH: [string, string][] = [
  ["C — Contextualizar", "o processo: qual demanda, público e resultado?"],
  ["I — Identificar", "fonte e informações realmente necessárias."],
  ["C — Construir", "a instrução e definir o limite de atuação da IA."],
  ["L — Ler criticamente", "a resposta, confrontando com fontes e critérios."],
  ["O — Operacionalizar", "apenas após aprovação humana e registrar aprendizado."],
  ["RH — Responsabilidade Humana", "atravessa todas as etapas."],
];
export const CICLO_NOTA =
  "CICLO RH é um recurso didático proposto para o curso, não norma, método certificado ou promessa de segurança.";

/* ---------------------------------- unidade 1 ------------------------------ */

export const U1_TEXTO = [
  "RH não é uma tarefa única. A jornada começa antes da contratação e passa por entrada, desenvolvimento, movimentações, permanência e desligamento. Ao redor dela, existem serviços, políticas, indicadores e relações de confiança.",
  "Para encontrar uma boa aplicação de IA, escolha uma tarefa dentro de um processo. “Usar IA no recrutamento” é amplo demais. “Transformar uma requisição aprovada em rascunho de vaga e lista de pendências” já define uma entrega verificável.",
  "Também separe apoio à produção de decisão sobre pessoas. Organizar perguntas de uma entrevista não é decidir quem será contratado. Estruturar uma conversa de desenvolvimento não é atribuir uma avaliação. Resumir uma política não é criar uma regra.",
  "Sua primeira pergunta deve ser: qual parte do processo pode receber ajuda sem perder contexto, privacidade e responsabilidade?",
];

export const MAPA_FUNCIONAL: { nome: string; apoia: string; naoFaz: string }[] = [
  {
    nome: "Planejamento da força de trabalho",
    apoia: "organizar perguntas, cenários e premissas",
    naoFaz: "inventar necessidade de contratação nem simular precisão preditiva sem base",
  },
  {
    nome: "Atração e seleção",
    apoia: "rascunhar vagas e roteiros ligados a competências",
    naoFaz: "classificar personalidade ou eliminar candidatos por proxies ou atributos protegidos",
  },
  {
    nome: "Admissão e onboarding",
    apoia: "criar agendas e checklists a partir de diretrizes",
    naoFaz: "conceder acesso nem inventar exigência documental",
  },
  {
    nome: "Administração de pessoal e benefícios",
    apoia: "transformar políticas aprovadas em orientações",
    naoFaz: "calcular direitos definitivos ou inventar prazo legal, desconto e elegibilidade",
  },
  {
    nome: "Aprendizagem e desenvolvimento",
    apoia: "estruturar atividades e critérios observáveis",
    naoFaz: "diagnosticar capacidade ou impor carreira",
  },
  {
    nome: "Desempenho e liderança",
    apoia: "organizar fatos e perguntas de feedback",
    naoFaz: "criar nota final, diagnóstico ou sanção automática",
  },
  {
    nome: "Remuneração e carreira",
    apoia: "organizar descrições de cargo e fontes",
    naoFaz: "recomendar salário individual ou promoção a partir de atributos pessoais",
  },
  {
    nome: "Cultura, clima e inclusão",
    apoia: "apoiar instrumentos e sínteses seguras",
    naoFaz: "tentar identificar respondentes ou inferir saúde mental",
  },
  {
    nome: "People analytics",
    apoia: "documentar métricas e conferir dados",
    naoFaz: "atribuir causalidade nem produzir listas individuais de risco de desligamento",
  },
  {
    nome: "Relações de trabalho, saúde e segurança, desligamento",
    apoia: "organizar materiais e pendências autorizados",
    naoFaz:
      "substituir a análise especializada: sem aconselhamento jurídico ou médico definitivo pela IA",
  },
];
export const MAPA_NOTA =
  "Este é um mapa de escopo, não uma alegação de que todas as aplicações têm o mesmo risco.";

export const U1_OPCOES = [
  "Rascunho assistido, com revisão humana",
  "Apoio com fonte e escalonamento",
  "Apoio, verificando pertinência e acessibilidade",
  "Não delegar: decisão sensível, fora do laboratório",
  "Não realizar nem concluir: inferência indevida ou falta de fonte e validação",
];
export const U1_PEDIDOS: { texto: string; correta: number; porque: string }[] = [
  {
    texto: "Criar uma vaga com requisitos confirmados.",
    correta: 0,
    porque: "Rascunho assistido, com revisão.",
  },
  {
    texto: "Escolher quem será demitido.",
    correta: 3,
    porque: "Não delegar: decisão sensível fora do laboratório.",
  },
  {
    texto: "Criar FAQ baseado em política aprovada.",
    correta: 1,
    porque: "Apoio com fonte e escalonamento.",
  },
  {
    texto: "Inferir depressão em comentários de clima.",
    correta: 4,
    porque: "Não realizar inferência individual de saúde.",
  },
  {
    texto: "Criar perguntas sobre organização de registros.",
    correta: 2,
    porque: "Apoio; verificar pertinência e acessibilidade.",
  },
  {
    texto: "Calcular benefício definitivo sem regras vigentes.",
    correta: 4,
    porque: "Não concluir: faltam fonte e validação competente.",
  },
];
export const U1_FEEDBACK =
  "A mesma área pode ter tarefas de apoio simples e decisões de alto impacto. Delimite a atividade.";

export const MAPA_CAMPOS = [
  { id: "tarefa", label: "Tarefa dentro de um processo", rows: 2 },
  { id: "fonte", label: "Fonte necessária", rows: 2 },
  { id: "saida", label: "Saída esperada", rows: 2 },
  { id: "risco", label: "Risco se houver erro", rows: 2 },
  { id: "aprovador", label: "Aprovador humano (por papel)", rows: 1 },
] as const;

/* ---------------------------------- unidade 2 ------------------------------ */

export const U2_TEXTO = [
  "No RH, a qualidade de uma aplicação não depende só de escrever bem. É preciso perguntar sobre quem o dado fala, por que será usado, quem terá acesso e qual decisão pode decorrer da resposta.",
  "Dados pessoais identificam ou permitem identificar pessoas. Dados pessoais sensíveis têm definição específica na LGPD, incluindo saúde, origem racial ou étnica e filiação sindical, entre outras categorias. Salário e desempenho identificáveis são dados pessoais que exigem proteção, mas não são automaticamente sensíveis nessa definição legal.",
  "Informação empresarial confidencial é outra classificação: uma estrutura salarial interna ou plano de reorganização pode exigir sigilo mesmo sem conter nomes.",
  "Trocar nomes por códigos não garante anonimização. Cargo, unidade e outras combinações ainda podem revelar a pessoa. Neste curso, usaremos somente fontes fictícias.",
  "Vieses podem surgir nos dados, nos critérios, na instrução e na forma de interpretar o resultado. Pedir uma resposta “sem viés” não comprova justiça. Revise pertinência dos critérios, acessibilidade e efeitos da aplicação.",
  "Supervisão humana não pode ser um carimbo. Quem revisa precisa conseguir questionar, corrigir e interromper o fluxo. Se o sistema cria uma recomendação que ninguém consegue contestar, há um problema de governança.",
];
export const U2_NOTA_JURIDICA =
  "Este módulo é introdutório. Políticas internas, legislação trabalhista aplicável, instrumentos coletivos e orientação especializada devem ser considerados em usos reais.";

export const U2A_OPCOES = [
  "Dado pessoal sensível: não enviar ao laboratório",
  "Dado pessoal e informação confidencial; não automaticamente sensível na LGPD",
  "Material apropriado à prática (inteiramente fictício)",
  "Pode permitir reidentificação: não tratar agregação como garantia",
  "Desnecessário: o caso não exige esse identificador",
];
export const U2A_ITENS: { texto: string; correta: number; porque: string }[] = [
  {
    texto: "CPF fictício com aparência real.",
    correta: 4,
    porque: "Não precisa ser criado; o caso não exige identificador.",
  },
  {
    texto: "Atestado médico real.",
    correta: 0,
    porque: "Dado pessoal sensível; não enviar para o laboratório.",
  },
  {
    texto: "Salário identificado.",
    correta: 1,
    porque: "Dado pessoal e informação confidencial; não automaticamente sensível na LGPD.",
  },
  {
    texto: "Plano de treinamento inteiramente fictício.",
    correta: 2,
    porque: "Material apropriado à prática.",
  },
  {
    texto: "Comentário de clima de uma equipe de duas pessoas.",
    correta: 3,
    porque: "Pode permitir reidentificação; não tratar agregação como garantia.",
  },
];

export interface Livre {
  id: string;
  pergunta: string;
  ref: string;
  pontos: string[];
}

export const U2B: Livre[] = [
  {
    id: "u2b1",
    pergunta:
      "A instrução “pessoa jovem, sem filhos e com boa aparência” (F1) deve entrar na vaga? Justifique.",
    ref: "Não. Sinalizar exigências potencialmente discriminatórias e sem vínculo demonstrado com as atividades; solicitar revisão humana e critérios ocupacionais pertinentes. Não tentar reescrever discriminação em linguagem disfarçada.",
    pontos: [
      "Disse que não deve entrar na vaga.",
      "Apontou que são exigências potencialmente discriminatórias, sem vínculo com as atividades.",
      "Pediu revisão humana e critérios ocupacionais pertinentes.",
      "Não sugeriu reescrever o critério em linguagem disfarçada.",
    ],
  },
  {
    id: "u2b2",
    pergunta: "Podemos usar pontuação por expressão facial para medir comprometimento?",
    ref: "Não usar no curso. Inferências assim não constituem evidência confiável de competência e podem criar barreiras e discriminação. Encaminhar a avaliação de qualquer tecnologia de seleção a especialistas e governança.",
    pontos: [
      "Disse que não deve ser usado.",
      "Explicou que não é evidência confiável de competência e pode criar barreiras ou discriminação.",
      "Encaminhou a avaliação a especialistas e governança.",
    ],
  },
];

export const LIMITE_MODELO =
  "Não delegarei [decisão]. A IA poderá apoiar [parte limitada]. A validação será de [papel humano].";
export const LIMITE_EXEMPLOS = [
  "decisão de contratação",
  "decisão salarial individual",
  "investigação e conclusão de denúncia",
  "avaliação clínica",
  "medida disciplinar",
];
export const LIMITE_NOTA =
  "Não afirmamos que toda tecnologia de apoio decisório é universalmente ilegal; estas são restrições pedagógicas e de segurança do laboratório.";
export const LIMITE_CAMPOS = [
  { id: "decisao", label: "Não delegarei (decisão)" },
  { id: "parte", label: "A IA poderá apoiar (parte limitada)" },
  { id: "validacao", label: "A validação será de (papel humano)" },
] as const;

/* ---------------------------------- unidade 3 ------------------------------ */

export const U3_TEXTO = [
  "Uma demanda de RH precisa ser traduzida antes de ser enviada à ferramenta. “Faça um onboarding” deixa abertas perguntas importantes: para qual função, com qual diretriz, para quando e com que responsáveis?",
  "Comece pelo produto de trabalho. Depois forneça a fonte autorizada, peça uma estrutura e defina o que não pode ser inventado.",
  "O PACTO do Módulo Start ajuda a lembrar papel, ação, contexto, tom e formato. Em RH, acrescente sempre duas perguntas: que consequência um erro pode gerar para alguém e quem aprova a entrega?",
  "Não peça que a ferramenta revele raciocínio interno. Solicite critérios, evidências da fonte, justificativas curtas e lacunas. Você precisa de uma resposta verificável, não de um texto longo que pareça uma auditoria.",
  "Uma restrição como “não invente” ajuda, mas não substitui a conferência. No próximo laboratório, você testará a instrução com um erro que costuma passar despercebido: preencher um campo ausente com uma suposição plausível.",
];

export const TEMPLATE_CAMPOS = [
  { id: "objetivo", label: "Objetivo", dica: "Entrega e finalidade.", rows: 2 },
  {
    id: "perspectiva",
    label: "Perspectiva (opcional)",
    dica: "Relacionada à tarefa, sem credencial fictícia.",
    rows: 1,
  },
  {
    id: "fonte",
    label: "Fonte autorizada",
    dica: "Fonte fictícia ou aprovada, com versão.",
    rows: 2,
  },
  { id: "publico", label: "Público", dica: "Destinatário.", rows: 1 },
  { id: "tarefa", label: "Tarefa", dica: "Ação específica.", rows: 2 },
  { id: "formato", label: "Formato", dica: "Campos, estrutura, extensão.", rows: 2 },
  {
    id: "limites",
    label: "Limites",
    dica: "Use somente a fonte; marque ausências; não decida sobre pessoas; não crie regra, requisito, benefício ou promessa.",
    rows: 3,
  },
  {
    id: "verificacao",
    label: "Verificação",
    dica: "Mostre evidências e pendências para aprovação humana.",
    rows: 2,
  },
  { id: "dados", label: "Dados", dica: "Delimitados separadamente (a fonte do caso).", rows: 4 },
] as const;

export const TEMPLATE_TEXTO = `OBJETIVO: [entrega e finalidade].
PERSPECTIVA: [opcional, relacionada à tarefa, sem credencial fictícia].
FONTE AUTORIZADA: [fonte fictícia ou aprovada, com versão].
PÚBLICO: [destinatário].
TAREFA: [ação específica].
FORMATO: [campos, estrutura, extensão].
LIMITES: use somente a fonte; marque ausências; não decida sobre pessoas; não crie regra, requisito, benefício ou promessa.
VERIFICAÇÃO: mostre evidências e pendências para aprovação humana.
DADOS: [delimitados separadamente].`;

export const U3_BRIEFING_CAMPOS = [
  { id: "finalidade", label: "Finalidade", rows: 2 },
  { id: "publico", label: "Público", rows: 1 },
  { id: "fonte", label: "Fonte (com versão)", rows: 1 },
  { id: "formato", label: "Formato", rows: 2 },
  { id: "limites", label: "Três limites", rows: 3 },
  { id: "aprovador", label: "Aprovador", rows: 1 },
  { id: "escalonamento", label: "Critério de escalonamento", rows: 2 },
] as const;
export const U3_DEMANDA = "Transformar a F3 em FAQ.";
export const U3_GABARITO =
  "Finalidade: orientar colaboradores. Fonte: F3, versão didática 1. Formato: perguntas e respostas. Limites: sem teto, prazo e reembolso inventados. Aprovador: RH. Escalonamento: questões não previstas vão à Central de Pessoas.";
export const U3_PONTOS = [
  "Finalidade de orientar colaboradores.",
  "Fonte F3 com a versão didática 1.",
  "Formato de perguntas e respostas.",
  "Limites: não inventar teto, prazo nem reembolso.",
  "Aprovação pelo RH.",
  "Questões não previstas encaminhadas à Central de Pessoas.",
];
export const U3_CRITERIO = "Formulações equivalentes valem: não é preciso usar as mesmas palavras.";

/* --------------------------- tarefas (prompts P1–P4) ----------------------- */

export interface RhTarefa {
  id: "p1" | "p2" | "p3" | "p4";
  unidade: number;
  codigo: string;
  titulo: string;
  entregaNome: string;
  fonte: Fonte["id"];
  missao: string;
  texto: string[];
  promptResolvido: string;
  entregaModelo: string;
  inadequada: string;
  inadequadaErros: string[];
  inadequadaDistratores: string[];
  feedbackInadequada: string;
  notaModelo?: string;
  extras: Livre[];
}

export const RH_TAREFAS: RhTarefa[] = [
  {
    id: "p1",
    unidade: 4,
    codigo: "P1",
    titulo: "Descrição de vaga",
    entregaNome: "Anúncio de vaga revisável (rascunho)",
    fonte: "F1",
    missao:
      "Produzir um anúncio revisável a partir de F1, sem transformar a requisição inadequada em requisito.",
    texto: [
      "Uma descrição de vaga comunica atividades e requisitos. Não deve virar uma lista de preferências pessoais do solicitante. A IA pode estruturar o material, mas também pode ampliar exigências por associação: inventar inglês, diploma ou experiência mínima porque isso parece comum.",
      "Seu trabalho é preservar o que foi confirmado, separar pendências e impedir que uma redação convincente crie barreiras desnecessárias. Uma vaga completa não é a que preenche tudo; é a que distingue o aprovado do que ainda falta.",
    ],
    promptResolvido:
      "Transforme a requisição fictícia F1 em rascunho de descrição de vaga para assistente de operações de pessoas. Use linguagem profissional e inclusiva. Entregue: missão, atividades, requisitos confirmados, informações pendentes e alertas para o RH. Use apenas a fonte. Não acrescente experiência mínima, diploma, inglês, salário, benefícios, jornada ou local. Não use idade, situação familiar ou aparência como critérios; sinalize a anotação inadequada para revisão, sem reproduzi-la no anúncio ao público. Não publique a vaga. Ao final, indique os itens que exigem aprovação humana. FONTE: [inserir F1 integral].",
    entregaModelo: `Título: Assistente de operações de pessoas.
Missão: apoiar a organização de registros e o atendimento interno.
Atividades: atualizar controles; organizar agenda de integração; acompanhar solicitações; encaminhar dúvidas aos responsáveis.
Requisitos confirmados: comunicação escrita; organização de informações; conhecimentos básicos de planilhas.
Pendências: salário, benefícios, local, modalidade, jornada, prazo e canal de candidatura.
Nota interna ao RH, separada do anúncio: revisar e remover critérios pessoais sem pertinência ocupacional demonstrada; aprovar condições e canal antes de publicar.`,
    notaModelo:
      "Não preencher campos com “a combinar” como se isso fosse uma condição confirmada. Preferir “não informado na fonte”.",
    inadequada:
      "Vaga para jovem dinâmico sem filhos, com superior completo e três anos de experiência. Salário de R$ 3.000 e trabalho remoto garantido.",
    inadequadaErros: [
      "Critérios pessoais indevidos (jovem, sem filhos).",
      "Formação inventada (superior completo).",
      "Tempo de experiência inventado (três anos).",
      "Salário e modalidade inventados (R$ 3.000, remoto garantido).",
    ],
    inadequadaDistratores: [
      "Erro de português na primeira frase.",
      "A vaga foi publicada no site da empresa.",
    ],
    feedbackInadequada:
      "Cite exatamente o erro encontrado; não limite a avaliação à linguagem gramatical.",
    extras: [],
  },
  {
    id: "p2",
    unidade: 5,
    codigo: "P2",
    titulo: "Plano de onboarding",
    entregaNome: "Plano de onboarding (tabela)",
    fonte: "F2",
    missao: "Organizar a diretriz F2 em um plano com responsáveis por papel e pendências.",
    texto: [
      "O onboarding conecta pessoas, informações e responsabilidades. Uma agenda bonita pode falhar se atribuir à pessoa errada a concessão de acesso ou se prometer que tudo estará pronto sem confirmação.",
      "No atendimento interno, o desafio é semelhante: ajudar sem ampliar a política. Um FAQ deve responder o que a fonte permite e encaminhar o que ela não cobre. “Não informado; procure o canal responsável” pode ser a resposta correta.",
      "Você produzirá dois materiais: um plano de onboarding a partir de F2 e um FAQ a partir de F3. Eles serão avaliados pela fidelidade, pela utilidade e pela qualidade das pendências.",
    ],
    promptResolvido:
      "Organize a diretriz fictícia F2 em um plano de onboarding. Entregue tabela com período, ação, responsável por papel, evidência de conclusão e pendência. Preserve as etapas antes da entrada, dia 1, primeira semana e dia 30. Não invente nomes, horários, plataforma, local ou data. Não solicite senhas ou informações de saúde. Se sugerir uma melhoria, coloque em seção separada “Sugestão para validação”, nunca como política vigente. Marque que o gestor valida atividades da função, RH coordena agenda e TI concede acessos. Fonte: [F2 integral].",
    entregaModelo: `Antes da entrada: agenda aprovada, RH; pessoa de referência, gestor; verificação de permissões, TI. Evidências propostas para validação: agenda confirmada, referência definida e solicitação registrada, sem expor credenciais.
Dia 1: boas-vindas, equipe, canais e políticas; responsáveis específicos a confirmar quando a fonte não os define.
Primeira semana: alinhamento de responsabilidades, gestor; conversa de acompanhamento, RH.
Dia 30: revisão de dúvidas e necessidades, gestor e profissional.
Pendências: nomes, horários, ferramentas, local, data e responsável específico de cada atividade do dia 1.`,
    notaModelo:
      "Separe as evidências sugeridas das regras de F2, pois a fonte não define todos os meios de comprovação.",
    inadequada: "O RH criará a senha e encerrará o acompanhamento no dia 1.",
    inadequadaErros: [
      "Atribuição indevida de acesso ao RH (quem concede acessos é a TI, por canal oficial).",
      "Supressão da primeira semana e do dia 30.",
    ],
    inadequadaDistratores: [
      "O texto é curto demais para um plano.",
      "Falta o nome da pessoa que está entrando.",
    ],
    feedbackInadequada:
      "Falhas: atribuição indevida de acesso e supressão da primeira semana e do dia 30.",
    extras: [
      {
        id: "u5a",
        pergunta: "O assistente pode gerar uma senha temporária e enviá-la no plano?",
        ref: "Não. Seguir o canal oficial de TI, sem criar ou expor credenciais.",
        pontos: [
          "Disse que não.",
          "Indicou o canal oficial de TI para acessos.",
          "Não criou nem expôs credenciais.",
        ],
      },
    ],
  },
  {
    id: "p3",
    unidade: 5,
    codigo: "P3",
    titulo: "FAQ de treinamento",
    entregaNome: "FAQ com cinco perguntas e respostas",
    fonte: "F3",
    missao: "Responder o que a política permite e encaminhar o que ela não cobre.",
    texto: [
      "Um FAQ não é autorização para ampliar a política. A F3 exige informações para solicitar treinamento e estabelece análise de pertinência e disponibilidade. Não define teto, prazo de resposta nem regra sobre curso comprado antes.",
      "Ausência de regra não equivale a proibição nem a autorização.",
    ],
    promptResolvido:
      "Crie cinco perguntas e respostas para colaboradores com base exclusiva na política fictícia F3, versão didática 1. Para cada resposta, indique a seção ou trecho de apoio em linguagem curta. Separe regras confirmadas de perguntas sem resposta. Não crie teto, prazo, elegibilidade ou reembolso. Para lacunas, informe que a política fornecida não responde e oriente a Central de Pessoas. Tom acolhedor e direto. Não invente contato ou link. Fonte: [F3 integral].",
    entregaModelo: `1. O que preciso informar? Objetivo, vínculo com atividades e custo estimado quando houver.
2. Quem analisa inicialmente? O gestor analisa pertinência e disponibilidade; depois o RH orienta o fluxo.
3. Há aprovação garantida? Não. A política não garante aprovação.
4. Qual o teto e o prazo de resposta? Não informados na fonte; consultar Central de Pessoas.
5. Posso comprar antes e pedir reembolso? A fonte não define essa situação e não prevê reembolso automático; buscar orientação antes de assumir compromisso.`,
    notaModelo:
      "Não responder “não é permitido comprar antes” como se houvesse proibição expressa. Ausência de regra não equivale a proibição nem autorização.",
    inadequada: "Todo curso tem reembolso de até R$ 2.000 e resposta em cinco dias.",
    inadequadaErros: [
      "Regra inventada (reembolso para todo curso).",
      "Valor inventado (R$ 2.000).",
      "Prazo inventado (cinco dias).",
    ],
    inadequadaDistratores: ["O tom está informal demais.", "Faltou citar o nome do gestor."],
    feedbackInadequada: "Erros: regra, valor e prazo inventados.",
    extras: [
      {
        id: "u5b",
        pergunta: "Um curso já pago será reembolsado?",
        ref: "Não concluir: a fonte é insuficiente. Encaminhar à Central de Pessoas, sem promessa.",
        pontos: [
          "Não concluiu nem prometeu reembolso.",
          "Disse que a fonte é insuficiente.",
          "Encaminhou à Central de Pessoas.",
        ],
      },
    ],
  },
  {
    id: "p4",
    unidade: 6,
    codigo: "P4",
    titulo: "Roteiro de desenvolvimento",
    entregaNome: "Roteiro de conversa e plano de prática de três semanas",
    fonte: "F4",
    missao:
      "Estruturar uma conversa respeitosa a partir de fatos observáveis, sem rotular a pessoa.",
    texto: [
      "Gestão de pessoas exige distinguir comportamento observado de rótulo. “O registro ficou sem próximo passo” é uma observação. “A pessoa não se importa” é uma interpretação sobre intenção que a evidência não sustenta.",
      "A IA pode ajudar a estruturar uma conversa respeitosa e um plano de prática. Não deve inventar fatos, diagnosticar personalidade, atribuir uma avaliação final ou decidir uma promoção.",
      "Um plano de desenvolvimento precisa ligar objetivo, atividade, apoio e evidência de progresso. Não basta escrever “melhorar comunicação”. É preciso definir o que será praticado e como será observado, sem transformar uma atividade de aprendizagem em punição automática.",
    ],
    promptResolvido:
      "Com base apenas em F4, crie um roteiro de conversa de desenvolvimento e um plano de prática de três semanas. Separe fatos observáveis, perguntas abertas e propostas a pactuar. Inclua o modelo de registro e uma sessão semanal já confirmados. Não diagnostique personalidade, saúde ou motivação; não atribua nota, sanção, promoção ou impacto salarial. Entregue objetivo, prática, apoio, evidência e pergunta de revisão por semana. Identifique como proposta qualquer critério novo. Fonte: [F4 integral].",
    entregaModelo: `Abertura: “Vamos alinhar um padrão para os registros e identificar que apoio ajuda na prática.”
Fatos: duas simulações sem próximo passo; uma com texto duplicado.
Perguntas: “Que parte do modelo gera dúvida?”; “Qual exemplo facilitaria a execução?”; “Como você prefere receber a devolutiva?”
Semana 1, proposta: estudar um exemplo e preencher uma simulação com o modelo; apoio em sessão semanal; verificar presença de próximo passo e ausência de duplicação.
Semana 2, proposta: repetir a prática e revisar com devolutiva.
Semana 3, proposta: realizar nova simulação e comparar com os critérios combinados.`,
    notaModelo:
      "Critérios são propostas para pactuação; não há meta numérica aprovada nem sanção em caso de dificuldade. Não inventar prazo trabalhista, acompanhamento médico ou diagnóstico.",
    inadequada: "Você é desorganizado e pouco comprometido.",
    inadequadaErros: [
      "Rótulo sobre a pessoa em vez de fato observável.",
      "Atribuição de intenção (falta de comprometimento) que a evidência não sustenta.",
    ],
    inadequadaDistratores: ["Está longo demais.", "Faltou citar o nome da pessoa."],
    feedbackInadequada:
      "Preserve fatos e abra espaço à perspectiva da pessoa; não apresente o texto como avaliação real de colaborador.",
    extras: [
      {
        id: "u6",
        pergunta: "Reescreva a frase: “Você é desorganizado e pouco comprometido.”",
        ref: "“Nas simulações informadas, faltou o próximo passo em dois registros e houve duplicação em um. Vamos entender a dificuldade e praticar com um modelo.”",
        pontos: [
          "Descreveu fatos observáveis (dois registros sem próximo passo, uma duplicação).",
          "Não rotulou a pessoa nem atribuiu intenção.",
          "Abriu espaço à perspectiva da pessoa e a apoio/prática.",
        ],
      },
    ],
  },
];
export const TAREFA_BY_ID = Object.fromEntries(RH_TAREFAS.map((t) => [t.id, t])) as Record<
  RhTarefa["id"],
  RhTarefa
>;

/* ---------------------------------- unidade 7 ------------------------------ */

export const U7_TEXTO = [
  "RH pode usar indicadores para entender processos, mas precisa definir o que está contando. Conclusão de checklist não é satisfação, retenção nem produtividade.",
  "Na base fictícia, queremos a proporção de ingressantes com checklist concluído no prazo didático. O numerador é o número de conclusões no prazo; o denominador é o total de ingressantes do mesmo período.",
  "Se o denominador está ausente, a taxa não pode ser preenchida. E se uma taxa melhora, ainda não sabemos a causa. O uso de IA, a organização da agenda, a composição da turma e outros fatores podem estar relacionados; sem dados adequados, não atribua o resultado a nenhum deles.",
  "Também não presuma privacidade porque há uma tabela. Grupos pequenos e cruzamentos podem permitir identificação. Não existe um tamanho mínimo universal que garanta anonimização.",
];

/** Gabarito numérico da F5 (conferência objetiva). */
export const U7A = {
  marco: 75,
  abril: 80,
  diferencaPp: 5,
  maio: "nao-calculavel" as const,
  notas: [
    "Março: 15/20 = 75%.",
    "Abril: 20/25 = 80%.",
    "Diferença: 5 pontos percentuais, não 5% de aumento relativo.",
    "Maio: taxa não calculável sem o total de ingressantes; 18 é contagem, não porcentagem.",
    "Não há prova de melhora de retenção, produtividade ou efeito da IA.",
  ],
  perguntasAceitaveis: [
    "Os critérios foram aplicados de forma consistente?",
    "Qual o total de maio?",
    "Que etapas ficaram pendentes?",
    "Há registro de mudanças de processo?",
  ],
};
export const U7A_PERGUNTAS: Livre = {
  id: "u7a",
  pergunta:
    "Escreva duas perguntas de investigação que o RH deveria fazer antes de tirar conclusões.",
  ref:
    "Exemplos aceitáveis: " +
    U7A.perguntasAceitaveis.join(" ") +
    " Não é preciso acesso a dados pessoais para responder.",
  pontos: [
    "As perguntas buscam dados ou contexto que faltam (denominador, etapas pendentes, critérios, mudanças).",
    "Não atribuem causa à IA nem presumem resultado.",
  ],
};

export const U7B = {
  inadequada: "A conclusão subiu para 90% em maio, provando que a IA reduziu o turnover.",
  erros: [
    "Taxa inventada (90%): o total de maio não foi informado.",
    "Ausência de dados de turnover.",
    "Causalidade não demonstrada.",
    "O uso de IA nem foi informado.",
  ],
  distratores: ["A frase usa a palavra “conclusão”.", "Faltou citar o mês de março."],
  correcao:
    "Março teve 75% e abril 80% de conclusão no prazo didático. Maio registra 18 conclusões, mas o total não foi informado. Não é possível concluir efeito sobre turnover nem atribuir mudança à IA.",
};
export const U7B_LIVRE: Livre = {
  id: "u7b",
  pergunta: "Reescreva a frase de forma fiel aos dados.",
  ref: U7B.correcao,
  pontos: [
    "Citou 75% (março) e 80% (abril) com o prazo didático.",
    "Disse que maio tem 18 conclusões, mas total não informado.",
    "Não concluiu efeito sobre turnover nem atribuiu a mudança à IA.",
  ],
};

export const CRIVO: [string, string][] = [
  ["C — Confere com a fonte?", "Cada afirmação tem apoio na fonte fornecida."],
  [
    "R — Respeita direitos, privacidade e limites?",
    "Sem dado desnecessário, sem decisão sobre pessoas.",
  ],
  [
    "I — Indica incertezas e informações ausentes?",
    "Lacunas marcadas como “não informado na fonte”.",
  ],
  [
    "V — Vincula recomendações a evidências, sem diagnosticar pessoas?",
    "Fatos observáveis, sem rótulos.",
  ],
  [
    "O — Oferece uma saída útil com aprovação definida?",
    "Há entrega utilizável e aprovador por papel.",
  ],
];
export const CRIVO_NOTA =
  "O CRIVO RH é uma ferramenta didática. Passar no checklist não comprova conformidade jurídica nem ausência de viés.";

/* ---------------------------------- unidade 8 ------------------------------ */

export const U8_TEXTO = [
  "Agora você tem quatro prompts e quatro materiais. Antes de chamar isso de solução, registre um teste.",
  "Escolha um prompt, execute com o caso fictício e confira a resposta com o gabarito. Salve a primeira versão, identifique uma falha concreta e revise a instrução. Se a resposta estiver adequada, teste uma pergunta de fronteira: uma solicitação sobre informação que a fonte não traz.",
  "O piloto profissional deve começar pequeno. Escolha um tipo de material, um responsável e um período. Meça qualidade e retrabalho, não apenas velocidade. Um texto gerado rapidamente pode exigir correções extensas.",
  "Defina também quando parar: uma regra inventada, exposição de dado, recomendação indevida ou falta de revisão são motivos para interromper o uso e corrigir o processo.",
];

export const LAB_CAMPOS = [
  { id: "tarefa", label: "Tarefa", rows: 1 },
  { id: "fonte", label: "Fonte e versão", rows: 1 },
  { id: "promptV1", label: "Prompt v1", rows: 5 },
  { id: "saidaV1", label: "Saída v1 (colada ou observada)", rows: 5 },
  { id: "verificacoes", label: "Verificações realizadas (com a fonte ao lado)", rows: 3 },
  { id: "erro", label: "Erro ou fronteira testada", rows: 3 },
  { id: "promptV2", label: "Prompt v2", rows: 5 },
  { id: "resultado", label: "Resultado da revisão", rows: 3 },
  { id: "limitacoes", label: "Limitações", rows: 2 },
  { id: "aprovador", label: "Aprovador (por papel)", rows: 1 },
] as const;
export const LAB_DICA =
  "Quando faltar informação, escreva “não informado na fonte” e liste a confirmação necessária. Não complete por padrão de mercado.";
export const LAB_MODOS = [
  { id: "ferramenta", label: "Teste em ferramenta autorizada" },
  { id: "guiado", label: "Comparação guiada" },
] as const;
export const LAB_GUIADO = {
  inadequada: [
    ["Vaga (U4)", RH_TAREFAS[0]!.inadequada],
    ["Onboarding (U5)", RH_TAREFAS[1]!.inadequada],
    ["FAQ (U5)", RH_TAREFAS[2]!.inadequada],
    ["Indicadores (U7)", U7B.inadequada],
  ] as [string, string][],
  dica: "Pelo menos dois problemas devem ser apontados antes de ver o gabarito.",
};

export const PILOTO_DIAS = [
  "Dia 1: escolher apenas uma tarefa e fonte aprovada, usando dados fictícios até autorização específica.",
  "Dia 2: construir prompt e critérios de conferência.",
  "Dia 3: testar casos típicos e perguntas fora da fonte.",
  "Dia 4: revisar com responsável do processo.",
  "Dia 5: repetir teste com versão revisada.",
  "Dia 6: medir tempo total, correções e fidelidade.",
  "Dia 7: decidir continuar, ajustar ou encerrar, registrando limitações.",
];
export const PILOTO_NOTA =
  "Não execute piloto real com dados pessoais sem as condições necessárias de governança.";
export const METRICAS: { id: string; nome: string; def: string }[] = [
  {
    id: "fidelidade",
    nome: "Fidelidade",
    def: "itens corretos e sustentados pela fonte / itens verificáveis avaliados; critérios definidos antes.",
  },
  { id: "retrabalho", nome: "Retrabalho", def: "número e gravidade de correções necessárias." },
  { id: "tempo", nome: "Tempo total", def: "preparação + geração + revisão + correção." },
  {
    id: "encaminhamento",
    nome: "Encaminhamento adequado",
    def: "perguntas sem cobertura corretamente encaminhadas / perguntas sem cobertura testadas.",
  },
  {
    id: "privacidade",
    nome: "Privacidade e segurança",
    def: "ocorrências e gravidade; nenhuma ocorrência no teste não comprova segurança absoluta.",
  },
];
export const METRICAS_NOTA = "Não calcule ROI fictício nem prometa redução percentual.";
export const PILOTO_CAMPOS = [
  { id: "tarefa", label: "Tarefa única do piloto", rows: 1 },
  { id: "fonte", label: "Fonte aprovada e versão", rows: 1 },
  { id: "responsavel", label: "Responsável (por papel)", rows: 1 },
  { id: "periodo", label: "Período", rows: 1 },
  { id: "interrupcao", label: "Quando interromper (critérios de parada)", rows: 3 },
  { id: "decisao", label: "Como decidir continuar, ajustar ou encerrar", rows: 2 },
] as const;
export const INTERRUPCAO_MOTIVOS = [
  "Uma regra inventada",
  "Exposição de dado",
  "Recomendação indevida",
  "Falta de revisão",
];

/* ---------------------------------- rubrica -------------------------------- */

export const RUBRICA: { id: string; label: string; peso: number; cheque: string; dica: string }[] =
  [
    {
      id: "adequacao",
      label: "Adequação à tarefa de RH",
      peso: 15,
      cheque: "O prompt define uma entrega de RH clara, dentro de um processo?",
      dica: "descreva o produto de trabalho de RH e o processo em que ele entra",
    },
    {
      id: "fidelidade",
      label: "Fidelidade à fonte e tratamento de lacunas",
      peso: 25,
      cheque: "A fonte está delimitada e as lacunas são marcadas como “não informado na fonte”?",
      dica: "delimite a fonte e instrua a marcar o que não foi informado",
    },
    {
      id: "privacidade",
      label: "Privacidade, equidade, acessibilidade e limites",
      peso: 25,
      cheque: "Há limites de decisão, cuidado com dados e com critérios sem pertinência?",
      dica: "inclua o que a IA não pode decidir e como evitar critérios e dados indevidos",
    },
    {
      id: "estrutura",
      label: "Estrutura e utilidade prática",
      peso: 15,
      cheque: "O formato é utilizável por quem vai receber a entrega?",
      dica: "defina campos, estrutura e extensão da entrega",
    },
    {
      id: "evidencias",
      label: "Evidências e revisão humana",
      peso: 20,
      cheque: "A saída mostra evidências e pendências e há aprovador definido?",
      dica: "peça evidências da fonte e a lista do que a pessoa deve aprovar",
    },
  ];
export type RubricaRhId = (typeof RUBRICA)[number]["id"];
export const RUBRICA_ANCORAS = [
  "0 ausente ou contrário à tarefa",
  "1 insuficiente",
  "2 parcial",
  "3 adequado",
  "4 consistente e verificável",
];
export const FAIXAS: [number, string][] = [
  [85, "Excelente"],
  [70, "Bom, com ajustes"],
  [50, "Revisão necessária"],
  [0, "Reconstrução guiada"],
];
export const faixaRh = (n: number) => FAIXAS.find(([min]) => n >= min)![1];
export const notaRubrica = (notas: Partial<Record<string, number>>) =>
  Math.round(RUBRICA.reduce((a, r) => a + (r.peso * (notas[r.id] ?? 0)) / 4, 0));

export const ESCALA_COMPONENTE = [
  "0 ausente",
  "25 incompleto",
  "50 parcial",
  "75 adequado",
  "100 completo e sustentado",
];
export const COMPONENTES_NOTA: { id: string; label: string; peso: number }[] = [
  { id: "mapa", label: "Mapa de oportunidades e limites", peso: 15 },
  { id: "prompts", label: "Quatro prompts e quatro entregas revisadas", peso: 45 },
  { id: "teste", label: "Teste documentado e revisão", peso: 20 },
  { id: "indicadores", label: "Exercício de indicadores", peso: 10 },
  { id: "piloto", label: "Plano de piloto", peso: 10 },
];

export const ERROS_CRITICOS = [
  "Não reproduzi nem “suavizei” critério discriminatório (idade, situação familiar, aparência).",
  "Não incluí dado real ou identificável de colaborador ou candidato.",
  "Não apresentei benefício, direito, prazo ou valor inventado como regra vigente.",
  "Não incluí diagnóstico, rótulo de personalidade nem decisão pessoal automatizada.",
  "Não inventei credencial, nome, link ou evidência.",
];
export const ERROS_CRITICOS_DEF =
  "Erro crítico: discriminação não corrigida; exposição indevida de dado; criação de benefício/direito como regra vigente; diagnóstico ou decisão pessoal automatizada; credencial ou evidência inventada. Nota alta não compensa erro crítico; o caminho é revisar, sem punição permanente.";

export const FEEDBACK_FORMATO = [
  "Evidência do que você fez bem.",
  "Trecho problemático ou campo ausente.",
  "Por que importa para RH.",
  "Ação de revisão.",
  "O que conferir antes de uso real.",
];
export const FEEDBACK_EXEMPLO =
  "Você preservou as atividades de F1. Porém, incluiu inglês intermediário, que não está confirmado. Isso pode criar uma barreira sem justificativa e descaracteriza a requisição. Remova o requisito ou registre-o como pergunta ao solicitante; não o publique como obrigatório.";

/* ------------------------------------ quiz --------------------------------- */

export interface QuizItem {
  q: string;
  options: string[];
  answer: number;
  why: string;
}
export const RH_QUIZ: QuizItem[] = [
  {
    q: "O melhor primeiro caso é:",
    options: [
      "Decisão automática de demissão.",
      "Rascunho de FAQ com política fictícia.",
      "Análise secreta de saúde.",
    ],
    answer: 1,
    why: "Tarefa limitada e verificável.",
  },
  {
    q: "Uma requisição pede “jovem sem filhos”. Devemos:",
    options: ["Suavizar a frase.", "Manter.", "Sinalizar e revisar critérios pertinentes."],
    answer: 2,
    why: "Não disfarçar critérios inadequados.",
  },
  {
    q: "Um salário associado ao colaborador é automaticamente dado pessoal sensível na LGPD?",
    options: [
      "Não; é dado pessoal que exige proteção, sem classificação automática como sensível.",
      "Sim.",
      "Não é dado pessoal.",
    ],
    answer: 0,
    why: "Salário identificável é dado pessoal que exige cuidado, mas não está entre as categorias sensíveis da definição legal.",
  },
  {
    q: "A F3 não informa teto de reembolso. Responder:",
    options: [
      "R$ 2.000.",
      "Não informado; orientar o canal responsável sem prometer.",
      "O curso é proibido.",
    ],
    answer: 1,
    why: "Ausência de regra não equivale a proibição nem a autorização.",
  },
  {
    q: "A IA pode inventar o responsável por uma etapa?",
    options: ["Sim.", "Se parecer comum.", "Não; marcar pendência."],
    answer: 2,
    why: "Lacunas ficam explícitas, não são preenchidas por padrão de mercado.",
  },
  {
    q: "Para F4, a formulação adequada é:",
    options: [
      "“É descomprometido.”",
      "“Teve dois registros sem próximo passo nas simulações.”",
      "“Possui transtorno de atenção.”",
    ],
    answer: 1,
    why: "Fato observável, sem rótulo nem diagnóstico.",
  },
  {
    q: "Março em F5:",
    options: ["75%", "15%", "20%"],
    answer: 0,
    why: "15 dividido por 20.",
  },
  {
    q: "Abril menos março:",
    options: ["5% de aumento relativo.", "5 pontos percentuais.", "25 pontos percentuais."],
    answer: 1,
    why: "80% − 75% = 5 pontos percentuais.",
  },
  {
    q: "A taxa de maio é:",
    options: ["90%.", "18%.", "Não calculável sem o denominador."],
    answer: 2,
    why: "18 é contagem, não porcentagem, e o total de ingressantes não foi informado.",
  },
  {
    q: "Tirar nomes garante anonimização?",
    options: ["Sim.", "Não; outros dados podem identificar.", "Sim, se usar códigos."],
    answer: 1,
    why: "Cargo, unidade e combinações ainda podem revelar a pessoa.",
  },
  {
    q: "Nota de uma IA avaliadora prova ausência de viés e conformidade?",
    options: ["Sim.", "Só se for alta.", "Não; são necessárias outras verificações e governança."],
    answer: 2,
    why: "Uma nota não substitui verificação independente nem governança.",
  },
  {
    q: "Em apoio a RH, revisão humana adequada significa:",
    options: [
      "Aceitar recomendação sem discutir.",
      "Ter pessoa responsável capaz de conferir, contestar e interromper.",
      "Pedir assinatura sem mostrar a fonte.",
    ],
    answer: 1,
    why: "Supervisão humana não pode ser um carimbo.",
  },
];
export const RH_QUIZ_FEEDBACK_FINAL =
  "Conhecer o conceito é uma parte. A aplicação será verificada no seu kit.";

/* ---------------------------------- microtextos ---------------------------- */

export const MSG = {
  fonteInsuficiente:
    "A fonte não traz essa informação. Registre a pendência em vez de preencher por suposição.",
  dadoReal:
    "Este laboratório usa apenas dados fictícios. Remova identificadores e não envie documentos pessoais.",
  semIa: "Autoavaliação guiada por rubrica; não houve avaliação automática por modelo.",
  erroSalvar:
    "Não foi possível confirmar o salvamento. Copie ou exporte sua resposta antes de sair.",
  local: "Salvo neste navegador. O conteúdo pode não estar disponível em outro dispositivo.",
  conclusao:
    "Você concluiu o Módulo 1 de RH e Gestão de Pessoas. Seu kit reúne quatro aplicações revisadas e um plano de piloto. Esta conclusão não autoriza publicar materiais nem automatizar decisões reais sem aprovação.",
  proximo: "Próximo módulo ainda não disponível",
  avaliacaoAviso:
    "Esta avaliação não certifica habilitação em RH, direito, psicologia ou uso de sistema de seleção.",
};

export const GLOSSARIO_RH: [string, string][] = [
  ["Prompt", "Entrada que orienta a tarefa pedida à IA."],
  ["Contexto", "Conjunto de informações disponíveis e relevantes para realizar a tarefa."],
  ["Alucinação", "Conteúdo incorreto ou sem sustentação apresentado como válido."],
  [
    "Viés",
    "Distorção que pode surgir dos dados, das instruções, dos critérios e do uso da ferramenta.",
  ],
  ["Dado pessoal", "Informação sobre pessoa identificada ou identificável."],
  [
    "Dado pessoal sensível",
    "Categoria com definição específica na LGPD, como saúde, origem racial ou étnica e filiação sindical.",
  ],
  [
    "Informação confidencial",
    "Informação empresarial que exige sigilo, como estrutura salarial interna ou plano de reorganização, com ou sem dados pessoais.",
  ],
  [
    "Anonimização",
    "Processo que impede a identificação da pessoa; trocar nomes por códigos não a garante.",
  ],
  [
    "Pseudonimização",
    "Substituição ou separação de identificadores que não equivale necessariamente a anonimização. Não promete segurança ou conformidade por técnica isolada.",
  ],
  ["Evidência", "Elemento da fonte que sustenta uma afirmação."],
  ["Hipótese", "Explicação a investigar, não uma conclusão demonstrada."],
  ["Indicador", "Medida definida para acompanhar um processo."],
  ["Numerador", "Número de casos que atendem ao critério (ex.: conclusões no prazo)."],
  ["Denominador", "Total de casos do mesmo período (ex.: total de ingressantes)."],
  ["Ponto percentual", "Diferença absoluta entre duas taxas (80% − 75% = 5 p.p.)."],
  [
    "Revisão humana",
    "Verificação feita por pessoa responsável capaz de conferir, contestar e interromper.",
  ],
  ["Piloto", "Teste pequeno, com escopo, responsável, período e critérios de interrupção."],
  [
    "Escalonamento",
    "Encaminhar a questão ao canal ou à pessoa responsável quando a fonte não a cobre.",
  ],
];

export const REFERENCIAS: [string, string][] = [
  [
    "SHRM — How HR Can Harness AI While Maintaining Trust and Accountability",
    "https://www.shrm.org/topics-tools/employment-law-compliance/how-hr-can-harness-ai-while-maintaining-trust-accountability",
  ],
  [
    "ANPD — Perguntas Frequentes (dados pessoais, bases legais, adequação e direitos)",
    "https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes",
  ],
  [
    "LGPD, Lei 13.709/2018 (arts. 5º, 6º, 7º, 11 e 20)",
    "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm",
  ],
  [
    "U.S. Department of Justice — Algorithms, Artificial Intelligence, and Disability Discrimination in Hiring (referência norte-americana para riscos técnicos e acessibilidade; não é o direito aplicável ao Brasil)",
    "https://www.ada.gov/resources/ai-guidance/",
  ],
  [
    "Documentação oficial dos fornecedores para recursos e configurações efetivamente disponíveis.",
    "",
  ],
];
export const REFERENCIAS_NOTA =
  "Referências para conferência editorial. A checagem editorial e a atualização factual estão pendentes: esta versão não foi validada por navegação. O restante é desenho pedagógico e caso fictício da MOW Academy. Não há estatísticas de adoção, ganhos de produtividade ou garantias de redução de viés.";

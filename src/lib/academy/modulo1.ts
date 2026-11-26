import type { AreaId } from "./areas";

/** Módulo 1 — Fundamentos de IA Corporativa. Todos os casos são fictícios. */

export const M1_UNITS = [
  "O que a IA realmente faz",
  "Prompt, contexto e limites",
  "Erros convincentes e validação",
  "Dados e uso responsável",
  "Escolher ferramenta e tarefa",
  "PACTO na prática",
  "Experimentar, conferir e melhorar",
  "Consolidação e entrega",
] as const;

export const M1_OPENING = {
  title: "IA no trabalho: antes de acelerar, aprenda a dirigir.",
  paragraphs: [
    "Você já definiu sua trilha e criou seu primeiro prompt no Módulo Start. Agora vamos entender por que a IA ajuda em certas tarefas, por que falha em outras e como escolher bons pontos de partida.",
    "Imagine receber um rascunho bem escrito, organizado e convincente. Ele pode parecer pronto para envio. Mas uma informação inventada, um prazo não autorizado ou um número incorreto pode transformar agilidade em retrabalho.",
    "Neste módulo, você aprenderá a aproveitar a velocidade da IA sem abrir mão do seu julgamento. Seu objetivo não é decorar termos técnicos. É reconhecer quando usar a ferramenta, o que fornecer e o que conferir.",
    "Ao final, você terá cinco prompts da sua área e o registro de um teste. Use exemplos fictícios sempre que os dados reais não forem autorizados.",
  ],
  objetivos: [
    "Diferenciar busca, geração de conteúdo, cálculo e automação.",
    "Explicar prompt, contexto, token, janela de contexto e alucinação em linguagem simples.",
    "Selecionar cinco tarefas reais ou simuladas adequadas ao apoio de IA.",
    "Distinguir dado pessoal, dado pessoal sensível e informação empresarial confidencial.",
    "Construir cinco prompts usando PACTO como apoio, sem tratá-lo como fórmula obrigatória.",
    "Avaliar pelo menos uma resposta por evidência, fidelidade, utilidade e segurança.",
    "Definir três limites de delegação à IA e um próximo experimento profissional.",
  ],
};

export interface Unit {
  paras: string[];
  /** Desafio extra opcional, exibido para quem já tem experiência. */
  extra: string;
}

export const UNITS: Unit[] = [
  {
    paras: [
      "IA generativa é uma categoria de sistemas que produz conteúdos, como textos, imagens e código, a partir de entradas. Neste curso, começamos com ferramentas baseadas em modelos de linguagem.",
      "Um modelo de linguagem processa o contexto disponível e gera uma resposta. Ele pode seguir instruções, reconhecer padrões e combinar informações, mas não é uma pessoa nem uma fonte infalível. Uma resposta confiante não demonstra que houve checagem.",
      "Algumas ferramentas podem pesquisar na web, consultar arquivos ou executar cálculos. Essas capacidades dependem dos recursos habilitados. Não presuma que uma conversa tenha acessado a internet, lido um arquivo ou rodado uma fórmula só porque a resposta parece detalhada.",
      "Pedir à ferramenta que “atue como especialista” ajuda a orientar o estilo e o foco. Isso não lhe concede formação profissional, responsabilidade legal ou acesso a informações que não recebeu.",
      "O ponto de partida profissional é perguntar: qual tarefa estou delegando, de quais informações ela depende e quem verificará a entrega?",
    ],
    extra:
      "Descreva uma tarefa da sua rotina que combina duas operações (por exemplo, busca + geração) e diga qual verificação cada uma exige.",
  },
  {
    paras: [
      "Prompt é a instrução ou conjunto de entradas usado para orientar a resposta. Contexto é a informação disponível para executar a tarefa: histórico, arquivos efetivamente acessíveis, exemplos e instruções.",
      "Tokens são unidades de processamento que podem corresponder a partes de palavras, palavras ou outros elementos. Não há equivalência universal de um token por palavra.",
      "A janela de contexto é a capacidade de informação que um modelo consegue considerar em determinado uso. Esse limite varia. Contexto longo não garante atenção perfeita a todos os detalhes. Um arquivo anexado também não deve ser considerado integralmente compreendido sem verificação.",
      "Quando a informação está ausente, peça esclarecimento ou sinalização de lacunas. Quando há informação demais, selecione o que é pertinente. Colar documentos sem critério aumenta exposição e pode dificultar a tarefa.",
      "Memória e histórico dependem do produto e das configurações. Não conte com lembranças de outra conversa: reapresente as informações essenciais quando necessário.",
    ],
    extra:
      "Reescreva um pedido vago que você já fez a uma IA em até 60 palavras, definindo transformação, público, tamanho e tratamento de lacunas.",
  },
  {
    paras: [
      "Alucinação é uma resposta que contém conteúdo incorreto ou sem sustentação, apresentado como se fosse válido. Pode aparecer como referência inexistente, detalhe inventado ou conclusão além dos dados.",
      "Um modelo pode preencher uma lacuna com algo plausível. Escrever “não invente” ajuda a orientar o comportamento, mas não garante que o erro desapareça.",
      "Se você pedir fontes, ainda precisará conferir se existem, se foram acessadas e se sustentam a afirmação. Um endereço ou título com aparência legítima não é evidência suficiente.",
      "Viés é uma distorção que pode surgir dos dados, das instruções, dos critérios escolhidos e do uso da ferramenta. Em decisões sobre pessoas, revise generalizações, critérios irrelevantes e tratamentos injustos.",
      "A autoavaliação da IA pode apontar problemas, mas não equivale a uma auditoria independente. A segurança vem da combinação de boas instruções, fontes verificáveis, testes e revisão humana qualificada.",
    ],
    extra:
      "Escreva uma instrução que peça à IA para separar fato, hipótese e recomendação em uma resposta sobre um tema da sua área.",
  },
  {
    paras: [
      "Nem toda informação protegida pertence à mesma categoria. Para trabalhar com segurança, faça três distinções.",
      "Dado pessoal é informação relacionada a uma pessoa natural identificada ou identificável. Nome, CPF e um e-mail identificável podem ser exemplos.",
      "Dado pessoal sensível tem significado específico na LGPD: envolve categorias como origem racial ou étnica, convicção religiosa, opinião política, filiação sindical ou a organização religiosa, filosófica ou política, saúde, vida sexual e dado genético ou biométrico quando vinculado a uma pessoa natural.",
      "Informação empresarial confidencial inclui, por exemplo, estratégia ainda não divulgada, preço negociado e segredo comercial. Pode ou não conter dados pessoais.",
      "Salário, dados financeiros e avaliações profissionais exigem cuidado, mas não devem ser chamados automaticamente de dados pessoais sensíveis na definição legal da LGPD. O contexto continua importante.",
      "Neste curso, prefira dados fictícios ou efetivamente anonimizados. Trocar o nome de uma pessoa por um código pode não anonimizar o conjunto: cargo, local e outros detalhes ainda podem permitir identificação.",
      "Antes de usar informações reais, verifique a política da empresa, finalidade, necessidade, base legal aplicável, acesso e regras do fornecedor. Autorização informal ou simples consentimento não resolve todos os requisitos. Em dúvida, consulte os responsáveis por privacidade e segurança.",
    ],
    extra:
      "Liste três informações da sua rotina que exigem cuidado e indique, para cada uma, quem na empresa deve ser consultado antes de qualquer uso com IA.",
  },
  {
    paras: [
      "Escolha ferramentas pela tarefa, pelo ambiente autorizado e pela capacidade disponível — não pela promessa de que uma marca é sempre superior.",
      "ChatGPT e Claude podem ser explorados para redação, transformação de documentos e análise, conforme recursos habilitados. Gemini pode ser relevante em rotinas de Google Workspace; Microsoft 365 Copilot, em rotinas de Microsoft 365; Perplexity, em pesquisas apoiadas em fontes. Essas são possibilidades de uso, não garantias de recursos, qualidade ou licença.",
      "Antes de testar, confira: a ferramenta é autorizada? A tarefa exige web, arquivos, cálculo ou integração? O recurso está no meu plano e na minha conta? Consigo verificar a resposta? Há alternativa manual segura?",
      "Não é necessário assinar todas as ferramentas. Comece com uma solução autorizada e casos de baixo risco. Compare o resultado com critérios iguais se quiser avaliar outra plataforma.",
    ],
    extra:
      "Defina três critérios iguais para comparar duas ferramentas autorizadas na mesma tarefa, sem estimar ganhos percentuais antes de medir.",
  },
  {
    paras: [
      "PACTO é um recurso didático usado neste curso para lembrar cinco elementos úteis: Papel, Ação, Contexto, Tom e Output, isto é, formato de saída.",
      "Ele não é uma fórmula universal nem precisa aparecer com essas palavras em todo prompt. A instrução deve ser tão simples quanto possível e tão completa quanto necessário.",
      "Papel orienta perspectiva, mas não transforma a IA em especialista habilitado. Ação explicita o trabalho. Contexto fornece as informações pertinentes. Tom define a comunicação. Output especifica a entrega.",
      "Acrescente limites, fontes e critérios de revisão conforme o risco. Nenhuma estrutura de prompt garante precisão. O teste e a revisão continuam obrigatórios no fluxo do curso.",
    ],
    extra:
      "Escreva uma versão do seu melhor prompt sem a palavra “Papel” e explique se a qualidade caiu, ficou igual ou melhorou.",
  },
  {
    paras: [
      "Um prompt bem escrito é uma hipótese de trabalho. O teste mostra se ele produz uma entrega utilizável.",
      "Escolha um de seus cinco prompts e execute-o em uma ferramenta autorizada, usando o caso fictício. Copie a resposta para o laboratório. Se não tiver acesso, use o modo de comparação guiada.",
      "Não avalie apenas a fluência. Confira se a resposta respeita a fonte, preserva lacunas, cumpre formato, evita promessas e pode ser usada no objetivo definido.",
      "Revise primeiro o que tem maior impacto. Se faltam dados, não resolva acrescentando uma ordem para a IA adivinhar. Esclareça a entrada ou instrua a marcar a lacuna.",
      "Registre o que mudou entre as versões. Esse histórico transforma uma boa tentativa em conhecimento reutilizável.",
    ],
    extra:
      "Rode o mesmo prompt duas vezes e registre o que mudou entre as respostas. O que isso diz sobre a necessidade de conferir?",
  },
  {
    paras: [
      "Aprender IA corporativa começa por escolher bons problemas e conferir resultados. Você não precisa automatizar tudo para obter valor.",
      "Neste módulo, você distinguiu geração, busca, cálculo e automação; praticou contexto e validação; identificou riscos; criou cinco prompts e testou um deles.",
      "Agora organize suas entregas. Guarde o que funcionou, registre o que ainda precisa de confirmação e escolha uma aplicação de baixo risco para a próxima semana.",
      "Na Semana 2, você aprofundará a anatomia do prompt profissional: limites, exemplos, formatos e critérios de qualidade. O objetivo será tornar suas instruções mais consistentes e reutilizáveis.",
    ],
    extra:
      "Escreva um critério objetivo para decidir, daqui a duas semanas, se o seu próximo experimento valeu a pena, incluindo o tempo de revisão.",
  },
];

/* --------------------------------- U1 --------------------------------- */

export const U1_COMPARACAO: [string, string][] = [
  ["Busca", "localiza páginas e documentos; ainda exige verificação de fonte e pertinência."],
  ["Geração", "cria e transforma conteúdo; pode incluir informações incorretas."],
  ["Cálculo", "executa operações por mecanismo apropriado; exige dados e fórmulas corretos."],
  [
    "Automação",
    "executa etapas com regras e ferramentas; requer permissões, testes e tratamento de exceções.",
  ],
];

export const U1_OPCOES = [
  "Busca/consulta à fonte aprovada",
  "Geração/transformação com fidelidade ao documento",
  "Cálculo com planilha ou código e conferência dos dados",
  "Automação com permissões e regras",
];

export const U1_ITENS: { texto: string; correta: number }[] = [
  { texto: "Encontrar a versão vigente de uma política publicada pela empresa.", correta: 0 },
  { texto: "Transformar uma política fornecida em um comunicado de 120 palavras.", correta: 1 },
  { texto: "Somar 500 lançamentos de uma planilha.", correta: 2 },
  { texto: "Enviar lembretes após aprovação de uma demanda.", correta: 3 },
];

export const U1_FEEDBACK =
  "A ferramenta adequada depende da operação. Uma boa redação não prova uma boa busca ou um cálculo correto.";

/* --------------------------------- U2 --------------------------------- */

export const U2_DEMO = {
  vago: "Faça um relatório melhor.",
  especifico:
    "Reorganize as anotações abaixo em um resumo de até 200 palavras para a gerência, com situação atual, pendências e próximos passos. Não crie fatos, responsáveis ou prazos ausentes; escreva “não informado” nessas lacunas.",
  explicacao:
    "A segunda instrução define transformação, público, tamanho e tratamento de lacunas. Não precisa ser longa para ser clara.",
};

export const U2_TAREFA = "Criar um rascunho de aviso de manutenção de um sistema.";
export const U2_OPCOES: { id: string; texto: string; ok: boolean }[] = [
  { id: "A", texto: "Janela de indisponibilidade aprovada", ok: true },
  { id: "B", texto: "Público afetado", ok: true },
  { id: "C", texto: "CPF dos usuários", ok: false },
  { id: "D", texto: "Canal de suporte autorizado", ok: true },
  { id: "E", texto: "Histórico salarial da equipe", ok: false },
  { id: "F", texto: "Ação esperada do usuário", ok: true },
];
export const U2_FEEDBACK_ERRO =
  "Contexto útil não significa incluir tudo. Selecione dados que mudam a entrega e elimine informações pessoais sem necessidade.";

/* --------------------------------- U3 --------------------------------- */

export const U3_CASO = {
  fonte:
    "Reunião sobre onboarding. Há dúvidas recorrentes no início. Foi sugerido criar uma FAQ. A equipe vai avaliar a proposta na próxima reunião. Não foram definidos responsável ou prazo.",
  inadequada:
    "A equipe aprovou a FAQ. Ana ficará responsável e publicará até sexta-feira. A medida reduzirá chamados em 40%.",
  afirmacoes: [
    {
      id: "aprov",
      texto: "“A equipe aprovou a FAQ.”",
      extrap: true,
      nota: "A aprovação não aconteceu: a proposta será avaliada.",
    },
    { id: "ana", texto: "“Ana ficará responsável.”", extrap: true, nota: "Ana não foi designada." },
    {
      id: "sexta",
      texto: "“Publicará até sexta-feira.”",
      extrap: true,
      nota: "Sexta-feira não foi definida.",
    },
    {
      id: "40",
      texto: "“A medida reduzirá chamados em 40%.”",
      extrap: true,
      nota: "Os 40% não têm evidência.",
    },
  ],
  revisada:
    "Foi sugerida a criação de uma FAQ para dúvidas do onboarding. A proposta será avaliada na próxima reunião. Aprovação, responsável, prazo e impacto esperado: não informados.",
  feedback:
    "Ser útil inclui preservar incertezas. Não troque ausência de informação por certeza bem escrita.",
};

/* --------------------------------- U4 --------------------------------- */

export const U4_NOTA =
  "Esta orientação é introdutória e não substitui análise jurídica ou política interna.";

export const U4_CATEGORIAS = [
  "Dado pessoal",
  "Dado pessoal sensível",
  "Informação empresarial confidencial",
  "Material fictício para prática",
  "Dado pessoal e informação confidencial, não automaticamente sensível na definição legal",
  "Não presumir anonimização; tratar como potencialmente pessoal",
];

export const U4_CARTOES: { texto: string; correta: number }[] = [
  { texto: "CPF de cliente.", correta: 0 },
  { texto: "Histórico de saúde de colaborador.", correta: 1 },
  { texto: "Plano de lançamento não divulgado, sem nomes.", correta: 2 },
  { texto: "Base comercial inteiramente fictícia, identificada como simulação.", correta: 3 },
  { texto: "Lista de salários associada aos colaboradores.", correta: 4 },
  {
    texto: "Tabela com códigos, mas que permite identificar cada funcionário pelo cargo e unidade.",
    correta: 5,
  },
];

export const U4B = {
  cenario:
    "Um colega sugere colar currículos reais em uma ferramenta pública para escolher automaticamente quem será contratado.",
  esperado: [
    "Não realizar o envio sem avaliação e autorização adequadas.",
    "Não delegar a decisão de contratação à IA.",
    "Usar um caso fictício para aprender.",
    "Encaminhar o fluxo real aos responsáveis por RH, privacidade e segurança.",
  ],
  feedback:
    "Remover nomes não torna qualquer conjunto seguro. Além dos dados, avalie o impacto da decisão.",
};

/* --------------------------------- U5 --------------------------------- */

export const U5_CHECKLIST = [
  "Dados permitidos e finalidade definida.",
  "Capacidade necessária realmente disponível.",
  "Fontes ou documentos verificáveis.",
  "Custo e limitações conhecidos.",
  "Revisão e responsável definidos.",
  "Alternativa caso a ferramenta falhe.",
];

export const U5_PRIORIDADES = [
  "Começar: tarefa frequente, reversível e com dados fictícios/públicos autorizados",
  "Avaliar antes: dados internos ou necessidade de integração/permissão",
  "Não executar neste curso: decisão sensível automatizada, divulgação não autorizada ou ação irreversível",
];

export const U5_CAMPOS = [
  { id: "tarefa", label: "Tarefa" },
  { id: "freq", label: "Frequência" },
  { id: "dificuldade", label: "Dificuldade atual" },
  { id: "entrada", label: "Tipo de entrada" },
  { id: "entrega", label: "Entrega esperada" },
  { id: "dados", label: "Dados envolvidos" },
  { id: "risco", label: "Risco" },
  { id: "ferramenta", label: "Ferramenta autorizada ou “a confirmar”" },
  { id: "verificacao", label: "Verificação" },
  { id: "decisao", label: "Decisão final humana (quem decide)" },
] as const;

/* --------------------------------- U6 --------------------------------- */

export const U6_MODELO = `Papel ou perspectiva: [opcional, quando útil].
Ação: [verbo e objetivo].
Contexto: [situação, público e dados fictícios/autorizados].
Tom: [adequado ao público].
Formato: [entrega, campos e limite].
Limites: use apenas a fonte; marque lacunas; não crie compromissos.
Verificação: aponte a evidência e o que deve ser conferido por uma pessoa.
Fonte: [conteúdo de entrada claramente separado].`;

export const RUBRICA = [
  {
    id: "clareza",
    label: "Clareza da ação",
    peso: 20,
    dica: "diga em uma frase o verbo e o objetivo da tarefa",
    cheque: "se a ação pedida pode ser entendida sem adivinhação",
  },
  {
    id: "contexto",
    label: "Contexto relevante e dados de entrada",
    peso: 20,
    dica: "inclua situação, público e a fonte fictícia, separada do restante",
    cheque: "se todos os fatos usados vieram da fonte",
  },
  {
    id: "formato",
    label: "Formato e adequação ao público",
    peso: 15,
    dica: "especifique campos, extensão e tom para quem vai ler",
    cheque: "se o formato pedido foi seguido",
  },
  {
    id: "limites",
    label: "Limites e tratamento de lacunas",
    peso: 20,
    dica: "diga o que não inventar e como marcar o que falta (por exemplo, “não informado”)",
    cheque: "se lacunas, prazos e valores ausentes continuam marcados",
  },
  {
    id: "verificacao",
    label: "Verificação humana e segurança",
    peso: 15,
    dica: "peça uma lista do que a pessoa deve conferir antes do uso e evite dados reais",
    cheque: "se não há dado pessoal, senha ou promessa não autorizada",
  },
  {
    id: "aplicabilidade",
    label: "Aplicabilidade à tarefa e trilha",
    peso: 10,
    dica: "aproxime o prompt da tarefa e do vocabulário da sua área",
    cheque: "se o resultado serve ao objetivo da tarefa",
  },
] as const;
export type RubricaId = (typeof RUBRICA)[number]["id"];

export const RUBRICA_ANCORAS = [
  "ausente",
  "insuficiente",
  "parcial",
  "adequado",
  "consistente e verificável",
];

/** Nota final = soma(peso × nota ÷ 4), de 0 a 100. */
export function notaFinal(notas: Partial<Record<RubricaId, number>>): number | undefined {
  if (RUBRICA.some((r) => notas[r.id] === undefined)) return undefined;
  return Math.round(RUBRICA.reduce((a, r) => a + (r.peso * (notas[r.id] ?? 0)) / 4, 0));
}
export function faixa(n: number) {
  return n >= 85
    ? "Excelente"
    : n >= 70
      ? "Bom, com ajustes"
      : n >= 50
        ? "Revisão necessária"
        : "Reconstrução guiada";
}

/* ------------------------------ casos por trilha ----------------------------- */

export interface Caso {
  id: AreaId;
  nome: string;
  caso: string;
  tarefas: string[];
  resolvido: string;
  padrao: string;
  verificacao: string;
  inadequada: string;
  errosReais: string[];
}

export const CASOS: Caso[] = [
  {
    id: "vendas",
    nome: "Vendas e Pré-vendas",
    caso: "A empresa fictícia Prisma oferece uma solução de organização de pedidos. Prospect fictício: Loja Horizonte. Uma reunião de demonstração aconteceu; o prospect relatou dificuldade de acompanhar solicitações e pediu informações sobre implantação. Não há preço, desconto, data de implantação ou promessa de resultado aprovados.",
    tarefas: [
      "E-mail de follow-up",
      "Roteiro de descoberta",
      "Resumo de reunião",
      "Organização de dúvidas em FAQ comercial",
      "Checklist de próxima conversa",
    ],
    resolvido:
      "Organize um e-mail de follow-up consultivo de até 120 palavras para o responsável fictício da Loja Horizonte. Use apenas o caso da Prisma. Retome a dificuldade relatada e proponha uma conversa para esclarecer implantação, sem assumir disponibilidade. Entregue assunto, corpo e chamada para ação. Não crie preço, desconto, prazo ou resultado prometido. Ao final, liste separadamente o que o vendedor deve confirmar antes do envio. Fonte: [caso fictício].",
    padrao: "Retomada fiel e próximo passo sem compromisso inventado.",
    verificacao: "Informações comerciais e autorização antes de qualquer envio.",
    inadequada: "Implantamos em 24 horas com 30% de desconto garantido.",
    errosReais: ["Prazo inventado (24 horas).", "Desconto inventado (30% garantido)."],
  },
  {
    id: "marketing",
    nome: "Marketing e Conteúdo",
    caso: "A marca fictícia Vereda oferece um organizador semanal digital. Público: pequenos gestores com tarefas dispersas. Recursos confirmados: quadro de tarefas, etiquetas e visão semanal. Não há pesquisa de satisfação, depoimentos, números de produtividade ou comparação comprovada com concorrentes.",
    tarefas: [
      "Ideias de post",
      "Calendário de uma semana",
      "Revisão de texto de divulgação",
      "Adaptação para e-mail",
      "Checklist de afirmações publicitárias",
    ],
    resolvido:
      "Atue como redator de comunicação profissional. Crie três ideias de posts para divulgar a Vereda ao público descrito, usando somente os recursos confirmados. Para cada ideia, entregue título, argumento central e chamada para conhecer o produto. Tom claro, sem exagero. Não invente estatísticas, depoimentos, garantias de produtividade ou superioridade. Separe sugestões criativas de afirmações factuais. Fonte: [caso fictício].",
    padrao: "Ideias relacionadas a recursos reais, sem evidência inventada.",
    verificacao: "Marca, oferta e comprovação de alegações.",
    inadequada: "90% dos usuários dobraram sua produtividade.",
    errosReais: [
      "Estatística sem evidência (90%).",
      "Resultado sem evidência (dobraram a produtividade).",
    ],
  },
  {
    id: "atendimento",
    nome: "Atendimento e Suporte",
    caso: "Cliente fictício não recebeu o link de acesso ao portal. Política fictícia: orientar conferência de spam; confirmar se o e-mail de cadastro está correto sem pedir senha; encaminhar ao suporte se não resolver. Não existe prazo de resolução confirmado nem autorização para reembolso.",
    tarefas: [
      "Resposta inicial",
      "Classificação de solicitações",
      "FAQ de acesso",
      "Resumo do atendimento",
      "Checklist de encaminhamento humano",
    ],
    resolvido:
      "Redija uma resposta empática de até 100 palavras ao cliente fictício que não recebeu acesso. Use somente a política fornecida. Inclua a conferência de spam e um próximo passo de suporte. Não peça senha, não reproduza dados pessoais e não prometa prazo ou reembolso. Entregue rascunho de resposta e pontos a verificar antes do envio. Fonte: [caso fictício].",
    padrao: "Orientação fiel e segura, sem promessa não autorizada.",
    verificacao: "Identidade por canal apropriado e aderência à política.",
    inadequada: "Envie sua senha; resolveremos em dez minutos.",
    errosReais: ["Solicitação insegura (pedir a senha).", "Prazo inventado (dez minutos)."],
  },
  {
    id: "rh",
    nome: "RH e Gestão de Pessoas",
    caso: "A empresa fictícia Aurora abre vaga de assistente administrativo. Atividades: organizar agenda, atualizar controles e apoiar atendimento interno. Requisitos confirmados: comunicação escrita e noções de planilhas. Jornada, salário, benefícios e local não foram informados. Não há necessidade declarada de idade, gênero, estado civil ou característica pessoal.",
    tarefas: [
      "Descrição de vaga",
      "Roteiro de entrevista sobre competências",
      "Plano de onboarding",
      "Comunicado de treinamento",
      "Checklist de revisão inclusiva",
    ],
    resolvido:
      "Estruture uma descrição inclusiva para a vaga fictícia de assistente administrativo da Aurora. Use apenas atividades e requisitos confirmados. Entregue apresentação, responsabilidades, requisitos e campos pendentes. Marque jornada, salário, benefícios e local como “a confirmar”. Não acrescente exigências discriminatórias ou não relacionadas à função. Este é um rascunho para revisão do RH, não uma decisão sobre candidatos. Fonte: [caso fictício].",
    padrao: "Clareza e lacunas explícitas, sem requisitos inventados.",
    verificacao: "Critérios ocupacionais, política interna e publicação.",
    inadequada: "Exigimos candidatos de até 25 anos; salário confirmado de R$ 3.000.",
    errosReais: [
      "Critério irrelevante e discriminatório (idade máxima).",
      "Valor inventado (salário de R$ 3.000).",
    ],
  },
  {
    id: "financeiro",
    nome: "Financeiro e Controladoria",
    caso: "Empresa fictícia Delta. Setembro: receita de R$ 100.000 e despesas de R$ 70.000. Outubro: receita de R$ 110.000 e despesas de R$ 82.000. Não há dados de impostos, caixa, recebimento, regime contábil ou causas das variações. Para este exercício, saldo simplificado significa receita menos despesas; não é uma demonstração contábil completa.",
    tarefas: [
      "Resumo dos valores",
      "Estrutura de relatório gerencial",
      "Perguntas sobre variações",
      "Checklist de conferência",
      "Comunicação gerencial de pendências",
    ],
    resolvido:
      "Prepare um resumo gerencial de até 150 palavras usando somente os dados fictícios da Delta. Mostre receitas, despesas e saldo simplificado por mês em tabela. Se calcular, apresente as operações e sinalize necessidade de conferência em planilha ou calculadora. Não atribua causas, não confunda saldo simplificado com lucro contábil ou caixa e não dê recomendação de investimento. Liste três informações faltantes. Fonte: [caso fictício].",
    padrao:
      "Conferência: saldo simplificado de setembro R$ 30.000; outubro R$ 28.000. Receita aumentou R$ 10.000 e despesas R$ 12.000. Não há evidência sobre causas.",
    verificacao: "Recálculo e interpretação financeira competente.",
    inadequada: "O lucro subiu porque os impostos caíram.",
    errosReais: [
      "Não há lucro contábil calculável nem dados de impostos.",
      "O saldo simplificado diminuiu (de R$ 30.000 para R$ 28.000).",
    ],
  },
  {
    id: "operacoes",
    nome: "Operações e Logística",
    caso: "Empresa fictícia Rota. Fluxo informado: solicitação por e-mail; registro manual em planilha; conferência de estoque; separação; confirmação de envio. Equipe relata registros duplicados, mas não há medição de frequência nem causa confirmada.",
    tarefas: [
      "Descrição do fluxo atual",
      "Checklist de registro",
      "Roteiro de investigação de duplicidades",
      "Rascunho de procedimento",
      "Plano de teste de melhoria",
    ],
    resolvido:
      "Organize o fluxo fictício da Rota em uma tabela com etapa, entrada, saída e dúvida a esclarecer. Não invente sistema, responsável ou prazo. Separe o fato “há relato de duplicidade” de hipóteses sobre suas causas. Proponha duas verificações de baixo risco, sem alterar o processo real. Entregue uma seção “revisar com operações”. Fonte: [caso fictício].",
    padrao: "Preservação das cinco etapas; hipóteses identificadas, não afirmadas.",
    verificacao: "Validação do fluxo com quem executa e autorização para mudanças.",
    inadequada: "O sistema automático eliminou 100% das duplicidades.",
    errosReais: ["Sistema não informado no caso.", "Resultado (100%) e causa não demonstrados."],
  },
  {
    id: "gestao",
    nome: "Gestão, Liderança e Projetos",
    caso: "Projeto fictício Atlas. Reunião: material inicial está em revisão; time identificou dúvidas na comunicação com usuários; foi sugerida uma FAQ; proposta será avaliada na próxima reunião. Não há aprovação, responsável, prazo ou orçamento definidos.",
    tarefas: [
      "Resumo executivo",
      "Ata",
      "Pauta da próxima reunião",
      "Quadro de pendências",
      "Rascunho de atualização de status",
    ],
    resolvido:
      "Transforme as notas fictícias do Atlas em uma ata objetiva com fatos, propostas, decisões confirmadas e pendências. Não transforme sugestão em aprovação. Use “não definido” para responsável, prazo e orçamento ausentes. Acrescente três perguntas para a próxima reunião. Tom executivo. Fonte: [caso fictício].",
    padrao: "FAQ é proposta; nenhum responsável ou prazo inventado.",
    verificacao: "Confirmação pelos participantes antes de divulgar a ata.",
    inadequada: "FAQ aprovada para sexta-feira, sob responsabilidade de Ana.",
    errosReais: ["Aprovação inventada.", "Prazo e responsável inventados."],
  },
  {
    id: "dados",
    nome: "Dados, BI e Análise de Negócios",
    caso: "Tabela fictícia. Semana 1: 100 solicitações, 80 resolvidas no mesmo dia. Semana 2: 120 solicitações, 84 resolvidas no mesmo dia. Semana 3: total de solicitações ausente, 90 resolvidas no mesmo dia. Não há dados de equipe, complexidade ou mudanças de processo.",
    tarefas: [
      "Dicionário dos campos",
      "Checklist de qualidade",
      "Resumo descritivo",
      "Hipóteses de investigação",
      "Estrutura de relatório com limitações",
    ],
    resolvido:
      "Analise descritivamente a tabela fictícia. Mostre total e resolvidas no mesmo dia; calcule a taxa somente quando o denominador estiver disponível e mostre a operação para conferência. Não preencha o total da semana 3 nem atribua causalidade. Separe fatos, limitações e hipóteses. Entregue tabela e três próximas perguntas. Fonte: [caso fictício].",
    padrao:
      "Conferência: semana 1, 80%; semana 2, 70%; semana 3, taxa não calculável com os dados fornecidos. A quantidade resolvida aumentou, mas isso não prova aumento da taxa.",
    verificacao: "Qualidade dos dados, denominadores e recálculo.",
    inadequada: "Semana 3 teve taxa de 90%, confirmando que a automação melhorou o atendimento.",
    errosReais: [
      "Denominador ausente: a taxa da semana 3 não é calculável.",
      "Automação não informada e causalidade não demonstrada.",
    ],
  },
];

export const CASO_BY_ID = Object.fromEntries(CASOS.map((c) => [c.id, c])) as Record<AreaId, Caso>;

/** Alternativas incorretas para o modo guiado do laboratório (iguais para todas as trilhas). */
export const LAB_DISTRATORES = [
  "O texto está longo demais para ser usado.",
  "A resposta usa vocabulário informal demais.",
];

/* --------------------------------- U7 --------------------------------- */

export const U7_CHECKLIST = [
  "Fonte respeitada",
  "Lacunas marcadas",
  "Números conferidos",
  "Formato seguido",
  "Dados protegidos",
  "Decisão final sob responsabilidade humana",
];

/* --------------------------------- U8 --------------------------------- */

export const U8_ENTREGA = [
  "Matriz com cinco oportunidades.",
  "Cinco prompts da trilha, com versões e restrições.",
  "Um teste real com dados fictícios ou comparação guiada documentada.",
  "Três tarefas ou decisões que não serão delegadas integralmente à IA.",
  "Próximo experimento: tarefa, ferramenta autorizada ou pendente, verificação e responsável.",
  "Atualização do Perfil de Uso de IA, preservando o histórico do Módulo Start.",
];

export const U8_EXEMPLOS_LIMITE = [
  "Aprovação de contratação.",
  "Pagamento ou transferência.",
  "Envio de proposta com condição não aprovada.",
];

/* --------------------------------- quiz --------------------------------- */

export interface Q {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export const QUIZ: Q[] = [
  {
    q: "Uma resposta muito confiante comprova exatidão?",
    options: ["Sim.", "Não; é necessário verificar as informações relevantes.", "Só se for longa."],
    answer: 1,
    why: "Tom convincente não é evidência de veracidade.",
  },
  {
    q: "Qual contexto é mais adequado para um comunicado de manutenção?",
    options: [
      "Todos os dados dos usuários.",
      "Histórico salarial.",
      "Período aprovado, público afetado, orientações e canal de suporte.",
    ],
    answer: 2,
    why: "Relevância e necessidade orientam a seleção do contexto.",
  },
  {
    q: "Um token é sempre uma palavra inteira?",
    options: ["Não.", "Sim.", "É sempre uma frase."],
    answer: 0,
    why: "Tokens podem corresponder a diferentes unidades; a equivalência varia.",
  },
  {
    q: "Pedir “não invente” elimina alucinações?",
    options: ["Sim.", "Apenas com persona.", "Não; a resposta ainda exige verificação."],
    answer: 2,
    why: "Restrições ajudam, mas não garantem precisão.",
  },
  {
    q: "Qual é um exemplo de dado pessoal sensível na LGPD?",
    options: [
      "Receita agregada fictícia.",
      "Dado de saúde vinculado a uma pessoa.",
      "Nome de produto.",
    ],
    answer: 1,
    why: "Dados de saúde vinculados a pessoas estão entre as categorias sensíveis.",
  },
  {
    q: "Remover nomes garante anonimização?",
    options: [
      "Sim.",
      "Não; outros elementos podem permitir identificação.",
      "Sim, se substituir por números.",
    ],
    answer: 1,
    why: "O conjunto e a possibilidade de reidentificação importam.",
  },
  {
    q: "O que significa o O de PACTO neste curso?",
    options: ["Output: formato da entrega.", "Obrigatoriedade.", "Opinião."],
    answer: 0,
    why: "Formato orienta estrutura, campos e extensão esperados.",
  },
  {
    q: "A fonte não contém prazo para uma ação. O que a resposta deve fazer?",
    options: [
      "Inventar um prazo plausível.",
      "Usar sexta-feira.",
      "Marcar como não definido ou pedir confirmação.",
    ],
    answer: 2,
    why: "Lacunas devem permanecer explícitas.",
  },
  {
    q: "Uma ferramenta sem integração de cálculo deve ser considerada calculadora confiável por escrever uma resposta numérica?",
    options: [
      "Não; use cálculo apropriado e confira entradas e fórmulas.",
      "Sim.",
      "Sim, se houver tabela.",
    ],
    answer: 0,
    why: "Apresentação numérica não comprova execução nem correção.",
  },
  {
    q: "Qual tarefa é um bom primeiro experimento?",
    options: [
      "Automatizar demissões.",
      "Criar rascunho de pauta com dados fictícios e revisão humana.",
      "Publicar dados internos sem autorização.",
    ],
    answer: 1,
    why: "Comece por tarefas reversíveis e de baixo risco.",
  },
];
export const QUIZ_MIN = 8;

export const GLOSSARIO: [string, string][] = [
  [
    "IA generativa",
    "categoria de sistemas que produz conteúdos, como textos, imagens e código, a partir de entradas.",
  ],
  [
    "Modelo de linguagem",
    "sistema que processa o contexto disponível e gera uma resposta; pode seguir instruções e reconhecer padrões, mas não é uma fonte infalível.",
  ],
  ["Prompt", "instrução ou conjunto de entradas usado para orientar a resposta."],
  [
    "Contexto",
    "informação disponível para executar a tarefa: histórico, arquivos efetivamente acessíveis, exemplos e instruções.",
  ],
  [
    "Token",
    "unidade de processamento que pode corresponder a partes de palavras, palavras ou outros elementos; não há equivalência universal.",
  ],
  [
    "Janela de contexto",
    "capacidade de informação que um modelo consegue considerar em determinado uso; varia e não garante atenção perfeita a todos os detalhes.",
  ],
  [
    "Alucinação",
    "resposta com conteúdo incorreto ou sem sustentação, apresentado como se fosse válido.",
  ],
  [
    "Viés",
    "distorção que pode surgir dos dados, das instruções, dos critérios escolhidos e do uso da ferramenta.",
  ],
  ["Dado pessoal", "informação relacionada a uma pessoa natural identificada ou identificável."],
  [
    "Dado pessoal sensível",
    "categoria com definição específica na LGPD, como saúde, origem racial ou étnica, convicção religiosa, opinião política, filiação sindical e dado genético ou biométrico vinculado a uma pessoa.",
  ],
  [
    "Informação confidencial",
    "informação empresarial como estratégia não divulgada, preço negociado e segredo comercial; pode ou não conter dados pessoais.",
  ],
  [
    "Anonimização",
    "remoção efetiva da possibilidade de identificar a pessoa; trocar o nome por um código pode não bastar.",
  ],
  [
    "Revisão humana",
    "comparação do resultado com as fontes, conferência dos pontos de maior impacto e decisão sobre a adequação da entrega, feita por quem tem competência para isso.",
  ],
  ["Output", "formato de saída: estrutura, campos e extensão esperados da entrega."],
  [
    "Automação",
    "execução de etapas com regras e ferramentas; requer permissões, testes e tratamento de exceções.",
  ],
  ["Hipótese", "explicação a investigar; não é conclusão demonstrada."],
  ["Evidência", "o que sustenta uma afirmação no material disponível."],
  ["Iteração", "ciclo de testar, conferir, registrar o que mudou e melhorar o prompt."],
];

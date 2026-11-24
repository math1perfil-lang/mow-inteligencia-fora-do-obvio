import type { Area } from "./areas";

export type Task =
  | { id: string; type: "choice"; prompt: string; options: string[]; answer: number; why: string }
  | { id: string; type: "truefalse"; prompt: string; answer: boolean; why: string }
  | { id: string; type: "order"; prompt: string; steps: string[]; why: string }
  | { id: string; type: "prompt"; prompt: string; why: string };

export interface Module {
  n: number;
  title: string;
  objective: string;
  intro: string;
  essentials: string[];
  /** Exemplo aplicado à área escolhida pelo aluno. */
  applied: (a: Area) => string;
  tasks: Task[];
  challenge: (a: Area) => string;
  checklist: string[];
  deliverable: (a: Area) => string;
  next: string;
  minutes: number;
}

/** Substitui {tarefa}, {area} e {sensivel} nos textos das tarefas. */
export function fill(text: string, a: Area) {
  return text
    .replaceAll("{tarefa}", a.tarefa)
    .replaceAll("{area}", a.name)
    .replaceAll("{sensivel}", a.sensivel);
}

export const MODULES: Module[] = [
  {
    n: 0,
    title: "Módulo Start: Boas-vindas e Diagnóstico",
    objective:
      "Entender como o curso funciona, usar IA com segurança desde o primeiro minuto e escrever seu primeiro prompt.",
    intro:
      "Aqui você aprende fazendo. Cada módulo tem tarefas práticas, feedback por critérios e um entregável que vira material reutilizável no seu trabalho.",
    essentials: [
      "IA generativa produz texto plausível, não verdade garantida. Toda saída precisa de revisão humana.",
      "Nunca coloque dados pessoais, confidenciais ou de clientes sem autorização. Use dados fictícios ou anonimizados.",
      "Um bom prompt tem papel, contexto, tarefa, formato e critérios. Você vai praticar isso nas próximas semanas.",
      "O curso mede aplicação prática: o que importa é o que você passa a fazer no trabalho, não só concluir etapas.",
    ],
    applied: (a) =>
      `Na área de ${a.name}, uma tarefa típica é ${a.tarefa}. Você vai usá-la como fio condutor do curso.`,
    tasks: [
      {
        id: "m0-t1",
        type: "truefalse",
        prompt: "Se a IA respondeu com segurança e bom texto, posso usar a resposta sem revisar.",
        answer: false,
        why: "A IA pode errar com muita confiança. A revisão humana é parte do processo, não uma etapa opcional.",
      },
      {
        id: "m0-t2",
        type: "choice",
        prompt: "Qual destes dados você pode colar em uma ferramenta de IA sem autorização?",
        options: [
          "Nome e CPF de um cliente",
          "Um exemplo fictício criado por você",
          "Contrato assinado com valores",
          "Avaliação de desempenho de um colega",
        ],
        answer: 1,
        why: "Exemplos fictícios ou anonimizados não expõem ninguém. Os demais são dados pessoais ou confidenciais.",
      },
      {
        id: "m0-t3",
        type: "prompt",
        prompt:
          "Escreva seu primeiro prompt: peça ajuda para {tarefa}. Use um exemplo fictício, informe contexto, o formato desejado e peça que a IA indique o que você deve revisar.",
        why: "Este é o ponto de partida do seu Perfil de Uso de IA.",
      },
    ],
    challenge: (a) =>
      `Liste 3 tarefas reais de ${a.name} em que a IA poderia ajudar e 1 em que ela não deveria ser usada. Justifique a exclusão.`,
    checklist: [
      "Entendi que a IA não é infalível",
      "Sei quais dados não devo inserir",
      "Escrevi e avaliei meu primeiro prompt",
      "Defini uma tarefa real para praticar no curso",
    ],
    deliverable: (a) =>
      `Escreva em 3 a 5 linhas: qual tarefa real de ${a.name} você vai melhorar com IA ao longo do curso e como saberá que melhorou.`,
    next: "Semana 1: fundamentos de IA corporativa.",
    minutes: 75,
  },
  {
    n: 1,
    title: "Fundamentos de IA Corporativa",
    objective:
      "Saber o que a IA faz bem, onde ela falha e como escolher tarefas com bom retorno e baixo risco.",
    intro:
      "Antes de técnicas, critério: quais tarefas valem a pena e quais exigem cuidado redobrado.",
    essentials: [
      "A IA generativa prevê texto a partir de padrões. Ela não consulta fatos por conta própria, a menos que a ferramenta tenha fontes.",
      "Boas tarefas: rascunhos, resumos, reorganização, variações, checklists, ideias. Tarefas de risco: decisões sensíveis, números sem fonte, textos jurídicos finais.",
      "Separe sempre fatos, hipóteses e recomendações. Peça fontes quando houver pesquisa.",
      "Priorize tarefas por frequência, tempo gasto e risco de erro.",
    ],
    applied: (a) =>
      `Em ${a.name}: ${a.caso} Qual tarefa dessa rotina é frequente, demorada e de baixo risco? É por ela que se começa.`,
    tasks: [
      {
        id: "m1-t1",
        type: "choice",
        prompt: "Qual tarefa tem melhor perfil para começar com IA?",
        options: [
          "Decidir demissões com base em um texto gerado",
          "Rascunhar a primeira versão de um comunicado interno",
          "Calcular impostos sem conferir",
          "Responder a um processo jurídico",
        ],
        answer: 1,
        why: "Rascunhos são frequentes, de baixo risco e revisáveis. As demais exigem decisão humana, conferência ou responsabilidade formal.",
      },
      {
        id: "m1-t2",
        type: "truefalse",
        prompt: "Quando a IA cita um estudo ou um número, isso comprova que ele existe.",
        answer: false,
        why: "A IA pode inventar referências. Peça a fonte e confirme em local confiável.",
      },
      {
        id: "m1-t3",
        type: "order",
        prompt: "Ordene o processo seguro de usar IA em uma tarefa:",
        steps: [
          "Escolher uma tarefa de baixo risco",
          "Remover ou trocar dados sensíveis",
          "Escrever o prompt com contexto e formato",
          "Revisar e validar a resposta",
          "Salvar o prompt que funcionou",
        ],
        why: "Segurança vem antes do prompt, e a revisão vem antes do uso.",
      },
    ],
    challenge: (a) =>
      `Monte uma tabela com 5 tarefas de ${a.name}: frequência, tempo gasto, risco de erro e se vale usar IA agora.`,
    checklist: [
      "Sei classificar tarefas por risco",
      "Sei separar fato, hipótese e recomendação",
      "Escolhi minha tarefa piloto",
      "Defini o que preciso revisar nela",
    ],
    deliverable: (a) =>
      `Descreva sua tarefa piloto em ${a.name}: o que é, por que é boa candidata e qual é o risco de erro.`,
    next: "Semana 2: anatomia do prompt profissional.",
    minutes: 60,
  },
  {
    n: 2,
    title: "Anatomia do Prompt Profissional",
    objective:
      "Escrever prompts com papel, contexto, tarefa, formato, critérios e revisão, e saber diagnosticar o que falta.",
    intro:
      "Um prompt profissional é uma pequena especificação de trabalho. Quanto mais claro o pedido, mais útil e revisável a resposta.",
    essentials: [
      "Papel: quem a IA deve ser. Contexto: situação, público e restrições. Tarefa: o que fazer. Formato: como entregar. Critérios: o que é uma boa resposta.",
      "Pedir que a IA indique suposições e dúvidas reduz respostas inventadas.",
      "Especificidade vence tamanho: números, limites e exemplos valem mais que adjetivos.",
      "Todo bom prompt vira ativo: salve com título, objetivo e versão.",
    ],
    applied: (a) =>
      `Prompt fraco: “Me ajude com ${a.tarefa}.” Prompt forte: papel de especialista de ${a.name}, contexto fictício, formato e critérios. Use o modelo da sua área na biblioteca.`,
    tasks: [
      {
        id: "m2-t1",
        type: "choice",
        prompt: "O que mais melhora um prompt vago?",
        options: [
          "Deixá-lo mais curto",
          "Incluir contexto, formato e critérios",
          "Pedir para responder rápido",
          "Usar palavras difíceis",
        ],
        answer: 1,
        why: "Contexto, formato e critérios orientam a resposta e facilitam a revisão.",
      },
      {
        id: "m2-t2",
        type: "order",
        prompt: "Ordene os blocos de um prompt profissional:",
        steps: ["Papel", "Contexto", "Tarefa", "Formato", "Critérios e revisão"],
        why: "Esta ordem conduz do geral ao específico e termina com a checagem.",
      },
      {
        id: "m2-t3",
        type: "prompt",
        prompt:
          "Reescreva um prompt melhor para {tarefa}, usando papel, contexto fictício, tarefa, formato e critérios. Peça também que a IA liste o que você deve revisar.",
        why: "Aplicação direta da anatomia do prompt.",
      },
    ],
    challenge: (a) =>
      `Pegue um prompt que você já usa em ${a.name} e melhore-o duas vezes, anotando o que mudou na resposta.`,
    checklist: [
      "Meu prompt tem papel, contexto, tarefa, formato e critérios",
      "Pedi revisão e suposições",
      "Salvei o prompt na biblioteca",
      "Anotei o resultado obtido",
    ],
    deliverable: (a) =>
      `Registre na biblioteca 1 prompt aprovado para ${a.tarefa} e descreva em 3 linhas o resultado.`,
    next: "Semana 3: técnicas avançadas de engenharia de prompts.",
    minutes: 75,
  },
  {
    n: 3,
    title: "Técnicas Avançadas de Engenharia de Prompts",
    objective:
      "Usar exemplos, etapas, perguntas de volta e verificação para obter respostas mais confiáveis.",
    intro:
      "Quando o problema é complexo, quebre em etapas, dê exemplos do que é bom e peça que a IA questione o que falta.",
    essentials: [
      "Few-shot: mostre 1 a 3 exemplos do resultado esperado.",
      "Passo a passo: divida tarefas complexas e valide cada etapa antes da próxima.",
      "Entrevista reversa: peça que a IA faça perguntas antes de responder.",
      "Autocrítica: peça uma segunda versão que aponte falhas na primeira. Isso não substitui a sua revisão.",
    ],
    applied: (a) =>
      `Em ${a.name}, mostre à IA um exemplo bom de ${a.tarefa} e peça que ela faça 3 perguntas antes de produzir a versão final.`,
    tasks: [
      {
        id: "m3-t1",
        type: "choice",
        prompt: "O que é uma “entrevista reversa” em prompts?",
        options: [
          "A IA pergunta o que falta antes de responder",
          "Você responde às perguntas da IA sem contexto",
          "Repetir o mesmo prompt várias vezes",
          "Pedir a resposta em outro idioma",
        ],
        answer: 0,
        why: "Perguntas de volta reduzem suposições e aproximam a resposta do seu contexto real.",
      },
      {
        id: "m3-t2",
        type: "truefalse",
        prompt:
          "Pedir que a IA critique a própria resposta elimina a necessidade de revisão humana.",
        answer: false,
        why: "A autocrítica ajuda, mas a IA pode repetir o mesmo erro. A validação final é humana.",
      },
      {
        id: "m3-t3",
        type: "prompt",
        prompt:
          "Escreva um prompt para {tarefa} que inclua um exemplo do resultado esperado e peça que a IA faça perguntas antes de responder.",
        why: "Combina few-shot e entrevista reversa.",
      },
    ],
    challenge: (a) =>
      `Divida uma tarefa complexa de ${a.name} em 4 etapas e crie um prompt para cada uma, com validação entre elas.`,
    checklist: [
      "Usei exemplo no prompt",
      "Pedi perguntas de volta",
      "Dividi a tarefa em etapas",
      "Revisei a resposta antes de usar",
    ],
    deliverable: (a) =>
      `Entregue 2 prompts avançados para ${a.name} (um com exemplo, um em etapas) e registre o que mudou em relação à versão simples.`,
    next: "Semana 4: IA para vendas, marketing e relacionamento.",
    minutes: 75,
  },
  {
    n: 4,
    title: "IA para Vendas, Marketing e Relacionamento",
    objective:
      "Produzir comunicações mais claras e personalizadas para clientes, mantendo tom, veracidade e privacidade.",
    intro:
      "Comunicação com clientes é onde a IA ganha velocidade, mas também onde um erro aparece em público.",
    essentials: [
      "Personalize por segmento e situação, não por dados pessoais de indivíduos.",
      "Defina o tom de voz e as afirmações proibidas (promessas, números sem fonte).",
      "Peça variações e escolha com critério. Toda mensagem externa passa por revisão humana.",
      "Meça por resultado: respostas, conversão, tempo economizado.",
    ],
    applied: (a) =>
      `Para ${a.name}: crie 3 versões de uma mensagem relacionada a ${a.tarefa}, com tons diferentes, e escolha a melhor por critério.`,
    tasks: [
      {
        id: "m4-t1",
        type: "choice",
        prompt: "Qual é a melhor forma de personalizar uma mensagem com IA?",
        options: [
          "Colar a ficha completa do cliente",
          "Descrever o segmento e a situação com dados fictícios ou anonimizados",
          "Pedir que a IA invente dados do cliente",
          "Enviar sem revisar para ganhar tempo",
        ],
        answer: 1,
        why: "Personalização por segmento e situação preserva a privacidade e mantém o controle.",
      },
      {
        id: "m4-t2",
        type: "truefalse",
        prompt:
          "Posso publicar um texto gerado por IA com números de mercado sem conferir a fonte.",
        answer: false,
        why: "Números sem fonte são risco de reputação. Peça a fonte e confirme.",
      },
      {
        id: "m4-t3",
        type: "prompt",
        prompt:
          "Crie um prompt para produzir uma mensagem ao cliente relacionada a {tarefa}. Defina tom, público, formato e peça 3 variações com pontos a revisar.",
        why: "Comunicação externa com tom, formato e revisão.",
      },
    ],
    challenge: (a) =>
      `Crie um mini-fluxo de 3 mensagens para ${a.name} (primeiro contato, follow-up, fechamento) com critérios de revisão.`,
    checklist: [
      "Defini público e tom",
      "Usei dados fictícios ou anonimizados",
      "Pedi variações",
      "Revisei fatos antes de usar",
    ],
    deliverable: (a) =>
      `Registre 2 prompts de comunicação de ${a.name} na biblioteca, com tom e critério de revisão descritos.`,
    next: "Semana 5: IA para gestão, organização e produtividade.",
    minutes: 80,
  },
  {
    n: 5,
    title: "IA para Gestão, Organização e Produtividade",
    objective:
      "Transformar reuniões, planos e rotinas em decisões registradas, prioridades claras e menos retrabalho.",
    intro: "Produtividade com IA é menos “fazer mais rápido” e mais “decidir e registrar melhor”.",
    essentials: [
      "Resuma reuniões em decisões, responsáveis e prazos, não em transcrições longas.",
      "Priorize por impacto e esforço. Peça que a IA mostre as premissas da priorização.",
      "Padronize rotinas com checklists e modelos reutilizáveis.",
      "Não use IA para avaliar pessoas ou decidir sobre elas sem critério humano e transparente.",
    ],
    applied: (a) =>
      `Em ${a.name}, transforme uma pauta de reunião sobre ${a.tarefa} em plano de ação com responsável, prazo e critério de pronto.`,
    tasks: [
      {
        id: "m5-t1",
        type: "order",
        prompt: "Ordene o uso de IA para transformar uma reunião em plano de ação:",
        steps: [
          "Anotar o que foi tratado, sem dados sensíveis",
          "Pedir decisões, responsáveis e prazos",
          "Revisar com os participantes",
          "Registrar e compartilhar o plano",
          "Acompanhar os prazos",
        ],
        why: "A revisão com os participantes valida o que a IA organizou.",
      },
      {
        id: "m5-t2",
        type: "truefalse",
        prompt: "É adequado pedir à IA que decida sozinha quem deve ser promovido.",
        answer: false,
        why: "Decisões sobre pessoas são sensíveis e exigem critério humano, transparência e responsabilidade.",
      },
      {
        id: "m5-t3",
        type: "prompt",
        prompt:
          "Escreva um prompt para transformar anotações fictícias de uma reunião sobre {tarefa} em um plano de ação com responsável, prazo e critério de pronto. Peça as premissas e o que revisar.",
        why: "Plano de ação com revisão.",
      },
    ],
    challenge: (a) =>
      `Monte uma rotina semanal para ${a.name} com 3 prompts reutilizáveis: planejamento, reunião e acompanhamento.`,
    checklist: [
      "Meu plano tem responsável, prazo e critério de pronto",
      "Listei as premissas",
      "Não usei dados de pessoas",
      "Salvei como template",
    ],
    deliverable: (a) =>
      `Entregue um plano de ação completo para uma melhoria em ${a.name}, gerado com seu prompt e revisado por você.`,
    next: "Semana 6: IA para dados, relatórios e decisões.",
    minutes: 80,
  },
  {
    n: 6,
    title: "IA para Dados, Relatórios e Decisões",
    objective:
      "Usar IA para estruturar análises e relatórios, sem inventar números e separando fatos, hipóteses e recomendações.",
    intro:
      "A IA ajuda a pensar a análise e a comunicar o resultado. Os números continuam sendo responsabilidade sua.",
    essentials: [
      "Dê a pergunta de negócio antes dos dados. Sem decisão em jogo, a análise vira enfeite.",
      "Nunca aceite um número da IA sem origem. Calcule você ou confira na fonte.",
      "Separe: fato (dado conferido), hipótese (explicação possível), recomendação (ação sugerida).",
      "Documente o que foi pedido e verificado: rastreabilidade.",
    ],
    applied: (a) =>
      `Em ${a.name}, acompanhe: ${a.indicadores.join("; ")}. Peça à IA para estruturar a explicação de uma variação, marcando o que é fato, hipótese e recomendação.`,
    tasks: [
      {
        id: "m6-t1",
        type: "choice",
        prompt: "Qual é a melhor forma de usar IA em uma análise de dados?",
        options: [
          "Colar a base completa com dados de clientes",
          "Pedir o plano de análise e a estrutura do relatório, com dados fictícios ou agregados",
          "Pedir à IA o número final e usá-lo direto",
          "Evitar qualquer verificação",
        ],
        answer: 1,
        why: "A IA estrutura o raciocínio e o relatório. Os números vêm de fonte conferida.",
      },
      {
        id: "m6-t2",
        type: "truefalse",
        prompt:
          "Em um relatório, fatos, hipóteses e recomendações devem ser apresentados juntos, sem distinção.",
        answer: false,
        why: "Separar os três protege a decisão: o leitor sabe o que está comprovado e o que ainda precisa de teste.",
      },
      {
        id: "m6-t3",
        type: "prompt",
        prompt:
          "Crie um prompt para estruturar uma análise ou relatório de {area}. Informe a pergunta de negócio, peça que separe fatos, hipóteses e recomendações e que liste as verificações de dados necessárias.",
        why: "Análise com separação de fatos e hipóteses.",
      },
    ],
    challenge: (a) =>
      `Escolha 1 indicador de ${a.name} e escreva como a IA ajuda a explicar sua variação sem inventar dados.`,
    checklist: [
      "Informei a pergunta de negócio",
      "Separei fatos, hipóteses e recomendações",
      "Listei as verificações de dados",
      "Pedi fontes quando houve pesquisa",
    ],
    deliverable: (a) =>
      `Entregue um relatório curto de ${a.name} estruturado com IA, com a seção “O que ainda preciso verificar”.`,
    next: "Semana 7: IA para atendimento, operações e processos.",
    minutes: 80,
  },
  {
    n: 7,
    title: "IA para Atendimento, Operações e Processos",
    objective:
      "Padronizar respostas, mapear processos e criar procedimentos (SOP) mais claros e verificáveis.",
    intro:
      "Processos bons são simples de executar e fáceis de verificar. A IA acelera o primeiro rascunho, a equipe valida na prática.",
    essentials: [
      "Mapeie entrada, etapas, responsável, saída e controle.",
      "Respostas-modelo precisam de regra de escalonamento para um humano.",
      "Teste o procedimento em campo antes de padronizar.",
      "Registre a versão e a data: processos mudam.",
    ],
    applied: (a) =>
      `Em ${a.name}, transforme ${a.tarefa} em um procedimento padrão com etapas, responsável e controle de qualidade.`,
    tasks: [
      {
        id: "m7-t1",
        type: "choice",
        prompt: "O que não pode faltar em uma resposta-modelo de atendimento?",
        options: [
          "Linguagem técnica",
          "Critério de quando escalar para um humano",
          "Garantia de prazos",
          "Dados do cliente",
        ],
        answer: 1,
        why: "Sem escalonamento, a automação resolve o simples e prejudica o complexo.",
      },
      {
        id: "m7-t2",
        type: "order",
        prompt: "Ordene a criação de um procedimento padrão (SOP):",
        steps: [
          "Mapear o processo atual",
          "Identificar gargalos e riscos",
          "Rascunhar o procedimento com IA",
          "Testar em campo com a equipe",
          "Padronizar e versionar",
        ],
        why: "O teste em campo vem antes da padronização.",
      },
      {
        id: "m7-t3",
        type: "prompt",
        prompt:
          "Escreva um prompt para criar um procedimento (SOP) ou uma resposta-modelo para {tarefa}. Inclua etapas, responsáveis, controle e quando escalar a um humano.",
        why: "Procedimento com controle e escalonamento.",
      },
    ],
    challenge: (a) =>
      `Mapeie um processo real de ${a.name} em 6 etapas e peça à IA para apontar 3 riscos, que você deve verificar.`,
    checklist: [
      "Meu procedimento tem responsável e controle",
      "Defini quando escalar a um humano",
      "Planejei o teste em campo",
      "Registrei versão e data",
    ],
    deliverable: (a) =>
      `Entregue um SOP ou uma resposta-modelo de ${a.name}, com etapas, controle e regra de escalonamento.`,
    next: "Semana 8: governança, segurança e projeto final.",
    minutes: 80,
  },
  {
    n: 8,
    title: "Governança, Segurança e Projeto Final",
    objective: "Aplicar regras de uso responsável e entregar o seu Sistema de Prompts Corporativo.",
    intro:
      "Fechamento do curso: segurança, rastreabilidade e a sua biblioteca de prompts organizada para uso real e para o time.",
    essentials: [
      "Regras: dados pessoais, confidenciais, financeiros, de RH, de clientes e propriedade intelectual só entram com autorização e preferencialmente anonimizados.",
      "Decisões sensíveis exigem revisão humana e registro de quem decidiu.",
      "Rastreabilidade: guarde o prompt, a versão, a data e o que foi verificado.",
      "O projeto final é o seu Sistema de Prompts Corporativo: prompts aprovados, com resultados observados.",
    ],
    applied: (a) => `Projeto da sua trilha: ${a.entrega}. Cuidado especial com ${a.sensivel}.`,
    tasks: [
      {
        id: "m8-t1",
        type: "choice",
        prompt: "Você precisa analisar uma lista real de clientes. Qual é a atitude correta?",
        options: [
          "Colar a lista na ferramenta de IA",
          "Anonimizar ou usar dados agregados, seguindo a política da empresa",
          "Usar uma conta pessoal para ser mais rápido",
          "Pedir a um colega que cole por você",
        ],
        answer: 1,
        why: "Dados de clientes exigem anonimização e respeito à política da empresa e à LGPD.",
      },
      {
        id: "m8-t2",
        type: "truefalse",
        prompt:
          "Guardar o prompt, a versão e o que foi verificado ajuda na rastreabilidade do trabalho.",
        answer: true,
        why: "Registrar o processo permite auditar, melhorar e reutilizar o trabalho.",
      },
      {
        id: "m8-t3",
        type: "prompt",
        prompt:
          "Escreva um prompt final para {tarefa} que inclua: dados fictícios ou anonimizados, instrução para não inventar informações, indicação de fontes e lista do que revisar antes de usar.",
        why: "Prompt com segurança e revisão incorporadas.",
      },
    ],
    challenge: (a) =>
      `Crie o checklist de segurança do seu time em ${a.name}: o que pode, o que não pode e quem aprova.`,
    checklist: [
      "Reuni na biblioteca pelo menos 5 prompts aprovados",
      "Registrei resultados obtidos",
      "Documentei regras de segurança da minha área",
      "Apresentei a aplicação prática no projeto final",
    ],
    deliverable: (a) =>
      `Resumo do projeto final: ${a.entrega}. Descreva o que o sistema cobre e as regras de segurança que aplicou.`,
    next: "Revisão final e certificado.",
    minutes: 90,
  },
];

export const TASK_COUNT = MODULES.reduce((s, m) => s + m.tasks.length, 0);

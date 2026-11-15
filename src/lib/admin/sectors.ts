/**
 * Setores entrevistáveis. Cada setor traz as perguntas específicas dele, as funções
 * candidatas (para a priorização) e as faixas de porte. O roteiro universal fica em
 * questions.ts. Para criar um setor novo, acrescente um item em SECTORS: nenhuma tela
 * nem migração precisa mudar.
 */

export type PriceField = "price_accept_brl" | "price_too_expensive_brl" | "price_too_cheap_brl";

export interface Question {
  key: string;
  label: string;
  /** Campo numérico em R$ que acompanha a pergunta. */
  price?: { field: PriceField; label: string };
}

export interface FeatureCandidate {
  key: string;
  title: string;
  description: string;
}

export interface Option {
  key: string;
  label: string;
}

export interface Sector {
  key: string;
  label: string;
  description: string;
  /** "Nome da loja", "Nome do consultório"… */
  companyLabel: string;
  /** Como chamar o dono na fala: "lojista", "dentista"… */
  ownerNoun: string;
  /** Como chamar quem compra: "cliente", "paciente"… */
  clientNoun: string;
  sizeOptions: Option[];
  opening: string;
  /** Primeira pergunta do bloco de dores: o fluxo principal do negócio, passo a passo. */
  coreFlow: string;
  context: Question[];
  pain: Question[];
  tools: Question[];
  features: FeatureCandidate[];
}

const openingFor = (what: string) =>
  `Obrigado pelo tempo. Eu desenvolvo soluções para empresas e estou pesquisando como ${what} trabalham no dia a dia, para entender o que atrapalha. Não estou vendendo nada hoje. Não existe resposta certa ou errada: quanto mais real, melhor. Posso anotar e gravar o áudio? Leva uns 30 minutos.`;

export const SECTORS: Sector[] = [
  {
    key: "revenda_carros",
    label: "Revenda de carros",
    description: "Lojas de veículos novos e seminovos",
    companyLabel: "Nome da loja",
    ownerNoun: "lojista",
    clientNoun: "cliente",
    sizeOptions: [
      { key: "solo", label: "Autônomo ou garagem (até 5 carros)" },
      { key: "pequena", label: "Pequena (5 a 20 carros)" },
      { key: "media", label: "Média (20 a 80 carros)" },
      { key: "grande", label: "Grande (80+ carros)" },
    ],
    opening: openingFor("as revendas de carros"),
    coreFlow:
      "Me conta como foi a última vez que um carro entrou no estoque, do momento em que chegou até estar anunciado. O que você fez, passo a passo?",
    context: [
      { key: "b1_s1", label: "Quantos carros tem em estoque hoje e quantos vende por mês, em média?" },
      { key: "b1_s2", label: "Quanto tempo um carro leva para vender, em média?" },
      { key: "b1_s3", label: "Quem cuida do estoque, dos anúncios e do atendimento aos interessados?" },
    ],
    pain: [
      { key: "b2_s1", label: "O que acontece quando um cliente pergunta por um carro e o vendedor não está?" },
      {
        key: "b2_s2",
        label: "Já anunciou um carro que já tinha sido vendido, ou errou preço ou documento? Me conta o último caso.",
      },
      { key: "b2_s3", label: "Como decide o preço de um carro? Em que se baseia?" },
    ],
    tools: [
      { key: "b3_s1", label: "Quanto gasta por mês com portais de anúncio e tráfego pago?" },
      { key: "b3_s2", label: "Como controla quem visitou a loja e quem ficou de voltar?" },
    ],
    features: [
      {
        key: "publicacao_multiportais",
        title: "Publicação em vários portais",
        description: "Anunciar o carro uma vez e publicar em todos os portais de uma vez.",
      },
      {
        key: "controle_anuncios",
        title: "Controle automático de anúncios",
        description: "Carro vendido sai do ar sozinho, sem contato perdido.",
      },
      {
        key: "leads_whatsapp",
        title: "Leads e resposta rápida (WhatsApp)",
        description: "Nenhum interessado fica sem retorno no mesmo dia.",
      },
      {
        key: "agenda_visitas",
        title: "Agenda de visitas e test-drives",
        description: "Cliente marca, a loja é avisada e ninguém esquece.",
      },
      {
        key: "preco_mercado",
        title: "Sugestão de preço pelo mercado",
        description: "Preço do carro baseado no que a região está praticando.",
      },
      {
        key: "ficha_veiculo",
        title: "Ficha do veículo com fotos e documentos",
        description: "Tudo do carro em um lugar só, sem papelada espalhada.",
      },
    ],
  },
  {
    key: "odontologia",
    label: "Consultório odontológico",
    description: "Consultórios e clínicas de odontologia",
    companyLabel: "Nome do consultório",
    ownerNoun: "dentista",
    clientNoun: "paciente",
    sizeOptions: [
      { key: "solo", label: "Um profissional, uma cadeira" },
      { key: "pequena", label: "Pequena (2 a 3 cadeiras)" },
      { key: "media", label: "Média (4 a 8 cadeiras)" },
      { key: "grande", label: "Grande (9+ cadeiras ou rede)" },
    ],
    opening: openingFor("os consultórios odontológicos"),
    coreFlow:
      "Me conta como foi o último paciente novo, desde o primeiro contato até a primeira consulta marcada. O que acontece em cada etapa, quem faz o quê?",
    context: [
      { key: "b1_s1", label: "Quantos pacientes atende por semana e quantos são novos?" },
      { key: "b1_s2", label: "Que parte vem de convênio e que parte é particular?" },
      { key: "b1_s3", label: "Quem cuida da agenda, da recepção e da cobrança?" },
    ],
    pain: [
      { key: "b2_s1", label: "Quantas faltas ou desmarcações em cima da hora tem por semana? O que faz com o horário vago?" },
      { key: "b2_s2", label: "De cada 10 orçamentos de tratamento apresentados, quantos o paciente aprova? E o que faz com quem some?" },
      { key: "b2_s3", label: "Como sabe que um paciente está atrasado para a revisão ou para o retorno? Isso acontece?" },
      { key: "b2_s4", label: "Já teve glosa de convênio ou pagamento que atrasou? Me conta o último caso." },
    ],
    tools: [
      { key: "b3_s1", label: "Onde ficam o prontuário, as radiografias e os termos assinados dos pacientes?" },
      { key: "b3_s2", label: "Como a agenda é confirmada com o paciente hoje? Manual, WhatsApp, ligação?" },
    ],
    features: [
      {
        key: "odo_agenda_confirmacao",
        title: "Confirmação automática e lista de espera",
        description: "Paciente confirma sozinho e o horário vago é oferecido a quem espera.",
      },
      {
        key: "odo_prontuario",
        title: "Prontuário e odontograma digital",
        description: "Histórico, imagens e termos do paciente em um lugar só.",
      },
      {
        key: "odo_orcamento",
        title: "Orçamento e acompanhamento da aprovação",
        description: "Orçamento enviado pelo celular e lembrete automático para quem não respondeu.",
      },
      {
        key: "odo_recall",
        title: "Retorno e reativação de pacientes",
        description: "Aviso automático de revisão, limpeza e tratamento parado.",
      },
      {
        key: "odo_convenios",
        title: "Faturamento de convênios e glosas",
        description: "Guias organizadas, glosa identificada e recurso acompanhado.",
      },
      {
        key: "odo_financeiro",
        title: "Cobrança de parcelas e fluxo de caixa",
        description: "Parcelas do tratamento cobradas e conciliadas sem planilha.",
      },
    ],
  },
  {
    key: "engenharia",
    label: "Escritório de engenharia",
    description: "Engenharia, arquitetura e projetos",
    companyLabel: "Nome do escritório",
    ownerNoun: "engenheiro",
    clientNoun: "cliente",
    sizeOptions: [
      { key: "solo", label: "Profissional autônomo" },
      { key: "pequena", label: "Pequeno (2 a 5 pessoas)" },
      { key: "media", label: "Médio (6 a 20 pessoas)" },
      { key: "grande", label: "Grande (20+ pessoas)" },
    ],
    opening: openingFor("os escritórios de engenharia"),
    coreFlow:
      "Me conta como foi o último projeto, desde o pedido do cliente até a entrega final. Quais foram as etapas e onde você mais teve que correr atrás?",
    context: [
      { key: "b1_s1", label: "Quantos projetos ou obras tem em andamento ao mesmo tempo? Que tipos?" },
      { key: "b1_s2", label: "Como chegam os clientes novos? Indicação, licitação, construtoras?" },
      { key: "b1_s3", label: "Quem monta as propostas e quem acompanha os prazos?" },
    ],
    pain: [
      { key: "b2_s1", label: "Qual foi o último projeto que atrasou ou estourou o orçamento? O que causou?" },
      { key: "b2_s2", label: "Como sabe quantas horas gastou em cada projeto? Isso entra no preço da próxima proposta?" },
      { key: "b2_s3", label: "Como controla versões de projeto, documentos e aprovações do cliente? Já perdeu ou usou arquivo errado?" },
      { key: "b2_s4", label: "Já teve medição ou fatura que atrasou ou foi paga a menos? Me conta o último caso." },
    ],
    tools: [
      { key: "b3_s1", label: "Que softwares técnicos usa e quanto paga por mês em licenças?" },
      { key: "b3_s2", label: "Como o cliente acompanha o andamento do projeto? Ele pergunta muito?" },
    ],
    features: [
      {
        key: "eng_propostas",
        title: "Propostas e orçamentos padronizados",
        description: "Proposta pronta em minutos, com escopo e preço baseados nos projetos anteriores.",
      },
      {
        key: "eng_prazos",
        title: "Controle de prazos e entregas",
        description: "Visão única de todos os projetos, com alerta de atraso.",
      },
      {
        key: "eng_horas",
        title: "Horas e custo real por projeto",
        description: "Saber se cada projeto deu lucro e quanto custou de fato.",
      },
      {
        key: "eng_documentos",
        title: "Documentos, versões e aprovações",
        description: "Última versão sempre à mão e aprovação do cliente registrada.",
      },
      {
        key: "eng_cobranca",
        title: "Medições, faturamento e cobrança",
        description: "Medição gera a cobrança e avisa quando o cliente atrasa.",
      },
      {
        key: "eng_cliente",
        title: "Portal de acompanhamento do cliente",
        description: "O cliente vê o andamento sozinho, sem ligar para perguntar.",
      },
    ],
  },
  {
    key: "restaurantes",
    label: "Restaurante ou lanchonete",
    description: "Restaurantes, bares, lanchonetes e delivery",
    companyLabel: "Nome do restaurante",
    ownerNoun: "dono",
    clientNoun: "cliente",
    sizeOptions: [
      { key: "solo", label: "Operação enxuta (delivery, trailer, 1 a 3 pessoas)" },
      { key: "pequena", label: "Pequeno (até 10 pessoas)" },
      { key: "media", label: "Médio (10 a 30 pessoas)" },
      { key: "grande", label: "Grande (30+ pessoas ou várias unidades)" },
    ],
    opening: openingFor("os restaurantes e lanchonetes"),
    coreFlow:
      "Me conta como foi o último sábado ou o dia mais corrido, desde abrir as portas até fechar o caixa. Onde as coisas travaram?",
    context: [
      { key: "b1_s1", label: "Quantos pedidos ou clientes atende por dia e qual o ticket médio?" },
      { key: "b1_s2", label: "Que parte vem do salão, que parte do delivery e por quais aplicativos?" },
      { key: "b1_s3", label: "Quantas pessoas trabalham por turno e quem gerencia a cozinha e o caixa?" },
    ],
    pain: [
      { key: "b2_s1", label: "Quanto de comida joga fora ou perde por semana? Como controla o estoque?" },
      { key: "b2_s2", label: "Sabe a margem de cada prato? Quando foi a última vez que calculou o custo?" },
      { key: "b2_s3", label: "Quanto paga de comissão aos aplicativos de delivery por mês? Já tentou vender direto ao cliente?" },
      { key: "b2_s4", label: "O que acontece em horário de pico quando falta alguém ou um pedido atrasa?" },
    ],
    tools: [
      { key: "b3_s1", label: "Que sistema de caixa e pedidos usa e quanto paga por mês?" },
      { key: "b3_s2", label: "Como sabe quem são seus clientes fiéis e como faz para eles voltarem?" },
    ],
    features: [
      {
        key: "rest_pedidos",
        title: "Pedidos e cardápio digital próprio",
        description: "O cliente pede direto pelo celular, sem comissão de aplicativo.",
      },
      {
        key: "rest_estoque",
        title: "Estoque e ficha técnica",
        description: "Baixa automática dos insumos e alerta de compra e de desperdício.",
      },
      {
        key: "rest_reservas",
        title: "Reservas e fila de espera",
        description: "Reserva confirmada por WhatsApp e fila organizada no pico.",
      },
      {
        key: "rest_delivery",
        title: "Gestão do delivery em um painel só",
        description: "Pedidos de todos os aplicativos em uma tela, com entregadores.",
      },
      {
        key: "rest_cmv",
        title: "Custo dos pratos e margem (CMV)",
        description: "Quanto cada prato realmente dá de lucro.",
      },
      {
        key: "rest_fidelidade",
        title: "Fidelização e recompra por WhatsApp",
        description: "Cliente recebe oferta e cupom para voltar.",
      },
    ],
  },
  {
    key: "saloes",
    label: "Salão de beleza ou barbearia",
    description: "Salões, barbearias, estética e studios",
    companyLabel: "Nome do salão",
    ownerNoun: "dono",
    clientNoun: "cliente",
    sizeOptions: [
      { key: "solo", label: "Profissional autônomo ou 1 cadeira" },
      { key: "pequena", label: "Pequeno (2 a 5 profissionais)" },
      { key: "media", label: "Médio (6 a 15 profissionais)" },
      { key: "grande", label: "Grande (15+ ou várias unidades)" },
    ],
    opening: openingFor("os salões de beleza e barbearias"),
    coreFlow:
      "Me conta como foi o último dia cheio no salão, desde a primeira cliente marcada até o fechamento do caixa. O que deu trabalho?",
    context: [
      { key: "b1_s1", label: "Quantos atendimentos faz por dia e qual o ticket médio?" },
      { key: "b1_s2", label: "Os profissionais são funcionários, comissionados ou alugam a cadeira?" },
      { key: "b1_s3", label: "Como as clientes marcam horário hoje? WhatsApp, ligação, aplicativo?" },
    ],
    pain: [
      { key: "b2_s1", label: "Quantas faltas ou desistências em cima da hora tem por semana? O que faz com o horário vago?" },
      { key: "b2_s2", label: "Como calcula a comissão da equipe? Já teve erro ou discussão por causa disso?" },
      { key: "b2_s3", label: "De cada 10 clientes, quantas voltam? Como sabe quando uma cliente sumiu?" },
      { key: "b2_s4", label: "Como controla o estoque de produtos? Já faltou produto no meio do atendimento?" },
    ],
    tools: [
      { key: "b3_s1", label: "Usa algum sistema ou aplicativo de agenda? Quanto paga e do que não gosta?" },
      { key: "b3_s2", label: "Como divulga o salão e o que traz mais clientes novas?" },
    ],
    features: [
      {
        key: "bel_agenda",
        title: "Agenda online com confirmação",
        description: "A cliente marca pelo link e confirma sozinha, sem WhatsApp manual.",
      },
      {
        key: "bel_comissoes",
        title: "Comissões e fechamento da equipe",
        description: "Fechamento automático por profissional, sem planilha.",
      },
      {
        key: "bel_fidelidade",
        title: "Pacotes, fidelidade e retorno",
        description: "Cliente que some recebe aviso e oferta para voltar.",
      },
      {
        key: "bel_estoque",
        title: "Estoque de produtos",
        description: "Baixa por atendimento e alerta antes de acabar.",
      },
      {
        key: "bel_caixa",
        title: "Caixa e financeiro simples",
        description: "Entradas, saídas e lucro do mês sem complicação.",
      },
      {
        key: "bel_marketing",
        title: "Divulgação e reativação",
        description: "Mensagens prontas para clientes antigas e datas especiais.",
      },
    ],
  },
  {
    key: "geral",
    label: "Outro setor",
    description: "Qualquer outro tipo de negócio (descreva o tipo ao criar)",
    companyLabel: "Nome da empresa",
    ownerNoun: "dono",
    clientNoun: "cliente",
    sizeOptions: [
      { key: "solo", label: "Autônomo (1 pessoa)" },
      { key: "pequena", label: "Pequena (2 a 5 pessoas)" },
      { key: "media", label: "Média (6 a 20 pessoas)" },
      { key: "grande", label: "Grande (20+ pessoas)" },
    ],
    opening: openingFor("as empresas do seu segmento"),
    coreFlow:
      "Me conta como foi a última vez que você atendeu um cliente novo, desde o primeiro contato até receber o pagamento. O que você fez, passo a passo?",
    context: [
      { key: "b1_s1", label: "Em uma frase, o que a empresa vende e como ganha dinheiro?" },
      { key: "b1_s2", label: "Quantos clientes atende por mês e qual o valor médio de cada venda?" },
      { key: "b1_s3", label: "Qual é a atividade em que mais depende de pessoas ou de papel?" },
    ],
    pain: [
      { key: "b2_s1", label: "Que informação você gostaria de ter todo dia e hoje não tem?" },
      { key: "b2_s2", label: "O que acontece com a empresa quando você tira uma semana de férias?" },
      { key: "b2_s3", label: "Qual tarefa repetitiva você ou a equipe faz que daria para ser automática?" },
    ],
    tools: [
      { key: "b3_s1", label: "Onde ficam os dados dos clientes hoje? Caderno, planilha, WhatsApp, sistema?" },
      { key: "b3_s2", label: "Como controla o que tem a receber e quem está devendo?" },
    ],
    features: [
      {
        key: "ger_agenda",
        title: "Agenda e lembretes automáticos",
        description: "Compromissos organizados e cliente avisado sozinho.",
      },
      {
        key: "ger_atendimento",
        title: "Atendimento e retorno a clientes",
        description: "Nenhum contato fica sem resposta e todo mundo é acompanhado.",
      },
      {
        key: "ger_cobranca",
        title: "Cobrança e contas a receber",
        description: "Quem deve é avisado automaticamente e o caixa é previsível.",
      },
      {
        key: "ger_documentos",
        title: "Documentos e cadastros organizados",
        description: "Tudo do cliente em um lugar só, sem papelada.",
      },
      {
        key: "ger_painel",
        title: "Painel com os números do negócio",
        description: "Vendas, caixa e metas em uma tela simples.",
      },
      {
        key: "ger_automacao",
        title: "Automação de tarefas repetitivas",
        description: "O que se repete toda semana passa a acontecer sozinho.",
      },
    ],
  },
];

export function getSector(key: string | null | undefined): Sector {
  return SECTORS.find((s) => s.key === key) ?? SECTORS[SECTORS.length - 1]!;
}

/** Nome para exibir: no setor "Outro", o tipo de negócio digitado. */
export function sectorDisplayName(key: string, custom: string): string {
  const sector = getSector(key);
  return sector.key === "geral" && custom.trim() ? custom.trim() : sector.label;
}

export const ALL_FEATURES: (FeatureCandidate & { sectorKey: string })[] = SECTORS.flatMap((s) =>
  s.features.map((f) => ({ ...f, sectorKey: s.key })),
);

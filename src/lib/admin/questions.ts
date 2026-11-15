/**
 * Roteiro de entrevista com lojistas (revendas de carros).
 * Todo o conteúdo do questionário fica aqui, para ser ajustado sem mexer nas telas.
 */

export type PriceField = "price_accept_brl" | "price_too_expensive_brl" | "price_too_cheap_brl";

export interface Question {
  key: string;
  label: string;
  /** Campo numérico em R$ que acompanha a pergunta. */
  price?: { field: PriceField; label: string };
}

export type StepKind = "cadastro" | "abertura" | "bloco" | "priorizacao" | "encerramento";

export interface Step {
  id: string;
  kind: StepKind;
  title: string;
  minutes: number | null;
  intro: string | null;
  notice: string | null;
  questions: Question[];
  followUps: string[];
}

export const OPENING_SCRIPT =
  "Obrigado pelo tempo. Eu desenvolvo soluções para empresas e estou pesquisando como as revendas de carros trabalham no dia a dia, para entender o que atrapalha. Não estou vendendo nada hoje. Não existe resposta certa ou errada: quanto mais real, melhor. Posso anotar e gravar o áudio? Leva uns 30 minutos.";

export const OPENING_TIP =
  'Se perguntarem o que você vai construir: "Ainda não sei. Por isso estou conversando com donos de loja antes de decidir qualquer coisa."';

export const FOLLOW_UPS = [
  "Pode me dar um exemplo?",
  "Quanto tempo isso leva?",
  "Quanto isso custou a você?",
  "E o que aconteceu depois?",
];

export const STEPS: Step[] = [
  {
    id: "cadastro",
    kind: "cadastro",
    title: "Cadastro",
    minutes: null,
    intro: null,
    notice: null,
    questions: [],
    followUps: [],
  },
  {
    id: "abertura",
    kind: "abertura",
    title: "Abertura",
    minutes: 2,
    intro: null,
    notice: null,
    questions: [],
    followUps: [],
  },
  {
    id: "bloco1",
    kind: "bloco",
    title: "Bloco 1: Contexto da loja",
    minutes: 5,
    intro: "Classifique o lojista e entenda o tamanho da operação. Anote números.",
    notice: null,
    questions: [
      { key: "b1_q1", label: "Há quanto tempo a loja existe e quantas pessoas trabalham nela?" },
      { key: "b1_q2", label: "Quantos carros tem em estoque hoje e quantos vende por mês, em média?" },
      { key: "b1_q3", label: "Quanto tempo um carro leva para vender, em média?" },
      {
        key: "b1_q4",
        label: "De onde vêm os clientes? (portais, indicação, redes sociais, passagem na porta)",
      },
      { key: "b1_q5", label: "Quem cuida do estoque, dos anúncios e do atendimento aos interessados?" },
    ],
    followUps: [],
  },
  {
    id: "bloco2",
    kind: "bloco",
    title: "Bloco 2: Rotina e dores",
    minutes: 10,
    intro: "O coração da entrevista. Peça sempre uma história real e recente, não uma opinião geral.",
    notice: null,
    questions: [
      {
        key: "b2_q1",
        label:
          "Me conta como foi a última vez que um carro entrou no estoque, do momento em que chegou até estar anunciado. O que você fez, passo a passo?",
      },
      { key: "b2_q2", label: "Qual é a tarefa que mais consome o tempo da equipe na semana?" },
      { key: "b2_q3", label: "Qual foi a última vez que você perdeu uma venda? O que aconteceu?" },
      {
        key: "b2_q4",
        label:
          "Já perdeu dinheiro por erro de controle (preço errado, carro anunciado que já foi vendido, documento atrasado)? Me conta o último caso.",
      },
      {
        key: "b2_q5",
        label: "Dessa tarefa que mais incomoda, o que você já tentou fazer para resolver?",
      },
      { key: "b2_q6", label: "O que acontece quando um cliente pergunta por um carro e o vendedor não está?" },
      { key: "b2_notes", label: "Notas de aprofundamento" },
    ],
    followUps: FOLLOW_UPS,
  },
  {
    id: "bloco3",
    kind: "bloco",
    title: "Bloco 3: Ferramentas atuais e gasto",
    minutes: 5,
    intro: "Quem já paga por alguma solução prova que o problema vale dinheiro.",
    notice: null,
    questions: [
      {
        key: "b3_q1",
        label: "Que sistemas ou ferramentas a loja usa hoje? (gestão, planilha, CRM, anúncios, WhatsApp)",
      },
      { key: "b3_q2", label: "Quanto paga por mês em cada um?" },
      { key: "b3_q3", label: "Do que mais gosta nessas ferramentas? Do que menos gosta?" },
      { key: "b3_q4", label: "Já trocou de sistema alguma vez? Por quê?" },
      { key: "b3_q5", label: "Quanto gasta por mês com portais de anúncio e tráfego pago?" },
      { key: "b3_q6", label: "Se esses sistemas sumissem amanhã, o que quebraria na loja?" },
    ],
    followUps: [],
  },
  {
    id: "bloco4",
    kind: "bloco",
    title: "Bloco 4: Valor e disposição a pagar",
    minutes: 5,
    intro: "Pergunte o preço só depois de ele ter descrito a dor.",
    notice: "Não sugira valores antes de o entrevistado falar.",
    questions: [
      {
        key: "b4_q1",
        label:
          "Pensando na tarefa mais cara da sua rotina, quanto ela custa para a loja por mês, em tempo ou em venda perdida?",
      },
      {
        key: "b4_q2",
        label: "Se existisse algo que resolvesse isso de verdade, quanto faria sentido pagar por mês?",
        price: { field: "price_accept_brl", label: "Valor que faria sentido (R$/mês)" },
      },
      {
        key: "b4_q3",
        label: "A partir de que valor você acharia caro demais e nem consideraria?",
        price: { field: "price_too_expensive_brl", label: "Valor caro demais (R$/mês)" },
      },
      {
        key: "b4_q4",
        label: "E a partir de que valor desconfiaria que é bom demais para ser verdade?",
        price: { field: "price_too_cheap_brl", label: "Valor barato demais (R$/mês)" },
      },
      { key: "b4_q5", label: "Quem na loja decide uma compra assim? Precisa de mais alguém?" },
    ],
    followUps: [],
  },
  {
    id: "bloco5",
    kind: "priorizacao",
    title: "Bloco 5: Priorização",
    minutes: 5,
    intro:
      "Só faça este bloco depois dos quatro anteriores. Mostre as funções em cartões simples, sem tela e sem demonstração.",
    notice: null,
    questions: [
      { key: "b5_q1", label: "Qual você usaria toda semana? (no máximo duas)" },
      { key: "b5_q2", label: "Quais não fariam diferença nenhuma?" },
      { key: "b5_q3", label: "Falta alguma coisa que você precisaria e não está aqui?" },
      { key: "b5_q4", label: "Se só uma dessas funções existisse, ela justificaria pagar por mês? Quanto?" },
    ],
    followUps: [],
  },
  {
    id: "encerramento",
    kind: "encerramento",
    title: "Encerramento e compromisso",
    minutes: 3,
    intro: "Transforme simpatia em evidência. Elogio não vale nada; compromisso mostra interesse real.",
    notice: null,
    questions: [
      {
        key: "c_q1",
        label: "Se eu construir algo que resolva essa tarefa, posso voltar aqui para mostrar uma versão simples?",
      },
      { key: "c_q2", label: "O senhor toparia testar por 30 dias, pagando um valor reduzido?" },
      {
        key: "c_q3",
        label: "Conhece mais dois donos de loja que tenham essa mesma dificuldade e que eu possa procurar? Pode me apresentar?",
      },
      { key: "c_q4", label: "Posso te enviar um resumo do que aprendi nas conversas?" },
    ],
    followUps: [],
  },
];

export interface FeatureCandidate {
  key: string;
  title: string;
  description: string;
}

export const FEATURES: FeatureCandidate[] = [
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
];

export const PAIN_OPTIONS: { key: string; label: string }[] = [
  ...FEATURES.map((f) => ({ key: f.key, label: f.title })),
  { key: "outra", label: "Outra dor" },
];

export const SIZE_OPTIONS: { key: string; label: string }[] = [
  { key: "pequena", label: "Pequena (5 a 20 carros)" },
  { key: "media", label: "Média (20 a 80 carros)" },
  { key: "grande", label: "Grande (80+ carros)" },
  { key: "ex_cliente", label: "Ex-cliente de concorrente" },
];

export const COMMITMENT_OPTIONS: { key: string; label: string; help: string }[] = [
  { key: "nenhum", label: "Nenhum", help: "Sem interesse em voltar a conversar." },
  { key: "fraco", label: "Fraco", help: '"Acho interessante", "manda aí".' },
  { key: "medio", label: "Médio", help: "Aceita voltar a conversar e indica alguém." },
  { key: "forte", label: "Forte", help: "Aceita testar e pagar, mesmo pouco." },
  { key: "muito_forte", label: "Muito forte", help: "Pede para pagar adiantado ou assinar já." },
];

export function labelFrom(options: { key: string; label: string }[], key: string | null): string {
  if (!key) return "—";
  return options.find((o) => o.key === key)?.label ?? key;
}

/** Perguntas que entram na análise e na exportação, na ordem do roteiro. */
export const ALL_QUESTIONS: Question[] = STEPS.flatMap((s) => s.questions);

/** Parâmetros da regra de decisão sugerida (ajuste aqui). */
export const DECISION_RULE = {
  minInterviews: 15,
  minSamePain: 8,
  minWillingToPay: 5,
};

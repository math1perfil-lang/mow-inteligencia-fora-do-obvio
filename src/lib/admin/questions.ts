/**
 * Roteiro universal de entrevista. As perguntas comuns a todos os setores ficam aqui;
 * as específicas de cada setor vêm de sectors.ts e são encaixadas em cada bloco.
 */
import { getSector, SECTORS, type Option, type Question, type Sector } from "./sectors";

export type { PriceField, Question, Sector } from "./sectors";

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

export const OPENING_TIP =
  'Se perguntarem o que você vai construir: "Ainda não sei. Por isso estou conversando com donos de negócio antes de decidir qualquer coisa."';

export const FOLLOW_UPS = [
  "Pode me dar um exemplo?",
  "Quanto tempo isso leva?",
  "Quanto isso custou a você?",
  "E o que aconteceu depois?",
];

/** Monta as etapas da entrevista para um setor. */
export function buildSteps(sector: Sector): Step[] {
  const { clientNoun, ownerNoun } = sector;
  return [
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
      title: "Bloco 1: Contexto",
      minutes: 5,
      intro: "Classifique o negócio e entenda o tamanho da operação. Anote números.",
      notice: null,
      questions: sector.context,
      followUps: [],
    },
    {
      id: "bloco2",
      kind: "bloco",
      title: "Bloco 2: Rotina e dores",
      minutes: 10,
      intro: "O coração da entrevista. Peça sempre uma história real e recente, não uma opinião geral.",
      notice: null,
      questions: sector.pain,
      followUps: FOLLOW_UPS,
    },
    {
      id: "bloco3",
      kind: "bloco",
      title: "Bloco 3: Ferramentas atuais e gasto",
      minutes: 5,
      intro: "Quem já paga por alguma solução prova que o problema vale dinheiro.",
      notice: null,
      questions: sector.tools,
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
        sector.valueCost,
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
        sector.valueDecider,
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
        { key: "c_q2", label: "Você toparia testar por 30 dias, pagando um valor reduzido?" },
        {
          key: "c_q3",
          label: `Conhece mais dois ${ownerNoun}s que tenham essa mesma dificuldade e que eu possa procurar? Pode me apresentar?`,
        },
        { key: "c_q4", label: "Posso te enviar um resumo do que aprendi nas conversas?" },
      ],
      followUps: [],
    },
  ];
}

/** Temas comuns de dor, usados para comparar um setor com outro. A dor de cada setor liga a um tema. */
export const PAIN_OPTIONS: Option[] = [
  { key: "agenda_faltas", label: "Agenda, faltas e horários vagos" },
  { key: "atendimento", label: "Atendimento e retorno a clientes" },
  { key: "cobranca", label: "Cobrança, inadimplência e caixa" },
  { key: "documentos", label: "Documentos, cadastros e papelada" },
  { key: "estoque_compras", label: "Estoque, compras e desperdício" },
  { key: "equipe", label: "Equipe, processos e prazos" },
  { key: "captacao", label: "Captação de clientes e divulgação" },
  { key: "retencao", label: "Retenção e recompra" },
  { key: "precificacao", label: "Preço, margem e custo real" },
  { key: "sistemas", label: "Sistemas soltos e planilhas" },
  { key: "outra", label: "Outra dor" },
];

export const SEVERITY_OPTIONS: { key: number; label: string; help: string }[] = [
  { key: 1, label: "1", help: "Incômodo leve" },
  { key: 2, label: "2", help: "Atrapalha às vezes" },
  { key: 3, label: "3", help: "Atrapalha toda semana" },
  { key: 4, label: "4", help: "Já custou dinheiro" },
  { key: 5, label: "5", help: "Dor aguda: já tentou resolver" },
];

export const COMMITMENT_OPTIONS: { key: string; label: string; help: string }[] = [
  { key: "nenhum", label: "Nenhum", help: "Sem interesse em voltar a conversar." },
  { key: "fraco", label: "Fraco", help: '"Acho interessante", "manda aí".' },
  { key: "medio", label: "Médio", help: "Aceita voltar a conversar e indica alguém." },
  { key: "forte", label: "Forte", help: "Aceita testar e pagar, mesmo pouco." },
  { key: "muito_forte", label: "Muito forte", help: "Pede para pagar adiantado ou assinar já." },
];

export const SIZE_LABELS: Option[] = [
  { key: "solo", label: "Autônomo" },
  { key: "pequena", label: "Pequena" },
  { key: "media", label: "Média" },
  { key: "grande", label: "Grande" },
];

export function labelFrom(options: Option[], key: string | null): string {
  if (!key) return "—";
  return options.find((o) => o.key === key)?.label ?? key;
}

/** Perguntas de priorização e encerramento (iguais em todos os setores), na ordem do roteiro. */
export const UNIVERSAL_QUESTIONS: Question[] = buildSteps(getSector("geral"))
  .flatMap((s) => s.questions)
  .filter((q) => q.key.startsWith("b5_") || q.key.startsWith("c_"));

/** Colunas de perguntas específicas de setor, para a exportação. */
export const SECTOR_QUESTION_COLUMNS: { column: string; sectorKey: string; key: string; label: string }[] =
  SECTORS.flatMap((s) =>
    [...s.context, ...s.pain, ...s.tools, s.valueCost, s.valueDecider].map((q) => ({
      column: q.key,
      sectorKey: s.key,
      key: q.key,
      label: q.label,
    })),
  );

/** Parâmetros da regra de decisão sugerida (por setor; ajuste aqui). */
export const DECISION_RULE = {
  minInterviews: 15,
  minSamePain: 8,
  minWillingToPay: 5,
};

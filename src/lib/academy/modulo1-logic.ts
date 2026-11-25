import type { AreaId } from "./areas";
import {
  CASO_BY_ID,
  RUBRICA,
  U1_ITENS,
  U2_OPCOES,
  U3_CASO,
  U4_CARTOES,
  QUIZ,
  QUIZ_MIN,
  notaFinal,
  type RubricaId,
} from "./modulo1";

export const M1_MODALIDADE = "Autoavaliação guiada — sem correção automática por IA";
export const MIN_NOTA = 70;

export type PromptStatus =
  | "nao iniciado"
  | "rascunho"
  | "enviado"
  | "revisao solicitada"
  | "concluido";

export interface M1Prompt {
  fields: Record<string, string>;
  status: PromptStatus;
  /** Histórico: versão inicial e revisadas, com data. */
  versions: { at: string; text: string }[];
  notas: Partial<Record<RubricaId, number>>;
  /** O aluno pediu ajuda (ou já tentou) e viu o exemplo resolvido. */
  helped: boolean;
  /** Declaração de que usou só dados fictícios ou autorizados. */
  seguro: boolean;
  area: AreaId;
  updatedAt?: string;
}

export interface M1Lab {
  promptIdx: number;
  modo: "" | "ferramenta" | "guiado";
  fonte: string;
  ferramenta: string;
  resposta: string;
  checks: Record<number, boolean>;
  erro: string;
  v2: string;
  resposta2: string;
  decisao: string;
  obs: string;
  /** modo guiado: problemas apontados pelo aluno. */
  problemas: string[];
  conferido: boolean;
}

export interface M1State {
  step: number;
  areaOverride?: AreaId | undefined;
  u1: Record<number, number>;
  u2: string[];
  u2ok: boolean;
  u3: string[];
  u3ok: boolean;
  u4: Record<number, number>;
  u4b: string;
  u4bRev: boolean;
  u5: Record<number, Record<string, string>>;
  u5prio: Record<number, number>;
  prompts: Record<string, M1Prompt>;
  lab: M1Lab;
  limites: Record<string, string>[];
  next: Record<string, string>;
  perfilAtualizado: boolean;
  quiz: { attempts: { score: number; at: string }[]; passed: boolean };
  extras: Record<number, string>;
  done: boolean;
  doneAt?: string | undefined;
}

export const EMPTY_LAB: M1Lab = {
  promptIdx: 0,
  modo: "",
  fonte: "",
  ferramenta: "",
  resposta: "",
  checks: {},
  erro: "",
  v2: "",
  resposta2: "",
  decisao: "",
  obs: "",
  problemas: [],
  conferido: false,
};

export const EMPTY_M1: M1State = {
  step: 0,
  u1: {},
  u2: [],
  u2ok: false,
  u3: [],
  u3ok: false,
  u4: {},
  u4b: "",
  u4bRev: false,
  u5: {},
  u5prio: {},
  prompts: {},
  lab: EMPTY_LAB,
  limites: [{}, {}, {}],
  next: {},
  perfilAtualizado: false,
  quiz: { attempts: [], passed: false },
  extras: {},
  done: false,
};

export const promptKey = (area: AreaId, i: number) => `${area}:${i}`;

export const PROMPT_FIELDS = [
  { id: "titulo", label: "Título", dica: "Dê um nome que você reconheça na biblioteca.", rows: 1 },
  { id: "objetivo", label: "Objetivo", dica: "O que esta entrega precisa resolver?", rows: 2 },
  {
    id: "papel",
    label: "Papel ou perspectiva (opcional)",
    dica: "Use só quando acrescentar valor.",
    rows: 1,
  },
  { id: "acao", label: "Ação", dica: "Verbo e objetivo da tarefa.", rows: 3 },
  {
    id: "contexto",
    label: "Contexto",
    dica: "Situação, público e dados fictícios ou autorizados.",
    rows: 3,
  },
  { id: "tom", label: "Tom", dica: "Adequado a quem vai ler.", rows: 1 },
  { id: "formato", label: "Formato", dica: "Entrega, campos e limite de tamanho.", rows: 2 },
  { id: "limites", label: "Limites", dica: "O que não inventar e como marcar lacunas.", rows: 2 },
  {
    id: "verificacao",
    label: "Verificação humana",
    dica: "O que uma pessoa deve conferir antes de usar.",
    rows: 2,
  },
  {
    id: "fonte",
    label: "Fonte",
    dica: "Conteúdo de entrada, claramente separado das instruções.",
    rows: 4,
  },
] as const;

export const compilePrompt = (f: Record<string, string>) =>
  PROMPT_FIELDS.filter((x) => x.id !== "titulo" && x.id !== "objetivo" && (f[x.id] ?? "").trim())
    .map((x) => `${x.label.replace(" (opcional)", "")}: ${(f[x.id] ?? "").trim()}`)
    .join("\n");

export const PLACEHOLDER = /\[[^\]]{1,80}\]/;

const CRIT: [RegExp, string][] = [
  [/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/, "Há algo parecido com um CPF."],
  [/[\w.+-]+@[\w-]+\.[\w.-]+/, "Há algo parecido com um e-mail."],
  [/\(?\b\d{2}\)?\s?9?\d{4}-?\d{4}\b/, "Há algo parecido com um telefone."],
  [/\b(senha|password|token|chave de api)\s*[:=]\s*\S+/i, "Há algo parecido com uma credencial."],
];
/** Verificação de padrões simples (CPF, e-mail, telefone, credencial). Não é uma avaliação de conteúdo. */
export const criticalFlags = (text: string) => CRIT.filter(([r]) => r.test(text)).map(([, m]) => m);

export const promptNota = (p?: M1Prompt) => (p ? notaFinal(p.notas) : undefined);

export function promptOk(p?: M1Prompt) {
  if (!p) return false;
  const nota = promptNota(p);
  const text = compilePrompt(p.fields);
  return (
    (p.status === "enviado" || p.status === "concluido") &&
    nota !== undefined &&
    nota >= MIN_NOTA &&
    criticalFlags(text).length === 0 &&
    !PLACEHOLDER.test(text) &&
    p.seguro
  );
}

export function promptStatus(p?: M1Prompt): PromptStatus {
  if (!p) return "nao iniciado";
  return p.status;
}

const filled = (o: Record<string, string> | undefined, keys: string[]) =>
  keys.every((k) => (o?.[k] ?? "").trim().length > 0);

export function labDone(l: M1Lab) {
  if (!l.modo) return false;
  const checks = Object.values(l.checks).filter(Boolean).length;
  const base = checks >= 3 && l.erro.trim() && l.v2.trim() && l.decisao.trim();
  if (!base) return false;
  if (l.modo === "ferramenta")
    return l.resposta.trim().length >= 20 && l.ferramenta.trim().length > 0;
  return l.conferido;
}

export function unitsDone(m: M1State, area: AreaId): boolean[] {
  const casos = CASO_BY_ID[area];
  return [
    U1_ITENS.every((it, i) => m.u1[i] === it.correta),
    m.u2ok,
    m.u3ok,
    U4_CARTOES.every((c, i) => m.u4[i] === c.correta) && m.u4b.trim().length >= 20 && m.u4bRev,
    [0, 1, 2, 3, 4].every(
      (r) => filled(m.u5[r], ["tarefa", "risco", "decisao"]) && m.u5prio[r] !== undefined,
    ),
    casos.tarefas.every((_, i) => promptOk(m.prompts[promptKey(area, i)])),
    labDone(m.lab),
    m.limites.every((l) => filled(l, ["decisao", "risco", "parte", "aprovador"])) &&
      filled(m.next, ["tarefa", "ferramenta", "verificacao", "responsavel"]) &&
      m.perfilAtualizado,
  ];
}

export function m1Progress(m: M1State | undefined, area: AreaId | undefined) {
  const s = m ?? EMPTY_M1;
  const units = area ? unitsDone(s, area) : Array<boolean>(8).fill(false);
  const doneUnits = units.filter(Boolean).length;
  const percent = s.done ? 100 : Math.round((doneUnits / 8) * 100);
  return {
    units,
    doneUnits,
    percent,
    quizPassed: s.quiz.passed,
    ready: doneUnits === 8 && s.quiz.passed,
    complete: s.done,
  };
}

export const quizScore = (answers: Record<number, number>, order: number[][]) =>
  QUIZ.filter((q, i) => order[i]![answers[i] ?? -1] === q.answer).length;

export { QUIZ_MIN, U2_OPCOES, U3_CASO, RUBRICA };

/** Ordem determinística das opções de cada pergunta (muda a cada tentativa), preservando a chave correta. */
export function quizOrder(seed: number): number[][] {
  let x = seed * 9301 + 49297;
  const rnd = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  return QUIZ.map((q) => {
    const idx = q.options.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [idx[i], idx[j]] = [idx[j]!, idx[i]!];
    }
    return idx;
  });
}

/* --------------------------------- feedback -------------------------------- */

const CAMPO_DO_CRITERIO: Record<RubricaId, string> = {
  clareza: "acao",
  contexto: "contexto",
  formato: "formato",
  limites: "limites",
  verificacao: "verificacao",
  aplicabilidade: "objetivo",
};
const trecho = (t: string) => {
  const s = t.trim().replace(/\s+/g, " ");
  return s.length > 90 ? `${s.slice(0, 87)}…` : s;
};

/** Feedback montado a partir das notas da autoavaliação e do texto do próprio aluno. */
export function feedbackDoPrompt(p: M1Prompt, verificacaoCaso: string) {
  const notas = RUBRICA.map((r) => ({ r, n: p.notas[r.id] ?? 0 }));
  const melhor = [...notas].sort((a, b) => b.n - a.n)[0]!;
  const pior = [...notas].sort((a, b) => a.n - b.n).find((x) => x.r.id !== melhor.r.id) ?? melhor;
  const bom = trecho(p.fields[CAMPO_DO_CRITERIO[melhor.r.id]] ?? "");
  const partes = [
    bom
      ? `Você definiu bem o critério “${melhor.r.label}”: “${bom}”.`
      : `Seu ponto mais forte é “${melhor.r.label}”.`,
    pior.n >= 4
      ? "Todos os critérios estão consistentes; mantenha o cuidado com lacunas."
      : `Para melhorar “${pior.r.label}”, ajuste o prompt para: ${pior.r.dica}.`,
    `Antes de usar, confira ${verificacaoCaso.charAt(0).toLowerCase()}${verificacaoCaso.slice(1).replace(/\.$/, "")}.`,
    pior.n >= 4
      ? "Próxima tentativa: teste no laboratório e registre o que mudou."
      : `Próxima tentativa: releia o critério “${pior.r.label}” e pergunte-se ${pior.r.cheque}.`,
  ];
  return partes.join(" ");
}

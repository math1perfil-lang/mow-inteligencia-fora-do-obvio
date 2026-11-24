import { useEffect, useState, useSyncExternalStore } from "react";
import type { AreaId } from "./areas";
import { AREA_BY_ID } from "./areas";
import { MODULES } from "./course";

export type Level = "iniciante" | "intermediario" | "avancado";
export type PromptStatus = "rascunho" | "em teste" | "aprovado" | "arquivado";

export interface Profile {
  area: AreaId;
  level: Level;
  goal: string;
  score: number;
  /** Respostas do diagnóstico (0 a 3), na ordem das perguntas. */
  dims: number[];
  createdAt: string;
}

export interface SavedPrompt {
  id: string;
  title: string;
  area: AreaId;
  category: string;
  objective: string;
  text: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  quality: number;
  result: string;
  notes: string;
  status: PromptStatus;
}

export interface StartState {
  /** Etapa atual (0 a 11) e a mais avançada já liberada. */
  step: number;
  max: number;
  diag: Record<string, string | string[]>;
  area?: AreaId | undefined;
  /** id do fundamento -> opção marcada. */
  fund: Record<string, number>;
  /** índice da situação -> opção marcada. */
  mini: Record<number, number>;
  task: string;
  promptText: string;
  evalTotal?: number | undefined;
  evalTier?: string | undefined;
  perfil: string;
  profileSaved: boolean;
  checks: Record<number, boolean>;
  done: boolean;
  doneAt?: string | undefined;
}

export const EMPTY_START: StartState = {
  step: 0,
  max: 0,
  diag: {},
  fund: {},
  mini: {},
  task: "",
  promptText: "",
  perfil: "",
  profileSaved: false,
  checks: {},
  done: false,
};

export interface AcademyState {
  start?: StartState;
  profile?: Profile;
  /** taskId -> pontos (0 a 100) */
  done: Record<string, number>;
  checks: Record<string, boolean>;
  deliverables: Record<number, string>;
  prompts: SavedPrompt[];
  finalProject: string;
  ack: boolean;
  certName: string;
  issuedAt?: string;
}

const KEY = "mow-academy:v1";
const EMPTY: AcademyState = {
  done: {},
  checks: {},
  deliverables: {},
  prompts: [],
  finalProject: "",
  ack: false,
  certName: "",
};

let state: AcademyState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as Partial<AcademyState>) };
  } catch {
    /* armazenamento indisponível: segue em memória */
  }
}

function emit() {
  for (const l of listeners) l();
}

export function updateAcademy(fn: (s: AcademyState) => AcademyState) {
  load();
  state = fn(state);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* sem persistência: mantém em memória */
  }
  emit();
}

export function resetAcademy() {
  state = EMPTY;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  emit();
}

export function useAcademy() {
  const s = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => {
      load();
      return state;
    },
    () => EMPTY,
  );
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return { state: s, ready };
}

/* ------------------------------ progresso ------------------------------ */

export function moduleProgress(n: number, s: AcademyState) {
  const m = MODULES[n]!;
  if (n === 0) {
    const st = s.start ?? EMPTY_START;
    const percent = st.done ? 100 : Math.round((Math.min(st.max, 11) / 12) * 100);
    return {
      tasks: 0,
      checks: 0,
      deliverable: st.done,
      total: 12,
      doneUnits: st.done ? 12 : Math.min(st.max, 11),
      complete: st.done,
      percent,
    };
  }
  const tasks = m.tasks.filter((t) => (s.done[t.id] ?? 0) > 0).length;
  const checks = m.checklist.filter((_, i) => s.checks[`${n}:${i}`]).length;
  const deliverable = (s.deliverables[n] ?? "").trim().length >= 60;
  const total = m.tasks.length + m.checklist.length + 1;
  const doneUnits = tasks + checks + (deliverable ? 1 : 0);
  return {
    tasks,
    checks,
    deliverable,
    total,
    doneUnits,
    complete: doneUnits === total,
    percent: Math.round((doneUnits / total) * 100),
  };
}

export function isUnlocked(n: number, s: AcademyState) {
  if (n === 0) return true;
  if (!s.profile) return false;
  return n === 0 || moduleProgress(n - 1, s).complete;
}

export function overall(s: AcademyState) {
  const per = MODULES.map((m) => moduleProgress(m.n, s));
  const total = per.reduce((a, b) => a + b.total, 0);
  const done = per.reduce((a, b) => a + b.doneUnits, 0);
  const completed = per.filter((p) => p.complete).length;
  const minutesLeft = MODULES.reduce(
    (a, m, i) => a + (per[i]!.complete ? 0 : Math.round(m.minutes * (1 - per[i]!.percent / 100))),
    0,
  );
  const current = MODULES.find((m, i) => !per[i]!.complete && isUnlocked(m.n, s))?.n;
  return { percent: Math.round((done / total) * 100), completed, minutesLeft, current };
}

export const MIN_APPROVED_PROMPTS = 5;

export function certification(s: AcademyState) {
  const o = overall(s);
  const approved = s.prompts.filter((p) => p.status === "aprovado");
  const withResult = approved.filter((p) => p.result.trim().length >= 20);
  const rules = [
    { label: "Módulo Start e as 8 semanas concluídos", ok: o.completed === MODULES.length },
    {
      label: `Pelo menos ${MIN_APPROVED_PROMPTS} prompts aprovados na biblioteca (${approved.length} agora)`,
      ok: approved.length >= MIN_APPROVED_PROMPTS,
    },
    {
      label: "Demonstração prática: 3 prompts aprovados com resultado obtido descrito",
      ok: withResult.length >= 3,
    },
    {
      label: "Sistema de Prompts Corporativo descrito no projeto final (mín. 200 caracteres)",
      ok: s.finalProject.trim().length >= 200,
    },
    { label: "Regras de segurança e governança aceitas", ok: s.ack },
  ];
  return { rules, eligible: rules.every((r) => r.ok) };
}

export function areaOf(s: AcademyState) {
  return s.profile ? AREA_BY_ID[s.profile.area] : undefined;
}

import type { AnalysisData } from "./api";
import {
  COMMITMENT_OPTIONS,
  DECISION_RULE,
  PAIN_OPTIONS,
  SECTOR_QUESTION_COLUMNS,
  SIZE_LABELS,
  UNIVERSAL_QUESTIONS,
  labelFrom,
} from "./questions";
import { ALL_FEATURES, SECTORS, getSector, painLabel, painTheme, sectorDisplayName } from "./sectors";
import type { Interview } from "./types";

export interface PriceStat {
  label: string;
  count: number;
  median: number | null;
  min: number | null;
  max: number | null;
}

export interface FeatureStat {
  key: string;
  title: string;
  first: number;
  second: number;
  noDifference: number;
}

export type DecisionKind = "insuficiente" | "seguir" | "mudar" | "parar";

export interface Decision {
  kind: DecisionKind;
  title: string;
  reason: string;
}

export interface PainStat {
  key: string;
  label: string;
  count: number;
  avgSeverity: number | null;
  willing: number;
  /** Número de entrevistas × gravidade média: ordena as oportunidades. */
  score: number;
}

export interface SectorSummary {
  key: string;
  label: string;
  total: number;
  completed: number;
  willing: number;
  topPain: string | null;
  topPainCount: number;
  decision: Decision;
}

export interface Analysis {
  total: number;
  completed: Interview[];
  bySector: { label: string; count: number }[];
  sectors: SectorSummary[];
  bySize: { label: string; count: number }[];
  byCommitment: { label: string; count: number }[];
  byPain: PainStat[];
  features: FeatureStat[];
  prices: PriceStat[];
  willingToPay: number;
  painAnswers: { interview: Interview; items: { label: string; text: string }[] }[];
  decision: Decision | null;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const lower = sorted[mid - 1];
  const upper = sorted[mid];
  if (upper === undefined) return null;
  return sorted.length % 2 === 0 && lower !== undefined ? (lower + upper) / 2 : upper;
}

function priceStat(label: string, values: (number | null)[]): PriceStat {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  return {
    label,
    count: nums.length,
    median: median(nums),
    min: nums.length ? Math.min(...nums) : null,
    max: nums.length ? Math.max(...nums) : null,
  };
}

function isWilling(i: Interview): boolean {
  return i.commitment_level === "forte" || i.commitment_level === "muito_forte";
}

function decide(rows: Interview[], topCount: number): Decision {
  const willing = rows.filter(isWilling).length;
  if (rows.length < DECISION_RULE.minInterviews) {
    return {
      kind: "insuficiente",
      title: "Dados insuficientes",
      reason: `Há ${rows.length} entrevistas concluídas. A regra sugere pelo menos ${DECISION_RULE.minInterviews} antes de decidir.`,
    };
  }
  if (topCount >= DECISION_RULE.minSamePain && willing >= DECISION_RULE.minWillingToPay) {
    return {
      kind: "seguir",
      title: "Sugestão: seguir",
      reason: `${topCount} entrevistados citaram a mesma dor e ${willing} aceitam testar pagando. Construa o MVP dessa função.`,
    };
  }
  if (willing === 0) {
    return {
      kind: "parar",
      title: "Sugestão: parar ou repensar o setor",
      reason: "Ninguém aceitou testar pagando. Revise o público e o problema antes de construir.",
    };
  }
  return {
    kind: "mudar",
    title: "Sugestão: mudar",
    reason: `A dor mais citada aparece em ${topCount} entrevistas e ${willing} aceitam pagar. Revise preço, função ou o porte e repita.`,
  };
}

/** Com um setor escolhido, agrupa pelas dores dele; com todos, agrupa pelos temas comuns. */
function painStats(rows: Interview[], sectorKey: string): PainStat[] {
  const groups: { key: string; label: string; rows: Interview[] }[] =
    sectorKey === "todos"
      ? PAIN_OPTIONS.map((o) => ({ ...o, rows: rows.filter((i) => painTheme(i.main_pain_key) === o.key) }))
      : getSector(sectorKey).painOptions.map((o) => ({
          key: o.key,
          label: o.label,
          rows: rows.filter((i) => i.main_pain_key === o.key),
        }));
  return groups
    .map((g) => {
      const sev = g.rows.map((i) => i.pain_severity).filter((v): v is number => typeof v === "number");
      const avg = sev.length ? sev.reduce((a, b) => a + b, 0) / sev.length : null;
      return {
        key: g.key,
        label: g.label,
        count: g.rows.length,
        avgSeverity: avg,
        willing: g.rows.filter(isWilling).length,
        score: g.rows.length * (avg ?? 3),
      };
    })
    .sort((a, b) => b.score - a.score || b.count - a.count);
}

const isOther = (key: string) => key === "outra" || key.endsWith("_outra");

/** sectorKey "todos" considera todos os setores juntos. */
export function computeAnalysis(data: AnalysisData, sectorKey: string = "todos"): Analysis {
  const inScope = data.interviews.filter((i) => sectorKey === "todos" || i.sector_key === sectorKey);
  const completed = inScope.filter((i) => i.status === "concluida");
  const ids = new Set(completed.map((i) => i.id));

  const bySector = SECTORS.map((s) => ({
    label: s.label,
    count: completed.filter((i) => i.sector_key === s.key).length,
  }));

  const sectors: SectorSummary[] = SECTORS.map((s) => {
    const all = data.interviews.filter((i) => i.sector_key === s.key);
    const done = all.filter((i) => i.status === "concluida");
    const top = painStats(done, s.key).find((p) => !isOther(p.key) && p.count > 0);
    return {
      key: s.key,
      label: s.label,
      total: all.length,
      completed: done.length,
      willing: done.filter(isWilling).length,
      topPain: top?.label ?? null,
      topPainCount: top?.count ?? 0,
      decision: decide(done, top?.count ?? 0),
    };
  }).filter((s) => s.total > 0);

  const bySize = SIZE_LABELS.map((o) => ({
    label: o.label,
    count: completed.filter((i) => i.company_size === o.key).length,
  }));

  const byCommitment = COMMITMENT_OPTIONS.map((o) => ({
    label: o.label,
    count: completed.filter((i) => i.commitment_level === o.key).length,
  }));

  const byPain = painStats(completed, sectorKey);

  const features: FeatureStat[] = ALL_FEATURES.filter((f) => sectorKey === "todos" || f.sectorKey === sectorKey)
    .map((f) => {
      const rows = data.picks.filter((p) => p.feature_key === f.key && ids.has(p.interview_id));
      return {
        key: f.key,
        title: sectorKey === "todos" ? `${f.title} (${getSector(f.sectorKey).label})` : f.title,
        first: rows.filter((r) => r.rank === 1).length,
        second: rows.filter((r) => r.rank === 2).length,
        noDifference: rows.filter((r) => r.no_difference).length,
      };
    })
    .filter((f) => sectorKey !== "todos" || f.first + f.second + f.noDifference > 0)
    .sort((a, b) => b.first * 2 + b.second - (a.first * 2 + a.second));

  const prices = [
    priceStat("Faria sentido pagar", completed.map((i) => i.price_accept_brl)),
    priceStat("Caro demais", completed.map((i) => i.price_too_expensive_brl)),
    priceStat("Barato demais (suspeito)", completed.map((i) => i.price_too_cheap_brl)),
  ];

  const answerOf = (interviewId: string, key: string): string =>
    data.answers.find((a) => a.interview_id === interviewId && a.question_key === key)?.answer_text ?? "";

  const painAnswers = completed.map((interview) => ({
    interview,
    items: getSector(interview.sector_key).highlights.map((h) => ({
      label: h.label,
      text: answerOf(interview.id, h.key),
    })),
  }));

  // A decisão só faz sentido dentro de um setor: misturar setores esconde a dor comum.
  const decision =
    sectorKey === "todos"
      ? null
      : decide(completed, byPain.find((p) => !isOther(p.key))?.count ?? 0);

  return {
    total: inScope.length,
    completed,
    bySector,
    sectors,
    bySize,
    byCommitment,
    byPain,
    features,
    prices,
    willingToPay: completed.filter(isWilling).length,
    painAnswers,
    decision,
  };
}

// ---------------------------------------------------------------- CSV

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildCsv(data: AnalysisData): string {
  const header = [
    "id",
    "status",
    "data",
    "setor",
    "empresa",
    "entrevistado",
    "cargo",
    "contato",
    "porte",
    "cidade",
    "autorizou_gravacao",
    "dor_principal",
    "gravidade_dor",
    "compromisso",
    "obs_compromisso",
    "preco_faz_sentido",
    "preco_caro_demais",
    "preco_barato_demais",
    ...ALL_FEATURES.map((f) => `funcao_${f.key}`),
    ...UNIVERSAL_QUESTIONS.map((q) => q.key),
    ...SECTOR_QUESTION_COLUMNS.map((c) => c.column),
    "notas_gerais",
  ];

  const lines = [header.map(csvCell).join(",")];
  for (const i of data.interviews) {
    const answers = new Map(
      data.answers.filter((a) => a.interview_id === i.id).map((a) => [a.question_key, a.answer_text] as const),
    );
    const pickText = (featureKey: string): string => {
      const p = data.picks.find((x) => x.interview_id === i.id && x.feature_key === featureKey);
      if (!p) return "";
      if (p.rank) return `${p.rank}ª escolha`;
      return p.no_difference ? "não faria diferença" : "";
    };
    const row = [
      i.id,
      i.status,
      i.started_at,
      sectorDisplayName(i.sector_key, i.sector_custom_name),
      i.company_name,
      i.interviewee_name,
      i.interviewee_role,
      i.contact,
      labelFrom(getSector(i.sector_key).sizeOptions, i.company_size),
      i.city,
      i.consent_recording ? "sim" : "não",
      painLabel(i.main_pain_key),
      i.pain_severity,
      labelFrom(COMMITMENT_OPTIONS, i.commitment_level),
      i.commitment_notes,
      i.price_accept_brl,
      i.price_too_expensive_brl,
      i.price_too_cheap_brl,
      ...ALL_FEATURES.map((f) => pickText(f.key)),
      ...UNIVERSAL_QUESTIONS.map((q) => answers.get(q.key) ?? ""),
      ...SECTOR_QUESTION_COLUMNS.map((c) => (c.sectorKey === i.sector_key ? (answers.get(c.key) ?? "") : "")),
      i.general_notes,
    ];
    lines.push(row.map(csvCell).join(","));
  }
  return lines.join("\r\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function formatBrl(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

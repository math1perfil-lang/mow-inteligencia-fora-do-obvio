import type { AnalysisData } from "./api";
import {
  ALL_QUESTIONS,
  COMMITMENT_OPTIONS,
  DECISION_RULE,
  FEATURES,
  PAIN_OPTIONS,
  SIZE_OPTIONS,
  labelFrom,
} from "./questions";
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

export interface Analysis {
  total: number;
  completed: Interview[];
  bySize: { label: string; count: number }[];
  byCommitment: { label: string; count: number }[];
  byPain: { key: string; label: string; count: number }[];
  features: FeatureStat[];
  prices: PriceStat[];
  willingToPay: number;
  painAnswers: { interview: Interview; b2_q2: string; b2_q3: string }[];
  decision: Decision;
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

export function computeAnalysis(data: AnalysisData): Analysis {
  const completed = data.interviews.filter((i) => i.status === "concluida");
  const ids = new Set(completed.map((i) => i.id));

  const bySize = SIZE_OPTIONS.map((o) => ({
    label: o.label,
    count: completed.filter((i) => i.store_size === o.key).length,
  }));

  const byCommitment = COMMITMENT_OPTIONS.map((o) => ({
    label: o.label,
    count: completed.filter((i) => i.commitment_level === o.key).length,
  }));

  const byPain = PAIN_OPTIONS.map((o) => ({
    key: o.key,
    label: o.label,
    count: completed.filter((i) => i.main_pain_key === o.key).length,
  })).sort((a, b) => b.count - a.count);

  const features: FeatureStat[] = FEATURES.map((f) => {
    const rows = data.picks.filter((p) => p.feature_key === f.key && ids.has(p.interview_id));
    return {
      key: f.key,
      title: f.title,
      first: rows.filter((r) => r.rank === 1).length,
      second: rows.filter((r) => r.rank === 2).length,
      noDifference: rows.filter((r) => r.no_difference).length,
    };
  }).sort((a, b) => b.first * 2 + b.second - (a.first * 2 + a.second));

  const prices = [
    priceStat("Faria sentido pagar", completed.map((i) => i.price_accept_brl)),
    priceStat("Caro demais", completed.map((i) => i.price_too_expensive_brl)),
    priceStat("Barato demais (suspeito)", completed.map((i) => i.price_too_cheap_brl)),
  ];

  const willingToPay = completed.filter(
    (i) => i.commitment_level === "forte" || i.commitment_level === "muito_forte",
  ).length;

  const answerOf = (interviewId: string, key: string): string =>
    data.answers.find((a) => a.interview_id === interviewId && a.question_key === key)?.answer_text ?? "";

  const painAnswers = completed.map((interview) => ({
    interview,
    b2_q2: answerOf(interview.id, "b2_q2"),
    b2_q3: answerOf(interview.id, "b2_q3"),
  }));

  // "Outra dor" não conta como uma dor em comum; só as dores mapeadas às funções.
  const topCount = byPain.find((p) => p.key !== "outra")?.count ?? 0;

  let decision: Decision;
  if (completed.length < DECISION_RULE.minInterviews) {
    decision = {
      kind: "insuficiente",
      title: "Dados insuficientes",
      reason: `Há ${completed.length} entrevistas concluídas. A regra sugere pelo menos ${DECISION_RULE.minInterviews} antes de decidir.`,
    };
  } else if (topCount >= DECISION_RULE.minSamePain && willingToPay >= DECISION_RULE.minWillingToPay) {
    decision = {
      kind: "seguir",
      title: "Sugestão: seguir",
      reason: `${topCount} lojistas citaram a mesma dor e ${willingToPay} aceitam testar pagando. Construa o MVP dessa função.`,
    };
  } else if (willingToPay === 0) {
    decision = {
      kind: "parar",
      title: "Sugestão: parar ou repensar o mercado",
      reason: "Ninguém aceitou testar pagando. Revise o público e o problema antes de construir.",
    };
  } else {
    decision = {
      kind: "mudar",
      title: "Sugestão: mudar",
      reason: `A dor mais citada aparece em ${topCount} lojas e ${willingToPay} aceitam pagar. Revise preço, função ou o porte da loja e repita.`,
    };
  }

  return {
    total: data.interviews.length,
    completed,
    bySize,
    byCommitment,
    byPain,
    features,
    prices,
    willingToPay,
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
  const questionKeys = ALL_QUESTIONS.map((q) => q.key);
  const header = [
    "id",
    "status",
    "data",
    "loja",
    "entrevistado",
    "cargo",
    "porte",
    "cidade",
    "autorizou_gravacao",
    "dor_principal",
    "compromisso",
    "obs_compromisso",
    "preco_faz_sentido",
    "preco_caro_demais",
    "preco_barato_demais",
    ...FEATURES.map((f) => `funcao_${f.key}`),
    ...questionKeys,
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
      i.store_name,
      i.interviewee_name,
      i.interviewee_role,
      labelFrom(SIZE_OPTIONS, i.store_size),
      i.city,
      i.consent_recording ? "sim" : "não",
      labelFrom(PAIN_OPTIONS, i.main_pain_key),
      labelFrom(COMMITMENT_OPTIONS, i.commitment_level),
      i.commitment_notes,
      i.price_accept_brl,
      i.price_too_expensive_brl,
      i.price_too_cheap_brl,
      ...FEATURES.map((f) => pickText(f.key)),
      ...questionKeys.map((k) => answers.get(k) ?? ""),
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

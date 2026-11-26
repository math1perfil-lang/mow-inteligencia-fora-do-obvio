import { PLACEHOLDER, criticalFlags } from "./modulo1-logic";
import {
  COMPONENTES_NOTA,
  ERROS_CRITICOS,
  FONTES,
  LAB_CAMPOS,
  MAPA_CAMPOS,
  METRICAS,
  PILOTO_CAMPOS,
  RH_MIN_NOTA,
  RH_MODALIDADE,
  RH_MODULE_ID,
  RH_QUIZ,
  RH_QUIZ_MIN,
  RH_TAREFAS,
  RUBRICA,
  TAREFA_BY_ID,
  TEMPLATE_CAMPOS,
  U1_PEDIDOS,
  U2A_ITENS,
  U2B,
  U3_PONTOS,
  U7A,
  U7A_PERGUNTAS,
  U7B,
  U7B_LIVRE,
  LIMITE_CAMPOS,
  notaRubrica,
  type NivelPratica,
  type RhTarefa,
} from "./rh1";
import type { SavedPrompt } from "./store";

export type RhTaskStatus =
  | "nao iniciada"
  | "rascunho"
  | "enviada"
  | "revisao necessaria"
  | "concluida";

export interface RhVersion {
  at: string;
  fields: Record<string, string>;
  entrega: string;
}

export interface RhPrompt {
  fields: Record<string, string>;
  entrega: string;
  pendencias: string;
  notas: Record<string, number>;
  /** índice do erro crítico -> o aluno confirma que NÃO ocorre. */
  seguro: Record<number, boolean>;
  versions: RhVersion[];
  submitted: boolean;
  /** O aluno pediu ajuda (ou já tentou) e viu o exemplo resolvido. */
  helped: boolean;
  updatedAt?: string;
}

export interface Livre {
  texto: string;
  revealed: boolean;
  marks: Record<number, boolean>;
}

export interface RhLab {
  modo: "" | "ferramenta" | "guiado";
  campos: Record<string, string>;
  guiadoIdx: number;
  guiadoTexto: string;
  guiadoRevealed: boolean;
}

export interface RhState {
  step: number;
  nivel: NivelPratica;
  u1: Record<number, number>;
  mapa: Record<number, Record<string, string>>;
  u2a: Record<number, number>;
  limites: Record<string, string>[];
  u3: Record<string, string>;
  livres: Record<string, Livre>;
  prompts: Record<string, RhPrompt>;
  /** comparação guiada por tarefa: erros marcados e conferência. */
  guiado: Record<string, { picks: Record<number, boolean>; checked: boolean }>;
  u7: { marco: string; abril: string; pp: string; maio: string };
  u7b: { picks: Record<number, boolean>; checked: boolean };
  crivo: { checks: Record<number, boolean>; entrega: string };
  lab: RhLab;
  piloto: Record<string, string>;
  metricas: Record<string, boolean>;
  perfil: string;
  quiz: { attempts: { score: number; at: string }[]; passed: boolean };
  done: boolean;
  doneAt?: string | undefined;
}

export const EMPTY_LAB_RH: RhLab = {
  modo: "",
  campos: {},
  guiadoIdx: 0,
  guiadoTexto: "",
  guiadoRevealed: false,
};

export const EMPTY_RH: RhState = {
  step: 0,
  nivel: "guiado",
  u1: {},
  mapa: {},
  u2a: {},
  limites: [{}, {}, {}],
  u3: {},
  livres: {},
  prompts: {},
  guiado: {},
  u7: { marco: "", abril: "", pp: "", maio: "" },
  u7b: { picks: {}, checked: false },
  crivo: { checks: {}, entrega: "" },
  lab: EMPTY_LAB_RH,
  piloto: {},
  metricas: {},
  perfil: "",
  quiz: { attempts: [], passed: false },
  done: false,
};

export const EMPTY_PROMPT_RH: RhPrompt = {
  fields: {},
  entrega: "",
  pendencias: "",
  notas: {},
  seguro: {},
  versions: [],
  submitted: false,
  helped: false,
};

const filled = (o: Record<string, string> | undefined, keys: readonly string[]) =>
  keys.every((k) => (o?.[k] ?? "").trim().length > 0);
const countFilled = (o: Record<string, string> | undefined, keys: readonly string[]) =>
  keys.filter((k) => (o?.[k] ?? "").trim().length > 0).length;
const lines = (t: string) =>
  t
    .split(/[\n;]+/)
    .map((x) => x.trim())
    .filter(Boolean);

/* ------------------------------ prompt compilado --------------------------- */

export function compileRhPrompt(f: Record<string, string>) {
  return TEMPLATE_CAMPOS.filter((x) => (f[x.id] ?? "").trim())
    .map((x) => `${x.label.replace(" (opcional)", "").toUpperCase()}: ${(f[x.id] ?? "").trim()}`)
    .join("\n");
}

const REQUIRED = [
  "objetivo",
  "fonte",
  "publico",
  "tarefa",
  "formato",
  "limites",
  "verificacao",
  "dados",
];

export interface Bloqueio {
  id: string;
  texto: string;
}

/** Pendências que impedem marcar a tarefa como concluída. Não é uma nota: são condições objetivas. */
export function bloqueios(taskId: RhTarefa["id"], p?: RhPrompt): Bloqueio[] {
  const out: Bloqueio[] = [];
  if (!p) return [{ id: "vazio", texto: "Ainda não iniciada." }];
  const text = compileRhPrompt(p.fields);
  const faltam = REQUIRED.filter((k) => !(p.fields[k] ?? "").trim());
  if (faltam.length)
    out.push({
      id: "campos",
      texto: `Preencha os campos obrigatórios (${faltam.length} pendente(s)).`,
    });
  if (PLACEHOLDER.test(text) || PLACEHOLDER.test(p.entrega))
    out.push({
      id: "placeholder",
      texto:
        "Ainda há campos [entre colchetes] sem preencher. Substitua pelo conteúdo real do caso fictício.",
    });
  if (p.entrega.trim().length < 40)
    out.push({
      id: "entrega",
      texto: "Cole ou escreva a entrega revisada (rascunho) para conferência.",
    });
  const minPend = taskId === "p1" ? 2 : 1;
  if (lines(p.pendencias).length < minPend)
    out.push({
      id: "pendencias",
      texto: `Sinalize pelo menos ${minPend} pendência(s) ou item(ns) que exigem aprovação humana.`,
    });
  if (RUBRICA.some((r) => p.notas[r.id] === undefined))
    out.push({ id: "notas", texto: "Complete a autoavaliação pela rubrica (5 critérios)." });
  if (ERROS_CRITICOS.some((_, i) => !p.seguro[i]))
    out.push({
      id: "seguro",
      texto:
        "Confirme cada item de segurança. Se algum não for verdade, revise a entrega antes de enviar.",
    });
  const flags = criticalFlags(`${text}\n${p.entrega}`);
  if (flags.length)
    out.push({
      id: "flags",
      texto: `${flags.join(" ")} Este laboratório usa apenas dados fictícios. Remova identificadores e não envie documentos pessoais.`,
    });
  if (RUBRICA.every((r) => p.notas[r.id] !== undefined) && notaRubrica(p.notas) < RH_MIN_NOTA)
    out.push({
      id: "nota",
      texto: `A nota da autoavaliação é menor que ${RH_MIN_NOTA}. Revise a instrução e a entrega e reavalie.`,
    });
  return out;
}

export function taskStatus(taskId: RhTarefa["id"], p?: RhPrompt): RhTaskStatus {
  if (!p) return "nao iniciada";
  const has = Object.values(p.fields).some((v) => v.trim()) || p.entrega.trim();
  if (!has) return "nao iniciada";
  if (!p.submitted) return "rascunho";
  const b = bloqueios(taskId, p);
  if (b.length === 0) return "concluida";
  if (b.every((x) => x.id === "notas" || x.id === "seguro")) return "enviada";
  return "revisao necessaria";
}

export const taskNota = (p?: RhPrompt) =>
  p && RUBRICA.every((r) => p.notas[r.id] !== undefined) ? notaRubrica(p.notas) : undefined;

/* ---------------------------------- unidades -------------------------------- */

export const livreDone = (l: Livre | undefined, total: number) =>
  !!l &&
  l.texto.trim().length >= 15 &&
  l.revealed &&
  Object.values(l.marks).filter(Boolean).length >= Math.min(total, Math.max(1, total - 1));

export function guiadoDone(g: RhState["guiado"][string] | undefined, erros: number, total: number) {
  if (!g?.checked) return false;
  const picks = Object.entries(g.picks)
    .filter(([, v]) => v)
    .map(([k]) => Number(k));
  return picks.length === erros && picks.every((k) => k < erros) && total >= erros;
}

export const labDone = (l: RhLab) => {
  const c = l.campos;
  if (!l.modo) return false;
  const base = filled(c, [
    "tarefa",
    "fonte",
    "promptV1",
    "verificacoes",
    "erro",
    "promptV2",
    "resultado",
    "limitacoes",
    "aprovador",
  ]);
  if (!base) return false;
  if (l.modo === "ferramenta") return (c["saidaV1"] ?? "").trim().length >= 20;
  return l.guiadoRevealed && l.guiadoTexto.trim().length >= 15;
};

export const pilotoDone = (s: RhState) =>
  filled(
    s.piloto,
    PILOTO_CAMPOS.map((x) => x.id),
  ) && METRICAS.filter((m) => s.metricas[m.id]).length >= 3;

export const u7NumerosOk = (u: RhState["u7"]) => {
  const n = (v: string) => Number(v.trim().replace("%", "").replace(",", "."));
  return (
    n(u.marco) === U7A.marco &&
    n(u.abril) === U7A.abril &&
    n(u.pp) === U7A.diferencaPp &&
    u.maio === U7A.maio
  );
};

export function unitsDone(s: RhState): boolean[] {
  const pOk = (id: RhTarefa["id"]) => taskStatus(id, s.prompts[id]) === "concluida";
  const t = (id: RhTarefa["id"]) => TAREFA_BY_ID[id];
  const extras = (id: RhTarefa["id"]) =>
    t(id).extras.every((e) => livreDone(s.livres[e.id], e.pontos.length));
  const g = (id: RhTarefa["id"]) =>
    guiadoDone(
      s.guiado[id],
      t(id).inadequadaErros.length,
      t(id).inadequadaErros.length + t(id).inadequadaDistratores.length,
    );
  return [
    U1_PEDIDOS.every((x, i) => s.u1[i] === x.correta) &&
      [0, 1, 2].every((i) =>
        filled(
          s.mapa[i],
          MAPA_CAMPOS.map((c) => c.id),
        ),
      ),
    U2A_ITENS.every((x, i) => s.u2a[i] === x.correta) &&
      U2B.every((q) => livreDone(s.livres[q.id], q.pontos.length)) &&
      s.limites.every((l) =>
        filled(
          l,
          LIMITE_CAMPOS.map((c) => c.id),
        ),
      ),
    filled(s.u3, [
      "finalidade",
      "publico",
      "fonte",
      "formato",
      "limites",
      "aprovador",
      "escalonamento",
    ]) && livreDone(s.livres["u3"], U3_PONTOS.length),
    pOk("p1") && g("p1"),
    pOk("p2") && pOk("p3") && extras("p2") && extras("p3") && g("p2") && g("p3"),
    pOk("p4") && extras("p4") && g("p4"),
    u7NumerosOk(s.u7) &&
      livreDone(s.livres[U7A_PERGUNTAS.id], U7A_PERGUNTAS.pontos.length) &&
      guiadoDone(s.u7b, U7B.erros.length, U7B.erros.length + U7B.distratores.length) &&
      livreDone(s.livres[U7B_LIVRE.id], U7B_LIVRE.pontos.length) &&
      Object.values(s.crivo.checks).filter(Boolean).length === 5 &&
      s.crivo.entrega.trim().length > 0,
    labDone(s.lab) && pilotoDone(s) && s.quiz.passed,
  ];
}

/* ---------------------------------- notas ---------------------------------- */

/** Escala de componente: 0 ausente; 25 incompleto; 50 parcial; 75 adequado; 100 completo. */
export const escala = (frac: number) =>
  frac <= 0 ? 0 : frac < 0.5 ? 25 : frac < 0.75 ? 50 : frac < 1 ? 75 : 100;

export function componentes(s: RhState): Record<string, number> {
  const mapa =
    [0, 1, 2].reduce(
      (a, i) =>
        a +
        countFilled(
          s.mapa[i],
          MAPA_CAMPOS.map((c) => c.id),
        ),
      0,
    ) / 15;
  const prompts =
    RH_TAREFAS.reduce((a, t) => {
      const p = s.prompts[t.id];
      const n = taskNota(p);
      return a + (n !== undefined && p && p.entrega.trim() ? n : 0);
    }, 0) / RH_TAREFAS.length;
  const labKeys = LAB_CAMPOS.map((c) => c.id);
  const labFrac =
    ((s.lab.modo ? 1 : 0) +
      countFilled(
        s.lab.campos,
        labKeys.filter((k) => k !== "saidaV1"),
      ) +
      (s.lab.modo === "guiado"
        ? s.lab.guiadoRevealed && s.lab.guiadoTexto.trim()
          ? 1
          : 0
        : (s.lab.campos["saidaV1"] ?? "").trim()
          ? 1
          : 0)) /
    (labKeys.length + 1);
  const indTotal = 8;
  const ind =
    ((s.u7.marco.trim() && Number(s.u7.marco.replace(",", ".").replace("%", "")) === U7A.marco
      ? 1
      : 0) +
      (Number(s.u7.abril.replace(",", ".").replace("%", "")) === U7A.abril ? 1 : 0) +
      (Number(s.u7.pp.replace(",", ".").replace("%", "")) === U7A.diferencaPp ? 1 : 0) +
      (s.u7.maio === U7A.maio ? 1 : 0) +
      (livreDone(s.livres[U7A_PERGUNTAS.id], U7A_PERGUNTAS.pontos.length) ? 1 : 0) +
      (guiadoDone(s.u7b, U7B.erros.length, U7B.erros.length + U7B.distratores.length) ? 1 : 0) +
      (livreDone(s.livres[U7B_LIVRE.id], U7B_LIVRE.pontos.length) ? 1 : 0) +
      (Object.values(s.crivo.checks).filter(Boolean).length === 5 ? 1 : 0)) /
    indTotal;
  const piloto =
    (countFilled(
      s.piloto,
      PILOTO_CAMPOS.map((x) => x.id),
    ) +
      (METRICAS.filter((m) => s.metricas[m.id]).length >= 3 ? 1 : 0)) /
    (PILOTO_CAMPOS.length + 1);
  return {
    mapa: escala(mapa),
    prompts: Math.round(prompts),
    teste: escala(labFrac),
    indicadores: escala(ind),
    piloto: escala(piloto),
  };
}

export function notaGeral(s: RhState) {
  const c = componentes(s);
  return Math.round(COMPONENTES_NOTA.reduce((a, x) => a + (x.peso * (c[x.id] ?? 0)) / 100, 0));
}

export function criticosPendentes(s: RhState) {
  return RH_TAREFAS.filter((t) => {
    const p = s.prompts[t.id];
    return (
      !p ||
      ERROS_CRITICOS.some((_, i) => !p.seguro[i]) ||
      criticalFlags(`${compileRhPrompt(p.fields)}\n${p.entrega}`).length > 0
    );
  }).map((t) => t.codigo);
}

export function rhProgress(s: RhState | undefined) {
  const st = s ?? EMPTY_RH;
  const units = unitsDone(st);
  const doneUnits = units.filter(Boolean).length;
  const nota = notaGeral(st);
  const criticos = criticosPendentes(st);
  const ready =
    doneUnits === 8 && nota >= RH_MIN_NOTA && criticos.length === 0 && st.perfil.trim().length > 0;
  return {
    units,
    doneUnits,
    nota,
    criticos,
    ready,
    percent: st.done ? 100 : Math.round((doneUnits / 8) * 100),
    complete: st.done,
  };
}

/* ------------------------------------ quiz --------------------------------- */

export const rhQuizScore = (answers: Record<number, number>, order: number[][]) =>
  RH_QUIZ.filter((q, i) => order[i]![answers[i] ?? -1] === q.answer).length;

/** Ordem determinística das opções (muda a cada tentativa), preservando a chave correta. */
export function rhQuizOrder(seed: number): number[][] {
  let x = seed * 9301 + 49297;
  const rnd = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  return RH_QUIZ.map((q) => {
    const idx = q.options.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [idx[i], idx[j]] = [idx[j]!, idx[i]!];
    }
    return idx;
  });
}
export { RH_QUIZ_MIN };

/* --------------------------------- biblioteca ------------------------------- */

/** Atualiza (sem apagar) as entradas da trilha RH na biblioteca. Nunca marca como aprovado. */
export function syncRhLibrary(prompts: SavedPrompt[], s: RhState): SavedPrompt[] {
  const now = new Date().toISOString();
  let out = prompts;
  for (const t of RH_TAREFAS) {
    const p = s.prompts[t.id];
    if (!p || !p.submitted) continue;
    const id = `${RH_MODULE_ID}_${t.id}`;
    const nota = taskNota(p);
    const status = taskStatus(t.id, p);
    const entry: SavedPrompt = {
      id,
      title: `${t.codigo} — ${t.titulo} (RH · Módulo 1)`,
      area: "rh",
      category: "RH · Módulo 1",
      objective: p.fields["objetivo"] ?? t.entregaNome,
      text: compileRhPrompt(p.fields),
      version: Math.max(1, p.versions.length),
      createdAt: out.find((x) => x.id === id)?.createdAt ?? now,
      updatedAt: now,
      quality: nota !== undefined ? Math.round(nota / 10) : 0,
      result: p.entrega,
      notes: `Fonte: ${t.fonte}. Status: ${status}. ${RH_MODALIDADE}${nota !== undefined ? `. Nota: ${nota}` : ""}. Revisão humana prevista: ${p.pendencias.trim() || "a definir"}.`,
      status: status === "concluida" ? "em teste" : "rascunho",
    };
    out = out.some((x) => x.id === id)
      ? out.map((x) => (x.id === id ? entry : x))
      : [...out, entry];
  }
  return out;
}

/* ------------------------------ perfil e exportação ------------------------- */

export function buildRhPerfil(s: RhState): string {
  const oportunidades = [0, 1, 2].map((i) => (s.mapa[i]?.["tarefa"] ?? "").trim()).filter(Boolean);
  const prompts = RH_TAREFAS.map(
    (t) => `${t.codigo} ${t.titulo}: ${taskStatus(t.id, s.prompts[t.id])}`,
  );
  const lim = s.limites.map((l) => (l["decisao"] ?? "").trim()).filter(Boolean);
  return [
    "ATUALIZAÇÃO DO PERFIL DE USO DE IA — RH e Gestão de Pessoas (Módulo 1)",
    "(O perfil do Módulo Start é preservado; esta é uma atualização.)",
    "",
    `Oportunidades priorizadas: ${oportunidades.join(" | ") || "—"}`,
    `Prompts criados: ${prompts.join("; ")}`,
    `Teste realizado: ${s.lab.modo === "ferramenta" ? "Teste em ferramenta autorizada" : s.lab.modo === "guiado" ? "Comparação guiada" : "—"} — ${(s.lab.campos["tarefa"] ?? "").trim() || "—"}`,
    "Competências praticadas: distinguir rascunho de decisão; delimitar fonte e lacunas; sinalizar critérios inadequados; conferir taxas simples; registrar teste e revisão.",
    `Restrições (decisões não delegadas): ${lim.join(" | ") || "—"}`,
    `Próximo experimento: ${(s.piloto["tarefa"] ?? "").trim() || "—"} (responsável: ${(s.piloto["responsavel"] ?? "").trim() || "—"})`,
    "",
    "Este perfil descreve prática de aprendizagem. Não classifica aptidão profissional nem infere características pessoais.",
  ].join("\n");
}

export function rhExportData(s: RhState) {
  return {
    track_id: "rh_gestao_pessoas",
    module_id: RH_MODULE_ID,
    modulo: "Módulo 1 — IA na prática do RH: processos, pessoas e primeiras entregas",
    exportadoEm: new Date().toISOString(),
    aviso:
      "Dados e empresa fictícios. Armazenamento local do navegador; não sincronizado entre dispositivos. Nenhuma aprovação humana foi registrada pelo sistema.",
    feedback_mode: RH_MODALIDADE,
    nota_geral: notaGeral(s),
    mapa: [0, 1, 2].map((i) => s.mapa[i] ?? {}),
    limites: s.limites,
    briefing_faq: s.u3,
    tarefas: RH_TAREFAS.map((t) => {
      const p = s.prompts[t.id];
      return {
        task_id: t.id,
        source_id: t.fonte,
        source_version: t.fonte === "F2" || t.fonte === "F3" ? "versão didática 1" : "fictícia",
        status: taskStatus(t.id, p),
        score: taskNota(p) ?? null,
        prompt_text: p ? compileRhPrompt(p.fields) : "",
        prompt_version: p?.versions.length ?? 0,
        output_text: p?.entrega ?? "",
        review_notes: p?.pendencias ?? "",
        submitted_at: p?.versions[p.versions.length - 1]?.at ?? null,
        approved_at: null,
        versoes: p?.versions ?? [],
      };
    }),
    indicadores: { ...s.u7, crivo: s.crivo },
    laboratorio: s.lab,
    piloto: { ...s.piloto, metricas: Object.keys(s.metricas).filter((k) => s.metricas[k]) },
    perfil_atualizado: s.perfil,
    quiz: s.quiz,
  };
}

export function rhExportMarkdown(s: RhState) {
  const d = rhExportData(s);
  const L: string[] = [
    `# Kit Inicial de IA para RH — ${d.modulo}`,
    "",
    `_${d.aviso}_`,
    "",
    `Avaliação: ${d.feedback_mode}. Nota geral: ${d.nota_geral}.`,
    "",
    "## Mapa de oportunidades",
  ];
  d.mapa.forEach((m, i) =>
    L.push(
      "",
      `${i + 1}. **${m["tarefa"] ?? "—"}**`,
      `   - Fonte: ${m["fonte"] ?? "—"}`,
      `   - Saída: ${m["saida"] ?? "—"}`,
      `   - Risco: ${m["risco"] ?? "—"}`,
      `   - Aprovador: ${m["aprovador"] ?? "—"}`,
    ),
  );
  L.push("", "## Limites de delegação");
  d.limites.forEach((l, i) =>
    L.push(
      `${i + 1}. Não delegarei ${l["decisao"] ?? "—"}. A IA poderá apoiar ${l["parte"] ?? "—"}. A validação será de ${l["validacao"] ?? "—"}.`,
    ),
  );
  for (const t of d.tarefas) {
    const meta = RH_TAREFAS.find((x) => x.id === t.task_id)!;
    L.push(
      "",
      `## ${meta.codigo} — ${meta.titulo} (${t.source_id})`,
      `Status: ${t.status}${t.score !== null ? ` · Nota (autoavaliação): ${t.score}` : ""} · Versões: ${t.prompt_version}`,
      "",
      "### Prompt",
      "```text",
      t.prompt_text || "(vazio)",
      "```",
      "### Entrega revisada (rascunho)",
      "```text",
      t.output_text || "(vazio)",
      "```",
      `Pendências e aprovação: ${t.review_notes || "—"}`,
    );
  }
  L.push(
    "",
    "## Teste documentado",
    `Modalidade: ${s.lab.modo === "ferramenta" ? "Teste em ferramenta autorizada" : s.lab.modo === "guiado" ? "Comparação guiada" : "—"}`,
  );
  for (const [k, v] of Object.entries(s.lab.campos)) L.push(`- ${k}: ${v}`);
  L.push("", "## Plano de piloto");
  for (const [k, v] of Object.entries(s.piloto)) L.push(`- ${k}: ${v}`);
  L.push("", "## Perfil atualizado", "```text", s.perfil || "(não gerado)", "```");
  return L.join("\n");
}

export { RH_QUIZ, FONTES };

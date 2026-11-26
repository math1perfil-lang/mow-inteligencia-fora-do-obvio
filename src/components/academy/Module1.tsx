import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, Download, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AREA_BY_ID, type AreaId } from "@/lib/academy/areas";
import {
  CASOS,
  CASO_BY_ID,
  GLOSSARIO,
  LAB_DISTRATORES,
  M1_OPENING,
  M1_UNITS,
  QUIZ,
  QUIZ_MIN,
  RUBRICA,
  RUBRICA_ANCORAS,
  U1_COMPARACAO,
  U1_FEEDBACK,
  U1_ITENS,
  U1_OPCOES,
  U2_DEMO,
  U2_FEEDBACK_ERRO,
  U2_OPCOES,
  U2_TAREFA,
  U3_CASO,
  U4B,
  U4_CARTOES,
  U4_CATEGORIAS,
  U4_NOTA,
  U5_CAMPOS,
  U5_CHECKLIST,
  U5_PRIORIDADES,
  U6_MODELO,
  U7_CHECKLIST,
  U8_ENTREGA,
  U8_EXEMPLOS_LIMITE,
  UNITS,
  faixa,
  notaFinal,
} from "@/lib/academy/modulo1";
import {
  EMPTY_M1,
  M1_MODALIDADE,
  MIN_NOTA,
  PLACEHOLDER,
  PROMPT_FIELDS,
  compilePrompt,
  criticalFlags,
  feedbackDoPrompt,
  labDone,
  m1Progress,
  promptKey,
  promptNota,
  promptOk,
  quizOrder,
  quizScore,
  type M1Prompt,
  type M1State,
} from "@/lib/academy/modulo1-logic";
import { getSaveStatus, updateAcademy, useAcademy } from "@/lib/academy/store";
import { Bullets, Choice, CodeBlock, Panel } from "./ui";

const STEPS = [
  "Abertura",
  ...M1_UNITS.map((u, i) => `U${i + 1} · ${u}`),
  "Quiz final",
  "Conclusão",
];
const TERMOS: number[][] = [
  [0, 1, 14],
  [3, 4, 5],
  [6, 7, 15, 16],
  [8, 9, 10, 11, 12],
  [],
  [13, 17],
  [17],
  [],
];
const STATUS_LABEL: Record<string, string> = {
  "nao iniciado": "Não iniciado",
  rascunho: "Rascunho",
  enviado: "Enviado",
  "revisao solicitada": "Revisão solicitada",
  concluido: "Concluído",
};

const norm = (t: string) => t.toLowerCase().replace(/\s+/g, " ").trim();
const shuffled = <T,>(a: T[], seed: number) =>
  [...a]
    .map((v, i) => [v, Math.sin(seed * 997 + i * 131)] as const)
    .sort((x, y) => x[1] - y[1])
    .map((x) => x[0]);

function Field({
  id,
  label,
  value,
  onChange,
  rows = 2,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <textarea
        id={id}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full px-3 py-2 text-[15px] leading-relaxed"
      />
    </div>
  );
}

function Result({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <p role="status" className="text-sm leading-relaxed text-muted-foreground">
      <strong className={ok ? "text-[#5fd6a5]" : "text-[#ff9a9a]"}>
        {ok ? "✓ Correto. " : "✗ Ainda não. "}
      </strong>
      {children}
    </p>
  );
}

/* -------------------------------------------------------------------------- */

export function Module1() {
  const { state, ready } = useAcademy();
  const m = state.m1 ?? EMPTY_M1;
  const patch = (fn: (s: M1State) => M1State) =>
    updateAcademy((a) => ({ ...a, m1: fn(a.m1 ?? EMPTY_M1) }));
  const area: AreaId = m.areaOverride ?? state.profile?.area ?? state.start?.area ?? "gestao";
  const caso = CASO_BY_ID[area];
  const trilhaNome = AREA_BY_ID[area].name;
  const level = state.profile?.level ?? "iniciante";
  const prog = m1Progress(m, area);
  const step = Math.min(m.step, 10);
  const go = (n: number) => patch((s) => ({ ...s, step: n }));

  useEffect(() => {
    if (ready) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [step, ready]);

  if (!ready) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  const save = getSaveStatus();
  const saveMsg =
    save === "ok"
      ? "Progresso salvo neste navegador; não sincronizado entre dispositivos."
      : save === "fail"
        ? "Não foi possível gravar neste navegador. O progresso vale só enquanto esta página estiver aberta."
        : "Progresso será salvo neste navegador; não sincronizado entre dispositivos.";

  const unitBody = (u: number) => (
    <>
      <details open={level !== "avancado"} key={`d${u}`} className="ac-glass p-5">
        <summary className="cursor-pointer text-sm font-medium">
          Explicação da unidade {level === "avancado" ? "(recolhida: você já tem experiência)" : ""}
        </summary>
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
          {UNITS[u]!.paras.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </details>
      {TERMOS[u]!.length > 0 && (
        <details open={level === "iniciante"} className="ac-glass p-5">
          <summary className="cursor-pointer text-sm font-medium">Termos desta unidade</summary>
          <dl className="mt-3 space-y-2 text-sm text-muted-foreground">
            {TERMOS[u]!.map((i) => (
              <div key={GLOSSARIO[i]![0]}>
                <dt className="inline font-medium text-foreground">{GLOSSARIO[i]![0]}: </dt>
                <dd className="inline">{GLOSSARIO[i]![1]}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </>
  );

  const extra = (u: number) =>
    level !== "iniciante" ? (
      <details className="ac-glass p-5">
        <summary className="cursor-pointer text-sm font-medium">Desafio extra (opcional)</summary>
        <p className="mt-3 text-sm text-muted-foreground">{UNITS[u]!.extra}</p>
        <label htmlFor={`extra-${u}`} className="sr-only">
          Resposta do desafio extra
        </label>
        <textarea
          id={`extra-${u}`}
          rows={3}
          value={m.extras[u] ?? ""}
          onChange={(e) => patch((s) => ({ ...s, extras: { ...s.extras, [u]: e.target.value } }))}
          className="mt-3 w-full px-3 py-2 text-[15px]"
        />
      </details>
    ) : null;

  let body: React.ReactNode = null;

  /* ------------------------------- abertura ------------------------------ */
  if (step === 0) {
    body = (
      <Panel eyebrow="Módulo 1 · Fundamentos de IA Corporativa" title={M1_OPENING.title}>
        <div className="space-y-4 text-lg leading-relaxed">
          {M1_OPENING.paragraphs.map((p, i) => (
            <p key={p} className={i === 0 ? "" : "text-muted-foreground"}>
              {p}
            </p>
          ))}
        </div>
        <div className="ac-glass p-6">
          <p className="eyebrow text-muted-foreground">Sua trilha neste módulo</p>
          <p className="mt-2 text-xl font-medium">{trilhaNome}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Reaproveitamos o seu Perfil de Uso de IA do Módulo Start. Você não precisa refazer o
            diagnóstico. Todos os casos são fictícios.
          </p>
          <label htmlFor="m1-area" className="mt-4 block text-sm font-medium">
            Trocar de trilha (seus trabalhos anteriores são mantidos)
          </label>
          <select
            id="m1-area"
            value={area}
            onChange={(e) => patch((s) => ({ ...s, areaOverride: e.target.value as AreaId }))}
            className="mt-1.5 min-h-11 w-full px-3 text-[15px] sm:w-auto"
          >
            {CASOS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <h3 className="mb-3 text-lg font-medium">Objetivos observáveis</h3>
          <Bullets items={M1_OPENING.objetivos} />
          <p className="mt-4 text-sm text-muted-foreground">
            Duração estimada: 3 a 5 horas, incluindo leitura, experimentos e entregas (é uma
            estimativa, não um cronômetro). Este módulo não emite o certificado do curso. A apostila
            está sempre disponível.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => go(1)}>Começar fundamentos</Button>
          <Link
            to="/academy/apostila-modulo-1"
            className="inline-flex min-h-12 items-center border border-input px-6 text-sm"
          >
            Abrir a apostila
          </Link>
        </div>
      </Panel>
    );
  }

  /* --------------------------------- U1 ---------------------------------- */
  if (step === 1) {
    const allOk = U1_ITENS.every((it, i) => m.u1[i] === it.correta);
    body = (
      <Panel eyebrow="Unidade 1" title={M1_UNITS[0]}>
        {unitBody(0)}
        <div className="ac-glass overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Comparação entre busca, geração, cálculo e automação
            </caption>
            <tbody>
              {U1_COMPARACAO.map(([a, b]) => (
                <tr key={a} className="border-t border-border first:border-0">
                  <th scope="row" className="w-32 px-5 py-3 font-medium">
                    {a}
                  </th>
                  <td className="px-5 py-3 text-muted-foreground">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          Uma aplicação pode combinar essas funções. Elas não são equivalentes.
        </p>
        <h3 className="text-xl font-medium">Atividade: classifique a necessidade principal</h3>
        <div className="space-y-5">
          {U1_ITENS.map((it, i) => {
            const v = m.u1[i];
            return (
              <fieldset key={it.texto} className="ac-glass p-5">
                <legend className="px-1 text-base font-medium">
                  {String.fromCharCode(65 + i)}. {it.texto}
                </legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {U1_OPCOES.map((o, oi) => (
                    <Choice
                      key={o}
                      selected={v === oi}
                      correct={v === oi && oi === it.correta}
                      wrong={v === oi && oi !== it.correta}
                      onClick={() => patch((s) => ({ ...s, u1: { ...s.u1, [i]: oi } }))}
                    >
                      {o}
                    </Choice>
                  ))}
                </div>
                {v !== undefined && (
                  <div className="mt-3">
                    <Result ok={v === it.correta}>
                      {v === it.correta
                        ? U1_OPCOES[it.correta] + "."
                        : "Releia a comparação acima e tente outra opção."}
                    </Result>
                  </div>
                )}
              </fieldset>
            );
          })}
        </div>
        {allOk && <p className="ac-glass p-4 text-sm">{U1_FEEDBACK}</p>}
        {extra(0)}
      </Panel>
    );
  }

  /* --------------------------------- U2 ---------------------------------- */
  if (step === 2) {
    const exact = U2_OPCOES.filter((o) => o.ok).map((o) => o.id);
    const sel = m.u2;
    const verify = () =>
      patch((s) => ({
        ...s,
        u2ok: exact.length === s.u2.length && exact.every((id) => s.u2.includes(id)),
      }));
    body = (
      <Panel eyebrow="Unidade 2" title={M1_UNITS[1]}>
        {unitBody(1)}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="ac-glass p-5">
            <p className="eyebrow text-muted-foreground">Pedido vago</p>
            <p className="mt-2">{U2_DEMO.vago}</p>
          </div>
          <div className="ac-glass p-5">
            <p className="eyebrow text-[var(--ac-accent)]">Pedido específico</p>
            <p className="mt-2 text-sm leading-relaxed">{U2_DEMO.especifico}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{U2_DEMO.explicacao}</p>
        <h3 className="text-xl font-medium">Atividade: selecione o contexto necessário</h3>
        <p className="text-muted-foreground">Tarefa: {U2_TAREFA}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {U2_OPCOES.map((o) => (
            <Choice
              key={o.id}
              selected={sel.includes(o.id)}
              onClick={() =>
                patch((s) => ({
                  ...s,
                  u2ok: false,
                  u2: s.u2.includes(o.id) ? s.u2.filter((x) => x !== o.id) : [...s.u2, o.id],
                }))
              }
            >
              {o.id}) {o.texto}
            </Choice>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={verify} disabled={sel.length === 0}>
            Verificar seleção
          </Button>
          {m.u2ok && (
            <Result ok>
              Contexto relevante: A, B, D e F. CPF e histórico salarial não mudam a entrega.
            </Result>
          )}
        </div>
        {!m.u2ok && sel.length > 0 && m.u2.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Dica: depois de verificar, se não estiver correto, revise o que realmente muda a
            entrega.
          </p>
        )}
        {!m.u2ok && sel.length > 0 && (
          <p className="text-sm text-muted-foreground">{U2_FEEDBACK_ERRO}</p>
        )}
        {extra(1)}
      </Panel>
    );
  }

  /* --------------------------------- U3 ---------------------------------- */
  if (step === 3) {
    const OPT = [
      ...U3_CASO.afirmacoes.map((a) => ({ id: a.id, texto: a.texto, extrap: true, nota: a.nota })),
      { id: "faq", texto: "“Foi sugerida a criação de uma FAQ.”", extrap: false, nota: "" },
      {
        id: "prox",
        texto: "“A proposta será avaliada na próxima reunião.”",
        extrap: false,
        nota: "",
      },
    ];
    const opts = shuffled(OPT, 7);
    const verify = () =>
      patch((s) => ({
        ...s,
        u3ok:
          OPT.filter((o) => o.extrap).every((o) => s.u3.includes(o.id)) &&
          !s.u3.some((id) => !OPT.find((o) => o.id === id)!.extrap),
      }));
    body = (
      <Panel eyebrow="Unidade 3" title={M1_UNITS[2]}>
        {unitBody(2)}
        <h3 className="text-xl font-medium">Caso fictício: a ata convincente</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="ac-glass p-5">
            <p className="eyebrow text-muted-foreground">Fonte</p>
            <p className="mt-2 text-[15px] leading-relaxed">{U3_CASO.fonte}</p>
          </div>
          <div className="ac-glass p-5">
            <p className="eyebrow text-muted-foreground">Resposta inadequada</p>
            <p className="mt-2 text-[15px] leading-relaxed">{U3_CASO.inadequada}</p>
          </div>
        </div>
        <p className="font-medium">
          Marque as afirmações que são extrapolações (não estão na fonte).
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {opts.map((o) => (
            <Choice
              key={o.id}
              selected={m.u3.includes(o.id)}
              onClick={() =>
                patch((s) => ({
                  ...s,
                  u3ok: false,
                  u3: s.u3.includes(o.id) ? s.u3.filter((x) => x !== o.id) : [...s.u3, o.id],
                }))
              }
            >
              {o.texto}
            </Choice>
          ))}
        </div>
        <Button variant="outline" onClick={verify} disabled={m.u3.length === 0}>
          Verificar
        </Button>
        {m.u3ok ? (
          <div className="space-y-4">
            <Result ok>As quatro extrapolações foram encontradas.</Result>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {U3_CASO.afirmacoes.map((a) => (
                <li key={a.id}>
                  <strong className="text-foreground">{a.texto}</strong> {a.nota}
                </li>
              ))}
            </ul>
            <CodeBlock label="Resposta revisada" text={U3_CASO.revisada} />
            <p className="ac-glass p-4 text-sm">{U3_CASO.feedback}</p>
          </div>
        ) : (
          m.u3.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Ainda não. Compare cada frase com a fonte: o que ela realmente diz?
            </p>
          )
        )}
        {extra(2)}
      </Panel>
    );
  }

  /* --------------------------------- U4 ---------------------------------- */
  if (step === 4) {
    body = (
      <Panel eyebrow="Unidade 4" title={M1_UNITS[3]}>
        {unitBody(3)}
        <p className="ac-glass p-4 text-sm">{U4_NOTA}</p>
        <h3 className="text-xl font-medium">Atividade: classifique os cartões</h3>
        <div className="space-y-4">
          {U4_CARTOES.map((c, i) => {
            const v = m.u4[i];
            return (
              <div key={c.texto} className="ac-glass p-5">
                <label htmlFor={`u4-${i}`} className="font-medium">
                  {i + 1}. {c.texto}
                </label>
                <select
                  id={`u4-${i}`}
                  value={v ?? ""}
                  onChange={(e) =>
                    patch((s) => ({ ...s, u4: { ...s.u4, [i]: Number(e.target.value) } }))
                  }
                  className="mt-2 min-h-11 w-full px-3 text-[15px]"
                >
                  <option value="" disabled>
                    Escolha uma categoria…
                  </option>
                  {U4_CATEGORIAS.map((cat, ci) => (
                    <option key={cat} value={ci}>
                      {cat}
                    </option>
                  ))}
                </select>
                {v !== undefined && (
                  <div className="mt-2">
                    <Result ok={v === c.correta}>
                      {v === c.correta
                        ? U4_CATEGORIAS[c.correta] + "."
                        : "Releia as definições e tente outra categoria."}
                    </Result>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <h3 className="text-xl font-medium">Cenário de segurança</h3>
        <p className="ac-glass p-5 leading-relaxed">“{U4B.cenario}”</p>
        <Field
          id="u4b"
          label="O que você faria? Escreva sua resposta (mínimo 20 caracteres)"
          value={m.u4b}
          rows={4}
          onChange={(v) => patch((s) => ({ ...s, u4b: v }))}
        />
        <Button
          variant="outline"
          disabled={m.u4b.trim().length < 20}
          onClick={() => patch((s) => ({ ...s, u4bRev: true }))}
        >
          Comparar com a resposta esperada
        </Button>
        {m.u4bRev && (
          <div className="ac-glass space-y-3 p-5">
            <p className="eyebrow text-muted-foreground">
              Autoavaliação guiada — sem correção automática por IA
            </p>
            <p className="text-sm">Compare com sua resposta e veja se ela cobre estes pontos:</p>
            <Bullets items={U4B.esperado} />
            <p className="text-sm text-muted-foreground">{U4B.feedback}</p>
          </div>
        )}
        {extra(3)}
      </Panel>
    );
  }

  /* --------------------------------- U5 ---------------------------------- */
  if (step === 5) {
    body = (
      <Panel eyebrow="Unidade 5" title={M1_UNITS[4]}>
        {unitBody(4)}
        <div className="ac-glass p-5">
          <h3 className="mb-3 font-medium">Checklist de seleção</h3>
          <Bullets items={U5_CHECKLIST} />
        </div>
        <h3 className="text-xl font-medium">Atividade: matriz de oportunidades</h3>
        <p className="text-sm text-muted-foreground">
          Registre cinco tarefas reais ou simuladas. A priorização abaixo é pedagógica, não uma
          avaliação formal de risco. Não estime ganhos percentuais sem medição.
        </p>
        <Button
          variant="outline"
          onClick={() =>
            patch((s) => ({
              ...s,
              u5: Object.fromEntries(
                [0, 1, 2, 3, 4].map((r) => [
                  r,
                  { ...(s.u5[r] ?? {}), tarefa: s.u5[r]?.["tarefa"] || caso.tarefas[r]! },
                ]),
              ),
            }))
          }
        >
          Preencher com as tarefas da minha trilha
        </Button>
        <div className="space-y-5">
          {[0, 1, 2, 3, 4].map((r) => (
            <fieldset key={r} className="ac-glass space-y-3 p-5">
              <legend className="px-1 text-base font-medium">Oportunidade {r + 1}</legend>
              {U5_CAMPOS.map((c) => (
                <Field
                  key={c.id}
                  id={`u5-${r}-${c.id}`}
                  label={c.label}
                  rows={1}
                  value={m.u5[r]?.[c.id] ?? ""}
                  onChange={(v) =>
                    patch((s) => ({
                      ...s,
                      u5: { ...s.u5, [r]: { ...(s.u5[r] ?? {}), [c.id]: v } },
                    }))
                  }
                />
              ))}
              <div>
                <label htmlFor={`u5-${r}-prio`} className="text-sm font-medium">
                  Priorização pedagógica
                </label>
                <select
                  id={`u5-${r}-prio`}
                  value={m.u5prio[r] ?? ""}
                  onChange={(e) =>
                    patch((s) => ({ ...s, u5prio: { ...s.u5prio, [r]: Number(e.target.value) } }))
                  }
                  className="mt-1.5 min-h-11 w-full px-3 text-[15px]"
                >
                  <option value="" disabled>
                    Escolha…
                  </option>
                  {U5_PRIORIDADES.map((p, pi) => (
                    <option key={p} value={pi}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </fieldset>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Obrigatórios para concluir: tarefa, risco, decisão final humana e priorização.
        </p>
        {extra(4)}
      </Panel>
    );
  }

  /* --------------------------------- U6 ---------------------------------- */
  if (step === 6) {
    body = (
      <PromptBuilder area={area} m={m} patch={patch} intro={unitBody(5)} extraBlock={extra(5)} />
    );
  }

  /* --------------------------------- U7 ---------------------------------- */
  if (step === 7) {
    const l = m.lab;
    const setLab = (p: Partial<typeof l>) => patch((s) => ({ ...s, lab: { ...s.lab, ...p } }));
    const keys = caso.tarefas.map((_, i) => promptKey(area, i));
    const opcoes = shuffled(
      [
        ...caso.errosReais.map((t) => ({ t, ok: true })),
        ...LAB_DISTRATORES.map((t) => ({ t, ok: false })),
      ],
      11,
    );
    const acertos = opcoes.filter((o) => o.ok && l.problemas.includes(o.t)).length;
    const erros = opcoes.filter((o) => !o.ok && l.problemas.includes(o.t)).length;
    body = (
      <Panel eyebrow="Unidade 7" title={M1_UNITS[6]}>
        {unitBody(6)}
        <h3 className="text-xl font-medium">Laboratório</h3>
        <p className="text-sm text-muted-foreground">
          Caso fictício da trilha {trilhaNome}. Nunca cole dados reais, senhas ou chaves.
        </p>
        <div className="ac-glass p-5">
          <p className="eyebrow text-muted-foreground">Fonte fictícia</p>
          <p className="mt-2 text-[15px] leading-relaxed">{caso.caso}</p>
        </div>
        <div>
          <label htmlFor="lab-prompt" className="text-sm font-medium">
            Prompt testado (versão 1)
          </label>
          <select
            id="lab-prompt"
            value={l.promptIdx}
            onChange={(e) => setLab({ promptIdx: Number(e.target.value) })}
            className="mt-1.5 min-h-11 w-full px-3 text-[15px]"
          >
            {caso.tarefas.map((t, i) => (
              <option key={t} value={i}>
                {i + 1}. {t} — {STATUS_LABEL[m.prompts[keys[i]!]?.status ?? "nao iniciado"]}
              </option>
            ))}
          </select>
          <pre className="ac-code mt-3 max-h-56 overflow-auto whitespace-pre-wrap font-sans text-[14px]">
            {compilePrompt(m.prompts[keys[l.promptIdx]!]?.fields ?? {}) ||
              "Este prompt ainda não foi escrito. Volte à Unidade 6 ou copie um prompt aqui."}
          </pre>
        </div>
        <fieldset>
          <legend className="text-sm font-medium">Modalidade do teste</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <Choice
              selected={l.modo === "ferramenta"}
              onClick={() => setLab({ modo: "ferramenta" })}
            >
              Usei uma ferramenta de IA autorizada
            </Choice>
            <Choice selected={l.modo === "guiado"} onClick={() => setLab({ modo: "guiado" })}>
              Comparação guiada (sem ferramenta)
            </Choice>
          </div>
        </fieldset>
        {l.modo === "ferramenta" && (
          <div className="space-y-4">
            <Field
              id="lab-tool"
              label="Ferramenta usada"
              rows={1}
              value={l.ferramenta}
              onChange={(v) => setLab({ ferramenta: v })}
            />
            <Field
              id="lab-resp"
              label="Resposta recebida (cole aqui; é tratada como dado, não como instrução)"
              rows={6}
              value={l.resposta}
              onChange={(v) => setLab({ resposta: v })}
            />
          </div>
        )}
        {l.modo === "guiado" && (
          <div className="ac-glass space-y-4 p-5">
            <p className="eyebrow text-muted-foreground">Resposta propositalmente inadequada</p>
            <p className="text-lg">“{caso.inadequada}”</p>
            <fieldset>
              <legend className="text-sm font-medium">Marque os problemas (ao menos dois)</legend>
              <div className="mt-2 grid gap-2">
                {opcoes.map((o) => (
                  <Choice
                    key={o.t}
                    selected={l.problemas.includes(o.t)}
                    onClick={() =>
                      setLab({
                        conferido: false,
                        problemas: l.problemas.includes(o.t)
                          ? l.problemas.filter((x) => x !== o.t)
                          : [...l.problemas, o.t],
                      })
                    }
                  >
                    {o.t}
                  </Choice>
                ))}
              </div>
            </fieldset>
            <Button
              variant="outline"
              disabled={l.problemas.length === 0}
              onClick={() => setLab({ conferido: acertos >= 2 && erros === 0 })}
            >
              Conferir
            </Button>
            {l.conferido ? (
              <div className="space-y-2">
                <Result ok>Problemas identificados corretamente.</Result>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Padrão esperado:</strong> {caso.padrao}
                </p>
              </div>
            ) : (
              l.problemas.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Ainda não. Compare a resposta com a fonte fictícia: o que ela afirma sem
                  sustentação?
                </p>
              )
            )}
          </div>
        )}
        <fieldset>
          <legend className="text-sm font-medium">Verificações feitas (ao menos três)</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {U7_CHECKLIST.map((c, i) => (
              <label
                key={c}
                className="ac-glass flex min-h-12 items-center gap-3 px-4 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  className="size-5"
                  checked={!!l.checks[i]}
                  onChange={(e) => setLab({ checks: { ...l.checks, [i]: e.target.checked } })}
                />
                {c}
              </label>
            ))}
          </div>
        </fieldset>
        <Field
          id="lab-erro"
          label="Erro encontrado ou melhoria identificada"
          value={l.erro}
          onChange={(v) => setLab({ erro: v })}
        />
        <Field
          id="lab-v2"
          label="Prompt revisado (versão 2)"
          rows={5}
          value={l.v2}
          onChange={(v) => setLab({ v2: v })}
        />
        <Field
          id="lab-r2"
          label="Resposta da versão 2 (opcional)"
          rows={4}
          value={l.resposta2}
          onChange={(v) => setLab({ resposta2: v })}
        />
        <div>
          <label htmlFor="lab-dec" className="text-sm font-medium">
            Decisão final
          </label>
          <select
            id="lab-dec"
            value={l.decisao}
            onChange={(e) => setLab({ decisao: e.target.value })}
            className="mt-1.5 min-h-11 w-full px-3 text-[15px]"
          >
            <option value="">Escolha…</option>
            <option>Usar, após revisão humana</option>
            <option>Usar com ajustes</option>
            <option>Não usar ainda</option>
          </select>
        </div>
        <Field
          id="lab-obs"
          label="Observações (opcional). Registro de tempo é opcional e deve incluir revisão e correção."
          value={l.obs}
          onChange={(v) => setLab({ obs: v })}
        />
        <p className="text-sm text-muted-foreground">
          {labDone(l)
            ? "✓ Laboratório documentado."
            : "Complete os campos obrigatórios para concluir esta unidade."}
        </p>
        {extra(6)}
      </Panel>
    );
  }

  /* --------------------------------- U8 ---------------------------------- */
  if (step === 8) {
    const updatePerfil = () =>
      updateAcademy((a) => {
        const st = a.start;
        if (!st) return a;
        const done = CASO_BY_ID[area].tarefas.filter((_, i) =>
          promptOk(a.m1?.prompts[promptKey(area, i)]),
        ).length;
        const bloco = `\n\n--- ATUALIZAÇÃO · MÓDULO 1 (Fundamentos de IA Corporativa) ---\nOportunidades priorizadas: ${[
          0, 1, 2, 3, 4,
        ]
          .map((r) => a.m1?.u5[r]?.["tarefa"])
          .filter(Boolean)
          .join(
            "; ",
          )}\nPrompts criados: ${done} de 5 (${CASO_BY_ID[area].nome})\nTeste realizado: ${a.m1?.lab.modo === "guiado" ? "comparação guiada" : "ferramenta autorizada"}\nCompetências praticadas: distinguir operações de IA, selecionar contexto, validar respostas, classificar dados, construir prompts.\nRestrições: usar dados fictícios ou autorizados; manter revisão humana.\nPróximo experimento: ${a.m1?.next["tarefa"] ?? ""}`;
        const base = (st.perfil ?? "").split("\n\n--- ATUALIZAÇÃO · MÓDULO 1")[0]!;
        return {
          ...a,
          start: { ...st, perfil: base + bloco },
          m1: { ...(a.m1 ?? EMPTY_M1), perfilAtualizado: true },
        };
      });
    body = (
      <Panel eyebrow="Unidade 8" title={M1_UNITS[7]}>
        {unitBody(7)}
        <div className="ac-glass p-5">
          <h3 className="mb-3 font-medium">Entrega final do módulo</h3>
          <Bullets items={U8_ENTREGA} />
        </div>
        <h3 className="text-xl font-medium">Três limites de delegação</h3>
        <p className="text-sm text-muted-foreground">
          Modelo: “Não delegarei integralmente [decisão] porque [risco]. A IA poderá apoiar [parte
          limitada]. A aprovação caberá a [papel humano].” Exemplos: {U8_EXEMPLOS_LIMITE.join(" ")}{" "}
          Adapte à sua trilha, sem dados reais.
        </p>
        {[0, 1, 2].map((i) => (
          <fieldset key={i} className="ac-glass space-y-3 p-5">
            <legend className="px-1 font-medium">Limite {i + 1}</legend>
            {(
              [
                ["decisao", "Decisão que não será delegada integralmente"],
                ["risco", "Porque (risco)"],
                ["parte", "A IA poderá apoiar (parte limitada)"],
                ["aprovador", "A aprovação caberá a (papel humano)"],
              ] as const
            ).map(([k, label]) => (
              <Field
                key={k}
                id={`lim-${i}-${k}`}
                label={label}
                rows={1}
                value={m.limites[i]?.[k] ?? ""}
                onChange={(v) =>
                  patch((s) => ({
                    ...s,
                    limites: s.limites.map((x, xi) => (xi === i ? { ...x, [k]: v } : x)),
                  }))
                }
              />
            ))}
          </fieldset>
        ))}
        <h3 className="text-xl font-medium">Próximo experimento (baixo risco)</h3>
        <fieldset className="ac-glass space-y-3 p-5">
          <legend className="sr-only">Próximo experimento</legend>
          {(
            [
              ["tarefa", "Tarefa"],
              ["ferramenta", "Ferramenta autorizada ou pendente"],
              ["verificacao", "Verificação"],
              ["responsavel", "Responsável"],
            ] as const
          ).map(([k, label]) => (
            <Field
              key={k}
              id={`next-${k}`}
              label={label}
              rows={1}
              value={m.next[k] ?? ""}
              onChange={(v) => patch((s) => ({ ...s, next: { ...s.next, [k]: v } }))}
            />
          ))}
        </fieldset>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={updatePerfil} disabled={!state.start}>
            Atualizar meu Perfil de Uso de IA
          </Button>
          {m.perfilAtualizado && (
            <span className="inline-flex items-center gap-1.5 text-sm text-[var(--ac-accent)]">
              <Check className="size-4" /> Perfil atualizado (histórico do Módulo Start preservado)
            </span>
          )}
        </div>
        {extra(7)}
      </Panel>
    );
  }

  /* --------------------------------- quiz -------------------------------- */
  if (step === 9) body = <Quiz m={m} patch={patch} />;

  /* ------------------------------- conclusão ------------------------------ */
  if (step === 10) {
    const promptsOk = caso.tarefas.every((_, i) => promptOk(m.prompts[promptKey(area, i)]));
    const pend = (Object.values(m.prompts) as M1Prompt[]).some(
      (p) => criticalFlags(compilePrompt(p.fields)).length > 0,
    );
    const itens: [string, boolean][] = [
      ...M1_UNITS.map((u, i): [string, boolean] => [`Unidade ${i + 1} — ${u}`, prog.units[i]!]),
      [`Quiz final com ao menos ${QUIZ_MIN} de 10 acertos`, m.quiz.passed],
      ["Cinco prompts completos (nota mínima 70, autoavaliação guiada)", promptsOk],
      ["Teste ou comparação guiada documentado", labDone(m.lab)],
      [
        "Três limites de delegação definidos",
        m.limites.every((x) =>
          ["decisao", "risco", "parte", "aprovador"].every((k) => (x[k] ?? "").trim()),
        ),
      ],
      ["Sem pendências críticas de segurança", !pend],
    ];
    const ready = prog.ready && !pend;
    body = (
      <Panel eyebrow="Conclusão" title={m.done ? "Módulo 1 concluído." : "Checklist de conclusão"}>
        <ul className="space-y-2">
          {itens.map(([t, ok]) => (
            <li key={t} className="ac-glass flex min-h-12 items-center gap-3 px-4 py-3 text-[15px]">
              <span aria-hidden className={ok ? "text-[#5fd6a5]" : "text-muted-foreground"}>
                {ok ? "✓" : "○"}
              </span>
              <span>
                {t}
                <span className="sr-only">{ok ? " — feito" : " — pendente"}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Este checklist reflete o estado real das atividades; não há caixas para marcar à mão.
        </p>
        {m.done ? (
          <div className="space-y-4">
            <p className="ac-glass p-5">
              Você concluiu o Módulo 1. Seus prompts estão na Biblioteca e o Perfil de Uso de IA foi
              atualizado. Este módulo não emite o certificado do curso.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/academy/semana/$n"
                params={{ n: "2" }}
                className="inline-flex min-h-12 items-center bg-primary px-6 text-sm text-primary-foreground"
              >
                Ir para a Semana 2
              </Link>
              <Link
                to="/academy/biblioteca"
                className="inline-flex min-h-12 items-center border border-input px-6 text-sm"
              >
                Abrir a Biblioteca
              </Link>
            </div>
          </div>
        ) : (
          <Button
            disabled={!ready}
            onClick={() => patch((s) => ({ ...s, done: true, doneAt: new Date().toISOString() }))}
          >
            Concluir o Módulo 1
          </Button>
        )}
        {!ready && !m.done && (
          <p className="text-sm text-muted-foreground">
            Conclua os itens pendentes. A apostila e a revisão continuam acessíveis a qualquer
            momento.
          </p>
        )}
        <ExportButtons state={state} area={area} />
      </Panel>
    );
  }

  const pct = prog.percent;
  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Unidades do Módulo 1">
        <div className="ac-glass p-5">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow text-muted-foreground">Módulo 1</p>
            <span className="text-sm text-muted-foreground">{pct}%</span>
          </div>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso do Módulo 1"
          >
            <div className="ac-bar h-full rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <ol className="mt-4 hidden space-y-0.5 lg:block">
            {STEPS.map((label, i) => {
              const done =
                i >= 1 && i <= 8
                  ? prog.units[i - 1]
                  : i === 9
                    ? m.quiz.passed
                    : i === 10
                      ? m.done
                      : false;
              return (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={i === step ? "step" : undefined}
                    className={`ac-step ${i === step ? "is-current" : ""}`}
                  >
                    <span className="ac-step-n">{done ? <Check className="size-3" /> : i}</span>
                    <span className="flex-1 text-left">{label}</span>
                    <span className="sr-only">{done ? "concluída" : ""}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <label htmlFor="m1-jump" className="mt-4 block text-xs text-muted-foreground lg:hidden">
            Etapa {step + 1} de 11
          </label>
          <select
            id="m1-jump"
            value={step}
            onChange={(e) => go(Number(e.target.value))}
            className="mt-1 min-h-11 w-full px-3 text-sm lg:hidden"
          >
            {STEPS.map((l, i) => (
              <option key={l} value={i}>
                {l}
              </option>
            ))}
          </select>
          <Link
            to="/academy/apostila-modulo-1"
            className="mt-4 block text-sm text-[var(--ac-accent)] underline underline-offset-4"
          >
            Apostila de apoio
          </Link>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground" role="status">
            {saveMsg}
          </p>
        </div>
      </aside>
      <div className="min-w-0">
        {body}
        {step < 10 && (
          <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6">
            <Button variant="outline" disabled={step === 0} onClick={() => go(step - 1)}>
              <ChevronLeft className="mr-1 size-4" /> Voltar
            </Button>
            {step > 0 && (
              <Button onClick={() => go(step + 1)}>
                Continuar <ChevronRight className="ml-1 size-4" />
              </Button>
            )}
          </div>
        )}
        {step > 0 && step < 9 && !prog.units[step - 1] && (
          <p className="mt-3 text-xs text-muted-foreground">
            Você pode seguir sem concluir, mas a unidade só conta no progresso quando a atividade é
            feita.
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ construtor U6 ------------------------------ */

function PromptBuilder({
  area,
  m,
  patch,
  intro,
  extraBlock,
}: {
  area: AreaId;
  m: M1State;
  patch: (fn: (s: M1State) => M1State) => void;
  intro: React.ReactNode;
  extraBlock: React.ReactNode;
}) {
  const caso = CASO_BY_ID[area];
  const [idx, setIdx] = useState(0);
  const [msg, setMsg] = useState("");
  const [showEx, setShowEx] = useState(false);
  const key = promptKey(area, idx);
  const cur: M1Prompt = m.prompts[key] ?? {
    fields: {},
    status: "nao iniciado",
    versions: [],
    notas: {},
    helped: false,
    seguro: false,
    area,
  };
  const text = compilePrompt(cur.fields);
  const tentou = Object.values(cur.fields).some((v) => v.trim());
  const nota = promptNota(cur);
  const set = (fn: (p: M1Prompt) => M1Prompt) =>
    patch((s) => ({
      ...s,
      prompts: { ...s.prompts, [key]: fn(s.prompts[key] ?? cur) },
    }));
  useEffect(() => {
    setShowEx(false);
    setMsg("");
  }, [idx]);

  const withVersion = (p: M1Prompt, status: M1Prompt["status"]): M1Prompt => {
    const t = compilePrompt(p.fields);
    const last = p.versions[p.versions.length - 1];
    return {
      ...p,
      status,
      updatedAt: new Date().toISOString(),
      versions:
        last && last.text === t
          ? p.versions
          : [...p.versions, { at: new Date().toISOString(), text: t }],
    };
  };

  const submit = () => {
    const flags = criticalFlags(text);
    if (PLACEHOLDER.test(text))
      return setMsg(
        "Ainda há campos [entre colchetes]. Substitua pelo seu conteúdo; o prompt fica em rascunho.",
      );
    if (
      norm(text) === norm(compilePrompt({ acao: caso.resolvido })) ||
      norm(cur.fields["acao"] ?? "") === norm(caso.resolvido)
    )
      return setMsg(
        "Este texto é igual ao exemplo resolvido. Escreva o seu prompt com suas palavras.",
      );
    if (flags.length)
      return setMsg(
        `Pendência crítica de segurança: ${flags.join(" ")} Troque por dados fictícios e envie de novo.`,
      );
    if (!cur.seguro) return setMsg("Confirme que usou apenas dados fictícios ou autorizados.");
    if (nota === undefined)
      return setMsg("Faça a autoavaliação: dê uma nota de 0 a 4 em cada critério.");
    const status = nota >= MIN_NOTA ? "enviado" : "revisao solicitada";
    updateAcademy((a) => {
      const prev = a.m1 ?? EMPTY_M1;
      const p = withVersion(prev.prompts[key] ?? cur, status);
      const now = new Date().toISOString();
      const id = `m1-${area}-${idx}`;
      const rec = {
        id,
        title: p.fields["titulo"]?.trim() || caso.tarefas[idx]!,
        area,
        category: "Módulo 1",
        objective: p.fields["objetivo"] ?? caso.tarefas[idx]!,
        text: compilePrompt(p.fields),
        version: p.versions.length,
        createdAt: now,
        updatedAt: now,
        quality: Math.round((notaFinal(p.notas) ?? 0) / 10),
        result: "",
        notes: `${M1_MODALIDADE}. Nota ${notaFinal(p.notas)}.`,
        status: "em teste" as const,
      };
      const exists = a.prompts.some((x) => x.id === id);
      return {
        ...a,
        m1: { ...prev, prompts: { ...prev.prompts, [key]: p } },
        prompts: exists
          ? a.prompts.map((x) => (x.id === id ? { ...x, ...rec, createdAt: x.createdAt } : x))
          : [...a.prompts, rec],
      };
    });
    setMsg(
      status === "enviado"
        ? "Enviado. Veja o feedback abaixo."
        : "Revisão solicitada: a nota ficou abaixo de 70. Ajuste o prompt e envie de novo.",
    );
  };

  return (
    <Panel eyebrow="Unidade 6" title={M1_UNITS[5]}>
      {intro}
      <div className="ac-glass space-y-3 p-5">
        <p className="eyebrow text-muted-foreground">
          Modelo editável (PACTO como apoio, não como fórmula)
        </p>
        <pre className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed">{U6_MODELO}</pre>
      </div>
      <div className="ac-glass space-y-2 p-5">
        <p className="eyebrow text-[var(--ac-accent)]">Caso fictício · {caso.nome}</p>
        <p className="text-[15px] leading-relaxed">{caso.caso}</p>
        <p className="flex gap-2 text-xs text-muted-foreground">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> Todos os dados deste caso
          são fictícios. Não use clientes, currículos ou contratos reais.
        </p>
      </div>
      <div role="tablist" aria-label="Cinco tarefas da trilha" className="flex flex-wrap gap-2">
        {caso.tarefas.map((t, i) => {
          const p = m.prompts[promptKey(area, i)];
          return (
            <button
              key={t}
              role="tab"
              type="button"
              aria-selected={i === idx}
              onClick={() => setIdx(i)}
              className={`ac-choice ${i === idx ? "is-on" : ""}`}
            >
              {i + 1}. {t}
              <span className="ml-2 text-xs text-muted-foreground">
                {promptOk(p) ? "✓ " : ""}
                {STATUS_LABEL[p?.status ?? "nao iniciado"]}
              </span>
            </button>
          );
        })}
      </div>
      <div className="space-y-4">
        {PROMPT_FIELDS.map((f) => (
          <Field
            key={f.id}
            id={`pf-${f.id}`}
            label={f.label}
            hint={f.dica}
            rows={f.rows}
            value={cur.fields[f.id] ?? ""}
            onChange={(v) =>
              set((p) => ({
                ...p,
                status: p.status === "nao iniciado" ? "rascunho" : p.status,
                fields: { ...p.fields, [f.id]: v },
              }))
            }
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => {
            set((p) =>
              withVersion(
                p,
                p.status === "enviado" || p.status === "concluido" ? p.status : "rascunho",
              ),
            );
            setMsg("Versão salva neste navegador como rascunho.");
          }}
        >
          Salvar versão
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setShowEx((v) => !v);
            set((p) => ({ ...p, helped: true }));
          }}
          aria-expanded={showEx}
        >
          {showEx
            ? "Ocultar exemplo resolvido"
            : tentou
              ? "Ver exemplo resolvido"
              : "Pedir ajuda (ver exemplo)"}
        </Button>
      </div>
      {showEx && (
        <div className="space-y-2">
          <CodeBlock label="Exemplo resolvido — apenas referência" text={caso.resolvido} />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Padrão esperado:</strong> {caso.padrao} Consultar o
            exemplo não penaliza, mas copiar o texto não conta como criação sua.
          </p>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Verificação humana:</strong> {caso.verificacao}
          </p>
        </div>
      )}
      {cur.versions.length > 0 && (
        <details className="ac-glass p-5">
          <summary className="cursor-pointer text-sm font-medium">
            Histórico de versões ({cur.versions.length})
          </summary>
          <ol className="mt-3 space-y-3">
            {cur.versions.map((v, i) => (
              <li key={v.at}>
                <p className="eyebrow text-muted-foreground">
                  v{i + 1} · {new Date(v.at).toLocaleString("pt-BR")}
                </p>
                <pre className="mt-1 whitespace-pre-wrap font-sans text-[13px] text-muted-foreground">
                  {v.text}
                </pre>
              </li>
            ))}
          </ol>
        </details>
      )}
      <fieldset className="ac-glass space-y-4 p-5">
        <legend className="px-1 font-medium">Avaliação do prompt</legend>
        <p className="eyebrow text-muted-foreground">{M1_MODALIDADE}</p>
        <p className="text-sm text-muted-foreground">
          Dê uma nota de 0 a 4 em cada critério. Âncoras:{" "}
          {RUBRICA_ANCORAS.map((a, i) => `${i} ${a}`).join(" · ")}. A nota final (0 a 100) soma peso
          × nota ÷ 4. Não há correção automática por IA.
        </p>
        {RUBRICA.map((r) => (
          <div key={r.id}>
            <label htmlFor={`rb-${r.id}`} className="text-sm font-medium">
              {r.label} <span className="text-xs text-muted-foreground">· peso {r.peso}%</span>
            </label>
            <p className="text-xs text-muted-foreground">Confira {r.cheque}.</p>
            <select
              id={`rb-${r.id}`}
              value={cur.notas[r.id] ?? ""}
              onChange={(e) =>
                set((p) => ({ ...p, notas: { ...p.notas, [r.id]: Number(e.target.value) } }))
              }
              className="mt-1.5 min-h-11 w-full px-3 text-[15px] sm:w-72"
            >
              <option value="" disabled>
                Escolha…
              </option>
              {RUBRICA_ANCORAS.map((a, i) => (
                <option key={a} value={i}>
                  {i} — {a}
                </option>
              ))}
            </select>
          </div>
        ))}
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-5"
            checked={cur.seguro}
            onChange={(e) => set((p) => ({ ...p, seguro: e.target.checked }))}
          />
          Usei apenas dados fictícios ou autorizados; não há senha, chave de API nem dado pessoal
          real.
        </label>
        <Button onClick={submit} disabled={!tentou}>
          Enviar para feedback
        </Button>
        {msg && (
          <p role="status" className="text-sm leading-relaxed">
            {msg}
          </p>
        )}
      </fieldset>
      {(cur.status === "enviado" ||
        cur.status === "revisao solicitada" ||
        cur.status === "concluido") &&
        nota !== undefined && (
          <div className="ac-glass space-y-3 p-6" aria-live="polite">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-2xl font-light">{faixa(nota)}</h3>
              <span className="text-4xl font-light text-[var(--ac-accent)]">{nota}/100</span>
            </div>
            <p className="eyebrow text-muted-foreground">{M1_MODALIDADE}</p>
            <p className="leading-relaxed">{feedbackDoPrompt(cur, caso.verificacao)}</p>
            <p className="text-xs text-muted-foreground">
              Nota de prompt não garante a qualidade de toda resposta futura: confirme no
              laboratório (Unidade 7).
            </p>
          </div>
        )}
      {extraBlock}
    </Panel>
  );
}

/* ---------------------------------- quiz ---------------------------------- */

function Quiz({ m, patch }: { m: M1State; patch: (fn: (s: M1State) => M1State) => void }) {
  const attempts = m.quiz.attempts.length;
  const order = useMemo(() => quizOrder(attempts + 1), [attempts]);
  const [q, setQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);
  const [review, setReview] = useState(false);
  const last = m.quiz.attempts[m.quiz.attempts.length - 1];

  const finish = () => {
    const score = quizScore(answers, order);
    patch((s) => ({
      ...s,
      quiz: {
        attempts: [...s.quiz.attempts, { score, at: new Date().toISOString() }],
        passed: s.quiz.passed || score >= QUIZ_MIN,
      },
    }));
    setFinished(true);
  };
  const retry = () => {
    setQ(0);
    setAnswers({});
    setFinished(false);
    setReview(false);
  };

  if (finished && last) {
    return (
      <Panel eyebrow="Quiz final" title={`${last.score} de 10 acertos`}>
        <p className="leading-relaxed">
          {last.score >= QUIZ_MIN
            ? "Aprovado: você atingiu o mínimo de 8 acertos."
            : "Ainda não chegou a 8 acertos. Revise as explicações e tente de novo, sem punição."}
        </p>
        <p className="text-sm text-muted-foreground">
          Tentativas ficam registradas só para o seu feedback, sem ranking. Tentativa {attempts}.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setReview((v) => !v)}>
            {review ? "Ocultar justificativas" : "Ver justificativas"}
          </Button>
          <Button variant="outline" onClick={retry}>
            Nova tentativa
          </Button>
        </div>
        {review && (
          <ol className="space-y-4">
            {QUIZ.map((qq, i) => {
              const picked = answers[i];
              const ok = picked !== undefined && order[i]![picked] === qq.answer;
              return (
                <li key={qq.q} className="ac-glass p-5">
                  <p className="font-medium">
                    {i + 1}. {qq.q}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <strong className={ok ? "text-[#5fd6a5]" : "text-[#ff9a9a]"}>
                      {ok ? "✓ Acertou. " : "✗ Errou. "}
                    </strong>
                    Correta: {qq.options[qq.answer]} {qq.why}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>
    );
  }

  const cur = QUIZ[q]!;
  const picked = answers[q];
  return (
    <Panel eyebrow={`Quiz final · pergunta ${q + 1} de 10`} title={cur.q}>
      {m.quiz.passed && (
        <p className="text-sm text-[var(--ac-accent)]">
          Você já foi aprovado. Pode refazer para revisar.
        </p>
      )}
      <div role="radiogroup" aria-label={cur.q} className="grid gap-2">
        {order[q]!.map((optIdx, pos) => (
          <Choice
            key={`${q}-${pos}`}
            selected={picked === pos}
            onClick={() => setAnswers((a) => ({ ...a, [q]: pos }))}
          >
            {String.fromCharCode(65 + pos)}) {cur.options[optIdx]}
          </Choice>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" disabled={q === 0} onClick={() => setQ(q - 1)}>
          Anterior
        </Button>
        {q < 9 ? (
          <Button disabled={picked === undefined} onClick={() => setQ(q + 1)}>
            Próxima
          </Button>
        ) : (
          <Button disabled={Object.keys(answers).length < 10} onClick={finish}>
            Finalizar quiz
          </Button>
        )}
      </div>
    </Panel>
  );
}

/* --------------------------------- exportar -------------------------------- */

import type { AcademyState } from "@/lib/academy/store";

function exportData(state: AcademyState, area: AreaId) {
  const m = state.m1 ?? EMPTY_M1;
  const caso = CASO_BY_ID[area];
  const prompts = caso.tarefas.map((t, i) => {
    const p = m.prompts[promptKey(area, i)];
    return {
      tarefa: t,
      trilha: caso.nome,
      status: p?.status ?? "nao iniciado",
      modalidadeAvaliacao: M1_MODALIDADE,
      nota: p ? (promptNota(p) ?? null) : null,
      versoes: p?.versions ?? [],
      campos: p?.fields ?? {},
    };
  });
  return {
    modulo: "Módulo 1 — Fundamentos de IA Corporativa",
    exportadoEm: new Date().toISOString(),
    aviso: "Dados fictícios ou autorizados. Armazenamento local do navegador; não sincronizado.",
    matriz: [0, 1, 2, 3, 4].map((r) => ({ ...(m.u5[r] ?? {}), prioridade: m.u5prio[r] })),
    prompts,
    laboratorio: m.lab,
    limites: m.limites,
    proximoExperimento: m.next,
    quiz: m.quiz,
  };
}

function toMarkdown(d: ReturnType<typeof exportData>) {
  const L: string[] = [`# ${d.modulo}`, "", `_${d.aviso}_`, "", "## Prompts"];
  for (const p of d.prompts) {
    L.push(
      "",
      `### ${p.tarefa} (${p.trilha})`,
      `Status: ${p.status} · Avaliação: ${p.modalidadeAvaliacao}${p.nota !== null ? ` · Nota: ${p.nota}` : ""}`,
    );
    const last = p.versoes[p.versoes.length - 1];
    L.push("", "```text", last?.text ?? "(vazio)", "```");
  }
  L.push(
    "",
    "## Laboratório",
    "",
    `Modalidade: ${d.laboratorio.modo || "—"}`,
    `Erro ou melhoria: ${d.laboratorio.erro || "—"}`,
    `Decisão: ${d.laboratorio.decisao || "—"}`,
  );
  L.push("", "## Limites de delegação");
  d.limites.forEach((l, i) =>
    L.push(
      `${i + 1}. Não delegarei integralmente ${l["decisao"] ?? "—"} porque ${l["risco"] ?? "—"}. A IA poderá apoiar ${l["parte"] ?? "—"}. A aprovação caberá a ${l["aprovador"] ?? "—"}.`,
    ),
  );
  L.push("", "## Próximo experimento");
  for (const [k, v] of Object.entries(d.proximoExperimento)) L.push(`- ${k}: ${v}`);
  return L.join("\n");
}

function download(name: string, mime: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function ExportButtons({ state, area }: { state: AcademyState; area: AreaId }) {
  return (
    <div className="ac-glass flex flex-wrap items-center gap-3 p-5">
      <p className="mr-auto text-sm text-muted-foreground">
        Exporte seus trabalhos (guardados só neste navegador).
      </p>
      <Button
        variant="outline"
        onClick={() =>
          download(
            "modulo-1-entregas.json",
            "application/json",
            JSON.stringify(exportData(state, area), null, 2),
          )
        }
      >
        <Download className="mr-2 size-4" /> JSON
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          download("modulo-1-entregas.md", "text/markdown", toMarkdown(exportData(state, area)))
        }
      >
        <Download className="mr-2 size-4" /> Markdown
      </Button>
    </div>
  );
}

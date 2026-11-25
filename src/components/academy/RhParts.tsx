import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bullets, Choice, CodeBlock, Field, Panel, Result, Selo } from "./ui";
import {
  ERROS_CRITICOS,
  ERROS_CRITICOS_DEF,
  FAIXAS,
  FEEDBACK_FORMATO,
  FONTE_BY_ID,
  MSG,
  RH_AVISO_FICCAO,
  RH_QUIZ,
  RH_QUIZ_FEEDBACK_FINAL,
  RH_QUIZ_MIN,
  RUBRICA,
  RUBRICA_ANCORAS,
  TEMPLATE_CAMPOS,
  TEMPLATE_TEXTO,
  faixaRh,
  fonteTexto,
  notaRubrica,
  type Fonte,
  type Livre as LivreDef,
  type NivelPratica,
  type RhTarefa,
} from "@/lib/academy/rh1";
import {
  EMPTY_PROMPT_RH,
  bloqueios,
  compileRhPrompt,
  rhQuizOrder,
  rhQuizScore,
  taskNota,
  taskStatus,
  type Livre,
  type RhPrompt,
  type RhState,
} from "@/lib/academy/rh1-logic";

export type PatchRh = (fn: (s: RhState) => RhState) => void;

/* ------------------------------- fonte do caso ------------------------------ */

export function FonteCard({ id, open }: { id: Fonte["id"]; open?: boolean }) {
  const f = FONTE_BY_ID[id];
  return (
    <details open={open} className="ac-glass p-5">
      <summary className="cursor-pointer text-sm font-medium">
        Fonte {f.id} — {f.titulo}
      </summary>
      <div className="mt-3 space-y-2">
        <Selo>{RH_AVISO_FICCAO}</Selo>
        <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
          {f.linhas.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}

/* ----------------------- resposta livre + conferência ----------------------- */

const EMPTY_LIVRE: Livre = { texto: "", revealed: false, marks: {} };

/**
 * Resposta livre sem correção automática: o aluno escreve, abre a resposta de referência e
 * confere por conta própria cada ponto esperado (autoavaliação guiada).
 */
export function LivreBox({
  def,
  state,
  patch,
  noTextarea,
  ready,
}: {
  def: LivreDef;
  state: Livre | undefined;
  patch: PatchRh;
  noTextarea?: boolean;
  ready?: boolean;
}) {
  const st = state ?? EMPTY_LIVRE;
  const set = (fn: (l: Livre) => Livre) =>
    patch((s) => ({
      ...s,
      livres: { ...s.livres, [def.id]: fn(s.livres[def.id] ?? EMPTY_LIVRE) },
    }));
  const attempted = noTextarea ? !!ready : st.texto.trim().length >= 15;
  const marked = Object.values(st.marks).filter(Boolean).length;
  return (
    <div className="ac-glass space-y-4 p-5">
      <p className="text-base font-medium">{def.pergunta}</p>
      <Selo>{RH_AVISO_FICCAO}</Selo>
      {!noTextarea && (
        <Field
          id={`livre-${def.id}`}
          label="Sua resposta"
          value={st.texto}
          rows={4}
          onChange={(v) => set((l) => ({ ...l, texto: v }))}
          hint="Escreva com suas palavras (mínimo de 15 caracteres). Formulações equivalentes valem."
        />
      )}
      {!st.revealed ? (
        <Button
          variant="outline"
          disabled={!attempted}
          onClick={() => set((l) => ({ ...l, revealed: true }))}
        >
          Conferir com a resposta de referência
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="ac-code">
            <p className="eyebrow text-muted-foreground">Resposta de referência</p>
            <p className="mt-2 text-[14.5px] leading-relaxed">{def.ref}</p>
          </div>
          <fieldset>
            <legend className="text-sm font-medium">
              Autoavaliação guiada: minha resposta incluiu…
            </legend>
            <div className="mt-2 grid gap-2">
              {def.pontos.map((p, i) => (
                <label key={p} className="ac-choice flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!!st.marks[i]}
                    onChange={(e) =>
                      set((l) => ({ ...l, marks: { ...l.marks, [i]: e.target.checked } }))
                    }
                    className="size-5"
                  />
                  <span>{p}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p role="status" className="text-sm text-muted-foreground">
            {marked >= Math.max(1, def.pontos.length - 1)
              ? "Conferência registrada. Se faltou algum ponto, revise sua resposta se quiser."
              : "Marque os pontos que sua resposta realmente cobriu. Se faltou algo, ajuste o texto acima e confira de novo."}
          </p>
          <p className="text-xs text-muted-foreground">{MSG.semIa}</p>
        </div>
      )}
    </div>
  );
}

/* --------------------- comparação guiada (marcar os erros) ------------------- */

export function GuiadoErros({
  titulo,
  inadequada,
  erros,
  distratores,
  nota,
  value,
  onChange,
}: {
  titulo: string;
  inadequada: string;
  erros: string[];
  distratores: string[];
  nota: string;
  value: { picks: Record<number, boolean>; checked: boolean } | undefined;
  onChange: (v: { picks: Record<number, boolean>; checked: boolean }) => void;
}) {
  const v = value ?? { picks: {}, checked: false };
  // Ordem de exibição fixa e misturada (alternativa acessível a arrastar: caixas de seleção).
  const list = useMemo(() => {
    const e = erros.map((t, id) => ({ t, id }));
    const d = distratores.map((t, i) => ({ t, id: erros.length + i }));
    const out: { t: string; id: number }[] = [];
    for (let i = 0; i < Math.max(e.length, d.length); i++) {
      if (e[i]) out.push(e[i]!);
      if (d[i]) out.push(d[i]!);
    }
    return out;
  }, [erros, distratores]);
  const picked = Object.entries(v.picks)
    .filter(([, x]) => x)
    .map(([k]) => Number(k));
  const ok = picked.length === erros.length && picked.every((k) => k < erros.length);
  return (
    <div className="ac-glass space-y-4 p-5">
      <p className="text-base font-medium">{titulo}</p>
      <Selo>{RH_AVISO_FICCAO}</Selo>
      <blockquote className="ac-code text-[14.5px] leading-relaxed">“{inadequada}”</blockquote>
      <fieldset>
        <legend className="text-sm font-medium">
          Quais problemas existem nesta resposta? (marque todos)
        </legend>
        <div className="mt-2 grid gap-2">
          {list.map((it) => (
            <label key={it.id} className="ac-choice flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={!!v.picks[it.id]}
                onChange={(e) =>
                  onChange({ picks: { ...v.picks, [it.id]: e.target.checked }, checked: false })
                }
                className="size-5"
              />
              <span>{it.t}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Button
        variant="outline"
        disabled={picked.length === 0}
        onClick={() => onChange({ ...v, checked: true })}
      >
        Conferir
      </Button>
      {v.checked && (
        <div className="space-y-2">
          <Result ok={ok}>
            {ok
              ? "Você encontrou exatamente os problemas reais."
              : "A seleção ainda não coincide com os problemas reais: faltou algum ou há um item marcado que não é erro. Releia a resposta e a fonte e tente de novo."}
          </Result>
          {ok && (
            <>
              <Bullets items={erros} />
              <p className="text-sm text-muted-foreground">{nota}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* --------------------------- laboratório de uma tarefa ----------------------- */

const CRITERIO_CAMPO: Record<string, string> = {
  adequacao: "objetivo",
  fidelidade: "fonte",
  privacidade: "limites",
  estrutura: "formato",
  evidencias: "verificacao",
};
const CONFERIR: Record<RhTarefa["id"], string> = {
  p1: "se condições, requisitos e canal foram aprovados e se nenhum critério pessoal foi para o anúncio",
  p2: "se RH, gestor e TI estão nos papéis corretos e se as pendências foram marcadas",
  p3: "se cada resposta está de fato na F3 e se o que não está foi encaminhado à Central de Pessoas",
  p4: "se há só fatos observáveis, sem rótulo, diagnóstico, nota ou sanção",
};
const trecho = (t: string) => {
  const s = t.trim().replace(/\s+/g, " ");
  return s.length > 90 ? `${s.slice(0, 87)}…` : s;
};

export function feedbackRh(p: RhPrompt, taskId: RhTarefa["id"]) {
  const notas = RUBRICA.map((r) => ({ r, n: p.notas[r.id] ?? 0 }));
  const melhor = [...notas].sort((a, b) => b.n - a.n)[0]!;
  const pior = [...notas].sort((a, b) => a.n - b.n).find((x) => x.r.id !== melhor.r.id) ?? melhor;
  const bom = trecho(p.fields[CRITERIO_CAMPO[melhor.r.id]!] ?? "");
  return [
    bom
      ? `Você definiu bem o critério “${melhor.r.label}”: “${bom}”.`
      : `Seu ponto mais forte é “${melhor.r.label}”.`,
    pior.n >= 4
      ? "Todos os critérios estão consistentes; mantenha o cuidado com lacunas."
      : `Para melhorar “${pior.r.label}”, ajuste a instrução: ${pior.r.dica}. Isso importa em RH porque um erro pode afetar uma pessoa.`,
    `Antes de usar, confira ${CONFERIR[taskId]}.`,
    pior.n >= 4
      ? "Próxima tentativa: teste uma pergunta que a fonte não cobre."
      : `Próxima tentativa: pergunte-se “${pior.r.cheque}”.`,
  ].join(" ");
}

const STATUS_LABEL: Record<string, string> = {
  "nao iniciada": "Não iniciada",
  rascunho: "Rascunho",
  enviada: "Enviada",
  "revisao necessaria": "Revisão necessária",
  concluida: "Concluída",
};

export function TaskLab({
  task,
  state,
  patch,
  nivel,
}: {
  task: RhTarefa;
  state: RhPrompt | undefined;
  patch: PatchRh;
  nivel: NivelPratica;
}) {
  const p = state ?? EMPTY_PROMPT_RH;
  const [dicas, setDicas] = useState(false);
  const setP = (fn: (x: RhPrompt) => RhPrompt) =>
    patch((s) => ({
      ...s,
      prompts: {
        ...s.prompts,
        [task.id]: {
          ...fn(s.prompts[task.id] ?? EMPTY_PROMPT_RH),
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  const setField = (id: string, v: string) =>
    setP((x) => ({ ...x, submitted: false, fields: { ...x.fields, [id]: v } }));
  const showDica = nivel === "guiado" || dicas;
  const attempt = Object.values(p.fields).join("").trim().length >= 30;
  const canReveal = p.helped || attempt;
  const status = taskStatus(task.id, p);
  const bl = bloqueios(task.id, p);
  const nota = taskNota(p);
  const saveVersion = () =>
    setP((x) => ({
      ...x,
      versions: [
        ...x.versions,
        { at: new Date().toISOString(), fields: { ...x.fields }, entrega: x.entrega },
      ],
    }));
  const submit = () =>
    setP((x) => {
      const last = x.versions[x.versions.length - 1];
      const same =
        last &&
        JSON.stringify(last.fields) === JSON.stringify(x.fields) &&
        last.entrega === x.entrega;
      return {
        ...x,
        submitted: true,
        versions: same
          ? x.versions
          : [
              ...x.versions,
              { at: new Date().toISOString(), fields: { ...x.fields }, entrega: x.entrega },
            ],
      };
    });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-xl font-medium">
          {task.codigo} — {task.titulo}
        </h3>
        <Selo>{RH_AVISO_FICCAO}</Selo>
        <span
          className="rounded-full border border-white/20 px-3 py-1 text-xs"
          aria-label={`Estado da tarefa: ${STATUS_LABEL[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Missão: {task.missao} Fonte: {task.fonte}. Não envie dados reais: a prática usa só o caso
        fictício.
      </p>

      <div className="ac-glass space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">Seu prompt (modelo do CICLO RH)</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setP((x) => ({
                ...x,
                submitted: false,
                fields: Object.fromEntries(
                  TEMPLATE_CAMPOS.map((c) => [
                    c.id,
                    x.fields[c.id]?.trim()
                      ? x.fields[c.id]!
                      : `[${c.label.replace(" (opcional)", "").toLowerCase()}]`,
                  ]),
                ),
              }))
            }
          >
            Inserir campos do modelo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setField("dados", fonteTexto(task.fonte))}
          >
            Inserir a fonte {task.fonte} em “Dados”
          </Button>
          {nivel === "assistido" && (
            <Button variant="outline" size="sm" onClick={() => setDicas((d) => !d)}>
              {dicas ? "Ocultar dicas" : "Pedir dicas"}
            </Button>
          )}
        </div>
        {nivel === "desafio" && (
          <p className="text-xs text-muted-foreground">
            Nível desafio: você tem o problema e os critérios, sem solução inicial. O padrão de
            segurança é o mesmo.
          </p>
        )}
        {TEMPLATE_CAMPOS.map((c) => (
          <Field
            key={c.id}
            id={`rh-${task.id}-${c.id}`}
            label={c.label}
            rows={c.rows}
            value={p.fields[c.id] ?? ""}
            onChange={(v) => setField(c.id, v)}
            hint={showDica ? c.dica : undefined}
          />
        ))}
        <p className="text-xs text-muted-foreground">{MSG.dadoReal}</p>
      </div>

      <div className="ac-glass space-y-3 p-5">
        <p className="text-sm font-medium">Prompt resolvido de referência</p>
        {canReveal ? (
          <CodeBlock
            label={`${task.codigo} — referência (não conta como criação sua)`}
            text={task.promptResolvido}
          />
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              A referência aparece depois da sua primeira tentativa ou se você pedir ajuda.
              Consultar não penaliza.
            </p>
            {nivel !== "desafio" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setP((x) => ({ ...x, helped: true }))}
              >
                Pedir ajuda
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="ac-glass space-y-4 p-5">
        <p className="text-sm font-medium">{task.entregaNome}</p>
        <Field
          id={`rh-${task.id}-entrega`}
          label="Entrega revisada (rascunho)"
          rows={8}
          value={p.entrega}
          onChange={(v) => setP((x) => ({ ...x, submitted: false, entrega: v }))}
          hint="Execute o prompt em uma ferramenta autorizada, ou escreva a entrega você mesmo(a) a partir da fonte, e cole aqui já revisada. Nada é enviado ou publicado."
        />
        <Field
          id={`rh-${task.id}-pend`}
          label={
            task.id === "p1"
              ? "Pendências sinalizadas (pelo menos 2, uma por linha)"
              : "Pendências e itens que exigem aprovação humana (uma por linha)"
          }
          rows={3}
          value={p.pendencias}
          onChange={(v) => setP((x) => ({ ...x, submitted: false, pendencias: v }))}
          hint={MSG.fonteInsuficiente}
        />
        {task.notaModelo && canReveal && (
          <details className="text-sm text-muted-foreground">
            <summary className="cursor-pointer">Entrega-modelo de referência</summary>
            <div className="mt-2">
              <CodeBlock label="Entrega-modelo" text={task.entregaModelo} />
              <p className="mt-2">{task.notaModelo}</p>
            </div>
          </details>
        )}
      </div>

      <SelfEval task={task} p={p} setP={setP} />

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={saveVersion} disabled={!attempt && !p.entrega.trim()}>
          Salvar nova versão
        </Button>
        <Button onClick={submit} disabled={!attempt || !p.entrega.trim()}>
          Enviar para conferência
        </Button>
      </div>
      {p.versions.length > 0 && (
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer">Versões guardadas ({p.versions.length})</summary>
          <ol className="mt-2 space-y-2">
            {p.versions.map((v, i) => (
              <li key={v.at + i} className="flex flex-wrap items-center gap-3">
                <span>
                  Versão {i + 1} — {new Date(v.at).toLocaleString("pt-BR")}
                </span>
                <button
                  type="button"
                  className="min-h-9 rounded-full border border-white/20 px-3 text-xs"
                  onClick={() =>
                    setP((x) => ({
                      ...x,
                      submitted: false,
                      fields: { ...v.fields },
                      entrega: v.entrega,
                    }))
                  }
                >
                  Restaurar para editar (as versões continuam guardadas)
                </button>
              </li>
            ))}
          </ol>
        </details>
      )}
      {p.submitted && (
        <div className="ac-glass space-y-3 p-5" role="status">
          <p className="font-medium">
            Estado: {STATUS_LABEL[status]}
            {nota !== undefined && ` · Nota da autoavaliação: ${nota}/100 (${faixaRh(nota)})`}
          </p>
          {bl.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Revisão necessária, sem punição. Ajuste e envie de novo:
              </p>
              <Bullets items={bl.map((b) => b.texto)} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tarefa concluída pelos critérios do módulo. Isso não é aprovação humana nem publica
              nada.
            </p>
          )}
          {nota !== undefined && (
            <>
              <p className="eyebrow text-muted-foreground">
                Devolutiva ({FEEDBACK_FORMATO.length} partes)
              </p>
              <p className="text-[15px] leading-relaxed">{feedbackRh(p, task.id)}</p>
            </>
          )}
          <p className="text-xs text-muted-foreground">{MSG.semIa}</p>
        </div>
      )}
    </div>
  );
}

/* --------------------------------- autoavaliação ---------------------------- */

function SelfEval({
  task,
  p,
  setP,
}: {
  task: RhTarefa;
  p: RhPrompt;
  setP: (fn: (x: RhPrompt) => RhPrompt) => void;
}) {
  const all = RUBRICA.every((r) => p.notas[r.id] !== undefined);
  const nota = all ? notaRubrica(p.notas) : undefined;
  return (
    <div className="ac-glass space-y-4 p-5">
      <div>
        <p className="text-sm font-medium">Autoavaliação guiada — {task.codigo}</p>
        <p className="text-xs text-muted-foreground">
          {MSG.semIa} {MSG.avaliacaoAviso}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Âncoras: {RUBRICA_ANCORAS.join(" · ")}.
        </p>
      </div>
      {RUBRICA.map((r) => (
        <fieldset key={r.id}>
          <legend className="text-sm">
            {r.label} <span className="text-xs text-muted-foreground">· peso {r.peso}%</span>
          </legend>
          <p className="text-xs text-muted-foreground">{r.cheque}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4].map((n) => (
              <Choice
                key={n}
                selected={p.notas[r.id] === n}
                onClick={() =>
                  setP((x) => ({ ...x, submitted: false, notas: { ...x.notas, [r.id]: n } }))
                }
              >
                {n}
              </Choice>
            ))}
          </div>
        </fieldset>
      ))}
      {nota !== undefined && (
        <p role="status" className="text-sm">
          Nota ponderada: <strong>{nota}/100</strong> — {faixaRh(nota)}. Faixas:{" "}
          {FAIXAS.map(([m, l]) => `${m}+ ${l}`).join(" · ")}.
        </p>
      )}
      <fieldset>
        <legend className="text-sm font-medium">Segurança: confirme cada item</legend>
        <p className="text-xs text-muted-foreground">{ERROS_CRITICOS_DEF}</p>
        <div className="mt-2 grid gap-2">
          {ERROS_CRITICOS.map((e, i) => (
            <label key={e} className="ac-choice flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={!!p.seguro[i]}
                onChange={(ev) =>
                  setP((x) => ({
                    ...x,
                    submitted: false,
                    seguro: { ...x.seguro, [i]: ev.target.checked },
                  }))
                }
                className="size-5"
              />
              <span>{e}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

/* ------------------------------------ quiz --------------------------------- */

export function RhQuiz({ s, patch }: { s: RhState; patch: PatchRh }) {
  const attempts = s.quiz.attempts.length;
  const order = useMemo(() => rhQuizOrder(attempts + 1), [attempts]);
  const [q, setQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [finished, setFinished] = useState(false);
  const [review, setReview] = useState(false);
  const last = s.quiz.attempts[s.quiz.attempts.length - 1];

  const finish = () => {
    const score = rhQuizScore(answers, order);
    patch((x) => ({
      ...x,
      quiz: {
        attempts: [...x.quiz.attempts, { score, at: new Date().toISOString() }],
        passed: x.quiz.passed || score >= RH_QUIZ_MIN,
      },
    }));
    setFinished(true);
  };
  const retry = () => {
    setQ(0);
    setAnswers({});
    setRevealed({});
    setFinished(false);
    setReview(false);
  };

  if (finished && last) {
    return (
      <Panel eyebrow="Quiz final" title={`${last.score} de ${RH_QUIZ.length} acertos`}>
        <p className="leading-relaxed">
          {last.score >= RH_QUIZ_MIN
            ? `Aprovado: você atingiu o mínimo de ${RH_QUIZ_MIN} acertos.`
            : `Ainda não chegou a ${RH_QUIZ_MIN} acertos. Revise as explicações e tente de novo, sem punição.`}
        </p>
        <p className="text-sm text-muted-foreground">{RH_QUIZ_FEEDBACK_FINAL}</p>
        <p className="text-xs text-muted-foreground">
          Tentativas ficam registradas só para o seu feedback, sem ranking (tentativa {attempts}). O
          quiz é um requisito de consolidação e não entra na nota do kit.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setReview((r) => !r)}>
            {review ? "Ocultar revisão" : "Revisar justificativas"}
          </Button>
          <Button onClick={retry}>Refazer o quiz</Button>
        </div>
        {review && (
          <ol className="space-y-4">
            {RH_QUIZ.map((it, i) => {
              const picked = answers[i];
              const ok = picked !== undefined && order[i]![picked] === it.answer;
              return (
                <li key={it.q} className="ac-glass p-4 text-sm">
                  <p className="font-medium">
                    {i + 1}. {it.q}
                  </p>
                  <p className="mt-1">
                    {ok ? "✓ Acertou. " : "✗ Resposta correta: "}
                    {!ok && <em>{it.options[it.answer]}</em>}
                  </p>
                  <p className="mt-1 text-muted-foreground">{it.why}</p>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>
    );
  }

  const it = RH_QUIZ[q]!;
  const pickedOrderIdx = answers[q];
  const answered = pickedOrderIdx !== undefined;
  const isRevealed = !!revealed[q];
  return (
    <Panel eyebrow={`Quiz final · pergunta ${q + 1} de ${RH_QUIZ.length}`} title={it.q}>
      <p className="text-xs text-muted-foreground">
        Uma pergunta por tela. A justificativa aparece depois que você confirma a resposta.
      </p>
      <div className="grid gap-2" role="radiogroup" aria-label="Alternativas">
        {order[q]!.map((optIdx, pos) => (
          <Choice
            key={optIdx}
            selected={pickedOrderIdx === pos}
            correct={isRevealed && optIdx === it.answer}
            wrong={isRevealed && pickedOrderIdx === pos && optIdx !== it.answer}
            disabled={isRevealed}
            onClick={() => setAnswers((a) => ({ ...a, [q]: pos }))}
          >
            {String.fromCharCode(65 + pos)}) {it.options[optIdx]}
          </Choice>
        ))}
      </div>
      {!isRevealed ? (
        <Button disabled={!answered} onClick={() => setRevealed((r) => ({ ...r, [q]: true }))}>
          Confirmar resposta
        </Button>
      ) : (
        <>
          <Result ok={order[q]![pickedOrderIdx!] === it.answer}>{it.why}</Result>
          {q < RH_QUIZ.length - 1 ? (
            <Button onClick={() => setQ(q + 1)}>Próxima pergunta</Button>
          ) : (
            <Button onClick={finish}>Ver resultado</Button>
          )}
        </>
      )}
    </Panel>
  );
}

export { TEMPLATE_TEXTO };

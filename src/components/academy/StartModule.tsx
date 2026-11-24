import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, Copy, Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AREA_BY_ID } from "@/lib/academy/areas";
import {
  AREA_OPTIONS,
  CHECKLIST,
  DIAG,
  FEEDBACK_MODELOS,
  FUNDAMENTOS,
  IA_AJUDA,
  IA_NAO_DECIDE,
  JOURNEY,
  MINI_OPCOES,
  MINI_SITUACOES,
  MODELO_PROMPT,
  NIVEL_OPTIONS,
  NOT_THIS_COURSE,
  PACTO,
  PACTO_EXEMPLO,
  REGRAS_SEGURANCA,
  START_STEPS,
  TAREFAS_PROMPT,
  TRILHAS,
  TRILHA_BY_ID,
  WELCOME_GOALS,
  buildPerfil,
  evaluateStart,
  type StartEvaluation,
} from "@/lib/academy/start";
import {
  EMPTY_START,
  updateAcademy,
  useAcademy,
  type Level,
  type StartState,
} from "@/lib/academy/store";

function usePatch() {
  return (fn: (s: StartState) => StartState) =>
    updateAcademy((a) => ({ ...a, start: fn(a.start ?? EMPTY_START) }));
}

const nonEmpty = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v.length > 0 : !!(v ?? "").trim();

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby="start-step-title" className="ac-rise">
      <p className="eyebrow text-muted-foreground">{eyebrow}</p>
      <h2 id="start-step-title" className="mt-3 text-[clamp(1.9rem,4.5vw,3.2rem)] font-light">
        {title}
      </h2>
      <div className="mt-8 space-y-6">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-[15px] leading-relaxed text-muted-foreground">
      {items.map((i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--ac-accent)]" />
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}

function CodeBlock({ label, text }: { label?: string; text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="ac-code">
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow text-muted-foreground">{label ?? "Modelo"}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(text).then(() => {
              setOk(true);
              setTimeout(() => setOk(false), 1500);
            });
          }}
          className="inline-flex min-h-9 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {ok ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {ok ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-[14px] leading-relaxed">
        {text}
      </pre>
    </div>
  );
}

function Choice({
  selected,
  correct,
  wrong,
  onClick,
  children,
  disabled,
}: {
  selected?: boolean;
  correct?: boolean;
  wrong?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`ac-choice ${selected ? "is-on" : ""} ${correct ? "is-ok" : ""} ${wrong ? "is-bad" : ""}`}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------------ */

export function StartModule() {
  const { state, ready } = useAcademy();
  const st = state.start ?? EMPTY_START;
  const patch = usePatch();
  const [ev, setEv] = useState<StartEvaluation | null>(null);
  const step = Math.min(st.step, 11);

  const trilha = st.area ? TRILHA_BY_ID[st.area] : undefined;
  const area = st.area ? AREA_BY_ID[st.area] : undefined;

  const diagOk = DIAG.every((q) => !q.required || nonEmpty(st.diag[q.id]));
  const fundOk = FUNDAMENTOS.every((f) => st.fund[f.id] !== undefined);
  const miniOk = MINI_SITUACOES.every((_, i) => st.mini[i] !== undefined);
  const promptWords = st.promptText.trim().split(/\s+/).filter(Boolean).length;
  const evaluated = st.evalTotal !== undefined;

  const checks = useMemo(() => {
    const auto = [
      diagOk,
      !!st.area,
      fundOk,
      st.max >= 7 || miniOk,
      miniOk,
      promptWords >= 20,
      evaluated,
      !!st.perfil && st.profileSaved,
    ];
    return CHECKLIST.map((_, i) => (i < 8 ? auto[i]! : !!st.checks[i]));
  }, [diagOk, st, fundOk, miniOk, promptWords, evaluated]);

  const canNext: boolean[] = [
    true,
    true,
    diagOk,
    !!st.area,
    fundOk,
    true,
    true,
    miniOk,
    evaluated,
    evaluated,
    st.profileSaved,
    false,
  ];

  const go = (n: number) => patch((s) => ({ ...s, step: n, max: Math.max(s.max, n) }));

  if (!ready) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  /* -------- diagnóstico: aplica a área sugerida quando escolhida -------- */
  const setDiag = (id: string, v: string | string[]) =>
    patch((s) => {
      const diag = { ...s.diag, [id]: v };
      let areaId = s.area;
      if (id === "area") {
        const opt = AREA_OPTIONS.find((a) => a.label === v);
        areaId = opt && opt.id !== "outra" ? opt.id : s.area;
      }
      return { ...s, diag, area: areaId };
    });

  const runEval = () => {
    const result = evaluateStart(st.promptText, {
      palavras: area?.palavras,
      papelSugerido: trilha?.papel,
    });
    setEv(result);
    patch((s) => ({ ...s, evalTotal: result.total, evalTier: result.tier }));
  };
  const currentEv =
    ev ??
    (evaluated
      ? evaluateStart(st.promptText, { palavras: area?.palavras, papelSugerido: trilha?.papel })
      : null);

  const saveProfile = () => {
    if (!trilha) return;
    const text = st.perfil || buildPerfil({ diag: st.diag, trilha, prompt: st.promptText });
    const nivelIdx = Math.max(0, NIVEL_OPTIONS.indexOf(String(st.diag.nivel ?? "")));
    const level: Level =
      nivelIdx <= 1 ? "iniciante" : nivelIdx === 2 ? "intermediario" : "avancado";
    const usaIdx =
      3 -
      Math.max(
        0,
        (DIAG.find((q) => q.id === "usa")?.options ?? []).indexOf(String(st.diag.usa ?? "")),
      );
    const tools = Array.isArray(st.diag.ferramentas)
      ? st.diag.ferramentas.filter((t) => t !== "Nenhuma").length
      : 0;
    const dims = [nivelIdx, usaIdx, Math.min(3, tools), Math.round((st.evalTotal ?? 0) / 34), 1, 0];
    updateAcademy((a) => {
      const now = new Date().toISOString();
      const exists = a.prompts.some((p) => p.id === "start-primeiro-prompt");
      return {
        ...a,
        start: { ...(a.start ?? EMPTY_START), perfil: text, profileSaved: true },
        profile: {
          area: trilha.id,
          level,
          goal: String(st.diag.objetivo ?? ""),
          score: Math.round(((nivelIdx + usaIdx) / 6) * 100),
          dims,
          createdAt: a.profile?.createdAt ?? now,
        },
        prompts: exists
          ? a.prompts
          : [
              ...a.prompts,
              {
                id: "start-primeiro-prompt",
                title: "Meu primeiro prompt (Módulo Start)",
                area: trilha.id,
                category: "Módulo Start",
                objective: st.task || "Primeiro prompt profissional",
                text: st.promptText,
                version: 1,
                createdAt: now,
                updatedAt: now,
                quality: Math.round((st.evalTotal ?? 0) / 10),
                result: "",
                notes: "",
                status: "em teste" as const,
              },
            ],
      };
    });
  };

  const finish = () =>
    patch((s) => ({ ...s, done: true, doneAt: new Date().toISOString(), checks: { ...s.checks } }));

  /* ------------------------------ conteúdo ------------------------------ */
  let body: React.ReactNode = null;

  if (st.done) {
    body = (
      <Panel eyebrow="Módulo Start concluído" title="Parabéns!">
        <p className="text-lg leading-relaxed">Você concluiu o Módulo Start da MOW Academy.</p>
        <p className="leading-relaxed text-muted-foreground">
          Você já definiu sua trilha, identificou oportunidades de uso de IA no seu trabalho e criou
          seu primeiro prompt profissional.
        </p>
        <p className="leading-relaxed text-muted-foreground">
          A partir de agora, seu Perfil de Uso de IA será usado para personalizar os exemplos,
          tarefas, templates e desafios das próximas semanas.
        </p>
        <p className="leading-relaxed text-muted-foreground">
          Na <strong className="text-foreground">Semana 1 — Fundamentos de IA Corporativa</strong>,
          você vai aprofundar sua compreensão sobre IA generativa, aprender a identificar
          oportunidades reais de uso e criar seus primeiros prompts aplicados à sua área.
        </p>
        <p className="ac-glass p-4 text-sm">
          <strong>Seu progresso foi salvo</strong> neste navegador.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/academy/semana/$n"
            params={{ n: "1" }}
            className="inline-flex min-h-12 items-center bg-primary px-6 text-sm text-primary-foreground"
          >
            Iniciar Semana 1
          </Link>
          <Link
            to="/academy/start/apostila"
            className="inline-flex min-h-12 items-center border border-input px-6 text-sm"
          >
            Abrir a apostila
          </Link>
          <Button variant="outline" onClick={() => patch((s) => ({ ...s, done: false, step: 0 }))}>
            Rever o módulo
          </Button>
        </div>
      </Panel>
    );
  } else if (step === 0) {
    body = (
      <Panel eyebrow="Etapa 1 · Boas-vindas" title="Bem-vindo(a) à MOW Academy.">
        <p className="text-lg leading-relaxed">
          Você está iniciando o curso <strong>IA Corporativa</strong>, uma jornada prática para
          aprender a usar Inteligência Artificial no seu trabalho com método, segurança e resultado.
        </p>
        <p className="leading-relaxed text-muted-foreground">
          Este não é um curso sobre teoria complicada ou prompts mágicos. Aqui, você vai aprender a
          usar IA para resolver tarefas reais da sua rotina profissional: escrever melhor, organizar
          informações, analisar dados, preparar reuniões, atender clientes, criar conteúdo, apoiar
          decisões e padronizar processos.
        </p>
        <p className="leading-relaxed text-muted-foreground">
          Ao final deste curso, você terá construído o seu{" "}
          <strong className="text-foreground">Sistema de Prompts Corporativo</strong>: uma
          biblioteca pessoal de prompts, fluxos e templates para usar no dia a dia da sua área.
        </p>
        <p className="font-medium">Seu progresso começa agora.</p>
        <div className="ac-glass space-y-4 p-6">
          <p className="leading-relaxed text-muted-foreground">
            A <strong className="text-foreground">MOW Academy</strong> foi criada para transformar
            conhecimento em prática profissional. Nosso objetivo é ajudar pessoas e empresas a
            usarem Inteligência Artificial de forma inteligente, ética e orientada a resultados.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            Não acreditamos que IA seja sobre substituir pessoas. Acreditamos que IA é sobre ampliar
            a capacidade humana: dar mais velocidade a tarefas repetitivas, organizar informações
            dispersas, gerar primeiras versões, apoiar análises e liberar tempo para o que realmente
            exige julgamento, criatividade e responsabilidade.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            O curso foi desenhado para profissionais que querem sair do “uso aleatório” de IA e
            começar a aplicá-la com método no trabalho.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-lg font-medium">Durante as próximas 8 semanas, você vai</h3>
            <Bullets items={WELCOME_GOALS} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-medium">Este curso não é</h3>
            <Bullets items={NOT_THIS_COURSE} />
            <p className="mt-4 font-medium">
              Este curso é sobre aplicar IA com inteligência, método e responsabilidade.
            </p>
          </div>
        </div>
        <Button onClick={() => go(1)}>Iniciar minha jornada</Button>
      </Panel>
    );
  } else if (step === 1) {
    body = (
      <Panel eyebrow="Etapa 2 · Como funciona" title="Você aprende fazendo.">
        <p className="leading-relaxed text-muted-foreground">
          Na MOW Academy, você não vai apenas ler apostilas. Cada módulo foi desenhado para
          transformar conhecimento em ação: explicações curtas, exemplos práticos, desafios, tarefas
          aplicadas à sua área e feedback sobre suas entregas.
        </p>
        <p className="leading-relaxed text-muted-foreground">
          As apostilas serão seus materiais de apoio. Elas servem para revisar conceitos, consultar
          templates e aprofundar o que você aprendeu. Mas o aprendizado real acontece quando você
          aplica.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {JOURNEY.map(([t, d], i) => (
            <li key={t} className="ac-glass p-5">
              <span className="eyebrow text-[var(--ac-accent)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-lg font-medium">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ul>
        <div className="ac-glass p-6">
          <p className="eyebrow text-muted-foreground">Regra de ouro</p>
          <p className="mt-2 text-xl font-medium">Não avance apenas lendo.</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A cada etapa, aplique o conteúdo a uma situação real do seu trabalho. Quanto mais você
            praticar com situações reais, mais rápido desenvolverá uma habilidade útil e duradoura.
          </p>
        </div>
        <Button onClick={() => go(2)}>Começar diagnóstico</Button>
      </Panel>
    );
  } else if (step === 2) {
    body = (
      <Panel eyebrow="Etapa 3 · Diagnóstico" title="Antes de começar, queremos conhecer você.">
        <p className="leading-relaxed text-muted-foreground">
          Suas respostas serão usadas para personalizar sua experiência: exemplos, tarefas,
          templates, estudos de caso e projetos adequados à sua área e ao seu nível. Você poderá
          atualizar essas informações depois. Tudo fica salvo apenas neste navegador.
        </p>
        <div className="space-y-8">
          {DIAG.map((q, i) => {
            const v = st.diag[q.id];
            return (
              <fieldset key={q.id}>
                <legend className="text-base font-medium">
                  {i + 1}. {q.q}
                  {q.required && <span className="text-[var(--ac-accent)]"> *</span>}
                </legend>
                {q.type === "text" && (
                  <textarea
                    value={(v as string) ?? ""}
                    onChange={(e) => setDiag(q.id, e.target.value)}
                    rows={q.id === "cargo" ? 1 : 3}
                    className="mt-3 w-full px-4 py-3 text-base"
                    aria-label={q.q}
                  />
                )}
                {q.type === "single" && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {q.options!.map((o) => (
                      <Choice key={o} selected={v === o} onClick={() => setDiag(q.id, o)}>
                        {o}
                      </Choice>
                    ))}
                  </div>
                )}
                {q.type === "multi" && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {q.options!.map((o) => {
                      const arr = Array.isArray(v) ? v : [];
                      const on = arr.includes(o);
                      return (
                        <Choice
                          key={o}
                          selected={on}
                          onClick={() =>
                            setDiag(
                              q.id,
                              o === "Nenhuma"
                                ? on
                                  ? []
                                  : ["Nenhuma"]
                                : on
                                  ? arr.filter((x) => x !== o)
                                  : [...arr.filter((x) => x !== "Nenhuma"), o],
                            )
                          }
                        >
                          {o}
                        </Choice>
                      );
                    })}
                  </div>
                )}
              </fieldset>
            );
          })}
        </div>
        {!diagOk && (
          <p className="text-sm text-muted-foreground">
            Responda as perguntas marcadas com * para continuar.
          </p>
        )}
        <div className="ac-glass p-5 text-sm leading-relaxed text-muted-foreground">
          Ótimo. Agora vamos escolher a trilha que melhor representa sua área de atuação. Ela
          definirá os exemplos, exercícios, templates, estudos de caso e projeto final que você
          receberá. Você poderá alterá-la depois, se necessário.
        </div>
      </Panel>
    );
  } else if (step === 3) {
    body = (
      <Panel eyebrow="Etapa 4 · Trilha" title="Escolha a trilha da sua área.">
        <p className="leading-relaxed text-muted-foreground">
          {st.area
            ? "Trilha pré-selecionada pelo seu diagnóstico. Você pode trocar."
            : "Selecione a trilha que melhor representa o seu trabalho."}
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {TRILHAS.map((t) => {
            const on = st.area === t.id;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                onClick={() => patch((s) => ({ ...s, area: t.id }))}
                className={`ac-glass ac-trilha p-6 text-left ${on ? "is-on" : ""}`}
              >
                <span className="eyebrow text-[var(--ac-accent)]">Trilha {t.n}</span>
                <h3 className="mt-2 text-xl font-medium">{t.nome}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.descricao}</p>
                {on && (
                  <div className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
                    <div>
                      <p className="eyebrow text-muted-foreground">Tarefas frequentes</p>
                      <p className="mt-1 text-muted-foreground">{t.tarefas.join(" ")}</p>
                    </div>
                    <div>
                      <p className="eyebrow text-muted-foreground">Exemplos de uso de IA</p>
                      <p className="mt-1 text-muted-foreground">{t.exemplos.join(" ")}</p>
                    </div>
                    <div>
                      <p className="eyebrow text-muted-foreground">Indicadores relevantes</p>
                      <p className="mt-1 text-muted-foreground">{t.indicadores.join(" ")}</p>
                    </div>
                    <div>
                      <p className="eyebrow text-muted-foreground">Exemplo de projeto final</p>
                      <p className="mt-1">{t.projeto}</p>
                    </div>
                    {t.importante && (
                      <p className="flex gap-2 rounded-2xl border border-amber-300/30 bg-amber-200/10 p-3 text-amber-100">
                        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                        <span>
                          <strong>Importante:</strong> {t.importante}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Panel>
    );
  } else if (step === 4) {
    body = (
      <Panel eyebrow="Etapa 5 · Fundamentos" title="Fundamentos de IA corporativa.">
        <p className="leading-relaxed text-muted-foreground">
          Sete blocos curtos, cada um com uma pergunta de verificação.
        </p>
        <div className="space-y-6">
          {FUNDAMENTOS.map((f, fi) => {
            const picked = st.fund[f.id];
            return (
              <article key={f.id} className="ac-glass p-6">
                <span className="eyebrow text-[var(--ac-accent)]">Bloco {fi + 1} de 7</span>
                <h3 className="mt-2 text-xl font-medium">{f.titulo}</h3>
                <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
                  {f.corpo.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
                {f.lista && (
                  <div className="mt-3">
                    <Bullets items={f.lista} />
                  </div>
                )}
                {f.codigo && (
                  <div className="mt-4 space-y-3">
                    {f.codigo.map((c) => (
                      <CodeBlock key={c.rotulo} label={c.rotulo} text={c.texto} />
                    ))}
                  </div>
                )}
                {f.regra && (
                  <p className="mt-4 rounded-2xl border border-[var(--ac-accent)]/40 bg-[var(--ac-accent)]/10 p-3 text-sm">
                    <strong>Regra prática:</strong> {f.regra}
                  </p>
                )}
                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-sm font-medium">{f.check.q}</p>
                  <div className="mt-3 grid gap-2">
                    {f.check.options.map((o, oi) => (
                      <Choice
                        key={o}
                        selected={picked === oi}
                        correct={picked !== undefined && oi === f.check.answer}
                        wrong={picked === oi && oi !== f.check.answer}
                        onClick={() => patch((s) => ({ ...s, fund: { ...s.fund, [f.id]: oi } }))}
                      >
                        {o}
                      </Choice>
                    ))}
                  </div>
                  {picked !== undefined && (
                    <p role="status" className="mt-3 text-sm text-muted-foreground">
                      <strong className="text-foreground">
                        {picked === f.check.answer ? "Correto. " : "Quase. "}
                      </strong>
                      {f.check.why}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </Panel>
    );
  } else if (step === 5) {
    body = (
      <Panel eyebrow="Etapa 6 · Limites" title="Onde a IA ajuda e onde não deve decidir sozinha.">
        <div className="ac-glass overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Tarefas com alto potencial de apoio</caption>
            <thead>
              <tr className="text-muted-foreground">
                <th className="px-5 py-3 font-medium">Tarefa</th>
                <th className="px-5 py-3 font-medium">Como a IA ajuda</th>
              </tr>
            </thead>
            <tbody>
              {IA_AJUDA.map(([t, d]) => (
                <tr key={t} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{t}</td>
                  <td className="px-5 py-3 text-muted-foreground">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-3xl border border-amber-300/30 bg-amber-200/10 p-6">
          <h3 className="flex items-center gap-2 text-lg font-medium">
            <ShieldAlert className="size-5" aria-hidden /> A IA não deve substituir decisões humanas
            em
          </h3>
          <div className="mt-3">
            <Bullets items={IA_NAO_DECIDE} />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Nesses casos, a IA pode ajudar a organizar informações, levantar hipóteses e preparar
            análises, mas a decisão final deve pertencer a uma pessoa qualificada.
          </p>
        </div>
        {trilha?.importante && (
          <p className="ac-glass p-4 text-sm">
            <strong>Na sua trilha ({trilha.nome}):</strong> {trilha.importante}
          </p>
        )}
      </Panel>
    );
  } else if (step === 6) {
    body = (
      <Panel eyebrow="Etapa 7 · Framework" title="PACTO: cinco elementos de um bom prompt.">
        <ul className="grid gap-3 sm:grid-cols-5">
          {PACTO.map((p) => (
            <li key={p.letra} className="ac-glass p-4">
              <span className="text-4xl font-light text-[var(--ac-accent)]">{p.letra}</span>
              <h3 className="mt-2 text-base font-medium">{p.nome}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{p.pergunta}</p>
            </li>
          ))}
        </ul>
        <ul className="space-y-3 text-[15px] leading-relaxed text-muted-foreground">
          {PACTO.map((p) => (
            <li key={p.nome}>
              <strong className="text-foreground">{p.nome}:</strong> {p.detalhe}
            </li>
          ))}
        </ul>
        <CodeBlock label="Exemplo completo" text={PACTO_EXEMPLO} />
        {trilha && (
          <CodeBlock label={`Exemplo da sua trilha · ${trilha.nome}`} text={trilha.exemploPrompt} />
        )}
      </Panel>
    );
  } else if (step === 7) {
    const answered = Object.keys(st.mini).length;
    const hits = MINI_SITUACOES.filter((s, i) => st.mini[i] === s.correta).length;
    body = (
      <Panel eyebrow="Etapa 8 · Mini-desafio" title="IA pode ajudar?">
        <p className="leading-relaxed text-muted-foreground">
          Leia cada situação e escolha a opção correta. Após cada resposta você vê o porquê.
        </p>
        <p className="text-sm text-muted-foreground" role="status">
          {answered} de 8 respondidas{answered === 8 ? ` · ${hits} acertos` : ""}
        </p>
        <div className="space-y-5">
          {MINI_SITUACOES.map((s, i) => {
            const picked = st.mini[i];
            return (
              <article key={s.texto} className="ac-glass p-6">
                <span className="eyebrow text-[var(--ac-accent)]">Situação {i + 1}</span>
                <h3 className="mt-2 text-lg font-medium">{s.texto}</h3>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {MINI_OPCOES.map((o, oi) => (
                    <Choice
                      key={o}
                      selected={picked === oi}
                      correct={picked !== undefined && oi === s.correta}
                      wrong={picked === oi && oi !== s.correta}
                      disabled={picked !== undefined}
                      onClick={() => patch((x) => ({ ...x, mini: { ...x.mini, [i]: oi } }))}
                    >
                      {o}
                    </Choice>
                  ))}
                </div>
                {picked !== undefined && (
                  <p role="status" className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    <strong className="text-foreground">
                      {picked === s.correta ? "Acertou. " : "Não foi dessa vez. "}
                    </strong>
                    Resposta correta: <em>{MINI_OPCOES[s.correta]}</em> {s.porque}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </Panel>
    );
  } else if (step === 8) {
    body = (
      <Panel eyebrow="Etapa 9 · Primeiro prompt" title="Crie seu primeiro prompt profissional.">
        <p className="leading-relaxed text-muted-foreground">
          Escolha uma tarefa real do seu trabalho e use o PACTO. Use exemplos fictícios ou
          anonimizados: nada de dados pessoais ou confidenciais.
        </p>
        <div>
          <h3 className="mb-3 text-base font-medium">Passo 1 — Escolha a tarefa</h3>
          <div className="flex flex-wrap gap-2">
            {TAREFAS_PROMPT.map((t) => (
              <Choice
                key={t}
                selected={st.task === t}
                onClick={() => patch((s) => ({ ...s, task: t }))}
              >
                {t}
              </Choice>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-base font-medium">Passo 2 — Estruture o prompt</h3>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => patch((s) => ({ ...s, promptText: MODELO_PROMPT }))}
            >
              Usar o modelo PACTO
            </Button>
            {trilha && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => patch((s) => ({ ...s, promptText: trilha.exemploPrompt }))}
              >
                Usar o exemplo da minha trilha
              </Button>
            )}
          </div>
          <label htmlFor="start-prompt" className="sr-only">
            Seu prompt
          </label>
          <textarea
            id="start-prompt"
            value={st.promptText}
            onChange={(e) =>
              patch((s) => ({
                ...s,
                promptText: e.target.value,
                evalTotal: undefined,
                evalTier: undefined,
              }))
            }
            rows={14}
            placeholder="Papel: Atue como…"
            className="w-full px-4 py-3 font-mono text-[14px] leading-relaxed"
          />
          <p className="mt-2 text-xs text-muted-foreground">{promptWords} palavras</p>
        </div>
        {trilha && (
          <details className="ac-glass p-5">
            <summary className="cursor-pointer text-sm font-medium">
              Passo 3 — Ver o exemplo da sua trilha ({trilha.nome})
            </summary>
            <div className="mt-4">
              <CodeBlock text={trilha.exemploPrompt} label={trilha.nome} />
            </div>
          </details>
        )}
        <Button
          disabled={promptWords < 20}
          onClick={() => {
            runEval();
            go(9);
          }}
        >
          Enviar para avaliação
        </Button>
        {promptWords < 20 && (
          <p className="text-sm text-muted-foreground">
            Escreva ao menos 20 palavras para avaliar.
          </p>
        )}
      </Panel>
    );
  } else if (step === 9) {
    body = (
      <Panel eyebrow="Etapa 10 · Feedback" title="Avaliação do seu prompt.">
        {!currentEv ? (
          <div>
            <p className="text-muted-foreground">Você ainda não enviou um prompt.</p>
            <Button className="mt-4" onClick={() => go(8)}>
              Criar o prompt
            </Button>
          </div>
        ) : (
          <>
            <div className="ac-glass p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-2xl font-light">{currentEv.tier}</h3>
                <span className="text-4xl font-light text-[var(--ac-accent)]">
                  {currentEv.total}%
                </span>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                {FEEDBACK_MODELOS[currentEv.tier]}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Avaliação automática por regras sobre a forma do prompt. Ela não verifica fatos e
                não substitui um instrutor.
              </p>
            </div>
            {currentEv.avisos.length > 0 && (
              <div
                role="alert"
                className="rounded-3xl border border-red-300/40 bg-red-400/10 p-5 text-sm"
              >
                <strong>Atenção à segurança.</strong> {currentEv.avisos.join(" ")} Remova ou troque
                por dados fictícios antes de usar qualquer ferramenta.
              </div>
            )}
            <ul className="grid gap-3 sm:grid-cols-2">
              {currentEv.items.map((i) => (
                <li key={i.id} className="ac-glass p-4">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium">
                      {i.label} <span className="text-xs text-muted-foreground">· {i.peso}%</span>
                    </span>
                    <span className="text-muted-foreground">{i.score}/10</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[var(--ac-accent)]"
                      style={{ width: `${i.score * 10}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{i.note}</p>
                </li>
              ))}
            </ul>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <h3 className="mb-2 font-medium">Pontos fortes</h3>
                {currentEv.fortes.length ? (
                  <Bullets items={currentEv.fortes} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Ainda não há pontos fortes claros.
                  </p>
                )}
              </div>
              <div>
                <h3 className="mb-2 font-medium">Pontos a melhorar</h3>
                {currentEv.melhorar.length ? (
                  <Bullets items={currentEv.melhorar} />
                ) : (
                  <p className="text-sm text-muted-foreground">Nada crítico a melhorar.</p>
                )}
              </div>
              <div>
                <h3 className="mb-2 font-medium">Sugestões específicas</h3>
                <Bullets items={currentEv.sugestoes} />
              </div>
            </div>
            <CodeBlock label="Versão melhorada do seu prompt" text={currentEv.melhorado} />
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  patch((s) => ({
                    ...s,
                    promptText: currentEv.melhorado,
                    evalTotal: undefined,
                    evalTier: undefined,
                  }));
                  setEv(null);
                  go(8);
                }}
              >
                Refazer com a versão melhorada
              </Button>
              <Button variant="outline" onClick={() => go(8)}>
                Editar meu prompt
              </Button>
            </div>
          </>
        )}
      </Panel>
    );
  } else if (step === 10) {
    const perfil =
      st.perfil || (trilha ? buildPerfil({ diag: st.diag, trilha, prompt: st.promptText }) : "");
    body = (
      <Panel eyebrow="Etapa 11 · Perfil" title="Seu Perfil de Uso de IA.">
        <p className="leading-relaxed text-muted-foreground">
          Gerado a partir do diagnóstico, da trilha e do seu primeiro prompt. Ele personalizará as
          próximas semanas. Você pode editar antes de salvar.
        </p>
        <label htmlFor="start-perfil" className="sr-only">
          Perfil de Uso de IA
        </label>
        <textarea
          id="start-perfil"
          value={perfil}
          onChange={(e) => patch((s) => ({ ...s, perfil: e.target.value, profileSaved: false }))}
          rows={20}
          className="w-full px-4 py-3 font-mono text-[13.5px] leading-relaxed"
        />
        <p className="font-medium">Deseja salvar este perfil e avançar para a Semana 1?</p>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              saveProfile();
              go(11);
            }}
            disabled={!trilha}
          >
            Salvar perfil e continuar
          </Button>
          {st.profileSaved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-[var(--ac-accent)]">
              <Check className="size-4" /> Perfil salvo
            </span>
          )}
        </div>
      </Panel>
    );
  } else {
    const all = checks.every(Boolean);
    body = (
      <Panel eyebrow="Etapa 12 · Checklist" title="Checklist de conclusão.">
        <ul className="space-y-2">
          {CHECKLIST.map((c, i) => {
            const manual = i >= 8;
            return (
              <li key={c}>
                <label
                  className={`ac-glass flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 text-[15px] ${checks[i] ? "" : "opacity-80"}`}
                >
                  <input
                    type="checkbox"
                    checked={checks[i]}
                    disabled={!manual}
                    onChange={(e) =>
                      patch((s) => ({ ...s, checks: { ...s.checks, [i]: e.target.checked } }))
                    }
                    className="size-5"
                  />
                  <span>{c}</span>
                </label>
              </li>
            );
          })}
        </ul>
        <div className="ac-glass p-5">
          <h3 className="mb-3 font-medium">Minhas regras de segurança</h3>
          <Bullets items={REGRAS_SEGURANCA} />
        </div>
        {!all && (
          <p className="text-sm text-muted-foreground">
            Marque as duas últimas e conclua as etapas anteriores para finalizar.
          </p>
        )}
        <Button disabled={!all} onClick={finish}>
          Concluir o Módulo Start
        </Button>
      </Panel>
    );
  }

  const pct = st.done ? 100 : Math.round((Math.min(st.max, 11) / 11) * 100);

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Etapas do Módulo Start">
        <div className="ac-glass p-5">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow text-muted-foreground">Módulo Start</p>
            <span className="text-sm text-muted-foreground">{pct}%</span>
          </div>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="ac-bar h-full rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <ol className="mt-4 hidden space-y-0.5 lg:block">
            {START_STEPS.map((label, i) => {
              const open = i <= st.max || st.done;
              const current = !st.done && i === step;
              return (
                <li key={label}>
                  <button
                    type="button"
                    disabled={!open}
                    onClick={() => go(i)}
                    aria-current={current ? "step" : undefined}
                    className={`ac-step ${current ? "is-current" : ""}`}
                  >
                    <span className="ac-step-n">
                      {open && i < st.max ? <Check className="size-3" /> : i + 1}
                    </span>
                    <span className="flex-1 text-left">{label}</span>
                    {!open && <Lock className="size-3 opacity-50" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-xs text-muted-foreground lg:hidden">
            Etapa {step + 1} de 12 · {START_STEPS[step]}
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        {body}
        {!st.done && step < 11 && (
          <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6">
            <Button variant="outline" disabled={step === 0} onClick={() => go(step - 1)}>
              <ChevronLeft className="mr-1 size-4" /> Voltar
            </Button>
            {step !== 0 && step !== 1 && step !== 8 && (
              <Button disabled={!canNext[step]} onClick={() => go(step + 1)}>
                Continuar <ChevronRight className="ml-1 size-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

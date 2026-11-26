import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Bullets, Choice, CodeBlock, Field, Panel, Result, Selo } from "./ui";
import { FonteCard, GuiadoErros, LivreBox, RhQuiz, TaskLab, type PatchRh } from "./RhParts";
import { AREA_BY_ID, type AreaId } from "@/lib/academy/areas";
import { EMPTY_M1 } from "@/lib/academy/modulo1-logic";
import { CASOS } from "@/lib/academy/modulo1";
import { getSaveStatus, updateAcademy, useAcademy, type AcademyState } from "@/lib/academy/store";
import {
  CICLO_NOTA,
  CICLO_RH,
  COMPONENTES_NOTA,
  CRIVO,
  CRIVO_NOTA,
  ERROS_CRITICOS_DEF,
  ESCALA_COMPONENTE,
  FONTES,
  HORIZONTE,
  INTERRUPCAO_MOTIVOS,
  LAB_CAMPOS,
  LAB_DICA,
  LAB_GUIADO,
  LAB_MODOS,
  LIMITE_CAMPOS,
  LIMITE_EXEMPLOS,
  LIMITE_MODELO,
  LIMITE_NOTA,
  MAPA_CAMPOS,
  MAPA_FUNCIONAL,
  MAPA_NOTA,
  METRICAS,
  METRICAS_NOTA,
  MSG,
  NIVEIS_PRATICA,
  PILOTO_CAMPOS,
  PILOTO_DIAS,
  PILOTO_NOTA,
  RH_AVISO_FICCAO,
  RH_MIN_NOTA,
  RH_MODALIDADE,
  RH_OPENING,
  RH_TAREFAS,
  RH_UNITS,
  TEMPLATE_TEXTO,
  U1_FEEDBACK,
  U1_OPCOES,
  U1_PEDIDOS,
  U1_TEXTO,
  U2A_ITENS,
  U2A_OPCOES,
  U2B,
  U2_NOTA_JURIDICA,
  U2_TEXTO,
  U3_BRIEFING_CAMPOS,
  U3_CRITERIO,
  U3_DEMANDA,
  U3_GABARITO,
  U3_PONTOS,
  U3_TEXTO,
  U7A,
  U7A_PERGUNTAS,
  U7B,
  U7B_LIVRE,
  U7_TEXTO,
  U8_TEXTO,
  faixaRh,
  type NivelPratica,
} from "@/lib/academy/rh1";
import {
  EMPTY_RH,
  buildRhPerfil,
  componentes,
  rhExportData,
  rhExportMarkdown,
  rhProgress,
  syncRhLibrary,
  taskNota,
  taskStatus,
  u7NumerosOk,
  type RhState,
} from "@/lib/academy/rh1-logic";

const STEPS = [
  "Abertura",
  ...RH_UNITS.slice(0, 7).map((u, i) => `U${i + 1} · ${u.title}`),
  "U8 · Laboratório e piloto",
  "U8 · Quiz final",
  "U8 · Kit e conclusão",
];
const LAST = STEPS.length - 1;

function download(name: string, mime: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function RhModule1() {
  const { state, ready } = useAcademy();
  const s = state.rh1 ?? EMPTY_RH;
  const patch: PatchRh = (fn) =>
    updateAcademy((a) => {
      const next = fn(a.rh1 ?? EMPTY_RH);
      return { ...a, rh1: next, prompts: syncRhLibrary(a.prompts, next) };
    });
  const prog = rhProgress(s);
  const step = Math.min(s.step, LAST);
  const go = (n: number) => patch((x) => ({ ...x, step: n }));
  const setArea = (area: AreaId) =>
    updateAcademy((a) => ({ ...a, m1: { ...(a.m1 ?? EMPTY_M1), areaOverride: area } }));
  const nivel = s.nivel;

  useEffect(() => {
    if (ready) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [step, ready]);

  if (!ready) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  const save = getSaveStatus();
  const saveMsg =
    save === "ok"
      ? MSG.local
      : save === "fail"
        ? MSG.erroSalvar
        : "O progresso será salvo neste navegador; não sincronizado entre dispositivos.";

  const unitIntro = (u: number, paras: string[]) => (
    <>
      <p className="text-xs text-muted-foreground">
        Unidade {u + 1} de 8 · ~{RH_UNITS[u]!.min} min (estimativa, sem cronômetro) · você pode
        pausar e retomar.
      </p>
      <Selo>{RH_AVISO_FICCAO}</Selo>
      <div className="ac-glass space-y-3 p-5 text-[15px] leading-relaxed text-muted-foreground">
        {paras.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </>
  );

  let body: React.ReactNode = null;

  /* -------------------------------- abertura ------------------------------- */
  if (step === 0) {
    body = (
      <Panel eyebrow="Trilha RH e Gestão de Pessoas · Módulo 1" title={RH_OPENING.title}>
        <div className="space-y-4 text-lg leading-relaxed">
          {RH_OPENING.paragraphs.map((p, i) => (
            <p key={p} className={i === 0 ? "" : "text-muted-foreground"}>
              {p}
            </p>
          ))}
        </div>
        <div className="ac-glass space-y-3 p-6">
          <p className="eyebrow text-muted-foreground">
            IA na prática do RH: processos, pessoas e primeiras entregas
          </p>
          <p className="text-sm text-muted-foreground">
            Pré-requisito: Módulo Start (seu perfil é reaproveitado; não há novo diagnóstico).
            Duração estimada: 4 a 5 horas com prática, sem cronômetro obrigatório. Esta avaliação
            não certifica habilitação em RH, direito ou psicologia, e este módulo não emite o
            certificado do curso.
          </p>
          <fieldset>
            <legend className="text-sm font-medium">
              Nível de prática (muda o apoio, não o padrão de segurança)
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {NIVEIS_PRATICA.map((n) => (
                <Choice
                  key={n.id}
                  selected={nivel === n.id}
                  onClick={() => patch((x) => ({ ...x, nivel: n.id as NivelPratica }))}
                >
                  <strong>{n.nome}</strong>
                  <br />
                  <span className="text-xs">{n.desc}</span>
                </Choice>
              ))}
            </div>
          </fieldset>
          <label htmlFor="rh-trilha" className="block text-sm font-medium">
            Trilha (seus trabalhos são mantidos ao trocar)
          </label>
          <select
            id="rh-trilha"
            value="rh"
            onChange={(e) => setArea(e.target.value as AreaId)}
            className="min-h-11 w-full px-3 text-[15px] sm:w-auto"
          >
            {CASOS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <h3 className="mb-3 text-lg font-medium">Ao concluir, você consegue</h3>
          <Bullets items={RH_OPENING.objetivos} />
        </div>
        <div className="ac-glass p-6">
          <h3 className="text-lg font-medium">Unidades</h3>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {RH_UNITS.map((u, i) => (
              <li key={u.title}>
                <button
                  type="button"
                  onClick={() => go(i === 7 ? 8 : i + 1)}
                  className="ac-step"
                  aria-label={`Ir para a unidade ${i + 1}: ${u.title}${prog.units[i] ? " (concluída)" : ""}`}
                >
                  <span className="ac-step-n">
                    {prog.units[i] ? <Check className="size-3" /> : i + 1}
                  </span>
                  <span className="flex-1 text-left">{u.title}</span>
                  <span className="text-xs opacity-70">{u.min} min</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-muted-foreground">
            Progresso: {prog.doneUnits} de 8 unidades · cada unidade vale o mesmo peso.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => go(1)}>{RH_OPENING.button}</Button>
          <Link
            to="/academy/apostila-rh-1"
            className="inline-flex min-h-12 items-center border border-input px-6 text-sm"
          >
            Abrir a apostila
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">{RH_OPENING.notice}</p>
      </Panel>
    );
  }

  /* ----------------------------------- U1 ---------------------------------- */
  if (step === 1) {
    body = (
      <Panel eyebrow="Unidade 1" title={RH_UNITS[0]!.title}>
        {unitIntro(0, U1_TEXTO)}
        <div className="ac-glass p-5">
          <h3 className="text-lg font-medium">Caso transversal — {HORIZONTE.nome}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{HORIZONTE.intro}</p>
          <p className="mt-3 text-sm font-medium">Dificuldades relatadas</p>
          <Bullets items={HORIZONTE.dificuldades} />
          <p className="mt-3 text-sm text-muted-foreground">{HORIZONTE.nota}</p>
          <p className="mt-2 text-sm text-muted-foreground">{HORIZONTE.autorizacao}</p>
        </div>
        <div>
          <h3 className="mb-3 text-lg font-medium">Mapa funcional do RH</h3>
          <ol className="grid gap-3 md:grid-cols-2">
            {MAPA_FUNCIONAL.map((m, i) => (
              <li key={m.nome} className="ac-glass p-4 text-sm leading-relaxed">
                <span className="eyebrow text-[var(--ac-accent)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-1 font-medium">{m.nome}</p>
                <p className="mt-1 text-muted-foreground">
                  <strong className="text-foreground">Pode apoiar:</strong> {m.apoia}.
                </p>
                <p className="mt-1 text-muted-foreground">
                  <strong className="text-foreground">Não deve:</strong> {m.naoFaz}.
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-muted-foreground">{MAPA_NOTA}</p>
        </div>
        <h3 className="text-xl font-medium">
          Atividade: decida como a IA pode (ou não) ajudar em seis pedidos de colegas
        </h3>
        <div className="ac-glass space-y-2 p-5 text-[15px]">
          <p>
            <strong>Situação:</strong> você trabalha no RH da {HORIZONTE.nome}. Colegas e gestores
            costumam pedir ajuda para tarefas do dia a dia, e você está avaliando se cada pedido
            pode ser feito com apoio de IA.
          </p>
          <p>
            <strong>O que fazer:</strong> leia cada pedido abaixo e escolha a opção que melhor
            descreve como a IA deve (ou não deve) ser usada nele. Use o mapa funcional acima como
            referência.
          </p>
          <p>
            <strong>O que você ganha:</strong> ao escolher, o sistema mostra na hora se acertou e
            explica o motivo. Você pode trocar a resposta quantas vezes quiser.
          </p>
        </div>
        <div className="space-y-5">
          {U1_PEDIDOS.map((it, i) => {
            const v = s.u1[i];
            return (
              <fieldset key={it.texto} className="ac-glass p-5">
                <legend className="text-base font-medium">
                  <span className="block text-xs uppercase tracking-wide text-muted-foreground">
                    Pedido {String.fromCharCode(65 + i)} · um colega pede ao RH:
                  </span>
                  “{it.texto}”
                </legend>
                <p className="mt-2 text-sm text-muted-foreground">
                  Como a IA deve ser usada neste pedido?
                </p>
                <div className="mt-3 grid gap-2">
                  {U1_OPCOES.map((o, oi) => (
                    <Choice
                      key={o}
                      selected={v === oi}
                      correct={v === oi && oi === it.correta}
                      wrong={v === oi && oi !== it.correta}
                      onClick={() => patch((x) => ({ ...x, u1: { ...x.u1, [i]: oi } }))}
                    >
                      {o}
                    </Choice>
                  ))}
                </div>
                {v !== undefined && (
                  <div className="mt-3">
                    <Result ok={v === it.correta}>
                      {v === it.correta
                        ? it.porque
                        : "Releia o mapa acima: qual é o limite desta tarefa?"}
                    </Result>
                  </div>
                )}
              </fieldset>
            );
          })}
        </div>
        {U1_PEDIDOS.every((x, i) => s.u1[i] === x.correta) && (
          <p role="status" className="ac-glass p-4 text-sm">
            {U1_FEEDBACK}
          </p>
        )}
        <h3 className="text-xl font-medium">
          Entrega: monte seu mapa com três oportunidades de usar IA no RH
        </h3>
        <p className="text-sm text-muted-foreground">
          Agora é com você. Pense em três tarefas do RH em que a IA poderia ajudar como apoio (use o
          caso da {HORIZONTE.nome} ou a sua realidade, sem dados pessoais reais). Para cada uma,
          preencha: qual é a tarefa, que fonte oficial ela exige, o que a IA vai produzir, o risco
          se houver erro e quem, entre as pessoas, aprova o resultado.
        </p>
        <div className="grid gap-5 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="ac-glass space-y-3 p-5">
              <p className="eyebrow text-[var(--ac-accent)]">Oportunidade {i + 1}</p>
              {MAPA_CAMPOS.map((c) => (
                <Field
                  key={c.id}
                  id={`mapa-${i}-${c.id}`}
                  label={c.label}
                  rows={c.rows}
                  value={s.mapa[i]?.[c.id] ?? ""}
                  onChange={(v) =>
                    patch((x) => ({
                      ...x,
                      mapa: { ...x.mapa, [i]: { ...(x.mapa[i] ?? {}), [c.id]: v } },
                    }))
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </Panel>
    );
  }

  /* ----------------------------------- U2 ---------------------------------- */
  if (step === 2) {
    body = (
      <Panel eyebrow="Unidade 2" title={RH_UNITS[1]!.title}>
        {unitIntro(1, U2_TEXTO)}
        <p className="ac-glass p-4 text-sm">{U2_NOTA_JURIDICA}</p>
        <h3 className="text-xl font-medium">Atividade A: que tipo de dado é este?</h3>
        <p className="text-sm text-muted-foreground">
          Para cada situação abaixo, escolha a classificação mais adequada do dado e veja o
          comentário. Antes de colocar qualquer informação em uma IA, você precisa saber o que ela
          é.
        </p>
        <div className="space-y-5">
          {U2A_ITENS.map((it, i) => {
            const v = s.u2a[i];
            return (
              <fieldset key={it.texto} className="ac-glass p-5">
                <legend className="px-1 text-base font-medium">{it.texto}</legend>
                <div className="mt-3 grid gap-2">
                  {U2A_OPCOES.map((o, oi) => (
                    <Choice
                      key={o}
                      selected={v === oi}
                      correct={v === oi && oi === it.correta}
                      wrong={v === oi && oi !== it.correta}
                      onClick={() => patch((x) => ({ ...x, u2a: { ...x.u2a, [i]: oi } }))}
                    >
                      {o}
                    </Choice>
                  ))}
                </div>
                {v !== undefined && (
                  <div className="mt-3">
                    <Result ok={v === it.correta}>
                      {v === it.correta
                        ? it.porque
                        : "Pense em quem o dado identifica e em quem poderia vê-lo."}
                    </Result>
                  </div>
                )}
              </fieldset>
            );
          })}
        </div>
        <h3 className="text-xl font-medium">
          Atividade B: encontre os problemas na requisição de vaga (F1)
        </h3>
        <p className="text-sm text-muted-foreground">
          Leia a requisição abaixo como se ela tivesse chegado ao seu e-mail. Responda às perguntas
          apontando o que está faltando ou o que não deveria estar ali. Depois de responder, compare
          com a referência e faça sua autoconferência.
        </p>
        <FonteCard id="F1" open />
        {U2B.map((q) => (
          <LivreBox key={q.id} def={q} state={s.livres[q.id]} patch={patch} />
        ))}
        <h3 className="text-xl font-medium">Checkpoint: escreva três limites de uso da IA</h3>
        <p className="text-sm text-muted-foreground">
          Para fechar a unidade, escreva três regras suas sobre o que a IA não deve fazer no RH.
          Veja o modelo abaixo.
        </p>
        <p className="text-sm text-muted-foreground">
          Modelo: “{LIMITE_MODELO}” Exemplos aceitáveis: {LIMITE_EXEMPLOS.join("; ")}.
        </p>
        <p className="text-xs text-muted-foreground">{LIMITE_NOTA}</p>
        <div className="grid gap-5 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="ac-glass space-y-3 p-5">
              <p className="eyebrow text-[var(--ac-accent)]">Limite {i + 1}</p>
              {LIMITE_CAMPOS.map((c) => (
                <Field
                  key={c.id}
                  id={`lim-${i}-${c.id}`}
                  label={c.label}
                  rows={2}
                  value={s.limites[i]?.[c.id] ?? ""}
                  onChange={(v) =>
                    patch((x) => ({
                      ...x,
                      limites: x.limites.map((l, li) => (li === i ? { ...l, [c.id]: v } : l)),
                    }))
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </Panel>
    );
  }

  /* ----------------------------------- U3 ---------------------------------- */
  if (step === 3) {
    const briefingOk = U3_BRIEFING_CAMPOS.every((c) => (s.u3[c.id] ?? "").trim());
    body = (
      <Panel eyebrow="Unidade 3" title={RH_UNITS[2]!.title}>
        {unitIntro(2, U3_TEXTO)}
        <div className="ac-glass space-y-2 p-5">
          <h3 className="text-lg font-medium">CICLO RH</h3>
          <ul className="space-y-1.5 text-[15px] text-muted-foreground">
            {CICLO_RH.map(([a, b]) => (
              <li key={a}>
                <strong className="text-foreground">{a}</strong> {b}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">{CICLO_NOTA}</p>
          <p className="text-sm text-muted-foreground">
            Dentro da etapa de instrução, use o PACTO do Módulo Start (Papel, Ação, Contexto, Tom e
            Output). Persona não é obrigatória e não confere credencial real à ferramenta.
          </p>
        </div>
        <CodeBlock label="Template de prompt RH" text={TEMPLATE_TEXTO} />
        <h3 className="text-xl font-medium">
          Atividade: preencha o briefing antes de pedir algo à IA
        </h3>
        <p className="text-sm text-muted-foreground">
          Um bom pedido começa por um briefing: você organiza o que precisa antes de escrever o
          prompt. Leia a demanda e a fonte e preencha cada campo com suas palavras.
        </p>
        <p className="text-sm text-muted-foreground">Demanda recebida: {U3_DEMANDA}</p>
        <FonteCard id="F3" />
        <div className="ac-glass space-y-4 p-5">
          {U3_BRIEFING_CAMPOS.map((c) => (
            <Field
              key={c.id}
              id={`u3-${c.id}`}
              label={c.label}
              rows={c.rows}
              value={s.u3[c.id] ?? ""}
              onChange={(v) => patch((x) => ({ ...x, u3: { ...x.u3, [c.id]: v } }))}
            />
          ))}
        </div>
        <LivreBox
          def={{
            id: "u3",
            pergunta: "Compare o seu briefing com o gabarito de referência.",
            ref: `${U3_GABARITO} ${U3_CRITERIO}`,
            pontos: U3_PONTOS,
          }}
          state={s.livres["u3"]}
          patch={patch}
          noTextarea
          ready={briefingOk}
        />
      </Panel>
    );
  }

  /* ------------------------------- U4 / U5 / U6 ----------------------------- */
  const taskUnit = (u: 4 | 5 | 6) => {
    const tasks = RH_TAREFAS.filter((t) => t.unidade === u);
    return (
      <Panel eyebrow={`Unidade ${u}`} title={RH_UNITS[u - 1]!.title}>
        {tasks.map((t) => (
          <div key={t.id} className="space-y-5">
            {unitIntro(u - 1, t.texto)}
            <FonteCard id={t.fonte} open />
            <TaskLab task={t} state={s.prompts[t.id]} patch={patch} nivel={nivel} />
            <GuiadoErros
              titulo={`Comparação guiada — resposta propositalmente inadequada (${t.codigo})`}
              inadequada={t.inadequada}
              erros={t.inadequadaErros}
              distratores={t.inadequadaDistratores}
              nota={t.feedbackInadequada}
              value={s.guiado[t.id]}
              onChange={(v) => patch((x) => ({ ...x, guiado: { ...x.guiado, [t.id]: v } }))}
            />
            {t.extras.map((e) => (
              <LivreBox key={e.id} def={e} state={s.livres[e.id]} patch={patch} />
            ))}
          </div>
        ))}
      </Panel>
    );
  };
  if (step === 4) body = taskUnit(4);
  if (step === 5) body = taskUnit(5);
  if (step === 6) body = taskUnit(6);

  /* ----------------------------------- U7 ---------------------------------- */
  if (step === 7) {
    const numOk = u7NumerosOk(s.u7);
    const setU7 = (k: keyof RhState["u7"], v: string) =>
      patch((x) => ({ ...x, u7: { ...x.u7, [k]: v } }));
    return (
      <Shell step={step} s={s} go={go} prog={prog} saveMsg={saveMsg}>
        <Panel eyebrow="Unidade 7" title={RH_UNITS[6]!.title}>
          {unitIntro(6, U7_TEXTO)}
          <FonteCard id="F5" open />
          <h3 className="text-xl font-medium">
            Exercício A: calcule a taxa de conclusão da integração e diga o que os dados não provam
          </h3>
          <p className="text-sm text-muted-foreground">
            Com a tabela da fonte F5 acima, preencha os números de cada mês e a taxa de conclusão.
            Depois registre as limitações e duas perguntas que você faria antes de tirar qualquer
            conclusão. Taxa = conclusões no prazo ÷ total de ingressantes do mesmo período × 100.
            Digite só números (ex.: 75).
          </p>
          <div className="ac-glass grid gap-4 p-5 sm:grid-cols-2">
            {(
              [
                ["marco", "Taxa de março (%)"],
                ["abril", "Taxa de abril (%)"],
                ["pp", "Diferença abril − março (pontos percentuais)"],
              ] as const
            ).map(([k, label]) => (
              <div key={k}>
                <label htmlFor={`u7-${k}`} className="text-sm font-medium">
                  {label}
                </label>
                <input
                  id={`u7-${k}`}
                  inputMode="decimal"
                  value={s.u7[k]}
                  onChange={(e) => setU7(k, e.target.value)}
                  className="mt-1.5 min-h-11 w-full px-3 text-[15px]"
                />
              </div>
            ))}
            <div>
              <label htmlFor="u7-maio" className="text-sm font-medium">
                Taxa de maio
              </label>
              <select
                id="u7-maio"
                value={s.u7.maio}
                onChange={(e) => setU7("maio", e.target.value)}
                className="mt-1.5 min-h-11 w-full px-3 text-[15px]"
              >
                <option value="">Selecione…</option>
                <option value="90">90%</option>
                <option value="18">18%</option>
                <option value="nao-calculavel">Não calculável com os dados fornecidos</option>
              </select>
            </div>
          </div>
          {(s.u7.marco || s.u7.abril || s.u7.pp || s.u7.maio) && (
            <Result ok={numOk}>
              {numOk ? (
                <>{U7A.notas.join(" ")}</>
              ) : (
                "Algum valor não confere ainda. Refaça a conta: numerador ÷ denominador, e lembre que a diferença entre taxas é em pontos percentuais."
              )}
            </Result>
          )}
          <LivreBox def={U7A_PERGUNTAS} state={s.livres[U7A_PERGUNTAS.id]} patch={patch} />
          <h3 className="text-xl font-medium">
            Exercício B: revise uma resposta de IA que tem falhas escondidas
          </h3>
          <p className="text-sm text-muted-foreground">
            Imagine que uma IA entregou o texto abaixo sobre os indicadores. Marque os problemas que
            você encontrar. Há alguns que não são problemas de verdade, então marque só o que você
            consegue justificar.
          </p>
          <GuiadoErros
            titulo="Resposta inadequada para revisar"
            inadequada={U7B.inadequada}
            erros={U7B.erros}
            distratores={U7B.distratores}
            nota="Taxa inventada, ausência de dados de turnover, causalidade não demonstrada e uso de IA não informado."
            value={s.u7b}
            onChange={(v) => patch((x) => ({ ...x, u7b: v }))}
          />
          <LivreBox def={U7B_LIVRE} state={s.livres[U7B_LIVRE.id]} patch={patch} />
          <h3 className="text-xl font-medium">Checklist CRIVO RH: confira uma das suas entregas</h3>
          <p className="text-sm text-muted-foreground">
            Escolha uma das suas entregas (por exemplo, o FAQ da unidade 5) e marque apenas os itens
            que você realmente conferiu nela. Depois conte qual entrega foi e o que encontrou.
          </p>
          <div className="ac-glass space-y-3 p-5">
            {CRIVO.map(([a, b], i) => (
              <label key={a} className="ac-choice flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={!!s.crivo.checks[i]}
                  onChange={(e) =>
                    patch((x) => ({
                      ...x,
                      crivo: { ...x.crivo, checks: { ...x.crivo.checks, [i]: e.target.checked } },
                    }))
                  }
                  className="mt-0.5 size-5"
                />
                <span>
                  <strong>{a}</strong>
                  <br />
                  <span className="text-xs text-muted-foreground">{b}</span>
                </span>
              </label>
            ))}
            <Field
              id="crivo-entrega"
              label="Qual entrega você conferiu e o que encontrou?"
              rows={3}
              value={s.crivo.entrega}
              onChange={(v) => patch((x) => ({ ...x, crivo: { ...x.crivo, entrega: v } }))}
            />
            <p className="text-xs text-muted-foreground">{CRIVO_NOTA}</p>
          </div>
        </Panel>
      </Shell>
    );
  }

  /* ----------------------------------- U8 ---------------------------------- */
  if (step === 8) {
    const lab = s.lab;
    const setLab = (fn: (l: RhState["lab"]) => RhState["lab"]) =>
      patch((x) => ({ ...x, lab: fn(x.lab) }));
    const setCampo = (k: string, v: string) =>
      setLab((l) => ({ ...l, campos: { ...l.campos, [k]: v } }));
    const g = LAB_GUIADO.inadequada[lab.guiadoIdx] ?? LAB_GUIADO.inadequada[0]!;
    body = (
      <Panel eyebrow="Unidade 8" title="Laboratório de teste e piloto">
        {unitIntro(7, U8_TEXTO)}
        <h3 className="text-xl font-medium">
          Laboratório: teste um dos seus prompts e registre o que aconteceu
        </h3>
        <p className="text-sm text-muted-foreground">
          Escolha um dos prompts que você escreveu nas unidades 4, 5 ou 6 e teste-o. Se você tem
          acesso a uma ferramenta de IA autorizada, rode o prompt lá com o caso fictício e cole o
          resultado aqui. Se não tem, use a comparação guiada. Em seguida preencha o formulário
          abaixo.
        </p>
        <div className="ac-glass space-y-3 p-5">
          <fieldset>
            <legend className="text-sm font-medium">Modalidade (registrada com o seu teste)</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {LAB_MODOS.map((m) => (
                <Choice
                  key={m.id}
                  selected={lab.modo === m.id}
                  onClick={() => setLab((l) => ({ ...l, modo: m.id }))}
                >
                  {m.label}
                </Choice>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Nenhuma execução externa é simulada: “Teste em ferramenta autorizada” significa que
              você mesmo(a) rodou o prompt fora daqui, com o caso fictício.
            </p>
          </fieldset>
          <p className="text-sm text-muted-foreground">{LAB_DICA}</p>
          {LAB_CAMPOS.filter((c) => lab.modo === "ferramenta" || c.id !== "saidaV1").map((c) => (
            <Field
              key={c.id}
              id={`lab-${c.id}`}
              label={c.label}
              rows={c.rows}
              value={lab.campos[c.id] ?? ""}
              onChange={(v) => setCampo(c.id, v)}
            />
          ))}
        </div>
        {lab.modo === "guiado" && (
          <div className="ac-glass space-y-4 p-5">
            <p className="text-sm font-medium">
              Comparação guiada: escolha uma resposta inadequada e aponte os problemas
            </p>
            <div className="flex flex-wrap gap-2">
              {LAB_GUIADO.inadequada.map(([nome], i) => (
                <Choice
                  key={nome}
                  selected={lab.guiadoIdx === i}
                  onClick={() => setLab((l) => ({ ...l, guiadoIdx: i, guiadoRevealed: false }))}
                >
                  {nome}
                </Choice>
              ))}
            </div>
            <blockquote className="ac-code text-[14.5px]">“{g[1]}”</blockquote>
            <Field
              id="lab-guiado"
              label="Quais problemas você encontrou? (pelo menos dois)"
              rows={3}
              value={lab.guiadoTexto}
              onChange={(v) => setLab((l) => ({ ...l, guiadoTexto: v }))}
              hint={LAB_GUIADO.dica}
            />
            {!lab.guiadoRevealed ? (
              <Button
                variant="outline"
                disabled={lab.guiadoTexto.trim().length < 15}
                onClick={() => setLab((l) => ({ ...l, guiadoRevealed: true }))}
              >
                Conferir com a fonte
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Problemas reais:</strong>{" "}
                {(g[0].startsWith("Vaga")
                  ? RH_TAREFAS[0]!.inadequadaErros
                  : g[0].startsWith("Onboarding")
                    ? RH_TAREFAS[1]!.inadequadaErros
                    : g[0].startsWith("FAQ")
                      ? RH_TAREFAS[2]!.inadequadaErros
                      : U7B.erros
                ).join(" ")}
              </p>
            )}
          </div>
        )}
        <h3 className="text-xl font-medium">
          Planeje um piloto de sete dias (só o plano, nada é executado)
        </h3>
        <p className="text-sm text-muted-foreground">
          Piloto é um teste pequeno e controlado. Abaixo está um roteiro de sete dias como exemplo.
          Leia e depois monte o seu plano com tarefa, período, responsável, critérios para parar e
          como decidir o próximo passo.
        </p>
        <ol className="list-decimal space-y-1 pl-6 text-[15px] text-muted-foreground">
          {PILOTO_DIAS.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ol>
        <p className="text-sm text-muted-foreground">{PILOTO_NOTA}</p>
        <fieldset className="ac-glass p-5">
          <legend className="px-1 text-base font-medium">
            Métricas propostas (escolha ao menos três)
          </legend>
          <div className="mt-2 grid gap-2">
            {METRICAS.map((m) => (
              <label key={m.id} className="ac-choice flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={!!s.metricas[m.id]}
                  onChange={(e) =>
                    patch((x) => ({ ...x, metricas: { ...x.metricas, [m.id]: e.target.checked } }))
                  }
                  className="mt-0.5 size-5"
                />
                <span>
                  <strong>{m.nome}:</strong> {m.def}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{METRICAS_NOTA}</p>
        </fieldset>
        <div className="ac-glass space-y-3 p-5">
          <p className="text-sm font-medium">Seu plano de piloto</p>
          <p className="text-xs text-muted-foreground">
            Motivos para interromper o uso (exemplos): {INTERRUPCAO_MOTIVOS.join("; ")}.
          </p>
          {PILOTO_CAMPOS.map((c) => (
            <Field
              key={c.id}
              id={`pil-${c.id}`}
              label={c.label}
              rows={c.rows}
              value={s.piloto[c.id] ?? ""}
              onChange={(v) => patch((x) => ({ ...x, piloto: { ...x.piloto, [c.id]: v } }))}
            />
          ))}
        </div>
      </Panel>
    );
  }

  if (step === 9) body = <RhQuiz s={s} patch={patch} />;

  /* ------------------------------ kit e conclusão --------------------------- */
  if (step === 10) {
    const comp = componentes(s);
    const feito = (b: boolean) => (b ? "concluída" : "pendente");
    body = (
      <Panel
        eyebrow="Unidade 8 · Kit Inicial de IA para RH"
        title={s.done ? "Módulo 1 concluído" : "Kit, avaliação e conclusão"}
      >
        <p className="text-sm text-muted-foreground">{MSG.avaliacaoAviso}</p>
        <div className="ac-glass overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Unidades e estado</caption>
            <tbody>
              {RH_UNITS.map((u, i) => (
                <tr key={u.title} className="border-t border-border first:border-0">
                  <th scope="row" className="px-5 py-3 font-medium">
                    U{i + 1} · {u.title}
                  </th>
                  <td className="px-5 py-3 text-muted-foreground">{feito(prog.units[i]!)}</td>
                </tr>
              ))}
              {RH_TAREFAS.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <th scope="row" className="px-5 py-3 font-medium">
                    {t.codigo} — {t.titulo}
                  </th>
                  <td className="px-5 py-3 text-muted-foreground">
                    {taskStatus(t.id, s.prompts[t.id])
                      .replace("nao", "não")
                      .replace("revisao necessaria", "revisão necessária")}
                    {taskNota(s.prompts[t.id]) !== undefined
                      ? ` · ${taskNota(s.prompts[t.id])}/100`
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ac-glass space-y-2 p-5">
          <h3 className="text-lg font-medium">
            Nota geral (autoavaliação guiada): {prog.nota}/100 — {faixaRh(prog.nota)}
          </h3>
          <p className="text-xs text-muted-foreground">
            {RH_MODALIDADE}. Mínimo para concluir: {RH_MIN_NOTA}.
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {COMPONENTES_NOTA.map((c) => (
              <li key={c.id}>
                {c.label} ({c.peso}%): <strong className="text-foreground">{comp[c.id]}</strong>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Componentes (exceto prompts) usam a escala {ESCALA_COMPONENTE.join(" · ")}, definida
            pelos campos realmente entregues, não pelo tamanho do texto. O quiz (
            {s.quiz.passed ? "aprovado" : "pendente"}) é requisito de consolidação e não entra na
            nota.
          </p>
        </div>
        {prog.criticos.length > 0 && (
          <div
            role="alert"
            className="rounded-3xl border border-amber-300/30 bg-amber-200/10 p-5 text-sm"
          >
            <strong>Pendências críticas de segurança em: {prog.criticos.join(", ")}.</strong>{" "}
            {ERROS_CRITICOS_DEF}
          </div>
        )}
        <div className="ac-glass space-y-3 p-5">
          <h3 className="text-lg font-medium">Atualizar o Perfil de Uso de IA</h3>
          <p className="text-sm text-muted-foreground">
            A atualização é guardada à parte: o perfil do Módulo Start é preservado.
          </p>
          <Button
            variant="outline"
            onClick={() => patch((x) => ({ ...x, perfil: buildRhPerfil(x) }))}
          >
            {s.perfil ? "Regenerar a partir do meu kit" : "Gerar atualização do perfil"}
          </Button>
          {s.perfil && (
            <>
              <label htmlFor="rh-perfil" className="sr-only">
                Atualização do perfil
              </label>
              <textarea
                id="rh-perfil"
                rows={12}
                value={s.perfil}
                onChange={(e) => patch((x) => ({ ...x, perfil: e.target.value }))}
                className="w-full px-3 py-2 font-mono text-[13.5px]"
              />
            </>
          )}
        </div>
        <div className="ac-glass flex flex-wrap items-center gap-3 p-5">
          <p className="mr-auto text-sm text-muted-foreground">
            Exporte o kit (guardado só neste navegador). Nenhuma aprovação humana é registrada por
            este sistema.
          </p>
          <Button
            variant="outline"
            onClick={() =>
              download(
                "kit-ia-rh.json",
                "application/json",
                JSON.stringify(rhExportData(s), null, 2),
              )
            }
          >
            <Download className="mr-2 size-4" /> JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => download("kit-ia-rh.md", "text/markdown", rhExportMarkdown(s))}
          >
            <Download className="mr-2 size-4" /> Markdown
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              void navigator.clipboard?.writeText(rhExportMarkdown(s)).then(
                () => window.alert("Kit copiado para a área de transferência."),
                () => window.alert("Não foi possível copiar. Use os botões de exportação."),
              );
            }}
          >
            Copiar texto do kit
          </Button>
        </div>
        {s.done ? (
          <div className="ac-glass space-y-4 p-6">
            <p className="text-lg leading-relaxed">{MSG.conclusao}</p>
            <p className="text-sm text-muted-foreground">
              Este módulo não emite o certificado do curso.
            </p>
            <Button disabled aria-disabled="true">
              {MSG.proximo}
            </Button>
          </div>
        ) : (
          <>
            {!prog.ready && (
              <p className="text-sm text-muted-foreground">
                Para concluir: as 8 unidades, nota geral ≥ {RH_MIN_NOTA}, nenhuma pendência crítica
                de segurança e o perfil atualizado. Faltam: {8 - prog.doneUnits} unidade(s)
                {prog.nota < RH_MIN_NOTA ? "; nota abaixo do mínimo" : ""}
                {s.perfil.trim() ? "" : "; gerar o perfil"}.
              </p>
            )}
            <Button
              disabled={!prog.ready}
              onClick={() => patch((x) => ({ ...x, done: true, doneAt: new Date().toISOString() }))}
            >
              Concluir o Módulo 1 de RH
            </Button>
          </>
        )}
      </Panel>
    );
  }

  return (
    <Shell step={step} s={s} go={go} prog={prog} saveMsg={saveMsg}>
      {body}
    </Shell>
  );
}

/* ---------------------------------- estrutura -------------------------------- */

function Shell({
  step,
  s,
  go,
  prog,
  saveMsg,
  children,
}: {
  step: number;
  s: RhState;
  go: (n: number) => void;
  prog: ReturnType<typeof rhProgress>;
  saveMsg: string;
  children: React.ReactNode;
}) {
  const unitOfStep = (i: number) => (i >= 1 && i <= 7 ? i - 1 : i >= 8 ? 7 : -1);
  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Unidades do Módulo 1 de RH">
        <div className="ac-glass p-5">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow text-muted-foreground">Módulo 1 · RH</p>
            <span className="text-sm text-muted-foreground">{prog.percent}%</span>
          </div>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={prog.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="ac-bar h-full rounded-full" style={{ width: `${prog.percent}%` }} />
          </div>
          <ol className="mt-4 hidden space-y-0.5 lg:block">
            {STEPS.map((label, i) => {
              const u = unitOfStep(i);
              const done = u >= 0 && i !== 9 && i !== 10 && prog.units[u];
              return (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={i === step ? "step" : undefined}
                    className={`ac-step ${i === step ? "is-current" : ""}`}
                  >
                    <span className="ac-step-n">{done ? <Check className="size-3" /> : i + 1}</span>
                    <span className="flex-1 text-left">{label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-xs text-muted-foreground lg:hidden">
            Etapa {step + 1} de {STEPS.length} · {STEPS[step]}
          </p>
          <p className="mt-4 text-xs text-muted-foreground" role="status">
            {saveMsg}
          </p>
          <Link to="/academy/apostila-rh-1" className="mt-3 block text-sm text-[var(--ac-accent)]">
            Apostila de apoio →
          </Link>
          <button
            type="button"
            onClick={() => go(10)}
            className="mt-2 block min-h-9 text-sm text-[var(--ac-accent)]"
          >
            Ver meu kit →
          </button>
        </div>
      </aside>
      <div className="min-w-0">
        {children}
        {!s.done && (
          <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6">
            <Button variant="outline" disabled={step === 0} onClick={() => go(step - 1)}>
              <ChevronLeft className="mr-1 size-4" /> Voltar
            </Button>
            {step < LAST && step !== 0 && (
              <Button onClick={() => go(step + 1)}>
                Continuar <ChevronRight className="ml-1 size-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { Link, createFileRoute } from "@tanstack/react-router";
import { GovernanceRules } from "@/components/academy/GovernanceRules";
import { TaskRunner } from "@/components/academy/TaskRunner";
import { Textarea } from "@/components/ui/textarea";
import { AREA_BY_ID } from "@/lib/academy/areas";
import { MODULES } from "@/lib/academy/course";
import { isUnlocked, moduleProgress, updateAcademy, useAcademy } from "@/lib/academy/store";

export const Route = createFileRoute("/academy/semana/$n")({ component: WeekPage });

function WeekPage() {
  const { n } = Route.useParams();
  const idx = Number(n);
  const m = MODULES[idx];
  const { state, ready } = useAcademy();
  if (!m)
    return (
      <p>
        Módulo não encontrado.{" "}
        <Link to="/academy/painel" className="underline">
          Voltar ao painel
        </Link>
      </p>
    );
  if (!ready) return <p className="text-muted-foreground">Carregando…</p>;
  if (!state.profile)
    return (
      <p>
        Faça o{" "}
        <Link to="/academy/diagnostico" className="underline underline-offset-4">
          diagnóstico
        </Link>{" "}
        para liberar sua trilha.
      </p>
    );
  if (!isUnlocked(idx, state)) {
    return (
      <div className="max-w-xl">
        <h1 className="display text-4xl">Etapa bloqueada.</h1>
        <p className="mt-4 text-muted-foreground">
          Conclua {idx === 1 ? "o Módulo 0" : `a Semana ${idx - 1}`} (tarefas, checklist e
          entregável) para liberar esta etapa.
        </p>
        <Link to="/academy/painel" className="mt-6 inline-block underline underline-offset-4">
          Voltar ao painel
        </Link>
      </div>
    );
  }
  const area = AREA_BY_ID[state.profile.area];
  const pr = moduleProgress(idx, state);
  const nextOpen = idx < MODULES.length - 1;
  return (
    <article className="mx-auto max-w-3xl space-y-14">
      <header>
        <p className="eyebrow text-muted-foreground">
          {idx === 0 ? "Módulo 0" : `Semana ${idx}`} · {area.name} · ~{m.minutes} min
        </p>
        <h1 className="display mt-4 text-[clamp(2.2rem,6vw,4rem)]">{m.title}</h1>
        <div className="mt-6 h-1 bg-border">
          <div className="h-full bg-foreground" style={{ width: `${pr.percent}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {pr.doneUnits} de {pr.total} itens concluídos
        </p>
      </header>

      <section aria-labelledby="obj">
        <h2 id="obj" className="eyebrow text-muted-foreground">
          Objetivo de aprendizagem
        </h2>
        <p className="mt-3 text-xl leading-relaxed">{m.objective}</p>
        <p className="mt-4 leading-relaxed text-muted-foreground">{m.intro}</p>
      </section>

      <section aria-labelledby="ess">
        <h2 id="ess" className="eyebrow text-muted-foreground">
          Conteúdo essencial
        </h2>
        <ul className="mt-4 space-y-3">
          {m.essentials.map((e) => (
            <li key={e} className="border-l-2 border-border pl-4 leading-relaxed">
              {e}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="app" className="border border-border p-6">
        <h2 id="app" className="eyebrow text-muted-foreground">
          Exemplo aplicado à sua área
        </h2>
        <p className="mt-3 leading-relaxed">{m.applied(area)}</p>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm underline underline-offset-4">
            Modelo de prompt para {area.name}
          </summary>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap border border-border p-4 text-xs leading-relaxed">
            {area.template}
          </pre>
        </details>
      </section>

      <section aria-labelledby="tasks">
        <h2 id="tasks" className="text-2xl font-medium tracking-tight">
          Tarefas interativas
        </h2>
        <ul className="mt-6 space-y-4">
          {m.tasks.map((t, i) => (
            <TaskRunner key={t.id} task={t} index={i} state={state} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="ch" className="border border-border p-6">
        <h2 id="ch" className="eyebrow text-muted-foreground">
          Desafio prático (no seu trabalho)
        </h2>
        <p className="mt-3 leading-relaxed">{m.challenge(area)}</p>
      </section>

      {idx === 8 && (
        <section aria-labelledby="gov">
          <h2 id="gov" className="text-2xl font-medium tracking-tight">
            Regras de governança e segurança
          </h2>
          <div className="mt-6">
            <GovernanceRules />
          </div>
        </section>
      )}

      <section aria-labelledby="chk">
        <h2 id="chk" className="text-2xl font-medium tracking-tight">
          Checklist
        </h2>
        <ul className="mt-4 space-y-2">
          {m.checklist.map((c, i) => (
            <li key={c}>
              <label className="flex min-h-12 cursor-pointer items-center gap-3 border border-border px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-white"
                  checked={!!state.checks[`${idx}:${i}`]}
                  onChange={(e) =>
                    updateAcademy((s) => ({
                      ...s,
                      checks: { ...s.checks, [`${idx}:${i}`]: e.target.checked },
                    }))
                  }
                />
                {c}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="del">
        <h2 id="del" className="text-2xl font-medium tracking-tight">
          Entregável da semana
        </h2>
        <p className="mt-3 text-muted-foreground">{m.deliverable(area)}</p>
        <label htmlFor="deliv" className="sr-only">
          Seu entregável
        </label>
        <Textarea
          id="deliv"
          rows={6}
          className="mt-4 text-base"
          placeholder="Escreva aqui (mínimo 60 caracteres). Não inclua dados pessoais ou confidenciais."
          value={state.deliverables[idx] ?? ""}
          onChange={(e) =>
            updateAcademy((s) => ({
              ...s,
              deliverables: { ...s.deliverables, [idx]: e.target.value },
            }))
          }
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {(state.deliverables[idx] ?? "").trim().length}/60 caracteres mínimos
        </p>
      </section>

      <footer className="border-t border-border pt-8">
        {pr.complete ? (
          <div>
            <p className="font-medium">Etapa concluída.</p>
            <p className="mt-1 text-sm text-muted-foreground">Próxima etapa: {m.next}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {nextOpen ? (
                <Link
                  to="/academy/semana/$n"
                  params={{ n: String(idx + 1) }}
                  className="inline-flex min-h-12 items-center bg-foreground px-6 text-sm font-medium text-background"
                >
                  Ir para a Semana {idx + 1}
                </Link>
              ) : (
                <Link
                  to="/academy/certificado"
                  className="inline-flex min-h-12 items-center bg-foreground px-6 text-sm font-medium text-background"
                >
                  Ir para o certificado
                </Link>
              )}
              <Link
                to="/academy/biblioteca"
                className="inline-flex min-h-12 items-center border border-border px-6 text-sm"
              >
                Abrir biblioteca
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Para concluir: todas as tarefas, o checklist completo e o entregável com ao menos 60
            caracteres. Tarefas não concluídas podem ser refeitas quantas vezes quiser.
          </p>
        )}
      </footer>
    </article>
  );
}

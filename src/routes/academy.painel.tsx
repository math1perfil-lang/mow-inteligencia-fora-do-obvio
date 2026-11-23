import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AREA_BY_ID } from "@/lib/academy/areas";
import { MODULES } from "@/lib/academy/course";
import { CRITERIA } from "@/lib/academy/feedback";
import { isUnlocked, moduleProgress, overall, resetAcademy, useAcademy } from "@/lib/academy/store";

export const Route = createFileRoute("/academy/painel")({ component: Dashboard });

const LEVEL = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
} as const;
const DIM_LABEL = [
  "Frequência de uso",
  "Qualidade dos prompts",
  "Segurança de dados",
  "Verificação",
  "Uso em processos",
  "Liderança de adoção",
];

function Dashboard() {
  const { state, ready } = useAcademy();
  if (!ready) return <p className="text-muted-foreground">Carregando seu painel…</p>;
  const p = state.profile;
  if (!p) {
    return (
      <div className="max-w-xl">
        <h1 className="display text-4xl">Comece pelo diagnóstico.</h1>
        <p className="mt-4 text-muted-foreground">
          Ele define sua área, seu nível e a sua trilha personalizada. Leva cerca de 3 minutos.
        </p>
        <Link
          to="/academy/diagnostico"
          className="mt-8 inline-flex min-h-12 items-center bg-foreground px-6 text-sm font-medium text-background"
        >
          Fazer o diagnóstico
        </Link>
      </div>
    );
  }
  const area = AREA_BY_ID[p.area];
  const o = overall(state);
  const promptsApproved = state.prompts.filter((x) => x.status === "aprovado").length;
  const avg = state.prompts.length
    ? Math.round((state.prompts.reduce((a, b) => a + b.quality, 0) / state.prompts.length) * 10) /
      10
    : null;
  const next = o.current;
  const badges = [
    { t: "Primeiro prompt avaliado", ok: (state.done["m0-t3"] ?? 0) > 0 },
    { t: "Módulo 0 concluído", ok: moduleProgress(0, state).complete },
    { t: "5 prompts na biblioteca", ok: state.prompts.length >= 5 },
    { t: "Metade do curso (Semana 4)", ok: moduleProgress(4, state).complete },
    { t: "Curso completo", ok: o.completed === MODULES.length },
  ];

  return (
    <div className="space-y-14">
      <header>
        <p className="eyebrow text-muted-foreground">Seu painel</p>
        <h1 className="display mt-4 text-[clamp(2.2rem,6vw,4.5rem)]">{area.name}</h1>
        <p className="mt-4 text-muted-foreground">
          Nível {LEVEL[p.level]} · Objetivo: {p.goal}
        </p>
      </header>

      <section aria-label="Progresso" className="border border-border p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-2xl font-medium tracking-tight">{o.percent}% concluído</p>
          <p className="text-sm text-muted-foreground">
            {o.completed} de {MODULES.length} módulos · cerca de{" "}
            {Math.max(0, Math.round(o.minutesLeft / 6) / 10)} h restantes
          </p>
        </div>
        <div
          className="mt-4 h-1.5 bg-border"
          role="progressbar"
          aria-valuenow={o.percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full bg-foreground" style={{ width: `${o.percent}%` }} />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <span className="eyebrow text-muted-foreground">Próxima ação recomendada</span>
          {next !== undefined ? (
            <Link
              to="/academy/semana/$n"
              params={{ n: String(next) }}
              className="inline-flex min-h-11 items-center bg-foreground px-5 text-sm font-medium text-background"
            >
              {next === 0 ? "Continuar o Módulo 0" : `Continuar a Semana ${next}`}
            </Link>
          ) : (
            <Link
              to="/academy/certificado"
              className="inline-flex min-h-11 items-center bg-foreground px-5 text-sm font-medium text-background"
            >
              Ir para o certificado
            </Link>
          )}
        </div>
      </section>

      <section
        aria-label="Números"
        className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          ["Prompts criados", String(state.prompts.length)],
          ["Prompts aprovados", String(promptsApproved)],
          ["Qualidade média", avg === null ? "—" : `${avg}/10`],
          [
            "Tarefas concluídas",
            `${Object.keys(state.done).length}/${MODULES.reduce((a, m) => a + m.tasks.length, 0)}`,
          ],
        ].map(([l, v]) => (
          <div key={l} className="bg-background p-5">
            <p className="eyebrow text-muted-foreground">{l}</p>
            <p className="mt-3 text-3xl font-medium tracking-tight">{v}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="trail">
        <h2 id="trail" className="text-2xl font-medium tracking-tight">
          Sua trilha
        </h2>
        <ol className="mt-6 border-t border-border">
          {MODULES.map((m) => {
            const pr = moduleProgress(m.n, state);
            const open = isUnlocked(m.n, state);
            return (
              <li
                key={m.n}
                className="grid items-center gap-3 border-b border-border py-4 md:grid-cols-12"
              >
                <span className="eyebrow text-muted-foreground md:col-span-2">
                  {m.n === 0 ? "Módulo 0" : `Semana ${m.n}`}
                </span>
                <span className="font-medium md:col-span-6">{m.title}</span>
                <span className="text-sm text-muted-foreground md:col-span-2">
                  {pr.complete ? "Concluído" : open ? `${pr.percent}%` : "Bloqueado"}
                </span>
                <span className="md:col-span-2 md:text-right">
                  {open ? (
                    <Link
                      to="/academy/semana/$n"
                      params={{ n: String(m.n) }}
                      className="text-sm underline underline-offset-4"
                    >
                      {pr.complete ? "Revisar" : pr.percent > 0 ? "Continuar" : "Começar"}
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">Conclua a etapa anterior</span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid gap-10 md:grid-cols-2">
        <section aria-labelledby="profile">
          <h2 id="profile" className="text-2xl font-medium tracking-tight">
            Perfil de uso de IA
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu ponto de partida no diagnóstico ({p.score}/100). Mostra onde focar.
          </p>
          <ul className="mt-5 space-y-3">
            {DIM_LABEL.map((l, i) => (
              <li key={l}>
                <div className="flex justify-between text-sm">
                  <span>{l}</span>
                  <span className="text-muted-foreground">{p.dims[i] ?? 0}/3</span>
                </div>
                <div className="mt-1 h-1 bg-border">
                  <div
                    className="h-full bg-foreground"
                    style={{ width: `${((p.dims[i] ?? 0) / 3) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Critérios avaliados nos prompts: {CRITERIA.map((c) => c.label.toLowerCase()).join(", ")}
            .
          </p>
        </section>
        <section aria-labelledby="ach">
          <h2 id="ach" className="text-2xl font-medium tracking-tight">
            Marcos
          </h2>
          <ul className="mt-5 space-y-2">
            {badges.map((b) => (
              <li
                key={b.t}
                className={`flex items-center gap-3 border p-3 text-sm ${b.ok ? "border-foreground" : "border-border text-muted-foreground"}`}
              >
                <span aria-hidden>{b.ok ? "●" : "○"}</span>
                {b.t}
              </li>
            ))}
          </ul>
          <h3 className="mt-8 text-base font-medium">Indicadores da sua área</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Meça antes e depois de aplicar IA: {area.indicadores.join("; ")}.
          </p>
        </section>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <Link
          to="/academy/diagnostico"
          className="inline-flex min-h-11 items-center border border-border px-5 text-sm hover:border-foreground"
        >
          Refazer diagnóstico
        </Link>
        <Button
          variant="ghost"
          onClick={() => {
            if (window.confirm("Apagar todo o progresso e os prompts salvos neste navegador?"))
              resetAcademy();
          }}
        >
          Apagar meus dados deste navegador
        </Button>
      </div>
    </div>
  );
}

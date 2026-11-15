import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { buildSteps } from "@/lib/admin/questions";
import { SECTORS, getSector } from "@/lib/admin/sectors";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/roteiros")({
  component: Scripts,
});

function Scripts() {
  const [sectorKey, setSectorKey] = useState(SECTORS[0]!.key);
  const sector = getSector(sectorKey);
  const steps = buildSteps(sector).filter((s) => s.questions.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Roteiros</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consulta dos roteiros de cada setor, para ler antes de ir a campo. Edite em src/lib/admin/sectors.ts.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SECTORS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSectorKey(s.key)}
            aria-pressed={s.key === sectorKey}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm transition-colors",
              s.key === sectorKey ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <blockquote className="rounded-lg border border-border bg-card p-4 text-sm leading-relaxed">
        {sector.opening}
      </blockquote>

      {steps.map((step) => (
        <section key={step.id} className="space-y-3 rounded-lg border border-border bg-card p-5">
          <h2 className="font-semibold">
            {step.title}
            {step.minutes ? <span className="ml-2 text-sm font-normal text-muted-foreground">{step.minutes} min</span> : null}
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {step.questions.map((q) => (
              <li key={q.key}>{q.label}</li>
            ))}
          </ol>
        </section>
      ))}

      <section className="space-y-3 rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">Funções para a priorização</h2>
        <ul className="space-y-2 text-sm">
          {sector.features.map((f) => (
            <li key={f.key}>
              <span className="font-medium">{f.title}.</span> <span className="text-muted-foreground">{f.description}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

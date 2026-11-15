import { useEffect, useMemo, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { NewInterviewDialog } from "@/components/admin/NewInterviewDialog";
import { Button } from "@/components/ui/button";
import { loadAnalysisData, type AnalysisData } from "@/lib/admin/api";
import { computeAnalysis } from "@/lib/admin/analysis";
import { SECTORS, sectorDisplayName } from "@/lib/admin/sectors";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    loadAnalysisData()
      .then((d) => active && setData(d))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, []);

  const analysis = useMemo(() => (data ? computeAnalysis(data) : null), [data]);
  const drafts = data ? data.interviews.filter((i) => i.status === "rascunho") : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Painel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão geral das entrevistas de validação em todos os setores.
          </p>
        </div>
        <NewInterviewDialog>
          <Button>
            <Plus /> Nova entrevista
          </Button>
        </NewInterviewDialog>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível carregar os dados. Confira se a migração do banco foi executada.
        </p>
      ) : null}

      {data?.schemaOutdated ? (
        <p role="alert" className="rounded-md border border-destructive p-4 text-sm text-destructive">
          O banco ainda não recebeu a migração multi-setor. Rode as 3 partes do SQL no Supabase para criar e editar
          entrevistas.
        </p>
      ) : null}

      {analysis ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Entrevistas" value={analysis.total} />
            <Stat label="Concluídas" value={analysis.completed.length} />
            <Stat label="Em rascunho" value={drafts.length} />
            <Stat label="Aceitam testar pagando" value={analysis.willingToPay} hint="Compromisso forte ou muito forte" />
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Setores</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SECTORS.map((s) => {
                const summary = analysis.sectors.find((x) => x.key === s.key);
                return (
                  <div key={s.key} className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-card p-5">
                    <div>
                      <p className="font-medium">{s.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {summary
                          ? `${summary.completed} concluídas de ${summary.total} · ${summary.willing} aceitam pagar`
                          : "Nenhuma entrevista ainda"}
                      </p>
                      {summary?.topPain ? (
                        <p className="mt-2 text-sm">
                          Dor mais citada: <span className="font-medium">{summary.topPain}</span> ({summary.topPainCount})
                        </p>
                      ) : null}
                    </div>
                    <NewInterviewDialog defaultSector={s.key}>
                      <Button variant="outline" size="sm" className="self-start">
                        Entrevistar este setor
                      </Button>
                    </NewInterviewDialog>
                  </div>
                );
              })}
            </div>
          </section>

          {drafts.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Continuar rascunhos</h2>
              <ul className="divide-y divide-border rounded-lg border border-border bg-card">
                {drafts.slice(0, 5).map((i) => (
                  <li key={i.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-accent"
                      onClick={() => void navigate({ to: "/admin/entrevistas/$id", params: { id: i.id } })}
                    >
                      <span className="font-medium">{i.company_name || "Sem nome"}</span>
                      <span className="text-muted-foreground">{sectorDisplayName(i.sector_key, i.sector_custom_name)}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <Link to="/admin/entrevistas" className="text-sm text-muted-foreground underline underline-offset-4">
                Ver todas as entrevistas
              </Link>
            </section>
          ) : null}
        </>
      ) : !error ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : null}
    </div>
  );
}

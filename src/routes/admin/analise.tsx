import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { loadAnalysisData, type AnalysisData } from "@/lib/admin/api";
import { buildCsv, computeAnalysis, downloadCsv, formatBrl } from "@/lib/admin/analysis";
import { DECISION_RULE, SIZE_LABELS, labelFrom } from "@/lib/admin/questions";
import { SECTORS, sectorDisplayName } from "@/lib/admin/sectors";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/analise")({
  component: AnalysisPage,
});

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function BarRows({ rows }: { rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="space-y-1">
          <div className="flex justify-between gap-3 text-sm">
            <span>{r.label}</span>
            <span className="tabular-nums text-muted-foreground">{r.count}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function AnalysisPage() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState(false);
  const [sectorKey, setSectorKey] = useState("todos");

  useEffect(() => {
    let active = true;
    loadAnalysisData()
      .then((d) => active && setData(d))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, []);

  const analysis = useMemo(() => (data ? computeAnalysis(data, sectorKey) : null), [data, sectorKey]);

  if (error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Não foi possível carregar a análise.
      </p>
    );
  }
  if (!data || !analysis) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  const exportCsv = () => {
    downloadCsv(`entrevistas-${new Date().toISOString().slice(0, 10)}.csv`, buildCsv(data));
    toast.success("CSV gerado.");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Análise</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Considera só as entrevistas concluídas ({analysis.completed.length} de {analysis.total}).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Setor"
            className="h-9 rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={sectorKey}
            onChange={(e) => setSectorKey(e.target.value)}
          >
            <option value="todos">Todos os setores</option>
            {SECTORS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={exportCsv} disabled={data.interviews.length === 0}>
            Exportar CSV
          </Button>
        </div>
      </div>

      {analysis.decision ? (
        <div
          className={cn(
            "rounded-lg border bg-card p-5",
            analysis.decision.kind === "seguir" ? "border-primary" : "border-border",
          )}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Quadro de decisão (sugestão, não é decisão automática)
          </p>
          <p className="mt-2 text-lg font-semibold">{analysis.decision.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{analysis.decision.reason}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Regra: seguir se {DECISION_RULE.minSamePain}+ entrevistados citam a mesma dor e {DECISION_RULE.minWillingToPay}+
            aceitam testar pagando (compromisso forte ou muito forte), com pelo menos {DECISION_RULE.minInterviews}{" "}
            entrevistas no setor. Ajuste os limites em src/lib/admin/questions.ts.
          </p>
        </div>
      ) : (
        <Block title="Decisão por setor (sugestão)">
          {analysis.sectors.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda não há entrevistas.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Setor</TableHead>
                    <TableHead className="text-right">Concluídas</TableHead>
                    <TableHead>Dor mais citada</TableHead>
                    <TableHead className="text-right">Aceitam pagar</TableHead>
                    <TableHead>Sugestão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.sectors.map((sec) => (
                    <TableRow key={sec.key}>
                      <TableCell className="font-medium">{sec.label}</TableCell>
                      <TableCell className="text-right tabular-nums">{sec.completed}</TableCell>
                      <TableCell>{sec.topPain ? `${sec.topPain} (${sec.topPainCount})` : "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{sec.willing}</TableCell>
                      <TableCell>{sec.decision.title}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Block>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Concluídas</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{analysis.completed.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Aceitam testar pagando</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{analysis.willingToPay}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Rascunhos</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{analysis.total - analysis.completed.length}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {sectorKey === "todos" ? (
          <Block title="Por setor">
            <BarRows rows={analysis.bySector} />
          </Block>
        ) : null}
        <Block title="Por porte">
          <BarRows rows={analysis.bySize} />
        </Block>
        <Block title="Nível de compromisso">
          <BarRows rows={analysis.byCommitment} />
        </Block>
        <Block title="Funções: ranking de escolhas">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Função</TableHead>
                  <TableHead className="text-right">1ª</TableHead>
                  <TableHead className="text-right">2ª</TableHead>
                  <TableHead className="text-right">Sem diferença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.features.map((f) => (
                  <TableRow key={f.key}>
                    <TableCell>{f.title}</TableCell>
                    <TableCell className="text-right tabular-nums">{f.first}</TableCell>
                    <TableCell className="text-right tabular-nums">{f.second}</TableCell>
                    <TableCell className="text-right tabular-nums">{f.noDifference}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Block>
      </div>

      <Block title="Oportunidades: dores por pontuação (entrevistas × gravidade média)">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dor</TableHead>
                <TableHead className="text-right">Entrevistas</TableHead>
                <TableHead className="text-right">Gravidade média</TableHead>
                <TableHead className="text-right">Aceitam pagar</TableHead>
                <TableHead className="text-right">Pontuação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.byPain
                .filter((p) => p.count > 0)
                .map((p) => (
                  <TableRow key={p.key}>
                    <TableCell>{p.label}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.count}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.avgSeverity === null ? "—" : p.avgSeverity.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{p.willing}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{p.score.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              {analysis.byPain.every((p) => p.count === 0) ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    Classifique a dor principal nas entrevistas concluídas.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </Block>

      <Block title="Faixa de preço (R$ por mês)">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pergunta</TableHead>
                <TableHead className="text-right">Respostas</TableHead>
                <TableHead className="text-right">Mediana</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
                <TableHead className="text-right">Máximo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.prices.map((p) => (
                <TableRow key={p.label}>
                  <TableCell>{p.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.count}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBrl(p.median)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBrl(p.min)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBrl(p.max)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Block>

      <Block title="Respostas sobre dor, empresa por empresa">
        {analysis.painAnswers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não há entrevistas concluídas.</p>
        ) : (
          <div className="space-y-5">
            {analysis.painAnswers.map(({ interview, items }) => (
              <div key={interview.id} className="space-y-2 border-t border-border pt-4 first:border-t-0 first:pt-0">
                <p className="text-sm font-medium">
                  {interview.company_name || "Sem nome"}{" "}
                  <span className="font-normal text-muted-foreground">
                    · {sectorDisplayName(interview.sector_key, interview.sector_custom_name)} ·{" "}
                    {labelFrom(SIZE_LABELS, interview.company_size)}
                  </span>
                </p>
                {items.map((it) => (
                  <p key={it.label} className="text-sm">
                    <span className="text-muted-foreground">{it.label}: </span>
                    {it.text.trim() || "—"}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}
      </Block>
    </div>
  );
}

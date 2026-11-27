import { useState, type FormEvent } from "react";
import { Database, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { importSourceCatalogForDomain } from "@/lib/mow-gki/openalex.functions";
import { PROBLEM_DOMAINS } from "@/lib/method-factory/brief-schema";
import type { ImportReport } from "@/lib/mow-gki/server/source-catalog-importer";

const SKIP_LABELS: Record<string, string> = {
  no_open_license: "sem licença aberta",
  no_url: "sem página de acesso",
  unsafe_url: "endereço bloqueado por segurança",
  download_failed: "não foi possível baixar",
  pdf_not_supported: "em PDF (ainda não suportado)",
  unsupported_type: "formato não suportado",
  too_large: "arquivo grande demais",
  too_short: "texto curto demais (provável página de resumo)",
};

export function SourceCatalogImportPanel() {
  const [domain, setDomain] = useState<string>(PROBLEM_DOMAINS[0]);
  const [queriesText, setQueriesText] = useState("");
  const [perQuery, setPerQuery] = useState(10);
  const [fullText, setFullText] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);

  const queries = queriesText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (queries.length === 0 || queries.length > 10) {
      setError("Informe de 1 a 10 buscas, uma por linha.");
      return;
    }
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      const result = await importSourceCatalogForDomain({
        data: { domain: domain as (typeof PROBLEM_DOMAINS)[number], queries, perQuery, fullText },
      });
      setReport(result);
    } catch {
      setError(
        "Não foi possível importar. Confira se as migrações do acervo foram aplicadas e se as buscas têm até 12 palavras.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="mt-8 border border-border p-5 sm:p-7"
      aria-labelledby="catalog-import-title"
    >
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
        Área interna · owner ativo
      </p>
      <h2 id="catalog-import-title" className="mt-3 text-xl font-semibold">
        Acervo de fontes: importar da OpenAlex
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Escolha uma área e escreva buscas por tema (uma por linha). As obras encontradas entram no
        acervo com título, autores, ano e link aberto. Com a opção de texto completo, o sistema
        também guarda o texto das obras de licença aberta que tenham página em HTML; PDFs ficam de
        fora por enquanto.
      </p>

      <form className="mt-5 space-y-4" onSubmit={handleImport}>
        <div className="space-y-2">
          <Label htmlFor="catalog-domain">Área de conhecimento</Label>
          <select
            id="catalog-domain"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={domain}
            onChange={(event) => setDomain(event.currentTarget.value)}
          >
            {PROBLEM_DOMAINS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="catalog-queries">Buscas (uma por linha, até 10)</Label>
          <textarea
            id="catalog-queries"
            className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={queriesText}
            onChange={(event) => setQueriesText(event.currentTarget.value)}
            placeholder={"sales funnel optimization\ncustomer retention b2b"}
          />
        </div>
        <div className="flex flex-wrap items-end gap-6">
          <div className="space-y-2">
            <Label htmlFor="catalog-per-query">Obras por busca</Label>
            <select
              id="catalog-per-query"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={perQuery}
              onChange={(event) => setPerQuery(Number(event.currentTarget.value))}
            >
              {[5, 10, 20, 25].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={fullText}
              onChange={(event) => setFullText(event.currentTarget.checked)}
            />
            Tentar guardar o texto completo (fontes abertas em HTML)
          </label>
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? (
            <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Database className="mr-2 size-4" aria-hidden="true" />
          )}
          {busy ? "Importando…" : "Importar para o acervo"}
        </Button>
      </form>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {report ? (
        <div className="mt-5 space-y-2 text-sm" role="status">
          <p className="font-semibold">
            {report.found} obra(s): {report.inserted} nova(s), {report.updated} já existente(s).
            {fullText ? ` Textos guardados: ${report.textStored}.` : ""}
          </p>
          {Object.keys(report.textSkipped).length > 0 ? (
            <ul className="list-disc pl-5 text-muted-foreground">
              {Object.entries(report.textSkipped).map(([reason, count]) => (
                <li key={reason}>
                  {count} sem texto: {SKIP_LABELS[reason] ?? reason}
                </li>
              ))}
            </ul>
          ) : null}
          {report.queryErrors.length > 0 ? (
            <p className="text-muted-foreground">
              Buscas que falharam: {report.queryErrors.join("; ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

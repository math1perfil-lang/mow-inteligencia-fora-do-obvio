import { Link, createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { APOSTILA_TITULO, buildApostila } from "@/lib/academy/apostila";

export const Route = createFileRoute("/academy/start/apostila")({
  head: () => ({ meta: [{ title: "Apostila do Módulo Start — MOW Academy" }] }),
  component: Apostila,
});

/** Renderização simples do Markdown da apostila (títulos, listas, tabelas, código, citações). */
function render(md: string) {
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  let k = 0;
  const inline = (t: string) =>
    t
      .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
      .map((p, j) =>
        p.startsWith("**") ? (
          <strong key={j}>{p.slice(2, -2)}</strong>
        ) : p.startsWith("*") && p.length > 2 ? (
          <em key={j}>{p.slice(1, -1)}</em>
        ) : (
          p
        ),
      );
  while (i < lines.length) {
    const l = lines[i]!;
    if (l.startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.startsWith("```")) buf.push(lines[i++]!);
      i++;
      out.push(
        <pre
          key={k++}
          className="ac-code whitespace-pre-wrap font-sans text-[14px] leading-relaxed"
        >
          {buf.join("\n")}
        </pre>,
      );
    } else if (l.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i]!.startsWith("|")) {
        const cells = lines[i]!.split("|")
          .slice(1, -1)
          .map((c) => c.trim());
        if (!cells.every((c) => /^:?-+:?$/.test(c))) rows.push(cells);
        i++;
      }
      out.push(
        <div key={k++} className="ac-glass overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {rows[0]!.map((c, j) => (
                  <th key={j} className="px-4 py-2 font-medium">
                    {inline(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((r, ri) => (
                <tr key={ri} className="border-t border-border">
                  {r.map((c, j) => (
                    <td key={j} className="px-4 py-2 text-muted-foreground">
                      {inline(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
    } else if (/^\s*- /.test(l)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*- /.test(lines[i]!))
        items.push(lines[i++]!.replace(/^\s*- (\[ \] )?/, (m, c) => (c ? "☐ " : "")));
      out.push(
        <ul key={k++} className="list-disc space-y-1 pl-6 text-[15px] text-muted-foreground">
          {items.map((t, j) => (
            <li key={j}>{inline(t)}</li>
          ))}
        </ul>,
      );
    } else if (/^\d+\. /.test(l)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i]!))
        items.push(lines[i++]!.replace(/^\d+\. /, ""));
      out.push(
        <ol key={k++} className="list-decimal space-y-1 pl-6 text-[15px] text-muted-foreground">
          {items.map((t, j) => (
            <li key={j}>{inline(t)}</li>
          ))}
        </ol>,
      );
    } else if (l.startsWith("### ")) {
      out.push(
        <h3 key={k++} className="mt-4 text-xl font-medium">
          {l.slice(4)}
        </h3>,
      );
      i++;
    } else if (l.startsWith("## ")) {
      out.push(
        <h2 key={k++} className="mt-12 text-3xl font-light">
          {l.slice(3)}
        </h2>,
      );
      i++;
    } else if (l.startsWith("# ")) {
      out.push(
        <h1 key={k++} className="text-[clamp(1.8rem,4vw,2.8rem)] font-light">
          {l.slice(2)}
        </h1>,
      );
      i++;
    } else if (l.startsWith("> ")) {
      out.push(
        <p key={k++} className="ac-glass p-4 text-sm">
          {inline(l.slice(2))}
        </p>,
      );
      i++;
    } else if (l.trim() === "") {
      i++;
    } else {
      out.push(
        <p key={k++} className="leading-relaxed text-muted-foreground">
          {inline(l)}
        </p>,
      );
      i++;
    }
  }
  return out;
}

function Apostila() {
  const md = buildApostila();
  const download = () => {
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "mow-academy-modulo-start-apostila.md";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/academy/start" className="text-sm text-muted-foreground hover:text-foreground">
          ← Voltar ao Módulo Start
        </Link>
        <button
          type="button"
          onClick={download}
          className="ml-auto inline-flex min-h-11 items-center gap-2 border border-input px-5 text-sm"
          aria-label={`Baixar ${APOSTILA_TITULO} em Markdown`}
        >
          <Download className="size-4" aria-hidden /> Baixar .md
        </button>
      </div>
      {render(md)}
    </article>
  );
}

import { Link, createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Markdown } from "@/components/academy/Markdown";
import { APOSTILA_TITULO, buildApostila } from "@/lib/academy/apostila";

export const Route = createFileRoute("/academy/start/apostila")({
  head: () => ({ meta: [{ title: "Apostila do Módulo Start — MOW Academy" }] }),
  component: Apostila,
});

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
      <Markdown md={md} />
    </article>
  );
}

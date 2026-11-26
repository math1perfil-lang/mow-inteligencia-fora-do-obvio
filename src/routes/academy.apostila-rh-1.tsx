import { Link, createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Markdown } from "@/components/academy/Markdown";
import { APOSTILA_RH1_TITULO, buildApostilaRh1 } from "@/lib/academy/rh1-apostila";

export const Route = createFileRoute("/academy/apostila-rh-1")({
  head: () => ({ meta: [{ title: "Apostila do Módulo 1 de RH — MOW Academy" }] }),
  component: ApostilaRh1,
});

function ApostilaRh1() {
  const md = buildApostilaRh1();
  const download = () => {
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "mow-academy-rh-modulo-1-apostila.md";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/academy/semana/$n"
          params={{ n: "1" }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar ao Módulo 1 de RH
        </Link>
        <button
          type="button"
          onClick={download}
          className="ml-auto inline-flex min-h-11 items-center gap-2 border border-input px-5 text-sm"
          aria-label={`Baixar ${APOSTILA_RH1_TITULO} em Markdown`}
        >
          <Download className="size-4" aria-hidden /> Baixar .md
        </button>
      </div>
      <Markdown md={md} />
    </article>
  );
}

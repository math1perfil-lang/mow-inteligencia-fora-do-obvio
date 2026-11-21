import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/method-factory")({
  head: () => ({
    meta: [
      { title: "Method Factory — MOW · Prévia" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: FactoryLayout,
});

function FactoryLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#factory-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-3 focus:text-black"
      >
        Ir para o conteúdo
      </a>
      <header className="border-b border-black/10 bg-white text-black">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link to="/method-factory" aria-label="MOW Method Factory" className="flex items-center gap-4">
            <img
              src="/mow-logo-black.png"
              alt="MOW"
              width={1780}
              height={454}
              className="h-[18px] w-auto select-none"
              draggable={false}
            />
            <span className="h-6 w-px bg-black/30" aria-hidden="true" />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] sm:text-xs">
              Method Factory
            </span>
          </Link>
          <nav aria-label="Method Factory" className="flex items-center gap-5 text-sm">
            <Link
              to="/method-factory"
              activeOptions={{ exact: true }}
              activeProps={{ className: "underline underline-offset-8" }}
            >
              Visão geral
            </Link>
            <Link
              to="/method-factory/brief-preview"
              activeProps={{ className: "underline underline-offset-8" }}
            >
              Briefing <ArrowUpRight className="ml-1 inline size-3" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>
      <div className="border-b border-white/15 bg-white/5">
        <div className="mx-auto flex max-w-7xl items-start gap-3 px-5 py-3 text-xs leading-relaxed text-white/75 sm:px-8">
          <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            <strong className="font-medium text-white">Protótipo sem persistência.</strong> Use
            apenas dados fictícios. As respostas ficam somente na memória desta página: não são
            enviadas, salvas nem analisadas por IA. Recarregar ou sair apaga tudo.
          </p>
        </div>
      </div>
      <main id="factory-content">
        <Outlet />
      </main>
      <footer className="mt-16 border-t border-white/15 px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 font-mono text-[10px] uppercase tracking-wider text-white/60">
          <span>Inteligência fora do óbvio. Evidência dentro do processo.</span>
          <span>Prévia 0.1 · Envio real desativado</span>
        </div>
      </footer>
    </div>
  );
}

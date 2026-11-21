import { useEffect } from "react";
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
  // Tema claro só nesta área: a classe no <html> vale também para diálogos e avisos.
  useEffect(() => {
    document.documentElement.classList.add("mf-theme");
    return () => document.documentElement.classList.remove("mf-theme");
  }, []);

  return (
    <div className="mf-root relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="mf-glow mf-g1" aria-hidden="true" />
      <div className="mf-glow mf-g2" aria-hidden="true" />
      <div className="mf-glow mf-g3" aria-hidden="true" />
      <a
        href="#factory-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-black focus:px-4 focus:py-3 focus:text-white"
      >
        Ir para o conteúdo
      </a>
      <header className="mf-header sticky top-0 z-30 border-b border-black/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-9 gap-y-1 px-5 pb-1.5 pt-3.5 sm:px-8 lg:flex-nowrap lg:py-3">
          <Link
            to="/method-factory"
            aria-label="MOW Method Factory"
            className="flex items-center gap-3.5 text-black"
          >
            <img
              src="/mow-logo-black.png"
              alt="MOW"
              width={1780}
              height={454}
              className="h-[18px] w-auto select-none"
              draggable={false}
            />
            <span className="h-8 w-px bg-black/35" aria-hidden="true" />
            <span className="flex flex-col gap-[3px] text-[11px] font-medium uppercase leading-none tracking-[0.24em]">
              <span>Method</span>
              <span>Factory</span>
            </span>
          </Link>
          <nav
            aria-label="Method Factory"
            className="mf-nav order-3 flex w-full items-center gap-7 overflow-x-auto pt-1 text-base lg:order-none lg:ml-auto lg:w-auto lg:pt-0"
          >
            <Link
              to="/method-factory"
              activeOptions={{ exact: true }}
              activeProps={{ className: "is-current" }}
            >
              Visão geral
            </Link>
            <Link to="/method-factory/brief-preview" activeProps={{ className: "is-current" }}>
              Briefing <ArrowUpRight className="ml-1 inline size-3.5" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>
      <div className="relative z-10 mx-auto max-w-7xl px-5 pt-5 sm:px-8">
        <div className="mf-rise glass flex items-start gap-3.5 px-5 py-3.5 text-[15px] leading-relaxed text-muted-foreground">
          <FlaskConical className="mt-0.5 size-5 shrink-0 text-[#3a3fb8]" aria-hidden="true" />
          <p>
            <strong className="font-semibold text-foreground">Protótipo sem persistência.</strong>{" "}
            Use apenas dados fictícios. As respostas ficam somente na memória desta página: não são
            enviadas, salvas nem analisadas por IA. Recarregar ou sair apaga tudo.
          </p>
        </div>
      </div>
      <main id="factory-content" className="relative z-10">
        <Outlet />
      </main>
      <footer className="relative z-10 mt-16 border-t border-border px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <span>Inteligência fora do óbvio. Evidência dentro do processo.</span>
          <span>Prévia 0.1 · Envio real desativado</span>
        </div>
      </footer>
    </div>
  );
}

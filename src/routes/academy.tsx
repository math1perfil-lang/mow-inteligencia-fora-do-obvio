import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { Logo } from "@/components/mow/shared";

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [
      { title: "MOW Academy — IA Corporativa" },
      {
        name: "description",
        content:
          "Use Inteligência Artificial para produzir mais, decidir melhor e transformar seu trabalho — com trilhas aplicadas à sua área.",
      },
    ],
  }),
  component: AcademyLayout,
});

const NAV = [
  { to: "/academy", label: "Início", exact: true },
  { to: "/academy/painel", label: "Painel", exact: false },
  { to: "/academy/biblioteca", label: "Biblioteca", exact: false },
  { to: "/academy/certificado", label: "Certificado", exact: false },
] as const;

function AcademyLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#academy-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
      >
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-8 px-5 md:px-10">
          <Link to="/academy" aria-label="MOW Academy" className="flex h-16 items-center gap-4">
            <Logo className="h-[18px]" />
            <span aria-hidden className="h-6 w-px bg-border" />
            <span className="eyebrow">Academy</span>
          </Link>
          <nav
            aria-label="MOW Academy"
            className="flex items-center gap-6 overflow-x-auto text-[13px]"
          >
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.exact }}
                className="flex min-h-11 items-center whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground underline underline-offset-8" }}
              >
                {n.label}
              </Link>
            ))}
            <a
              href="/"
              className="flex min-h-11 items-center whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
            >
              Site MOW ↗
            </a>
          </nav>
        </div>
      </header>
      <main id="academy-content" className="mx-auto max-w-[1200px] px-5 py-12 md:px-10 md:py-20">
        <Outlet />
      </main>
      <footer className="border-t border-border px-5 py-6 md:px-10">
        <p className="mx-auto max-w-[1200px] text-xs leading-relaxed text-muted-foreground">
          MOW Academy · Versão inicial. Seu progresso e seus prompts ficam salvos apenas neste
          navegador, neste dispositivo. O feedback é automático por regras e não substitui a
          avaliação de um instrutor. A IA não é infalível: revise sempre.
        </p>
      </footer>
    </div>
  );
}

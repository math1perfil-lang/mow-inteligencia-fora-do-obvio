import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { Award, BookMarked, GraduationCap, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/mow/shared";
import { overall, useAcademy } from "@/lib/academy/store";

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
  { to: "/academy", label: "Início", exact: true, icon: GraduationCap },
  { to: "/academy/painel", label: "Meu curso", exact: false, icon: LayoutDashboard },
  { to: "/academy/biblioteca", label: "Biblioteca", exact: false, icon: BookMarked },
  { to: "/academy/certificado", label: "Certificado", exact: false, icon: Award },
] as const;

function AcademyLayout() {
  const { state, ready } = useAcademy();
  const pct = ready ? overall(state).percent : 0;
  return (
    <div className="ac-root">
      <div className="ac-glow ac-g1" aria-hidden="true" />
      <div className="ac-glow ac-g2" aria-hidden="true" />
      <div className="ac-glow ac-g3" aria-hidden="true" />
      <a
        href="#academy-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Pular para o conteúdo
      </a>
      <header className="ac-header sticky top-0 z-40">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-x-9 px-5 py-3 md:px-10">
          <Link to="/academy" aria-label="MOW Academy" className="flex items-center gap-3.5">
            <Logo className="h-[18px]" />
            <span className="h-8 w-px bg-white/35" aria-hidden="true" />
            <span className="flex flex-col gap-[3px] text-[11px] font-medium uppercase leading-none tracking-[0.24em]">
              <span>Academy</span>
              <span className="text-[#a4a9bd]">IA Corporativa</span>
            </span>
          </Link>
          <nav
            aria-label="MOW Academy"
            className="ac-nav hidden items-center gap-7 text-[15px] md:flex"
          >
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.exact }}
                activeProps={{ className: "is-current" }}
              >
                {n.label}
              </Link>
            ))}
            <a href="/">Site MOW ↗</a>
          </nav>
          <Link
            to="/academy/painel"
            aria-label={`Progresso no curso: ${pct}%`}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-[#c9cde0]"
          >
            <span className="h-1.5 w-14 overflow-hidden rounded-full bg-white/10">
              <span className="ac-bar block h-full rounded-full" style={{ width: `${pct}%` }} />
            </span>
            {pct}%
          </Link>
        </div>
      </header>
      <main
        id="academy-content"
        className="relative z-10 mx-auto max-w-[1240px] px-5 pb-32 pt-10 md:px-10 md:pb-24 md:pt-16"
      >
        <Outlet />
      </main>
      <footer className="relative z-10 border-t border-white/10 px-5 py-6 pb-24 md:px-10 md:pb-6">
        <p className="mx-auto max-w-[1240px] text-xs leading-relaxed text-[#a4a9bd]">
          MOW Academy · Versão inicial. Seu progresso e seus prompts ficam salvos apenas neste
          navegador, neste dispositivo. O feedback é automático por regras e não substitui a
          avaliação de um instrutor. A IA não é infalível: revise sempre.
        </p>
      </footer>
      <nav
        aria-label="Navegação do curso"
        className="ac-bottom fixed inset-x-0 bottom-0 z-40 flex md:hidden"
      >
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: n.exact }}
            activeProps={{ className: "is-current" }}
          >
            <n.icon className="size-5" aria-hidden />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, FlaskConical } from "lucide-react";
import { checkFactoryOperatorAccess } from "@/lib/method-factory/workflow.functions";

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

export function FactoryLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isOpenAlex = pathname === "/method-factory/openalex";
  const isClientIntake = pathname === "/method-factory/intake";
  const isPublicFactoryPath =
    isClientIntake ||
    pathname === "/method-factory/review" ||
    pathname === "/method-factory/reset-password";
  const requiresOperator = pathname.startsWith("/method-factory") && !isPublicFactoryPath;
  const [operatorGate, setOperatorGate] = useState<{
    pathname: string;
    status: "checking" | "allowed" | "denied";
  }>({ pathname: "", status: "checking" });

  // Tema claro só nesta área: a classe no <html> vale também para diálogos e avisos.
  useEffect(() => {
    document.documentElement.classList.add("mf-theme");
    return () => document.documentElement.classList.remove("mf-theme");
  }, []);

  useEffect(() => {
    if (!requiresOperator) return;
    let cancelled = false;
    setOperatorGate({ pathname, status: "checking" });
    void checkFactoryOperatorAccess({ data: {} })
      .then(() => {
        if (!cancelled) setOperatorGate({ pathname, status: "allowed" });
      })
      .catch(() => {
        if (!cancelled) setOperatorGate({ pathname, status: "denied" });
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, requiresOperator]);

  if (isPublicFactoryPath) {
    return (
      <div className="min-h-screen bg-[#101010] text-white">
        <main id="factory-content">
          <Outlet />
        </main>
      </div>
    );
  }

  const operatorGateStatus = operatorGate.pathname === pathname ? operatorGate.status : "checking";
  const isGateVisible = requiresOperator && operatorGateStatus !== "allowed";

  return (
    <div
      className={`mf-root relative min-h-screen overflow-hidden ${isOpenAlex ? "bg-[#101010] text-white" : "bg-background text-foreground"}`}
    >
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
            {isOpenAlex ? (
              <>
                <strong className="font-semibold text-foreground">Área interna da Factory.</strong>{" "}
                Revisão e OpenAlex exigem autorização verificada no servidor. A busca aceita somente
                termos temáticos curtos e retorna metadados bibliográficos temporários.
              </>
            ) : (
              <>
                <strong className="font-semibold text-foreground">
                  Protótipo sem persistência.
                </strong>{" "}
                Use apenas dados fictícios. As respostas ficam somente na memória desta página: não
                são enviadas, salvas nem analisadas por IA. Recarregar ou sair apaga tudo.
              </>
            )}
          </p>
        </div>
      </div>
      <main
        id="factory-content"
        className={`relative z-10 ${isOpenAlex ? "bg-[#101010] text-white" : ""}`}
      >
        {isGateVisible ? (
          <section className="mx-auto max-w-7xl px-5 pt-12 sm:px-8 sm:pt-20" aria-live="polite">
            <div className="glass max-w-2xl p-6 sm:p-8">
              <p className="mf-pill">
                <span className="mf-dot" aria-hidden="true" />
                Área interna
              </p>
              <h1
                className={`mt-6 text-3xl font-light tracking-tight sm:text-4xl ${isOpenAlex ? "text-white" : "text-foreground"}`}
              >
                {operatorGateStatus === "checking" ? "Verificando acesso" : "Acesso restrito"}
              </h1>
              <p
                className={`mt-4 text-sm leading-relaxed ${isOpenAlex ? "text-white/70" : "text-muted-foreground"}`}
              >
                {operatorGateStatus === "checking"
                  ? "Aguarde enquanto verificamos a autorização desta página."
                  : "Esta área é exclusiva para operadoras ativas. Entre pela revisão interna com a conta autorizada do projeto Mow Group e tente novamente."}
              </p>
              {operatorGateStatus === "denied" ? (
                <Link
                  to="/method-factory/review"
                  className={`mt-6 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition-opacity hover:opacity-85 ${isOpenAlex ? "bg-white text-black" : "bg-foreground text-background"}`}
                >
                  Abrir autenticação interna
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </section>
        ) : (
          <Outlet />
        )}
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

import { CtaLink } from "./shared";

export function Hero() {
  return (
    <section
      id="inicio"
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-background pt-16"
    >
      {/* Subtle geometry */}
      <div aria-hidden className="pointer-events-none absolute inset-0 fade-in">
        <div className="absolute left-[8.333%] top-0 h-full w-px bg-border/50 max-md:hidden" />
        <div className="absolute right-[8.333%] top-0 h-full w-px bg-border/50" />
        <div className="absolute -right-[18vw] top-[12%] aspect-square w-[52vw] rounded-full border border-border/60 max-md:w-[90vw]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center px-5 py-16 md:px-10">
        <p className="eyebrow fade-in mb-8 text-muted-foreground md:mb-12" style={{ animationDelay: "200ms" }}>
          MOW® — Estúdio de soluções
        </p>

        <h1 id="hero-title" className="display text-[clamp(3.4rem,13.5vw,13rem)]">
          <span className="rise-line"><span style={{ animationDelay: "100ms" }}>Inteligência</span></span>
          <span className="rise-line"><span style={{ animationDelay: "220ms" }}>fora do</span></span>
          <span className="rise-line">
            <span style={{ animationDelay: "340ms" }}>
              óbvio<span className="text-muted-foreground">.</span>
            </span>
          </span>
        </h1>

        <div className="fade-in mt-12 grid gap-8 md:mt-16 md:grid-cols-12" style={{ animationDelay: "700ms" }}>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground md:col-span-5 md:col-start-7 md:text-lg">
            Desenvolvemos soluções que desafiam o convencional, conectam ideias e transformam possibilidades em
            realidade.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row md:col-span-6 md:col-start-7">
            <CtaLink href="#sobre">Conheça a MOW</CtaLink>
            <CtaLink href="#contato" variant="ghost">
              Vamos conversar ↗
            </CtaLink>
          </div>
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-[1440px] items-center justify-between border-t border-border px-5 py-5 md:px-10">
        <a href="#manifesto" className="eyebrow text-muted-foreground transition-colors hover:text-foreground">
          Descubra a MOW ↓
        </a>
        <span className="eyebrow text-muted-foreground">Inteligência fora do óbvio</span>
      </div>
    </section>
  );
}

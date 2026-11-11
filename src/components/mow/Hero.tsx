import { useRef, type PointerEvent } from "react";
import { CtaLink } from "./shared";
import { HeroCanvas } from "./HeroCanvas";
import { useLang } from "@/i18n/context";

export function Hero() {
  const { t } = useLang();
  const sec = useRef<HTMLElement>(null);
  const [l1, l2, l3] = t.heroLines;

  // Desktop spotlight follows cursor via CSS vars
  const onMove = (e: PointerEvent<HTMLElement>) => {
    const el = sec.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <section
      ref={sec}
      id="inicio"
      aria-labelledby="hero-title"
      onPointerMove={onMove}
      className="group/hero relative flex min-h-[100svh] flex-col overflow-hidden bg-background pt-16"
    >
      {/* Mobile geometry (unchanged) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 fade-in md:hidden">
        <div className="absolute right-[8.333%] top-0 h-full w-px bg-border/50" />
        <div className="absolute -right-[18vw] top-[12%] aspect-square w-[90vw] rounded-full border border-border/60" />
      </div>

      {/* Desktop: interactive sphere + cursor spotlight + grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
        <div className="hero-grid absolute inset-0 fade-in" />
        <HeroCanvas className="fade-in absolute right-[-6%] top-1/2 h-[115%] w-[62%] -translate-y-1/2 text-foreground" />
        <div className="hero-spot absolute inset-0 opacity-0 transition-opacity duration-700 group-hover/hero:opacity-100" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center px-5 py-16 md:py-10 md:px-10">
        <p className="eyebrow fade-in mb-8 flex items-center gap-3 text-muted-foreground md:mb-10" style={{ animationDelay: "200ms" }}>
          <span aria-hidden className="hidden h-1.5 w-1.5 animate-pulse rounded-full bg-foreground md:inline-block" />
          {t.heroEyebrow}
        </p>

        <h1 id="hero-title" className="display text-[clamp(3.9rem,13.5vw,13rem)] md:text-[min(7.4vw,17vh)]">
          <span className="rise-line"><span style={{ animationDelay: "100ms" }}>{l1}</span></span>
          <span className="rise-line">
            <span style={{ animationDelay: "220ms" }}>
              {l2}
              <span className="hidden md:inline">
                {" "}
                <span className="hero-outline">{l3}</span>
                <span className="text-muted-foreground">.</span>
              </span>
            </span>
          </span>
          <span className="block md:hidden">
            <span className="rise-line">
              <span style={{ animationDelay: "340ms" }}>
                {l3}<span className="text-muted-foreground">.</span>
              </span>
            </span>
          </span>
        </h1>

        <div className="fade-in mt-12 grid gap-8 md:mt-12 md:grid-cols-12 md:items-end" style={{ animationDelay: "700ms" }}>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground md:col-span-5 md:text-lg">
            {t.heroText}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row md:col-span-6 md:col-start-7 md:justify-end">
            <CtaLink href="#sobre">{t.heroCta}</CtaLink>
            <CtaLink href="#contato" variant="ghost">{t.talk}</CtaLink>
          </div>
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-[1440px] items-center justify-between border-t border-border px-5 py-5 md:px-10">
        <a href="#manifesto" className="eyebrow text-muted-foreground transition-colors hover:text-foreground">
          {t.discover}
        </a>
        <span className="eyebrow hidden text-muted-foreground sm:inline">{t.tagline}</span>
      </div>
    </section>
  );
}

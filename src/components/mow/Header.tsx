import { useEffect, useState } from "react";
import { Logo, useNav } from "./shared";
import { useLang } from "@/i18n/context";
import { LanguageSwitch } from "./Language";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const NAV = useNav();
  const { t } = useLang();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-500",
        scrolled || open ? "border-border bg-background/85 backdrop-blur-md" : "border-transparent bg-background lg:bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 md:px-10">
        <a href="#inicio" aria-label="MOW Method Factory" className="flex shrink-0 items-center gap-3.5">
          <Logo className="h-[18px]" />
          <span aria-hidden className="h-8 w-px bg-foreground/40" />
          <span
            aria-hidden
            className="flex flex-col gap-[3px] text-[10px] font-medium uppercase leading-none tracking-[0.24em] text-foreground"
          >
            <span>Method</span>
            <span>Factory</span>
          </span>
        </a>

        <nav aria-label="Principal" className="hidden items-center gap-8 lg:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="relative text-[13px] text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-foreground after:transition-all after:duration-300 hover:after:w-full"
            >
              {n.label}
            </a>
          ))}
          <a
            href="#contato"
            className="border border-border px-4 py-2 text-[13px] transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
          >
            {t.talk}
          </a>
          <LanguageSwitch />
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitch />
          <button
            type="button"
            className="eyebrow flex h-10 items-center gap-3"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? t.close : t.menu}
            <span aria-hidden className="relative block h-2.5 w-5">
              <span className={cn("absolute left-0 top-0 h-px w-full bg-foreground transition-transform", open && "translate-y-[5px] rotate-45")} />
              <span className={cn("absolute bottom-0 left-0 h-px w-full bg-foreground transition-transform", open && "-translate-y-[4px] -rotate-45")} />
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        hidden={!open}
        className="h-[calc(100dvh-4rem)] border-t border-border bg-background px-5 pb-10 pt-8 lg:hidden"
      >
        <nav aria-label="Menu" className="flex h-full flex-col">
          <ul className="space-y-1">
            {NAV.map((n, i) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-4 border-b border-border py-4 text-3xl font-medium tracking-tight"
                >
                  <span className="eyebrow text-muted-foreground">0{i + 1}</span>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#contato"
            onClick={() => setOpen(false)}
            className="mt-auto flex h-14 items-center justify-center bg-foreground text-base font-medium text-background"
          >
            {t.talk}
          </a>
        </nav>
      </div>
    </header>
  );
}

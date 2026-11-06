import { useEffect, useRef } from "react";
import { useLang } from "@/i18n/context";
import { DICTS, LANGS, type Lang } from "@/i18n/dict";
import { cn } from "@/lib/utils";

export function Flag({ lang, className }: { lang: Lang; className?: string }) {
  const cls = cn("h-auto w-7 shrink-0 rounded-[2px] ring-1 ring-border", className);
  if (lang === "pt")
    return (
      <svg aria-hidden viewBox="0 0 28 20" className={cls}>
        <rect width="28" height="20" fill="#009C3B" />
        <path d="M14 2.5 25.5 10 14 17.5 2.5 10Z" fill="#FFDF00" />
        <circle cx="14" cy="10" r="4.4" fill="#002776" />
        <path d="M9.8 9.2a9 9 0 0 1 8.4 1.8" stroke="#fff" strokeWidth=".8" fill="none" />
      </svg>
    );
  if (lang === "en")
    return (
      <svg aria-hidden viewBox="0 0 60 40" className={cls}>
        <clipPath id="uk-c"><rect width="60" height="40" /></clipPath>
        <g clipPath="url(#uk-c)">
          <rect width="60" height="40" fill="#012169" />
          <path d="M0 0l60 40M60 0L0 40" stroke="#fff" strokeWidth="8" />
          <path d="M0 0l60 40M60 0L0 40" stroke="#C8102E" strokeWidth="3" />
          <path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="12" />
          <path d="M30 0v40M0 20h60" stroke="#C8102E" strokeWidth="7" />
        </g>
      </svg>
    );
  return (
    <svg aria-hidden viewBox="0 0 30 20" className={cls}>
      <rect width="30" height="20" fill="#AA151B" />
      <rect y="5" width="30" height="10" fill="#F1BF00" />
    </svg>
  );
}

/** Overlay shown on first visit until the visitor picks a language. */
export function LanguagePicker() {
  const { chosen, setLang, t } = useLang();
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (chosen) return;
    document.body.style.overflow = "hidden";
    first.current?.focus();
    return () => { document.body.style.overflow = ""; };
  }, [chosen]);
  if (chosen) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="lang-title" className="fixed inset-0 z-[100] grid place-items-center bg-background/80 p-5 backdrop-blur-md fade-in">
      <div className="w-full max-w-sm border border-border bg-card p-8">
        <p className="eyebrow text-muted-foreground">Idioma · Language · Idioma</p>
        <h2 id="lang-title" className="mt-4 text-2xl font-medium tracking-tight">{t.chooseTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.chooseSub}</p>
        <ul className="mt-8 border-t border-border">
          {LANGS.map((l, i) => (
            <li key={l}>
              <button
                ref={i === 0 ? first : undefined}
                type="button"
                onClick={() => setLang(l)}
                className="group flex w-full items-center gap-4 border-b border-border py-4 text-left text-lg transition-colors hover:bg-foreground hover:px-4 hover:text-background focus-visible:bg-foreground focus-visible:px-4 focus-visible:text-background focus-visible:outline-none"
              >
                <Flag lang={l} />
                <span className="flex-1">{DICTS[l].langName}</span>
                <span aria-hidden>→</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Compact switcher for the header. */
export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, setLang, t } = useLang();
  return (
    <div role="group" aria-label={t.langLabel} className={cn("flex items-center gap-1", className)}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          aria-label={DICTS[l].langName}
          className={cn("grid h-8 w-9 place-items-center transition-opacity", lang === l ? "opacity-100" : "opacity-40 hover:opacity-80")}
        >
          <Flag lang={l} className="w-6" />
        </button>
      ))}
    </div>
  );
}

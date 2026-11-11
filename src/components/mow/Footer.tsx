import { Logo, useNav } from "./shared";
import { useLang } from "@/i18n/context";
import { PRIVACY_URL, SOCIAL } from "@/content/projects";

export function Footer() {
  const NAV = useNav();
  const { t } = useLang();
  const year = new Date().getFullYear();
  return (
    <footer className="bg-background pt-20">
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo className="h-8 md:h-10" />
            <p className="mt-6 text-muted-foreground">{t.tagline}.</p>
          </div>
          <nav aria-label={t.f.footerNav} className="md:col-span-3 md:col-start-7">
            <ul className="space-y-3 text-sm">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="text-muted-foreground transition-colors hover:text-foreground">{n.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <ul className="space-y-3 text-sm md:col-span-3">
            {SOCIAL.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">{s.label} ↗</a>
              </li>
            ))}
            {PRIVACY_URL && (
              <li><a href={PRIVACY_URL} className="text-muted-foreground hover:text-foreground">{t.f.privacy}</a></li>
            )}
          </ul>
        </div>
        <div className="mt-20 flex flex-col gap-3 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>© {year} MOW. {t.f.rights}</span>
          <span className="eyebrow text-foreground">{t.f.motto}</span>
        </div>
      </div>
    </footer>
  );
}

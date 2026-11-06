import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DICTS, HTML_LANG, LANGS, type Dict, type Lang } from "./dict";

const KEY = "mow-lang";
type Ctx = { lang: Lang; t: Dict; setLang: (l: Lang) => void; chosen: boolean };
const LangCtx = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");
  // null = not yet known (SSR/hydration) — keeps the picker from flashing for returning visitors
  const [chosen, setChosen] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(KEY) as Lang | null;
    if (saved && LANGS.includes(saved)) { setLangState(saved); setChosen(true); }
    else setChosen(false);
  }, []);

  useEffect(() => { document.documentElement.lang = HTML_LANG[lang]; }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l); setChosen(true);
    try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  };

  return (
    <LangCtx.Provider value={{ lang, t: DICTS[lang], setLang, chosen: chosen !== false }}>
      {children}
    </LangCtx.Provider>
  );
}

export function useLang() {
  const c = useContext(LangCtx);
  if (!c) throw new Error("useLang outside LangProvider");
  return c;
}

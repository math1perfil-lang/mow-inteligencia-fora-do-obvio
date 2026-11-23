import { Link } from "@tanstack/react-router";
import { Reveal } from "./shared";
import { useLang } from "@/i18n/context";

const COPY = {
  pt: {
    eyebrow: "MOW Academy",
    title: "Aprenda IA fazendo.",
    text: "Curso IA Corporativa: diagnóstico, trilha da sua área, tarefas práticas com feedback e uma biblioteca de prompts para usar no trabalho.",
    cta: "Conhecer a MOW Academy",
  },
  en: {
    eyebrow: "MOW Academy",
    title: "Learn AI by doing.",
    text: "Corporate AI course (in Portuguese): diagnostic, a track for your field, hands-on tasks with feedback and a prompt library for real work.",
    cta: "Explore MOW Academy",
  },
  es: {
    eyebrow: "MOW Academy",
    title: "Aprende IA haciendo.",
    text: "Curso de IA corporativa (en portugués): diagnóstico, ruta para tu área, tareas prácticas con feedback y una biblioteca de prompts para el trabajo.",
    cta: "Conocer MOW Academy",
  },
} as const;

export function AcademyShortcut() {
  const { lang } = useLang();
  const c = COPY[lang];
  return (
    <section aria-labelledby="academy-title" className="border-y border-border py-20 md:py-28">
      <div className="mx-auto grid w-full max-w-[1440px] items-end gap-10 px-5 md:grid-cols-12 md:px-10">
        <Reveal className="md:col-span-8">
          <p className="eyebrow text-muted-foreground">{c.eyebrow}</p>
          <h2 id="academy-title" className="display mt-5 text-[clamp(2.4rem,6vw,5.2rem)]">
            {c.title}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {c.text}
          </p>
        </Reveal>
        <Reveal delay={120} className="md:col-span-4 md:text-right">
          <Link
            to="/academy"
            className="inline-flex min-h-14 items-center border border-foreground px-8 text-base transition-colors hover:bg-foreground hover:text-background"
          >
            {c.cta} →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

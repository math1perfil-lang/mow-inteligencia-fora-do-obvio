import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/mow/Header";
import { Hero } from "@/components/mow/Hero";
import { About, Difference, Manifesto, Projects, WhatWeDo } from "@/components/mow/Sections";
import { Contact } from "@/components/mow/Contact";
import { Footer } from "@/components/mow/Footer";
import { LangProvider, useLang } from "@/i18n/context";
import { LanguagePicker } from "@/components/mow/Language";

const TITLE = "MOW — Inteligência fora do óbvio";
const DESC =
  "A MOW desenvolve soluções inteligentes, criativas e inovadoras para transformar ideias em possibilidades concretas.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "MOW",
          slogan: "Inteligência fora do óbvio.",
          description: DESC,
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <LangProvider>
      <Page />
      <LanguagePicker />
    </LangProvider>
  );
}

function Page() {
  const { t } = useLang();
  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-foreground focus:px-4 focus:py-2 focus:text-background">
        {t.skip}
      </a>
      <Header />
      <main id="conteudo">
        <Hero />
        <Manifesto />
        <WhatWeDo />
        <Projects />
        <Difference />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

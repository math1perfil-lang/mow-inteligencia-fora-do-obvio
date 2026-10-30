import { Eyebrow, Reveal } from "./shared";
import { PROJECTS } from "@/content/projects";

const wrap = "mx-auto w-full max-w-[1440px] px-5 md:px-10";

export function Manifesto() {
  return (
    <section id="manifesto" aria-labelledby="manifesto-title" className="section-light py-24 md:py-40">
      <div className={`${wrap} grid gap-12 md:grid-cols-12`}>
        <Reveal className="md:col-span-3">
          <Eyebrow>01 / Nossa forma de pensar</Eyebrow>
        </Reveal>
        <div className="md:col-span-9">
          <Reveal>
            <h2 id="manifesto-title" className="display text-[clamp(2.6rem,7vw,6.5rem)]">
              O óbvio já tem soluções demais.
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-12 md:mt-24 md:grid-cols-9">
            <Reveal className="space-y-6 text-base leading-relaxed text-muted-foreground md:col-span-4 md:text-lg">
              <p>
                Acreditamos que boas soluções começam com perguntas melhores. Questionamos o que parece definitivo,
                investigamos o que passa despercebido e encontramos novas formas de resolver problemas.
              </p>
              <p>Não criamos por criar. Pensamos, experimentamos e construímos com intenção.</p>
              <p>Porque inovação não é parecer diferente. É fazer diferente ter sentido.</p>
            </Reveal>
            <Reveal delay={150} className="md:col-span-4 md:col-start-6">
              <blockquote className="border-l border-foreground pl-6 text-2xl font-medium leading-snug tracking-tight md:text-3xl">
                “Não criamos por criar. Criamos porque existe uma maneira melhor.”
              </blockquote>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

const SHAPES = [
  // circle
  <circle key="c" cx="24" cy="24" r="17" />,
  // square rotated
  <rect key="s" x="10" y="10" width="28" height="28" transform="rotate(45 24 24)" />,
  // half circle + line
  <g key="h"><path d="M7 30a17 17 0 0 1 34 0" /><line x1="4" y1="30" x2="44" y2="30" /></g>,
  // grid of lines
  <g key="g"><line x1="8" y1="8" x2="40" y2="40" /><line x1="40" y1="8" x2="8" y2="40" /><rect x="8" y="8" width="32" height="32" /></g>,
];

const SERVICES = [
  ["Estratégia e inovação", "Identificamos oportunidades, questionamos modelos existentes e estruturamos caminhos para novas soluções."],
  ["Produtos digitais", "Transformamos ideias em experiências digitais, plataformas e produtos pensados para resolver problemas reais."],
  ["Tecnologia e desenvolvimento", "Construímos soluções tecnológicas com foco em funcionalidade, clareza e utilidade."],
  ["Novos negócios e projetos", "Exploramos possibilidades, estruturamos iniciativas e desenvolvemos projetos com potencial de gerar valor."],
] as const;

export function WhatWeDo() {
  return (
    <section id="o-que-fazemos" aria-labelledby="wwd-title" className="py-24 md:py-40">
      <div className={wrap}>
        <div className="grid gap-10 md:grid-cols-12">
          <Reveal className="md:col-span-3"><Eyebrow>02 / Possibilidades</Eyebrow></Reveal>
          <Reveal className="md:col-span-7">
            <h2 id="wwd-title" className="display text-[clamp(2.4rem,6vw,5.5rem)]">
              Ideias são o começo. <span className="text-muted-foreground">Soluções são o objetivo.</span>
            </h2>
            <p className="mt-8 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              Cada desafio exige uma maneira própria de pensar. A MOW explora diferentes disciplinas para transformar
              problemas em oportunidades concretas.
            </p>
          </Reveal>
        </div>

        <ul className="mt-20 grid border-t border-border sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map(([title, desc], i) => (
            <Reveal
              as="li"
              key={title}
              delay={i * 90}
              className="group relative border-b border-border p-6 transition-colors duration-500 hover:bg-card sm:border-r sm:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:last:border-r-0 md:p-8"
            >
              <span aria-hidden className="absolute left-0 top-0 h-px w-0 bg-foreground transition-all duration-700 group-hover:w-full" />
              <div className="flex items-start justify-between">
                <span className="eyebrow text-muted-foreground">0{i + 1}</span>
                <svg
                  aria-hidden
                  viewBox="0 0 48 48"
                  className="h-12 w-12 fill-none stroke-muted-foreground stroke-[0.75] transition-all duration-500 group-hover:rotate-45 group-hover:stroke-foreground"
                >
                  {SHAPES[i]}
                </svg>
              </div>
              <h3 className="mt-20 text-xl font-medium tracking-tight transition-transform duration-500 group-hover:translate-x-1 md:mt-28 md:text-2xl">
                {title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Projects() {
  return (
    <section id="projetos" aria-labelledby="proj-title" className="border-t border-border py-24 md:py-40">
      <div className={wrap}>
        <div className="grid gap-10 md:grid-cols-12">
          <Reveal className="md:col-span-3"><Eyebrow>03 / Em desenvolvimento</Eyebrow></Reveal>
          <Reveal className="md:col-span-6">
            <h2 id="proj-title" className="display text-[clamp(2.4rem,6vw,5.5rem)]">Ideias que ganham forma.</h2>
          </Reveal>
          <Reveal className="md:col-span-3 md:self-end">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Cada projeto é uma oportunidade de questionar o convencional e construir algo que faça sentido no mundo
              real.
            </p>
          </Reveal>
        </div>

        {PROJECTS.length > 0 ? (
          <ul className="mt-20 grid gap-x-8 gap-y-16 md:grid-cols-2">
            {PROJECTS.map((p, i) => (
              <Reveal as="li" key={p.name} delay={i * 80} className={i % 2 ? "md:mt-24" : ""}>
                <article className="group">
                  <div className="aspect-[4/3] overflow-hidden border border-border bg-card">
                    {p.image && (
                      <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                    )}
                  </div>
                  <div className="mt-6 flex items-baseline justify-between gap-4">
                    <h3 className="text-2xl font-medium tracking-tight">{p.name}</h3>
                    <span className="eyebrow shrink-0 text-muted-foreground">{p.category}</span>
                  </div>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                  {p.url && (
                    <a href={p.url} className="mt-5 inline-block border-b border-foreground pb-1 text-sm">
                      Conhecer o projeto ↗
                    </a>
                  )}
                </article>
              </Reveal>
            ))}
          </ul>
        ) : (
          <Reveal className="mt-20">
            <div className="relative grid min-h-[420px] place-items-center overflow-hidden border border-border md:min-h-[520px]">
              <svg aria-hidden viewBox="0 0 400 400" className="absolute h-[140%] w-auto fill-none stroke-border">
                {[60, 100, 140, 180].map((r) => (
                  <circle key={r} cx="200" cy="200" r={r} strokeWidth="0.6" />
                ))}
                <line x1="0" y1="200" x2="400" y2="200" strokeWidth="0.6" />
                <line x1="200" y1="0" x2="200" y2="400" strokeWidth="0.6" />
              </svg>
              <div className="relative px-6 text-center">
                <span className="eyebrow text-muted-foreground">Em breve</span>
                <p className="mt-4 text-3xl font-medium tracking-tight md:text-5xl">Novas ideias estão tomando forma.</p>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

const PRINCIPLES = [
  ["Pensamento independente", "Questionamos premissas antes de aceitar respostas prontas."],
  ["Inteligência aplicada", "Valorizamos ideias que encontram utilidade, propósito e aplicação prática."],
  ["Irreverência com intenção", "Desafiamos convenções quando existe uma razão para fazer diferente."],
] as const;

export function Difference() {
  return (
    <section aria-labelledby="diff-title" className="bg-graphite py-24 md:py-40">
      <div className={`${wrap} grid gap-16 md:grid-cols-12`}>
        <Reveal className="md:col-span-6 md:sticky md:top-28 md:self-start">
          <h2 id="diff-title" className="display text-[clamp(2.6rem,6.5vw,6rem)]">
            Não seguimos fórmulas. <span className="text-muted-foreground">Investigamos possibilidades.</span>
          </h2>
        </Reveal>
        <ol className="md:col-span-5 md:col-start-8">
          {PRINCIPLES.map(([t, d], i) => (
            <Reveal as="li" key={t} delay={i * 100} className="group border-t border-border py-10 last:border-b">
              <div className="flex gap-6">
                <span className="eyebrow pt-2 text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="text-2xl font-medium tracking-tight md:text-3xl">{t}</h3>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">{d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section id="sobre" aria-labelledby="about-title" className="py-24 md:py-40">
      <div className={`${wrap} grid gap-12 md:grid-cols-12`}>
        <Reveal className="md:col-span-3"><Eyebrow>04 / Quem somos</Eyebrow></Reveal>
        <div className="md:col-span-9">
          <Reveal>
            <h2 id="about-title" className="display text-[clamp(2.4rem,6vw,5.5rem)]">
              Uma maneira diferente de enxergar problemas.
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-10 text-base leading-relaxed text-muted-foreground md:grid-cols-3 md:text-lg">
            <Reveal><p>A MOW nasceu da inquietação diante de soluções previsíveis. Somos movidos pela curiosidade, pelo pensamento independente e pela vontade de transformar boas ideias em algo concreto.</p></Reveal>
            <Reveal delay={100}><p>Nosso ponto de partida não é uma fórmula pronta. É o problema, a oportunidade e a pergunta que ainda não foi feita.</p></Reveal>
            <Reveal delay={200}><p className="text-foreground">Acreditamos que as melhores soluções surgem quando inteligência e criatividade trabalham juntas.</p></Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

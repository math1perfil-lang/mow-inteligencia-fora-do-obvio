import { Link, createFileRoute } from "@tanstack/react-router";
import { GovernanceRules } from "@/components/academy/GovernanceRules";
import { AREAS } from "@/lib/academy/areas";
import { MODULES } from "@/lib/academy/course";
import { overall, useAcademy } from "@/lib/academy/store";

export const Route = createFileRoute("/academy/")({ component: AcademyHome });

const PILLARS: [string, string][] = [
  [
    "Aprenda fazendo",
    "Cada semana tem tarefas práticas, desafios e um entregável. Apostilas são apoio, não o centro.",
  ],
  [
    "Trilha da sua área",
    "Exemplos, casos, modelos e projeto final se adaptam à sua rotina profissional.",
  ],
  [
    "Feedback por critérios",
    "Seus prompts são avaliados em 10 critérios, com orientações específicas para melhorar.",
  ],
  [
    "Biblioteca de prompts",
    "Salve, versione e reutilize o que funciona. No fim, você tem um sistema pronto para o trabalho.",
  ],
  [
    "Segurança em primeiro lugar",
    "Dados sensíveis, revisão humana e rastreabilidade fazem parte de todas as etapas.",
  ],
  ["Certificado por aplicação", "Medimos o que você aplica, não só o que conclui."],
];

function AcademyHome() {
  const { state, ready } = useAcademy();
  const started = ready && !!state.profile;
  const o = overall(state);
  return (
    <div className="space-y-24">
      <section aria-labelledby="ac-title">
        <p className="eyebrow text-muted-foreground">MOW Academy · Primeiro curso</p>
        <h1 id="ac-title" className="display mt-6 text-[clamp(2.8rem,8vw,6.5rem)]">
          IA Corporativa
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Use Inteligência Artificial para produzir mais, decidir melhor e transformar seu trabalho
          — com trilhas aplicadas à sua área.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to={started ? "/academy/painel" : "/academy/diagnostico"}
            className="inline-flex min-h-12 items-center bg-foreground px-6 text-sm font-medium text-background hover:opacity-90"
          >
            {started ? `Continuar (${o.percent}%)` : "Começar pelo diagnóstico"}
          </Link>
          <a
            href="#trilha"
            className="inline-flex min-h-12 items-center border border-border px-6 text-sm hover:border-foreground"
          >
            Ver as 8 semanas
          </a>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Módulo 0 + 8 semanas · cerca de 11 horas de prática guiada · sem cadastro, o progresso
          fica no seu navegador.
        </p>
      </section>

      <section aria-labelledby="ac-how">
        <h2 id="ac-how" className="sr-only">
          Como funciona
        </h2>
        <ul className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map(([t, d]) => (
            <li key={t} className="bg-background p-6">
              <h3 className="text-lg font-medium tracking-tight">{t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="trilha" aria-labelledby="ac-trail">
        <p className="eyebrow text-muted-foreground">Estrutura</p>
        <h2 id="ac-trail" className="display mt-4 text-[clamp(2rem,5vw,3.6rem)]">
          Do diagnóstico ao projeto final.
        </h2>
        <ol className="mt-10 border-t border-border">
          {MODULES.map((m) => (
            <li key={m.n} className="grid gap-2 border-b border-border py-5 md:grid-cols-12">
              <span className="eyebrow text-muted-foreground md:col-span-2">
                {m.n === 0 ? "Módulo 0" : `Semana ${m.n}`}
              </span>
              <div className="md:col-span-10">
                <h3 className="text-xl font-medium tracking-tight">{m.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{m.objective}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="ac-areas">
        <p className="eyebrow text-muted-foreground">Personalização</p>
        <h2 id="ac-areas" className="display mt-4 text-[clamp(2rem,5vw,3.6rem)]">
          Uma trilha para a sua área.
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Exemplos, tarefas, modelos, indicadores e projeto final mudam conforme a área que você
          escolher no diagnóstico.
        </p>
        <ul className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {AREAS.map((a) => (
            <li key={a.id} className="bg-background p-5">
              <h3 className="text-base font-medium">{a.name}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Projeto: {a.entrega}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section id="governanca" aria-labelledby="ac-gov">
        <p className="eyebrow text-muted-foreground">Governança e segurança</p>
        <h2 id="ac-gov" className="display mt-4 text-[clamp(2rem,5vw,3.6rem)]">
          IA com responsabilidade.
        </h2>
        <p className="mt-4 mb-10 max-w-2xl text-muted-foreground">
          Estas regras valem em todas as tarefas do curso e fazem parte da certificação.
        </p>
        <GovernanceRules />
      </section>
    </div>
  );
}

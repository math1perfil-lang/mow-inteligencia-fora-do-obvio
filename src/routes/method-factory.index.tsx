import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BookOpen, FileText, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FactoryOrb } from "@/components/method-factory/FactoryOrb";

export const Route = createFileRoute("/method-factory/")({ component: FactoryOverview });

function FactoryOverview() {
  return (
    <div className="mx-auto max-w-7xl px-5 pt-12 sm:px-8 sm:pt-20">
      <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
        <div className="min-w-0 max-w-3xl flex-1 basis-[460px]">
          <p className="mf-pill mf-rise">
            <span className="mf-dot" aria-hidden="true" />
            Fábrica interna · Novos negócios e projetos
          </p>
          <h1 className="mf-rise2 mt-6 text-5xl font-light leading-[1.02] tracking-tighter sm:text-7xl">
            Conhecimento que
            <br />
            <span className="mf-grad">vira execução.</span>
          </h1>
          <p className="mf-rise2 mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Primeiro, entender o problema. Depois, conectar boas fontes a um método executável. Nada
            aprovado por uma máquina. Nada validado sem aplicação.
          </p>
          <Button asChild className="mt-8 h-12 px-6">
            <Link to="/method-factory/brief-preview">
              Explorar o briefing <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <FactoryOrb className="mf-rise3 flex-1 basis-[280px]" />
      </div>
      <section className="mt-16 pt-6" aria-labelledby="pipeline-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="pipeline-title" className="text-xl font-medium tracking-tight">
            Da dor à hipótese de solução.
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            Percurso planejado — não automatizado
          </span>
        </div>
        <ol className="mt-7 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: FileText,
              title: "01 / Briefing",
              detail: "Contexto, dores e lacunas reais.",
              state: "Prévia disponível",
            },
            {
              icon: BookOpen,
              title: "02 / Conhecimento",
              detail: "Fontes, evidências e direitos de uso.",
              state: "Próxima etapa",
            },
            {
              icon: ShieldCheck,
              title: "03 / Revisão",
              detail: "Decisões humanas, antes da aplicação.",
              state: "Próxima etapa",
            },
          ].map((item) => (
            <li
              key={item.title}
              className="glass p-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <item.icon className="size-5 text-muted-foreground" aria-hidden="true" />
              <h3 className="mt-5 text-lg">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
              <p className="mt-6 font-mono text-[10px] uppercase tracking-widest">{item.state}</p>
            </li>
          ))}
        </ol>
      </section>
      <section
        className="mt-10 flex flex-col gap-7 glass p-6 sm:flex-row sm:p-8"
        aria-labelledby="pilot-title"
      >
        <div className="flex-1">
          <p className="eyebrow text-muted-foreground">Casos planejados</p>
          <h2 id="pilot-title" className="mt-3 text-xl font-medium">
            A própria Factory, primeiro. Fanaticamente, depois.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A MOW Method Factory é o caso interno de estruturação de novo negócio. A Fanaticamente
            poderá testar parcerias e tração em uma empresa relacionada ao proprietário. Nenhum dos
            casos tem resultados registrados; esse piloto não demonstra demanda independente.
          </p>
        </div>
        <div className="max-w-xs border-t border-border pt-5 sm:border-l sm:border-t-0 sm:pl-7 sm:pt-0">
          <LockKeyhole className="size-5" aria-hidden="true" />
          <h3 className="mt-3 text-sm font-medium">Convite escolhido. Ainda não ativado.</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            O envio real dependerá de token seguro e expirável, revisão de permissões e aprovação
            para persistir dados. Esta prévia não gera convites.
          </p>
        </div>
      </section>
    </div>
  );
}

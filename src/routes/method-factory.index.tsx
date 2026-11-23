import { createFileRoute } from "@tanstack/react-router";
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
            MOW Method Factory · Método para execução
          </p>
          <h1 className="mf-rise2 mt-6 text-5xl font-light leading-[1.02] tracking-tighter sm:text-7xl">
            Problemas reais,
            <br />
            <span className="mf-grad">métodos que viram ação.</span>
          </h1>
          <p className="mf-rise2 mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            A MOW Method Factory transforma desafios de organizações em caminhos práticos de
            compreensão, decisão e execução — sempre considerando o contexto de cada negócio.
          </p>
          <Button asChild className="mt-8 h-12 px-6">
            <a href="#como-funciona">
              Conhecer o processo <ArrowRight aria-hidden="true" />
            </a>
          </Button>
        </div>
        <FactoryOrb className="mf-rise3 flex-1 basis-[280px]" />
      </div>
      <section id="como-funciona" className="mt-16 pt-6" aria-labelledby="process-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="process-title" className="text-xl font-medium tracking-tight">
            Da compreensão à ação, com revisão humana.
          </h2>
          <span className="font-mono text-xs text-muted-foreground">Um processo contextual</span>
        </div>
        <ol className="mt-7 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: FileText,
              title: "01 / Entendimento",
              detail:
                "O briefing parte do tipo de organização, do desafio, dos limites e do resultado que importa.",
            },
            {
              icon: BookOpen,
              title: "02 / Conhecimento",
              detail:
                "A equipe considera referências pertinentes, sua qualidade, adequação e condições de uso.",
            },
            {
              icon: ShieldCheck,
              title: "03 / Método",
              detail:
                "As hipóteses e etapas são organizadas para aplicação e revisão no contexto do negócio.",
            },
          ].map((item) => (
            <li
              key={item.title}
              className="glass p-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <item.icon className="size-5 text-muted-foreground" aria-hidden="true" />
              <h3 className="mt-5 text-lg">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
            </li>
          ))}
        </ol>
      </section>
      <section
        id="para-quem"
        className="mt-10 grid gap-4 md:grid-cols-2"
        aria-labelledby="context-title"
      >
        <div className="glass p-6 sm:p-8">
          <p className="eyebrow text-muted-foreground">Para diferentes realidades</p>
          <h2 id="context-title" className="mt-3 text-xl font-medium">
            Cada organização começa de um ponto diferente.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            O processo pode apoiar negócios de tecnologia, serviços profissionais, vendas,
            indústria, saúde, educação, operações locais e organizações públicas ou de impacto.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            As perguntas se adaptam à atividade informada. Não presumimos que exista uma plataforma
            digital, uma equipe de dados ou métricas prontas.
          </p>
        </div>
        <div id="principios" className="glass p-6 sm:p-8">
          <LockKeyhole className="size-5" aria-hidden="true" />
          <h2 className="mt-3 text-xl font-medium">Conhecimento tratado com responsabilidade.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            O briefing é acessado por convite e tratado pela equipe da MOW. Fontes, materiais e
            critérios internos não são expostos na página do cliente; cada recomendação exige
            análise humana e validação no contexto de aplicação.
          </p>
        </div>
      </section>
      <section
        className="mt-10 flex flex-col gap-7 glass p-6 sm:flex-row sm:p-8"
        aria-labelledby="invite-title"
      >
        <div className="flex-1">
          <p className="eyebrow text-muted-foreground">Acesso ao briefing</p>
          <h2 id="invite-title" className="mt-3 text-xl font-medium">
            Recebeu um convite da MOW?
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Abra o link original enviado pela equipe: ele contém seu acesso individual ao briefing.
            A página pública apresenta a Method Factory, mas não abre a área interna nem substitui o
            convite.
          </p>
        </div>
        <div className="max-w-xs border-t border-border pt-5 sm:border-l sm:border-t-0 sm:pl-7 sm:pt-0">
          <LockKeyhole className="size-5" aria-hidden="true" />
          <h3 className="mt-3 text-sm font-medium">Acesso separado para cada finalidade.</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Clientes veem apenas a apresentação pública e o briefing autorizado. Pesquisa e revisão
            permanecem restritas à equipe MOW.
          </p>
        </div>
      </section>
    </div>
  );
}

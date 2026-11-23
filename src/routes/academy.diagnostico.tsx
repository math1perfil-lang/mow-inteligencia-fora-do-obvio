import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AREAS, AREA_BY_ID, type AreaId } from "@/lib/academy/areas";
import { updateAcademy, useAcademy, type Level } from "@/lib/academy/store";

export const Route = createFileRoute("/academy/diagnostico")({ component: Diagnostic });

const QUESTIONS: { q: string; options: string[] }[] = [
  {
    q: "Com que frequência você usa IA generativa no trabalho?",
    options: ["Nunca usei", "Já testei", "Uso toda semana", "Uso todo dia"],
  },
  {
    q: "Como você escreve seus prompts hoje?",
    options: [
      "Frases curtas e soltas",
      "Com algum contexto",
      "Com papel, contexto e formato",
      "Com modelos que reutilizo e refino",
    ],
  },
  {
    q: "Você sabe quais dados não deve inserir em uma IA?",
    options: [
      "Não tenho certeza",
      "Tenho uma ideia geral",
      "Conheço as regras da minha empresa",
      "Aplico e oriento outras pessoas",
    ],
  },
  {
    q: "Como você confere uma resposta da IA?",
    options: [
      "Costumo usar direto",
      "Releio rápido",
      "Confiro fatos e números",
      "Peço fontes e valido com um segundo método",
    ],
  },
  {
    q: "Você já transformou uma tarefa de rotina em processo com IA?",
    options: [
      "Não",
      "Apenas testes pontuais",
      "Sim, em uma tarefa",
      "Sim, em várias, com resultado medido",
    ],
  },
  {
    q: "Qual é sua experiência em liderar ou padronizar o uso de IA no time?",
    options: [
      "Nenhuma",
      "Troco dicas informais",
      "Compartilho modelos com colegas",
      "Defino regras e acompanho resultados",
    ],
  },
];

const GOALS = [
  "Produzir mais, com menos retrabalho",
  "Melhorar a qualidade do que entrego",
  "Decidir melhor com dados",
  "Padronizar o uso de IA no meu time",
  "Liderar a adoção de IA na empresa",
];

const LEVEL_TEXT: Record<Level, string> = {
  iniciante:
    "Iniciante: vamos reforçar fundamentos e segurança, com mais tarefas guiadas e modelos prontos.",
  intermediario:
    "Intermediário: você já usa IA. A trilha foca em estrutura de prompts, verificação e ganho mensurável.",
  avancado:
    "Avançado: foco em técnicas avançadas, padronização e governança. Você pode avançar mais rápido.",
};

function Diagnostic() {
  const nav = useNavigate();
  const { state } = useAcademy();
  const [step, setStep] = useState(0);
  const [dims, setDims] = useState<(number | null)[]>(QUESTIONS.map(() => null));
  const [area, setArea] = useState<AreaId | null>(null);
  const [goal, setGoal] = useState<string | null>(null);

  const answered = dims.every((d) => d !== null);
  const score = answered
    ? Math.round(((dims as number[]).reduce((a, b) => a + b, 0) / (QUESTIONS.length * 3)) * 100)
    : 0;
  const level: Level = score < 35 ? "iniciante" : score < 70 ? "intermediario" : "avancado";

  const confirm = () => {
    updateAcademy((s) => ({
      ...s,
      profile: {
        area: area!,
        level,
        goal: goal!,
        score,
        dims: dims as number[],
        createdAt: new Date().toISOString(),
      },
    }));
    void nav({ to: "/academy/painel" });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow text-muted-foreground">
        Módulo 0 · Diagnóstico · {step < 3 ? `Etapa ${step + 1} de 4` : "Etapa 4 de 4"}
      </p>
      <h1 className="display mt-4 text-[clamp(2rem,5vw,3.4rem)]">
        {
          [
            "Como você usa IA hoje?",
            "Qual é a sua área?",
            "O que você quer alcançar?",
            "Sua trilha recomendada",
          ][step]
        }
      </h1>
      {state.profile && step === 0 && (
        <p className="mt-4 border-l-2 border-foreground pl-3 text-sm text-muted-foreground">
          Você já tem uma trilha neste navegador. Refazer o diagnóstico substitui o perfil, mas
          mantém seu progresso.{" "}
          <Link to="/academy/painel" className="underline underline-offset-4">
            Voltar ao painel
          </Link>
        </p>
      )}

      {step === 0 && (
        <div className="mt-10 space-y-10">
          {QUESTIONS.map((q, qi) => (
            <fieldset key={q.q}>
              <legend className="text-base font-medium">
                {qi + 1}. {q.q}
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((o, oi) => (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={dims[qi] === oi}
                    onClick={() => setDims((d) => d.map((v, i) => (i === qi ? oi : v)))}
                    className={`min-h-12 border px-4 py-3 text-left text-sm ${dims[qi] === oi ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
          <Button disabled={!answered} onClick={() => setStep(1)}>
            Continuar
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="mt-10">
          <div className="grid gap-2 sm:grid-cols-2">
            {AREAS.map((a) => (
              <button
                key={a.id}
                type="button"
                aria-pressed={area === a.id}
                onClick={() => setArea(a.id)}
                className={`min-h-14 border px-4 py-3 text-left ${area === a.id ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}
              >
                <span className="block text-sm font-medium">{a.name}</span>
                <span
                  className={`mt-1 block text-xs ${area === a.id ? "text-background/70" : "text-muted-foreground"}`}
                >
                  {a.tarefa}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setStep(0)}>
              Voltar
            </Button>
            <Button disabled={!area} onClick={() => setStep(2)}>
              Continuar
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-10">
          <div className="space-y-2">
            {GOALS.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={goal === g}
                onClick={() => setGoal(g)}
                className={`flex min-h-12 w-full items-center border px-4 py-3 text-left text-sm ${goal === g ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button disabled={!goal} onClick={() => setStep(3)}>
              Ver minha trilha
            </Button>
          </div>
        </div>
      )}

      {step === 3 && area && goal && (
        <div className="mt-10 space-y-6">
          <div className="border border-border p-6">
            <p className="eyebrow text-muted-foreground">Perfil de uso de IA</p>
            <p className="mt-3 text-2xl font-medium tracking-tight">
              {level === "iniciante"
                ? "Iniciante"
                : level === "intermediario"
                  ? "Intermediário"
                  : "Avançado"}{" "}
              · {score}/100
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {LEVEL_TEXT[level]}
            </p>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="eyebrow text-muted-foreground">Área</dt>
                <dd className="mt-1">{AREA_BY_ID[area].name}</dd>
              </div>
              <div>
                <dt className="eyebrow text-muted-foreground">Objetivo</dt>
                <dd className="mt-1">{goal}</dd>
              </div>
              <div>
                <dt className="eyebrow text-muted-foreground">Projeto final</dt>
                <dd className="mt-1">{AREA_BY_ID[area].entrega}</dd>
              </div>
              <div>
                <dt className="eyebrow text-muted-foreground">Indicadores da área</dt>
                <dd className="mt-1">{AREA_BY_ID[area].indicadores.join("; ")}</dd>
              </div>
            </dl>
          </div>
          <p className="text-sm text-muted-foreground">
            Autoavaliação: o resultado orienta a trilha e não é uma nota. Você pode refazer quando
            quiser.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              Voltar
            </Button>
            <Button onClick={confirm}>Começar o Módulo 0</Button>
          </div>
        </div>
      )}
    </div>
  );
}

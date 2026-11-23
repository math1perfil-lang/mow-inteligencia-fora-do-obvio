import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AREA_BY_ID } from "@/lib/academy/areas";
import { fill, type Task } from "@/lib/academy/course";
import { evaluate, PASS_SCORE, type Evaluation } from "@/lib/academy/feedback";
import { updateAcademy, type AcademyState } from "@/lib/academy/store";
import { FeedbackPanel } from "./FeedbackPanel";
import { SavePromptForm } from "./SavePromptForm";

const KIND = {
  choice: "Múltipla escolha",
  truefalse: "Verdadeiro ou falso",
  order: "Ordenação de etapas",
  prompt: "Criação de prompt",
} as const;

function markDone(id: string, points: number) {
  updateAcademy((s) => ({ ...s, done: { ...s.done, [id]: Math.max(points, s.done[id] ?? 0) } }));
}

export function TaskRunner({
  task,
  index,
  state,
}: {
  task: Task;
  index: number;
  state: AcademyState;
}) {
  const area = AREA_BY_ID[state.profile!.area];
  const done = (state.done[task.id] ?? 0) > 0;
  const [result, setResult] = useState<null | { ok: boolean; why: string }>(null);
  const [sel, setSel] = useState<number | boolean | null>(null);
  const [order, setOrder] = useState<number[]>(() =>
    task.type === "order" ? task.steps.map((_, i) => i).reverse() : [],
  );
  const [text, setText] = useState("");
  const [ev, setEv] = useState<Evaluation | null>(null);

  const finish = (ok: boolean, why: string) => {
    setResult({ ok, why });
    if (ok) markDone(task.id, 100);
  };

  return (
    <li className="border border-border p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="eyebrow text-muted-foreground">
          Tarefa {index + 1} · {KIND[task.type]}
        </span>
        {done && <span className="eyebrow">Concluída</span>}
      </div>
      <p className="mt-3 text-base leading-relaxed">{fill(task.prompt, area)}</p>

      {task.type === "choice" && (
        <div className="mt-4 space-y-2" role="radiogroup" aria-label="Alternativas">
          {task.options.map((o, i) => (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={sel === i}
              onClick={() => setSel(i)}
              className={`flex min-h-12 w-full items-center border px-4 py-3 text-left text-sm ${sel === i ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}
            >
              {o}
            </button>
          ))}
          <Button
            className="mt-2"
            disabled={sel === null}
            onClick={() => finish(sel === task.answer, task.why)}
          >
            Conferir
          </Button>
        </div>
      )}

      {task.type === "truefalse" && (
        <div className="mt-4 flex flex-wrap gap-2">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              type="button"
              aria-pressed={sel === v}
              onClick={() => setSel(v)}
              className={`min-h-12 min-w-32 border px-4 text-sm ${sel === v ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}
            >
              {v ? "Verdadeiro" : "Falso"}
            </button>
          ))}
          <Button disabled={sel === null} onClick={() => finish(sel === task.answer, task.why)}>
            Conferir
          </Button>
        </div>
      )}

      {task.type === "order" && (
        <div className="mt-4">
          <ol className="space-y-2">
            {order.map((stepIdx, pos) => (
              <li
                key={stepIdx}
                className="flex items-center gap-2 border border-border p-2 text-sm"
              >
                <span className="eyebrow w-6 text-center text-muted-foreground">{pos + 1}</span>
                <span className="flex-1">{task.steps[stepIdx]}</span>
                <button
                  type="button"
                  aria-label="Subir"
                  disabled={pos === 0}
                  className="h-9 w-9 border border-border disabled:opacity-30"
                  onClick={() =>
                    setOrder((o) => {
                      const n = [...o];
                      [n[pos - 1], n[pos]] = [n[pos], n[pos - 1]];
                      return n;
                    })
                  }
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Descer"
                  disabled={pos === order.length - 1}
                  className="h-9 w-9 border border-border disabled:opacity-30"
                  onClick={() =>
                    setOrder((o) => {
                      const n = [...o];
                      [n[pos + 1], n[pos]] = [n[pos], n[pos + 1]];
                      return n;
                    })
                  }
                >
                  ↓
                </button>
              </li>
            ))}
          </ol>
          <Button
            className="mt-3"
            onClick={() =>
              finish(
                order.every((v, i) => v === i),
                task.why,
              )
            }
          >
            Conferir ordem
          </Button>
        </div>
      )}

      {task.type === "prompt" && (
        <div className="mt-4">
          <label className="sr-only" htmlFor={`p-${task.id}`}>
            Seu prompt
          </label>
          <Textarea
            id={`p-${task.id}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={9}
            placeholder={"Papel:\nContexto:\nTarefa:\nFormato:\nCritérios:\nRevisão:"}
            className="text-base"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Use apenas dados fictícios ou anonimizados. Evite {area.sensivel}.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              disabled={text.trim().length < 10}
              onClick={() => {
                const e = evaluate(text, area);
                setEv(e);
                const ok = e.total >= PASS_SCORE && e.warnings.length === 0;
                setResult({
                  ok,
                  why: ok
                    ? "Prompt aprovado nesta tarefa. Salve-o na biblioteca para reutilizar."
                    : e.warnings.length
                      ? "Remova os dados sensíveis para concluir a tarefa."
                      : `Alcance nota ${PASS_SCORE} ou mais para concluir. Ajuste e avalie de novo.`,
                });
                if (ok) markDone(task.id, Math.round(e.total * 10));
              }}
            >
              Avaliar prompt
            </Button>
            <Button variant="outline" type="button" onClick={() => setText(area.template)}>
              Usar modelo da minha área
            </Button>
          </div>
          {ev && <FeedbackPanel ev={ev} />}
          {ev && ev.warnings.length === 0 && (
            <SavePromptForm
              text={text}
              quality={ev.total}
              area={area.id}
              defaultTitle={`Prompt da tarefa ${index + 1}`}
            />
          )}
        </div>
      )}

      {result && (
        <p
          role="status"
          className={`mt-4 border-l-2 pl-3 text-sm leading-relaxed ${result.ok ? "border-foreground" : "border-muted-foreground text-muted-foreground"}`}
        >
          <strong className="font-medium">{result.ok ? "Muito bem." : "Ainda não."}</strong>{" "}
          {result.why}
          {!result.ok && task.type !== "prompt" && " Você pode tentar de novo."}
        </p>
      )}
    </li>
  );
}

import type { Evaluation } from "@/lib/academy/feedback";

const TIER_LABEL = {
  excelente: "Excelente",
  bom: "Bom",
  mediano: "Mediano",
  fraco: "Fraco",
} as const;

export function FeedbackPanel({ ev }: { ev: Evaluation }) {
  return (
    <section aria-live="polite" className="mt-6 border border-border p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-medium">
          {TIER_LABEL[ev.tier]} · {ev.total.toFixed(1)} / 10
        </h3>
        <span className="eyebrow text-muted-foreground">Análise por regras</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed">{ev.summary}</p>
      {ev.warnings.length > 0 && (
        <div role="alert" className="mt-4 border border-foreground p-3 text-sm">
          <strong className="font-medium">Atenção à segurança.</strong> {ev.warnings.join(" ")}{" "}
          Remova ou troque por dados fictícios antes de usar qualquer ferramenta.
        </div>
      )}
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {ev.items.map((i) => (
          <li key={i.id}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">{i.label}</span>
              <span className="text-muted-foreground">{i.score}/10</span>
            </div>
            <div className="mt-1 h-1 bg-border" role="presentation">
              <div className="h-full bg-foreground" style={{ width: `${i.score * 10}%` }} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {i.score >= 8 ? i.message : `${i.message} ${i.tip}`}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        Esta análise olha a forma do prompt (contexto, estrutura, segurança etc.). Não confere fatos
        nem substitui a avaliação de um instrutor.
      </p>
    </section>
  );
}

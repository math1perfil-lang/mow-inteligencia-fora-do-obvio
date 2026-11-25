import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby="start-step-title" className="ac-rise">
      <p className="eyebrow text-muted-foreground">{eyebrow}</p>
      <h2 id="start-step-title" className="mt-3 text-[clamp(1.9rem,4.5vw,3.2rem)] font-light">
        {title}
      </h2>
      <div className="mt-8 space-y-6">{children}</div>
    </section>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-[15px] leading-relaxed text-muted-foreground">
      {items.map((i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--ac-accent)]" />
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}

export function CodeBlock({ label, text }: { label?: string; text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="ac-code">
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow text-muted-foreground">{label ?? "Modelo"}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(text).then(() => {
              setOk(true);
              setTimeout(() => setOk(false), 1500);
            });
          }}
          className="inline-flex min-h-9 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {ok ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {ok ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-[14px] leading-relaxed">
        {text}
      </pre>
    </div>
  );
}

export function Choice({
  selected,
  correct,
  wrong,
  onClick,
  children,
  disabled,
}: {
  selected?: boolean;
  correct?: boolean;
  wrong?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`ac-choice ${selected ? "is-on" : ""} ${correct ? "is-ok" : ""} ${wrong ? "is-bad" : ""}`}
    >
      {children}
    </button>
  );
}

export function Field({
  id,
  label,
  value,
  onChange,
  rows = 3,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string | undefined;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <textarea
        id={id}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full px-3 py-2 text-[15px] leading-relaxed"
      />
    </div>
  );
}

export function Result({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <p role="status" className="text-sm leading-relaxed text-muted-foreground">
      <strong className={ok ? "text-[#5fd6a5]" : "text-[#ff9a9a]"}>
        {ok ? "✓ Correto. " : "✗ Ainda não. "}
      </strong>
      {children}
    </p>
  );
}

/** Selo exibido em cada atividade que usa o caso fictício. */
export function Selo({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--ac-accent)]/50 bg-[var(--ac-accent)]/10 px-3 py-1 text-xs">
      {children}
    </span>
  );
}

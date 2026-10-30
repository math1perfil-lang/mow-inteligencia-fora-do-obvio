import { useRef, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { contactSchema, sendContact } from "@/lib/contact.functions";
import { Reveal } from "./shared";
import { cn } from "@/lib/utils";

type Field = "name" | "email" | "company" | "subject" | "message";
const FIELDS: { id: Field; label: string; type?: string; optional?: boolean; auto?: string }[] = [
  { id: "name", label: "Nome", auto: "name" },
  { id: "email", label: "E-mail", type: "email", auto: "email" },
  { id: "company", label: "Empresa", optional: true, auto: "organization" },
  { id: "subject", label: "Assunto" },
];

export function Contact() {
  const send = useServerFn(sendContact);
  const started = useRef(Date.now());
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      company: String(fd.get("company") ?? ""),
      subject: String(fd.get("subject") ?? ""),
      message: String(fd.get("message") ?? ""),
      website: String(fd.get("website") ?? ""),
      elapsed: Date.now() - started.current,
    };
    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
      const errs: Partial<Record<Field, string>> = {};
      for (const iss of parsed.error.issues) errs[iss.path[0] as Field] ??= iss.message;
      setErrors(errs);
      setStatus("idle");
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      const res = await send({ data: parsed.data });
      if (res.ok) {
        setStatus("ok");
        setMsg("Mensagem enviada. Responderemos em breve.");
        e.currentTarget?.reset();
      } else {
        setStatus("error");
        setMsg(res.error);
      }
    } catch {
      setStatus("error");
      setMsg("Não foi possível enviar agora. Tente novamente.");
    }
  }

  const input =
    "mt-2 block w-full border-0 border-b border-input bg-transparent px-0 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground focus-visible:outline-none";

  return (
    <section id="contato" aria-labelledby="contact-title" className="section-light py-24 md:py-40">
      <div className="mx-auto grid w-full max-w-[1440px] gap-16 px-5 md:grid-cols-12 md:px-10">
        <div className="md:col-span-6">
          <Reveal>
            <p className="eyebrow text-muted-foreground">05 / Contato</p>
            <h2 id="contact-title" className="display mt-8 text-[clamp(2.8rem,7.5vw,7rem)]">
              Tem algo fora do óbvio em mente?
            </h2>
            <p className="mt-8 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
              Uma ideia, um desafio ou uma oportunidade? Vamos descobrir até onde ela pode chegar.
            </p>
            <a
              href="#form-nome"
              className="mt-10 inline-flex h-12 items-center border border-foreground bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-transparent hover:text-foreground"
            >
              Vamos conversar ↗
            </a>
          </Reveal>
        </div>

        <Reveal className="md:col-span-5 md:col-start-8">
          <form noValidate onSubmit={onSubmit} className="space-y-8" aria-describedby="form-status">
            {FIELDS.map((f) => (
              <div key={f.id}>
                <label htmlFor={`form-${f.id === "name" ? "nome" : f.id}`} className="eyebrow text-muted-foreground">
                  {f.label}
                  {f.optional && " (opcional)"}
                </label>
                <input
                  id={`form-${f.id === "name" ? "nome" : f.id}`}
                  name={f.id}
                  type={f.type ?? "text"}
                  autoComplete={f.auto}
                  maxLength={f.id === "email" ? 255 : 150}
                  aria-invalid={!!errors[f.id]}
                  aria-describedby={errors[f.id] ? `${f.id}-err` : undefined}
                  className={cn(input, errors[f.id] && "border-destructive")}
                />
                {errors[f.id] && (
                  <p id={`${f.id}-err`} className="mt-2 text-sm text-destructive">{errors[f.id]}</p>
                )}
              </div>
            ))}
            <div>
              <label htmlFor="form-message" className="eyebrow text-muted-foreground">Mensagem</label>
              <textarea
                id="form-message"
                name="message"
                rows={5}
                maxLength={3000}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? "message-err" : undefined}
                className={cn(input, "resize-none", errors.message && "border-destructive")}
              />
              {errors.message && <p id="message-err" className="mt-2 text-sm text-destructive">{errors.message}</p>}
            </div>
            {/* Honeypot */}
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="flex h-14 w-full items-center justify-between border border-foreground bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-transparent hover:text-foreground disabled:opacity-60"
            >
              {status === "sending" ? "Enviando…" : "Enviar mensagem"} <span aria-hidden>↗</span>
            </button>
            <p
              id="form-status"
              role="status"
              aria-live="polite"
              className={cn("min-h-5 text-sm", status === "error" ? "text-destructive" : "text-foreground")}
            >
              {(status === "ok" || status === "error") && msg}
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

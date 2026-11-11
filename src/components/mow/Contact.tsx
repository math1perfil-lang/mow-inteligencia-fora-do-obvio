import { useRef, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { contactSchema, sendContact } from "@/lib/contact.functions";
import { Reveal } from "./shared";
import { cn } from "@/lib/utils";
import { useLang } from "@/i18n/context";

type Field = "name" | "email" | "company" | "subject" | "message";
const FIELDS: { id: Exclude<Field, "message">; type?: string; optional?: boolean; auto?: string }[] = [
  { id: "name", auto: "name" },
  { id: "email", type: "email", auto: "email" },
  { id: "company", optional: true, auto: "organization" },
  { id: "subject" },
];

export function Contact() {
  const send = useServerFn(sendContact);
  const { t } = useLang();
  const started = useRef(Date.now());
  const [errors, setErrors] = useState<Partial<Record<Field, true>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [msg, setMsg] = useState<"ok" | "not_configured" | "send_failed" | "network">("ok");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
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
      const errs: Partial<Record<Field, true>> = {};
      for (const iss of parsed.error.issues) errs[iss.path[0] as Field] = true;
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
        setMsg("ok");
        form.reset();
      } else {
        setStatus("error");
        setMsg(res.error);
      }
    } catch {
      setStatus("error");
      setMsg("send_failed");
    }
  }

  const input =
    "mt-2 block w-full border-0 border-b border-input bg-transparent px-0 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground focus-visible:outline-none";

  return (
    <section id="contato" aria-labelledby="contact-title" className="section-light py-24 md:py-40">
      <div className="mx-auto grid w-full max-w-[1440px] gap-16 px-5 md:grid-cols-12 md:px-10">
        <div className="md:col-span-6">
          <Reveal>
            <p className="eyebrow text-muted-foreground">{t.c.eyebrow}</p>
            <h2 id="contact-title" className="display mt-8 text-[clamp(2.8rem,7.5vw,7rem)]">
{t.c.title}
            </h2>
            <p className="mt-8 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
{t.c.text}
            </p>
            <a
              href="#form-nome"
              className="mt-10 inline-flex h-12 items-center border border-foreground bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-transparent hover:text-foreground"
            >
{t.talk}
            </a>
          </Reveal>
        </div>

        <Reveal className="md:col-span-5 md:col-start-8">
          <form noValidate onSubmit={onSubmit} className="space-y-8" aria-describedby="form-status">
            {FIELDS.map((f) => (
              <div key={f.id}>
                <label htmlFor={`form-${f.id === "name" ? "nome" : f.id}`} className="eyebrow text-muted-foreground">
                  {t.c.fields[f.id]}
                  {f.optional && t.c.optional}
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
                  <p id={`${f.id}-err`} className="mt-2 text-sm text-destructive">{t.c.errs[f.id]}</p>
                )}
              </div>
            ))}
            <div>
              <label htmlFor="form-message" className="eyebrow text-muted-foreground">{t.c.fields.message}</label>
              <textarea
                id="form-message"
                name="message"
                rows={5}
                maxLength={3000}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? "message-err" : undefined}
                className={cn(input, "resize-none", errors.message && "border-destructive")}
              />
              {errors.message && <p id="message-err" className="mt-2 text-sm text-destructive">{t.c.errs.message}</p>}
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
              {status === "sending" ? t.c.sending : t.c.send} <span aria-hidden>↗</span>
            </button>
            <p
              id="form-status"
              role="status"
              aria-live="polite"
              className={cn("min-h-5 text-sm", status === "error" ? "text-destructive" : "text-foreground")}
            >
              {(status === "ok" || status === "error") && (msg === "ok" ? t.c.ok : t.c.server[msg])}
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

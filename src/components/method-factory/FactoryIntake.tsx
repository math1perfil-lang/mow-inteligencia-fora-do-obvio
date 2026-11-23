import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PROBLEM_DOMAINS,
  PROBLEM_URGENCY,
  parseProblemEntries,
  pickVisibleValues,
  serializeProblemEntries,
  validateBrief,
  validateStep,
  visibleFields,
  visibleSteps,
  type Field,
  type ProblemEntry,
  type Values,
} from "@/lib/method-factory/brief-schema";
import {
  checkFactoryInvite,
  submitFactoryBrief,
  type BriefSubmissionResult,
} from "@/lib/method-factory/workflow.functions";

type InviteState = "checking" | "valid" | "invalid";

export function FactoryIntake() {
  const [inviteState, setInviteState] = useState<InviteState>("checking");
  const [token, setToken] = useState("");
  const [values, setValues] = useState<Values>({});
  const [index, setIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmedInternalUse, setConfirmedInternalUse] = useState(false);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<BriefSubmissionResult | null>(null);
  const [notice, setNotice] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const tokenRef = useRef<string | null>(null);
  const steps = visibleSteps(values);
  const step = steps[index];
  const reviewing = index === steps.length;

  useEffect(() => {
    let cancelled = false;
    let inviteToken = tokenRef.current;

    if (!inviteToken) {
      inviteToken = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      if (window.location.hash) {
        window.history.replaceState(
          window.history.state,
          "",
          `${window.location.pathname}${window.location.search}`,
        );
      }
      tokenRef.current = inviteToken;
    }

    if (!inviteToken) {
      setInviteState("invalid");
      return () => {
        cancelled = true;
      };
    }

    setInviteState("checking");
    void checkFactoryInvite({ data: { token: inviteToken } })
      .then(({ valid }) => {
        if (cancelled) return;
        if (valid) {
          setToken(inviteToken);
          setInviteState("valid");
        } else {
          setToken("");
          setInviteState("invalid");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setToken("");
          setInviteState("invalid");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    heading.current?.focus();
  }, [index, inviteState, receipt]);

  function navigate(nextIndex: number) {
    setIndex(nextIndex);
    setErrors({});
    setNotice("");
    setConfirmedInternalUse(false);
  }

  function proceed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!step) return;
    const nextErrors = validateStep(step, values);
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    navigate(index + 1);
  }

  async function submitBrief() {
    const nextErrors = validateBrief(values);
    if (Object.keys(nextErrors).length > 0) {
      const firstIncompleteStep = steps.findIndex(
        (item) => Object.keys(validateStep(item, values)).length > 0,
      );
      setErrors(nextErrors);
      setIndex(Math.max(0, firstIncompleteStep));
      setNotice("Revise os campos indicados antes de enviar.");
      return;
    }
    if (!confirmedInternalUse || !token) {
      setNotice("Confirme o uso interno para continuar.");
      return;
    }

    setBusy(true);
    setNotice("");
    try {
      const result = await submitFactoryBrief({
        data: { token, values, confirmInternalUse: confirmedInternalUse },
      });
      if (result.ok) {
        setReceipt(result);
        setToken("");
        tokenRef.current = null;
        return;
      }
      setNotice(
        result.error === "invalid_brief"
          ? "Não foi possível concluir o envio. Confira as respostas ou solicite orientação a quem enviou o convite."
          : "Não foi possível concluir o envio. Se necessário, solicite orientação a quem enviou o convite.",
      );
    } catch {
      setNotice(
        "O envio não foi concluído agora. Tente novamente mais tarde ou procure quem enviou o convite.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (inviteState !== "valid") {
    return (
      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="eyebrow text-white/60">Method Factory · Briefing confidencial</p>
        <h1
          ref={heading}
          tabIndex={-1}
          className="mt-5 text-3xl font-semibold tracking-tight outline-none sm:text-4xl"
        >
          {inviteState === "checking"
            ? "Verificando acesso"
            : "Não foi possível abrir este formulário"}
        </h1>
        <p
          role={inviteState === "invalid" ? "alert" : "status"}
          className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70"
        >
          {inviteState === "checking"
            ? "Aguarde enquanto verificamos o acesso."
            : "Este link não está disponível. Se você esperava um convite, entre em contato com quem o enviou."}
        </p>
      </div>
    );
  }

  if (receipt) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="eyebrow text-white/60">Method Factory · Recebimento</p>
        <div className="mt-6 flex max-w-2xl gap-4 border border-white/20 p-5 sm:p-7">
          <Check className="mt-1 size-5 shrink-0" aria-hidden="true" />
          <div>
            <h1
              ref={heading}
              tabIndex={-1}
              className="text-2xl font-semibold tracking-tight outline-none sm:text-3xl"
            >
              Briefing recebido
            </h1>
            {receipt.receiptCode ? (
              <p className="mt-3 font-mono text-sm text-white/75">Recibo: {receipt.receiptCode}</p>
            ) : null}
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Obrigado por compartilhar o contexto. Este envio não gera resposta ou recomendação
              automática para a empresa. Qualquer rascunho interno exige revisão humana.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 pt-10 sm:px-8 sm:pt-14">
      <div className="max-w-3xl">
        <p className="eyebrow text-white/60">Briefing · Entrada de contexto</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tighter sm:text-5xl">
          Antes da solução,
          <br />a pergunta certa.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">
          Compartilhe informações necessárias para uma análise interna. Não inclua dados pessoais,
          credenciais, contatos ou materiais protegidos. Nenhum arquivo ou anexo é solicitado.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:gap-14">
        <aside className="lg:w-64 lg:shrink-0">
          <nav aria-label="Etapas do briefing">
            <ol className="flex gap-2 overflow-x-auto pb-4 lg:flex-col lg:gap-1">
              {[...steps.map((item) => item.title), "Revisão e envio"].map((title, i) => (
                <li key={title}>
                  <button
                    type="button"
                    disabled={i > index}
                    aria-current={i === index ? "step" : undefined}
                    onClick={() => navigate(i)}
                    className={`flex min-h-12 w-full items-center gap-3 whitespace-nowrap border px-3 py-3 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:text-white/35 ${i === index ? "border-white bg-white text-black" : "border-transparent text-white/65 hover:border-white/20"}`}
                  >
                    <span className="font-mono text-xs">
                      {i < index ? (
                        <Check className="size-3" aria-hidden="true" />
                      ) : (
                        String(i + 1).padStart(2, "0")
                      )}
                    </span>
                    {title}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <p className="mt-4 hidden border-t border-white/15 pt-4 text-xs leading-relaxed text-white/60 lg:block">
            Suas respostas são usadas no fluxo interno da Factory. O envio não significa validação
            independente nem aprovação de um método.
          </p>
        </aside>

        <section className="min-w-0 flex-1 lg:max-w-3xl" aria-labelledby="intake-step-title">
          <div className="mb-7 border-b border-white/20 pb-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/65">
              {index + 1} de {steps.length + 1} ·{" "}
              {reviewing ? "Confira antes de enviar" : "* Campo necessário"}
            </p>
            <h2
              ref={heading}
              id="intake-step-title"
              tabIndex={-1}
              className="mt-3 text-2xl font-medium tracking-tight outline-none sm:text-3xl"
            >
              {reviewing ? "Revisar e confirmar" : step?.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              {reviewing
                ? "Revise as informações e confirme o uso interno para enviar."
                : step?.description}
            </p>
          </div>

          {notice ? (
            <p
              role="status"
              className="mb-6 border border-white/30 bg-white/5 p-4 text-sm leading-relaxed"
            >
              {notice}
            </p>
          ) : null}

          {reviewing ? (
            <div>
              <div className="space-y-7">
                {steps.map((item, stepIndex) => (
                  <section key={item.id} className="border border-white/20 p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-medium">{item.title}</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => navigate(stepIndex)}
                        className="min-h-11 text-xs"
                      >
                        Editar etapa
                      </Button>
                    </div>
                    <dl className="mt-4 space-y-5">
                      {visibleFields(item, values).map((field) => (
                        <div key={field.id}>
                          <dt className="text-xs text-white/55">{field.label}</dt>
                          {field.kind === "problem-list" ? (
                            <dd className="mt-2 space-y-3">
                              {parseProblemEntries(values[field.id]).map((entry, entryIndex) => (
                                <div
                                  key={entryIndex}
                                  className="border-l border-white/40 pl-3 text-sm leading-relaxed"
                                >
                                  <p className="font-medium">
                                    {entry.title || `Dor ${entryIndex + 1}`}
                                  </p>
                                  <p className="text-white/65">
                                    {entry.domain} · Prioridade percebida: {entry.urgency}
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap break-words">
                                    {entry.description}
                                  </p>
                                  {entry.impact ? (
                                    <p className="mt-1 text-white/65">
                                      Impacto informado: {entry.impact}
                                    </p>
                                  ) : null}
                                </div>
                              ))}
                            </dd>
                          ) : (
                            <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
                              {values[field.id]?.trim() || "Não informado (opcional)"}
                            </dd>
                          )}
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}
              </div>

              <div className="mt-7 flex gap-3 border border-white/20 p-5 text-sm leading-relaxed text-white/70">
                <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <p>
                  O conteúdo é recebido para uso interno. O rascunho, se produzido, não é uma
                  recomendação automática para a empresa e exige revisão humana.
                </p>
              </div>
              <div className="mt-6 border border-white/20 p-5">
                <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
                  <input
                    type="checkbox"
                    checked={confirmedInternalUse}
                    onChange={(event) => setConfirmedInternalUse(event.target.checked)}
                    className="mt-1 size-4 shrink-0 accent-white"
                    required
                  />
                  <span>
                    Confirmo que este briefing será usado internamente pela MOW Method Factory para
                    análise e desenvolvimento de método.
                  </span>
                </label>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-12"
                  disabled={busy}
                  onClick={() => navigate(index - 1)}
                >
                  <ArrowLeft aria-hidden="true" /> Voltar
                </Button>
                <Button
                  type="button"
                  className="min-h-12 px-6"
                  disabled={busy || !confirmedInternalUse}
                  onClick={() => void submitBrief()}
                >
                  {busy ? "Enviando…" : "Confirmar e enviar"}
                  <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : step ? (
            <form onSubmit={proceed} noValidate>
              <div className="space-y-8">
                {visibleFields(step, values).map((field) => (
                  <BriefField
                    key={field.id}
                    field={field}
                    value={values[field.id] ?? ""}
                    error={errors[field.id]}
                    onChange={(value) => {
                      setValues((current) => pickVisibleValues({ ...current, [field.id]: value }));
                      setErrors((current) => {
                        const next = { ...current };
                        delete next[field.id];
                        return next;
                      });
                    }}
                  />
                ))}
              </div>
              <div className="mt-10 flex items-center justify-between gap-4 border-t border-white/15 pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={index === 0}
                  className="min-h-12"
                  onClick={() => navigate(index - 1)}
                >
                  <ArrowLeft aria-hidden="true" /> Voltar
                </Button>
                <Button type="submit" className="min-h-12 px-6">
                  {index === steps.length - 1 ? "Revisar respostas" : "Continuar"}
                  <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </form>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function BriefField({
  field,
  value,
  error,
  onChange,
}: {
  field: Field;
  value: string;
  error: string | undefined;
  onChange: (value: string) => void;
}) {
  const hintId = `${field.id}-hint`;
  const errorId = `${field.id}-error`;
  const limit = field.kind === "textarea" ? 3000 : field.kind === "url" ? 2000 : 500;
  const describedBy = error ? `${hintId} ${errorId}` : hintId;
  const common = {
    id: field.id,
    name: field.id,
    value,
    "aria-invalid": Boolean(error),
    "aria-required": Boolean(field.required),
    "aria-describedby": describedBy,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => onChange(event.target.value),
  };

  if (field.kind === "problem-list") {
    return <ProblemListField field={field} value={value} error={error} onChange={onChange} />;
  }

  return (
    <div className="space-y-3">
      <Label htmlFor={field.id} className="text-base leading-relaxed">
        {field.label}{" "}
        {field.required ? (
          <span className="text-white/65">*</span>
        ) : (
          <span className="text-xs font-normal text-white/55">· opcional</span>
        )}
      </Label>
      <p id={hintId} className="text-sm leading-relaxed text-white/65">
        {field.help ?? "Compartilhe contexto, não dados pessoais ou credenciais."}
      </p>
      {field.kind === "select" ? (
        <select
          {...common}
          className="h-12 w-full border border-white/25 bg-[#151515] px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <option value="">Selecione uma resposta</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : field.kind === "textarea" ? (
        <Textarea
          {...common}
          maxLength={limit}
          rows={4}
          placeholder={field.placeholder ?? "Escreva com suas palavras. Se não souber, diga isso."}
          className="min-h-28 border-white/25 bg-white/[0.025] text-base placeholder:text-white/40"
        />
      ) : (
        <Input
          {...common}
          type={field.kind === "url" ? "url" : "text"}
          maxLength={limit}
          placeholder={field.placeholder ?? "Descreva ou informe que ainda não sabe"}
          autoComplete="off"
          className="h-12 border-white/25 bg-white/[0.025] text-base placeholder:text-white/40"
        />
      )}
      {error ? (
        <p id={errorId} className="text-sm font-medium text-white" role="alert">
          {error}
        </p>
      ) : null}
      {field.kind === "textarea" ? (
        <p className="text-right font-mono text-[10px] text-white/50">
          {value.length}/{limit} caracteres
        </p>
      ) : null}
    </div>
  );
}

function ProblemListField({
  field,
  value,
  error,
  onChange,
}: {
  field: Field;
  value: string;
  error: string | undefined;
  onChange: (value: string) => void;
}) {
  const savedEntries = parseProblemEntries(value);
  const entries = savedEntries.length > 0 ? savedEntries : [emptyProblem()];

  function update(index: number, changes: Partial<ProblemEntry>) {
    const next = [...entries];
    const current = next[index];
    if (!current) return;
    next[index] = { ...current, ...changes };
    onChange(serializeProblemEntries(next));
  }

  return (
    <fieldset
      className="space-y-5"
      aria-describedby={error ? `${field.id}-hint ${field.id}-error` : `${field.id}-hint`}
    >
      <legend className="text-base leading-relaxed">
        {field.label} <span className="text-white/65">*</span>
      </legend>
      <p id={`${field.id}-hint`} className="text-sm leading-relaxed text-white/65">
        {field.help ?? "Descreva cada dor separadamente."}
      </p>
      {entries.map((entry, index) => (
        <section
          key={index}
          className="space-y-5 border border-white/20 p-4 sm:p-5"
          aria-labelledby={`problem-heading-${index}`}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 id={`problem-heading-${index}`} className="text-sm font-medium">
              Dor {index + 1}
            </h3>
            {entries.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                className="min-h-10 text-xs"
                aria-label={`Remover dor ${index + 1}`}
                onClick={() =>
                  onChange(serializeProblemEntries(entries.filter((_, i) => i !== index)))
                }
              >
                Remover
              </Button>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`problem-title-${index}`}>Nome da dor {index + 1}</Label>
            <Input
              id={`problem-title-${index}`}
              value={entry.title}
              maxLength={140}
              autoComplete="off"
              placeholder="Ex.: propostas comerciais não avançam"
              onChange={(event) => update(index, { title: event.target.value })}
              className="h-12 border-white/25 bg-white/[0.025] text-base placeholder:text-white/40"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`problem-domain-${index}`}>Área da dor {index + 1}</Label>
              <select
                id={`problem-domain-${index}`}
                value={entry.domain}
                onChange={(event) => update(index, { domain: event.target.value })}
                className="h-12 w-full border border-white/25 bg-[#151515] px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <option value="">Selecione ou marque “Ainda não sei”</option>
                {PROBLEM_DOMAINS.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`problem-urgency-${index}`}>Prioridade percebida {index + 1}</Label>
              <select
                id={`problem-urgency-${index}`}
                value={entry.urgency}
                onChange={(event) => update(index, { urgency: event.target.value })}
                className="h-12 w-full border border-white/25 bg-[#151515] px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <option value="">Selecione uma opção</option>
                {PROBLEM_URGENCY.map((urgency) => (
                  <option key={urgency} value={urgency}>
                    {urgency}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`problem-description-${index}`}>Descrição da dor {index + 1}</Label>
            <Textarea
              id={`problem-description-${index}`}
              value={entry.description}
              maxLength={1500}
              rows={4}
              placeholder="O que acontece, com quem e em que contexto?"
              onChange={(event) => update(index, { description: event.target.value })}
              className="min-h-28 border-white/25 bg-white/[0.025] text-base placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`problem-impact-${index}`}>Impacto conhecido (opcional)</Label>
            <Textarea
              id={`problem-impact-${index}`}
              value={entry.impact}
              maxLength={600}
              rows={3}
              placeholder="Se não for conhecido ou medido, diga isso."
              onChange={(event) => update(index, { impact: event.target.value })}
              className="min-h-24 border-white/25 bg-white/[0.025] text-base placeholder:text-white/40"
            />
          </div>
        </section>
      ))}
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={entries.length >= 20}
        onClick={() => onChange(serializeProblemEntries([...entries, emptyProblem()]))}
      >
        Adicionar outra dor
      </Button>
      {error ? (
        <p id={`${field.id}-error`} className="text-sm font-medium text-white" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

function emptyProblem(): ProblemEntry {
  return { title: "", domain: "", urgency: "", description: "", impact: "" };
}

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BRIEF_STEPS,
  PROBLEM_DOMAINS,
  PROBLEM_URGENCY,
  parseProblemEntries,
  serializeProblemEntries,
  validateStep,
  validateBrief,
  visibleFields,
  type Field,
  type ProblemEntry,
} from "@/lib/method-factory/brief-schema";
import { generateMethodDraft, type MethodDraft } from "@/lib/method-factory/analysis";
import { MethodDraftPreview } from "./MethodDraftPreview";

const DEMO: Record<string, string> = {
  company: "Empresa Exemplo — dados fictícios",
  platformDescription: "Plataforma fictícia para conectar lojas de bairro a compradores locais.",
  businessModel: "Marketplace / dois ou mais lados",
  stage: "Protótipo",
  userGroups: "Lojas locais e moradores do bairro (exemplo fictício).",
  payer: "Modelo comercial ainda em avaliação.",
  geography: "Uma cidade fictícia.",
  pains: serializeProblemEntries([
    {
      title: "Negociações comerciais não avançam",
      domain: "Comercial e vendas",
      urgency: "Alta",
      description:
        "Empresas demonstram interesse, mas a conversa não chega a um próximo passo acordado.",
      impact: "Etapa de perda e impacto ainda não medidos.",
    },
    {
      title: "Pouco retorno após o primeiro acesso",
      domain: "Marketing e publicidade",
      urgency: "Média",
      description:
        "Parte das pessoas chega à plataforma, mas ainda não sabemos o que as faria voltar.",
      impact: "Retenção e ativação ainda não medidas.",
    },
  ]),
  desiredResult:
    "Testar uma proposta de parceria e descobrir que ação representa o primeiro valor para o usuário.",
  impact: "A frequência e o impacto ainda não foram medidos.",
  attempts: "Apresentação comercial genérica e divulgação em redes sociais, sem linha de base.",
  partnerTypes: "Lojas com oferta local e disponibilidade para um experimento limitado.",
  partnerValue: "Hipótese: acesso a demanda local para a loja e oferta relevante para o comprador.",
  partnerDefinition: "Acordo de piloto com responsável, escopo e critérios definidos.",
  partnerBottleneck: "Não sabemos em que etapa a negociação perde força.",
  partnerMeasurement: "Não medimos",
  acquisitionChannels: "Indicações e redes sociais (exemplo fictício).",
  activationEvent: "Ainda não definido. Não confundir cadastro com percepção de valor.",
  userMeasurement: "Não medimos",
  materialsDescription: "Nenhum material enviado. Exemplo totalmente fictício.",
  rightsStatus: "Sem material nesta etapa",
  constraints:
    "Não usar contatos ou dados pessoais. Executar um experimento pequeno antes de ampliar o investimento.",
  resources: "Equipe e orçamento a confirmar.",
  horizon: "Prazo a definir depois do diagnóstico.",
  successCriteria:
    "Identificar o gargalo da negociação e definir uma métrica de ativação; metas só após medir a linha de base.",
  restrictions: "Uso interno. Não publicar caso ou resultados.",
};

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
  const hint = `${field.id}-hint`;
  const errorId = `${field.id}-error`;
  const limit = field.kind === "textarea" ? 3000 : field.kind === "url" ? 2000 : 500;
  const common = {
    id: field.id,
    name: field.id,
    value,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => onChange(event.target.value),
    "aria-invalid": Boolean(error),
    "aria-required": Boolean(field.required),
    "aria-describedby": error ? `${hint} ${errorId}` : hint,
  };
  if (field.kind === "problem-list") {
    return <ProblemListField field={field} value={value} error={error} onChange={onChange} />;
  }
  return (
    <div className="space-y-3">
      <Label htmlFor={field.id} className="text-base leading-relaxed">
        {field.label}{" "}
        {field.required ? (
          <span className="text-muted-foreground">*</span>
        ) : (
          <span className="text-xs font-normal text-muted-foreground">· opcional</span>
        )}
      </Label>
      <p id={hint} className="text-sm leading-relaxed text-muted-foreground">
        {field.help ?? "Compartilhe contexto, não dados pessoais ou credenciais."}
      </p>
      {field.kind === "select" ? (
        <select
          {...common}
          className="h-12 w-full rounded-2xl border border-input bg-white px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
          className="min-h-28 border-input bg-white/80 text-base placeholder:text-muted-foreground"
        />
      ) : (
        <Input
          {...common}
          type={field.kind === "url" ? "url" : "text"}
          maxLength={limit}
          placeholder={field.placeholder ?? "Descreva ou informe que ainda não sabe"}
          autoComplete="off"
          className="h-12 border-input bg-white/80 text-base placeholder:text-muted-foreground"
        />
      )}
      {error ? (
        <p id={errorId} className="text-sm font-medium text-foreground" role="alert">
          {error}
        </p>
      ) : null}
      {field.kind === "textarea" ? (
        <p className="text-right font-mono text-[10px] text-muted-foreground">
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
    const next: ProblemEntry[] = [...entries];
    const current = next[index];
    if (!current) return;
    next[index] = { ...current, ...changes };
    onChange(serializeProblemEntries(next));
  }

  return (
    <fieldset className="space-y-5">
      <legend className="text-base leading-relaxed">
        {field.label} <span className="text-muted-foreground">*</span>
      </legend>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {field.help ?? "Descreva cada dor separadamente."}
      </p>
      {entries.map((entry, index) => (
        <section key={index} className="space-y-5 glass p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium">Dor {index + 1}</h3>
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
              className="h-12 border-input bg-white/80 text-base placeholder:text-muted-foreground"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`problem-domain-${index}`}>Área da dor {index + 1}</Label>
              <select
                id={`problem-domain-${index}`}
                value={entry.domain}
                onChange={(event) => update(index, { domain: event.target.value })}
                className="h-12 w-full rounded-2xl border border-input bg-white px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
                className="h-12 w-full rounded-2xl border border-input bg-white px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
              className="min-h-28 border-input bg-white/80 text-base placeholder:text-muted-foreground"
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
              className="min-h-24 border-input bg-white/80 text-base placeholder:text-muted-foreground"
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
        <p className="text-sm font-medium text-foreground" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

function emptyProblem(): ProblemEntry {
  return { title: "", domain: "", urgency: "", description: "", impact: "" };
}

export function BriefPreview() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [simulated, setSimulated] = useState(false);
  const [draft, setDraft] = useState<MethodDraft | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const step = BRIEF_STEPS[index];
  const reviewing = index === BRIEF_STEPS.length;

  useEffect(() => {
    heading.current?.focus();
  }, [index]);

  useEffect(() => {
    if (draft) document.getElementById("method-draft-result")?.focus();
  }, [draft]);

  function navigate(next: number) {
    setIndex(next);
    setErrors({});
    setNotice("");
    setSimulated(false);
    setDraft(null);
  }

  function proceed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!step) return;
    const found = validateStep(step, values);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }
    navigate(index + 1);
  }

  function finishSimulation() {
    const found = validateBrief(values);
    if (Object.keys(found).length) {
      const incomplete = BRIEF_STEPS.findIndex(
        (item) => Object.keys(validateStep(item, values)).length > 0,
      );
      setIndex(Math.max(0, incomplete));
      setErrors(found);
      setNotice("Revise os campos necessários antes de concluir a simulação.");
      return;
    }
    setDraft(
      generateMethodDraft({
        values,
        pains: parseProblemEntries(values["pains"]),
        sources: [],
      }),
    );
    setSimulated(true);
    setNotice(
      "Rascunho local gerado com regras determinísticas. Nenhuma resposta foi enviada ou armazenada; fontes e IA não foram consultadas. Revise as limitações antes de interpretar o resultado.",
    );
  }

  function reset() {
    setValues({});
    navigate(0);
    setNotice("Respostas da prévia limpas. Nada havia sido salvo.");
  }

  return (
    <div className="mx-auto max-w-7xl px-5 pt-10 sm:px-8 sm:pt-14">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="mf-rise max-w-2xl">
          <p className="mf-pill">
            <span className="mf-dot" aria-hidden="true" />
            Briefing · Entrada de contexto
          </p>
          <h1 className="mt-5 text-4xl font-light leading-tight tracking-tighter sm:text-6xl">
            Antes da solução,
            <br />
            <span className="mf-grad">a pergunta certa.</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Uma boa lacuna vale mais que um número inventado. Esta é uma demonstração — não preencha
            com informações reais da empresa.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => {
              setValues({ ...DEMO });
              navigate(0);
              setNotice("Exemplo fictício carregado. Os dados não representam a Fanaticamente.");
            }}
          >
            Usar exemplo fictício
          </Button>
          <Button type="button" variant="ghost" className="min-h-11" onClick={reset}>
            <RotateCcw aria-hidden="true" />
            Limpar
          </Button>
        </div>
      </div>
      <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:gap-14">
        <aside className="lg:w-56 lg:shrink-0">
          <div className="mf-prog" aria-hidden="true">
            <span style={{ width: `${((index + 1) / (BRIEF_STEPS.length + 1)) * 100}%` }} />
          </div>
          <nav aria-label="Etapas do briefing">
            <ol className="flex gap-2 overflow-x-auto pb-4 lg:flex-col lg:gap-1">
              {[...BRIEF_STEPS.map((item) => item.title), "Revisão local"].map((title, i) => (
                <li key={title}>
                  <button
                    type="button"
                    disabled={i > index}
                    aria-current={i === index ? "step" : undefined}
                    onClick={() => navigate(i)}
                    className={`flex min-h-12 w-full items-center gap-3 whitespace-nowrap rounded-full border px-4 py-3 text-left text-xs transition-all disabled:cursor-not-allowed disabled:opacity-50 ${i === index ? "border-foreground bg-foreground text-background shadow-lg" : "border-border bg-white/70 text-muted-foreground hover:bg-white hover:text-foreground"}`}
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
          <p className="mt-4 hidden border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground lg:block">
            Sem áudio, anexos, contatos ou dados identificáveis. Fontes e autorização serão
            revisadas por uma pessoa antes de qualquer análise.
          </p>
        </aside>
        <div className="glass relative min-w-0 flex-1 p-6 sm:p-10 lg:max-w-3xl">
          <div className="mf-badge" aria-hidden="true">
            Dados
            <br />
            fictícios
          </div>
          <div className="mb-7 border-b border-border pb-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {index + 1} de {BRIEF_STEPS.length + 1} ·{" "}
              {reviewing ? "Confira antes de simular" : "* Campo necessário"}
            </p>
            <h2
              ref={heading}
              tabIndex={-1}
              className="mt-3 text-2xl font-medium tracking-tight outline-none sm:text-3xl"
            >
              {reviewing ? "Revisar. Não enviar." : step?.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {reviewing
                ? "Essas respostas ficam somente nesta página. Nenhuma delas foi recebida pela MOW."
                : step?.description}
            </p>
          </div>
          {notice ? (
            <p role="status" className="mb-6 glass p-4 text-sm leading-relaxed">
              {notice}
            </p>
          ) : null}
          {reviewing ? (
            <div>
              <div className="space-y-7">
                {BRIEF_STEPS.map((item, stepIndex) => (
                  <section key={item.id} className="glass p-5 sm:p-6">
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
                          <dt className="text-xs text-muted-foreground">{field.label}</dt>
                          {field.kind === "problem-list" ? (
                            <dd className="mt-2 space-y-3">
                              {parseProblemEntries(values[field.id]).map((entry, entryIndex) => (
                                <div
                                  key={entryIndex}
                                  className="border-l border-foreground/30 pl-3 text-sm leading-relaxed"
                                >
                                  <p className="font-medium">
                                    {entry.title || `Dor ${entryIndex + 1}`}
                                  </p>
                                  <p className="text-muted-foreground">
                                    {entry.domain} · Prioridade: {entry.urgency}
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap break-words">
                                    {entry.description}
                                  </p>
                                  {entry.impact ? (
                                    <p className="mt-1 text-muted-foreground">
                                      Impacto: {entry.impact}
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
              {draft ? <MethodDraftPreview draft={draft} /> : null}
              <div className="mt-7 flex gap-3 glass p-5 text-sm leading-relaxed text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <p>
                  Na versão conectada, o envio será limitado por convite e passará pela sua revisão
                  humana. Uma submissão nunca será uma metodologia aprovada. Divulgação pública
                  exige autorização separada.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-12"
                  onClick={() => navigate(index - 1)}
                >
                  <ArrowLeft aria-hidden="true" />
                  Voltar
                </Button>
                <Button
                  type="button"
                  className="min-h-12"
                  onClick={finishSimulation}
                  disabled={simulated}
                >
                  {simulated
                    ? "Rascunho local gerado — sem envio"
                    : "Gerar rascunho local (não envia)"}
                </Button>
              </div>
              <p className="mt-4 text-right text-xs text-muted-foreground">
                Envio real desativado. Não existe registro no banco.
              </p>
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
                      setValues((current) => ({ ...current, [field.id]: value }));
                      setErrors((current) => {
                        const next = { ...current };
                        delete next[field.id];
                        return next;
                      });
                    }}
                  />
                ))}
              </div>
              <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={index === 0}
                  className="min-h-12"
                  onClick={() => navigate(index - 1)}
                >
                  <ArrowLeft aria-hidden="true" />
                  Voltar
                </Button>
                <Button type="submit" className="min-h-12 px-6">
                  {index === BRIEF_STEPS.length - 1 ? "Revisar respostas" : "Continuar"}
                  <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}

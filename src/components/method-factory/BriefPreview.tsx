import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BRIEF_STEPS,
  validateStep,
  validateBrief,
  visibleFields,
  type Field,
} from "@/lib/method-factory/brief-schema";

const DEMO: Record<string, string> = {
  company: "Empresa Exemplo — dados fictícios",
  platformDescription: "Plataforma fictícia para conectar lojas de bairro a compradores locais.",
  businessModel: "Marketplace / dois ou mais lados",
  stage: "Protótipo",
  userGroups: "Lojas locais e moradores do bairro (exemplo fictício).",
  payer: "Modelo comercial ainda em avaliação.",
  geography: "Uma cidade fictícia.",
  pains:
    "As lojas demonstram interesse, mas não concluem o acordo. Os compradores se cadastram e pouco retornam.",
  desiredResult:
    "Testar uma proposta de parceria e descobrir que ação representa o primeiro valor para o usuário.",
  impact: "A frequência e o impacto ainda não foram medidos.",
  attempts: "Apresentação comercial genérica e divulgação em redes sociais, sem linha de base.",
  priority: "As duas frentes",
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
      <p id={hint} className="text-sm leading-relaxed text-white/65">
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

export function BriefPreview() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [simulated, setSimulated] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const step = BRIEF_STEPS[index];
  const reviewing = index === BRIEF_STEPS.length;

  useEffect(() => {
    heading.current?.focus();
  }, [index]);

  function navigate(next: number) {
    setIndex(next);
    setErrors({});
    setNotice("");
    setSimulated(false);
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
    setSimulated(true);
    setNotice(
      "Simulação concluída. Nenhuma resposta foi enviada ou armazenada. A revisão abaixo é apenas local; não há convite real nem método gerado.",
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
        <div className="max-w-2xl">
          <p className="eyebrow text-white/60">Briefing · Entrada de contexto</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tighter sm:text-5xl">
            Antes da solução,
            <br />a pergunta certa.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
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
          <nav aria-label="Etapas do briefing">
            <ol className="flex gap-2 overflow-x-auto pb-4 lg:flex-col lg:gap-1">
              {[...BRIEF_STEPS.map((item) => item.title), "Revisão local"].map((title, i) => (
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
            Sem áudio, anexos, contatos ou dados identificáveis. Fontes e autorização serão
            revisadas por uma pessoa antes de qualquer análise.
          </p>
        </aside>
        <div className="min-w-0 flex-1 lg:max-w-3xl">
          <div className="mb-7 border-b border-white/20 pb-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/65">
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
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              {reviewing
                ? "Essas respostas ficam somente nesta página. Nenhuma delas foi recebida pela MOW."
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
                {BRIEF_STEPS.map((item, stepIndex) => (
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
                          <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
                            {values[field.id]?.trim() || "Não informado (opcional)"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}
              </div>
              <div className="mt-7 flex gap-3 border border-white/20 p-5 text-sm leading-relaxed text-white/70">
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
                  {simulated ? "Simulação concluída — sem envio" : "Concluir simulação (não envia)"}
                </Button>
              </div>
              <p className="mt-4 text-right text-xs text-white/55">
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
              <div className="mt-10 flex items-center justify-between gap-4 border-t border-white/15 pt-6">
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

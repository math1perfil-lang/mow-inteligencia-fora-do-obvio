import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AudioBar } from "@/components/admin/AudioBar";
import { FeaturePicker } from "@/components/admin/FeaturePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDictation } from "@/hooks/useDictation";
import { getInterviewBundle, patchInterview, savePicks, saveAnswers } from "@/lib/admin/api";
import {
  COMMITMENT_OPTIONS,
  OPENING_SCRIPT,
  OPENING_TIP,
  PAIN_OPTIONS,
  SIZE_OPTIONS,
  STEPS,
  type PriceField,
  type Question,
  type Step,
} from "@/lib/admin/questions";
import type { Interview, InterviewPatch, PicksMap } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/entrevistas/$id")({
  component: InterviewPage,
});

type SaveState = "idle" | "saving" | "saved" | "error";

const selectClass =
  "h-10 w-full border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function InterviewPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [picks, setPicks] = useState<PicksMap>({});
  const [loadError, setLoadError] = useState<"none" | "notfound" | "failed">("none");
  const [stepIndex, setStepIndex] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [recording, setRecording] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // ------------------------------------------------------------ carregamento
  useEffect(() => {
    let active = true;
    getInterviewBundle(id)
      .then((bundle) => {
        if (!active) return;
        if (!bundle) {
          setLoadError("notfound");
          return;
        }
        setInterview(bundle.interview);
        setAnswers(bundle.answers);
        setPicks(bundle.picks);
      })
      .catch(() => active && setLoadError("failed"));
    return () => {
      active = false;
    };
  }, [id]);

  // ------------------------------------------------------------ autosave
  const pendingFields = useRef<InterviewPatch>({});
  const pendingAnswers = useRef<Record<string, string>>({});
  const pendingPicks = useRef<PicksMap | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const flushRef = useRef<() => Promise<boolean>>(() => Promise.resolve(true));

  const hasPending = useCallback(
    () =>
      Object.keys(pendingFields.current).length > 0 ||
      Object.keys(pendingAnswers.current).length > 0 ||
      pendingPicks.current !== null,
    [],
  );

  const flush = useCallback(async (): Promise<boolean> => {
    window.clearTimeout(timer.current);
    if (!hasPending()) return true;

    const fields = pendingFields.current;
    const ans = pendingAnswers.current;
    const pk = pendingPicks.current;
    pendingFields.current = {};
    pendingAnswers.current = {};
    pendingPicks.current = null;

    setSaveState("saving");
    try {
      await Promise.all([
        Object.keys(fields).length > 0 ? patchInterview(id, fields) : Promise.resolve(),
        saveAnswers(id, ans),
        pk ? savePicks(id, pk) : Promise.resolve(),
      ]);
      setSaveState("saved");
      return true;
    } catch {
      // Devolve o que falhou para a fila e tenta de novo em 5 s.
      pendingFields.current = { ...fields, ...pendingFields.current };
      pendingAnswers.current = { ...ans, ...pendingAnswers.current };
      pendingPicks.current = pendingPicks.current ?? pk;
      setSaveState("error");
      timer.current = window.setTimeout(() => void flushRef.current(), 5000);
      return false;
    }
  }, [id, hasPending]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const schedule = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flushRef.current(), 800);
  }, []);

  // Ao sair da tela ou fechar a aba, tenta salvar o que ainda está na fila.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPending()) {
        void flushRef.current();
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      void flushRef.current();
    };
  }, [hasPending]);

  const updateField = (patch: InterviewPatch) => {
    setInterview((prev) => (prev ? { ...prev, ...patch } : prev));
    pendingFields.current = { ...pendingFields.current, ...patch };
    schedule();
  };

  const setAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    pendingAnswers.current = { ...pendingAnswers.current, [key]: value };
    schedule();
  };

  const changePicks = (next: PicksMap) => {
    setPicks(next);
    pendingPicks.current = next;
    schedule();
  };

  // ------------------------------------------------------------ ditado por voz
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  });

  /** Acrescenta o texto ditado ao fim da resposta, sem apagar o que já foi escrito. */
  const appendDictation = useCallback(
    (key: string, text: string) => {
      const current = answersRef.current[key] ?? "";
      const separator = current === "" || /\s$/.test(current) ? "" : " ";
      const next = `${current}${separator}${text}`;
      answersRef.current = { ...answersRef.current, [key]: next };
      setAnswers((prev) => ({ ...prev, [key]: next }));
      pendingAnswers.current = { ...pendingAnswers.current, [key]: next };
      schedule();
    },
    [schedule],
  );

  const dictation = useDictation(appendDictation);
  const { stop: stopDictation, error: dictationError } = dictation;

  // Trocar de etapa encerra o ditado em andamento.
  useEffect(() => {
    stopDictation();
  }, [stepIndex, stopDictation]);

  useEffect(() => {
    if (dictationError) toast.error(dictationError);
  }, [dictationError]);

  const setPrice = (field: PriceField, raw: string) => {
    const patch: InterviewPatch = {};
    const parsed = raw === "" ? null : Number(raw);
    patch[field] = parsed !== null && Number.isFinite(parsed) ? parsed : null;
    updateField(patch);
  };

  const refreshAudioTotal = useCallback(() => {
    getInterviewBundle(id)
      .then((bundle) => {
        if (!bundle) return;
        setInterview((prev) =>
          prev
            ? {
                ...prev,
                audio_path: bundle.interview.audio_path,
                audio_duration_seconds: bundle.interview.audio_duration_seconds,
              }
            : prev,
        );
      })
      .catch(() => undefined);
  }, [id]);

  const finish = async () => {
    if (!interview?.store_name.trim()) {
      toast.error("Informe o nome da loja na etapa Cadastro.");
      setStepIndex(0);
      return;
    }
    setFinishing(true);
    const ok = await flush();
    if (!ok) {
      toast.error("Não foi possível salvar as últimas alterações. Tente de novo.");
      setFinishing(false);
      return;
    }
    try {
      await patchInterview(id, { status: "concluida" });
      toast.success("Entrevista concluída.");
      await navigate({ to: "/admin" });
    } catch {
      toast.error("Não foi possível concluir a entrevista.");
      setFinishing(false);
    }
  };

  // ------------------------------------------------------------ renderização
  if (loadError === "notfound") {
    return <p className="text-sm text-muted-foreground">Entrevista não encontrada.</p>;
  }
  if (loadError === "failed") {
    return (
      <p role="alert" className="text-sm text-destructive">
        Não foi possível carregar a entrevista. Verifique a conexão e recarregue.
      </p>
    );
  }
  if (!interview) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  const step: Step = STEPS[stepIndex] ?? STEPS[0]!;
  const blocksFilled = STEPS.filter((s) => s.kind === "bloco").some((s) =>
    s.questions.some((q) => (answers[q.key] ?? "").trim() !== ""),
  );

  const questionField = (q: Question) => {
    const dictating = dictation.activeKey === q.key;
    const otherDictating = dictation.activeKey !== null && !dictating;
    return (
    <div key={q.key} className="space-y-2">
      <Label htmlFor={q.key} className="text-base leading-snug">
        {q.label}
      </Label>
      <Textarea
        id={q.key}
        rows={3}
        value={answers[q.key] ?? ""}
        onChange={(e) => setAnswer(q.key, e.target.value)}
        placeholder="Anote com as palavras do entrevistado"
        className={dictating ? "border-destructive" : undefined}
      />
      {dictation.supported ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="sm"
            variant={dictating ? "destructive" : "outline"}
            disabled={!dictating && (!interview.consent_recording || otherDictating)}
            title={
              interview.consent_recording || dictating
                ? undefined
                : "Marque a autorização do entrevistado na etapa Abertura"
            }
            onClick={() => (dictating ? dictation.stop() : dictation.start(q.key))}
          >
            {dictating ? "Parar ditado" : "Ditar resposta"}
          </Button>
          {dictating ? (
            <span aria-live="polite" className="text-xs text-destructive">
              {dictation.listening
                ? "● Ouvindo… fale agora"
                : "Iniciando o microfone… permita o acesso se o navegador pedir"}
            </span>
          ) : null}
        </div>
      ) : null}
      {dictating && dictation.interim ? (
        <p className="text-sm italic text-muted-foreground">{dictation.interim}</p>
      ) : null}
      {q.price ? (
        <div className="max-w-xs space-y-1">
          <Label htmlFor={`${q.key}_price`} className="text-xs text-muted-foreground">
            {q.price.label}
          </Label>
          <Input
            id={`${q.key}_price`}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={interview[q.price.field] ?? ""}
            onChange={(e) => q.price && setPrice(q.price.field, e.target.value)}
          />
        </div>
      ) : null}
    </div>
    );
  };

  const appendFollowUp = (text: string) => {
    const notesKey = step.questions.find((q) => q.key.endsWith("_notes"))?.key;
    if (!notesKey) return;
    const current = answers[notesKey] ?? "";
    setAnswer(notesKey, `${current}${current && !current.endsWith("\n") ? "\n" : ""}• ${text} `);
  };

  const saveLabel =
    saveState === "saving"
      ? "Salvando…"
      : saveState === "saved"
        ? "Salvo"
        : saveState === "error"
          ? "Erro ao salvar. Tentando de novo…"
          : "";

  return (
    <div className="pb-36">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin" className="text-sm text-muted-foreground underline underline-offset-4">
            ← Entrevistas
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {interview.store_name.trim() || "Nova entrevista"}
          </h1>
        </div>
        <span
          aria-live="polite"
          className={cn("text-sm", saveState === "error" ? "text-destructive" : "text-muted-foreground")}
        >
          {saveLabel}
        </span>
      </div>

      <div className="grid gap-8 md:grid-cols-[240px_1fr]">
        <nav aria-label="Etapas" className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {STEPS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStepIndex(idx)}
              aria-current={idx === stepIndex ? "step" : undefined}
              className={cn(
                "shrink-0 border px-3 py-2 text-left text-sm transition-colors",
                idx === stepIndex
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {s.title}
              {s.minutes ? <span className="ml-2 text-xs opacity-70">{s.minutes} min</span> : null}
            </button>
          ))}
        </nav>

        <section className="min-w-0 space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{step.title}</h2>
            {step.intro ? <p className="mt-1 text-sm text-muted-foreground">{step.intro}</p> : null}
          </div>

          {step.notice ? (
            <p className="border border-border bg-card px-4 py-3 text-sm">⚠ {step.notice}</p>
          ) : null}

          {step.questions.length > 0 && dictation.supported && !interview.consent_recording ? (
            <p className="text-xs text-muted-foreground">
              Para ditar as respostas, marque a autorização do entrevistado na etapa Abertura.
            </p>
          ) : null}
          {step.questions.length > 0 && !dictation.supported ? (
            <p className="text-xs text-muted-foreground">
              O ditado por voz não funciona neste navegador. Use o Chrome ou o Edge no notebook.
            </p>
          ) : null}

          {step.kind === "cadastro" ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nome da loja" htmlFor="store_name">
                <Input
                  id="store_name"
                  value={interview.store_name}
                  onChange={(e) => updateField({ store_name: e.target.value })}
                />
              </Field>
              <Field label="Entrevistado" htmlFor="interviewee_name">
                <Input
                  id="interviewee_name"
                  value={interview.interviewee_name}
                  onChange={(e) => updateField({ interviewee_name: e.target.value })}
                />
              </Field>
              <Field label="Cargo" htmlFor="interviewee_role">
                <Input
                  id="interviewee_role"
                  placeholder="Dono, gerente…"
                  value={interview.interviewee_role}
                  onChange={(e) => updateField({ interviewee_role: e.target.value })}
                />
              </Field>
              <Field label="Cidade" htmlFor="city">
                <Input id="city" value={interview.city} onChange={(e) => updateField({ city: e.target.value })} />
              </Field>
              <Field label="Porte da loja" htmlFor="store_size">
                <select
                  id="store_size"
                  className={selectClass}
                  value={interview.store_size ?? ""}
                  onChange={(e) => updateField({ store_size: e.target.value === "" ? null : e.target.value })}
                >
                  <option value="">Selecione…</option>
                  {SIZE_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="space-y-2">
                <Label>Data</Label>
                <p className="flex h-10 items-center text-sm text-muted-foreground">
                  {new Date(interview.started_at).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          ) : null}

          {step.kind === "abertura" ? (
            <div className="space-y-5">
              <blockquote className="border-l-2 border-foreground pl-4 text-base leading-relaxed">
                {OPENING_SCRIPT}
              </blockquote>
              <p className="text-sm text-muted-foreground">{OPENING_TIP}</p>
              <label className="flex cursor-pointer items-start gap-3 border border-border bg-card p-4">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={interview.consent_recording}
                  onChange={(e) =>
                    updateField({
                      consent_recording: e.target.checked,
                      consent_at: e.target.checked ? new Date().toISOString() : null,
                    })
                  }
                />
                <span className="text-sm">
                  O entrevistado autorizou a gravação de áudio e a transcrição da fala.
                  <span className="block text-xs text-muted-foreground">
                    {interview.consent_at
                      ? `Autorizado em ${new Date(interview.consent_at).toLocaleString("pt-BR")}`
                      : "Obrigatório para liberar o botão de gravar."}
                  </span>
                </span>
              </label>
            </div>
          ) : null}

          {step.kind === "bloco" || step.kind === "encerramento" ? (
            <div className="space-y-6">
              {step.questions.map((q) => questionField(q))}

              {step.followUps.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Perguntas de aprofundamento (clique para anotar):</p>
                  <div className="flex flex-wrap gap-2">
                    {step.followUps.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => appendFollowUp(f)}
                        className="border border-input px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {step.id === "bloco2" ? (
                <Field label="Dor principal citada (classifique ao final do bloco)" htmlFor="main_pain_key">
                  <select
                    id="main_pain_key"
                    className={selectClass}
                    value={interview.main_pain_key ?? ""}
                    onChange={(e) => updateField({ main_pain_key: e.target.value === "" ? null : e.target.value })}
                  >
                    <option value="">Selecione…</option>
                    {PAIN_OPTIONS.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}
            </div>
          ) : null}

          {step.kind === "priorizacao" ? (
            <div className="space-y-6">
              {!blocksFilled ? (
                <p className="border border-border bg-card px-4 py-3 text-sm">
                  Os blocos 1 a 4 ainda estão vazios. Faça esses blocos antes da priorização para não influenciar as
                  respostas.
                </p>
              ) : null}
              <FeaturePicker picks={picks} onChange={changePicks} />
              {step.questions.map((q) => questionField(q))}
            </div>
          ) : null}

          {step.kind === "encerramento" ? (
            <div className="space-y-6 border-t border-border pt-6">
              <div className="space-y-3">
                <Label>Nível de compromisso</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {COMMITMENT_OPTIONS.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      aria-pressed={interview.commitment_level === o.key}
                      onClick={() => updateField({ commitment_level: o.key })}
                      className={cn(
                        "border p-3 text-left text-sm transition-colors",
                        interview.commitment_level === o.key
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className="block font-medium">{o.label}</span>
                      <span className="block text-xs opacity-80">{o.help}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Observações sobre o compromisso" htmlFor="commitment_notes">
                <Textarea
                  id="commitment_notes"
                  rows={2}
                  value={interview.commitment_notes}
                  onChange={(e) => updateField({ commitment_notes: e.target.value })}
                />
              </Field>
              <Field label="Notas gerais da entrevista" htmlFor="general_notes">
                <Textarea
                  id="general_notes"
                  rows={3}
                  value={interview.general_notes}
                  onChange={(e) => updateField({ general_notes: e.target.value })}
                />
              </Field>
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => void finish()} disabled={finishing || recording}>
                  {finishing ? "Concluindo…" : "Concluir entrevista"}
                </Button>
                {recording ? (
                  <span className="text-xs text-muted-foreground">Pare a gravação antes de concluir.</span>
                ) : null}
                {interview.status === "concluida" ? (
                  <span className="text-xs text-muted-foreground">Esta entrevista já foi concluída.</span>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex justify-between border-t border-border pt-6">
            <Button variant="outline" disabled={stepIndex === 0} onClick={() => setStepIndex((i) => Math.max(0, i - 1))}>
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={stepIndex === STEPS.length - 1}
              onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
            >
              Próxima etapa
            </Button>
          </div>
        </section>
      </div>

      <AudioBar
        interviewId={id}
        consent={interview.consent_recording}
        onUploaded={refreshAudioTotal}
        onRecordingChange={setRecording}
      />
    </div>
  );
}

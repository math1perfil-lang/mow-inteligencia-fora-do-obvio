import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { Check, ClipboardCheck, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSupabase } from "@/lib/supabase";
import {
  acceptClientSolutionInvite,
  listClientSolutionProgress,
  listClientSolutions,
  updateClientSolutionProgress,
  type ClientSolutionProgressRecord,
  type ClientSolutionRecord,
} from "@/lib/mow-gki/client-solution.functions";

const INVITE_STORAGE_KEY = "mow-client-solution-invite";
type StepStatus = ClientSolutionProgressRecord["status"];
const STATUS_LABELS: Record<StepStatus, string> = {
  not_started: "Planejada",
  in_progress: "Em andamento",
  blocked: "Bloqueada",
  completed: "Concluída",
};

function readPendingInvite(): string {
  try {
    return window.sessionStorage.getItem(INVITE_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function ClientSolutionPortal() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [solutions, setSolutions] = useState<ClientSolutionRecord[]>([]);
  const [progress, setProgress] = useState<Record<string, ClientSolutionProgressRecord[]>>({});
  const mounted = useRef(true);
  const requestUserId = useRef<string | null>(null);
  const pendingInvite = useRef("");
  const acceptingInvite = useRef(false);

  const loadSolutions = useCallback(async (userId: string) => {
    if (requestUserId.current !== userId) {
      setSolutions([]);
      setProgress({});
    }
    requestUserId.current = userId;
    setBusy(true);
    setNotice("");
    try {
      const items = await listClientSolutions({ data: {} });
      if (!mounted.current || requestUserId.current !== userId) return;
      setSolutions(items);
      const entries = await Promise.all(
        items.map(async (solution) => {
          const records = await listClientSolutionProgress({
            data: { releaseId: solution.releaseId },
          });
          return [solution.releaseId, records] as const;
        }),
      );
      if (!mounted.current || requestUserId.current !== userId) return;
      setProgress(Object.fromEntries(entries));
    } catch {
      if (!mounted.current || requestUserId.current !== userId) return;
      setSolutions([]);
      setProgress({});
      setNotice(
        "Não foi possível carregar suas soluções. Verifique seu acesso ou tente novamente.",
      );
    } finally {
      if (mounted.current && requestUserId.current === userId) setBusy(false);
    }
  }, []);

  const acceptPendingInvite = useCallback(
    async (activeSession: Session) => {
      const token = pendingInvite.current || readPendingInvite();
      if (!token || acceptingInvite.current) return;
      acceptingInvite.current = true;
      try {
        const result = await acceptClientSolutionInvite({ data: { token } });
        pendingInvite.current = "";
        try {
          window.sessionStorage.removeItem(INVITE_STORAGE_KEY);
        } catch {
          // The invite is single-use even if browser storage cannot be cleared.
        }
        await loadSolutions(activeSession.user.id);
        if (result.accepted)
          setNotice("Convite aceito. A solução foi vinculada à sua conta individual.");
        else
          setNotice(
            "O convite não foi aceito. Confirme o e-mail da conta e a validade do convite da MOW.",
          );
      } catch {
        setNotice(
          "Não foi possível aceitar o convite. Entre com a conta do e-mail convidado e tente novamente.",
        );
      } finally {
        acceptingInvite.current = false;
      }
    },
    [loadSolutions],
  );

  useEffect(() => {
    mounted.current = true;
    let active = true;
    pendingInvite.current = readPendingInvite();
    if (window.location.hash.length > 1) {
      const initialInvite = window.location.hash.slice(1);
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
      if (/^[a-f0-9]{64}$/.test(initialInvite)) {
        pendingInvite.current = initialInvite;
        try {
          window.sessionStorage.setItem(INVITE_STORAGE_KEY, initialInvite);
        } catch {
          // Keep in component memory if storage is unavailable.
        }
      }
    }

    let supabase: ReturnType<typeof getSupabase>;
    try {
      supabase = getSupabase();
    } catch {
      setNotice("A autenticação da Method Factory não está configurada neste ambiente.");
      setAuthReady(true);
      return () => {
        active = false;
        mounted.current = false;
      };
    }

    const callbackUrl = new URL(window.location.href);
    const authCode = callbackUrl.searchParams.get("code");
    const finishAuth = async () => {
      if (authCode) {
        callbackUrl.searchParams.delete("code");
        window.history.replaceState(
          window.history.state,
          "",
          `${callbackUrl.pathname}${callbackUrl.search}${callbackUrl.hash}`,
        );
        await supabase.auth.exchangeCodeForSession(authCode);
      }
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      setAuthReady(true);
      if (data.session) {
        const pending = pendingInvite.current || readPendingInvite();
        if (pending) await acceptPendingInvite(data.session);
        else await loadSolutions(data.session.user.id);
      }
    };
    void finishAuth().catch(() => {
      if (active) {
        setAuthReady(true);
        setNotice("Não foi possível concluir a autenticação. Entre novamente com sua conta.");
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (nextSession) {
        const pending = pendingInvite.current || readPendingInvite();
        if (pending) void acceptPendingInvite(nextSession);
        else void loadSolutions(nextSession.user.id);
      } else {
        requestUserId.current = null;
        setSolutions([]);
        setProgress({});
      }
    });
    return () => {
      active = false;
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [acceptPendingInvite, loadSolutions]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !email.trim() || password.length < 8) return;
    setBusy(true);
    setNotice("");
    try {
      const supabase = getSupabase();
      if (creatingAccount) {
        const redirectUrl = new URL("/method-factory/solution", window.location.origin);
        if (pendingInvite.current) redirectUrl.hash = pendingInvite.current;
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { emailRedirectTo: redirectUrl.toString() },
        });
        if (error) throw error;
        setPassword("");
        if (data.session) {
          setSession(data.session);
          await acceptPendingInvite(data.session);
        } else {
          setNotice(
            "Conta criada. Confirme seu e-mail e depois volte ao convite da MOW para entrar e vincular a solução.",
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setSession(data.session);
        setPassword("");
        if (data.session) {
          const token = pendingInvite.current || readPendingInvite();
          if (token) await acceptPendingInvite(data.session);
          else await loadSolutions(data.session.user.id);
        }
      }
    } catch {
      setNotice(
        creatingAccount
          ? "Não foi possível criar a conta. Confira o e-mail, a senha e a configuração de confirmação do Supabase."
          : "Não foi possível entrar. Confira se esta conta individual foi convidada para a solução.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    requestUserId.current = null;
    setSolutions([]);
    setProgress({});
    await getSupabase().auth.signOut();
  }

  async function saveProgress(
    solution: ClientSolutionRecord,
    stepId: string,
    status: StepStatus,
    note: string,
  ) {
    setBusy(true);
    setNotice("");
    try {
      const result = await updateClientSolutionProgress({
        data: { releaseId: solution.releaseId, stepId, status, note },
      });
      if (!result.updated) throw new Error("progress rejected");
      const records = await listClientSolutionProgress({ data: { releaseId: solution.releaseId } });
      setProgress((current) => ({ ...current, [solution.releaseId]: records }));
      setNotice("Andamento atualizado.");
    } catch {
      setNotice("Não foi possível salvar o andamento. Seu método não foi alterado.");
    } finally {
      setBusy(false);
    }
  }

  if (!authReady)
    return (
      <PortalShell>
        <p role="status">Verificando sua conta…</p>
      </PortalShell>
    );

  if (!session) {
    return (
      <PortalShell>
        <div className="max-w-xl">
          <p className="eyebrow text-muted-foreground">Method Factory · Área do cliente</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Acesse sua solução
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Use sua conta individual convidada pela MOW. Para criar uma conta, abra primeiro o
            convite recebido; ele será vinculado somente após a confirmação do e-mail.
          </p>
          <form
            onSubmit={(event) => void submitAuth(event)}
            className="mt-8 space-y-5 border border-foreground/25 p-5 sm:p-7"
          >
            <div className="space-y-2">
              <Label htmlFor="client-email">E-mail da conta convidada</Label>
              <Input
                id="client-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 border-foreground/25 bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-password">Senha</Label>
              <Input
                id="client-password"
                type="password"
                autoComplete={creatingAccount ? "new-password" : "current-password"}
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 border-foreground/25 bg-white"
              />
              <p className="text-xs text-muted-foreground">Use pelo menos 8 caracteres.</p>
            </div>
            {notice ? (
              <p role="status" className="text-sm leading-relaxed text-muted-foreground">
                {notice}
              </p>
            ) : null}
            <Button type="submit" className="min-h-12 w-full" disabled={busy}>
              {busy ? "Aguarde…" : creatingAccount ? "Criar conta individual" : "Entrar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 w-full"
              disabled={busy}
              onClick={() => {
                setCreatingAccount((value) => !value);
                setNotice("");
              }}
            >
              {creatingAccount ? "Já tenho uma conta" : "Criar conta com o convite"}
            </Button>
          </form>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-foreground/25 pb-6">
        <div>
          <p className="eyebrow text-muted-foreground">Method Factory · Sua área de execução</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Trabalhe sua solução
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Conta individual · {session.user.email ?? "cliente"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={busy}
            onClick={() => void loadSolutions(session.user.id)}
          >
            <RefreshCw aria-hidden="true" /> Atualizar
          </Button>
          <Button type="button" variant="ghost" className="min-h-11" onClick={() => void signOut()}>
            <LogOut aria-hidden="true" /> Sair
          </Button>
        </div>
      </header>

      {notice ? (
        <p
          role="status"
          className="mt-6 border border-foreground/25 bg-white/60 p-4 text-sm leading-relaxed"
        >
          {notice}
        </p>
      ) : null}
      {busy && solutions.length === 0 ? (
        <p role="status" className="py-8 text-sm text-muted-foreground">
          Carregando seu espaço…
        </p>
      ) : null}
      {!busy && solutions.length === 0 ? (
        <section
          className="mt-8 border border-dashed border-foreground/25 p-8"
          aria-labelledby="empty-solutions"
        >
          <h2 id="empty-solutions" className="text-xl font-medium">
            Nenhuma solução liberada para esta conta
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Aguarde o convite da MOW ou confirme que entrou com o e-mail convidado. O briefing e a
            pesquisa interna não aparecem nesta área.
          </p>
        </section>
      ) : null}

      <div className="mt-8 space-y-8">
        {solutions.map((solution) => (
          <SolutionCard
            key={solution.releaseId}
            solution={solution}
            progress={progress[solution.releaseId] ?? []}
            busy={busy}
            onSave={(stepId, status, note) => void saveProgress(solution, stepId, status, note)}
          />
        ))}
      </div>
    </PortalShell>
  );
}

function SolutionCard({
  solution,
  progress,
  busy,
  onSave,
}: {
  solution: ClientSolutionRecord;
  progress: ClientSolutionProgressRecord[];
  busy: boolean;
  onSave: (stepId: string, status: StepStatus, note: string) => void;
}) {
  const progressByStep = new Map(progress.map((item) => [item.stepId, item]));
  return (
    <article
      className="space-y-6 border border-foreground/25 p-5 sm:p-7"
      aria-labelledby={`solution-${solution.releaseId}`}
    >
      <header className="border-b border-border pb-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Versão liberada {solution.version} ·{" "}
          {new Date(solution.releasedAt).toLocaleDateString("pt-BR")}
        </p>
        <h2
          id={`solution-${solution.releaseId}`}
          className="mt-3 text-2xl font-semibold tracking-tight"
        >
          {solution.snapshot.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {solution.snapshot.objective}
        </p>
        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Este espaço mostra somente a versão de execução liberada pela MOW. Briefing e pesquisa
          interna permanecem privados.
        </p>
      </header>

      <section className="space-y-4" aria-label="Etapas da solução">
        {solution.snapshot.methodSteps.map((step) => {
          const saved = progressByStep.get(step.id);
          const status: StepStatus = saved?.status ?? "not_started";
          const note = saved?.note ?? "";
          return (
            <StepCard
              key={step.id}
              step={step}
              status={status}
              note={note}
              busy={busy}
              onSave={(nextStatus, nextNote) => onSave(step.id, nextStatus, nextNote)}
            />
          );
        })}
      </section>

      <section
        className="border-t border-border pt-5"
        aria-labelledby={`measures-${solution.releaseId}`}
      >
        <h3 id={`measures-${solution.releaseId}`} className="text-lg font-medium">
          Indicadores para acompanhar
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Os indicadores ajudam a observar a aplicação; não representam garantia de resultado.
        </p>
        <ul className="mt-4 space-y-4">
          {solution.snapshot.measures.map((measure) => (
            <li key={measure.metric} className="border-l border-foreground/25 pl-4">
              <h4 className="font-medium">{measure.metric}</h4>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {measure.definition}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Cadência: {measure.cadence} · {measure.targetSetting}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

function StepCard({
  step,
  status,
  note,
  busy,
  onSave,
}: {
  step: ClientSolutionRecord["snapshot"]["methodSteps"][number];
  status: StepStatus;
  note: string;
  busy: boolean;
  onSave: (status: StepStatus, note: string) => void;
}) {
  const [nextStatus, setNextStatus] = useState<StepStatus>(status);
  const [nextNote, setNextNote] = useState(note);
  useEffect(() => {
    setNextStatus(status);
    setNextNote(note);
  }, [status, note]);
  return (
    <section className="border border-border p-4 sm:p-5" aria-labelledby={`step-${step.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id={`step-${step.id}`} className="text-base font-medium">
          {step.order}. {step.name}
        </h3>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ClipboardCheck className="size-3.5" aria-hidden="true" />
          {STATUS_LABELS[status]}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed">{step.action}</p>
      <p className="mt-3 text-xs text-muted-foreground">
        Responsável: {step.ownerRole} · Duração: {step.duration}
      </p>
      {step.inputs.length ? (
        <p className="mt-2 text-xs text-muted-foreground">Preparar: {step.inputs.join(" · ")}</p>
      ) : null}
      {step.outputs.length ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Entrega da etapa: {step.outputs.join(" · ")}
        </p>
      ) : null}
      <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(10rem,0.45fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <Label htmlFor={`${step.id}-status`}>Andamento</Label>
          <select
            id={`${step.id}-status`}
            value={nextStatus}
            onChange={(event) => setNextStatus(event.target.value as StepStatus)}
            className="h-11 w-full border border-foreground/25 bg-white px-3 text-sm"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${step.id}-note`}>Nota de andamento · opcional</Label>
          <Textarea
            id={`${step.id}-note`}
            value={nextNote}
            maxLength={1000}
            rows={2}
            onChange={(event) => setNextNote(event.target.value)}
            placeholder="Registre o que foi feito ou o que está bloqueando."
            className="min-h-20 border-foreground/25 bg-white"
          />
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        className="mt-4 min-h-11"
        disabled={busy || (nextStatus === status && nextNote === note)}
        onClick={() => onSave(nextStatus, nextNote)}
      >
        <Check aria-hidden="true" /> Salvar andamento
      </Button>
    </section>
  );
}

function PortalShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">{children}</div>;
}

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { Copy, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabase } from "@/lib/supabase";
import {
  checkFactoryOperatorAccess,
  createFactoryInvite,
  getFactoryBriefReview,
  listFactoryInbox,
  revokeFactoryInvite,
  updateFactoryBriefStatus,
  type FactoryBriefReview as ReviewData,
  type FactoryInboxItem,
} from "@/lib/method-factory/workflow.functions";
import { BRIEF_STEPS, parseProblemEntries, visibleFields } from "@/lib/method-factory/brief-schema";

type RelationshipType = "internal" | "related_company" | "external_pilot" | "client";
type InviteRecord = { id: string; name: string; link: string; expiresAt: string; revoked: boolean };
type ReviewStatus = "in_review" | "needs_clarification" | "archived";
const RELATIONSHIP_LABELS: Record<string, string> = {
  internal: "Iniciativa interna",
  related_company: "Empresa relacionada",
  external_pilot: "Piloto externo",
  client: "Cliente",
};
const STATUS_LABELS: Record<string, string> = {
  received: "Recebido",
  triage_pending: "Triagem pendente",
  in_review: "Em revisão",
  needs_clarification: "Precisa de esclarecimento",
  draft_ready: "Rascunho disponível",
  approved_for_method: "Método aprovado por revisão humana",
  archived: "Arquivado",
};

export function FactoryReview() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [operatorAccess, setOperatorAccess] = useState<{
    userId: string | null;
    status: "checking" | "allowed" | "denied";
  }>({ userId: null, status: "checking" });
  const [authConfigured, setAuthConfigured] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [recoveryNotice, setRecoveryNotice] = useState("");
  const [inbox, setInbox] = useState<FactoryInboxItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [review, setReview] = useState<ReviewData | null>(null);
  const [inboxBusy, setInboxBusy] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [industry, setIndustry] = useState("");
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("external_pilot");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [notice, setNotice] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const activeSessionUserId = useRef<string | null>(null);
  const authEventVersion = useRef(0);
  const sessionUserId = session?.user.id ?? null;
  const currentOperatorAccess =
    sessionUserId && operatorAccess.userId === sessionUserId ? operatorAccess.status : "checking";

  const refreshInbox = useCallback(async () => {
    const requestUserId = activeSessionUserId.current;
    if (!requestUserId) return;
    setInboxBusy(true);
    setNotice("");
    try {
      const items = await listFactoryInbox({ data: {} });
      if (activeSessionUserId.current !== requestUserId) return;
      setInbox(items);
      setSelectedId((current) =>
        current && items.some((item) => item.id === current) ? current : (items[0]?.id ?? ""),
      );
    } catch {
      if (activeSessionUserId.current !== requestUserId) return;
      setInbox([]);
      setReview(null);
      setSelectedId("");
      setNotice(
        "A sessão está autenticada, mas a caixa de revisão não pôde ser carregada. Confirme a permissão de operador ativo e a disponibilidade das RPCs seguras da Factory.",
      );
    } finally {
      if (activeSessionUserId.current === requestUserId) setInboxBusy(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let supabase: ReturnType<typeof getSupabase>;
    try {
      supabase = getSupabase();
      setAuthConfigured(true);
    } catch {
      setAuthConfigured(false);
      setAuthError(
        "O serviço Supabase não está configurado neste ambiente. O painel interno não pode autenticar até a configuração ser concluída.",
      );
      setAuthReady(true);
      return () => {
        active = false;
      };
    }
    const initialAuthEventVersion = authEventVersion.current;
    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active && authEventVersion.current === initialAuthEventVersion) {
          activeSessionUserId.current = data.session?.user.id ?? null;
          setSession(data.session);
          setAuthReady(true);
        }
      })
      .catch(() => {
        if (active) setAuthReady(true);
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      authEventVersion.current += 1;
      activeSessionUserId.current = nextSession?.user.id ?? null;
      setSession(nextSession);
      setAuthReady(true);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    setInbox([]);
    setReview(null);
    setSelectedId("");
    setInvites([]);
    setNotice("");
    setInboxBusy(false);
    setReviewBusy(false);
    setInviteBusy(false);
    setActionBusy(false);
    if (!sessionUserId) {
      setOperatorAccess({ userId: null, status: "checking" });
      return () => {
        active = false;
      };
    }

    setOperatorAccess({ userId: sessionUserId, status: "checking" });
    void checkFactoryOperatorAccess({ data: {} })
      .then(() => {
        if (active) setOperatorAccess({ userId: sessionUserId, status: "allowed" });
      })
      .catch(() => {
        if (active) setOperatorAccess({ userId: sessionUserId, status: "denied" });
      });
    return () => {
      active = false;
    };
  }, [sessionUserId]);

  useEffect(() => {
    if (sessionUserId && currentOperatorAccess === "allowed") void refreshInbox();
    else {
      setInbox([]);
      setReview(null);
      setSelectedId("");
    }
  }, [sessionUserId, currentOperatorAccess, refreshInbox]);

  useEffect(() => {
    if (!sessionUserId || currentOperatorAccess !== "allowed" || !selectedId) {
      setReview(null);
      return;
    }
    let cancelled = false;
    const requestUserId = sessionUserId;
    setReviewBusy(true);
    void getFactoryBriefReview({ data: { id: selectedId } })
      .then((result) => {
        if (!cancelled && activeSessionUserId.current === requestUserId) {
          setReview(result as ReviewData | null);
        }
      })
      .catch(() => {
        if (!cancelled && activeSessionUserId.current === requestUserId) {
          setReview(null);
          setNotice(
            "Não foi possível carregar este briefing. Verifique a permissão do operador e tente atualizar a caixa de entrada.",
          );
        }
      })
      .finally(() => {
        if (!cancelled && activeSessionUserId.current === requestUserId) setReviewBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionUserId, currentOperatorAccess, selectedId]);

  const selectedBrief = useMemo(
    () => inbox.find((item) => item.id === selectedId) ?? null,
    [inbox, selectedId],
  );
  const analysis = review?.analysis ?? null;
  const methodDraft = analysis ? asRecord(analysis["rascunho_de_método"]) : null;
  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    setRecoveryNotice("");
    try {
      const { error } = await getSupabase().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        const safeError = error as { status?: unknown; code?: unknown; name?: unknown };
        const status =
          typeof safeError.status === "number" &&
          Number.isInteger(safeError.status) &&
          safeError.status >= 0 &&
          safeError.status <= 599
            ? safeError.status
            : undefined;
        const code =
          typeof safeError.code === "string" && /^[a-z0-9_:-]{1,64}$/i.test(safeError.code)
            ? safeError.code
            : undefined;
        const details = [status && status > 0 ? `HTTP ${status}` : undefined, code].filter(Boolean);

        if (status === 0 || safeError.name === "AuthRetryableFetchError") {
          setAuthError(
            "O navegador não conseguiu alcançar o Supabase Auth. Isso é uma falha de conexão/configuração do Preview, não uma confirmação de senha incorreta.",
          );
        } else if (status === 429 || code === "over_request_rate_limit") {
          setAuthError(
            `O Supabase Auth limitou temporariamente a tentativa${details.length ? ` (${details.join(" · ")})` : ""}. Aguarde antes de tentar novamente.`,
          );
        } else if (status !== undefined && status >= 500) {
          setAuthError(
            `O Supabase Auth respondeu com uma falha de serviço (${details.join(" · ")}). Isso não indica senha incorreta.`,
          );
        } else if (details.length > 0) {
          setAuthError(
            `O Supabase Auth recusou a tentativa (${details.join(" · ")}). Confirme que a conta pertence ao projeto Mow Group; esse código não revela a senha nem identifica sozinho a causa.`,
          );
        } else {
          setAuthError(
            "O Supabase Auth recusou a tentativa sem um código seguro. Isso não confirma sozinho que a senha está incorreta.",
          );
        }
      }
    } catch {
      setAuthError(
        "Não foi possível conectar ao serviço de autenticação. Tente novamente mais tarde.",
      );
    } finally {
      setAuthBusy(false);
    }
  }

  async function requestPasswordReset() {
    const normalizedEmail = email.trim();
    setAuthError("");
    setRecoveryNotice("");
    setPassword("");
    if (!normalizedEmail) {
      setAuthError("Informe seu e-mail para solicitar a recuperação da senha.");
      return;
    }

    setAuthBusy(true);
    try {
      const redirectTo = new URL(
        "/method-factory/reset-password",
        window.location.origin,
      ).toString();
      const { error } = await getSupabase().auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo,
      });
      if (error) {
        const safeError = error as { status?: unknown; code?: unknown };
        const details: string[] = [];
        if (
          typeof safeError.status === "number" &&
          Number.isInteger(safeError.status) &&
          safeError.status >= 100 &&
          safeError.status <= 599
        ) {
          details.push(`HTTP ${safeError.status}`);
        }
        if (typeof safeError.code === "string" && /^[a-z0-9_:-]{1,64}$/i.test(safeError.code)) {
          details.push(safeError.code);
        }
        setAuthError(
          details.length > 0
            ? `O Supabase recusou o pedido (${details.join(" · ")}). Esta tentativa não será repetida automaticamente.`
            : "O Supabase recusou o pedido e não informou um código seguro. Esta tentativa não será repetida automaticamente.",
        );
      } else {
        setRecoveryNotice(
          "Se esse e-mail estiver cadastrado, você receberá instruções para redefinir a senha. Confira também o spam.",
        );
      }
    } catch {
      setAuthError("O serviço de recuperação não está disponível neste momento.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function signOut() {
    setNotice("");
    try {
      const { error } = await getSupabase().auth.signOut();
      if (error) setNotice("Não foi possível encerrar a sessão agora.");
    } catch {
      setNotice("O serviço de autenticação não está disponível neste ambiente.");
    }
  }

  async function makeInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requestUserId = activeSessionUserId.current;
    if (!requestUserId) return;
    setInviteBusy(true);
    setNotice("");
    try {
      const created = await createFactoryInvite({
        data: {
          name: inviteName.trim(),
          industry: industry.trim(),
          relationshipType,
          expiresInDays,
        },
      });
      if (activeSessionUserId.current !== requestUserId) return;
      const link = new URL(created.path, window.location.origin).toString();
      setInvites((current) => [
        {
          id: created.id,
          name: inviteName.trim(),
          link,
          expiresAt: created.expiresAt,
          revoked: false,
        },
        ...current,
      ]);
      setInviteName("");
      setIndustry("");
      setNotice(
        "Convite criado. O link é exibido somente nesta sessão; guarde-o agora, pois não existe uma ferramenta de listagem ou recuperação de links.",
      );
    } catch {
      if (activeSessionUserId.current === requestUserId) {
        setNotice(
          "Não foi possível criar o convite. Confirme a permissão de operador ativo da Factory e tente novamente.",
        );
      }
    } finally {
      if (activeSessionUserId.current === requestUserId) setInviteBusy(false);
    }
  }

  async function copyInvite(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setNotice("Link copiado para a área de transferência.");
    } catch {
      setNotice("Não foi possível copiar automaticamente. Selecione e copie o link exibido.");
    }
  }

  async function revokeInvite(inviteId: string) {
    setActionBusy(true);
    setNotice("");
    try {
      const result = await revokeFactoryInvite({ data: { id: inviteId } });
      if (result.revoked) {
        setInvites((current) =>
          current.map((invite) => (invite.id === inviteId ? { ...invite, revoked: true } : invite)),
        );
        setNotice("Convite revogado.");
      } else {
        setNotice(
          "Não foi possível revogar o convite. Ele pode já ter sido usado ou não estar mais disponível.",
        );
      }
    } catch {
      setNotice(
        "Não foi possível revogar o convite. Confirme a permissão de operador ativo da Factory.",
      );
    } finally {
      setActionBusy(false);
    }
  }

  async function updateStatus(status: ReviewStatus) {
    if (!review) return;
    setActionBusy(true);
    setNotice("");
    try {
      const result = await updateFactoryBriefStatus({ data: { briefId: review.id, status } });
      if (!result.updated) {
        setNotice(
          "A mudança de status não foi aplicada. Confira o estado atual e as permissões do operador.",
        );
      } else {
        setNotice(`Status atualizado: ${STATUS_LABELS[status]}.`);
        await refreshInbox();
        const fresh = await getFactoryBriefReview({ data: { id: review.id } });
        setReview(fresh as ReviewData | null);
      }
    } catch {
      setNotice(
        "Não foi possível atualizar o status. Verifique a permissão do operador e tente novamente.",
      );
    } finally {
      setActionBusy(false);
    }
  }

  if (!authReady) {
    return (
      <PanelShell>
        <p role="status" className="text-sm text-muted-foreground">
          Verificando sessão…
        </p>
      </PanelShell>
    );
  }

  if (!session) {
    return (
      <PanelShell>
        <div className="max-w-xl">
          <p className="eyebrow text-muted-foreground">Method Factory · Área restrita</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Revisão humana</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Entre com sua conta Supabase. O acesso à caixa de entrada também depende de um operador
            ativo específico da Factory.
          </p>
          <form
            onSubmit={(event) => void signIn(event)}
            className="mt-8 space-y-5 border border-foreground/25 p-5 sm:p-7"
          >
            <div className="space-y-2">
              <Label htmlFor="factory-email">E-mail</Label>
              <Input
                id="factory-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 border-foreground/25 bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="factory-password">Senha</Label>
              <Input
                id="factory-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 border-foreground/25 bg-white"
              />
            </div>
            {authError ? (
              <p role="alert" className="text-sm text-foreground">
                {authError}
              </p>
            ) : null}
            {recoveryNotice ? (
              <p role="status" className="text-sm leading-relaxed text-muted-foreground">
                {recoveryNotice}
              </p>
            ) : null}
            <Button
              type="submit"
              className="min-h-12 w-full"
              disabled={authBusy || !authConfigured}
            >
              {authBusy ? "Entrando…" : "Entrar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 w-full"
              disabled={authBusy || !authConfigured}
              onClick={() => void requestPasswordReset()}
            >
              Esqueci minha senha
            </Button>
          </form>
        </div>
      </PanelShell>
    );
  }

  if (currentOperatorAccess !== "allowed") {
    return (
      <PanelShell>
        <div className="max-w-xl">
          <p className="eyebrow text-muted-foreground">Method Factory · Área restrita</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            {currentOperatorAccess === "checking"
              ? "Verificando autorização"
              : "Acesso indisponível"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground" role="status">
            {currentOperatorAccess === "checking"
              ? "Aguarde enquanto verificamos se a conta tem acesso ativo à Factory."
              : "Esta conta não tem acesso ativo à área de revisão."}
          </p>
          {currentOperatorAccess === "denied" ? (
            <Button
              type="button"
              variant="outline"
              className="mt-6 min-h-11"
              onClick={() => void signOut()}
            >
              <LogOut aria-hidden="true" /> Sair
            </Button>
          ) : null}
        </div>
      </PanelShell>
    );
  }

  return (
    <PanelShell>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-foreground/25 pb-6">
        <div>
          <p className="eyebrow text-muted-foreground">Method Factory · Operação interna</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Caixa de revisão
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Sessão autenticada · {session.user.email ?? "operador"}
          </p>
        </div>
        <Button type="button" variant="outline" className="min-h-11" onClick={() => void signOut()}>
          <LogOut aria-hidden="true" /> Sair
        </Button>
      </div>

      {notice ? (
        <p
          role="status"
          className="mt-6 border border-foreground/25 bg-white/60 p-4 text-sm leading-relaxed"
        >
          {notice}
        </p>
      ) : null}

      <section
        className="mt-8 border border-foreground/25 p-5 sm:p-6"
        aria-labelledby="invite-title"
      >
        <h2 id="invite-title" className="text-xl font-medium">
          Criar convite
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          O link contém um token de uso único no fragmento da URL. Compartilhe-o por um canal
          apropriado. O link não pode ser recuperado depois desta sessão.
        </p>
        <form
          onSubmit={(event) => void makeInvite(event)}
          className="mt-6 grid gap-5 sm:grid-cols-2"
        >
          <div className="space-y-2">
            <Label htmlFor="invite-name">Nome da empresa ou iniciativa</Label>
            <Input
              id="invite-name"
              required
              maxLength={200}
              value={inviteName}
              onChange={(event) => setInviteName(event.target.value)}
              className="h-12 border-foreground/25 bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-industry">
              Setor <span className="font-normal text-muted-foreground">· opcional</span>
            </Label>
            <Input
              id="invite-industry"
              maxLength={200}
              value={industry}
              onChange={(event) => setIndustry(event.target.value)}
              className="h-12 border-foreground/25 bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-relationship">Tipo de relacionamento</Label>
            <select
              id="invite-relationship"
              value={relationshipType}
              onChange={(event) => setRelationshipType(event.target.value as RelationshipType)}
              className="h-12 w-full border border-foreground/25 bg-white px-3 text-base"
            >
              <option value="internal">Iniciativa interna</option>
              <option value="related_company">Empresa relacionada</option>
              <option value="external_pilot">Piloto externo</option>
              <option value="client">Cliente</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-expiration">Expiração</Label>
            <select
              id="invite-expiration"
              value={expiresInDays}
              onChange={(event) => setExpiresInDays(Number(event.target.value))}
              className="h-12 w-full border border-foreground/25 bg-white px-3 text-base"
            >
              {Array.from({ length: 30 }, (_, index) => index + 1).map((days) => (
                <option key={days} value={days}>
                  {days} {days === 1 ? "dia" : "dias"}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" className="min-h-12" disabled={inviteBusy}>
              {inviteBusy ? "Criando…" : "Criar convite"}
            </Button>
          </div>
        </form>
        {invites.length > 0 ? (
          <div className="mt-6 space-y-4">
            {invites.map((invite) => (
              <div key={invite.id} className="border border-border p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{invite.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Expira em {formatDate(invite.expiresAt)} · ID mantido somente nesta sessão
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-10"
                    disabled={invite.revoked || actionBusy}
                    onClick={() => void revokeInvite(invite.id)}
                  >
                    {invite.revoked ? "Revogado" : "Revogar convite"}
                  </Button>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Input
                    readOnly
                    aria-label={`Link do convite para ${invite.name}`}
                    value={invite.link}
                    className="h-11 min-w-0 border-foreground/25 bg-white font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 shrink-0"
                    onClick={() => void copyInvite(invite.link)}
                  >
                    <Copy aria-hidden="true" /> Copiar link
                  </Button>
                </div>
                {invite.revoked ? (
                  <p className="mt-2 text-xs text-muted-foreground">Este link foi revogado.</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(16rem,0.7fr)_minmax(0,1.6fr)]">
        <section aria-labelledby="inbox-title">
          <div className="flex items-center justify-between gap-3 border-b border-foreground/25 pb-4">
            <div>
              <h2 id="inbox-title" className="text-xl font-medium">
                Briefings
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {inbox.length} item(ns) · limite retornada pela caixa
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              aria-label="Atualizar caixa de entrada"
              className="min-h-11"
              disabled={inboxBusy}
              onClick={() => void refreshInbox()}
            >
              <RefreshCw className="size-4" aria-hidden="true" /> Atualizar
            </Button>
          </div>
          {inboxBusy ? (
            <p role="status" className="py-6 text-sm text-muted-foreground">
              Carregando caixa de entrada…
            </p>
          ) : inbox.length === 0 ? (
            <p className="py-6 text-sm leading-relaxed text-muted-foreground">
              Nenhum briefing disponível nesta caixa ou o acesso não está configurado.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {inbox.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-pressed={selectedId === item.id}
                    onClick={() => {
                      setSelectedId(item.id);
                      setNotice("");
                    }}
                    className={`w-full px-3 py-4 text-left transition-colors hover:bg-black/5 ${selectedId === item.id ? "border-l-2 border-foreground bg-black/5" : "border-l-2 border-transparent"}`}
                  >
                    <span className="block font-medium">{item.company}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {RELATIONSHIP_LABELS[item.relationshipType] ?? "Relacionamento informado"} ·{" "}
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                    {item.industry ? (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {item.industry}
                      </span>
                    ) : null}
                    <span className="mt-2 block text-xs text-muted-foreground">
                      {item.pains.length} dor(es) · {formatDate(item.submittedAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="min-w-0" aria-labelledby="review-title">
          {reviewBusy ? (
            <p role="status" className="py-8 text-sm text-muted-foreground">
              Carregando briefing…
            </p>
          ) : review && selectedBrief ? (
            <ReviewPanel
              brief={selectedBrief}
              review={review}
              analysis={analysis}
              methodDraft={methodDraft}
              actionBusy={actionBusy}
              onStatus={(status) => void updateStatus(status)}
            />
          ) : (
            <div className="border border-dashed border-foreground/25 p-8 text-sm leading-relaxed text-muted-foreground">
              Selecione um briefing para abrir os dados de revisão. A empresa relacionada é
              identificada como tal; isso não constitui validação independente.
            </div>
          )}
        </section>
      </div>
    </PanelShell>
  );
}

function ReviewPanel({
  brief,
  review,
  analysis,
  methodDraft,
  actionBusy,
  onStatus,
}: {
  brief: FactoryInboxItem;
  review: ReviewData;
  analysis: Record<string, unknown> | null;
  methodDraft: Record<string, unknown> | null;
  actionBusy: boolean;
  onStatus: (status: ReviewStatus) => void;
}) {
  const values = recordStrings(review.payload);
  const statusChoices: Array<{ value: ReviewStatus; label: string; description: string }> = [
    {
      value: "in_review",
      label: "Marcar em revisão",
      description: "Registrar que a equipe está revisando.",
    },
    {
      value: "needs_clarification",
      label: "Marcar precisa de esclarecimento",
      description: "Registrar que falta contexto; nenhum pedido é enviado à empresa.",
    },
    {
      value: "archived",
      label: "Arquivar briefing",
      description: "Encerrar o acompanhamento deste briefing.",
    },
  ];

  return (
    <div className="space-y-7">
      <header className="border-b border-foreground/25 pb-5">
        <p className="eyebrow text-muted-foreground">Briefing recebido · revisão interna</p>
        <h2 id="review-title" className="mt-3 break-words text-2xl font-semibold tracking-tight">
          {brief.company}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {RELATIONSHIP_LABELS[brief.relationshipType] ?? "Relacionamento informado"}
          {brief.industry ? ` · ${brief.industry}` : ""}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Empresa relacionada, quando aplicável, conforme cadastro do convite — não é validação
          independente.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Status: {STATUS_LABELS[review.status] ?? review.status}</span>
          <span>Enviado: {formatDate(review.submittedAt)}</span>
          <span>ID: {review.id}</span>
        </div>
      </header>

      <section className="border border-border p-5" aria-labelledby="reported-title">
        <h3 id="reported-title" className="text-lg font-medium">
          Relato informado
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Relato fornecido no briefing; não verificado independentemente.
        </p>
        <dl className="mt-5 space-y-4">
          {BRIEF_STEPS.flatMap((step) => visibleFields(step, values))
            .filter((field) => field.kind !== "problem-list" && values[field.id])
            .map((field) => (
              <div key={field.id}>
                <dt className="text-xs text-muted-foreground">{field.label}</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {values[field.id]}
                </dd>
              </div>
            ))}
        </dl>
      </section>

      <section className="border border-border p-5" aria-labelledby="pains-title">
        <h3 id="pains-title" className="text-lg font-medium">
          Pontos de dor
        </h3>
        <ol className="mt-4 space-y-4">
          {review.pains.map((pain, index) => (
            <li key={String(pain["id"] ?? index)} className="border-l border-foreground/25 pl-4">
              <h4 className="font-medium">{String(pain["title"] ?? `Dor ${index + 1}`)}</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {String(pain["domain"] ?? "Área não informada")} · Prioridade percebida:{" "}
                {String(pain["urgency"] ?? "Não informada")}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                {String(pain["description"] ?? "")}
              </p>
              {pain["impact"] ? (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Impacto informado: {String(pain["impact"])}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {analysis ? (
        <AnalysisPanel
          analysis={analysis}
          methodDraft={methodDraft}
          inputDigest={review.inputDigest}
        />
      ) : (
        <section className="border border-border p-5">
          <h3 className="text-lg font-medium">Análise e rascunho</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Nenhum resultado de análise está disponível neste briefing.
          </p>
        </section>
      )}

      <section className="border border-foreground/25 p-5" aria-labelledby="actions-title">
        <h3 id="actions-title" className="text-lg font-medium">
          Ações explícitas de revisão
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Registre o briefing como “em revisão” antes de aprovar. Cada ação altera o estado
          registrado; nenhuma envia e-mail ou executa planos externos.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {statusChoices.map((choice) => (
            <Button
              key={choice.value}
              type="button"
              variant="outline"
              className="min-h-12 whitespace-normal"
              disabled={
                actionBusy ||
                review.status === "approved_for_method" ||
                review.status === "archived"
              }
              title={choice.description}
              onClick={() => onStatus(choice.value)}
            >
              {choice.label}
            </Button>
          ))}
        </div>
        <p
          className="mt-5 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground"
          role="status"
        >
          Aprovação bloqueada: rules-v1 é apenas um rascunho determinístico, não uma pesquisa GKI
          concluída. A aprovação só poderá ser habilitada depois da pesquisa integral, da revisão
          humana aprovada sobre o hash congelado e do vínculo seguro ao método.
        </p>
      </section>
    </div>
  );
}

function AnalysisPanel({
  analysis,
  methodDraft,
  inputDigest,
}: {
  analysis: Record<string, unknown>;
  methodDraft: Record<string, unknown> | null;
  inputDigest: string | null;
}) {
  const factualSummary = asRecord(analysis["resumo_factual"]);
  const hypotheses = asArray(analysis["hipóteses"]);
  const questions = asArray(analysis["lacunas_e_perguntas"]);
  const relatedSources = asArray(analysis["fontes_relacionadas"]);
  const limitations = asArray(analysis["limitações"]);
  const method = methodDraft;

  return (
    <section className="space-y-5 border border-foreground/25 p-5" aria-labelledby="analysis-title">
      <div>
        <p className="eyebrow text-muted-foreground">Saída de triagem · não é decisão automática</p>
        <h3 id="analysis-title" className="mt-2 text-lg font-medium">
          Rascunho determinístico
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Motor de regras explícitas (rules-v1), usando os dados informados e metadados. Não é
          resposta ou recomendação automática para a empresa; requer revisão humana.
        </p>
        <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Motor</dt>
            <dd className="mt-1 font-mono">{String(analysis["engine"] ?? "rules-v1")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Versão</dt>
            <dd className="mt-1 font-mono">{String(analysis["version"] ?? "Não informada")}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Estado</dt>
            <dd className="mt-1">
              {String(analysis["status"] ?? "Rascunho; revisar antes de qualquer uso")}
            </dd>
          </div>
          {inputDigest ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Digest dos insumos (SHA-256)</dt>
              <dd className="mt-1 break-all font-mono text-[10px]">{inputDigest}</dd>
              <dd className="mt-1 text-[10px] text-muted-foreground">
                Identificador de integridade da versão rules-v1, briefing, dores e metadados usados;
                não contém os dados em claro.
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      {factualSummary ? (
        <div className="border-t border-border pt-4">
          <h4 className="font-medium">Resumo factual informado</h4>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
            {String(factualSummary["texto"] ?? "")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {String(
              factualSummary["atribuição"] ?? "Atribuído ao briefing; sem verificação independente",
            )}
          </p>
        </div>
      ) : null}

      {hypotheses.length > 0 ? (
        <div className="border-t border-border pt-4">
          <h4 className="font-medium">Hipóteses — requerem teste, não são fatos</h4>
          <ul className="mt-3 space-y-3">
            {hypotheses.map((item, index) => {
              const hypothesis = asRecord(item);
              return (
                <li
                  key={index}
                  className="border-l border-foreground/25 pl-3 text-sm leading-relaxed"
                >
                  <p>{String(hypothesis?.["texto"] ?? "")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {String(hypothesis?.["marca"] ?? "Hipótese; validar com revisão humana")} · Dor
                    relacionada: {String(hypothesis?.["dor_relacionada"] ?? "Não especificada")}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {method ? (
        <div className="border-t border-border pt-4">
          <h4 className="font-medium">Método em rascunho</h4>
          <p className="mt-2 text-sm font-medium">
            {String(method["objetivo"] ?? "Objetivo ainda não especificado")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {String(method["status"] ?? "Rascunho interno — não aprovado nem validado")}
          </p>
          <StructuredList title="Premissas" items={method["premissas"]} />
          <StructuredList title="Limites" items={method["limites"]} />
          <StructuredList
            title="Passos sugeridos (não executados)"
            items={method["passos"]}
            objectFields={["etapa", "descrição", "responsável_sugerido", "instrumentos"]}
          />
          <StructuredList
            title="Métricas e definições propostas"
            items={method["métricas_e_definições"]}
          />
          <StructuredList
            title="Resultados esperados (não observados)"
            items={method["resultados_esperados"]}
          />
        </div>
      ) : null}

      {questions.length > 0 ? (
        <StructuredList
          title="Lacunas e perguntas de esclarecimento"
          items={questions}
          objectFields={["pergunta", "motivo", "relacionada_a"]}
        />
      ) : null}
      {relatedSources.length > 0 ? (
        <div className="border-t border-border pt-4">
          <h4 className="font-medium">Fontes relacionadas por metadados</h4>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Estas referências não foram consultadas como conteúdo nem usadas como evidência do caso.
          </p>
          <ul className="mt-3 space-y-3">
            {relatedSources.map((item, index) => {
              const source = asRecord(item);
              return (
                <li key={index} className="border border-border p-3 text-sm">
                  <p className="font-medium">{String(source?.["título"] ?? "Fonte sem título")}</p>
                  <p className="mt-1 break-words text-xs text-muted-foreground">
                    {String(source?.["url_canônica"] ?? "")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {String(source?.["classificação"] ?? "Referência de metadados")} · Direitos:{" "}
                    {String(source?.["status_de_direitos"] ?? "não informado")}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {String(
                      source?.["nota"] ??
                        "Correspondência de metadados, não validação independente.",
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {limitations.length > 0 ? (
        <StructuredList title="Limitações declaradas" items={limitations} />
      ) : null}
    </section>
  );
}

function StructuredList({
  title,
  items,
  objectFields = [],
}: {
  title: string;
  items: unknown;
  objectFields?: string[];
}) {
  const entries = asArray(items);
  if (!entries.length) return null;
  return (
    <div className="mt-4 border-t border-border pt-4">
      <h5 className="text-sm font-medium">{title}</h5>
      <ul className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {entries.map((item, index) => {
          const record = asRecord(item);
          if (!record)
            return (
              <li key={index} className="border-l border-foreground/25 pl-3">
                {String(item)}
              </li>
            );
          return (
            <li key={index} className="border-l border-foreground/25 pl-3">
              {objectFields.map((field) =>
                record[field] === undefined ? null : (
                  <p key={field}>
                    <span className="text-muted-foreground">{field.replaceAll("_", " ")}: </span>
                    {Array.isArray(record[field])
                      ? record[field].map(String).join(" · ")
                      : String(record[field])}
                  </p>
                ),
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-[70vh] max-w-7xl px-5 py-10 sm:px-8 sm:py-14">{children}</div>
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function recordStrings(payload: Record<string, unknown>): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

function formatDate(value: string): string {
  if (!value) return "Data não informada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

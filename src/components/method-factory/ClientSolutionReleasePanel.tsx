import { useState, type FormEvent } from "react";
import { Copy, LockKeyhole, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClientSolutionRelease } from "@/lib/mow-gki/client-solution.functions";
import { buildClientSolutionSnapshot } from "@/lib/mow-gki/client-solution-contract";
import type { MethodDraftOutput } from "@/lib/mow-gki/server/method-draft-contract";

export function ClientSolutionReleasePanel({
  briefId,
  draftId,
  draft,
  persisted,
}: {
  briefId: string;
  draftId: string | null;
  draft: MethodDraftOutput;
  persisted: boolean;
}) {
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [objective, setObjective] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [confirmedReview, setConfirmedReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  async function release(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!persisted || !draftId || !confirmedReview || busy) return;
    setBusy(true);
    setNotice("");
    setInviteLink("");
    try {
      const snapshot = buildClientSolutionSnapshot(draft, objective);
      const created = await createClientSolutionRelease({
        data: {
          briefId,
          draftId,
          snapshot,
          inviteeEmail: inviteeEmail.trim().toLowerCase(),
          expiresInDays,
        },
      });
      setInviteLink(new URL(created.invitePath, window.location.origin).toString());
      setNotice(
        `Versão ${created.version} liberada. O convite individual fica disponível somente nesta sessão; compartilhe com a pessoa convidada por um canal apropriado.`,
      );
      setConfirmedReview(false);
      setInviteeEmail("");
    } catch {
      setNotice(
        "Não foi possível liberar a versão. Confirme o acesso de owner ativo, o estado do briefing e a disponibilidade da persistência aprovada.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setNotice("Convite copiado. A conta deve corresponder ao e-mail convidado.");
    } catch {
      setNotice("Não foi possível copiar automaticamente. Selecione e copie o convite exibido.");
    }
  }

  return (
    <section
      className="mt-8 border border-foreground/25 p-5 sm:p-6"
      aria-labelledby="client-release-title"
    >
      <div className="flex items-start gap-3">
        <LockKeyhole className="mt-1 size-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="eyebrow text-muted-foreground">Compartilhamento controlado · equipe MOW</p>
          <h4 id="client-release-title" className="mt-2 text-lg font-medium">
            Preparar versão de execução para o cliente
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Esta ação cria uma projeção allowlist, sem briefing, achados, fontes, URLs, citações,
            notas internas ou dados do modelo. Só um owner ativo pode liberá-la. A pessoa cliente
            entra com conta individual e e-mail confirmado; o convite não é um acesso permanente.
          </p>
        </div>
      </div>

      {!persisted || !draftId ? (
        <p
          className="mt-5 border border-dashed border-foreground/25 p-4 text-sm leading-relaxed text-muted-foreground"
          role="status"
        >
          Liberação indisponível: o rascunho ainda não foi persistido no banco. A candidata de
          persistência precisa ser revisada e instalada antes de criar um espaço de execução.
        </p>
      ) : (
        <form onSubmit={(event) => void release(event)} className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="client-solution-objective">Objetivo apresentado ao cliente</Label>
            <Textarea
              id="client-solution-objective"
              value={objective}
              maxLength={1000}
              rows={3}
              required
              onChange={(event) => setObjective(event.target.value)}
              placeholder="Escreva o objetivo executivo para orientar a aplicação, sem repetir o briefing nem revelar análise ou fontes internas."
              className="min-h-24 border-foreground/25 bg-white"
            />
          </div>
          <div className="border border-border p-4">
            <h5 className="font-medium">Prévia dos campos que serão compartilhados</h5>
            <p className="mt-2 text-sm">{draft.title}</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              {draft.methodSteps.map((step) => (
                <li key={step.order}>
                  <strong className="text-foreground">{step.name}</strong> — {step.action}
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">
              Também serão compartilhados os papéis, duração, entradas/saídas e indicadores para
              execução. Evidências/citações não entram nessa projeção.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client-invite-email">E-mail individual convidado</Label>
              <Input
                id="client-invite-email"
                type="email"
                autoComplete="email"
                maxLength={320}
                required
                value={inviteeEmail}
                onChange={(event) => setInviteeEmail(event.target.value)}
                className="h-12 border-foreground/25 bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-invite-expiration">Validade do convite</Label>
              <select
                id="client-invite-expiration"
                value={expiresInDays}
                onChange={(event) => setExpiresInDays(Number(event.target.value))}
                className="h-12 w-full border border-foreground/25 bg-white px-3 text-sm"
              >
                {[1, 3, 7, 14, 30].map((days) => (
                  <option key={days} value={days}>
                    {days} {days === 1 ? "dia" : "dias"}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex cursor-pointer items-start gap-3 border border-foreground/25 p-4 text-sm leading-relaxed">
            <input
              type="checkbox"
              checked={confirmedReview}
              onChange={(event) => setConfirmedReview(event.target.checked)}
              className="mt-1 size-4 shrink-0 accent-black"
            />
            <span>
              Revisei a versão exibida e confirmo que o objetivo, as etapas, os papéis,
              entradas/saídas e indicadores estão adequados para compartilhamento com esta pessoa.
              Não estou aprovando ou validando automaticamente a evidência nem prometendo
              resultados.
            </span>
          </label>
          <Button
            type="submit"
            className="min-h-12"
            disabled={
              busy || !confirmedReview || objective.trim().length < 10 || !inviteeEmail.trim()
            }
          >
            <Send aria-hidden="true" />{" "}
            {busy ? "Validando direitos e preparando…" : "Revisar e liberar versão ao cliente"}
          </Button>
        </form>
      )}

      {notice ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground" role="status">
          {notice}
        </p>
      ) : null}
      {inviteLink ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            readOnly
            aria-label="Convite individual do cliente"
            value={inviteLink}
            className="h-11 min-w-0 border-foreground/25 bg-white font-mono text-xs"
          />
          <Button
            type="button"
            variant="outline"
            className="min-h-11 shrink-0"
            onClick={() => void copyInvite()}
          >
            <Copy aria-hidden="true" /> Copiar convite
          </Button>
        </div>
      ) : null}
    </section>
  );
}

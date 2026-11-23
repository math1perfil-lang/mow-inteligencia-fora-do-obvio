import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpenCheck, LoaderCircle, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchOpenAlexForRun, startOpenAlexResearchRun } from "@/lib/mow-gki/openalex.functions";
import type { OpenAlexWorksPage } from "@/lib/mow-gki/server/openalex-client";
import type { OpenAlexResearchRunSummary } from "@/lib/mow-gki/research-run.schema";
import { useOpenAlexOwnerAccess } from "@/lib/mow-gki/use-openalex-owner-access";

type DraftState = {
  version: number;
  sourceBriefId: string;
  query: string;
  confirmTopicOnly: boolean;
};
type SearchState = {
  version: number;
  currentRun: OpenAlexResearchRunSummary | null;
  page: OpenAlexWorksPage | null;
  busy: boolean;
  notice: string;
};

function emptyDraft(version: number): DraftState {
  return { version, sourceBriefId: "", query: "", confirmTopicOnly: false };
}

function emptySearch(version: number): SearchState {
  return { version, currentRun: null, page: null, busy: false, notice: "" };
}

export const Route = createFileRoute("/method-factory/openalex")({
  head: () => ({
    meta: [
      { title: "OpenAlex · MOW Method Factory" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: OpenAlexDiscoveryPage,
});

export function OpenAlexDiscoveryPage() {
  const access = useOpenAlexOwnerAccess();
  const [draftState, setDraftState] = useState(() => emptyDraft(0));
  const [searchState, setSearchState] = useState(() => emptySearch(0));
  const currentUserId = useRef<string | null>(null);
  const draft = draftState.version === access.version ? draftState : emptyDraft(access.version);
  const search = searchState.version === access.version ? searchState : emptySearch(access.version);

  useEffect(() => {
    currentUserId.current = access.userId;
    setDraftState(emptyDraft(access.version));
    setSearchState(emptySearch(access.version));
  }, [access.userId, access.version]);

  function updateDraft(patch: Partial<Omit<DraftState, "version">>) {
    setDraftState((current) => ({
      ...(current.version === access.version ? current : emptyDraft(access.version)),
      ...patch,
      version: access.version,
    }));
  }

  async function performSearch(
    researchRunId: string,
    topicQuery: string,
    ownerId: string,
    ownerVersion: number,
  ) {
    setSearchState((current) => {
      const base = current.version === ownerVersion ? current : emptySearch(ownerVersion);
      return { ...base, page: null, notice: "", version: ownerVersion };
    });
    try {
      const result = await searchOpenAlexForRun({
        data: {
          researchRunId,
          query: topicQuery,
          confirmTopicOnly: true,
          perPage: 10,
        },
      });
      if (currentUserId.current !== ownerId) return;
      setSearchState((current) => {
        if (current.version !== ownerVersion) return current;
        return {
          ...current,
          page: result,
          notice: "Resultados bibliográficos temporários; nada foi salvo como fonte curada.",
        };
      });
    } catch {
      if (currentUserId.current !== ownerId) return;
      setSearchState((current) => {
        if (current.version !== ownerVersion) return current;
        return {
          ...current,
          notice:
            "A consulta não foi concluída. Se a execução foi criada, você pode tentar novamente sem criar outra.",
        };
      });
    }
  }

  async function handleCreateAndSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (access.status !== "allowed" || !access.userId || !draft.confirmTopicOnly) return;

    const ownerId = access.userId;
    const ownerVersion = access.version;
    const topicQuery = draft.query.trim();
    const briefId = draft.sourceBriefId.trim();
    setSearchState({ ...emptySearch(ownerVersion), busy: true });

    try {
      const run = await startOpenAlexResearchRun({
        data: {
          sourceBriefId: briefId,
          question: topicQuery,
          confirmTopicOnly: true,
        },
      });
      if (currentUserId.current !== ownerId) return;
      setSearchState((current) => {
        if (current.version !== ownerVersion) return current;
        return { ...current, currentRun: run, busy: true };
      });
      await performSearch(run.id, topicQuery, ownerId, ownerVersion);
    } catch {
      if (currentUserId.current !== ownerId) return;
      setSearchState((current) => {
        if (current.version !== ownerVersion) return current;
        return {
          ...current,
          notice:
            "Não foi possível iniciar a pesquisa. Confira o UUID e se o briefing está em revisão.",
        };
      });
    } finally {
      if (currentUserId.current === ownerId) {
        setSearchState((current) =>
          current.version === ownerVersion ? { ...current, busy: false } : current,
        );
      }
    }
  }

  async function handleRetrySearch() {
    const run = search.currentRun;
    if (
      access.status !== "allowed" ||
      !access.userId ||
      !run ||
      !draft.confirmTopicOnly ||
      !run.question.trim()
    ) {
      return;
    }
    const ownerId = access.userId;
    const ownerVersion = access.version;
    setSearchState((current) =>
      current.version === ownerVersion ? { ...current, busy: true } : current,
    );
    try {
      await performSearch(run.id, run.question, ownerId, ownerVersion);
    } finally {
      if (currentUserId.current === ownerId) {
        setSearchState((current) =>
          current.version === ownerVersion ? { ...current, busy: false } : current,
        );
      }
    }
  }

  if (access.status === "checking") {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20" aria-live="polite">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Base interna · OpenAlex
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
          Verificando acesso
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          A página só carrega a busca depois da confirmação server-side de owner ativo.
        </p>
      </main>
    );
  }

  if (access.status !== "allowed") {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Base interna · OpenAlex
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
          Acesso indisponível
        </h1>
        <section
          className="mt-8 border border-amber-200/25 bg-amber-100/[0.04] p-5 sm:p-7"
          aria-label="Acesso restrito a owner ativo"
          role="status"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-200" aria-hidden="true" />
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">Somente owner ativo da Factory.</strong>{" "}
                Reviewer, owner inativo ou sessão ausente não podem acessar dados nem controles do
                GKI.
              </p>
              {access.status === "unconfigured" ? (
                <p>O serviço Supabase não está configurado neste ambiente.</p>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-18">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
        Base interna · owner ativo
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">Busca OpenAlex</h1>
      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Pesquisa temática curta vinculada a um briefing em revisão. O briefing completo nunca é
        enviado ao OpenAlex.
      </p>

      <section className="mt-8 border border-border bg-white p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Consulta bibliográfica</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A busca corresponde somente a títulos e solicita título, autores, ano, tipo, idioma e DOI.
          Não consulta nem retorna abstracts, texto integral, licenças ou links para PDFs.
        </p>
        <form className="mt-6 space-y-5" onSubmit={handleCreateAndSearch}>
          <div className="space-y-2">
            <Label htmlFor="openalex-brief-id">UUID do briefing (status em revisão)</Label>
            <Input
              id="openalex-brief-id"
              autoComplete="off"
              inputMode="text"
              maxLength={36}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={draft.sourceBriefId}
              onChange={(event) => updateDraft({ sourceBriefId: event.currentTarget.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="openalex-topic">Termos temáticos curtos (até 12 termos)</Label>
            <Input
              id="openalex-topic"
              autoComplete="off"
              maxLength={160}
              placeholder="Ex.: retenção de clientes"
              value={draft.query}
              onChange={(event) => updateDraft({ query: event.currentTarget.value })}
              required
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Não cole o briefing. Não use nomes, e-mails, telefones, credenciais ou informação
              confidencial; a validação automática não reconhece todo dado pessoal.
            </p>
          </div>
          <label className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
            <input
              className="mt-1 size-4 accent-white"
              type="checkbox"
              checked={draft.confirmTopicOnly}
              onChange={(event) => updateDraft({ confirmTopicOnly: event.currentTarget.checked })}
              required
            />
            <span>
              Confirmo que enviei apenas termos temáticos curtos, sem briefing integral, dado
              pessoal ou informação confidencial.
            </span>
          </label>
          <Button type="submit" disabled={search.busy || !draft.confirmTopicOnly}>
            {search.busy ? (
              <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="mr-2 size-4" aria-hidden="true" />
            )}
            {search.busy ? "Consultando…" : "Iniciar pesquisa e buscar metadados"}
          </Button>
        </form>
      </section>

      {search.currentRun ? (
        <section className="mt-6 border border-border p-5 sm:p-7" aria-label="Execução atual">
          <div className="flex items-start gap-3">
            <BookOpenCheck
              className="mt-0.5 size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="min-w-0 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <h2 className="font-semibold text-foreground">Pesquisa vinculada ao briefing</h2>
              <p className="break-all font-mono text-xs text-muted-foreground">
                Execução: {search.currentRun.id}
              </p>
              <p>Termos registrados: {search.currentRun.question}</p>
              <p>Estado: em andamento · lease liberado após a consulta.</p>
              <p>Se necessário, repita a consulta sem criar uma nova execução.</p>
              <Button
                type="button"
                variant="outline"
                disabled={search.busy || !draft.confirmTopicOnly || !draft.query.trim()}
                onClick={handleRetrySearch}
              >
                <Search className="mr-2 size-4" aria-hidden="true" />
                Tentar a busca novamente
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {search.notice ? (
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground" role="status">
          {search.notice}
        </p>
      ) : null}

      <section className="mt-8 border border-amber-200/25 bg-amber-100/[0.04] p-5 sm:p-7">
        <h2 className="font-semibold text-foreground">Limites de uso e direitos</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Os itens abaixo são metadados bibliográficos não curados e voláteis, mantidos apenas na
          memória desta página. A licença dos metadados do OpenAlex não libera o conteúdo das obras.
          Os direitos de cada obra permanecem “não avaliados”; não use, reproduza ou comunique
          conteúdo até uma revisão humana integral e uma avaliação de direitos por material.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Esta busca não persiste candidatos, não faz curadoria, não cria pacote metodológico e não
          substitui a revisão humana antes de qualquer uso ou comunicação externa. A atribuição das
          fontes permanece somente interna à equipe MOW.
        </p>
      </section>

      {search.page ? (
        <section className="mt-8 space-y-4" aria-label="Metadados bibliográficos">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-xl font-semibold">Metadados encontrados</h2>
            <p className="text-xs text-muted-foreground">
              {search.page.results.length} exibidos
              {search.page.resultCount === null ? "" : ` · ${search.page.resultCount} no índice`}
            </p>
          </div>
          {search.page.results.length === 0 ? (
            <p className="border border-border p-5 text-sm text-muted-foreground">
              Nenhum registro bibliográfico foi encontrado com esses termos no título.
            </p>
          ) : (
            search.page.results.map((work) => (
              <article key={work.providerRecordId} className="border border-border p-5 sm:p-6">
                <h3 className="text-base font-semibold leading-relaxed text-foreground">
                  {work.title}
                </h3>
                <dl className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <div>
                    <dt className="inline font-medium text-foreground/85">Autores: </dt>
                    <dd className="inline">
                      {work.authors.length ? work.authors.join(", ") : "Não informado"}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground/85">Ano: </dt>
                    <dd className="inline">{work.publicationYear ?? "Não informado"}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground/85">Tipo: </dt>
                    <dd className="inline">{work.publicationType}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground/85">Idioma: </dt>
                    <dd className="inline">{work.language ?? "Não informado"}</dd>
                  </div>
                  {work.doi ? (
                    <div className="sm:col-span-2">
                      <dt className="inline font-medium text-foreground/85">DOI: </dt>
                      <dd className="inline">
                        <a href={work.doi} target="_blank" rel="noreferrer" className="underline">
                          {work.doi}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                  <a
                    href={work.providerRecordUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground underline underline-offset-4"
                  >
                    Registro OpenAlex
                  </a>
                  <span className="text-amber-100/80">Direitos do conteúdo: não avaliados</span>
                </div>
              </article>
            ))
          )}
        </section>
      ) : null}
    </main>
  );
}

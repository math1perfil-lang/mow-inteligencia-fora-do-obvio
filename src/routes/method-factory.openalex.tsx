import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { BookOpenCheck, LoaderCircle, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientSolutionReleasePanel } from "@/components/method-factory/ClientSolutionReleasePanel";
import { SourceCatalogImportPanel } from "@/components/method-factory/SourceCatalogImportPanel";
import {
  recordSourceRightsReview,
  searchSourceRightsForReview,
  searchConfiguredSourcesForRun,
  searchOpenAlexForRun,
  startOpenAlexResearchRun,
  getMethodDraftBriefOptions,
  generateMethodDraftForBrief,
} from "@/lib/mow-gki/openalex.functions";
import {
  getOpenAlexFailureCode,
  getOpenAlexFailureNotice,
  getOpenAlexRetryAfterSeconds,
  type OpenAlexFailureCode,
} from "@/lib/mow-gki/openalex-error-messages";
import type { OpenAlexWorksPage } from "@/lib/mow-gki/server/openalex-client";
import type { ExternalSourceSearchPage } from "@/lib/mow-gki/server/external-source.schema";
import type {
  SourceRightsReviewSubmission,
  SourceRightsSearchRow,
} from "@/lib/mow-gki/server/source-rights-review-contract";
import type {
  SourcePermittedUse,
  SourceRightsStatus,
} from "@/lib/mow-gki/server/source-rights-policy";
import type { MethodDraftOutput } from "@/lib/mow-gki/server/method-draft-contract";
import { getMethodDraftFailureNotice } from "@/lib/mow-gki/method-draft-errors";
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
  queryStatus: "idle" | "searching" | "completed" | "failed";
  busy: boolean;
  notice: string;
  failureCode: OpenAlexFailureCode | null;
  retryAvailableAt: number | null;
};

type ExternalSourceState = {
  version: number;
  page: ExternalSourceSearchPage | null;
  busy: boolean;
  notice: string;
};

function emptyExternalSourceState(version: number): ExternalSourceState {
  return { version, page: null, busy: false, notice: "" };
}

const openAlexRouteSearchSchema = z.object({ briefId: z.string().uuid().optional() }).catch({});

const RIGHTS_STATUS_CHOICES: { value: SourceRightsStatus; label: string }[] = [
  { value: "pending", label: "Pendente de verificação" },
  { value: "reference_only", label: "Somente referência e metadados" },
  { value: "open_license_verified", label: "Licença aberta verificada" },
  { value: "license_scoped", label: "Licença com escopo específico" },
  { value: "explicit_permission", label: "Permissão explícita" },
  { value: "public_domain_verified", label: "Domínio público verificado" },
  { value: "restricted", label: "Restrita" },
  { value: "revoked", label: "Revogada" },
];

const RIGHTS_USE_CHOICES: { value: SourcePermittedUse; label: string }[] = [
  { value: "catalog_metadata", label: "Consultar metadados do catálogo" },
  { value: "link_and_citation", label: "Manter link e citação" },
  { value: "internal_content_analysis", label: "Analisar conteúdo internamente" },
  { value: "commercial_method_derivation", label: "Derivar método para uso comercial" },
  { value: "store_full_text", label: "Armazenar texto integral" },
  { value: "publish_excerpt", label: "Publicar trechos" },
];

const REFERENCE_ONLY_USES: SourcePermittedUse[] = ["catalog_metadata", "link_and_citation"];

function emptyRightsReview(sourceId = ""): SourceRightsReviewSubmission {
  return {
    sourceId,
    decisionStatus: "pending",
    permittedUses: ["catalog_metadata", "link_and_citation"],
    rightsBasis: "",
    rightsEvidenceUrl: "",
    restrictions: "",
    restrictionsReviewed: false,
    restrictionsSatisfied: false,
    validUntil: "",
  };
}

function safeHttpsHref(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function emptyDraft(version: number, sourceBriefId = ""): DraftState {
  return { version, sourceBriefId, query: "", confirmTopicOnly: false };
}

function emptySearch(version: number): SearchState {
  return {
    version,
    currentRun: null,
    page: null,
    queryStatus: "idle",
    busy: false,
    notice: "",
    failureCode: null,
    retryAvailableAt: null,
  };
}

export const Route = createFileRoute("/method-factory/openalex")({
  validateSearch: openAlexRouteSearchSchema,
  head: () => ({
    meta: [
      { title: "OpenAlex · MOW Method Factory" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: OpenAlexRoute,
});

function OpenAlexRoute() {
  const { briefId } = Route.useSearch();
  return <OpenAlexDiscoveryPage initialBriefId={briefId ?? ""} />;
}

function SourceRightsReviewPanel() {
  const [catalogQuery, setCatalogQuery] = useState("");
  const [rows, setRows] = useState<SourceRightsSearchRow[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [review, setReview] = useState(() => emptyRightsReview());
  const [busy, setBusy] = useState<"search" | "save" | null>(null);
  const [notice, setNotice] = useState("");
  const selectedSource = rows.find((row) => row.source_id === selectedSourceId) ?? null;
  const hasContentUse = review.permittedUses.some((use) =>
    [
      "internal_content_analysis",
      "commercial_method_derivation",
      "store_full_text",
      "publish_excerpt",
    ].includes(use),
  );
  const authorizingStatuses: SourceRightsStatus[] = [
    "open_license_verified",
    "license_scoped",
    "explicit_permission",
    "public_domain_verified",
  ];
  const isAuthorizingStatus = authorizingStatuses.includes(review.decisionStatus);

  async function handleCatalogSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = catalogQuery.trim();
    if (query.length < 2 || busy) return;
    setBusy("search");
    setNotice("");
    try {
      const result = await searchSourceRightsForReview({ data: { query } });
      setRows(result);
      setSelectedSourceId("");
      setReview(emptyRightsReview());
      setNotice(
        result.length
          ? `${result.length} item(ns) do catálogo encontrados. Selecione um para revisar.`
          : "Nenhum item correspondente foi encontrado no catálogo privado.",
      );
    } catch {
      setNotice("A busca interna não está disponível; nenhum dado do catálogo foi alterado.");
    } finally {
      setBusy(null);
    }
  }

  function handleSelectSource(source: SourceRightsSearchRow) {
    setSelectedSourceId(source.source_id);
    setReview(emptyRightsReview(source.source_id));
    setNotice("");
  }

  function handleStatusChange(status: SourceRightsStatus) {
    setReview((current) => {
      const permittedUses = ["pending", "reference_only"].includes(status)
        ? current.permittedUses.filter((use) => REFERENCE_ONLY_USES.includes(use))
        : ["restricted", "revoked"].includes(status)
          ? []
          : current.permittedUses;
      return { ...current, decisionStatus: status, permittedUses };
    });
  }

  function handleUseChange(use: SourcePermittedUse, checked: boolean) {
    setReview((current) => ({
      ...current,
      permittedUses: checked
        ? [...new Set([...current.permittedUses, use])]
        : current.permittedUses.filter((item) => item !== use),
    }));
  }

  async function handleSaveReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSource || busy) return;
    setBusy("save");
    setNotice("");
    try {
      const saved = await recordSourceRightsReview({ data: review });
      setRows((current) =>
        current.map((row) =>
          row.source_id !== saved.source_id
            ? row
            : {
                ...row,
                rights_review_id: saved.rights_review_id,
                decision_status: saved.decision_status as SourceRightsStatus,
                permitted_uses: saved.permitted_uses,
                rights_basis: review.rightsBasis.trim() || null,
                rights_evidence_url: review.rightsEvidenceUrl || null,
                restrictions: review.restrictions,
                reviewed_by: saved.reviewed_by,
                reviewed_at: saved.reviewed_at,
                valid_until: saved.valid_until,
                restrictions_reviewed: saved.restrictions_reviewed,
                restrictions_satisfied: saved.restrictions_satisfied,
              },
        ),
      );
      setNotice(
        `Revisão registrada como decisão v${saved.decision_version}. O registro é append-only e a identidade/data foram atribuídas no servidor.`,
      );
      setReview(emptyRightsReview(selectedSource.source_id));
    } catch {
      setNotice(
        "A revisão não foi registrada. Confirme evidência, validade e restrições; o sistema não libera conteúdo quando a validação falha.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-8 border border-border p-5 sm:p-7" aria-labelledby="rights-review-title">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
        Área interna · owner ativo
      </p>
      <h2 id="rights-review-title" className="mt-3 text-xl font-semibold">
        Curadoria de direitos do catálogo privado
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Pesquise somente itens já cadastrados no catálogo MOW. Esta etapa não abre nem analisa o
        conteúdo da obra e não infere permissão a partir dos metadados. Cada decisão é uma revisão
        humana item a item, gravada como histórico append-only; fontes pendentes continuam limitadas
        a metadados e citação.
      </p>

      <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={handleCatalogSearch}>
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="rights-catalog-query">
            Título ou URL canônica para localizar no catálogo
          </Label>
          <Input
            id="rights-catalog-query"
            value={catalogQuery}
            maxLength={100}
            minLength={2}
            autoComplete="off"
            onChange={(event) => setCatalogQuery(event.currentTarget.value)}
            required
          />
        </div>
        <Button className="self-end" type="submit" disabled={busy !== null}>
          {busy === "search" ? (
            <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="mr-2 size-4" aria-hidden="true" />
          )}
          Buscar no catálogo
        </Button>
      </form>

      {notice ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground" role="status">
          {notice}
        </p>
      ) : null}

      {rows.length ? (
        <div className="mt-5 space-y-3" aria-label="Itens internos do catálogo">
          {rows.map((row) => {
            const url = safeHttpsHref(row.canonical_url);
            const currentDecision = row.decision_status
              ? (RIGHTS_STATUS_CHOICES.find((choice) => choice.value === row.decision_status)
                  ?.label ?? row.decision_status)
              : "Sem revisão estruturada";
            return (
              <article
                key={row.source_id}
                className={`border p-4 ${selectedSourceId === row.source_id ? "border-foreground" : "border-border"}`}
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-semibold leading-relaxed">{row.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {row.source_type} · Estado no catálogo: {row.catalog_rights_status} · Última
                      revisão: {currentDecision}
                    </p>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-xs underline underline-offset-4"
                      >
                        Abrir registro público da fonte
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Sem URL HTTPS segura no catálogo.
                      </p>
                    )}
                    {row.reviewed_at ? (
                      <p className="text-xs text-muted-foreground">
                        Última revisão registrada em{" "}
                        {new Date(row.reviewed_at).toLocaleString("pt-BR", { timeZone: "UTC" })} UTC
                        {row.valid_until
                          ? ` · validade até ${row.valid_until}`
                          : " · sem validade informada"}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    aria-pressed={selectedSourceId === row.source_id}
                    disabled={busy !== null}
                    onClick={() => handleSelectSource(row)}
                  >
                    {selectedSourceId === row.source_id ? "Selecionada" : "Revisar direitos"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {selectedSource ? (
        <form className="mt-6 space-y-5 border-t border-border pt-6" onSubmit={handleSaveReview}>
          <div>
            <h3 className="font-semibold">Nova revisão · {selectedSource.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Uma aprovação exige base e evidência HTTPS. Qualquer uso de conteúdo também exige data
              de validade e declaração explícita de que as restrições foram revisadas e satisfeitas.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rights-decision-status">Decisão humana</Label>
            <select
              id="rights-decision-status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={review.decisionStatus}
              onChange={(event) =>
                handleStatusChange(event.currentTarget.value as SourceRightsStatus)
              }
            >
              {RIGHTS_STATUS_CHOICES.map((choice) => (
                <option key={choice.value} value={choice.value}>
                  {choice.label}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Usos permitidos para esta fonte</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {RIGHTS_USE_CHOICES.map((choice) => {
                const statusAllowsUse = ["pending", "reference_only"].includes(
                  review.decisionStatus,
                )
                  ? REFERENCE_ONLY_USES.includes(choice.value)
                  : !["restricted", "revoked"].includes(review.decisionStatus);
                return (
                  <label
                    key={choice.value}
                    className={`flex items-start gap-2 text-sm leading-relaxed ${statusAllowsUse ? "text-muted-foreground" : "text-muted-foreground/50"}`}
                  >
                    <input
                      className="mt-1 size-4 accent-white"
                      type="checkbox"
                      checked={review.permittedUses.includes(choice.value)}
                      disabled={!statusAllowsUse}
                      onChange={(event) => {
                        handleUseChange(choice.value, event.currentTarget.checked);
                      }}
                    />
                    {choice.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="rights-basis">Fundamento da decisão</Label>
            <textarea
              id="rights-basis"
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              maxLength={4_000}
              value={review.rightsBasis}
              onChange={(event) => {
                const rightsBasis = event.currentTarget.value;
                setReview((current) => ({ ...current, rightsBasis }));
              }}
              required={isAuthorizingStatus}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rights-evidence-url">
              URL HTTPS da licença ou permissão consultada
            </Label>
            <Input
              id="rights-evidence-url"
              type="url"
              maxLength={2_048}
              value={review.rightsEvidenceUrl}
              onChange={(event) => {
                const rightsEvidenceUrl = event.currentTarget.value;
                setReview((current) => ({ ...current, rightsEvidenceUrl }));
              }}
              required={isAuthorizingStatus}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rights-restrictions">Restrições e condições aplicáveis</Label>
            <textarea
              id="rights-restrictions"
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              maxLength={2_000}
              value={review.restrictions}
              onChange={(event) => {
                const restrictions = event.currentTarget.value;
                setReview((current) => ({ ...current, restrictions }));
              }}
            />
          </div>

          <label className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
            <input
              className="mt-1 size-4 accent-white"
              type="checkbox"
              checked={review.restrictionsReviewed}
              onChange={(event) => {
                const restrictionsReviewed = event.currentTarget.checked;
                setReview((current) => ({
                  ...current,
                  restrictionsReviewed,
                  restrictionsSatisfied: restrictionsReviewed
                    ? current.restrictionsSatisfied
                    : false,
                }));
              }}
            />
            <span>
              Revisei explicitamente as restrições e condições registradas para esta obra.
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
            <input
              className="mt-1 size-4 accent-white"
              type="checkbox"
              checked={review.restrictionsSatisfied}
              disabled={!review.restrictionsReviewed}
              onChange={(event) => {
                const restrictionsSatisfied = event.currentTarget.checked;
                setReview((current) => ({ ...current, restrictionsSatisfied }));
              }}
            />
            <span>
              Confirmei que os usos selecionados satisfazem todas as restrições verificadas.
            </span>
          </label>

          <div className="max-w-xs space-y-2">
            <Label htmlFor="rights-valid-until">Validade da decisão</Label>
            <Input
              id="rights-valid-until"
              type="date"
              value={review.validUntil}
              onChange={(event) => {
                const validUntil = event.currentTarget.value;
                setReview((current) => ({ ...current, validUntil }));
              }}
              required={hasContentUse}
            />
          </div>

          <Button type="submit" disabled={busy !== null}>
            {busy === "save" ? (
              <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Registrar nova revisão
          </Button>
        </form>
      ) : null}
    </section>
  );
}

type MethodDraftEvidenceMetadata = {
  evidenceId: string;
  sourceId: string;
  title: string;
  url: string;
  contentKind: "source_page_extract";
};
type MethodDraftBriefOptions = {
  businessType: string;
  pains: Array<{ index: number; title: string; domain: string; urgency: string }>;
};
type MethodDraftGenerationResult = {
  draft: MethodDraftOutput;
  modelId: string;
  promptVersion: string;
  evidence: MethodDraftEvidenceMetadata[];
  evidenceStats: { found: number; eligible: number; unreadable: number };
  persisted: boolean;
  draftId: string | null;
  persistenceUnavailable: boolean;
  persistenceFailed: boolean;
};

type MethodDraftPanelProps = {
  briefId: string;
  briefOptions: MethodDraftBriefOptions | null;
  painIndex: number | null;
  result: MethodDraftGenerationResult | null;
  busy: "brief" | "generate" | null;
  notice: string;
  onLoadBrief: () => void;
  onPainChange: (painIndex: number) => void;
  onGenerate: () => void;
};

function MethodDraftPanel({
  briefId,
  briefOptions,
  painIndex,
  result,
  busy,
  notice,
  onLoadBrief,
  onPainChange,
  onGenerate,
}: MethodDraftPanelProps) {
  const evidenceTitle = (id: string) =>
    result?.evidence.find((item) => item.evidenceId === id)?.title ?? "Evidência desconhecida";

  return (
    <section
      className="mt-8 space-y-5 border border-border p-5 sm:p-7"
      aria-labelledby="method-draft-title"
    >
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Área interna · owner ativo
        </p>
        <h2 id="method-draft-title" className="mt-2 text-xl font-semibold">
          Gerar rascunho metodológico
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A ação de pesquisa acima continua automaticamente com esta síntese para a dor selecionada.
          O servidor consulta o catálogo privado, revalida os direitos e extrai apenas texto
          autorizado. Metadados OpenAlex não são enviados ao modelo. Briefing e consultas privadas
          não são enviados aos provedores externos. O rascunho exige revisão humana.
        </p>
      </div>
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <p className="min-w-0 flex-1 break-all text-sm text-muted-foreground">
            Briefing vinculado: {briefId.trim() || "informe o UUID no formulário de pesquisa acima"}
          </p>
          <Button type="button" variant="outline" disabled={busy !== null} onClick={onLoadBrief}>
            {busy === "brief" ? (
              <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Carregar briefing
          </Button>
        </div>
      </div>
      {briefOptions ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tipo de negócio:{" "}
            <strong className="text-foreground">
              {briefOptions.businessType || "Não informado"}
            </strong>
          </p>
          {briefOptions.pains.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="method-draft-pain">Dor a resolver</Label>
              <select
                id="method-draft-pain"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={painIndex ?? ""}
                onChange={(event) => onPainChange(Number(event.currentTarget.value))}
              >
                {briefOptions.pains.map((pain) => (
                  <option key={pain.index} value={pain.index}>
                    {pain.title} · {pain.domain} · {pain.urgency}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <Button
            type="button"
            disabled={busy !== null || briefOptions.pains.length === 0 || painIndex === null}
            onClick={onGenerate}
          >
            {busy === "generate" ? (
              <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" />
            ) : (
              <BookOpenCheck className="mr-2 size-4" aria-hidden="true" />
            )}
            {busy === "generate"
              ? "Pesquisando fontes autorizadas e analisando…"
              : "Pesquisar e gerar rascunho metodológico"}
          </Button>
        </div>
      ) : null}
      {notice ? (
        <p className="text-sm leading-relaxed text-muted-foreground" role="status">
          {notice}
        </p>
      ) : null}
      {result ? (
        <article
          className="space-y-5 border-t border-border pt-5"
          aria-label="Rascunho metodológico gerado"
        >
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-100/80">
              Rascunho · revisão humana obrigatória · não aprovado
            </p>
            <h3 className="mt-2 text-2xl font-semibold">{result.draft.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {result.draft.executiveRationale}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Modelo: {result.modelId} · Prompt: {result.promptVersion}
            </p>
          </div>
          <section className="space-y-3">
            <h4 className="font-semibold">Achados e evidências</h4>
            {result.draft.evidenceFindings.map((finding, index) => (
              <div
                key={`${index}:${finding.finding}`}
                className="border-l border-border pl-3 text-sm"
              >
                <p>{finding.finding}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Confiança: {finding.confidence} ·{" "}
                  {finding.evidenceIds.map(evidenceTitle).join("; ")}
                </p>
              </div>
            ))}
          </section>
          <section className="space-y-3">
            <h4 className="font-semibold">Etapas do método</h4>
            {result.draft.methodSteps.map((step) => (
              <div key={step.order} className="border border-border p-3">
                <h5 className="font-medium">
                  {step.order}. {step.name}
                </h5>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.action}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Responsável: {step.ownerRole} · Duração: {step.duration}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Saídas: {step.outputs.join(", ")} · Evidências:{" "}
                  {step.evidenceIds.map(evidenceTitle).join("; ")}
                </p>
              </div>
            ))}
          </section>
          <section className="space-y-2">
            <h4 className="font-semibold">Indicadores</h4>
            {result.draft.measures.map((measure) => (
              <div key={measure.metric} className="text-sm">
                <strong>{measure.metric}</strong>: {measure.definition} Cadência: {measure.cadence}.{" "}
                {measure.targetSetting}{" "}
                <span className="text-xs text-muted-foreground">
                  · {measure.evidenceIds.map(evidenceTitle).join("; ")}
                </span>
              </div>
            ))}
          </section>
          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="font-semibold">Riscos e mitigação</h4>
              {result.draft.risks.map((risk, index) => (
                <p key={index} className="mt-2 text-sm">
                  <strong>{risk.risk}</strong> — {risk.mitigation}
                </p>
              ))}
            </div>
            <div>
              <h4 className="font-semibold">Limitações</h4>
              {result.draft.limitations.map((item, index) => (
                <p key={index} className="mt-2 text-sm text-muted-foreground">
                  {item}
                </p>
              ))}
            </div>
          </section>
          <section>
            <h4 className="font-semibold">Perguntas em aberto</h4>
            {result.draft.openQuestions.map((item, index) => (
              <p key={index} className="mt-2 text-sm text-muted-foreground">
                {item}
              </p>
            ))}
          </section>
          <section>
            <h4 className="font-semibold">Adaptação ao negócio</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {result.draft.adaptationNotes}
            </p>
          </section>
          <section className="border-t border-border pt-3">
            <h4 className="font-semibold">
              Fontes internas citadas · texto extraído, não obra integral
            </h4>
            {result.evidence.map((item) => (
              <p key={item.evidenceId} className="mt-2 break-all text-xs text-muted-foreground">
                {item.title} ·{" "}
                <a href={item.url} target="_blank" rel="noreferrer" className="underline">
                  {item.url}
                </a>{" "}
                · Extração automática · ID: {item.evidenceId}
              </p>
            ))}
          </section>
          <ClientSolutionReleasePanel
            briefId={briefId}
            draftId={result.draftId}
            draft={result.draft}
            persisted={result.persisted}
          />
        </article>
      ) : null}
    </section>
  );
}

export function OpenAlexDiscoveryPage({ initialBriefId = "" }: { initialBriefId?: string }) {
  const access = useOpenAlexOwnerAccess();
  const [draftState, setDraftState] = useState(() => emptyDraft(0, initialBriefId));
  const [searchState, setSearchState] = useState(() => emptySearch(0));
  const [externalSourceState, setExternalSourceState] = useState(() => emptyExternalSourceState(0));
  const [draftBriefOptions, setDraftBriefOptions] = useState<MethodDraftBriefOptions | null>(null);
  const [draftPainIndex, setDraftPainIndex] = useState<number | null>(null);
  const [draftResult, setDraftResult] = useState<MethodDraftGenerationResult | null>(null);
  const [draftBusy, setDraftBusy] = useState<"brief" | "generate" | null>(null);
  const [draftNotice, setDraftNotice] = useState("");
  const [clock, setClock] = useState(() => Date.now());
  const currentUserId = useRef<string | null>(null);
  const draft =
    draftState.version === access.version ? draftState : emptyDraft(access.version, initialBriefId);
  const search = searchState.version === access.version ? searchState : emptySearch(access.version);
  const externalSource =
    externalSourceState.version === access.version
      ? externalSourceState
      : emptyExternalSourceState(access.version);
  const retryWaitSeconds =
    search.retryAvailableAt === null
      ? 0
      : Math.max(0, Math.ceil((search.retryAvailableAt - clock) / 1000));
  const retryBlocked =
    search.failureCode === "provider_not_configured" ||
    search.failureCode === "budget_exhausted" ||
    search.failureCode === "rate_limit_unknown" ||
    search.failureCode === "plan_required";

  useEffect(() => {
    if (search.retryAvailableAt === null) return;
    const timer = window.setInterval(() => setClock(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [search.retryAvailableAt]);

  useEffect(() => {
    currentUserId.current = access.userId;
    setDraftState(emptyDraft(access.version, initialBriefId));
    setSearchState(emptySearch(access.version));
    setExternalSourceState(emptyExternalSourceState(access.version));
    setDraftBriefOptions(null);
    setDraftPainIndex(null);
    setDraftResult(null);
    setDraftBusy(null);
    setDraftNotice("");
  }, [access.userId, access.version, initialBriefId]);

  function updateDraft(patch: Partial<Omit<DraftState, "version">>) {
    setDraftState((current) => ({
      ...(current.version === access.version
        ? current
        : emptyDraft(access.version, initialBriefId)),
      ...patch,
      version: access.version,
    }));
  }

  async function performSearch(
    researchRunId: string,
    topicQuery: string,
    ownerId: string,
    ownerVersion: number,
  ): Promise<boolean> {
    setSearchState((current) => {
      const base = current.version === ownerVersion ? current : emptySearch(ownerVersion);
      return {
        ...base,
        page: null,
        queryStatus: "searching",
        notice: "",
        failureCode: null,
        retryAvailableAt: null,
        version: ownerVersion,
      };
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
      if (currentUserId.current !== ownerId) return false;
      setSearchState((current) => {
        if (current.version !== ownerVersion) return current;
        return {
          ...current,
          page: result,
          queryStatus: "completed",
          notice: "Resultados bibliográficos temporários; nada foi salvo como fonte curada.",
          failureCode: null,
          retryAvailableAt: null,
        };
      });
      return true;
    } catch (error) {
      if (currentUserId.current !== ownerId) return false;
      setSearchState((current) => {
        if (current.version !== ownerVersion) return current;
        const failureCode = getOpenAlexFailureCode(error);
        const retryAfterSeconds = getOpenAlexRetryAfterSeconds(error);
        const cooldownSeconds = failureCode === "rate_limited" ? (retryAfterSeconds ?? 2) : null;
        return {
          ...current,
          queryStatus: "failed",
          notice: getOpenAlexFailureNotice(error),
          failureCode,
          retryAvailableAt: cooldownSeconds === null ? null : Date.now() + cooldownSeconds * 1000,
        };
      });
      return false;
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
    setExternalSourceState(emptyExternalSourceState(ownerVersion));
    setDraftResult(null);
    setDraftNotice("");

    try {
      const options = await getMethodDraftBriefOptions({ data: { briefId } });
      if (currentUserId.current !== ownerId) return;
      const firstPain = options.pains[0];
      setDraftBriefOptions(options);
      setDraftPainIndex(firstPain?.index ?? null);
      if (!firstPain) {
        setDraftNotice("O briefing não tem dores disponíveis para gerar um método.");
        return;
      }
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
      const searchCompleted = await performSearch(run.id, topicQuery, ownerId, ownerVersion);
      if (searchCompleted && currentUserId.current === ownerId) {
        setDraftBusy("generate");
        setDraftNotice(
          "Metadados recebidos. Analisando agora o conteúdo autorizado do catálogo MOW…",
        );
        try {
          const generated = await generateMethodDraftForBrief({
            data: { briefId, painIndex: firstPain.index },
          });
          if (currentUserId.current !== ownerId) return;
          setDraftResult(generated);
          setDraftNotice(
            generated.persisted
              ? `Rascunho gerado com ${generated.evidenceStats.found} extrato(s) autorizado(s) e salvo para revisão interna; ainda não aprovado.`
              : generated.persistenceFailed
                ? "O rascunho foi gerado nesta sessão, mas houve falha ao salvá-lo para revisão interna."
                : "O rascunho foi gerado nesta sessão, mas a persistência ainda não está instalada. Não foi aprovado.",
          );
        } catch (error) {
          if (currentUserId.current === ownerId) setDraftNotice(getMethodDraftFailureNotice(error));
        } finally {
          if (currentUserId.current === ownerId) setDraftBusy(null);
        }
      }
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

  async function handleSearchConfiguredSources() {
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
    setExternalSourceState({ ...emptyExternalSourceState(ownerVersion), busy: true });
    try {
      const page = await searchConfiguredSourcesForRun({
        data: {
          researchRunId: run.id,
          query: run.question,
          confirmTopicOnly: true,
          perPage: 10,
        },
      });
      if (currentUserId.current !== ownerId) return;
      const notice =
        page.state === "not_configured"
          ? "As fontes externas ainda não foram configuradas no servidor privado da MOW."
          : page.state === "unavailable"
            ? "As fontes externas configuradas não responderam; nenhum resultado foi salvo."
            : page.state === "partial"
              ? "A busca terminou parcialmente; verifique quais fontes responderam."
              : page.results.length === 0
                ? "Nenhum registro foi retornado pelas fontes externas consultadas."
                : "Resultados externos temporários; nada foi salvo como fonte curada.";
      setExternalSourceState({ version: ownerVersion, page, busy: false, notice });
    } catch {
      if (currentUserId.current !== ownerId) return;
      setExternalSourceState({
        version: ownerVersion,
        page: null,
        busy: false,
        notice: "Não foi possível consultar as fontes externas autorizadas.",
      });
    } finally {
      if (currentUserId.current === ownerId) {
        setExternalSourceState((current) =>
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
            {search.busy
              ? "Pesquisando e gerando…"
              : "Iniciar pesquisa bibliográfica e gerar rascunho"}
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
              <p>Estado da execução: em andamento.</p>
              <p>
                Estado da consulta:{" "}
                {search.queryStatus === "searching"
                  ? "em andamento"
                  : search.queryStatus === "completed"
                    ? "concluída"
                    : search.queryStatus === "failed"
                      ? "não concluída"
                      : "aguardando"}
                .
              </p>
              <p>Se necessário, repita a consulta sem criar uma nova execução.</p>
              <Button
                type="button"
                variant="outline"
                disabled={
                  search.busy ||
                  !draft.confirmTopicOnly ||
                  !draft.query.trim() ||
                  retryBlocked ||
                  retryWaitSeconds > 0
                }
                onClick={handleRetrySearch}
              >
                <Search className="mr-2 size-4" aria-hidden="true" />
                {retryBlocked
                  ? "Aguardando ação da equipe MOW"
                  : retryWaitSeconds > 0
                    ? `Tentar novamente em ${retryWaitSeconds}s`
                    : "Tentar a busca novamente"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="mt-2"
                disabled={search.busy || externalSource.busy || !draft.confirmTopicOnly}
                onClick={handleSearchConfiguredSources}
              >
                {externalSource.busy ? (
                  <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Search className="mr-2 size-4" aria-hidden="true" />
                )}
                {externalSource.busy
                  ? "Consultando outras fontes…"
                  : "Consultar fontes externas autorizadas"}
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

      {search.currentRun && (externalSource.page || externalSource.notice) ? (
        <section
          className="mt-8 space-y-4"
          aria-label="Resultados de fontes externas"
          aria-live="polite"
        >
          <div>
            <h2 className="text-xl font-semibold">Fontes externas aprovadas</h2>
            {externalSource.notice ? (
              <p className="mt-2 text-sm text-muted-foreground" role="status">
                {externalSource.notice}
              </p>
            ) : null}
          </div>
          {externalSource.page?.providers.map((provider) => (
            <p key={provider.providerId} className="text-xs text-muted-foreground">
              {provider.providerLabel}:{" "}
              {provider.status === "available" ? "consultada" : "indisponível"}
            </p>
          ))}
          {externalSource.page?.results.map((candidate) => (
            <article
              key={`${candidate.providerId}:${candidate.providerRecordId}`}
              className="border border-border p-5 sm:p-6"
            >
              <h3 className="text-base font-semibold leading-relaxed text-foreground">
                {candidate.title}
              </h3>
              <dl className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <div>
                  <dt className="inline font-medium text-foreground/85">Fonte: </dt>
                  <dd className="inline">{candidate.providerLabel}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-foreground/85">Autores: </dt>
                  <dd className="inline">
                    {candidate.authors.length ? candidate.authors.join(", ") : "Não informado"}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-medium text-foreground/85">Ano: </dt>
                  <dd className="inline">{candidate.publicationYear ?? "Não informado"}</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                <a
                  href={candidate.providerRecordUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline underline-offset-4"
                >
                  Registro na fonte
                </a>
                <span className="text-amber-100/80">Direitos do conteúdo: não avaliados</span>
              </div>
            </article>
          ))}
        </section>
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

      <SourceRightsReviewPanel key={`${access.userId}:${access.version}`} />
      <SourceCatalogImportPanel key={`catalog:${access.userId}:${access.version}`} />
      <MethodDraftPanel
        key={`${access.userId}:${access.version}:${initialBriefId}`}
        briefId={draft.sourceBriefId}
        briefOptions={draftBriefOptions}
        painIndex={draftPainIndex}
        result={draftResult}
        busy={draftBusy}
        notice={draftNotice}
        onLoadBrief={async () => {
          if (!z.string().uuid().safeParse(draft.sourceBriefId).success || draftBusy) return;
          setDraftBusy("brief");
          setDraftNotice("");
          try {
            const options = await getMethodDraftBriefOptions({
              data: { briefId: draft.sourceBriefId },
            });
            setDraftBriefOptions(options);
            setDraftPainIndex(options.pains[0]?.index ?? null);
            setDraftNotice(
              options.pains.length
                ? `${options.pains.length} dor(es) carregada(s) do briefing.`
                : "O briefing não tem dores disponíveis.",
            );
          } catch (error) {
            setDraftNotice(getMethodDraftFailureNotice(error));
          } finally {
            setDraftBusy(null);
          }
        }}
        onPainChange={(painIndex) => {
          setDraftPainIndex(painIndex);
          setDraftResult(null);
        }}
        onGenerate={async () => {
          if (!draftPainIndex && draftPainIndex !== 0) return;
          setDraftBusy("generate");
          setDraftNotice("");
          try {
            const generated = await generateMethodDraftForBrief({
              data: { briefId: draft.sourceBriefId, painIndex: draftPainIndex },
            });
            setDraftResult(generated);
            setDraftNotice(
              generated.persisted
                ? "Rascunho salvo para revisão interna; ainda não aprovado."
                : generated.persistenceFailed
                  ? "Rascunho gerado nesta sessão, mas a persistência falhou."
                  : "Rascunho gerado nesta sessão; persistência indisponível e não aprovado.",
            );
          } catch (error) {
            setDraftNotice(getMethodDraftFailureNotice(error));
          } finally {
            setDraftBusy(null);
          }
        }}
      />

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

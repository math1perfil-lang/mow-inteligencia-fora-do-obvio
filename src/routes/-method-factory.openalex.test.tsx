import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  access: {
    userId: null as string | null,
    status: "checking" as "checking" | "allowed" | "denied" | "no_session" | "unconfigured",
    version: 1,
  },
  start: vi.fn(),
  search: vi.fn(),
  searchSources: vi.fn(),
  searchRights: vi.fn(),
  recordRights: vi.fn(),
  loadDraftBrief: vi.fn(),
  generateDraft: vi.fn(),
}));

vi.mock("@/lib/mow-gki/use-openalex-owner-access", () => ({
  useOpenAlexOwnerAccess: () => mocks.access,
}));

vi.mock("@/lib/mow-gki/openalex.functions", () => ({
  startOpenAlexResearchRun: mocks.start,
  searchOpenAlexForRun: mocks.search,
  searchConfiguredSourcesForRun: mocks.searchSources,
  searchSourceRightsForReview: mocks.searchRights,
  recordSourceRightsReview: mocks.recordRights,
  getMethodDraftBriefOptions: mocks.loadDraftBrief,
  generateMethodDraftForBrief: mocks.generateDraft,
}));

import { OpenAlexDiscoveryPage } from "./method-factory.openalex";
import { OPENALEX_FAILURE_TOKEN_PREFIX } from "@/lib/mow-gki/openalex-error-messages";

const BRIEF_ID = "00000000-0000-4000-8000-000000000001";
const RUN_ID = "00000000-0000-4000-8000-000000000002";
const SOURCE_ID = "00000000-0000-4000-8000-000000000003";
const REVIEW_ID = "00000000-0000-4000-8000-000000000004";
const RIGHTS_SOURCE_ROW = {
  source_id: SOURCE_ID,
  title: "Synthetic private catalog item",
  source_type: "article",
  canonical_url: "https://example.org/source",
  catalog_rights_status: "pending",
  rights_review_id: null,
  decision_status: null,
  permitted_uses: null,
  rights_basis: null,
  rights_evidence_url: null,
  restrictions: null,
  reviewed_by: null,
  reviewed_at: null,
  valid_until: null,
  restrictions_reviewed: null,
  restrictions_satisfied: null,
};
const SAMPLE_PAGE = {
  results: [
    {
      provider: "openalex",
      providerRecordId: "W1234567890",
      providerRecordUrl: "https://openalex.org/works/W1234567890",
      metadataLicense: "CC0",
      title: "Synthetic title-only result",
      publicationType: "article",
      doi: "https://doi.org/10.1234/example",
      publicationYear: 2024,
      language: "en",
      authors: ["Example Author"],
      primaryLocation: null,
      bestOpenAccessLocation: null,
      openAccessSignal: { isOpenAccess: null, status: null, url: null },
      contentRightsAssessment: "unassessed",
    },
  ],
  nextCursor: null,
  resultCount: 1,
};
const SAMPLE_EXTERNAL_PAGE = {
  state: "complete",
  providers: [
    {
      providerId: "source-test-a",
      providerLabel: "Fonte simulada A",
      status: "available",
      resultCount: 1,
      failureCode: null,
    },
  ],
  results: [
    {
      providerId: "source-test-a",
      providerLabel: "Fonte simulada A",
      providerRecordId: "record-1",
      providerRecordUrl: "https://provider.example/record-1",
      metadataLicense: null,
      title: "Synthetic external result",
      publicationType: "article",
      doi: null,
      publicationYear: 2024,
      language: "en",
      authors: ["Example Author"],
      contentRightsAssessment: "unassessed",
    },
  ],
};

beforeEach(() => {
  mocks.access.userId = "owner-a";
  mocks.access.status = "allowed";
  mocks.access.version = 1;
  mocks.start.mockResolvedValue({
    id: RUN_ID,
    question: "retenção de clientes",
    scope: "",
    created_at: "2026-11-23T15:00:00.000Z",
  });
  mocks.search.mockResolvedValue(SAMPLE_PAGE);
  mocks.searchSources.mockResolvedValue(SAMPLE_EXTERNAL_PAGE);
  mocks.searchRights.mockResolvedValue([RIGHTS_SOURCE_ROW]);
  mocks.loadDraftBrief.mockResolvedValue({
    businessType: "Serviços profissionais, incluindo jurídico",
    pains: [
      { index: 0, title: "Atraso na triagem", domain: "Operações e processos", urgency: "Alta" },
    ],
  });
  mocks.generateDraft.mockResolvedValue({
    draft: {
      title: "Triagem metodológica sintética",
      executiveRationale: "Rascunho sintético para validar o fluxo de geração e revisão interna.",
      evidenceFindings: [
        {
          finding: "A evidência sintética aponta necessidade de priorização explícita.",
          evidenceIds: ["00000000-0000-4000-8000-000000000099"],
          confidence: "medium",
        },
      ],
      methodSteps: [
        {
          order: 1,
          name: "Definir critérios",
          action: "Definir critérios explícitos de classificação e prioridade.",
          ownerRole: "Coordenação",
          duration: "1 semana",
          inputs: ["Solicitações"],
          outputs: ["Critérios"],
          evidenceIds: ["00000000-0000-4000-8000-000000000099"],
        },
        {
          order: 2,
          name: "Testar processo",
          action: "Executar teste controlado do fluxo em pequena amostra.",
          ownerRole: "Equipe",
          duration: "2 semanas",
          inputs: ["Critérios"],
          outputs: ["Resultados"],
          evidenceIds: ["00000000-0000-4000-8000-000000000099"],
        },
        {
          order: 3,
          name: "Revisar",
          action: "Comparar indicadores e revisar critérios com responsáveis.",
          ownerRole: "Liderança",
          duration: "1 semana",
          inputs: ["Resultados"],
          outputs: ["Ajustes"],
          evidenceIds: ["00000000-0000-4000-8000-000000000099"],
        },
      ],
      measures: [
        {
          metric: "Tempo de triagem",
          definition: "Tempo até a classificação inicial.",
          cadence: "Semanal",
          targetSetting: "Definir após medir uma linha de base.",
          evidenceIds: ["00000000-0000-4000-8000-000000000099"],
        },
      ],
      risks: [
        {
          risk: "Critérios inconsistentes.",
          mitigation: "Revisar critérios com responsáveis durante o piloto.",
        },
      ],
      limitations: ["A fixture é sintética e não representa evidência real."],
      openQuestions: ["Quais categorias são prioritárias?"],
      adaptationNotes:
        "A proposta considera serviços profissionais e não pressupõe negócio de tecnologia.",
    },
    modelId: "fixture-model",
    promptVersion: "fixture/v1",
    evidence: [
      {
        evidenceId: "00000000-0000-4000-8000-000000000099",
        sourceId: SOURCE_ID,
        title: "Synthetic private catalog item",
        url: "https://example.org/source",
        contentKind: "source_page_extract",
      },
    ],
    evidenceStats: { found: 1, eligible: 1, unreadable: 0 },
    persisted: false,
    draftId: null,
    persistenceUnavailable: true,
  });
  mocks.recordRights.mockResolvedValue({
    rights_review_id: REVIEW_ID,
    source_id: SOURCE_ID,
    decision_version: 1,
    decision_status: "open_license_verified",
    permitted_uses: ["catalog_metadata", "link_and_citation", "internal_content_analysis"],
    reviewed_by: "00000000-0000-4000-8000-000000000005",
    reviewed_at: "2026-11-24T23:12:00.000Z",
    valid_until: "2099-12-31",
    restrictions_reviewed: true,
    restrictions_satisfied: true,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function beginShortTopicRun() {
  mocks.start.mockResolvedValueOnce({
    id: RUN_ID,
    question: "short topic",
    scope: "",
    created_at: "2026-11-23T15:00:00.000Z",
  });
  render(<OpenAlexDiscoveryPage initialBriefId={BRIEF_ID} />);
  fireEvent.change(screen.getByLabelText(/Termos temáticos curtos/), {
    target: { value: "short topic" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(
    screen.getByRole("button", { name: /Iniciar pesquisa bibliográfica e gerar rascunho/ }),
  );
  expect(await screen.findByText("Synthetic title-only result")).toBeInTheDocument();
}

describe("OpenAlex internal discovery page", () => {
  it("does not show GKI controls or data when the owner-only gate denies access", () => {
    mocks.access.status = "denied";

    render(<OpenAlexDiscoveryPage />);

    expect(screen.getByRole("heading", { name: "Acesso indisponível" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Somente owner ativo");
    expect(screen.queryByLabelText(/UUID do briefing/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/localizar no catálogo/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(mocks.start).not.toHaveBeenCalled();
    expect(mocks.search).not.toHaveBeenCalled();
    expect(mocks.searchRights).not.toHaveBeenCalled();
  });

  it("starts a brief-bound run and displays only temporary bibliographic metadata", async () => {
    render(<OpenAlexDiscoveryPage initialBriefId={BRIEF_ID} />);

    expect(screen.getByLabelText("UUID do briefing (status em revisão)")).toHaveValue(BRIEF_ID);
    fireEvent.change(screen.getByLabelText(/Termos temáticos curtos/), {
      target: { value: "retenção de clientes" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: /Iniciar pesquisa bibliográfica e gerar rascunho/ }),
    );

    expect(await screen.findByText("Synthetic title-only result")).toBeInTheDocument();
    expect(screen.getByText("Estado da consulta: concluída.")).toBeInTheDocument();
    expect(mocks.start).toHaveBeenCalledWith({
      data: {
        sourceBriefId: BRIEF_ID,
        question: "retenção de clientes",
        confirmTopicOnly: true,
      },
    });
    expect(mocks.search).toHaveBeenCalledWith({
      data: {
        researchRunId: RUN_ID,
        query: "retenção de clientes",
        confirmTopicOnly: true,
        perPage: 10,
      },
    });
    expect(screen.getByText("Direitos do conteúdo: não avaliados")).toBeInTheDocument();
    expect(screen.getByText(/mantidos apenas na memória desta página/)).toBeInTheDocument();
    expect(screen.queryByText(/^Abstract:/i)).not.toBeInTheDocument();
    expect(document.querySelector('a[href$=".pdf"]')).toBeNull();

    fireEvent.change(screen.getByLabelText(/Termos temáticos curtos/), {
      target: { value: "outro tópico" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Tentar a busca novamente/ }));
    await waitFor(() => expect(mocks.search).toHaveBeenCalledTimes(2));
    expect(mocks.search).toHaveBeenLastCalledWith({
      data: {
        researchRunId: RUN_ID,
        query: "retenção de clientes",
        confirmTopicOnly: true,
        perPage: 10,
      },
    });
  });

  it("consults separately configured sources for the same in-progress run", async () => {
    await beginShortTopicRun();
    fireEvent.click(screen.getByRole("button", { name: /Consultar fontes externas autorizadas/ }));

    expect(await screen.findByText("Synthetic external result")).toBeInTheDocument();
    expect(screen.getByText("Fonte simulada A")).toBeInTheDocument();
    expect(screen.getAllByText("Direitos do conteúdo: não avaliados")).toHaveLength(2);
    expect(mocks.searchSources).toHaveBeenCalledWith({
      data: {
        researchRunId: RUN_ID,
        query: "short topic",
        confirmTopicOnly: true,
        perPage: 10,
      },
    });
    expect(screen.queryByText(/^(?:Abstract|FullText):/i)).not.toBeInTheDocument();
  });

  it("searches only the private catalog and records an item-specific rights review as an owner", async () => {
    render(<OpenAlexDiscoveryPage />);
    fireEvent.change(screen.getByLabelText(/Título ou URL canônica/), {
      target: { value: "Synthetic private catalog item" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Buscar no catálogo/ }));

    expect(await screen.findByText("Synthetic private catalog item")).toBeInTheDocument();
    expect(mocks.searchRights).toHaveBeenCalledWith({
      data: { query: "Synthetic private catalog item" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Revisar direitos/ }));
    fireEvent.change(screen.getByLabelText("Decisão humana"), {
      target: { value: "open_license_verified" },
    });
    fireEvent.click(screen.getByLabelText("Analisar conteúdo internamente"));
    fireEvent.change(screen.getByLabelText("Fundamento da decisão"), {
      target: { value: "Synthetic license permits internal analysis." },
    });
    fireEvent.change(screen.getByLabelText("URL HTTPS da licença ou permissão consultada"), {
      target: { value: "https://example.org/license" },
    });
    fireEvent.click(screen.getByLabelText(/Revisei explicitamente as restrições/));
    fireEvent.click(screen.getByLabelText(/Confirmei que os usos selecionados/));
    fireEvent.change(screen.getByLabelText("Validade da decisão"), {
      target: { value: "2099-12-31" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Registrar nova revisão/ }));

    await waitFor(() => expect(mocks.recordRights).toHaveBeenCalledTimes(1));
    expect(mocks.recordRights).toHaveBeenCalledWith({
      data: {
        sourceId: SOURCE_ID,
        decisionStatus: "open_license_verified",
        permittedUses: ["catalog_metadata", "link_and_citation", "internal_content_analysis"],
        rightsBasis: "Synthetic license permits internal analysis.",
        rightsEvidenceUrl: "https://example.org/license",
        restrictions: "",
        restrictionsReviewed: true,
        restrictionsSatisfied: true,
        validUntil: "2099-12-31",
      },
    });
    expect(screen.getByRole("status")).toHaveTextContent(/decisão v1/);
    expect(mocks.search).not.toHaveBeenCalled();
  });

  it("loads a server-bound pain and starts automated catalog retrieval without manual text input", async () => {
    render(<OpenAlexDiscoveryPage initialBriefId={BRIEF_ID} />);

    fireEvent.click(screen.getByRole("button", { name: "Carregar briefing" }));
    expect(await screen.findByText(/1 dor\(es\) carregada/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Conteúdo autorizado a analisar")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Adicionar evidência" })).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Pesquisar e gerar rascunho metodológico" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Triagem metodológica sintética" }),
    ).toBeInTheDocument();
    const generationCall = mocks.generateDraft.mock.calls[0]?.[0];
    expect(generationCall).toEqual({ data: { briefId: BRIEF_ID, painIndex: 0 } });
    expect(mocks.searchRights).not.toHaveBeenCalled();
  });

  it("shows that external sources are not configured without presenting fake results", async () => {
    mocks.searchSources.mockResolvedValueOnce({
      state: "not_configured",
      providers: [],
      results: [],
    });
    await beginShortTopicRun();
    fireEvent.click(screen.getByRole("button", { name: /Consultar fontes externas autorizadas/ }));

    expect(
      await screen.findByText(
        "As fontes externas ainda não foram configuradas no servidor privado da MOW.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Synthetic external result")).not.toBeInTheDocument();
  });

  it("shows partial availability while keeping temporary candidates distinguishable", async () => {
    mocks.searchSources.mockResolvedValueOnce({
      ...SAMPLE_EXTERNAL_PAGE,
      state: "partial",
      providers: [
        ...SAMPLE_EXTERNAL_PAGE.providers,
        {
          providerId: "source-test-b",
          providerLabel: "Fonte simulada B",
          status: "unavailable",
          resultCount: 0,
          failureCode: "upstream_error",
        },
      ],
    });
    await beginShortTopicRun();
    fireEvent.click(screen.getByRole("button", { name: /Consultar fontes externas autorizadas/ }));

    expect(await screen.findByText("Synthetic external result")).toBeInTheDocument();
    expect(
      screen.getByText("A busca terminou parcialmente; verifique quais fontes responderam."),
    ).toBeInTheDocument();
    expect(screen.getByText("Fonte simulada A: consultada")).toBeInTheDocument();
    expect(screen.getByText("Fonte simulada B: indisponível")).toBeInTheDocument();
  });

  it("shows a safe rate-limit notice and enforces the retry cooldown on the same execution", async () => {
    mocks.search.mockRejectedValueOnce(new Error(`${OPENALEX_FAILURE_TOKEN_PREFIX}rate_limited:2`));
    render(<OpenAlexDiscoveryPage initialBriefId={BRIEF_ID} />);

    fireEvent.change(screen.getByLabelText(/Termos temáticos curtos/), {
      target: { value: "retenção de clientes" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: /Iniciar pesquisa bibliográfica e gerar rascunho/ }),
    );

    expect(await screen.findByText(/pausa de 2 segundos/)).toBeInTheDocument();
    expect(screen.getByText("Estado da consulta: não concluída.")).toBeInTheDocument();
    expect(screen.getByLabelText("Execução atual")).toHaveTextContent(RUN_ID);
    expect(screen.queryByText(/lease liberado após a consulta/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tentar novamente em \d+s/ })).toBeDisabled();
    expect(mocks.start).toHaveBeenCalledTimes(1);
    expect(mocks.search).toHaveBeenCalledTimes(1);
  });

  it("blocks retry when OpenAlex configuration needs action by the MOW team", async () => {
    mocks.search.mockRejectedValueOnce(
      new Error(`${OPENALEX_FAILURE_TOKEN_PREFIX}provider_not_configured`),
    );
    render(<OpenAlexDiscoveryPage initialBriefId={BRIEF_ID} />);

    fireEvent.change(screen.getByLabelText(/Termos temáticos curtos/), {
      target: { value: "retenção de clientes" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: /Iniciar pesquisa bibliográfica e gerar rascunho/ }),
    );

    expect(
      await screen.findByText(/chave OpenAlex não está configurada no servidor/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Aguardando ação da equipe MOW/ })).toBeDisabled();
    expect(mocks.start).toHaveBeenCalledTimes(1);
    expect(mocks.search).toHaveBeenCalledTimes(1);
  });

  it("clears the previous account's query, run and results on session change", async () => {
    const view = render(<OpenAlexDiscoveryPage />);
    fireEvent.change(screen.getByLabelText("UUID do briefing (status em revisão)"), {
      target: { value: BRIEF_ID },
    });
    fireEvent.change(screen.getByLabelText(/Termos temáticos curtos/), {
      target: { value: "retenção de clientes" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: /Iniciar pesquisa bibliográfica e gerar rascunho/ }),
    );
    expect(await screen.findByText("Synthetic title-only result")).toBeInTheDocument();

    mocks.access.userId = "owner-b";
    mocks.access.version = 2;
    view.rerender(<OpenAlexDiscoveryPage />);

    await waitFor(() => {
      expect(screen.queryByText("Synthetic title-only result")).not.toBeInTheDocument();
      expect(screen.getByLabelText("UUID do briefing (status em revisão)")).toHaveValue("");
      expect(screen.getByLabelText(/Termos temáticos curtos/)).toHaveValue("");
    });
    expect(screen.queryByText(RUN_ID)).not.toBeInTheDocument();
  });
});

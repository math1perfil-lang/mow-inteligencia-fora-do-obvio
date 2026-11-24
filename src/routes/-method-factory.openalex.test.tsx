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
}));

vi.mock("@/lib/mow-gki/use-openalex-owner-access", () => ({
  useOpenAlexOwnerAccess: () => mocks.access,
}));

vi.mock("@/lib/mow-gki/openalex.functions", () => ({
  startOpenAlexResearchRun: mocks.start,
  searchOpenAlexForRun: mocks.search,
}));

import { OpenAlexDiscoveryPage } from "./method-factory.openalex";
import { OPENALEX_FAILURE_TOKEN_PREFIX } from "@/lib/mow-gki/openalex-error-messages";

const BRIEF_ID = "00000000-0000-4000-8000-000000000001";
const RUN_ID = "00000000-0000-4000-8000-000000000002";
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
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("OpenAlex internal discovery page", () => {
  it("does not show GKI controls or data when the owner-only gate denies access", () => {
    mocks.access.status = "denied";

    render(<OpenAlexDiscoveryPage />);

    expect(screen.getByRole("heading", { name: "Acesso indisponível" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Somente owner ativo");
    expect(screen.queryByLabelText(/UUID do briefing/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(mocks.start).not.toHaveBeenCalled();
    expect(mocks.search).not.toHaveBeenCalled();
  });

  it("starts a brief-bound run and displays only temporary bibliographic metadata", async () => {
    render(<OpenAlexDiscoveryPage initialBriefId={BRIEF_ID} />);

    expect(screen.getByLabelText(/UUID do briefing/)).toHaveValue(BRIEF_ID);
    fireEvent.change(screen.getByLabelText(/Termos temáticos curtos/), {
      target: { value: "retenção de clientes" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Iniciar pesquisa e buscar metadados/ }));

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

  it("shows a safe rate-limit notice and enforces the retry cooldown on the same execution", async () => {
    mocks.search.mockRejectedValueOnce(new Error(`${OPENALEX_FAILURE_TOKEN_PREFIX}rate_limited:2`));
    render(<OpenAlexDiscoveryPage initialBriefId={BRIEF_ID} />);

    fireEvent.change(screen.getByLabelText(/Termos temáticos curtos/), {
      target: { value: "retenção de clientes" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Iniciar pesquisa e buscar metadados/ }));

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
    fireEvent.click(screen.getByRole("button", { name: /Iniciar pesquisa e buscar metadados/ }));

    expect(
      await screen.findByText(/chave OpenAlex não está configurada no servidor/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Aguardando ação da equipe MOW/ })).toBeDisabled();
    expect(mocks.start).toHaveBeenCalledTimes(1);
    expect(mocks.search).toHaveBeenCalledTimes(1);
  });

  it("clears the previous account's query, run and results on session change", async () => {
    const view = render(<OpenAlexDiscoveryPage />);
    fireEvent.change(screen.getByLabelText(/UUID do briefing/), {
      target: { value: BRIEF_ID },
    });
    fireEvent.change(screen.getByLabelText(/Termos temáticos curtos/), {
      target: { value: "retenção de clientes" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Iniciar pesquisa e buscar metadados/ }));
    expect(await screen.findByText("Synthetic title-only result")).toBeInTheDocument();

    mocks.access.userId = "owner-b";
    mocks.access.version = 2;
    view.rerender(<OpenAlexDiscoveryPage />);

    await waitFor(() => {
      expect(screen.queryByText("Synthetic title-only result")).not.toBeInTheDocument();
      expect(screen.getByLabelText(/UUID do briefing/)).toHaveValue("");
      expect(screen.getByLabelText(/Termos temáticos curtos/)).toHaveValue("");
    });
    expect(screen.queryByText(RUN_ID)).not.toBeInTheDocument();
  });
});

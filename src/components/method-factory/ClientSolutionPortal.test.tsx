import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSupabase: vi.fn(),
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    exchangeCodeForSession: vi.fn(),
  },
  acceptClientSolutionInvite: vi.fn(),
  listClientSolutionProgress: vi.fn(),
  listClientSolutions: vi.fn(),
  updateClientSolutionProgress: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({ getSupabase: mocks.getSupabase }));
vi.mock("@/lib/mow-gki/client-solution.functions", () => ({
  acceptClientSolutionInvite: mocks.acceptClientSolutionInvite,
  listClientSolutionProgress: mocks.listClientSolutionProgress,
  listClientSolutions: mocks.listClientSolutions,
  updateClientSolutionProgress: mocks.updateClientSolutionProgress,
}));

import { ClientSolutionPortal } from "./ClientSolutionPortal";

type TestSession = {
  access_token: string;
  user: { id: string; email: string };
};

const sessionA: TestSession = {
  access_token: "synthetic-token-a",
  user: { id: "account-a", email: "a@example.invalid" },
};
const sessionB: TestSession = {
  access_token: "synthetic-token-b",
  user: { id: "account-b", email: "b@example.invalid" },
};

const solutionA = {
  releaseId: "33333333-3333-4333-8333-333333333333",
  version: 1,
  releasedAt: "2026-11-25T00:00:00.000Z",
  snapshot: {
    title: "Solução privada da conta A",
    objective: "Objetivo sintético de execução para testar o portal individual.",
    methodSteps: [1, 2, 3].map((order) => ({
      id: `step-${order}`,
      order,
      name: `Etapa ${order}`,
      action: `Ação detalhada para testar a etapa número ${order}.`,
      ownerRole: "Pessoa responsável",
      duration: "Uma semana",
      inputs: ["Entrada sintética"],
      outputs: ["Saída sintética"],
    })),
    measures: [
      {
        metric: "Indicador sintético",
        definition: "Definição do indicador usado somente no teste.",
        cadence: "Semanal",
        targetSetting: "Definir a linha de base e a meta de teste.",
      },
    ],
  },
};

beforeEach(() => {
  mocks.auth.getSession.mockResolvedValue({ data: { session: null } });
  mocks.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
  mocks.getSupabase.mockReturnValue({ auth: mocks.auth });
  mocks.auth.signInWithPassword.mockResolvedValue({ data: { session: sessionA }, error: null });
  mocks.auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
  mocks.auth.signOut.mockResolvedValue({ error: null });
  mocks.auth.exchangeCodeForSession.mockResolvedValue({ error: null });
  mocks.acceptClientSolutionInvite.mockResolvedValue({ accepted: true });
  mocks.listClientSolutions.mockResolvedValue([]);
  mocks.listClientSolutionProgress.mockResolvedValue([]);
  mocks.updateClientSolutionProgress.mockResolvedValue({ updated: true });
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/method-factory/solution");
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/method-factory/solution");
});

describe("ClientSolutionPortal access boundary", () => {
  it("requires an individual login and accepts a single-use invite through that session", async () => {
    const inviteToken = "a".repeat(64);
    window.history.replaceState({}, "", `/method-factory/solution#${inviteToken}`);
    mocks.auth.signInWithPassword.mockResolvedValue({ data: { session: sessionB }, error: null });

    render(<ClientSolutionPortal />);

    expect(await screen.findByRole("heading", { name: "Acesse sua solução" })).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail da conta convidada")).toBeInTheDocument();
    await waitFor(() => expect(window.location.hash).toBe(""));
    fireEvent.change(screen.getByLabelText("E-mail da conta convidada"), {
      target: { value: sessionB.user.email },
    });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "synthetic-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() =>
      expect(mocks.acceptClientSolutionInvite).toHaveBeenCalledWith({
        data: { token: inviteToken },
      }),
    );
    expect(mocks.listClientSolutions).toHaveBeenCalledWith({ data: {} });
    expect(await screen.findByText(/Convite aceito/)).toBeInTheDocument();
    expect(window.location.href).not.toContain(inviteToken);
  });

  it("clears account A's solution immediately when an auth event switches to account B", async () => {
    let authStateListener: ((event: string, nextSession: TestSession | null) => void) | undefined;
    let resolveAccountB: ((items: (typeof solutionA)[]) => void) | undefined;
    mocks.auth.getSession.mockResolvedValue({ data: { session: sessionA } });
    mocks.auth.onAuthStateChange.mockImplementation((callback: typeof authStateListener) => {
      authStateListener = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    mocks.listClientSolutions.mockResolvedValueOnce([solutionA]).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveAccountB = resolve;
        }),
    );

    render(<ClientSolutionPortal />);

    expect(await screen.findByText("Solução privada da conta A")).toBeInTheDocument();
    await act(async () => {
      authStateListener?.("SIGNED_IN", sessionB);
    });

    expect(screen.queryByText("Solução privada da conta A")).not.toBeInTheDocument();
    expect(screen.getByText("Conta individual · b@example.invalid")).toBeInTheDocument();
    await act(async () => {
      resolveAccountB?.([]);
    });
    expect(await screen.findByText("Nenhuma solução liberada para esta conta")).toBeInTheDocument();
  });

  it("submits only allowed progress fields and does not offer method approval or publication", async () => {
    mocks.auth.getSession.mockResolvedValue({ data: { session: sessionA } });
    mocks.listClientSolutions.mockResolvedValue([solutionA]);
    mocks.listClientSolutionProgress.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        stepId: "step-1",
        status: "in_progress",
        note: "Começamos a etapa.",
        updatedAt: "2026-11-25T01:00:00.000Z",
      },
    ]);

    render(<ClientSolutionPortal />);

    expect(await screen.findByText("Solução privada da conta A")).toBeInTheDocument();
    const firstStepStatus = screen.getAllByLabelText("Andamento")[0];
    if (!firstStepStatus) throw new Error("Expected the first progress control");
    fireEvent.change(firstStepStatus, {
      target: { value: "in_progress" },
    });
    const firstStepNote = screen.getAllByLabelText("Nota de andamento · opcional")[0];
    if (!firstStepNote) throw new Error("Expected the first progress note field");
    fireEvent.change(firstStepNote, {
      target: { value: "Começamos a etapa." },
    });
    const firstSaveButton = screen.getAllByRole("button", { name: "Salvar andamento" })[0];
    if (!firstSaveButton) throw new Error("Expected the first progress save button");
    fireEvent.click(firstSaveButton);

    await waitFor(() =>
      expect(mocks.updateClientSolutionProgress).toHaveBeenCalledWith({
        data: {
          releaseId: solutionA.releaseId,
          stepId: "step-1",
          status: "in_progress",
          note: "Começamos a etapa.",
        },
      }),
    );
    expect(await screen.findByText("Andamento atualizado.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /aprovar|publicar/i })).not.toBeInTheDocument();
  });
});

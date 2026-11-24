import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSupabase: vi.fn(),
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  checkFactoryOperatorAccess: vi.fn(),
  createFactoryInvite: vi.fn(),
  getFactoryBriefReview: vi.fn(),
  listFactoryInbox: vi.fn(),
  navigate: vi.fn(),
  revokeFactoryInvite: vi.fn(),
  updateFactoryBriefStatus: vi.fn(),
  verifyOpenAlexOwner: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({ getSupabase: mocks.getSupabase }));

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => mocks.navigate }));

vi.mock("@/lib/method-factory/workflow.functions", () => ({
  checkFactoryOperatorAccess: mocks.checkFactoryOperatorAccess,
  createFactoryInvite: mocks.createFactoryInvite,
  getFactoryBriefReview: mocks.getFactoryBriefReview,
  listFactoryInbox: mocks.listFactoryInbox,
  revokeFactoryInvite: mocks.revokeFactoryInvite,
  updateFactoryBriefStatus: mocks.updateFactoryBriefStatus,
}));

vi.mock("@/lib/mow-gki/openalex.functions", () => ({
  verifyOpenAlexOwner: mocks.verifyOpenAlexOwner,
}));

import { FactoryReview } from "./FactoryReview";

beforeEach(() => {
  mocks.auth.getSession.mockResolvedValue({ data: { session: null } });
  mocks.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
  mocks.getSupabase.mockReturnValue({ auth: mocks.auth });
  mocks.checkFactoryOperatorAccess.mockResolvedValue({ allowed: true });
  mocks.verifyOpenAlexOwner.mockResolvedValue({ activeOwner: true });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function expectNoInternalDataOrActions() {
  expect(mocks.listFactoryInbox).not.toHaveBeenCalled();
  expect(mocks.getFactoryBriefReview).not.toHaveBeenCalled();
  expect(mocks.createFactoryInvite).not.toHaveBeenCalled();
  expect(mocks.revokeFactoryInvite).not.toHaveBeenCalled();
  expect(mocks.updateFactoryBriefStatus).not.toHaveBeenCalled();
}

describe("FactoryReview access boundary", () => {
  it("does not load internal data without a session", async () => {
    render(<FactoryReview />);

    expect(await screen.findByRole("heading", { name: "Revisão humana" })).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expectNoInternalDataOrActions();
    expect(mocks.checkFactoryOperatorAccess).not.toHaveBeenCalled();
  });

  it("does not load internal data when an authenticated account is denied", async () => {
    mocks.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "synthetic-user", email: "staff@example.invalid" } } },
    });
    mocks.checkFactoryOperatorAccess.mockRejectedValue(new Error("Unauthorized"));

    render(<FactoryReview />);

    expect(await screen.findByRole("heading", { name: "Acesso indisponível" })).toBeInTheDocument();
    expectNoInternalDataOrActions();
    expect(mocks.checkFactoryOperatorAccess).toHaveBeenCalledWith({ data: {} });
  });

  it("waits for the operator check before loading the inbox", async () => {
    let resolveAccess: ((value: { allowed: boolean }) => void) | undefined;
    mocks.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "synthetic-user", email: "staff@example.invalid" } } },
    });
    mocks.checkFactoryOperatorAccess.mockImplementation(
      () =>
        new Promise<{ allowed: boolean }>((resolve) => {
          resolveAccess = resolve;
        }),
    );
    mocks.listFactoryInbox.mockResolvedValue([]);

    render(<FactoryReview />);
    await waitFor(() => expect(mocks.checkFactoryOperatorAccess).toHaveBeenCalledTimes(1));

    expect(mocks.listFactoryInbox).not.toHaveBeenCalled();
    await act(async () => {
      resolveAccess?.({ allowed: true });
    });

    expect(await screen.findByRole("heading", { name: "Caixa de revisão" })).toBeInTheDocument();
    await waitFor(() => expect(mocks.listFactoryInbox).toHaveBeenCalledTimes(1));
    expect(mocks.getFactoryBriefReview).not.toHaveBeenCalled();
  });

  it("hides and discards the previous account inbox while the next account is checked", async () => {
    type TestSession = { user: { id: string; email: string } };
    let authStateListener: ((event: string, nextSession: TestSession | null) => void) | undefined;
    let resolveNextAccess: ((value: { allowed: boolean }) => void) | undefined;
    let resolvePreviousInbox: ((items: Array<Record<string, unknown>>) => void) | undefined;
    let resolveNextInbox: ((items: Array<Record<string, unknown>>) => void) | undefined;

    mocks.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "account-a", email: "a@example.invalid" } } },
    });
    mocks.auth.onAuthStateChange.mockImplementation(
      (callback: (event: string, nextSession: TestSession | null) => void) => {
        authStateListener = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    );
    mocks.checkFactoryOperatorAccess
      .mockResolvedValueOnce({ allowed: true })
      .mockImplementationOnce(
        () =>
          new Promise<{ allowed: boolean }>((resolve) => {
            resolveNextAccess = resolve;
          }),
      );
    mocks.listFactoryInbox
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePreviousInbox = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveNextInbox = resolve;
          }),
      );

    render(<FactoryReview />);
    await waitFor(() => expect(mocks.listFactoryInbox).toHaveBeenCalledTimes(1));

    await act(async () => {
      authStateListener?.("SIGNED_IN", {
        user: { id: "account-b", email: "b@example.invalid" },
      });
    });
    expect(
      await screen.findByRole("heading", { name: "Verificando autorização" }),
    ).toBeInTheDocument();

    await act(async () => {
      resolvePreviousInbox?.([
        {
          id: "brief-from-account-a",
          status: "in_review",
          submittedAt: "2026-11-23T00:00:00.000Z",
          company: "PRIVATE-ACCOUNT-A",
          industry: "",
          relationshipType: "client",
          pains: [],
          analysisStatus: null,
          analysisRunId: null,
          methodVersionId: null,
        },
      ]);
    });
    expect(screen.queryByText("PRIVATE-ACCOUNT-A")).not.toBeInTheDocument();

    await act(async () => {
      resolveNextAccess?.({ allowed: true });
    });
    await waitFor(() => expect(mocks.listFactoryInbox).toHaveBeenCalledTimes(2));
    expect(screen.queryByText("PRIVATE-ACCOUNT-A")).not.toBeInTheDocument();

    await act(async () => {
      resolveNextInbox?.([]);
    });
  });

  it("does not let a delayed initial session overwrite a newer auth event", async () => {
    type TestSession = { user: { id: string; email: string } };
    let authStateListener: ((event: string, nextSession: TestSession | null) => void) | undefined;
    let resolveInitialSession:
      ((value: { data: { session: TestSession | null } }) => void) | undefined;

    mocks.auth.getSession.mockImplementation(
      () =>
        new Promise<{ data: { session: TestSession | null } }>((resolve) => {
          resolveInitialSession = resolve;
        }),
    );
    mocks.auth.onAuthStateChange.mockImplementation(
      (callback: (event: string, nextSession: TestSession | null) => void) => {
        authStateListener = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    );
    mocks.listFactoryInbox.mockResolvedValue([]);

    render(<FactoryReview />);
    await waitFor(() => expect(authStateListener).toBeDefined());

    await act(async () => {
      authStateListener?.("SIGNED_IN", {
        user: { id: "account-b", email: "b@example.invalid" },
      });
    });
    expect(await screen.findByRole("heading", { name: "Caixa de revisão" })).toBeInTheDocument();
    await waitFor(() => expect(mocks.listFactoryInbox).toHaveBeenCalledTimes(1));

    await act(async () => {
      resolveInitialSession?.({
        data: { session: { user: { id: "account-a", email: "a@example.invalid" } } },
      });
    });

    expect(screen.getByText("Sessão autenticada · b@example.invalid")).toBeInTheDocument();
    expect(screen.queryByText("Sessão autenticada · a@example.invalid")).not.toBeInTheDocument();
    expect(mocks.checkFactoryOperatorAccess).toHaveBeenCalledTimes(1);
    expect(mocks.listFactoryInbox).toHaveBeenCalledTimes(1);
  });

  it("keeps final approval blocked for a completed rules draft without integral review", async () => {
    const briefId = "00000000-0000-4000-8000-000000000001";
    const researchRunId = "00000000-0000-4000-8000-000000000002";
    const methodVersionId = "00000000-0000-4000-8000-000000000003";
    mocks.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "synthetic-user", email: "staff@example.invalid" } } },
    });
    mocks.listFactoryInbox.mockResolvedValue([
      {
        id: briefId,
        status: "in_review",
        submittedAt: "2026-11-23T00:00:00.000Z",
        company: "Empresa sintética",
        industry: "",
        relationshipType: "external_pilot",
        pains: [],
        analysisStatus: "completed",
        analysisRunId: researchRunId,
        methodVersionId,
      },
    ]);
    mocks.getFactoryBriefReview.mockResolvedValue({
      id: briefId,
      status: "in_review",
      submittedAt: "2026-11-23T00:00:00.000Z",
      payload: {},
      pains: [],
      analysis: {
        engine: "rules-v1",
        version: "rules-v1",
        status: "completed",
        rascunho_de_método: { objetivo: "Objetivo sintético" },
      },
      analysisStatus: "completed",
      analysisRunId: researchRunId,
      methodVersionId,
      inputDigest: null,
    });

    render(<FactoryReview />);

    expect(await screen.findByText(/Aprovação bloqueada:/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /aprovar/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar em revisão" })).toBeInTheDocument();
    expect(mocks.getFactoryBriefReview).toHaveBeenCalledWith({ data: { id: briefId } });
    expect(mocks.updateFactoryBriefStatus).not.toHaveBeenCalled();
  });

  it("marks a received brief in review and opens its linked research step", async () => {
    const briefId = "00000000-0000-4000-8000-000000000011";
    mocks.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "synthetic-user", email: "staff@example.invalid" } } },
    });
    mocks.listFactoryInbox.mockResolvedValue([
      {
        id: briefId,
        status: "received",
        submittedAt: "2026-11-23T00:00:00.000Z",
        company: "Empresa sintética",
        industry: "",
        relationshipType: "external_pilot",
        pains: [],
        analysisStatus: null,
        analysisRunId: null,
        methodVersionId: null,
      },
    ]);
    mocks.getFactoryBriefReview.mockResolvedValue({
      id: briefId,
      status: "received",
      submittedAt: "2026-11-23T00:00:00.000Z",
      payload: {},
      pains: [],
      analysis: null,
      analysisStatus: null,
      analysisRunId: null,
      methodVersionId: null,
      inputDigest: null,
    });
    mocks.updateFactoryBriefStatus.mockResolvedValue({ updated: true });

    render(<FactoryReview />);

    fireEvent.click(await screen.findByRole("button", { name: "Iniciar pesquisa do método" }));

    await waitFor(() =>
      expect(mocks.updateFactoryBriefStatus).toHaveBeenCalledWith({
        data: { briefId, status: "in_review" },
      }),
    );
    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith({
        to: "/method-factory/openalex",
        search: { briefId },
      }),
    );
    expect(mocks.verifyOpenAlexOwner).toHaveBeenCalledWith({ data: {} });
    const [ownerVerificationOrder] = mocks.verifyOpenAlexOwner.mock.invocationCallOrder;
    const [statusUpdateOrder] = mocks.updateFactoryBriefStatus.mock.invocationCallOrder;
    if (ownerVerificationOrder === undefined || statusUpdateOrder === undefined) {
      throw new Error("Expected owner verification and status update calls");
    }
    expect(ownerVerificationOrder).toBeLessThan(statusUpdateOrder);
  });

  it("does not change the brief status when the active-owner gate denies research", async () => {
    const briefId = "00000000-0000-4000-8000-000000000012";
    mocks.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "synthetic-user", email: "staff@example.invalid" } } },
    });
    mocks.listFactoryInbox.mockResolvedValue([
      {
        id: briefId,
        status: "received",
        submittedAt: "2026-11-23T00:00:00.000Z",
        company: "Empresa sintética",
        industry: "",
        relationshipType: "external_pilot",
        pains: [],
        analysisStatus: null,
        analysisRunId: null,
        methodVersionId: null,
      },
    ]);
    mocks.getFactoryBriefReview.mockResolvedValue({
      id: briefId,
      status: "received",
      submittedAt: "2026-11-23T00:00:00.000Z",
      payload: {},
      pains: [],
      analysis: null,
      analysisStatus: null,
      analysisRunId: null,
      methodVersionId: null,
      inputDigest: null,
    });
    mocks.verifyOpenAlexOwner.mockRejectedValue(new Error("No active owner"));

    render(<FactoryReview />);

    fireEvent.click(await screen.findByRole("button", { name: "Iniciar pesquisa do método" }));

    expect(
      await screen.findByText(
        "A pesquisa exige owner ativo da Factory. O status do briefing não foi alterado.",
      ),
    ).toBeInTheDocument();
    expect(mocks.updateFactoryBriefStatus).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});

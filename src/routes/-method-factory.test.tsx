import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentPath: { value: "" },
  access: {
    userId: null as string | null,
    status: "checking" as "checking" | "allowed" | "denied" | "no_session" | "unconfigured",
    version: 1,
  },
  checkFactoryOperatorAccess: vi.fn(),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
    Outlet: () => <div data-testid="factory-route-outlet" />,
    useRouterState: ({
      select,
    }: {
      select: (state: { location: { pathname: string } }) => unknown;
    }) => select({ location: { pathname: mocks.currentPath.value } }),
  };
});

vi.mock("@/lib/method-factory/workflow.functions", () => ({
  checkFactoryOperatorAccess: mocks.checkFactoryOperatorAccess,
}));

vi.mock("@/lib/mow-gki/use-openalex-owner-access", () => ({
  useOpenAlexOwnerAccess: () => mocks.access,
}));

import { FactoryLayout } from "./method-factory";

beforeEach(() => {
  mocks.currentPath.value = "";
  mocks.access.userId = null;
  mocks.access.status = "checking";
  mocks.access.version = 1;
  mocks.checkFactoryOperatorAccess.mockResolvedValue({ allowed: true });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Factory layouts", () => {
  it.each(["/method-factory/intake", "/method-factory/review", "/method-factory/reset-password"])(
    "keeps internal navigation off %s",
    (pathname) => {
      mocks.currentPath.value = pathname;

      render(<FactoryLayout />);

      expect(screen.getByTestId("factory-route-outlet")).toBeInTheDocument();
      expect(screen.queryByRole("navigation", { name: "Method Factory" })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Visão geral" })).not.toBeInTheDocument();
      expect(mocks.checkFactoryOperatorAccess).not.toHaveBeenCalled();
    },
  );

  it("withholds an internal route when the operator check denies access", async () => {
    mocks.currentPath.value = "/method-factory/openalex";
    mocks.checkFactoryOperatorAccess.mockRejectedValue(new Error("Unauthorized"));

    render(<FactoryLayout />);

    expect(await screen.findByRole("heading", { name: "Área indisponível" })).toBeInTheDocument();
    expect(screen.queryByTestId("factory-route-outlet")).not.toBeInTheDocument();
    expect(screen.queryByText("OpenAlex")).not.toBeInTheDocument();
    expect(mocks.checkFactoryOperatorAccess).toHaveBeenCalledWith({ data: {} });
  });

  it("hides the OpenAlex navigation link from a reviewer or unverified operator", async () => {
    mocks.currentPath.value = "/method-factory";
    mocks.access.userId = "reviewer-1";
    mocks.access.status = "denied";

    render(<FactoryLayout />);

    expect(await screen.findByRole("navigation", { name: "Method Factory" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "OpenAlex" })).not.toBeInTheDocument();
  });

  it("shows the OpenAlex link only after active-owner access is confirmed", async () => {
    mocks.currentPath.value = "/method-factory";
    mocks.access.userId = "owner-1";
    mocks.access.status = "allowed";

    render(<FactoryLayout />);

    expect(await screen.findByRole("link", { name: "OpenAlex" })).toBeInTheDocument();
  });
});

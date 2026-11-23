import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentPath: { value: "" },
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

import { FactoryLayout } from "./method-factory";

beforeEach(() => {
  mocks.currentPath.value = "";
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

  it("keeps the public Method Factory landing open without an operator session", () => {
    mocks.currentPath.value = "/method-factory";

    render(<FactoryLayout />);

    expect(screen.getByTestId("factory-route-outlet")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Method Factory" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Como funciona" })).toHaveAttribute(
      "href",
      "#como-funciona",
    );
    expect(screen.getByRole("link", { name: "Para quem" })).toHaveAttribute("href", "#para-quem");
    expect(screen.queryByText("Protótipo sem persistência.")).not.toBeInTheDocument();
    expect(mocks.checkFactoryOperatorAccess).not.toHaveBeenCalled();
  });

  it("keeps the internal shell and offers authentication when operator access is denied", async () => {
    mocks.currentPath.value = "/method-factory/workspace";
    mocks.checkFactoryOperatorAccess.mockRejectedValue(new Error("Unauthorized"));

    render(<FactoryLayout />);

    expect(await screen.findByRole("heading", { name: "Acesso restrito" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Method Factory" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Visão geral" })).toHaveAttribute(
      "href",
      "/method-factory/workspace",
    );
    expect(screen.getByRole("link", { name: /Briefing/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir autenticação interna" })).toHaveAttribute(
      "href",
      "/method-factory/review",
    );
    expect(screen.queryByTestId("factory-route-outlet")).not.toBeInTheDocument();
  });

  it("preserves the original navigation while keeping the OpenAlex route directly accessible", async () => {
    mocks.currentPath.value = "/method-factory/openalex";

    render(<FactoryLayout />);

    expect(await screen.findByTestId("factory-route-outlet")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Method Factory" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Visão geral" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Briefing/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Revisão interna" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "OpenAlex" })).not.toBeInTheDocument();
  });
});

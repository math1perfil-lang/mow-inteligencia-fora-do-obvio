import { describe, expect, it, vi } from "vitest";
import type { OpenAlexClient, OpenAlexWorksPage } from "./openalex-client";
import {
  createOpenAlexDiscoveryService,
  type OpenAlexDiscoveryDependencies,
  type ResearchLifecycleState,
} from "./openalex-discovery-service";

const RESEARCH_RUN_ID = "00000000-0000-0000-0000-000000000001";
const EMPTY_PAGE: OpenAlexWorksPage = { results: [], nextCursor: null, resultCount: 0 };

function createDependencies() {
  const resolveAuthenticatedActor = vi
    .fn<OpenAlexDiscoveryDependencies["resolveAuthenticatedActor"]>()
    .mockResolvedValue({ userId: "operator-1" });
  const resolveOwnerAccessEvidence = vi
    .fn<OpenAlexDiscoveryDependencies["resolveOwnerAccessEvidence"]>()
    .mockResolvedValue("verified_active_owner");
  const acquireAuthorizedInProgressLease = vi
    .fn<OpenAlexDiscoveryDependencies["acquireAuthorizedInProgressLease"]>()
    .mockResolvedValue({ status: "acquired", leaseId: "lease-1" });
  const releaseDiscoveryLease = vi
    .fn<OpenAlexDiscoveryDependencies["releaseDiscoveryLease"]>()
    .mockResolvedValue(undefined);
  const searchWorks = vi.fn<OpenAlexClient["searchWorks"]>().mockResolvedValue(EMPTY_PAGE);
  const dependencies: OpenAlexDiscoveryDependencies = {
    resolveAuthenticatedActor,
    resolveOwnerAccessEvidence,
    acquireAuthorizedInProgressLease,
    releaseDiscoveryLease,
    openAlexClient: { searchWorks },
  };

  return {
    dependencies,
    resolveAuthenticatedActor,
    resolveOwnerAccessEvidence,
    acquireAuthorizedInProgressLease,
    releaseDiscoveryLease,
    searchWorks,
  };
}

describe("OpenAlex discovery service boundary", () => {
  it("rejects unauthenticated requests before lease acquisition or network access", async () => {
    const deps = createDependencies();
    deps.resolveAuthenticatedActor.mockResolvedValueOnce(null);
    const service = createOpenAlexDiscoveryService(deps.dependencies);

    await expect(
      service({ researchRunId: RESEARCH_RUN_ID, query: "organizational resilience" }),
    ).rejects.toMatchObject({ code: "unauthenticated" });

    expect(deps.resolveOwnerAccessEvidence).not.toHaveBeenCalled();
    expect(deps.acquireAuthorizedInProgressLease).not.toHaveBeenCalled();
    expect(deps.searchWorks).not.toHaveBeenCalled();
  });

  it("delegates exact-run authorization and the atomic in-progress check before the API call", async () => {
    const deps = createDependencies();
    const service = createOpenAlexDiscoveryService(deps.dependencies);

    await expect(
      service({ researchRunId: RESEARCH_RUN_ID, query: "organizational resilience" }),
    ).resolves.toEqual(EMPTY_PAGE);

    expect(deps.resolveOwnerAccessEvidence).toHaveBeenCalledWith("operator-1");
    expect(deps.acquireAuthorizedInProgressLease).toHaveBeenCalledWith(
      "operator-1",
      RESEARCH_RUN_ID,
    );
    expect(deps.resolveOwnerAccessEvidence.mock.invocationCallOrder[0]).toBeLessThan(
      deps.acquireAuthorizedInProgressLease.mock.invocationCallOrder[0]!,
    );
    expect(deps.acquireAuthorizedInProgressLease.mock.invocationCallOrder[0]).toBeLessThan(
      deps.searchWorks.mock.invocationCallOrder[0]!,
    );
    expect(deps.searchWorks.mock.invocationCallOrder[0]).toBeLessThan(
      deps.releaseDiscoveryLease.mock.invocationCallOrder[0]!,
    );
    expect(deps.releaseDiscoveryLease).toHaveBeenCalledWith("lease-1");
  });

  it.each(["reviewer", "inactive_owner", "unverified", "operator", null])(
    "denies GKI before lease or network for owner evidence %s",
    async (evidence) => {
      const deps = createDependencies();
      deps.resolveOwnerAccessEvidence.mockResolvedValueOnce(evidence);
      const service = createOpenAlexDiscoveryService(deps.dependencies);

      await expect(
        service({ researchRunId: RESEARCH_RUN_ID, query: "organizational resilience" }),
      ).rejects.toMatchObject({ code: "forbidden" });

      expect(deps.resolveOwnerAccessEvidence).toHaveBeenCalledWith("operator-1");
      expect(deps.acquireAuthorizedInProgressLease).not.toHaveBeenCalled();
      expect(deps.searchWorks).not.toHaveBeenCalled();
      expect(deps.releaseDiscoveryLease).not.toHaveBeenCalled();
    },
  );

  it("fails closed if the active-owner evidence adapter is unavailable", async () => {
    const deps = createDependencies();
    deps.resolveOwnerAccessEvidence.mockRejectedValueOnce(new Error("synthetic adapter error"));
    const service = createOpenAlexDiscoveryService(deps.dependencies);

    await expect(
      service({ researchRunId: RESEARCH_RUN_ID, query: "organizational resilience" }),
    ).rejects.toMatchObject({ code: "forbidden" });

    expect(deps.acquireAuthorizedInProgressLease).not.toHaveBeenCalled();
    expect(deps.searchWorks).not.toHaveBeenCalled();
  });

  it("rejects an unauthorized actor without calling the API or releasing an unacquired lease", async () => {
    const deps = createDependencies();
    deps.acquireAuthorizedInProgressLease.mockResolvedValueOnce({ status: "forbidden" });
    const service = createOpenAlexDiscoveryService(deps.dependencies);

    await expect(
      service({ researchRunId: RESEARCH_RUN_ID, query: "organizational resilience" }),
    ).rejects.toMatchObject({ code: "forbidden" });

    expect(deps.searchWorks).not.toHaveBeenCalled();
    expect(deps.releaseDiscoveryLease).not.toHaveBeenCalled();
  });

  it("does not reveal or search a missing run unless the adapter grants an active lease", async () => {
    const deps = createDependencies();
    deps.acquireAuthorizedInProgressLease.mockResolvedValueOnce({ status: "not_found" });
    const service = createOpenAlexDiscoveryService(deps.dependencies);

    await expect(
      service({ researchRunId: RESEARCH_RUN_ID, query: "organizational resilience" }),
    ).rejects.toMatchObject({ code: "research_not_found" });
    expect(deps.searchWorks).not.toHaveBeenCalled();
  });

  it.each(["draft", "completed"] as const)(
    "blocks OpenAlex discovery when the atomic lease adapter reports %s",
    async (state: ResearchLifecycleState) => {
      const deps = createDependencies();
      deps.acquireAuthorizedInProgressLease.mockImplementationOnce(async () => {
        if (state === "in_progress") return { status: "acquired", leaseId: "lease-1" };
        return { status: "not_in_progress" };
      });
      const service = createOpenAlexDiscoveryService(deps.dependencies);

      await expect(
        service({ researchRunId: RESEARCH_RUN_ID, query: "organizational resilience" }),
      ).rejects.toMatchObject({ code: "research_not_in_progress" });
      expect(deps.searchWorks).not.toHaveBeenCalled();
      expect(deps.releaseDiscoveryLease).not.toHaveBeenCalled();
    },
  );

  it("validates input and rejects unexpected keys such as caller-supplied credentials", async () => {
    const deps = createDependencies();
    const service = createOpenAlexDiscoveryService(deps.dependencies);

    await expect(service({ researchRunId: "not-a-uuid", query: "topic" })).rejects.toMatchObject({
      code: "invalid_request",
    });
    await expect(
      service({ researchRunId: RESEARCH_RUN_ID, query: "x".repeat(301) }),
    ).rejects.toMatchObject({ code: "invalid_request" });
    await expect(
      service({ researchRunId: RESEARCH_RUN_ID, query: "topic", apiKey: "must-not-be-accepted" }),
    ).rejects.toMatchObject({ code: "invalid_request" });
    await expect(
      service({ researchRunId: RESEARCH_RUN_ID, query: "topic", perPage: 101 }),
    ).rejects.toMatchObject({ code: "invalid_request" });

    expect(deps.resolveAuthenticatedActor).not.toHaveBeenCalled();
    expect(deps.acquireAuthorizedInProgressLease).not.toHaveBeenCalled();
    expect(deps.searchWorks).not.toHaveBeenCalled();
  });

  it("releases the lease when the upstream request fails", async () => {
    const deps = createDependencies();
    deps.searchWorks.mockRejectedValueOnce(new Error("synthetic transport failure"));
    const service = createOpenAlexDiscoveryService(deps.dependencies);

    await expect(
      service({ researchRunId: RESEARCH_RUN_ID, query: "organizational resilience" }),
    ).rejects.toThrow("synthetic transport failure");
    expect(deps.releaseDiscoveryLease).toHaveBeenCalledWith("lease-1");
  });
});

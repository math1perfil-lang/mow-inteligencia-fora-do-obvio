import { describe, expect, it, vi } from "vitest";
import type { ExternalSourceSearchPage } from "./external-source.schema";
import {
  createExternalSourceDiscoveryService,
  type ExternalSourceDiscoveryDependencies,
} from "./external-source-discovery-service";

const RESEARCH_RUN_ID = "00000000-0000-0000-0000-000000000001";
const EMPTY_PAGE: ExternalSourceSearchPage = { state: "complete", results: [], providers: [] };

function createDependencies(isConfigured = true) {
  const resolveAuthenticatedActor = vi
    .fn<ExternalSourceDiscoveryDependencies["resolveAuthenticatedActor"]>()
    .mockResolvedValue({ userId: "owner-1" });
  const resolveOwnerAccessEvidence = vi
    .fn<ExternalSourceDiscoveryDependencies["resolveOwnerAccessEvidence"]>()
    .mockResolvedValue("verified_active_owner");
  const acquireAuthorizedInProgressLease = vi
    .fn<ExternalSourceDiscoveryDependencies["acquireAuthorizedInProgressLease"]>()
    .mockResolvedValue({ status: "acquired", leaseId: "lease-1" });
  const releaseDiscoveryLease = vi
    .fn<ExternalSourceDiscoveryDependencies["releaseDiscoveryLease"]>()
    .mockResolvedValue(undefined);
  const search = vi
    .fn<ExternalSourceDiscoveryDependencies["sourceClient"]["search"]>()
    .mockResolvedValue(EMPTY_PAGE);
  const dependencies: ExternalSourceDiscoveryDependencies = {
    resolveAuthenticatedActor,
    resolveOwnerAccessEvidence,
    acquireAuthorizedInProgressLease,
    releaseDiscoveryLease,
    sourceClient: { isConfigured, search },
  };
  return {
    dependencies,
    resolveAuthenticatedActor,
    resolveOwnerAccessEvidence,
    acquireAuthorizedInProgressLease,
    releaseDiscoveryLease,
    search,
  };
}

describe("external source discovery service", () => {
  it("requires an authenticated active owner before network access or lease acquisition", async () => {
    const deps = createDependencies();
    deps.resolveOwnerAccessEvidence.mockResolvedValueOnce("reviewer");
    const service = createExternalSourceDiscoveryService(deps.dependencies);

    await expect(
      service({ researchRunId: RESEARCH_RUN_ID, query: "short topic" }),
    ).rejects.toMatchObject({ code: "forbidden" });
    expect(deps.acquireAuthorizedInProgressLease).not.toHaveBeenCalled();
    expect(deps.search).not.toHaveBeenCalled();
  });

  it("returns a clear not-configured state without a lease or provider call", async () => {
    const deps = createDependencies(false);
    const service = createExternalSourceDiscoveryService(deps.dependencies);

    await expect(
      service({ researchRunId: RESEARCH_RUN_ID, query: "short topic" }),
    ).resolves.toEqual({ state: "not_configured", results: [], providers: [] });
    expect(deps.acquireAuthorizedInProgressLease).not.toHaveBeenCalled();
    expect(deps.search).not.toHaveBeenCalled();
  });

  it("leases the exact research run before requesting sources and releases after success", async () => {
    const deps = createDependencies();
    const service = createExternalSourceDiscoveryService(deps.dependencies);

    await expect(
      service({ researchRunId: RESEARCH_RUN_ID, query: "short topic", perPage: 7 }),
    ).resolves.toEqual(EMPTY_PAGE);
    expect(deps.acquireAuthorizedInProgressLease).toHaveBeenCalledWith("owner-1", RESEARCH_RUN_ID);
    expect(deps.search).toHaveBeenCalledWith("short topic", 7);
    expect(deps.acquireAuthorizedInProgressLease.mock.invocationCallOrder[0]).toBeLessThan(
      deps.search.mock.invocationCallOrder[0]!,
    );
    expect(deps.search.mock.invocationCallOrder[0]).toBeLessThan(
      deps.releaseDiscoveryLease.mock.invocationCallOrder[0]!,
    );
    expect(deps.releaseDiscoveryLease).toHaveBeenCalledWith("lease-1");
  });

  it("rejects invalid requests and never accepts caller-supplied credentials", async () => {
    const deps = createDependencies();
    const service = createExternalSourceDiscoveryService(deps.dependencies);

    await expect(
      service({ researchRunId: RESEARCH_RUN_ID, query: "short topic", apiKey: "secret" }),
    ).rejects.toMatchObject({ code: "invalid_request" });
    await expect(service({ researchRunId: "invalid", query: "short topic" })).rejects.toMatchObject(
      { code: "invalid_request" },
    );
    await expect(
      service({ researchRunId: RESEARCH_RUN_ID, query: "a very long topic ".repeat(30) }),
    ).rejects.toMatchObject({ code: "invalid_request" });
    expect(deps.acquireAuthorizedInProgressLease).not.toHaveBeenCalled();
    expect(deps.search).not.toHaveBeenCalled();
  });

  it("releases the lease after a configured provider failure", async () => {
    const deps = createDependencies();
    deps.search.mockRejectedValueOnce(new Error("private provider detail"));
    const service = createExternalSourceDiscoveryService(deps.dependencies);

    await expect(service({ researchRunId: RESEARCH_RUN_ID, query: "short topic" })).rejects.toThrow(
      "private provider detail",
    );
    expect(deps.releaseDiscoveryLease).toHaveBeenCalledWith("lease-1");
  });
});

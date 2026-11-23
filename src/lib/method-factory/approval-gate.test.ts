import { describe, expect, it, vi } from "vitest";
import {
  executeMethodApprovalIfReady,
  METHOD_APPROVAL_BACKEND_BLOCKERS,
  METHOD_APPROVAL_BACKEND_READY,
} from "@/lib/method-factory/approval-gate";

describe("method approval backend readiness", () => {
  it("remains fail-closed while integral backend gates are unresolved", async () => {
    expect(METHOD_APPROVAL_BACKEND_READY).toBe(false);
    expect(METHOD_APPROVAL_BACKEND_BLOCKERS).toEqual([
      "authoritative_package_digest",
      "active_review_policy_source",
      "integral_review_persistence_and_coverage",
      "downstream_association_and_approval_validation",
    ]);

    const invokeApproval = vi.fn(async () => true);

    await expect(executeMethodApprovalIfReady(invokeApproval)).resolves.toBe(false);
    expect(invokeApproval).not.toHaveBeenCalled();
  });
});

import { describe, expect, it } from "vitest";
import { mayAccessGkiFromOwnerEvidence } from "./gki-owner-access-contract";

describe("synthetic GKI active-owner access policy", () => {
  it("allows only a verified active Factory owner", () => {
    expect(mayAccessGkiFromOwnerEvidence("verified_active_owner")).toBe(true);
  });

  it.each([
    "reviewer",
    "inactive_owner",
    "unverified",
    "operator",
    null,
    undefined,
    { status: "verified_active_owner" },
  ])("denies non-owner or untrusted evidence: %s", (evidence) => {
    expect(mayAccessGkiFromOwnerEvidence(evidence)).toBe(false);
  });
});

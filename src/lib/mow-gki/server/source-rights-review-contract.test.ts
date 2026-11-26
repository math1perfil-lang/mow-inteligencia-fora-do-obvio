import { describe, expect, it } from "vitest";
import {
  sourceRightsReviewSubmissionSchema,
  toRightsReviewRpcPayload,
} from "./source-rights-review-contract";

const SOURCE_ID = "44444444-4444-4444-8444-444444444444";
const contentReview = {
  sourceId: SOURCE_ID,
  decisionStatus: "open_license_verified" as const,
  permittedUses: ["catalog_metadata", "commercial_method_derivation"] as const,
  rightsBasis: "License expressly permits internal commercial method derivation.",
  rightsEvidenceUrl: "https://example.org/license",
  restrictions: "No additional restrictions.",
  restrictionsReviewed: true,
  restrictionsSatisfied: true,
  validUntil: "2099-12-31",
};

describe("source rights review contract", () => {
  it("accepts a complete item-specific human review for content use", () => {
    expect(sourceRightsReviewSubmissionSchema.safeParse(contentReview).success).toBe(true);
  });

  it("allows pending metadata-only decisions without claiming content rights", () => {
    const result = sourceRightsReviewSubmissionSchema.safeParse({
      ...contentReview,
      decisionStatus: "pending",
      permittedUses: ["catalog_metadata", "link_and_citation"],
      rightsBasis: "",
      rightsEvidenceUrl: "",
      restrictions: "",
      restrictionsReviewed: false,
      restrictionsSatisfied: false,
      validUntil: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects content use unless all rights and restriction conditions are met", () => {
    for (const patch of [
      { decisionStatus: "pending", permittedUses: ["commercial_method_derivation"] },
      { rightsBasis: "" },
      { rightsEvidenceUrl: "" },
      { validUntil: "" },
      { restrictionsReviewed: false },
      { restrictionsSatisfied: false },
    ]) {
      expect(sourceRightsReviewSubmissionSchema.safeParse({ ...contentReview, ...patch }).success).toBe(
        false,
      );
    }
  });

  it("rejects unreviewed restrictions and satisfied-without-reviewed claims", () => {
    expect(
      sourceRightsReviewSubmissionSchema.safeParse({
        ...contentReview,
        restrictions: "Must preserve attribution.",
        restrictionsReviewed: false,
        restrictionsSatisfied: false,
      }).success,
    ).toBe(false);
    expect(
      sourceRightsReviewSubmissionSchema.safeParse({
        ...contentReview,
        restrictionsReviewed: false,
        restrictionsSatisfied: true,
      }).success,
    ).toBe(false);
  });

  it("rejects insecure evidence URLs, invalid dates, duplicate uses and extra fields", () => {
    for (const patch of [
      { rightsEvidenceUrl: "http://example.org/license" },
      { rightsEvidenceUrl: "https://user:pass@example.org/license" },
      { validUntil: "2099-02-30" },
      { permittedUses: ["commercial_method_derivation", "commercial_method_derivation"] },
      { reviewerId: SOURCE_ID },
    ]) {
      expect(sourceRightsReviewSubmissionSchema.safeParse({ ...contentReview, ...patch }).success).toBe(
        false,
      );
    }
  });

  it("builds an exact RPC payload and omits browser claims about reviewer/time/version", () => {
    const payload = toRightsReviewRpcPayload({
      ...contentReview,
      rightsBasis: "  License reviewed.  ",
    });
    expect(payload).toEqual({
      decision_status: "open_license_verified",
      permitted_uses: ["catalog_metadata", "commercial_method_derivation"],
      rights_basis: "License reviewed.",
      rights_evidence_url: "https://example.org/license",
      restrictions: "No additional restrictions.",
      restrictions_reviewed: true,
      restrictions_satisfied: true,
      valid_until: "2099-12-31",
    });
    expect(payload).not.toHaveProperty("reviewed_by");
    expect(payload).not.toHaveProperty("reviewed_at");
    expect(payload).not.toHaveProperty("decision_version");
  });

  it("rejects malformed inputs before constructing RPC payloads", () => {
    expect(() => toRightsReviewRpcPayload({ ...contentReview, validUntil: "yesterday" })).toThrow();
  });
});

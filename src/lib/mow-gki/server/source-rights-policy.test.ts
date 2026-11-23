import { describe, expect, it } from "vitest";
import {
  evaluateSourceContentUse,
  sourceRightsReviewSnapshotSchema,
  type SourceRightsReviewSnapshot,
} from "./source-rights-policy";

const REVIEWER_ID = "00000000-0000-0000-0000-000000000001";

function validReview(
  overrides: Partial<SourceRightsReviewSnapshot> = {},
): SourceRightsReviewSnapshot {
  return {
    status: "open_license_verified",
    permittedUses: ["internal_content_analysis"],
    restrictions: [],
    restrictionsReviewed: true,
    restrictionsSatisfied: true,
    evidenceUrl: "https://example.org/license",
    reviewerId: REVIEWER_ID,
    reviewedAt: "2026-01-01T12:00:00.000Z",
    validUntil: "2026-06-01",
    ...overrides,
  };
}

describe("source rights DATE contract", () => {
  it("accepts only real YYYY-MM-DD dates for valid_until", () => {
    expect(sourceRightsReviewSnapshotSchema.safeParse(validReview()).success).toBe(true);
    expect(
      sourceRightsReviewSnapshotSchema.safeParse(validReview({ validUntil: "2026-02-30" })).success,
    ).toBe(false);
    expect(
      sourceRightsReviewSnapshotSchema.safeParse(
        validReview({ validUntil: "2026-06-01T00:00:00.000Z" }),
      ).success,
    ).toBe(false);
  });

  it("treats valid_until as inclusive through that UTC calendar day", () => {
    const review = validReview();
    const finalMomentOfValidDay = evaluateSourceContentUse(
      review,
      "internal_content_analysis",
      new Date("2026-06-01T23:59:59.999Z"),
    );
    expect(finalMomentOfValidDay.allowed).toBe(true);

    const sameInstantWithOffset = evaluateSourceContentUse(
      review,
      "internal_content_analysis",
      new Date("2026-06-02T00:59:59.999+01:00"),
    );
    expect(sameInstantWithOffset.allowed).toBe(true);

    const firstMomentAfterExpiry = evaluateSourceContentUse(
      review,
      "internal_content_analysis",
      new Date("2026-06-02T00:00:00.000Z"),
    );
    expect(firstMomentAfterExpiry).toEqual({ allowed: false, reason: "review_expired" });
  });
});

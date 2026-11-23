import { webcrypto } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  calculatePackageSha256,
  type PackageArtifact,
  type PackageManifestV1,
  type PackageSourceLink,
} from "../package-contract";
import type { SourceRightsReviewSnapshot } from "./source-rights-policy";
import { evaluateMethodCompletionGateServer as evaluateMethodCompletionGateServerRaw } from "./method-completion-gate";

const BRIEF_ID = "00000000-0000-0000-0000-000000000001";
const RUN_ID = "00000000-0000-0000-0000-000000000002";
const SOURCE_ID = "00000000-0000-0000-0000-000000000003";
const SOURCE_LINK_ID = "00000000-0000-0000-0000-000000000004";
const RIGHTS_REVIEW_ID = "00000000-0000-0000-0000-000000000005";
const FINAL_ARTIFACT_ID = "00000000-0000-0000-0000-000000000006";
const SYNTHESIS_ARTIFACT_ID = "00000000-0000-0000-0000-000000000007";
const RIGHTS_REVIEWER_ID = "00000000-0000-0000-0000-000000000008";
const METHOD_REVIEWER_ID = "00000000-0000-0000-0000-000000000009";

const RESEARCH_COMPLETED_AT = "2026-01-01T10:00:00.000Z";
const PACKAGE_FROZEN_AT = RESEARCH_COMPLETED_AT;
const PACKAGE_REVIEWED_AT = "2026-01-03T10:00:00.000Z";

function validRightsSnapshot(): SourceRightsReviewSnapshot {
  return {
    status: "open_license_verified" as const,
    permittedUses: ["internal_content_analysis" as const],
    restrictions: [],
    restrictionsReviewed: true,
    restrictionsSatisfied: true,
    evidenceUrl: "https://example.org/license",
    reviewerId: RIGHTS_REVIEWER_ID,
    reviewedAt: "2025-12-30T10:00:00.000Z",
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1_000).toISOString().slice(0, 10),
  };
}

function makeManifest(): PackageManifestV1 {
  return {
    schema_version: "mow-gki-package/v1",
    research_run_id: RUN_ID,
    protocol_version: "protocol-v1",
    review_policy_version: "integral-review-v1",
    final_package_artifact_id: FINAL_ARTIFACT_ID,
    source_ids: [SOURCE_ID],
    artifact_ids: [FINAL_ARTIFACT_ID, SYNTHESIS_ARTIFACT_ID],
    limitations: ["Síntese sintética para teste; sem pesquisa real."],
  };
}

function makeSourceLink(rightsSnapshot = validRightsSnapshot()): PackageSourceLink {
  return {
    id: SOURCE_LINK_ID,
    source_id: SOURCE_ID,
    rights_review_id: RIGHTS_REVIEW_ID,
    content_use_mode: "internal_content_analysis",
    selection_status: "included",
    source_snapshot: {
      original_title: "Synthetic source",
      rights_review_snapshot: rightsSnapshot,
    },
    selection_note: "Fonte sintética incluída no fixture.",
  };
}

function makeArtifacts(): PackageArtifact[] {
  return [
    {
      id: FINAL_ARTIFACT_ID,
      research_run_source_id: null,
      artifact_type: "final_package",
      artifact_payload: { outcome: "synthetic-only" },
      contains_verbatim_text: false,
    },
    {
      id: SYNTHESIS_ARTIFACT_ID,
      research_run_source_id: SOURCE_LINK_ID,
      artifact_type: "synthesis",
      artifact_payload: { summary: "Synthetic summary; not a finding." },
      contains_verbatim_text: false,
    },
  ];
}

async function validInput() {
  const manifest = makeManifest();
  const rightsSnapshot = validRightsSnapshot();
  const sources = [makeSourceLink(rightsSnapshot)];
  const artifacts = makeArtifacts();
  const sha256 = await calculatePackageSha256(manifest, sources, artifacts, webcrypto);

  return {
    briefId: BRIEF_ID,
    activeReviewPolicyVersion: "integral-review-v1",
    researchRun: {
      id: RUN_ID,
      briefId: BRIEF_ID,
      status: "completed",
      completedAt: RESEARCH_COMPLETED_AT,
    },
    frozenPackage: {
      manifest,
      sources,
      artifacts,
      sha256,
      frozenAt: PACKAGE_FROZEN_AT,
    },
    rightsReviews: [
      {
        id: RIGHTS_REVIEW_ID,
        sourceId: SOURCE_ID,
        snapshot: rightsSnapshot,
      },
    ],
    humanReview: {
      briefId: BRIEF_ID,
      researchRunId: RUN_ID,
      decision: "approved",
      scope: "integral_method_package",
      reviewerId: METHOD_REVIEWER_ID,
      reviewedAt: PACKAGE_REVIEWED_AT,
      reviewedPackageFrozenAt: PACKAGE_FROZEN_AT,
      reviewedPackageSha256: sha256,
      reviewPolicyVersion: "integral-review-v1",
      reviewedSourceLinkIds: [SOURCE_LINK_ID],
      reviewedArtifactIds: [FINAL_ARTIFACT_ID, SYNTHESIS_ARTIFACT_ID],
    },
  };
}

async function evaluateMethodCompletionGateServer<T extends { activeReviewPolicyVersion: string }>(
  input: T,
) {
  const { activeReviewPolicyVersion, ...payload } = input;
  return evaluateMethodCompletionGateServerRaw(payload, activeReviewPolicyVersion);
}

describe("server-side method completion gate contract", () => {
  it("accepts only a complete synthetic chain with exact linkage, rights snapshot, hash and full review", async () => {
    const result = await evaluateMethodCompletionGateServer(await validInput());

    expect(result.readyForUse, JSON.stringify(result)).toBe(true);
    if (result.readyForUse) {
      expect(result.packageSha256).toMatch(/^[0-9a-f]{64}$/);
      expect(result.blockers).toEqual([]);
    }
  });

  it("fails closed when the research run is not linked to this briefing or is not completed", async () => {
    const input = await validInput();
    const mismatch = await evaluateMethodCompletionGateServer({
      ...input,
      researchRun: { ...input.researchRun, briefId: "00000000-0000-0000-0000-000000000010" },
    });
    expect(mismatch.readyForUse).toBe(false);
    if (!mismatch.readyForUse) {
      expect(mismatch.blockers).toContain("brief_research_link_missing_or_mismatched");
    }

    const inProgress = await evaluateMethodCompletionGateServer({
      ...input,
      researchRun: { ...input.researchRun, status: "in_progress" },
    });
    expect(inProgress.readyForUse).toBe(false);
    if (!inProgress.readyForUse) expect(inProgress.blockers).toContain("research_not_completed");

    const mismatchedReview = await evaluateMethodCompletionGateServer({
      ...input,
      humanReview: {
        ...input.humanReview,
        briefId: "00000000-0000-0000-0000-000000000010",
      },
    });
    expect(mismatchedReview.readyForUse).toBe(false);
    if (!mismatchedReview.readyForUse) {
      expect(mismatchedReview.blockers).toContain("human_review_context_mismatch");
    }
  });

  it("rejects a mismatched package digest and any freeze timestamp differing from the DB freeze", async () => {
    const input = await validInput();
    const badHash = await evaluateMethodCompletionGateServer({
      ...input,
      frozenPackage: { ...input.frozenPackage, sha256: "0".repeat(64) },
    });
    expect(badHash.readyForUse).toBe(false);
    if (!badHash.readyForUse)
      expect(badHash.blockers).toContain("package_hash_invalid_or_mismatched");

    const tooEarly = await evaluateMethodCompletionGateServer({
      ...input,
      frozenPackage: { ...input.frozenPackage, frozenAt: "2025-12-31T10:00:00.000Z" },
    });
    expect(tooEarly.readyForUse).toBe(false);
    if (!tooEarly.readyForUse) {
      expect(tooEarly.blockers).toContain("package_freeze_timestamp_mismatch");
    }

    const alteredFreeze = await evaluateMethodCompletionGateServer({
      ...input,
      frozenPackage: { ...input.frozenPackage, frozenAt: "2026-01-02T11:00:00.000Z" },
    });
    expect(alteredFreeze.readyForUse).toBe(false);
    if (!alteredFreeze.readyForUse) {
      expect(alteredFreeze.blockers).toContain("package_freeze_timestamp_mismatch");
      expect(alteredFreeze.blockers).toContain("human_review_frozen_at_mismatch");
    }

    const subMillisecondFreeze = await evaluateMethodCompletionGateServer({
      ...input,
      frozenPackage: {
        ...input.frozenPackage,
        frozenAt: "2026-01-01T10:00:00.000001Z",
      },
    });
    expect(subMillisecondFreeze.readyForUse).toBe(false);
    if (!subMillisecondFreeze.readyForUse) {
      expect(subMillisecondFreeze.blockers).toContain("package_freeze_timestamp_mismatch");
    }

    const subMillisecondReview = await evaluateMethodCompletionGateServer({
      ...input,
      humanReview: {
        ...input.humanReview,
        reviewedAt: "2026-01-01T10:00:00.000001Z",
      },
    });
    expect(subMillisecondReview.readyForUse).toBe(true);

    const stalePolicy = await evaluateMethodCompletionGateServer({
      ...input,
      activeReviewPolicyVersion: "integral-review-v2",
    });
    expect(stalePolicy.readyForUse).toBe(false);
    if (!stalePolicy.readyForUse) {
      expect(stalePolicy.blockers).toContain("review_policy_not_current");
    }
  });

  it("fails closed when trusted server policy context is missing", async () => {
    const input = await validInput();
    const payload = Object.fromEntries(
      Object.entries(input).filter(([key]) => key !== "activeReviewPolicyVersion"),
    );
    const result = await evaluateMethodCompletionGateServerRaw(payload, undefined);

    expect(result.readyForUse).toBe(false);
    if (!result.readyForUse) {
      expect(result.blockers).toContain("active_review_policy_unavailable");
    }
  });

  it("rejects an active policy version embedded in the untrusted package payload", async () => {
    const input = await validInput();
    const { activeReviewPolicyVersion, ...payload } = input;
    const result = await evaluateMethodCompletionGateServerRaw(
      { ...payload, activeReviewPolicyVersion: "integral-review-v2" },
      activeReviewPolicyVersion,
    );

    expect(result.readyForUse).toBe(false);
    if (!result.readyForUse) expect(result.blockers).toContain("invalid_input");
  });

  it("requires the rights decision to be frozen into the hashed source snapshot and authorize the selected use", async () => {
    const input = await validInput();
    const changedRights = {
      ...validRightsSnapshot(),
      permittedUses: ["catalog_metadata" as const],
    };
    const manifest = input.frozenPackage.manifest;
    const artifacts = input.frozenPackage.artifacts;
    const sources = [makeSourceLink(changedRights)];
    const sha256 = await calculatePackageSha256(manifest, sources, artifacts, webcrypto);
    const result = await evaluateMethodCompletionGateServer({
      ...input,
      frozenPackage: { ...input.frozenPackage, sources, sha256 },
      rightsReviews: [{ id: RIGHTS_REVIEW_ID, sourceId: SOURCE_ID, snapshot: changedRights }],
      humanReview: { ...input.humanReview, reviewedPackageSha256: sha256 },
    });

    expect(result.readyForUse).toBe(false);
    if (!result.readyForUse) expect(result.blockers).toContain("source_rights_use_not_authorized");

    const unfrozenRights = await evaluateMethodCompletionGateServer({
      ...input,
      rightsReviews: [
        {
          id: RIGHTS_REVIEW_ID,
          sourceId: SOURCE_ID,
          snapshot: { ...validRightsSnapshot(), restrictionsSatisfied: false },
        },
      ],
    });
    expect(unfrozenRights.readyForUse).toBe(false);
    if (!unfrozenRights.readyForUse) {
      expect(unfrozenRights.blockers).toContain("source_rights_snapshot_not_frozen");
    }

    const expiredRights = { ...validRightsSnapshot(), validUntil: "2026-06-01" };
    const expiredSources = [makeSourceLink(expiredRights)];
    const expiredHash = await calculatePackageSha256(
      input.frozenPackage.manifest,
      expiredSources,
      input.frozenPackage.artifacts,
      webcrypto,
    );
    const expired = await evaluateMethodCompletionGateServer({
      ...input,
      frozenPackage: { ...input.frozenPackage, sources: expiredSources, sha256: expiredHash },
      rightsReviews: [{ id: RIGHTS_REVIEW_ID, sourceId: SOURCE_ID, snapshot: expiredRights }],
      humanReview: { ...input.humanReview, reviewedPackageSha256: expiredHash },
    });
    expect(expired.readyForUse).toBe(false);
    if (!expired.readyForUse) {
      expect(expired.blockers).toContain("source_rights_review_incomplete_or_expired");
    }
  });

  it("requires an approved post-freeze review that covers every package artifact and source link", async () => {
    const input = await validInput();
    const partial = await evaluateMethodCompletionGateServer({
      ...input,
      humanReview: { ...input.humanReview, reviewedArtifactIds: [FINAL_ARTIFACT_ID] },
    });
    expect(partial.readyForUse).toBe(false);
    if (!partial.readyForUse) {
      expect(partial.blockers).toContain("human_review_does_not_cover_entire_package");
    }

    const negativeDecision = await evaluateMethodCompletionGateServer({
      ...input,
      humanReview: { ...input.humanReview, decision: "changes_requested" },
    });
    expect(negativeDecision.readyForUse).toBe(false);
    if (!negativeDecision.readyForUse) {
      expect(negativeDecision.blockers).toContain("human_review_not_approved");
    }

    const earlyReview = await evaluateMethodCompletionGateServer({
      ...input,
      humanReview: { ...input.humanReview, reviewedAt: PACKAGE_FROZEN_AT },
    });
    expect(earlyReview.readyForUse).toBe(false);
    if (!earlyReview.readyForUse) {
      expect(earlyReview.blockers).toContain("human_review_not_after_package_freeze");
    }
  });

  it("rejects a review timestamp that precedes persisted research completion", async () => {
    const input = await validInput();
    const completionAndFreeze = "2026-01-04T10:00:00.000Z";
    const result = await evaluateMethodCompletionGateServer({
      ...input,
      researchRun: {
        ...input.researchRun,
        completedAt: completionAndFreeze,
      },
      frozenPackage: {
        ...input.frozenPackage,
        frozenAt: completionAndFreeze,
      },
      humanReview: {
        ...input.humanReview,
        reviewedPackageFrozenAt: completionAndFreeze,
      },
    });

    expect(result.readyForUse).toBe(false);
    if (!result.readyForUse) {
      expect(result.blockers).toContain("human_review_not_after_research_completion");
      expect(result.blockers).toContain("human_review_not_after_package_freeze");
      expect(result.blockers).not.toContain("package_freeze_timestamp_mismatch");
    }
  });
});

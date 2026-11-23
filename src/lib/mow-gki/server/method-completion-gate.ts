import { createServerOnlyFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  calculatePackageSha256,
  canonicalizeJson,
  createPackageHashEnvelope,
  isSha256Hex,
  type ContentUseMode,
} from "../package-contract";
import { evaluateSourceContentUse, sourceRightsReviewSnapshotSchema } from "./source-rights-policy";

const UUID_SCHEMA = z.string().uuid();

const researchRunSchema = z
  .object({
    id: UUID_SCHEMA,
    briefId: UUID_SCHEMA.nullable(),
    status: z.enum(["draft", "in_progress", "completed"]),
    completedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .strict();

const frozenPackageSchema = z
  .object({
    manifest: z.unknown(),
    sources: z.array(z.unknown()),
    artifacts: z.array(z.unknown()),
    sha256: z.string(),
    frozenAt: z.string().datetime({ offset: true }),
  })
  .strict();

const rightsReviewRecordSchema = z
  .object({
    id: UUID_SCHEMA,
    sourceId: UUID_SCHEMA,
    snapshot: sourceRightsReviewSnapshotSchema,
  })
  .strict();

const humanReviewRecordSchema = z
  .object({
    briefId: UUID_SCHEMA,
    researchRunId: UUID_SCHEMA,
    decision: z.enum(["approved", "changes_requested"]),
    scope: z.literal("integral_method_package"),
    reviewerId: UUID_SCHEMA,
    reviewedAt: z.string().datetime({ offset: true }),
    reviewedPackageFrozenAt: z.string().datetime({ offset: true }),
    reviewedPackageSha256: z.string().regex(/^[0-9a-f]{64}$/),
    reviewPolicyVersion: z.string().trim().min(1),
    reviewedSourceLinkIds: z.array(UUID_SCHEMA),
    reviewedArtifactIds: z.array(UUID_SCHEMA),
  })
  .strict();

const completionInputSchema = z
  .object({
    briefId: UUID_SCHEMA,
    researchRun: z.unknown(),
    frozenPackage: z.unknown(),
    rightsReviews: z.array(z.unknown()),
    humanReview: z.unknown(),
  })
  .strict();

const activeReviewPolicyVersionSchema = z.string().trim().min(1).max(128);

export const METHOD_COMPLETION_BLOCKERS = [
  "invalid_input",
  "active_review_policy_unavailable",
  "brief_research_link_missing_or_mismatched",
  "research_not_completed",
  "research_completion_time_missing",
  "invalid_frozen_package",
  "package_research_run_mismatch",
  "package_hash_invalid_or_mismatched",
  "package_freeze_timestamp_mismatch",
  "timestamp_in_future",
  "unfinished_source_curation",
  "excluded_source_used_in_artifact",
  "source_rights_review_missing_or_invalid",
  "source_rights_snapshot_not_frozen",
  "source_rights_use_not_authorized",
  "source_rights_review_incomplete_or_expired",
  "invalid_human_review_record",
  "human_review_context_mismatch",
  "human_review_frozen_at_mismatch",
  "review_policy_not_current",
  "human_review_not_approved",
  "human_review_does_not_cover_entire_package",
  "human_review_hash_or_policy_mismatch",
  "human_review_not_after_package_freeze",
  "human_review_not_after_research_completion",
] as const;

export type MethodCompletionBlocker = (typeof METHOD_COMPLETION_BLOCKERS)[number];

export type MethodCompletionGateResult =
  | { readyForUse: true; packageSha256: string; blockers: [] }
  | { readyForUse: false; blockers: MethodCompletionBlocker[] };

function sameExactIds(actual: readonly string[], expected: readonly string[]): boolean {
  if (new Set(actual).size !== actual.length || actual.length !== expected.length) return false;
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  return actualSorted.every((id, index) => id === expectedSorted[index]);
}

function parseTimestampNanoseconds(value: string): bigint | null {
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) return null;

  const fraction = value.match(/\.(\d+)(?=(?:Z|[+-]\d{2}:\d{2})$)/i)?.[1] ?? "";
  if (fraction.length > 9) return null;

  const subMillisecondNanoseconds = fraction.slice(3).padEnd(6, "0");
  return (
    BigInt(milliseconds) * 1_000_000n +
    BigInt(subMillisecondNanoseconds.length ? subMillisecondNanoseconds : "0")
  );
}

function isContentUse(use: ContentUseMode): boolean {
  return (
    use === "internal_content_analysis" ||
    use === "commercial_method_derivation" ||
    use === "store_full_text" ||
    use === "publish_excerpt"
  );
}

/**
 * Fail-closed, local domain contract for a future trusted persistence adapter. The active policy
 * version is a separate required server-only argument and must be loaded from trusted server config.
 * This function does not itself authenticate an actor, persist evidence, or prove that database
 * records are genuine. It must not be presented as an operational authorization until connected to
 * validated server-side records and tested against the live backend.
 */
async function evaluateMethodCompletionGate(
  input: unknown,
  trustedActiveReviewPolicyVersion: unknown,
): Promise<MethodCompletionGateResult> {
  const parsedPolicy = activeReviewPolicyVersionSchema.safeParse(trustedActiveReviewPolicyVersion);
  if (!parsedPolicy.success) {
    return { readyForUse: false, blockers: ["active_review_policy_unavailable"] };
  }

  const parsedInput = completionInputSchema.safeParse(input);
  if (!parsedInput.success) return { readyForUse: false, blockers: ["invalid_input"] };

  const blockers = new Set<MethodCompletionBlocker>();
  const { briefId } = parsedInput.data;
  const activeReviewPolicyVersion = parsedPolicy.data;
  const runResult = researchRunSchema.safeParse(parsedInput.data.researchRun);
  const packageResult = frozenPackageSchema.safeParse(parsedInput.data.frozenPackage);
  const reviewResult = humanReviewRecordSchema.safeParse(parsedInput.data.humanReview);
  const rightsResults = parsedInput.data.rightsReviews.map((item) =>
    rightsReviewRecordSchema.safeParse(item),
  );

  if (!runResult.success) {
    blockers.add("research_not_completed");
  }
  if (!packageResult.success) {
    blockers.add("invalid_frozen_package");
  }
  if (!reviewResult.success) {
    blockers.add("invalid_human_review_record");
  }
  if (rightsResults.some((result) => !result.success)) {
    blockers.add("source_rights_review_missing_or_invalid");
  }

  if (!runResult.success || !packageResult.success || !reviewResult.success) {
    return { readyForUse: false, blockers: [...blockers].sort() };
  }

  const evaluatedAt = new Date();
  const evaluatedAtMs = evaluatedAt.getTime();
  const evaluatedAtNs = BigInt(evaluatedAtMs) * 1_000_000n;
  const run = runResult.data;
  const frozenPackage = packageResult.data;
  const review = reviewResult.data;
  const rightsReviews = rightsResults.flatMap((result) => (result.success ? [result.data] : []));

  if (!run.briefId || run.briefId !== briefId) {
    blockers.add("brief_research_link_missing_or_mismatched");
  }
  if (run.status !== "completed") blockers.add("research_not_completed");
  if (!run.completedAt) blockers.add("research_completion_time_missing");

  let envelope: ReturnType<typeof createPackageHashEnvelope> | null = null;
  try {
    envelope = createPackageHashEnvelope(
      frozenPackage.manifest,
      frozenPackage.sources,
      frozenPackage.artifacts,
    );
  } catch {
    blockers.add("invalid_frozen_package");
  }

  if (envelope) {
    if (envelope.manifest.research_run_id !== run.id) {
      blockers.add("package_research_run_mismatch");
    }
    if (review.briefId !== briefId || review.researchRunId !== run.id) {
      blockers.add("human_review_context_mismatch");
    }
    if (!isSha256Hex(frozenPackage.sha256)) {
      blockers.add("package_hash_invalid_or_mismatched");
    } else {
      try {
        const calculatedHash = await calculatePackageSha256(
          frozenPackage.manifest,
          frozenPackage.sources,
          frozenPackage.artifacts,
        );
        if (calculatedHash !== frozenPackage.sha256) {
          blockers.add("package_hash_invalid_or_mismatched");
        }
      } catch {
        blockers.add("package_hash_invalid_or_mismatched");
      }
    }

    const completedAtNs = run.completedAt ? parseTimestampNanoseconds(run.completedAt) : null;
    const frozenAtNs = parseTimestampNanoseconds(frozenPackage.frozenAt);
    if (
      run.completedAt &&
      (completedAtNs === null || frozenAtNs === null || frozenAtNs !== completedAtNs)
    ) {
      blockers.add("package_freeze_timestamp_mismatch");
    }
    if (
      (completedAtNs !== null && completedAtNs > evaluatedAtNs) ||
      (frozenAtNs !== null && frozenAtNs > evaluatedAtNs)
    ) {
      blockers.add("timestamp_in_future");
    }

    const rightsById = new Map(rightsReviews.map((record) => [record.id, record]));
    if (rightsById.size !== rightsReviews.length) {
      blockers.add("source_rights_review_missing_or_invalid");
    }

    for (const sourceLink of envelope.sources) {
      if (sourceLink.selection_status === "considered") {
        blockers.add("unfinished_source_curation");
        continue;
      }
      if (sourceLink.selection_status === "excluded") {
        if (
          envelope.artifacts.some((artifact) => artifact.research_run_source_id === sourceLink.id)
        ) {
          blockers.add("excluded_source_used_in_artifact");
        }
        continue;
      }

      const rightsRecord = rightsById.get(sourceLink.rights_review_id);
      if (!rightsRecord || rightsRecord.sourceId !== sourceLink.source_id) {
        blockers.add("source_rights_review_missing_or_invalid");
        continue;
      }

      const frozenRightsSnapshot = sourceLink.source_snapshot["rights_review_snapshot"];
      try {
        if (
          frozenRightsSnapshot === undefined ||
          canonicalizeJson(frozenRightsSnapshot) !== canonicalizeJson(rightsRecord.snapshot)
        ) {
          blockers.add("source_rights_snapshot_not_frozen");
        }
      } catch {
        blockers.add("source_rights_snapshot_not_frozen");
      }

      const snapshot = rightsRecord.snapshot;
      const reviewedAtNs = snapshot.reviewedAt
        ? parseTimestampNanoseconds(snapshot.reviewedAt)
        : null;
      const validUntilDate = snapshot.validUntil;
      const frozenAtDate =
        frozenAtNs === null ? null : new Date(frozenPackage.frozenAt).toISOString().slice(0, 10);
      const selectedUseIsPermitted = snapshot.permittedUses.includes(sourceLink.content_use_mode);
      const completeRightsReview =
        snapshot.status !== "pending" &&
        snapshot.status !== "restricted" &&
        snapshot.status !== "revoked" &&
        Boolean(snapshot.evidenceUrl && snapshot.reviewerId && snapshot.reviewedAt) &&
        validUntilDate !== null &&
        snapshot.restrictionsReviewed &&
        snapshot.restrictionsSatisfied &&
        reviewedAtNs !== null &&
        frozenAtDate !== null &&
        frozenAtNs !== null &&
        reviewedAtNs < frozenAtNs &&
        reviewedAtNs <= evaluatedAtNs &&
        validUntilDate >= frozenAtDate &&
        validUntilDate >= evaluatedAt.toISOString().slice(0, 10);

      if (!selectedUseIsPermitted) blockers.add("source_rights_use_not_authorized");
      if (!completeRightsReview) {
        blockers.add("source_rights_review_incomplete_or_expired");
      }
      if (isContentUse(sourceLink.content_use_mode)) {
        const decision = evaluateSourceContentUse(
          snapshot,
          sourceLink.content_use_mode,
          evaluatedAt,
        );
        if (!decision.allowed) blockers.add("source_rights_use_not_authorized");
      }
    }

    if (
      !sameExactIds(
        review.reviewedSourceLinkIds,
        envelope.sources.map((source) => source.id),
      )
    ) {
      blockers.add("human_review_does_not_cover_entire_package");
    }
    if (
      !sameExactIds(
        review.reviewedArtifactIds,
        envelope.artifacts.map((artifact) => artifact.id),
      )
    ) {
      blockers.add("human_review_does_not_cover_entire_package");
    }
    if (
      review.reviewedPackageSha256 !== frozenPackage.sha256 ||
      review.reviewPolicyVersion !== envelope.manifest.review_policy_version
    ) {
      blockers.add("human_review_hash_or_policy_mismatch");
    }
    if (review.reviewedPackageFrozenAt !== frozenPackage.frozenAt) {
      blockers.add("human_review_frozen_at_mismatch");
    }
    if (review.reviewPolicyVersion !== activeReviewPolicyVersion) {
      blockers.add("review_policy_not_current");
    }
  }

  const reviewedAtNs = parseTimestampNanoseconds(review.reviewedAt);
  const frozenAtNs = parseTimestampNanoseconds(frozenPackage.frozenAt);
  if (review.decision !== "approved") blockers.add("human_review_not_approved");
  if (reviewedAtNs === null || frozenAtNs === null || reviewedAtNs <= frozenAtNs) {
    blockers.add("human_review_not_after_package_freeze");
  }
  if (reviewedAtNs !== null && reviewedAtNs > evaluatedAtNs) {
    blockers.add("timestamp_in_future");
  }
  const completedAtNs = run.completedAt ? parseTimestampNanoseconds(run.completedAt) : null;
  if (completedAtNs !== null && reviewedAtNs !== null && reviewedAtNs <= completedAtNs) {
    blockers.add("human_review_not_after_research_completion");
  }

  if (blockers.size > 0 || !envelope) {
    return { readyForUse: false, blockers: [...blockers].sort() };
  }
  return { readyForUse: true, packageSha256: frozenPackage.sha256, blockers: [] };
}

/** Server-only entry point; it is not connected to application persistence or approval UI. */
export const evaluateMethodCompletionGateServer = createServerOnlyFn(evaluateMethodCompletionGate);

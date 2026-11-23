import { createServerOnlyFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertPostgresJsonbV2ValuePolicy } from "../package-contract";

export const INTEGRAL_REVIEW_INPUT_SCHEMA_VERSION = "mow-gki-integral-review-input/v1" as const;
export const INTEGRAL_REVIEW_FINDINGS_SCHEMA_VERSION = "mow-gki-integral-review/v1" as const;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const UUID_SCHEMA = z.string().regex(UUID_PATTERN);
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const assessmentSchema = z.enum(["satisfactory", "changes_requested"]);
const shortFindingSchema = z.string().trim().min(1).max(2_000);

const sourceAssessmentSchema = z
  .object({
    source_link_id: UUID_SCHEMA,
    assessment: assessmentSchema,
    rationale: shortFindingSchema,
  })
  .strict();

const artifactAssessmentSchema = z
  .object({
    artifact_id: UUID_SCHEMA,
    assessment: assessmentSchema,
    rationale: shortFindingSchema,
  })
  .strict();

const reviewSubmissionSchema = z
  .object({
    schema_version: z.literal(INTEGRAL_REVIEW_INPUT_SCHEMA_VERSION),
    decision: z.enum(["approved", "changes_requested"]),
    source_assessments: z.array(sourceAssessmentSchema),
    artifact_assessments: z.array(artifactAssessmentSchema),
    method_findings: z.array(shortFindingSchema),
  })
  .strict();

const trustedReviewContextSchema = z
  .object({
    package_schema_version: z.string().trim().min(1).max(128),
    hash_algorithm: z.string().trim().min(1).max(128),
    package_sha256: z.string().regex(SHA256_PATTERN),
    package_frozen_at: z.string().datetime({ offset: true }),
    package_review_policy_version: z.string().trim().min(1).max(128),
    active_review_policy_version: z.string().trim().min(1).max(128),
    source_link_ids: z.array(UUID_SCHEMA),
    artifact_ids: z.array(UUID_SCHEMA),
  })
  .strict();

const persistedFindingsSchema = z
  .object({
    schema_version: z.literal(INTEGRAL_REVIEW_FINDINGS_SCHEMA_VERSION),
    package_schema_version: z.string().trim().min(1).max(128),
    hash_algorithm: z.string().trim().min(1).max(128),
    package_sha256: z.string().regex(SHA256_PATTERN),
    package_frozen_at: z.string().datetime({ offset: true }),
    review_policy_version: z.string().trim().min(1).max(128),
    decision: z.enum(["approved", "changes_requested"]),
    reviewed_source_link_ids: z.array(UUID_SCHEMA),
    reviewed_artifact_ids: z.array(UUID_SCHEMA),
    source_assessments: z.array(sourceAssessmentSchema),
    artifact_assessments: z.array(artifactAssessmentSchema),
    method_findings: z.array(shortFindingSchema),
  })
  .strict();

type ReviewSubmissionV1 = z.infer<typeof reviewSubmissionSchema>;
type TrustedReviewContext = z.infer<typeof trustedReviewContextSchema>;
export type IntegralReviewFindingsV1 = z.infer<typeof persistedFindingsSchema>;

function fail(message: string): never {
  throw new TypeError(message);
}

function parseOrFail<T>(schema: z.ZodType<T>, input: unknown, label: string): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) fail(`${label} inválido.`);
  return parsed.data;
}

function sameExactIds(actual: readonly string[], expected: readonly string[]): boolean {
  if (new Set(actual).size !== actual.length || new Set(expected).size !== expected.length) {
    return false;
  }
  if (actual.length !== expected.length) return false;

  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  return actualSorted.every((id, index) => id === expectedSorted[index]);
}

function compareIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/**
 * Candidate-only builder for a strict, versioned human-review findings value.
 * The submission contains no actor, time, package hash, or policy version; those
 * values must come from an authenticated server adapter and trusted persistence.
 * This function neither authenticates the reviewer nor persists the result.
 */
function createIntegralReviewFindingsV1Raw(
  submissionInput: unknown,
  trustedContextInput: unknown,
): IntegralReviewFindingsV1 {
  const submission: ReviewSubmissionV1 = parseOrFail(
    reviewSubmissionSchema,
    submissionInput,
    "Revisão integral",
  );
  const context: TrustedReviewContext = parseOrFail(
    trustedReviewContextSchema,
    trustedContextInput,
    "Contexto confiável do pacote",
  );

  if (context.package_review_policy_version !== context.active_review_policy_version) {
    fail("A política ativa diverge da política congelada no pacote.");
  }

  const reviewedSourceLinkIds = submission.source_assessments.map(
    (assessment) => assessment.source_link_id,
  );
  const reviewedArtifactIds = submission.artifact_assessments.map(
    (assessment) => assessment.artifact_id,
  );

  if (!sameExactIds(reviewedSourceLinkIds, context.source_link_ids)) {
    fail("As avaliações de fontes devem cobrir exatamente os vínculos do pacote.");
  }
  if (!sameExactIds(reviewedArtifactIds, context.artifact_ids)) {
    fail("As avaliações devem cobrir exatamente os artefatos do pacote.");
  }

  const hasRequestedChanges =
    submission.source_assessments.some(
      (assessment) => assessment.assessment === "changes_requested",
    ) ||
    submission.artifact_assessments.some(
      (assessment) => assessment.assessment === "changes_requested",
    );

  if (submission.decision === "approved" && hasRequestedChanges) {
    fail("Uma revisão aprovada não pode conter avaliações que solicitem alterações.");
  }
  if (
    submission.decision === "changes_requested" &&
    !hasRequestedChanges &&
    submission.method_findings.length === 0
  ) {
    fail("Uma revisão que solicita alterações precisa registrar ao menos um achado.");
  }

  const findings = parseOrFail(
    persistedFindingsSchema,
    {
      schema_version: INTEGRAL_REVIEW_FINDINGS_SCHEMA_VERSION,
      package_schema_version: context.package_schema_version,
      hash_algorithm: context.hash_algorithm,
      package_sha256: context.package_sha256,
      package_frozen_at: context.package_frozen_at,
      review_policy_version: context.active_review_policy_version,
      decision: submission.decision,
      reviewed_source_link_ids: [...reviewedSourceLinkIds].sort(compareIds),
      reviewed_artifact_ids: [...reviewedArtifactIds].sort(compareIds),
      source_assessments: [...submission.source_assessments].sort((left, right) =>
        compareIds(left.source_link_id, right.source_link_id),
      ),
      artifact_assessments: [...submission.artifact_assessments].sort((left, right) =>
        compareIds(left.artifact_id, right.artifact_id),
      ),
      method_findings: submission.method_findings,
    },
    "Findings de revisão integral",
  );

  return validatePersistedIntegralReviewFindingsV1Raw(findings, context);
}

/**
 * Candidate-only validator for a value loaded from persistence. The caller must
 * separately authenticate and supply context from the frozen package and active
 * server policy; this function is not a database reader or authorization check.
 */
function validatePersistedIntegralReviewFindingsV1Raw(
  findingsInput: unknown,
  trustedContextInput: unknown,
): IntegralReviewFindingsV1 {
  const findings: IntegralReviewFindingsV1 = parseOrFail(
    persistedFindingsSchema,
    findingsInput,
    "Findings persistidos de revisão integral",
  );
  const context: TrustedReviewContext = parseOrFail(
    trustedReviewContextSchema,
    trustedContextInput,
    "Contexto confiável do pacote",
  );

  if (context.package_review_policy_version !== context.active_review_policy_version) {
    fail("A política ativa diverge da política congelada no pacote.");
  }
  if (
    findings.package_schema_version !== context.package_schema_version ||
    findings.hash_algorithm !== context.hash_algorithm ||
    findings.package_sha256 !== context.package_sha256 ||
    findings.package_frozen_at !== context.package_frozen_at ||
    findings.review_policy_version !== context.active_review_policy_version
  ) {
    fail("Os findings não correspondem ao pacote congelado e à política ativa.");
  }
  if (
    !sameExactIds(findings.reviewed_source_link_ids, context.source_link_ids) ||
    !sameExactIds(
      findings.source_assessments.map((assessment) => assessment.source_link_id),
      context.source_link_ids,
    )
  ) {
    fail("Os findings não cobrem exatamente os vínculos congelados.");
  }
  if (
    !sameExactIds(findings.reviewed_artifact_ids, context.artifact_ids) ||
    !sameExactIds(
      findings.artifact_assessments.map((assessment) => assessment.artifact_id),
      context.artifact_ids,
    )
  ) {
    fail("Os findings não cobrem exatamente os artefatos congelados.");
  }

  const hasRequestedChanges =
    findings.source_assessments.some(
      (assessment) => assessment.assessment === "changes_requested",
    ) ||
    findings.artifact_assessments.some(
      (assessment) => assessment.assessment === "changes_requested",
    );
  if (findings.decision === "approved" && hasRequestedChanges) {
    fail("Findings aprovados contêm avaliação que solicita alterações.");
  }
  if (
    findings.decision === "changes_requested" &&
    !hasRequestedChanges &&
    findings.method_findings.length === 0
  ) {
    fail("Findings que solicitam alterações não registram justificativa.");
  }

  assertPostgresJsonbV2ValuePolicy(findings);
  return findings;
}

/** Server-only builders; neither function is an authorization or persistence boundary. */
export const createIntegralReviewFindingsV1 = createServerOnlyFn(createIntegralReviewFindingsV1Raw);
export const validatePersistedIntegralReviewFindingsV1 = createServerOnlyFn(
  validatePersistedIntegralReviewFindingsV1Raw,
);

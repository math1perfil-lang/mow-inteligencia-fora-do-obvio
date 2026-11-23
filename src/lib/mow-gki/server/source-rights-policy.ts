import { z } from "zod";

export const SOURCE_RIGHTS_STATUSES = [
  "pending",
  "reference_only",
  "open_license_verified",
  "license_scoped",
  "explicit_permission",
  "public_domain_verified",
  "restricted",
  "revoked",
] as const;

export const SOURCE_PERMITTED_USES = [
  "catalog_metadata",
  "link_and_citation",
  "internal_content_analysis",
  "commercial_method_derivation",
  "store_full_text",
  "publish_excerpt",
] as const;

const CONTENT_USES = [
  "internal_content_analysis",
  "commercial_method_derivation",
  "store_full_text",
  "publish_excerpt",
] as const;

const CONTENT_AUTHORIZING_STATUSES = new Set<string>([
  "open_license_verified",
  "license_scoped",
  "explicit_permission",
  "public_domain_verified",
]);
const REFERENCE_USES = new Set<string>(["catalog_metadata", "link_and_citation"]);
const CONTENT_USE_SET = new Set<string>(CONTENT_USES);

export type SourceRightsStatus = (typeof SOURCE_RIGHTS_STATUSES)[number];
export type SourcePermittedUse = (typeof SOURCE_PERMITTED_USES)[number];
export type SourceContentUse = (typeof CONTENT_USES)[number];

const secureEvidenceUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  }, "A evidência de direitos deve ser uma URL HTTPS sem credenciais.");

const utcCalendarDateSchema = z
  .string()
  .regex(/^(?!0000)\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "A validade deve ser uma data de calendário válida no formato YYYY-MM-DD.");

/**
 * A rights decision is an item-specific, human-reviewed snapshot. OpenAlex
 * metadata licensing is not an input that grants rights to the indexed work.
 * `restrictionsSatisfied` attests that a trusted reviewer reconciled every
 * recorded restriction against every permitted use and can meet its conditions;
 * this module does not parse or interpret the free-text restrictions.
 */
export const sourceRightsReviewSnapshotSchema = z
  .object({
    status: z.enum(SOURCE_RIGHTS_STATUSES),
    permittedUses: z.array(z.enum(SOURCE_PERMITTED_USES)).max(SOURCE_PERMITTED_USES.length),
    restrictions: z.array(z.string().trim().min(1).max(2_000)).max(50),
    restrictionsReviewed: z.boolean(),
    restrictionsSatisfied: z.boolean(),
    evidenceUrl: secureEvidenceUrlSchema.nullable(),
    reviewerId: z.string().uuid().nullable(),
    reviewedAt: z.string().datetime({ offset: true }).nullable(),
    validUntil: utcCalendarDateSchema.nullable(),
  })
  .strict()
  .superRefine((review, context) => {
    if (new Set(review.permittedUses).size !== review.permittedUses.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["permittedUses"],
        message: "Os usos permitidos não podem conter duplicatas.",
      });
    }

    const includesContentUse = review.permittedUses.some((use) => CONTENT_USE_SET.has(use));
    if (includesContentUse && !CONTENT_AUTHORIZING_STATUSES.has(review.status)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["permittedUses"],
        message: "Esse estado de direitos não pode habilitar processamento de conteúdo.",
      });
    }

    if (
      review.status === "reference_only" &&
      review.permittedUses.some((use) => !REFERENCE_USES.has(use))
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["permittedUses"],
        message: "Uma fonte reference_only só pode permitir metadados de catálogo e referência.",
      });
    }

    if (
      review.reviewedAt &&
      review.validUntil &&
      review.validUntil < new Date(review.reviewedAt).toISOString().slice(0, 10)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["validUntil"],
        message: "A validade não pode terminar antes do dia UTC da revisão.",
      });
    }
  });

export type SourceRightsReviewSnapshot = z.infer<typeof sourceRightsReviewSnapshotSchema>;

export type SourceRightsDenialReason =
  | "unsupported_use"
  | "not_a_content_use"
  | "invalid_evaluation_time"
  | "invalid_review"
  | "rights_state_not_authorizing_content"
  | "use_not_permitted"
  | "incomplete_review"
  | "restrictions_unresolved"
  | "review_from_future"
  | "review_expired";

export type SourceRightsDecision =
  { allowed: true; use: SourceContentUse } | { allowed: false; reason: SourceRightsDenialReason };

/**
 * Fail-closed gate for processing source content. It does not fetch, infer, or
 * grant licenses. It requires an explicit recheck/validity date for every
 * content use. It does not authenticate the reviewer or verify the evidence;
 * callers must obtain the snapshot through a trusted human-review workflow.
 * The `server/` path alone is not an authorization barrier; invoke this only
 * from trusted server code. Metadata/link handling is a separate operation.
 */
export function evaluateSourceContentUse(
  reviewValue: unknown,
  useValue: unknown,
  evaluatedAt: unknown = new Date(),
): SourceRightsDecision {
  if (
    typeof useValue !== "string" ||
    !SOURCE_PERMITTED_USES.includes(useValue as SourcePermittedUse)
  ) {
    return { allowed: false, reason: "unsupported_use" };
  }
  if (!CONTENT_USE_SET.has(useValue)) return { allowed: false, reason: "not_a_content_use" };
  if (!(evaluatedAt instanceof Date) || !Number.isFinite(evaluatedAt.getTime())) {
    return { allowed: false, reason: "invalid_evaluation_time" };
  }

  const parsedReview = sourceRightsReviewSnapshotSchema.safeParse(reviewValue);
  if (!parsedReview.success) return { allowed: false, reason: "invalid_review" };
  const review = parsedReview.data;

  if (!CONTENT_AUTHORIZING_STATUSES.has(review.status)) {
    return { allowed: false, reason: "rights_state_not_authorizing_content" };
  }
  if (!review.permittedUses.includes(useValue as SourceContentUse)) {
    return { allowed: false, reason: "use_not_permitted" };
  }
  if (
    !review.evidenceUrl ||
    !review.reviewerId ||
    !review.reviewedAt ||
    !review.validUntil ||
    !review.restrictionsReviewed
  ) {
    return { allowed: false, reason: "incomplete_review" };
  }
  if (!review.restrictionsSatisfied) {
    return { allowed: false, reason: "restrictions_unresolved" };
  }

  const reviewedAt = Date.parse(review.reviewedAt);
  if (reviewedAt > evaluatedAt.getTime()) {
    return { allowed: false, reason: "review_from_future" };
  }
  if (review.validUntil < evaluatedAt.toISOString().slice(0, 10)) {
    return { allowed: false, reason: "review_expired" };
  }

  return { allowed: true, use: useValue as SourceContentUse };
}

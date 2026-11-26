import { z } from "zod";
import {
  SOURCE_PERMITTED_USES,
  SOURCE_RIGHTS_STATUSES,
  type SourcePermittedUse,
} from "./source-rights-policy";

const uuidSchema = z.string().uuid();
const calendarDateSchema = z
  .string()
  .regex(/^(?!0000)\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  });
const rightsStatusSchema = z.enum(SOURCE_RIGHTS_STATUSES);
const permittedUseSchema = z.enum(SOURCE_PERMITTED_USES);
const httpsEvidenceUrlSchema = z
  .string()
  .trim()
  .max(2_048)
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  }, "A evidência deve ser uma URL HTTPS sem credenciais.");

export const sourceRightsSearchInputSchema = z
  .object({ query: z.string().trim().min(2).max(100) })
  .strict();

export const sourceRightsReviewSubmissionSchema = z
  .object({
    sourceId: uuidSchema,
    decisionStatus: rightsStatusSchema,
    permittedUses: z.array(permittedUseSchema).max(SOURCE_PERMITTED_USES.length),
    rightsBasis: z.string().trim().max(4_000),
    rightsEvidenceUrl: z.union([httpsEvidenceUrlSchema, z.literal("")]),
    restrictions: z.string().max(2_000),
    restrictionsReviewed: z.boolean(),
    restrictionsSatisfied: z.boolean(),
    validUntil: z.union([calendarDateSchema, z.literal("")]),
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

    const includesContentUse = review.permittedUses.some((use) =>
      [
        "internal_content_analysis",
        "commercial_method_derivation",
        "store_full_text",
        "publish_excerpt",
      ].includes(use),
    );
    const authorizingStatus = [
      "open_license_verified",
      "license_scoped",
      "explicit_permission",
      "public_domain_verified",
    ].includes(review.decisionStatus);

    if (
      ["pending", "reference_only"].includes(review.decisionStatus) &&
      review.permittedUses.some((use) => !["catalog_metadata", "link_and_citation"].includes(use))
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["permittedUses"],
        message: "Fontes pendentes ou apenas referenciais só permitem metadados e citação.",
      });
    }
    if (
      ["restricted", "revoked"].includes(review.decisionStatus) &&
      review.permittedUses.length > 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["permittedUses"],
        message: "Fontes restritas ou revogadas não podem receber novos usos permitidos.",
      });
    }
    if (authorizingStatus && (!review.rightsBasis.trim() || !review.rightsEvidenceUrl)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rightsEvidenceUrl"],
        message: "Uma decisão afirmativa exige fundamento e evidência HTTPS.",
      });
    }
    if (review.restrictionsSatisfied && !review.restrictionsReviewed) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["restrictionsSatisfied"],
        message: "Não é possível declarar restrições satisfeitas sem revisá-las.",
      });
    }
    if (review.restrictions.trim() && !review.restrictionsReviewed) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["restrictionsReviewed"],
        message: "As restrições registradas precisam ser revisadas explicitamente.",
      });
    }
    if (
      includesContentUse &&
      (!authorizingStatus ||
        !review.rightsBasis.trim() ||
        !review.rightsEvidenceUrl ||
        !review.validUntil ||
        !review.restrictionsReviewed ||
        !review.restrictionsSatisfied)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["permittedUses"],
        message:
          "Uso de conteúdo exige estado autorizador, fundamento, evidência, validade e restrições revisadas e satisfeitas.",
      });
    }
  });

export const sourceRightsSearchRowSchema = z
  .object({
    source_id: uuidSchema,
    title: z.string().min(1).max(2_000),
    source_type: z.string().min(1).max(200),
    canonical_url: z.string().nullable(),
    catalog_rights_status: z.string().min(1).max(200),
    rights_review_id: uuidSchema.nullable(),
    decision_status: rightsStatusSchema.nullable(),
    permitted_uses: z.array(permittedUseSchema).nullable(),
    rights_basis: z.string().nullable(),
    rights_evidence_url: z.string().nullable(),
    restrictions: z.string().nullable(),
    reviewed_by: uuidSchema.nullable(),
    reviewed_at: z.string().datetime({ offset: true }).nullable(),
    valid_until: calendarDateSchema.nullable(),
    restrictions_reviewed: z.boolean().nullable(),
    restrictions_satisfied: z.boolean().nullable(),
  })
  .strict();

export const sourceRightsSearchRowsSchema = z.array(sourceRightsSearchRowSchema).max(50);

export const recordedSourceRightsReviewSchema = z
  .object({
    rights_review_id: uuidSchema,
    source_id: uuidSchema,
    decision_version: z.number().int().positive(),
    decision_status: rightsStatusSchema,
    permitted_uses: z.array(permittedUseSchema),
    reviewed_by: uuidSchema,
    reviewed_at: z.string().datetime({ offset: true }),
    valid_until: calendarDateSchema.nullable(),
    restrictions_reviewed: z.boolean(),
    restrictions_satisfied: z.boolean(),
  })
  .strict();

export type SourceRightsReviewSubmission = z.infer<typeof sourceRightsReviewSubmissionSchema>;
export type SourceRightsSearchRow = z.infer<typeof sourceRightsSearchRowSchema>;
export type SourceRightsSearchRows = z.infer<typeof sourceRightsSearchRowsSchema>;
export type RecordedSourceRightsReview = z.infer<typeof recordedSourceRightsReviewSchema>;
export type RightsReviewRpcPayload = {
  decision_status: SourceRightsReviewSubmission["decisionStatus"];
  permitted_uses: SourcePermittedUse[];
  rights_basis: string | null;
  rights_evidence_url: string | null;
  restrictions: string;
  restrictions_reviewed: boolean;
  restrictions_satisfied: boolean;
  valid_until: string | null;
};

export function toRightsReviewRpcPayload(input: unknown): RightsReviewRpcPayload {
  const review = sourceRightsReviewSubmissionSchema.parse(input);
  return {
    decision_status: review.decisionStatus,
    permitted_uses: review.permittedUses,
    rights_basis: review.rightsBasis.trim() || null,
    rights_evidence_url: review.rightsEvidenceUrl || null,
    restrictions: review.restrictions,
    restrictions_reviewed: review.restrictionsReviewed,
    restrictions_satisfied: review.restrictionsSatisfied,
    valid_until: review.validUntil || null,
  };
}

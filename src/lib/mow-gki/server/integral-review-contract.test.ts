import { describe, expect, it } from "vitest";
import {
  createIntegralReviewFindingsV1,
  INTEGRAL_REVIEW_FINDINGS_SCHEMA_VERSION,
  INTEGRAL_REVIEW_INPUT_SCHEMA_VERSION,
  validatePersistedIntegralReviewFindingsV1,
} from "./integral-review-contract";

const SOURCE_LINK_A = "00000000-0000-0000-0000-000000000001";
const SOURCE_LINK_B = "00000000-0000-0000-0000-000000000002";
const ARTIFACT_A = "00000000-0000-0000-0000-000000000003";
const ARTIFACT_B = "00000000-0000-0000-0000-000000000004";
const PACKAGE_HASH = "a".repeat(64);

function trustedContext() {
  return {
    package_schema_version: "mow-gki-package/v2",
    hash_algorithm: "pg-jsonb-text-sha256/v1",
    package_sha256: PACKAGE_HASH,
    package_frozen_at: "2026-01-01T10:00:00.000Z",
    package_review_policy_version: "integral-review-v1",
    active_review_policy_version: "integral-review-v1",
    source_link_ids: [SOURCE_LINK_A, SOURCE_LINK_B],
    artifact_ids: [ARTIFACT_A, ARTIFACT_B],
  };
}

function approvedSubmission() {
  return {
    schema_version: INTEGRAL_REVIEW_INPUT_SCHEMA_VERSION,
    decision: "approved",
    source_assessments: [
      {
        source_link_id: SOURCE_LINK_B,
        assessment: "satisfactory",
        rationale: "A atribuição e o modo de uso foram revisados.",
      },
      {
        source_link_id: SOURCE_LINK_A,
        assessment: "satisfactory",
        rationale: "A decisão de direitos congelada foi conferida.",
      },
    ],
    artifact_assessments: [
      { artifact_id: ARTIFACT_B, assessment: "satisfactory", rationale: "Síntese conferida." },
      { artifact_id: ARTIFACT_A, assessment: "satisfactory", rationale: "Pacote final conferido." },
    ],
    method_findings: [],
  };
}

describe("candidate integral review findings contract", () => {
  it("binds a complete human assessment to trusted package and policy context", () => {
    const findings = createIntegralReviewFindingsV1(approvedSubmission(), trustedContext());

    expect(findings.schema_version).toBe(INTEGRAL_REVIEW_FINDINGS_SCHEMA_VERSION);
    expect(findings.package_sha256).toBe(PACKAGE_HASH);
    expect(findings.package_frozen_at).toBe("2026-01-01T10:00:00.000Z");
    expect(findings.review_policy_version).toBe("integral-review-v1");
    expect(findings.reviewed_source_link_ids).toEqual([SOURCE_LINK_A, SOURCE_LINK_B]);
    expect(findings.reviewed_artifact_ids).toEqual([ARTIFACT_A, ARTIFACT_B]);
    expect(findings.source_assessments.map((item) => item.source_link_id)).toEqual([
      SOURCE_LINK_A,
      SOURCE_LINK_B,
    ]);
    expect(findings.artifact_assessments.map((item) => item.artifact_id)).toEqual([
      ARTIFACT_A,
      ARTIFACT_B,
    ]);
    expect(findings).not.toHaveProperty("reviewer_id");
    expect(findings).not.toHaveProperty("reviewed_at");
  });

  it("validates persisted context, exact assessment coverage, and decision consistency", () => {
    const findings = createIntegralReviewFindingsV1(approvedSubmission(), trustedContext());
    expect(validatePersistedIntegralReviewFindingsV1(findings, trustedContext())).toEqual(findings);

    const alteredHash = { ...findings, package_sha256: "b".repeat(64) };
    expect(() => validatePersistedIntegralReviewFindingsV1(alteredHash, trustedContext())).toThrow(
      /não correspondem ao pacote congelado/,
    );

    const incompleteAssessments = {
      ...findings,
      source_assessments: findings.source_assessments.slice(1),
    };
    expect(() =>
      validatePersistedIntegralReviewFindingsV1(incompleteAssessments, trustedContext()),
    ).toThrow(/não cobrem exatamente os vínculos/);

    const emptyChangesRequest = { ...findings, decision: "changes_requested" };
    expect(() =>
      validatePersistedIntegralReviewFindingsV1(emptyChangesRequest, trustedContext()),
    ).toThrow(/não registram justificativa/);
  });

  it("allows a package with no source links while requiring exact artifact coverage", () => {
    const context = {
      ...trustedContext(),
      source_link_ids: [],
    };
    const submission = {
      ...approvedSubmission(),
      source_assessments: [],
    };

    expect(() => createIntegralReviewFindingsV1(submission, context)).not.toThrow();
  });

  it("rejects omitted, extra, or duplicate package IDs", () => {
    const omitted = {
      ...approvedSubmission(),
      source_assessments: approvedSubmission().source_assessments.slice(1),
    };
    const duplicate = {
      ...approvedSubmission(),
      artifact_assessments: [
        ...approvedSubmission().artifact_assessments,
        approvedSubmission().artifact_assessments[0],
      ],
    };

    expect(() => createIntegralReviewFindingsV1(omitted, trustedContext())).toThrow(
      /cobrir exatamente os vínculos/,
    );
    expect(() => createIntegralReviewFindingsV1(duplicate, trustedContext())).toThrow(
      /cobrir exatamente os artefatos/,
    );
  });

  it("does not permit approval when an item requests changes or an empty rejection", () => {
    const inconsistent = approvedSubmission();
    inconsistent.artifact_assessments[0]!.assessment = "changes_requested";

    expect(() => createIntegralReviewFindingsV1(inconsistent, trustedContext())).toThrow(
      /não pode conter avaliações/,
    );

    const emptyChangesRequest = {
      ...approvedSubmission(),
      decision: "changes_requested",
    };
    expect(() => createIntegralReviewFindingsV1(emptyChangesRequest, trustedContext())).toThrow(
      /ao menos um achado/,
    );
  });

  it("rejects caller-supplied actor/hash context, stale policy, and JSONB-incompatible text", () => {
    const callerContext = { ...trustedContext(), reviewer_id: SOURCE_LINK_A };
    const callerSubmission = {
      ...approvedSubmission(),
      reviewer_id: SOURCE_LINK_A,
      reviewed_at: "2026-01-02T10:00:00.000Z",
      package_sha256: PACKAGE_HASH,
    };
    const stalePolicy = { ...trustedContext(), active_review_policy_version: "integral-review-v2" };
    const nulNote = { ...approvedSubmission(), method_findings: ["U+0000\u0000"] };

    expect(() => createIntegralReviewFindingsV1(callerSubmission, trustedContext())).toThrow(
      /Revisão integral inválido/,
    );
    expect(() => createIntegralReviewFindingsV1(approvedSubmission(), callerContext)).toThrow(
      /Contexto confiável do pacote inválido/,
    );
    expect(() => createIntegralReviewFindingsV1(approvedSubmission(), stalePolicy)).toThrow(
      /política ativa diverge/,
    );
    expect(() => createIntegralReviewFindingsV1(nulNote, trustedContext())).toThrow(/U\+0000/);
  });
});

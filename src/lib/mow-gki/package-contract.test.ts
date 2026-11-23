import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  calculatePackageSha256,
  canonicalizeJson,
  createPackageHashEnvelope,
  assertPostgresJsonbV2ValuePolicy,
  isSha256Hex,
  parsePackageManifestV1,
  type PackageArtifact,
  type PackageManifestV1,
  type PackageSourceLink,
} from "./package-contract";

const RUN_ID = "00000000-0000-0000-0000-000000000001";
const SOURCE_A = "00000000-0000-0000-0000-000000000002";
const LINK_A = "00000000-0000-0000-0000-000000000003";
const FINAL_ARTIFACT = "00000000-0000-0000-0000-000000000004";
const SYNTHESIS_ARTIFACT = "00000000-0000-0000-0000-000000000005";
const RIGHTS_A = "00000000-0000-0000-0000-000000000006";
const SOURCE_B = "00000000-0000-0000-0000-000000000007";
const LINK_B = "00000000-0000-0000-0000-000000000008";
const RIGHTS_B = "00000000-0000-0000-0000-000000000009";

function validManifest(): PackageManifestV1 {
  return {
    schema_version: "mow-gki-package/v1",
    research_run_id: RUN_ID,
    protocol_version: "v1",
    review_policy_version: "policy-v1",
    final_package_artifact_id: FINAL_ARTIFACT,
    source_ids: [SOURCE_A, SOURCE_B],
    artifact_ids: [FINAL_ARTIFACT, SYNTHESIS_ARTIFACT],
    limitations: ["synthetic limitation"],
  };
}

function sourceLink(
  id: string,
  sourceId: string,
  rightsReviewId: string,
  contentUseMode: PackageSourceLink["content_use_mode"] = "internal_content_analysis",
): PackageSourceLink {
  return {
    id,
    source_id: sourceId,
    rights_review_id: rightsReviewId,
    content_use_mode: contentUseMode,
    selection_status: "included",
    source_snapshot: { original_title: `Synthetic ${sourceId}` },
    selection_note: "",
  };
}

function validSources(): PackageSourceLink[] {
  return [sourceLink(LINK_A, SOURCE_A, RIGHTS_A), sourceLink(LINK_B, SOURCE_B, RIGHTS_B)];
}

function validArtifacts(): PackageArtifact[] {
  return [
    {
      id: FINAL_ARTIFACT,
      research_run_source_id: null,
      artifact_type: "final_package",
      artifact_payload: { outcome: "synthetic-complete" },
      contains_verbatim_text: false,
    },
    {
      id: SYNTHESIS_ARTIFACT,
      research_run_source_id: LINK_A,
      artifact_type: "synthesis",
      artifact_payload: { summary: "synthetic original synthesis" },
      contains_verbatim_text: false,
    },
  ];
}

describe("MOW GKI package v1 contract", () => {
  it("keeps the JSON Schema and runtime manifest field contract aligned", () => {
    const schema = JSON.parse(
      readFileSync(
        resolve(dirname(fileURLToPath(import.meta.url)), "package-manifest-v1.schema.json"),
        "utf8",
      ),
    ) as {
      properties: Record<string, unknown>;
      required: string[];
      additionalProperties: boolean;
    };

    expect(schema.additionalProperties).toBe(false);
    expect(schema.required).toEqual(Object.keys(validManifest()));
    expect(Object.keys(schema.properties)).toEqual(schema.required);
  });

  it("accepts v1 and rejects wrong versions, keys, IDs, and unordered lists", () => {
    expect(parsePackageManifestV1(validManifest())).toEqual(validManifest());

    expect(() =>
      parsePackageManifestV1({ ...validManifest(), schema_version: "mow-gki-package/v2" }),
    ).toThrow();
    const { limitations: _limitations, ...missingField } = validManifest();
    expect(() => parsePackageManifestV1(missingField)).toThrow();
    expect(() => parsePackageManifestV1({ ...validManifest(), extra: true })).toThrow();
    expect(() =>
      parsePackageManifestV1({ ...validManifest(), research_run_id: "not-a-uuid" }),
    ).toThrow();
    expect(() => parsePackageManifestV1({ ...validManifest(), protocol_version: "   " })).toThrow();
    expect(() =>
      parsePackageManifestV1({ ...validManifest(), source_ids: [SOURCE_B, SOURCE_A] }),
    ).toThrow();
    expect(() =>
      parsePackageManifestV1({
        ...validManifest(),
        artifact_ids: [FINAL_ARTIFACT, FINAL_ARTIFACT],
      }),
    ).toThrow();
    expect(() => parsePackageManifestV1({ ...validManifest(), limitations: ["   "] })).toThrow();
  });

  it("builds the exact envelope with source and artifact rows in deterministic order", () => {
    const envelope = createPackageHashEnvelope(
      validManifest(),
      validSources().reverse(),
      validArtifacts().reverse(),
    );

    expect(envelope.schema_version).toBe("mow-gki-package/v1");
    expect(envelope.sources.map(({ source_id }) => source_id)).toEqual([SOURCE_A, SOURCE_B]);
    expect(envelope.artifacts.map(({ id }) => id)).toEqual([FINAL_ARTIFACT, SYNTHESIS_ARTIFACT]);
    expect(Object.keys(envelope.sources[0] ?? {}).sort()).toEqual([
      "content_use_mode",
      "id",
      "rights_review_id",
      "selection_note",
      "selection_status",
      "source_id",
      "source_snapshot",
    ]);
    expect(Object.keys(envelope.artifacts[0] ?? {}).sort()).toEqual([
      "artifact_payload",
      "artifact_type",
      "contains_verbatim_text",
      "id",
      "research_run_source_id",
    ]);
  });

  it("rejects sparse source-link and artifact arrays", () => {
    const sparseSources = new Array<PackageSourceLink>(2);
    sparseSources[0] = validSources()[0]!;
    const sparseArtifacts = new Array<PackageArtifact>(2);
    sparseArtifacts[0] = validArtifacts()[0]!;

    expect(() =>
      createPackageHashEnvelope(validManifest(), sparseSources, validArtifacts()),
    ).toThrow(/posições vazias/);
    expect(() =>
      createPackageHashEnvelope(validManifest(), validSources(), sparseArtifacts),
    ).toThrow(/posições vazias/);
  });

  it("rejects source/artifact ID mismatches, dangling links and an empty final package", () => {
    expect(() =>
      createPackageHashEnvelope(
        { ...validManifest(), source_ids: [SOURCE_A] },
        validSources(),
        validArtifacts(),
      ),
    ).toThrow(/source_ids/);
    expect(() =>
      createPackageHashEnvelope(
        { ...validManifest(), artifact_ids: [FINAL_ARTIFACT] },
        validSources(),
        validArtifacts(),
      ),
    ).toThrow(/artifact_ids/);
    expect(() =>
      createPackageHashEnvelope(
        validManifest(),
        validSources(),
        validArtifacts().map((artifact) =>
          artifact.id === SYNTHESIS_ARTIFACT
            ? { ...artifact, research_run_source_id: RIGHTS_B }
            : artifact,
        ),
      ),
    ).toThrow(/referência de fonte/);
    expect(() =>
      createPackageHashEnvelope(
        validManifest(),
        validSources(),
        validArtifacts().map((artifact) =>
          artifact.id === FINAL_ARTIFACT ? { ...artifact, artifact_payload: {} } : artifact,
        ),
      ),
    ).toThrow(/objeto não vazio/);
  });

  it("requires a traceable store_full_text link when an artifact declares verbatim text", () => {
    const artifact: PackageArtifact = {
      id: SYNTHESIS_ARTIFACT,
      research_run_source_id: LINK_A,
      artifact_type: "extraction",
      artifact_payload: { quote: "texto sintético" },
      contains_verbatim_text: true,
    };
    const manifest: PackageManifestV1 = {
      ...validManifest(),
      artifact_ids: [FINAL_ARTIFACT, SYNTHESIS_ARTIFACT],
    };

    expect(() =>
      createPackageHashEnvelope(manifest, validSources(), [validArtifacts()[0]!, artifact]),
    ).toThrow(/store_full_text/);

    const authorizedLink = sourceLink(LINK_A, SOURCE_A, RIGHTS_A, "store_full_text");
    const sourceRows = [authorizedLink, sourceLink(LINK_B, SOURCE_B, RIGHTS_B)];
    expect(() =>
      createPackageHashEnvelope(manifest, sourceRows, [validArtifacts()[0]!, artifact]),
    ).not.toThrow();
    expect(() =>
      createPackageHashEnvelope(manifest, sourceRows, [
        validArtifacts()[0]!,
        { ...artifact, research_run_source_id: null },
      ]),
    ).toThrow(/rastreável/);
  });
});

describe("RFC 8785/JCS canonical JSON and package digest", () => {
  it("sorts object keys by UTF-16 and uses ECMAScript JSON number/string forms", () => {
    expect(
      canonicalizeJson({ z: "texto", a: { y: 2, b: 1 }, list: [-0, 1e-7, 1e21], line: "a\nb" }),
    ).toBe('{"a":{"b":1,"y":2},"line":"a\\nb","list":[0,1e-7,1e+21],"z":"texto"}');

    const astralKey = "\u{10000}";
    const privateUseKey = "\uE000";
    expect(canonicalizeJson({ [privateUseKey]: 1, [astralKey]: 2 })).toBe(
      `{"${astralKey}":2,"${privateUseKey}":1}`,
    );
  });

  it("rejects unsupported values, sparse arrays, and invalid Unicode", () => {
    expect(() => canonicalizeJson(undefined)).toThrow();
    expect(() => canonicalizeJson(Number.NaN)).toThrow();
    expect(() => canonicalizeJson(Number.POSITIVE_INFINITY)).toThrow();
    expect(() => canonicalizeJson(1n)).toThrow();
    expect(() => canonicalizeJson(new Date())).toThrow();
    expect(() => canonicalizeJson("\uD800")).toThrow(/Unicode/);
    expect(() => canonicalizeJson(new Array(1))).toThrow(/esparso/);

    const cyclic: Record<string, unknown> = {};
    cyclic["self"] = cyclic;
    expect(() => canonicalizeJson(cyclic)).toThrow(/cíclica/);
  });

  it("calculates a stable, lowercase SHA-256 for the canonical UTF-8 envelope", async () => {
    const digest = await calculatePackageSha256(
      validManifest(),
      validSources().reverse(),
      validArtifacts().reverse(),
      webcrypto,
    );

    expect(isSha256Hex(digest)).toBe(true);
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(digest).toBe("6814a90ea375a00a042a31b98b1dcb978da0c84380e84b97d63b985ff87dd1ed");
    await expect(
      calculatePackageSha256(validManifest(), validSources(), validArtifacts(), webcrypto),
    ).resolves.toBe(digest);
  });
});

describe("candidate PostgreSQL JSONB package v2 value policy", () => {
  it("accepts safe integers and decimal strings but rejects inexact JavaScript numbers", () => {
    expect(() =>
      assertPostgresJsonbV2ValuePolicy({
        count: 7,
        maxSafeInteger: Number.MAX_SAFE_INTEGER,
        minSafeInteger: Number.MIN_SAFE_INTEGER,
        exactRatio: "0.125",
        nested: [0, -1, "12.5000"],
      }),
    ).not.toThrow();

    expect(() => assertPostgresJsonbV2ValuePolicy({ ratio: 0.125 })).toThrow(/inteiro JSON seguro/);
    expect(() => assertPostgresJsonbV2ValuePolicy({ count: Number.MAX_SAFE_INTEGER + 1 })).toThrow(
      /inteiro JSON seguro/,
    );
  });

  it("accepts valid Unicode without normalizing code points", () => {
    const composed = "é";
    const decomposed = "e\u0301";
    expect(composed).not.toBe(decomposed);
    expect(() =>
      assertPostgresJsonbV2ValuePolicy({ composed, decomposed, astral: "東京🙂" }),
    ).not.toThrow();
  });

  it("rejects values PostgreSQL JSONB cannot represent faithfully", () => {
    expect(() => assertPostgresJsonbV2ValuePolicy({ text: "invalid\u0000value" })).toThrow(
      /U\+0000/,
    );
    expect(() => assertPostgresJsonbV2ValuePolicy({ "bad\u0000key": 1 })).toThrow(/U\+0000/);
    expect(() => assertPostgresJsonbV2ValuePolicy({ text: "\uD800" })).toThrow(/Unicode/);
  });

  it("does not change the JCS v1 ability to canonicalize decimal numbers", () => {
    expect(canonicalizeJson({ ratio: 0.125 })).toBe('{"ratio":0.125}');
  });
});

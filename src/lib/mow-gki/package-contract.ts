export const PACKAGE_SCHEMA_VERSION = "mow-gki-package/v1" as const;

export const CONTENT_USE_MODES = [
  "catalog_metadata",
  "link_and_citation",
  "internal_content_analysis",
  "commercial_method_derivation",
  "store_full_text",
  "publish_excerpt",
] as const;

export const SOURCE_SELECTION_STATUSES = ["considered", "included", "excluded"] as const;

export const ARTIFACT_TYPES = [
  "protocol",
  "screening_log",
  "extraction",
  "synthesis",
  "limitation",
  "final_package",
  "other",
] as const;

export type ContentUseMode = (typeof CONTENT_USE_MODES)[number];
export type SourceSelectionStatus = (typeof SOURCE_SELECTION_STATUSES)[number];
export type ResearchArtifactType = (typeof ARTIFACT_TYPES)[number];

export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type JsonRecord = Record<string, unknown> & {
  schema_version?: unknown;
  research_run_id?: unknown;
  protocol_version?: unknown;
  review_policy_version?: unknown;
  final_package_artifact_id?: unknown;
  source_ids?: unknown;
  artifact_ids?: unknown;
  limitations?: unknown;
  id?: unknown;
  source_id?: unknown;
  rights_review_id?: unknown;
  content_use_mode?: unknown;
  selection_status?: unknown;
  source_snapshot?: unknown;
  selection_note?: unknown;
  research_run_source_id?: unknown;
  artifact_type?: unknown;
  artifact_payload?: unknown;
  contains_verbatim_text?: unknown;
};

export interface PackageManifestV1 {
  schema_version: typeof PACKAGE_SCHEMA_VERSION;
  research_run_id: string;
  protocol_version: string;
  review_policy_version: string;
  final_package_artifact_id: string;
  source_ids: string[];
  artifact_ids: string[];
  limitations: string[];
}

/**
 * Only these stable, review-relevant fields are included in the package digest.
 * Database timestamps, actor IDs, and other operational columns are excluded.
 */
export interface PackageSourceLink {
  id: string;
  source_id: string;
  rights_review_id: string;
  content_use_mode: ContentUseMode;
  selection_status: SourceSelectionStatus;
  source_snapshot: { [key: string]: JsonValue };
  selection_note: string;
}

export interface PackageArtifact {
  id: string;
  research_run_source_id: string | null;
  artifact_type: ResearchArtifactType;
  artifact_payload: JsonValue;
  contains_verbatim_text: boolean;
}

export interface PackageHashEnvelope {
  schema_version: typeof PACKAGE_SCHEMA_VERSION;
  manifest: PackageManifestV1;
  sources: PackageSourceLink[];
  artifacts: PackageArtifact[];
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const MANIFEST_KEYS = [
  "schema_version",
  "research_run_id",
  "protocol_version",
  "review_policy_version",
  "final_package_artifact_id",
  "source_ids",
  "artifact_ids",
  "limitations",
] as const;
const SOURCE_LINK_KEYS = [
  "id",
  "source_id",
  "rights_review_id",
  "content_use_mode",
  "selection_status",
  "source_snapshot",
  "selection_note",
] as const;
const ARTIFACT_KEYS = [
  "id",
  "research_run_source_id",
  "artifact_type",
  "artifact_payload",
  "contains_verbatim_text",
] as const;

function fail(message: string): never {
  throw new TypeError(message);
}

function isPlainRecord(value: unknown): value is JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertPlainDataRecord(value: unknown, label: string): asserts value is JsonRecord {
  if (!isPlainRecord(value)) fail(`${label} precisa ser um objeto JSON simples.`);

  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string") fail(`${label} não pode conter chaves Symbol.`);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !("value" in descriptor)) {
      fail(`${label}.${key} precisa ser uma propriedade de dados enumerável.`);
    }
  }
}

function assertExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    fail(`${label} deve conter exatamente: ${expected.join(", ")}.`);
  }
}

function assertUuid(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    fail(`${label} deve ser um UUID canônico em letras minúsculas.`);
  }
}

function assertNonBlankString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(`${label} deve ser uma string não vazia.`);
  }
}

function assertStringList(
  value: unknown,
  label: string,
  requireUuid: boolean,
): asserts value is string[] {
  if (!Array.isArray(value) || value.length === 0) fail(`${label} deve ser uma lista não vazia.`);

  let previous: string | undefined;
  for (let index = 0; index < value.length; index += 1) {
    if (!(index in value)) fail(`${label} não pode conter posições vazias.`);
    const item: unknown = value[index];
    if (requireUuid) assertUuid(item, `${label}[${index}]`);
    else if (typeof item !== "string" || item.length === 0) {
      fail(`${label}[${index}] deve ser uma string não vazia.`);
    }

    const current = item as string;
    if (previous !== undefined && previous >= current) {
      fail(`${label} deve estar em ordem crescente e não conter duplicatas.`);
    }
    previous = current;
  }
}

/** Parse and validate the closed, versioned package-manifest contract. */
export function parsePackageManifestV1(input: unknown): PackageManifestV1 {
  assertPlainDataRecord(input, "manifest");
  assertExactKeys(input, MANIFEST_KEYS, "manifest");

  if (input.schema_version !== PACKAGE_SCHEMA_VERSION) {
    fail(`schema_version deve ser ${PACKAGE_SCHEMA_VERSION}.`);
  }
  assertUuid(input.research_run_id, "research_run_id");
  assertNonBlankString(input.protocol_version, "protocol_version");
  assertNonBlankString(input.review_policy_version, "review_policy_version");
  assertUuid(input.final_package_artifact_id, "final_package_artifact_id");
  assertStringList(input.source_ids, "source_ids", true);
  assertStringList(input.artifact_ids, "artifact_ids", true);

  if (!Array.isArray(input.limitations)) fail("limitations deve ser uma lista de strings.");
  for (let index = 0; index < input.limitations.length; index += 1) {
    if (!(index in input.limitations)) fail("limitations não pode conter posições vazias.");
    const item: unknown = input.limitations[index];
    if (typeof item !== "string" || item.trim().length === 0) {
      fail(`limitations[${index}] deve ser uma string não vazia.`);
    }
  }

  return {
    schema_version: PACKAGE_SCHEMA_VERSION,
    research_run_id: input.research_run_id,
    protocol_version: input.protocol_version,
    review_policy_version: input.review_policy_version,
    final_package_artifact_id: input.final_package_artifact_id,
    source_ids: [...input.source_ids],
    artifact_ids: [...input.artifact_ids],
    limitations: [...input.limitations],
  };
}

function assertJsonString(value: string, label: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) fail(`${label} contém Unicode malformado.`);
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      fail(`${label} contém Unicode malformado.`);
    }
  }
}

function assertJsonValue(
  value: unknown,
  label: string,
  ancestors = new Set<object>(),
): asserts value is JsonValue {
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") {
    assertJsonString(value, label);
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${label} não pode conter número não finito.`);
    return;
  }

  if (Array.isArray(value)) {
    if (ancestors.has(value)) fail(`${label} contém referência cíclica.`);
    ancestors.add(value);
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") fail(`${label} não pode conter chaves Symbol.`);
      if (key === "length") continue;
      const index = Number(key);
      if (!Number.isInteger(index) || index < 0 || index >= value.length || String(index) !== key) {
        fail(`${label} contém propriedade de array não JSON.`);
      }
    }
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor?.enumerable || !("value" in descriptor)) {
        fail(`${label} não pode conter array esparso ou accessors.`);
      }
      assertJsonValue(descriptor.value, `${label}[${index}]`, ancestors);
    }
    ancestors.delete(value);
    return;
  }

  if (isPlainRecord(value)) {
    if (ancestors.has(value)) fail(`${label} contém referência cíclica.`);
    ancestors.add(value);
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") fail(`${label} não pode conter chaves Symbol.`);
      assertJsonString(key, `${label} (chave)`);
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor?.enumerable || !("value" in descriptor)) {
        fail(`${label}.${key} precisa ser uma propriedade de dados enumerável.`);
      }
      assertJsonValue(descriptor.value, `${label}.${key}`, ancestors);
    }
    ancestors.delete(value);
    return;
  }

  fail(`${label} contém um valor que não pertence ao modelo JSON.`);
}

function serializeCanonicalJson(value: JsonValue): string {
  if (value === null || typeof value === "boolean") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return Object.is(value, -0) ? "0" : JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => serializeCanonicalJson(item)).join(",")}]`;
  }

  const object = value as { [key: string]: JsonValue };
  const properties = Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${serializeCanonicalJson(object[key]!)}`);
  return `{${properties.join(",")}}`;
}

/** Serialize JSON-compatible values using RFC 8785/JCS property and number rules. */
export function canonicalizeJson(value: unknown): string {
  assertJsonValue(value, "value");
  return serializeCanonicalJson(value);
}

/**
 * Candidate-only value policy for a future PostgreSQL JSONB package v2 contract.
 * This deliberately does not affect the existing JCS v1 parser or digest.
 */
export function assertPostgresJsonbV2ValuePolicy(input: unknown): asserts input is JsonValue {
  assertJsonValue(input, "package v2");

  const visit = (value: JsonValue, label: string): void => {
    if (typeof value === "number" && !Number.isSafeInteger(value)) {
      fail(`${label} deve ser um inteiro JSON seguro; decimais exatos devem ser strings.`);
    }
    if (typeof value === "string" && value.includes("\u0000")) {
      fail(`${label} não pode conter U+0000, incompatível com PostgreSQL text/JSONB.`);
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${label}[${index}]`));
    } else if (value !== null && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        if (key.includes("\u0000")) fail(`${label} contém uma chave com U+0000.`);
        visit(child, `${label}.${key}`);
      }
    }
  };

  visit(input, "package v2");
}

function parseSourceLink(input: unknown, index: number): PackageSourceLink {
  const label = `sources[${index}]`;
  assertPlainDataRecord(input, label);
  assertExactKeys(input, SOURCE_LINK_KEYS, label);
  assertUuid(input.id, `${label}.id`);
  assertUuid(input.source_id, `${label}.source_id`);
  assertUuid(input.rights_review_id, `${label}.rights_review_id`);
  if (!(CONTENT_USE_MODES as readonly unknown[]).includes(input.content_use_mode)) {
    fail(`${label}.content_use_mode não é suportado.`);
  }
  if (!(SOURCE_SELECTION_STATUSES as readonly unknown[]).includes(input.selection_status)) {
    fail(`${label}.selection_status não é suportado.`);
  }
  assertPlainDataRecord(input.source_snapshot, `${label}.source_snapshot`);
  assertJsonValue(input.source_snapshot, `${label}.source_snapshot`);
  if (typeof input.selection_note !== "string") fail(`${label}.selection_note deve ser texto.`);

  return {
    id: input.id,
    source_id: input.source_id,
    rights_review_id: input.rights_review_id,
    content_use_mode: input.content_use_mode as ContentUseMode,
    selection_status: input.selection_status as SourceSelectionStatus,
    source_snapshot: input.source_snapshot as { [key: string]: JsonValue },
    selection_note: input.selection_note,
  };
}

function parseArtifact(input: unknown, index: number): PackageArtifact {
  const label = `artifacts[${index}]`;
  assertPlainDataRecord(input, label);
  assertExactKeys(input, ARTIFACT_KEYS, label);
  assertUuid(input.id, `${label}.id`);
  if (input.research_run_source_id !== null) {
    assertUuid(input.research_run_source_id, `${label}.research_run_source_id`);
  }
  if (!(ARTIFACT_TYPES as readonly unknown[]).includes(input.artifact_type)) {
    fail(`${label}.artifact_type não é suportado.`);
  }
  assertJsonValue(input.artifact_payload, `${label}.artifact_payload`);
  if (typeof input.contains_verbatim_text !== "boolean") {
    fail(`${label}.contains_verbatim_text deve ser booleano.`);
  }

  return {
    id: input.id,
    research_run_source_id: input.research_run_source_id,
    artifact_type: input.artifact_type as ResearchArtifactType,
    artifact_payload: input.artifact_payload,
    contains_verbatim_text: input.contains_verbatim_text,
  };
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function assertSameIds(
  actual: readonly string[],
  expected: readonly string[],
  label: string,
): void {
  if (actual.length !== expected.length || actual.some((id, index) => id !== expected[index])) {
    fail(`${label} deve corresponder exatamente às linhas fornecidas, em ordem crescente.`);
  }
}

/** Validate and deterministically order the exact package envelope used for hashing. */
export function createPackageHashEnvelope(
  manifestInput: unknown,
  sourceLinksInput: unknown,
  artifactsInput: unknown,
): PackageHashEnvelope {
  const manifest = parsePackageManifestV1(manifestInput);
  if (!Array.isArray(sourceLinksInput) || sourceLinksInput.length === 0) {
    fail("sources deve conter ao menos um vínculo de fonte.");
  }
  if (!Array.isArray(artifactsInput) || artifactsInput.length === 0) {
    fail("artifacts deve conter ao menos um artefato.");
  }

  const sources: PackageSourceLink[] = [];
  for (let index = 0; index < sourceLinksInput.length; index += 1) {
    if (!(index in sourceLinksInput)) fail("sources não pode conter posições vazias.");
    sources.push(parseSourceLink(sourceLinksInput[index], index));
  }
  const artifacts: PackageArtifact[] = [];
  for (let index = 0; index < artifactsInput.length; index += 1) {
    if (!(index in artifactsInput)) fail("artifacts não pode conter posições vazias.");
    artifacts.push(parseArtifact(artifactsInput[index], index));
  }

  const sourceLinkIds = new Set<string>();
  const sourceAndUsePairs = new Set<string>();
  for (const source of sources) {
    if (sourceLinkIds.has(source.id)) fail("sources contém IDs de vínculo duplicados.");
    sourceLinkIds.add(source.id);
    const pair = `${source.source_id}\u0000${source.content_use_mode}`;
    if (sourceAndUsePairs.has(pair)) fail("sources contém fonte e uso duplicados.");
    sourceAndUsePairs.add(pair);
  }

  const artifactIds = new Set<string>();
  for (const artifact of artifacts) {
    if (artifactIds.has(artifact.id)) fail("artifacts contém IDs duplicados.");
    artifactIds.add(artifact.id);
  }

  const linkedSourceIds = [...new Set(sources.map((source) => source.source_id))].sort(
    compareStrings,
  );
  assertSameIds(manifest.source_ids, linkedSourceIds, "source_ids");
  assertSameIds(manifest.artifact_ids, [...artifactIds].sort(compareStrings), "artifact_ids");

  const sourceByLinkId = new Map(sources.map((source) => [source.id, source]));
  for (const artifact of artifacts) {
    if (artifact.research_run_source_id === null) {
      if (artifact.contains_verbatim_text) {
        fail("Texto literal exige vínculo rastreável com uso store_full_text.");
      }
      continue;
    }

    const sourceLink = sourceByLinkId.get(artifact.research_run_source_id);
    if (!sourceLink) fail("A referência de fonte do artefato não existe neste pacote.");
    if (artifact.contains_verbatim_text && sourceLink.content_use_mode !== "store_full_text") {
      fail("Texto literal exige vínculo rastreável com uso store_full_text.");
    }
  }

  const finalPackage = artifacts.find(
    (artifact) => artifact.id === manifest.final_package_artifact_id,
  );
  if (!finalPackage || finalPackage.artifact_type !== "final_package") {
    fail("final_package_artifact_id deve identificar um artefato final deste pacote.");
  }
  if (
    !isPlainRecord(finalPackage.artifact_payload) ||
    Object.keys(finalPackage.artifact_payload).length === 0
  ) {
    fail("O artefato final deve conter um objeto não vazio.");
  }

  sources.sort(
    (left, right) =>
      compareStrings(left.source_id, right.source_id) ||
      compareStrings(left.content_use_mode, right.content_use_mode) ||
      compareStrings(left.id, right.id),
  );
  artifacts.sort((left, right) => compareStrings(left.id, right.id));

  return {
    schema_version: PACKAGE_SCHEMA_VERSION,
    manifest,
    sources,
    artifacts,
  };
}

export function isSha256Hex(value: unknown): value is string {
  return typeof value === "string" && SHA256_PATTERN.test(value);
}

/** Calculate the lowercase SHA-256 of the canonical UTF-8 package envelope. */
export async function calculatePackageSha256(
  manifest: unknown,
  sourceLinks: unknown,
  artifacts: unknown,
  cryptoProvider: { subtle: Pick<SubtleCrypto, "digest"> } = globalThis.crypto,
): Promise<string> {
  const envelope = createPackageHashEnvelope(manifest, sourceLinks, artifacts);
  const canonicalJson = canonicalizeJson(envelope);
  const digest = await cryptoProvider.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonicalJson),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

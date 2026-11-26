import { describe, expect, it, vi } from "vitest";
import {
  extractSourcePageText,
  retrieveAuthorizedMethodEvidence,
} from "./method-draft-evidence-retrieval";

const rightsRow = {
  source_id: "00000000-0000-4000-8000-000000000001",
  title: "Fonte sintética de teste",
  source_type: "article",
  canonical_url: "https://source.example/article",
  catalog_rights_status: "verified",
  rights_review_id: "00000000-0000-4000-8000-000000000002",
  decision_status: "open_license_verified",
  permitted_uses: [
    "catalog_metadata",
    "link_and_citation",
    "internal_content_analysis",
    "commercial_method_derivation",
  ],
  rights_basis: "Permissão sintética de teste",
  rights_evidence_url: "https://source.example/license",
  restrictions: null,
  reviewed_by: "00000000-0000-4000-8000-000000000003",
  reviewed_at: "2026-11-24T12:00:00.000Z",
  valid_until: "2099-12-31",
  restrictions_reviewed: true,
  restrictions_satisfied: true,
};
const now = new Date("2026-11-25T12:00:00.000Z");
function response(body: string, contentType: string, status = 200) {
  return new Response(body, { status, headers: { "content-type": contentType } });
}

describe("automated source page evidence retrieval", () => {
  it("extracts only page text and excludes active or decorative markup", () => {
    const text = extractSourcePageText(
      "<html><body><nav>Navigation must be removed</nav><main><article><h1>Finding</h1><p>" +
        "Authorized synthetic evidence supporting a valid method and measurable business outcome. " +
        "This content is deliberately longer than the minimum for the extraction tests.</p></article></main>" +
        "<script>SECRET_SCRIPT()</script><style>SECRET_STYLE</style></body></html>",
      "text/html; charset=utf-8",
    );
    expect(text).toContain("Authorized synthetic evidence");
    expect(text).not.toMatch(/SECRET|Navigation/);
  });

  it("fetches only a currently permitted catalog source, never redirects, and returns a labeled extract", async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        response(
          "<html><body><article>" +
            "Authorized synthetic evidence supporting a valid method and measurable business outcome. " +
            "This content is deliberately longer than the minimum for the extraction tests." +
            "</article></body></html>",
          "text/html",
        ),
      );
    const result = await retrieveAuthorizedMethodEvidence([rightsRow], {
      fetchImplementation,
      evaluatedAt: now,
    });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    expect(fetchImplementation).toHaveBeenCalledWith(
      new URL("https://source.example/article"),
      expect.objectContaining({ method: "GET", redirect: "error" }),
    );
    expect(result).toMatchObject({ eligibleSources: 1, unreadableSources: 0 });
    expect(result.evidence[0]).toMatchObject({
      sourceId: rightsRow.source_id,
      title: rightsRow.title,
      url: rightsRow.canonical_url,
      contentKind: "source_page_extract",
    });
    expect(result.evidence[0]?.content).toContain("Authorized synthetic evidence");
  });

  it("fails closed before network access when rights are missing or expired", async () => {
    const fetchImplementation = vi.fn<typeof fetch>();
    const expired = { ...rightsRow, valid_until: "2020-01-01" };
    const referenceOnly = {
      ...rightsRow,
      permitted_uses: ["catalog_metadata", "link_and_citation"],
    };
    const result = await retrieveAuthorizedMethodEvidence([expired, referenceOnly], {
      fetchImplementation,
      evaluatedAt: now,
    });
    expect(result).toEqual({ evidence: [], eligibleSources: 0, unreadableSources: 0 });
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it("does not treat catalog metadata, PDF bytes, or unsafe hosts as readable evidence", async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response("%PDF-1.7 synthetic", "application/pdf"));
    const unsafe = {
      ...rightsRow,
      source_id: "00000000-0000-4000-8000-000000000004",
      canonical_url: "https://127.0.0.1/private",
    };
    const result = await retrieveAuthorizedMethodEvidence([rightsRow, unsafe], {
      fetchImplementation,
      evaluatedAt: now,
    });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ evidence: [], eligibleSources: 1, unreadableSources: 1 });
  });

  it("rejects undersized or unsupported content and decodes plain text within bounded output", () => {
    expect(extractSourcePageText("short", "text/plain")).toBeNull();
    expect(extractSourcePageText("x".repeat(121), "application/pdf")).toBeNull();
    expect(extractSourcePageText("A & B " + "text ".repeat(40), "text/plain")).toContain("A & B");
  });
});

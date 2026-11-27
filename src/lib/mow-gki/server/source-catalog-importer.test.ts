import { describe, expect, it, vi } from "vitest";
import {
  htmlToText,
  importSourceCatalog,
  isSafePublicHttpsUrl,
  toCatalogItem,
  type SourceCatalogImporterDeps,
} from "./source-catalog-importer";
import type { OpenAlexWorkCandidate } from "./openalex-client";

function work(id: string, license: string | null, landing: string | null): OpenAlexWorkCandidate {
  return {
    provider: "openalex",
    providerRecordId: id,
    providerRecordUrl: `https://openalex.org/works/${id}`,
    metadataLicense: "CC0",
    title: `Obra ${id}`,
    publicationType: "article",
    doi: null,
    publicationYear: 2021,
    language: "en",
    authors: ["A"],
    primaryLocation: null,
    bestOpenAccessLocation: license
      ? {
          landingPageUrl: landing,
          pdfUrl: null,
          license,
          version: null,
          hostName: null,
          hostType: null,
        }
      : null,
    openAccessSignal: { isOpenAccess: Boolean(license), status: null, url: null },
    contentRightsAssessment: "unassessed",
  };
}

const longHtml = `<html><body><script>x()</script><p>${"texto ".repeat(600)}</p></body></html>`;

function deps(works: OpenAlexWorkCandidate[], fetched: Partial<Record<string, unknown>> = {}) {
  const stored: unknown[] = [];
  const impl: SourceCatalogImporterDeps = {
    searchWorks: vi.fn(async () => ({
      results: works,
      nextCursor: null,
      resultCount: works.length,
    })),
    upsertSources: vi.fn(async (_d, items) =>
      items.map((i, n) => ({
        sourceId: `s${n}-${i.provider_record_id}`,
        recordId: i.provider_record_id,
        inserted: n === 0,
      })),
    ),
    fetchText: vi.fn(async (url: string) => (fetched[url] as never) ?? null),
    storeText: vi.fn(async (input) => {
      stored.push(input);
    }),
  };
  return { impl, stored };
}

const req = { domain: "Comercial e vendas", queries: ["vendas"], perQuery: 10, fullText: true };

describe("source catalog importer", () => {
  it("mapeia a obra para o item do acervo", () => {
    const item = toCatalogItem(work("W1", "cc-by", "https://ex.org/a"));
    expect(item).toMatchObject({
      provider_record_id: "W1",
      license: "cc-by",
      canonical_url: "https://openalex.org/works/W1",
    });
  });

  it("guarda metadados sempre e texto só de licença aberta em HTML", async () => {
    const works = [
      work("W1", "cc-by", "https://ex.org/a"),
      work("W2", null, null),
      work("W3", "cc-by", "https://ex.org/pdf"),
    ];
    const { impl, stored } = deps(works, {
      "https://ex.org/a": {
        contentType: "text/html; charset=utf-8",
        body: longHtml,
        byteLength: 4000,
        finalUrl: "https://ex.org/a",
      },
      "https://ex.org/pdf": {
        contentType: "application/pdf",
        body: "",
        byteLength: 10,
        finalUrl: "https://ex.org/pdf",
      },
    });
    const report = await importSourceCatalog(impl, req);
    expect(report).toMatchObject({ found: 3, inserted: 1, updated: 2, textStored: 1 });
    expect(report.textSkipped).toEqual({ no_open_license: 1, pdf_not_supported: 1 });
    expect(stored).toHaveLength(1);
    expect(JSON.stringify(stored[0])).not.toContain("x()");
  });

  it("não baixa nada quando fullText é falso", async () => {
    const { impl } = deps([work("W1", "cc-by", "https://ex.org/a")]);
    await importSourceCatalog(impl, { ...req, fullText: false });
    expect(impl.fetchText).not.toHaveBeenCalled();
  });

  it("não repete obras entre consultas e registra consulta que falhou", async () => {
    const { impl } = deps([work("W1", null, null)]);
    (impl.searchWorks as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        results: [work("W1", null, null)],
        nextCursor: null,
        resultCount: 1,
      })
      .mockResolvedValueOnce({
        results: [work("W1", null, null)],
        nextCursor: null,
        resultCount: 1,
      })
      .mockRejectedValueOnce(new Error("429"));
    const report = await importSourceCatalog(impl, {
      ...req,
      queries: ["a", "b", "c"],
      fullText: false,
    });
    expect(report.found).toBe(1);
    expect(report.queryErrors).toEqual(["c"]);
  });

  it("recusa páginas curtas, endereço interno e redirecionamento para rede interna", async () => {
    const works = [
      work("W1", "cc-by", "https://ex.org/a"),
      work("W2", "cc-by", "https://ex.org/b"),
    ];
    const { impl } = deps(works, {
      "https://ex.org/a": {
        contentType: "text/html",
        body: "<p>curto</p>",
        byteLength: 20,
        finalUrl: "https://ex.org/a",
      },
      "https://ex.org/b": {
        contentType: "text/html",
        body: longHtml,
        byteLength: 4000,
        finalUrl: "https://10.0.0.5/x",
      },
    });
    const report = await importSourceCatalog(impl, req);
    expect(report.textStored).toBe(0);
    expect(report.textSkipped).toEqual({ too_short: 1, unsafe_url: 1 });
  });

  it("valida URLs públicas e limpa HTML", () => {
    expect(isSafePublicHttpsUrl("https://exemplo.org/a")).toBe(true);
    for (const bad of [
      "http://exemplo.org",
      "https://localhost/a",
      "https://127.0.0.1/a",
      "https://[::1]/a",
      "https://u:p@exemplo.org",
    ]) {
      expect(isSafePublicHttpsUrl(bad)).toBe(false);
    }
    expect(htmlToText("<p>a &amp; b</p><style>x{}</style><p>c</p>")).toBe("a & b\nc");
  });
});

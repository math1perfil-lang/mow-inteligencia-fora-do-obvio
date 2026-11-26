import { describe, expect, it, vi } from "vitest";
import { ConfiguredSourceSearchClient } from "./configured-source-search-client";

const PROVIDER_CONFIG = JSON.stringify([
  {
    id: "source-test-a",
    label: "Fonte simulada A",
    endpoint: "https://provider.example/search",
    queryParameter: "q",
    limitParameter: "limit",
    resultsPath: "data.items",
    maxResults: 5,
    fields: {
      id: "id",
      title: "title",
      url: "url",
      doi: "doi",
      publicationYear: "year",
      authors: "authors",
    },
  },
]);

function jsonResponse(payload: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("ConfiguredSourceSearchClient", () => {
  it("normalizes only bibliographic metadata and sends a short query to a configured HTTPS endpoint", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        data: {
          items: [
            {
              id: "record-1",
              title: "Synthetic source result",
              url: "https://provider.example/records/record-1",
              doi: "10.1234/simulated",
              year: "2024",
              authors: ["Example Author"],
              abstract: "This content must never be returned.",
              fullText: "This content must never be returned.",
            },
          ],
        },
      }),
    );
    const client = new ConfiguredSourceSearchClient({
      configuration: PROVIDER_CONFIG,
      fetchImplementation,
    });

    const page = await client.search("short topic", 3);
    const [requestedUrl, requestInit] = fetchImplementation.mock.calls[0]!;
    const url = new URL(requestedUrl.toString());
    const headers = new Headers(requestInit?.headers);

    expect(url.origin).toBe("https://provider.example");
    expect(url.pathname).toBe("/search");
    expect(url.searchParams.get("q")).toBe("short topic");
    expect(url.searchParams.get("limit")).toBe("3");
    expect(requestInit?.redirect).toBe("error");
    expect(headers.get("Accept")).toBe("application/json");
    expect(page.state).toBe("complete");
    expect(page.results).toEqual([
      {
        providerId: "source-test-a",
        providerLabel: "Fonte simulada A",
        providerRecordId: "record-1",
        providerRecordUrl: "https://provider.example/records/record-1",
        metadataLicense: null,
        title: "Synthetic source result",
        publicationType: "other",
        doi: "https://doi.org/10.1234/simulated",
        publicationYear: 2024,
        language: null,
        authors: ["Example Author"],
        contentRightsAssessment: "unassessed",
      },
    ]);
    expect(page.results[0]).not.toHaveProperty("abstract");
    expect(page.results[0]).not.toHaveProperty("fullText");
  });

  it("keeps provider credentials server-side and reports only safe status codes", async () => {
    const config = JSON.stringify([
      {
        id: "source-test-auth",
        label: "Fonte autenticada simulada",
        endpoint: "https://provider.example/search",
        queryParameter: "q",
        resultsPath: "items",
        maxResults: 2,
        fields: { id: "id", title: "title", url: "url" },
        auth: {
          envVar: "MOW_GKI_SOURCE_TEST_TOKEN",
          headerName: "Authorization",
          prefix: "Bearer ",
        },
      },
    ]);
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ items: [] }, { status: 401 }));
    const client = new ConfiguredSourceSearchClient({
      configuration: config,
      environment: { MOW_GKI_SOURCE_TEST_TOKEN: "synthetic-secret" },
      fetchImplementation,
    });

    const page = await client.search("short topic");
    const [, requestInit] = fetchImplementation.mock.calls[0]!;
    expect(new Headers(requestInit?.headers).get("Authorization")).toBe("Bearer synthetic-secret");
    expect(page.state).toBe("unavailable");
    expect(page.providers[0]).toMatchObject({ status: "unavailable", failureCode: "auth_failed" });
    expect(JSON.stringify(page)).not.toContain("synthetic-secret");
  });

  it("does not call the provider when its server credential is missing", async () => {
    const config = JSON.stringify([
      {
        id: "source-test-auth",
        label: "Fonte autenticada simulada",
        endpoint: "https://provider.example/search",
        queryParameter: "q",
        resultsPath: "items",
        fields: { id: "id", title: "title", url: "url" },
        auth: {
          envVar: "MOW_GKI_SOURCE_TEST_TOKEN",
          headerName: "Authorization",
          prefix: "Bearer ",
        },
      },
    ]);
    const fetchImplementation = vi.fn<typeof fetch>();
    const client = new ConfiguredSourceSearchClient({
      configuration: config,
      environment: {},
      fetchImplementation,
    });

    const page = await client.search("short topic");
    expect(fetchImplementation).not.toHaveBeenCalled();
    expect(page.state).toBe("not_configured");
    expect(page.providers[0]).toMatchObject({ status: "not_configured", failureCode: null });
  });

  it("contains partial provider failures without exposing upstream bodies or query text", async () => {
    const config = JSON.stringify([
      {
        id: "source-test-a",
        label: "Fonte simulada A",
        endpoint: "https://provider.example/search",
        queryParameter: "q",
        resultsPath: "items",
        fields: { id: "id", title: "title", url: "url" },
      },
      {
        id: "source-test-b",
        label: "Fonte simulada B",
        endpoint: "https://provider-two.example/search",
        queryParameter: "q",
        resultsPath: "items",
        fields: { id: "id", title: "title", url: "url" },
      },
    ]);
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ items: [] }))
      .mockResolvedValueOnce(new Response("private query and upstream details", { status: 503 }));
    const client = new ConfiguredSourceSearchClient({
      configuration: config,
      fetchImplementation,
    });

    const page = await client.search("short topic");
    expect(page.state).toBe("partial");
    expect(page.providers.map((provider) => provider.status)).toEqual(["available", "unavailable"]);
    expect(JSON.stringify(page)).not.toContain("private query");
    expect(JSON.stringify(page)).not.toContain("upstream details");
  });

  it("fails closed for untrusted endpoints, invalid query, and malformed configuration before network access", async () => {
    const fetchImplementation = vi.fn<typeof fetch>();
    const client = new ConfiguredSourceSearchClient({
      configuration: PROVIDER_CONFIG,
      fetchImplementation,
    });

    await expect(client.search("long topic ".repeat(20))).rejects.toThrow();
    expect(fetchImplementation).not.toHaveBeenCalled();
    expect(
      () =>
        new ConfiguredSourceSearchClient({
          configuration: PROVIDER_CONFIG.replace(
            "https://provider.example/search",
            "http://127.0.0.1/search",
          ),
          fetchImplementation,
        }),
    ).toThrow(/Configuração de fontes inválida/);
    expect(
      () => new ConfiguredSourceSearchClient({ configuration: "{bad-json", fetchImplementation }),
    ).toThrow(/Configuração de fontes inválida/);
    expect(fetchImplementation).not.toHaveBeenCalled();
  });
});

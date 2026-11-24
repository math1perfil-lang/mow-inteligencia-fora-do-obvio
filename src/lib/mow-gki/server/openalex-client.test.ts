import { describe, expect, it, vi } from "vitest";
import { OpenAlexApiError, OpenAlexClient } from "./openalex-client";

const SAMPLE_WORK = {
  id: "https://openalex.org/W1234567890",
  doi: "https://doi.org/10.1234/example",
  title: "Synthetic research title",
  publication_year: 2024,
  type: "article",
  language: "en",
  authorships: [{ author: { display_name: "Example Author" } }],
  abstract_inverted_index: { forbidden: [0] },
  best_oa_location: {
    pdf_url: "https://repository.example/item.pdf",
    license: "cc-by",
  },
};

function jsonResponse(payload: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("OpenAlexClient", () => {
  it("searches titles only and returns selected bibliographic fields with rights unassessed", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        meta: { count: 12, next_cursor: "cursor-next" },
        results: [SAMPLE_WORK],
      }),
    );
    const client = new OpenAlexClient({
      apiKey: "test-secret",
      fetchImplementation,
    });

    const page = await client.searchWorks("organizational resilience", { perPage: 20 });
    const [requestedUrl, requestInit] = fetchImplementation.mock.calls[0]!;
    const url = new URL(requestedUrl.toString());
    const headers = new Headers(requestInit?.headers);
    const candidate = page.results[0]!;

    expect(url.origin + url.pathname).toBe("https://api.openalex.org/works");
    expect(url.searchParams.get("search.title")).toBe("organizational resilience");
    expect(url.searchParams.has("search.title_abstract_keywords")).toBe(false);
    expect(url.searchParams.get("per_page")).toBe("20");
    expect(url.searchParams.get("cursor")).toBe("*");
    const selectedFields = url.searchParams.get("select")?.split(",") ?? [];
    expect(selectedFields).toEqual([
      "id",
      "doi",
      "title",
      "publication_year",
      "type",
      "language",
      "authorships",
    ]);
    expect(selectedFields.join(",")).not.toMatch(/abstract|fulltext|location|license/i);
    expect(url.searchParams.has("api_key")).toBe(false);
    expect(headers.get("Authorization")).toBe("Bearer test-secret");
    expect(page.nextCursor).toBe("cursor-next");
    expect(page.resultCount).toBe(12);
    expect(candidate).toMatchObject({
      provider: "openalex",
      providerRecordId: "W1234567890",
      providerRecordUrl: "https://openalex.org/works/W1234567890",
      metadataLicense: "CC0",
      title: "Synthetic research title",
      publicationType: "article",
      doi: "https://doi.org/10.1234/example",
      authors: ["Example Author"],
      contentRightsAssessment: "unassessed",
      primaryLocation: null,
      bestOpenAccessLocation: null,
      openAccessSignal: { isOpenAccess: null, status: null, url: null },
    });
    expect(candidate).not.toHaveProperty("abstract");
  });

  it("rejects invalid pages and unkeyed cursor paging before network access", async () => {
    const fetchImplementation = vi.fn<typeof fetch>();
    const client = new OpenAlexClient({ fetchImplementation });

    await expect(client.searchWorks("test", { perPage: 101 })).rejects.toThrow(/perPage/);
    await expect(client.searchWorks("test", { cursor: "cursor-next" })).rejects.toThrow(/API key/);
    await expect(client.searchWorks("   ")).rejects.toThrow(/consulta/);
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it("retries an identified request-rate 429 according to Retry-After and then succeeds", async () => {
    const sleep = vi.fn(async (_milliseconds: number) => undefined);
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse(
          { reason: "requests_per_second", error: "private upstream detail" },
          { status: 429, headers: { "Retry-After": "2" } },
        ),
      )
      .mockResolvedValueOnce(jsonResponse({ meta: { count: 0 }, results: [] }));
    const client = new OpenAlexClient({
      apiKey: "test-secret",
      fetchImplementation,
      sleep,
    });

    const page = await client.searchWorks("test");

    expect(fetchImplementation).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(2_000);
    expect(page.results).toEqual([]);
  });

  it("returns a long Retry-After immediately instead of holding the search lease", async () => {
    const sleep = vi.fn(async (_milliseconds: number) => undefined);
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        jsonResponse(
          { reason: "requests_per_second" },
          { status: 429, headers: { "Retry-After": "30" } },
        ),
      );
    const client = new OpenAlexClient({ fetchImplementation, sleep });

    await expect(client.searchWorks("test")).rejects.toMatchObject({
      status: 429,
      retryAfterSeconds: 30,
    });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("does not retry a daily-budget 429 and exposes only its allowlisted reason", async () => {
    const sleep = vi.fn(async (_milliseconds: number) => undefined);
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        jsonResponse(
          { reason: "daily_budget", error: "private query or upstream detail" },
          { status: 429, headers: { "Retry-After": "3600" } },
        ),
      );
    const client = new OpenAlexClient({ fetchImplementation, sleep });

    await expect(client.searchWorks("test")).rejects.toMatchObject({
      status: 429,
      retryAfterSeconds: 3600,
      rateLimitReason: "daily_budget",
    });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("does not retry a 429 with an unknown reason", async () => {
    const sleep = vi.fn(async (_milliseconds: number) => undefined);
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        jsonResponse(
          { reason: "unrecognized_private_reason", error: "private upstream detail" },
          { status: 429, headers: { "Retry-After": "1" } },
        ),
      );
    const client = new OpenAlexClient({ fetchImplementation, sleep });

    await expect(client.searchWorks("test")).rejects.toMatchObject({
      status: 429,
      rateLimitReason: null,
    });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("surfaces non-retryable API status without leaking the response body", async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("private upstream detail", { status: 400 }));
    const client = new OpenAlexClient({ fetchImplementation });

    await expect(client.searchWorks("test")).rejects.toThrow(OpenAlexApiError);
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });
});

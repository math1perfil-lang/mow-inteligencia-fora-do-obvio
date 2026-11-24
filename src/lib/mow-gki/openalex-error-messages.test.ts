import { describe, expect, it } from "vitest";
import {
  classifyOpenAlexFailure,
  getOpenAlexFailureNotice,
  OPENALEX_FAILURE_TOKEN_PREFIX,
  toOpenAlexFailureToken,
} from "./openalex-error-messages";

describe("OpenAlex safe failure messages", () => {
  it("classifies rate limits, provider errors, timeouts and lease failures", () => {
    expect(classifyOpenAlexFailure({ status: 429 })).toBe("rate_limited");
    expect(classifyOpenAlexFailure({ status: 503 })).toBe("provider_unavailable");
    expect(classifyOpenAlexFailure({ name: "TimeoutError" })).toBe("timeout");
    expect(classifyOpenAlexFailure({ code: "lease_unavailable" })).toBe("lease");
  });

  it("sends only an allowlisted failure token across the server boundary", () => {
    expect(toOpenAlexFailureToken(new Error("private upstream detail"))).toBe(
      `${OPENALEX_FAILURE_TOKEN_PREFIX}unexpected`,
    );
  });

  it("turns known tokens into safe Portuguese notices and hides unknown server errors", () => {
    expect(
      getOpenAlexFailureNotice(new Error(`${OPENALEX_FAILURE_TOKEN_PREFIX}rate_limited`)),
    ).toMatch(/OpenAlex limitou temporariamente/);
    expect(getOpenAlexFailureNotice(new Error("private server detail"))).toMatch(
      /A consulta não foi concluída/,
    );
    expect(
      getOpenAlexFailureNotice(
        new Error(`${OPENALEX_FAILURE_TOKEN_PREFIX}unknown_secret_category`),
      ),
    ).toMatch(/A consulta não foi concluída/);
  });
});

import { describe, expect, it } from "vitest";
import {
  classifyOpenAlexFailure,
  getOpenAlexFailureCode,
  getOpenAlexFailureNotice,
  getOpenAlexRetryAfterSeconds,
  OPENALEX_FAILURE_TOKEN_PREFIX,
  toOpenAlexFailureToken,
} from "./openalex-error-messages";

describe("OpenAlex safe failure messages", () => {
  it("distinguishes temporary rate limits, exhausted quota and unknown 429s", () => {
    expect(classifyOpenAlexFailure({ status: 429, rateLimitReason: "requests_per_second" })).toBe(
      "rate_limited",
    );
    expect(classifyOpenAlexFailure({ status: 429, rateLimitReason: "daily_budget" })).toBe(
      "budget_exhausted",
    );
    expect(classifyOpenAlexFailure({ status: 429 })).toBe("rate_limit_unknown");
    expect(classifyOpenAlexFailure({ status: 503 })).toBe("provider_unavailable");
    expect(classifyOpenAlexFailure({ name: "TimeoutError" })).toBe("timeout");
    expect(classifyOpenAlexFailure({ code: "lease_unavailable" })).toBe("lease");
    expect(classifyOpenAlexFailure({ code: "provider_not_configured" })).toBe(
      "provider_not_configured",
    );
  });

  it("sends only an allowlisted failure token across the server boundary", () => {
    expect(toOpenAlexFailureToken(new Error("private upstream detail"))).toBe(
      `${OPENALEX_FAILURE_TOKEN_PREFIX}unexpected`,
    );
  });

  it("turns known tokens into safe Portuguese notices and hides unknown server errors", () => {
    expect(
      getOpenAlexFailureNotice(new Error(`${OPENALEX_FAILURE_TOKEN_PREFIX}rate_limited:8`)),
    ).toMatch(/pausa de 8 segundos/);
    expect(
      getOpenAlexFailureCode(new Error(`${OPENALEX_FAILURE_TOKEN_PREFIX}budget_exhausted`)),
    ).toBe("budget_exhausted");
    expect(
      getOpenAlexFailureNotice(new Error(`${OPENALEX_FAILURE_TOKEN_PREFIX}budget_exhausted`)),
    ).toMatch(/cota diária/);
    expect(
      getOpenAlexRetryAfterSeconds(new Error(`${OPENALEX_FAILURE_TOKEN_PREFIX}rate_limited:8`)),
    ).toBe(8);
    expect(
      getOpenAlexFailureNotice(
        new Error(`${OPENALEX_FAILURE_TOKEN_PREFIX}provider_not_configured`),
      ),
    ).toMatch(/equipe MOW/);
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

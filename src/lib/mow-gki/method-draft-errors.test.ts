import { describe, expect, it } from "vitest";
import {
  getMethodDraftFailureNotice,
  METHOD_DRAFT_FAILURE_TOKEN_PREFIX,
  toMethodDraftFailureToken,
} from "./method-draft-errors";

describe("method draft failure messages", () => {
  it("maps server-only failures to safe client tokens without leaking provider details", () => {
    const error = new Error("METHOD_DRAFT_NO_AUTHORIZED_TEXT");
    expect(toMethodDraftFailureToken(error)).toBe(
      `${METHOD_DRAFT_FAILURE_TOKEN_PREFIX}no_authorized_text`,
    );
    expect(getMethodDraftFailureNotice(error)).toContain("autorização vigente");
  });

  it("explains that missing WebDev LLM runtime configuration blocks synthesis", () => {
    const error = new Error("MOW_METHOD_DRAFT_FAILURE:llm_not_configured");
    expect(getMethodDraftFailureNotice(error)).toContain("runtime da aplicação");
  });

  it("does not echo arbitrary internal errors to the browser", () => {
    const error = new Error("secret endpoint, response body, and token");
    expect(toMethodDraftFailureToken(error)).toBe(`${METHOD_DRAFT_FAILURE_TOKEN_PREFIX}unexpected`);
    expect(getMethodDraftFailureNotice(error)).not.toContain("secret endpoint");
  });
});

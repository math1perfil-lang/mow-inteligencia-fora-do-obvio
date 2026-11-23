import { describe, expect, it } from "vitest";
import { startOpenAlexResearchRunInputSchema } from "./research-run.schema";

const VALID_INPUT = {
  sourceBriefId: "00000000-0000-4000-8000-000000000001",
  question: "retenção de clientes",
  confirmTopicOnly: true,
};

describe("startOpenAlexResearchRunInputSchema", () => {
  it("requires a UUID and topic-only confirmation for a short query", () => {
    expect(startOpenAlexResearchRunInputSchema.parse(VALID_INPUT)).toEqual(VALID_INPUT);
  });

  it("rejects missing or malformed brief IDs and unconfirmed queries", () => {
    expect(
      startOpenAlexResearchRunInputSchema.safeParse({ ...VALID_INPUT, sourceBriefId: "brief-1" })
        .success,
    ).toBe(false);
    expect(
      startOpenAlexResearchRunInputSchema.safeParse({
        sourceBriefId: VALID_INPUT.sourceBriefId,
        question: VALID_INPUT.question,
      }).success,
    ).toBe(false);
    expect(
      startOpenAlexResearchRunInputSchema.safeParse({
        ...VALID_INPUT,
        confirmTopicOnly: false,
      }).success,
    ).toBe(false);
  });

  it.each([
    "owner@example.com strategy",
    "https://example.invalid/private-brief",
    "password=not-a-real-secret",
    "one two three four five six seven eight nine ten eleven twelve thirteen",
    "first line\nsecond line",
  ])("rejects non-topic or overlong inputs: %s", (question) => {
    expect(
      startOpenAlexResearchRunInputSchema.safeParse({ ...VALID_INPUT, question }).success,
    ).toBe(false);
  });

  it("rejects full-brief or unexpected payload properties", () => {
    expect(
      startOpenAlexResearchRunInputSchema.safeParse({
        ...VALID_INPUT,
        briefContent: "the full private briefing",
      }).success,
    ).toBe(false);
  });
});

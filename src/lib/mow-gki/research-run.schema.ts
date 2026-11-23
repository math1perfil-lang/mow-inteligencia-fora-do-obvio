import { z } from "zod";
import { openAlexQuerySchema } from "./openalex-query.schema";

export const startOpenAlexResearchRunInputSchema = z
  .object({
    sourceBriefId: z.string().uuid(),
    question: openAlexQuerySchema,
    confirmTopicOnly: z.literal(true),
  })
  .strict();

export const openAlexResearchRunSummarySchema = z
  .object({
    id: z.string().uuid(),
    question: z.string().trim().min(1).max(2_000),
    scope: z.string().trim().max(4_000),
    created_at: z.string().datetime({ offset: true }),
  })
  .strict();

export const openAlexResearchRunSummariesSchema = z.array(openAlexResearchRunSummarySchema).max(50);

export type OpenAlexResearchRunSummary = z.infer<typeof openAlexResearchRunSummarySchema>;

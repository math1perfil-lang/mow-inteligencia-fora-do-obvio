import { z } from "zod";

const sourceIdSchema = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9_-]{0,63}$/);
const envNameSchema = z.string().regex(/^MOW_GKI_SOURCE_[A-Z0-9_]{1,80}$/);
const jsonPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .refine((value) => {
    const segments = value.split(".");
    return segments.every(
      (segment) =>
        /^[A-Za-z0-9_$-]+$/.test(segment) &&
        !["__proto__", "prototype", "constructor"].includes(segment),
    );
  }, "O caminho do campo JSON é inválido.");

const httpsUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  }, "A origem deve usar HTTPS sem credenciais.");

const sourceFieldPathsSchema = z
  .object({
    id: jsonPathSchema,
    title: jsonPathSchema,
    url: jsonPathSchema,
    doi: jsonPathSchema.optional(),
    publicationYear: jsonPathSchema.optional(),
    language: jsonPathSchema.optional(),
    publicationType: jsonPathSchema.optional(),
    authors: jsonPathSchema.optional(),
    authorName: jsonPathSchema.optional(),
  })
  .strict();

export const externalJsonSourceConfigSchema = z
  .object({
    id: sourceIdSchema,
    label: z.string().trim().min(1).max(120),
    endpoint: httpsUrlSchema,
    queryParameter: z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/),
    limitParameter: z
      .string()
      .regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/)
      .optional(),
    resultsPath: jsonPathSchema,
    fields: sourceFieldPathsSchema,
    maxResults: z.number().int().min(1).max(20).default(10),
    metadataLicense: z.string().trim().min(1).max(200).nullable().optional(),
    auth: z
      .object({
        envVar: envNameSchema,
        headerName: z.string().regex(/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/),
        prefix: z.string().max(80).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((provider, context) => {
    try {
      const url = new URL(provider.endpoint);
      const host = url.hostname.toLowerCase();
      const localOrPrivateHost =
        host === "localhost" ||
        host.endsWith(".localhost") ||
        host.endsWith(".local") ||
        host.endsWith(".internal") ||
        host.endsWith(".test") ||
        !host.includes(".") ||
        host.includes(":") ||
        /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host);
      if (url.search || url.hash || url.port || localOrPrivateHost) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endpoint"],
          message:
            "A URL-base deve usar host HTTPS público e não pode conter parâmetros, fragmento ou porta personalizada.",
        });
      }
    } catch {
      // The base HTTPS URL validator reports malformed input.
    }
  });

export const externalJsonSourcesConfigSchema = z
  .array(externalJsonSourceConfigSchema)
  .max(10)
  .superRefine((providers, context) => {
    const ids = new Set<string>();
    providers.forEach((provider, index) => {
      if (ids.has(provider.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, "id"],
          message: "Os identificadores internos das fontes devem ser únicos.",
        });
      }
      ids.add(provider.id);
    });
  });

export const externalSourceCandidateSchema = z
  .object({
    providerId: sourceIdSchema,
    providerLabel: z.string().trim().min(1).max(120),
    providerRecordId: z.string().trim().min(1).max(300),
    providerRecordUrl: httpsUrlSchema,
    metadataLicense: z.string().trim().min(1).max(200).nullable(),
    title: z.string().trim().min(1).max(2_000),
    publicationType: z.enum(["article", "book", "document", "other"]),
    doi: httpsUrlSchema.nullable(),
    publicationYear: z.number().int().min(1400).max(3000).nullable(),
    language: z.string().trim().min(1).max(64).nullable(),
    authors: z.array(z.string().trim().min(1).max(500)).max(100),
    contentRightsAssessment: z.literal("unassessed"),
  })
  .strict()
  .superRefine((candidate, context) => {
    if (candidate.doi) {
      try {
        const url = new URL(candidate.doi);
        if (url.hostname !== "doi.org" || !/^\/10\.\d{4,9}\/.+/i.test(url.pathname)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["doi"],
            message: "O DOI deve usar doi.org e conter um identificador válido.",
          });
        }
      } catch {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["doi"],
          message: "O DOI deve usar doi.org e conter um identificador válido.",
        });
      }
    }
  });

export const externalSourceProviderStatusSchema = z
  .object({
    providerId: sourceIdSchema,
    providerLabel: z.string().trim().min(1).max(120),
    status: z.enum(["available", "unavailable", "not_configured"]),
    resultCount: z.number().int().min(0).max(20),
    failureCode: z
      .enum(["timeout", "rate_limited", "auth_failed", "upstream_error", "invalid_response"])
      .nullable(),
  })
  .strict();

export const externalSourceSearchPageSchema = z
  .object({
    state: z.enum(["not_configured", "complete", "partial", "unavailable"]),
    results: z.array(externalSourceCandidateSchema).max(200),
    providers: z.array(externalSourceProviderStatusSchema).max(10),
  })
  .strict();

export type ExternalJsonSourceConfig = z.infer<typeof externalJsonSourceConfigSchema>;
export type ExternalSourceCandidate = z.infer<typeof externalSourceCandidateSchema>;
export type ExternalSourceProviderStatus = z.infer<typeof externalSourceProviderStatusSchema>;
export type ExternalSourceSearchPage = z.infer<typeof externalSourceSearchPageSchema>;

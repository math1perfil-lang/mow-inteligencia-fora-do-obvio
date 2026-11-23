import { z } from "zod";

const httpsUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  }, "URLs de proveniência devem usar HTTPS sem credenciais.");

export const openAlexDoiUrlSchema = httpsUrlSchema.refine((value) => {
  try {
    const url = new URL(value);
    return (
      url.hostname === "doi.org" &&
      !url.search &&
      !url.hash &&
      /^\/10\.\d{4,9}\/.+$/i.test(url.pathname)
    );
  } catch {
    return false;
  }
}, "DOI deve usar doi.org e conter um identificador com formato válido.");

const nullableTextSchema = (max: number) => z.string().trim().min(1).max(max).nullable();

export const openAlexLocationSchema = z
  .object({
    landingPageUrl: httpsUrlSchema.nullable(),
    pdfUrl: httpsUrlSchema.nullable(),
    license: nullableTextSchema(500),
    version: nullableTextSchema(200),
    hostName: nullableTextSchema(500),
    hostType: nullableTextSchema(200),
  })
  .strict();

/** CC0 applies only to the bibliographic metadata represented by this candidate. */
export const openAlexWorkCandidateSchema = z
  .object({
    provider: z.literal("openalex"),
    providerRecordId: z.string().regex(/^W\d+$/),
    providerRecordUrl: httpsUrlSchema,
    metadataLicense: z.literal("CC0"),
    title: z.string().trim().min(1).max(2_000),
    publicationType: z.enum(["article", "book", "document", "other"]),
    doi: openAlexDoiUrlSchema.nullable(),
    publicationYear: z.number().int().min(1400).max(3000).nullable(),
    language: nullableTextSchema(64),
    authors: z.array(z.string().trim().min(1).max(500)).max(500),
    primaryLocation: openAlexLocationSchema.nullable(),
    bestOpenAccessLocation: openAlexLocationSchema.nullable(),
    openAccessSignal: z
      .object({
        isOpenAccess: z.boolean().nullable(),
        status: nullableTextSchema(200),
        url: httpsUrlSchema.nullable(),
      })
      .strict(),
    contentRightsAssessment: z.literal("unassessed"),
  })
  .strict()
  .superRefine((candidate, context) => {
    if (
      candidate.providerRecordUrl !== `https://openalex.org/works/${candidate.providerRecordId}`
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["providerRecordUrl"],
        message: "A URL canônica deve corresponder ao ID do registro OpenAlex.",
      });
    }
  });

export type OpenAlexLocation = z.infer<typeof openAlexLocationSchema>;
export type OpenAlexWorkCandidate = z.infer<typeof openAlexWorkCandidateSchema>;

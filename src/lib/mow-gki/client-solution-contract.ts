import { z } from "zod";

const clientStepSchema = z
  .object({
    id: z.string().regex(/^step-(?:[1-9]|1[0-2])$/),
    order: z.number().int().min(1).max(12),
    name: z.string().trim().min(2).max(160),
    action: z.string().trim().min(10).max(1_000),
    ownerRole: z.string().trim().min(2).max(120),
    duration: z.string().trim().min(2).max(80),
    inputs: z.array(z.string().trim().min(1).max(200)).max(12),
    outputs: z.array(z.string().trim().min(1).max(200)).max(12),
  })
  .strict();

const clientMeasureSchema = z
  .object({
    metric: z.string().trim().min(2).max(160),
    definition: z.string().trim().min(10).max(500),
    cadence: z.string().trim().min(2).max(80),
    targetSetting: z.string().trim().min(10).max(300),
  })
  .strict();

export const clientSolutionSnapshotSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    objective: z.string().trim().min(10).max(1_000),
    methodSteps: z.array(clientStepSchema).min(3).max(12),
    measures: z.array(clientMeasureSchema).min(1).max(20),
  })
  .strict()
  .superRefine((snapshot, context) => {
    const orders = snapshot.methodSteps.map((step) => step.order);
    if (
      new Set(orders).size !== orders.length ||
      orders.some((order, index) => order !== index + 1)
    ) {
      context.addIssue({ code: "custom", path: ["methodSteps"], message: "Etapas fora de ordem" });
    }
    if (snapshot.methodSteps.some((step) => step.id !== `step-${step.order}`)) {
      context.addIssue({
        code: "custom",
        path: ["methodSteps"],
        message: "Identificadores de etapa inválidos",
      });
    }
  });

export type ClientSolutionSnapshot = z.infer<typeof clientSolutionSnapshotSchema>;

const methodDraftProjectionInputSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    methodSteps: z
      .array(
        z
          .object({
            order: z.number().int().min(1).max(12),
            name: z.string().trim().min(2).max(160),
            action: z.string().trim().min(10).max(1_000),
            ownerRole: z.string().trim().min(2).max(120),
            duration: z.string().trim().min(2).max(80),
            inputs: z.array(z.string().trim().min(1).max(200)).max(12),
            outputs: z.array(z.string().trim().min(1).max(200)).max(12),
          })
          .passthrough(),
      )
      .min(3)
      .max(12),
    measures: z
      .array(
        z
          .object({
            metric: z.string().trim().min(2).max(160),
            definition: z.string().trim().min(10).max(500),
            cadence: z.string().trim().min(2).max(80),
            targetSetting: z.string().trim().min(10).max(300),
          })
          .passthrough(),
      )
      .min(1)
      .max(20),
  })
  .passthrough();

/**
 * Creates a client-safe projection from an internal draft. Internal rationale,
 * evidence, citations, risks, limitations, open questions, adaptation notes and model metadata
 * are deliberately not copied. A MOW reviewer supplies the client-facing objective separately.
 */
export function buildClientSolutionSnapshot(
  draftValue: unknown,
  objectiveValue: unknown,
): ClientSolutionSnapshot {
  const draft = methodDraftProjectionInputSchema.parse(draftValue);
  const objective = z.string().trim().min(10).max(1_000).parse(objectiveValue);
  return clientSolutionSnapshotSchema.parse({
    title: draft.title,
    objective,
    methodSteps: draft.methodSteps.map((step) => ({
      id: `step-${step.order}`,
      order: step.order,
      name: step.name,
      action: step.action,
      ownerRole: step.ownerRole,
      duration: step.duration,
      inputs: step.inputs,
      outputs: step.outputs,
    })),
    measures: draft.measures.map(({ metric, definition, cadence, targetSetting }) => ({
      metric,
      definition,
      cadence,
      targetSetting,
    })),
  });
}

export const clientSolutionProgressInputSchema = z
  .object({
    releaseId: z.string().uuid(),
    stepId: z.string().regex(/^step-(?:[1-9]|1[0-2])$/),
    status: z.enum(["not_started", "in_progress", "blocked", "completed"]),
    note: z.string().trim().max(1_000),
  })
  .strict();

export type ClientSolutionProgressInput = z.infer<typeof clientSolutionProgressInputSchema>;

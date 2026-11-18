import { createFileRoute } from "@tanstack/react-router";
import { BriefPreview } from "@/components/method-factory/BriefPreview";

export const Route = createFileRoute("/method-factory/brief-preview")({
  head: () => ({ meta: [{ title: "Briefing · Prévia sem envio — MOW" }] }),
  component: BriefPreview,
});

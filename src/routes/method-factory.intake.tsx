import { createFileRoute } from "@tanstack/react-router";
import { FactoryIntake } from "@/components/method-factory/FactoryIntake";

export const Route = createFileRoute("/method-factory/intake")({
  head: () => ({
    meta: [
      { title: "Briefing por convite · MOW Method Factory" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: FactoryIntake,
});

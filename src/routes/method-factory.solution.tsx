import { createFileRoute } from "@tanstack/react-router";
import { ClientSolutionPortal } from "@/components/method-factory/ClientSolutionPortal";

export const Route = createFileRoute("/method-factory/solution")({
  head: () => ({
    meta: [
      { title: "Minha solução · MOW Method Factory" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: ClientSolutionPortal,
});

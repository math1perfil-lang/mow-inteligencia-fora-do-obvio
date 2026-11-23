import { createFileRoute } from "@tanstack/react-router";
import { FactoryReview } from "@/components/method-factory/FactoryReview";

export const Route = createFileRoute("/method-factory/review")({
  head: () => ({
    meta: [
      { title: "Revisão interna · MOW Method Factory" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: FactoryReview,
});

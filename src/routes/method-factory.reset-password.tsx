import { createFileRoute } from "@tanstack/react-router";
import { FactoryPasswordReset } from "@/components/method-factory/FactoryPasswordReset";

export const Route = createFileRoute("/method-factory/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha · MOW Method Factory" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: FactoryPasswordReset,
});

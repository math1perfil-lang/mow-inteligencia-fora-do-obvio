import { createFileRoute } from "@tanstack/react-router";
import { StartModule } from "@/components/academy/StartModule";

export const Route = createFileRoute("/academy/start/")({
  head: () => ({ meta: [{ title: "Módulo Start — MOW Academy" }] }),
  component: () => <StartModule />,
});

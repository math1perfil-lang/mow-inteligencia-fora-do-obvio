import { createFileRoute, redirect } from "@tanstack/react-router";

/** O diagnóstico agora faz parte do Módulo Start. */
export const Route = createFileRoute("/academy/diagnostico")({
  beforeLoad: () => {
    throw redirect({ to: "/academy/start" });
  },
});

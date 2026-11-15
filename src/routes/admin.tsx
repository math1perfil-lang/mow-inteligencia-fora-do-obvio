import { useEffect } from "react";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { LoginForm } from "@/components/admin/LoginForm";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { useAdminSession } from "@/hooks/useAdminSession";
import { flushPendingAudio } from "@/lib/admin/audio-queue";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — MOW" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminLayout,
});

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 text-center">
      <div className="max-w-md space-y-4">{children}</div>
    </div>
  );
}

function AdminLayout() {
  const session = useAdminSession();

  // Reenvia gravações que ficaram guardadas neste notebook (loja sem internet).
  useEffect(() => {
    if (session.status !== "ready") return;
    const flush = async () => {
      try {
        const sent = await flushPendingAudio();
        if (sent > 0) toast.success(`${sent} gravação(ões) pendente(s) enviada(s).`);
      } catch {
        // IndexedDB indisponível: nada a reenviar.
      }
    };
    void flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [session.status]);

  if (session.status === "loading") {
    return (
      <Centered>
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </Centered>
    );
  }

  if (session.status === "unconfigured") {
    return (
      <Centered>
        <h1 className="text-xl font-semibold">Banco de dados não configurado</h1>
        <p className="text-sm text-muted-foreground">
          Faltam as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY. Conecte o Supabase ao
          projeto e publique de novo.
        </p>
      </Centered>
    );
  }

  if (session.status === "signed_out") {
    return (
      <>
        <LoginForm canSignUp={session.canSignUp} />
        <Toaster />
      </>
    );
  }

  if (session.status === "forbidden") {
    return (
      <Centered>
        <h1 className="text-xl font-semibold">Sem permissão</h1>
        <p className="text-sm text-muted-foreground">
          A conta {session.email ?? ""} não tem acesso de administrador.
        </p>
        <Button variant="outline" onClick={() => void session.signOut()}>
          Sair
        </Button>
      </Centered>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-4 px-5">
          <nav className="flex items-center gap-6 text-sm">
            <span className="eyebrow text-muted-foreground">MOW · Admin</span>
            <Link
              to="/admin"
              activeOptions={{ exact: true }}
              className="text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              Entrevistas
            </Link>
            <Link
              to="/admin/analise"
              className="text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              Análise
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">{session.email}</span>
            <Button variant="ghost" size="sm" onClick={() => void session.signOut()}>
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1280px] px-5 py-8">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { BarChart3, ClipboardList, LayoutDashboard, ListChecks, LogOut, Menu, X } from "lucide-react";
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
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center px-5 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="text-xl font-semibold">Erro no painel</h1>
        <p className="break-words text-sm text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
        <a href="/admin" className="text-sm underline underline-offset-4">
          Recarregar
        </a>
      </div>
    </div>
  ),
});

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 text-center">
      <div className="max-w-md space-y-4">{children}</div>
    </div>
  );
}

const NAV = [
  { to: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
  { to: "/admin/entrevistas", label: "Entrevistas", icon: ClipboardList, exact: false },
  { to: "/admin/analise", label: "Análise", icon: BarChart3, exact: false },
  { to: "/admin/roteiros", label: "Roteiros", icon: ListChecks, exact: false },
] as const;

function AdminLayout() {
  const session = useAdminSession();
  const [menuOpen, setMenuOpen] = useState(false);

  // Aplica o tema do painel ao <html>, para valer também em diálogos e avisos.
  useEffect(() => {
    document.documentElement.classList.add("admin-theme");
    return () => document.documentElement.classList.remove("admin-theme");
  }, []);

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

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Principal">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: item.exact }}
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/65 transition-colors hover:bg-white/10 hover:text-white"
          activeProps={{ className: "bg-white/10 text-white" }}
        >
          <item.icon className="size-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const account = (
    <div className="space-y-2 border-t border-white/10 pt-4">
      <p className="truncate px-3 text-xs text-white/50">{session.email}</p>
      <button
        type="button"
        onClick={() => void session.signOut()}
        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/65 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut className="size-4" />
        Sair
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col justify-between bg-ink p-4 text-paper lg:flex">
        <div className="space-y-6">
          <div className="px-3 pt-1">
            <p className="text-base font-semibold tracking-tight">MOW</p>
            <p className="text-xs text-white/50">Validação de mercado</p>
          </div>
          {nav}
        </div>
        {account}
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-ink px-4 text-paper lg:hidden">
        <p className="text-base font-semibold tracking-tight">MOW · Admin</p>
        <button
          type="button"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-md p-2 hover:bg-white/10"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>
      {menuOpen ? (
        <div className="fixed inset-x-0 top-14 z-30 space-y-4 bg-ink p-4 text-paper shadow-lg lg:hidden">
          {nav}
          {account}
        </div>
      ) : null}

      <main className="px-4 py-6 sm:px-8 sm:py-8 lg:ml-60">
        <div className="mx-auto max-w-[1100px]">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

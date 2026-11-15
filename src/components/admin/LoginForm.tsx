import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabase } from "@/lib/supabase";

export function LoginForm({ canSignUp }: { canSignUp: boolean }) {
  const [mode, setMode] = useState<"entrar" | "cadastrar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const auth = getSupabase().auth;
      if (mode === "entrar") {
        const { error: err } = await auth.signInWithPassword({ email: email.trim(), password });
        if (err) setError("E-mail ou senha incorretos.");
      } else {
        const { data, error: err } = await auth.signUp({ email: email.trim(), password });
        if (err) setError(err.message);
        else if (!data.session)
          setInfo("Cadastro criado. Confirme o e-mail que você recebeu e depois entre.");
      }
    } catch {
      setError("Não foi possível conectar. Verifique sua internet e tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <form onSubmit={submit} className="w-full max-w-sm space-y-6 border border-border bg-card p-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Área restrita</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {mode === "entrar" ? "Entrar" : "Criar primeira conta"}
          </h1>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-email">E-mail</Label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-password">Senha</Label>
          <Input
            id="admin-password"
            type="password"
            autoComplete={mode === "entrar" ? "current-password" : "new-password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Aguarde…" : mode === "entrar" ? "Entrar" : "Criar conta"}
        </Button>

        {canSignUp ? (
          <button
            type="button"
            className="w-full text-center text-sm text-muted-foreground underline underline-offset-4"
            onClick={() => setMode(mode === "entrar" ? "cadastrar" : "entrar")}
          >
            {mode === "entrar" ? "Ainda não tenho conta (primeiro acesso)" : "Já tenho conta"}
          </button>
        ) : null}
      </form>
    </div>
  );
}

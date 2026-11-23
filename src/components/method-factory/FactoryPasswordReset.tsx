import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabase } from "@/lib/supabase";

type RecoveryState = "checking" | "ready" | "invalid" | "complete";

export function FactoryPasswordReset() {
  const [state, setState] = useState<RecoveryState>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function establishRecoverySession() {
      const query = new URLSearchParams(window.location.search);
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const code = query.get("code");
      const recoveryType = fragment.get("type") ?? query.get("type");
      const accessToken = fragment.get("access_token");
      const refreshToken = fragment.get("refresh_token");
      const returnedError = query.get("error") ?? fragment.get("error");

      if (returnedError) {
        window.history.replaceState(null, document.title, window.location.pathname);
        if (active) setState("invalid");
        return;
      }

      try {
        const supabase = getSupabase();
        let recoveryError: Error | null = null;

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          recoveryError = exchangeError;
        } else if (recoveryType === "recovery" && accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          recoveryError = sessionError;
        } else {
          recoveryError = new Error("Invalid recovery callback");
        }

        window.history.replaceState(null, document.title, window.location.pathname);
        if (active) setState(recoveryError ? "invalid" : "ready");
      } catch {
        window.history.replaceState(null, document.title, window.location.pathname);
        if (active) setState("invalid");
      }
    }

    void establishRecoverySession();
    return () => {
      active = false;
    };
  }, []);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (password.length < 8) {
      setError("Use uma senha com pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setBusy(true);
    try {
      const supabase = getSupabase();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError("Não foi possível atualizar a senha. Solicite um novo link e tente novamente.");
        return;
      }

      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      setPassword("");
      setConfirmPassword("");
      if (signOutError) {
        setNotice(
          "A senha foi atualizada. Feche esta aba antes de entrar novamente para encerrar a sessão de recuperação.",
        );
      } else {
        setNotice("Senha atualizada. Agora volte à Revisão interna e entre com a nova senha.");
      }
      setState("complete");
    } catch {
      setError("Não foi possível atualizar a senha. Solicite um novo link e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl px-5 py-12 sm:px-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/60">
        Method Factory · recuperação de acesso
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Redefinir senha</h1>

      {state === "checking" ? (
        <p role="status" className="mt-4 text-sm text-white/70">
          Validando o link de recuperação…
        </p>
      ) : null}

      {state === "invalid" ? (
        <div className="mt-5 space-y-4">
          <p role="alert" className="text-sm leading-relaxed text-white/75">
            Este link é inválido, expirou ou já foi usado. Volte à tela de login e solicite um novo.
          </p>
          <Button asChild variant="outline" className="min-h-11">
            <Link to="/method-factory/review">Voltar à Revisão interna</Link>
          </Button>
        </div>
      ) : null}

      {state === "ready" ? (
        <>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Escolha uma nova senha para sua conta Supabase.
          </p>
          <form onSubmit={(event) => void updatePassword(event)} className="mt-7 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="factory-new-password">Nova senha</Label>
              <Input
                id="factory-new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 border-white/25 bg-white/[0.025]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="factory-confirm-password">Confirme a nova senha</Label>
              <Input
                id="factory-confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-12 border-white/25 bg-white/[0.025]"
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-white">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="min-h-12 w-full" disabled={busy}>
              {busy ? "Atualizando…" : "Salvar nova senha"}
            </Button>
          </form>
        </>
      ) : null}

      {state === "complete" ? (
        <div className="mt-5 space-y-4">
          <p role="status" className="text-sm leading-relaxed text-white/75">
            {notice}
          </p>
          <Button asChild variant="outline" className="min-h-11">
            <Link to="/method-factory/review">Ir para o login</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}

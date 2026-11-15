import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { adminExists, hasAdminRole } from "@/lib/admin/api";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export type AdminStatus = "loading" | "unconfigured" | "signed_out" | "forbidden" | "ready";

export interface AdminSession {
  status: AdminStatus;
  email: string | null;
  /** Verdadeiro só enquanto ainda não existe nenhum admin (primeiro cadastro). */
  canSignUp: boolean;
  signOut: () => Promise<void>;
}

export function useAdminSession(): AdminSession {
  const [status, setStatus] = useState<AdminStatus>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [canSignUp, setCanSignUp] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStatus("unconfigured");
      return;
    }
    const supabase = getSupabase();
    let active = true;

    const resolve = async (session: Session | null) => {
      if (!active) return;
      if (!session) {
        setEmail(null);
        setStatus("signed_out");
        try {
          const exists = await adminExists();
          if (active) setCanSignUp(!exists);
        } catch {
          if (active) setCanSignUp(false);
        }
        return;
      }
      setEmail(session.user.email ?? null);
      try {
        const ok = await hasAdminRole(session.user.id);
        if (active) setStatus(ok ? "ready" : "forbidden");
      } catch {
        if (active) setStatus("forbidden");
      }
    };

    void supabase.auth.getSession().then(({ data }) => resolve(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // Adia a chamada: não é seguro chamar o Supabase de dentro do próprio callback.
      window.setTimeout(() => void resolve(session), 0);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
  }, []);

  return { status, email, canSignUp, signOut };
}

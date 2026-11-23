import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { verifyOpenAlexOwner } from "./openalex.functions";

export type OpenAlexOwnerAccess = {
  userId: string | null;
  status: "checking" | "allowed" | "denied" | "no_session" | "unconfigured";
  version: number;
};

const INITIAL_ACCESS: OpenAlexOwnerAccess = {
  userId: null,
  status: "checking",
  version: 0,
};

export function useOpenAlexOwnerAccess(): OpenAlexOwnerAccess {
  const [access, setAccess] = useState(INITIAL_ACCESS);

  useEffect(() => {
    let active = true;
    let requestVersion = 0;
    let supabase: ReturnType<typeof getSupabase>;

    try {
      supabase = getSupabase();
    } catch {
      setAccess({ userId: null, status: "unconfigured", version: ++requestVersion });
      return () => {
        active = false;
      };
    }

    const verifySession = (session: Session | null) => {
      const version = ++requestVersion;
      const userId = session?.user.id ?? null;
      if (!userId) {
        setAccess({ userId: null, status: "no_session", version });
        return;
      }

      setAccess({ userId, status: "checking", version });
      void verifyOpenAlexOwner({ data: {} })
        .then(() => {
          if (active && requestVersion === version) {
            setAccess({ userId, status: "allowed", version });
          }
        })
        .catch(() => {
          if (active && requestVersion === version) {
            setAccess({ userId, status: "denied", version });
          }
        });
    };

    const initialAuthEventVersion = requestVersion;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => verifySession(session));

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active && requestVersion === initialAuthEventVersion) {
          if (error) setAccess({ userId: null, status: "denied", version: ++requestVersion });
          else verifySession(data.session);
        }
      })
      .catch(() => {
        if (active && requestVersion === initialAuthEventVersion) {
          setAccess({ userId: null, status: "denied", version: ++requestVersion });
        }
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return access;
}

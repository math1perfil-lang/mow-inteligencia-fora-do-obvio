import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function readEnv(): { url: string | undefined; key: string | undefined } {
  const env = import.meta.env as Record<string, string | undefined>;
  return {
    url: env["VITE_SUPABASE_URL"],
    key: env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? env["VITE_SUPABASE_ANON_KEY"],
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = readEnv();
  return Boolean(url && key);
}

/**
 * Cliente do Supabase criado sob demanda (só no navegador, depois do login).
 * Lança "SUPABASE_NOT_CONFIGURED" quando as variáveis de ambiente não existem.
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;
  const { url, key } = readEnv();
  if (!url || !key) throw new Error("SUPABASE_NOT_CONFIGURED");
  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}

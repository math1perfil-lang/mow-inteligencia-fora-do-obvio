import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type ResearchRunSummary = {
  id: string;
  question: string;
  scope: string;
  created_at: string;
};

type GkiDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Functions"> & {
    Functions: Database["public"]["Functions"] & {
      gki_list_openalex_research_runs: {
        Args: Record<string, never>;
        Returns: ResearchRunSummary[];
      };
      gki_start_openalex_research_run: {
        Args: { p_source_brief_id: string; p_question: string; p_scope?: string };
        Returns: ResearchRunSummary[];
      };
      gki_acquire_openalex_discovery_lease: {
        Args: { p_research_run_id: string };
        Returns: string;
      };
      gki_release_openalex_discovery_lease: {
        Args: { p_lease_token: string };
        Returns: boolean;
      };
    };
  };
};

/**
 * Descreve os tipos locais da fachada RPC pública GKI. O cast não comprova a jornada real
 * por PostgREST; essa integração ainda depende de uma chamada autenticada com sessão owner.
 */
export function asGkiSupabaseClient(client: SupabaseClient<Database>): SupabaseClient<GkiDatabase> {
  return client as unknown as SupabaseClient<GkiDatabase>;
}

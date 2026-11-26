import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";

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
      gki_search_source_rights_reviews_v1: {
        Args: { p_search: string; p_limit?: number };
        Returns: Array<{
          source_id: string;
          title: string;
          source_type: string;
          canonical_url: string | null;
          catalog_rights_status: string;
          rights_review_id: string | null;
          decision_status: string | null;
          permitted_uses: string[] | null;
          rights_basis: string | null;
          rights_evidence_url: string | null;
          restrictions: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          valid_until: string | null;
          restrictions_reviewed: boolean | null;
          restrictions_satisfied: boolean | null;
        }>;
      };
      gki_record_source_rights_review_v1: {
        Args: { p_source_id: string; p_review_input: Json };
        Returns: Array<{
          rights_review_id: string;
          source_id: string;
          decision_version: number;
          decision_status: string;
          permitted_uses: string[];
          reviewed_by: string;
          reviewed_at: string;
          valid_until: string | null;
          restrictions_reviewed: boolean;
          restrictions_satisfied: boolean;
        }>;
      };
      mow_factory_get_brief_review: {
        Args: { p_brief_id: string };
        Returns: Json;
      };
      gki_record_method_draft_v1: {
        Args: {
          p_brief_id: string;
          p_draft: Json;
          p_evidence_manifest: Json;
          p_model_id: string;
          p_prompt_version: string;
        };
        Returns: Array<{ draft_id: string; created_at: string }>;
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

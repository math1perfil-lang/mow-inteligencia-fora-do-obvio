# Method Factory — contrato do banco (levantado a partir do código)

**Origem:** extraído de `src/lib/method-factory/workflow.functions.ts`, `src/lib/mow-gki/openalex.functions.ts` e `src/lib/mow-gki/client-solution.functions.ts` em 2026-11-26. **Não é o SQL real.**

## Estado verificado

- As migrações do repositório (`supabase/migrations/`) criam só `interviews`, `interview_answers`, `interview_feature_picks` e `user_roles`.
- `src/integrations/supabase/types.ts` (tipos gerados) também só lista essas tabelas.
- O código chama **21 funções RPC** do Method Factory/GKI cujo SQL **não está no repositório**. Se existem, estão só no banco hospedado.
- Os dois projetos Supabase da conta conectada à sessão de revisão (`vpanzwmbaexdikaiuyeb`, `rwqamzgrrlitgarzthkb`) não têm nenhuma tabela em `public`. O banco do app provavelmente é outro (por exemplo o Lovable Cloud) e não foi inspecionado.
- Nada foi aplicado ou alterado em nenhum banco.

## Funções que o código exige

Os retornos abaixo são o que o código valida; os formatos exatos ainda precisam ser conferidos no banco.

### Operador (usuário autenticado e ativo)
| Função | Argumentos | Retorno esperado |
|---|---|---|
| `mow_factory_is_active_operator` | — | `true` |
| `mow_factory_create_invite` | `p_name, p_industry, p_relationship_type, p_token_hash, p_expires_at` | uuid do convite |
| `mow_factory_revoke_invite` | `p_invite_id` | `true` |
| `mow_factory_list_inbox` | — | linhas com `organizations`, `pain_points[]`, `analysis_runs[]` aninhados |
| `mow_factory_get_brief_review` | `p_brief_id` | objeto (ou 1ª linha) com `analysis_runs[]` |
| `mow_factory_update_brief_status` | `p_brief_id, p_status` | `true` |
| `mow_factory_approve_method_version` | `p_method_version_id` | `true` |

### Convite anônimo (token sempre em hash SHA-256)
| Função | Argumentos | Retorno esperado |
|---|---|---|
| `mow_factory_check_invite` | `p_token_hash` | `true/false` |
| `mow_factory_submit_invited_brief` | `p_token_hash, p_payload, p_pains[]` (`title, domain, urgency, description`) | confirmação |

### GKI: pesquisa e direitos de fontes (somente owner ativo)
| Função | Argumentos | Observações |
|---|---|---|
| `gki_list_openalex_research_runs` | — | lista; também usada como checagem de acesso |
| `gki_start_openalex_research_run` | `p_source_brief_id, p_question, p_scope` | 1 linha com o resumo da execução |
| `gki_acquire_openalex_discovery_lease` | `p_research_run_id` | token de reserva; erros: `42501` proibido, `P0002` não encontrado, `55000` execução não está em andamento |
| `gki_release_openalex_discovery_lease` | `p_lease_token` | `true` |
| `gki_search_source_rights_reviews_v1` | `p_search, p_limit` | linhas da fila/catálogo de direitos |
| `gki_record_source_rights_review_v1` | `p_source_id, p_review_input` | 1 linha com a revisão gravada |
| `gki_record_method_draft_v1` | `p_brief_id, p_draft, p_evidence_manifest, p_model_id, p_prompt_version` | rascunho gravado |

### Entrega ao cliente
| Função | Argumentos | Retorno esperado |
|---|---|---|
| `mow_factory_publish_client_solution_v1` | `p_brief_id, p_draft_id, p_snapshot, p_invitee_email, p_token_hash, p_expires_at` | publicação |
| `mow_factory_accept_client_solution_invite_v1` | `p_token_hash` | `true` |
| `mow_factory_list_client_solutions_v1` | — | linhas com `release_id, release_version, released_at` |
| `mow_factory_list_client_solution_progress_v1` | `p_release_id` | linhas com `status` |
| `mow_factory_update_client_solution_progress_v1` | `p_release_id, p_step_id, p_status, p_note` | `true` |

## Variáveis de ambiente do servidor citadas no código
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (convite anônimo). A chamada ao modelo de IA (`gpt-6.1-sol`) e as fontes JSON configuráveis dependem de credenciais de servidor que não aparecem no repositório.

## O que falta para ir adiante
1. Exportar do banco real o schema (`pg_dump --schema-only` ou o SQL das funções acima) para este repositório, ou confirmar que ele não existe.
2. Se não existir, escrever as migrações aditivas, com revisão de segurança (RLS, grants, token só em hash) antes de aplicar. Isso é o item D do `TODO.md`.
3. Só então gerar o tipo `Database` completo e testar o fluxo ponta a ponta.

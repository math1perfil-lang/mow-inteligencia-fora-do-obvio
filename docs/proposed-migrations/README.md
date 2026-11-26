# Migrações propostas (não aplicadas)

Arquivos aqui são **propostas para revisão**. Não estão em `supabase/migrations/`, portanto nada os executa automaticamente.

## `20261126000000_method_factory_intake_review.sql`
Cobre 8 das 21 funções que o código chama: operador, convites, envio do briefing, caixa de entrada, revisão e mudança de status.

**Ficou de fora de propósito**
- `mow_factory_approve_method_version`: o código mantém `METHOD_APPROVAL_BACKEND_READY = false` com 4 bloqueadores listados em `approval-gate.ts`. Não faz sentido criar a aprovação no banco antes disso.
- As 7 funções `gki_*` (pesquisa, reservas, direitos das fontes, rascunho do método) e as 5 de entrega ao cliente. São maiores e dependem de decisões de modelo de dados e direitos autorais.

**Limites desta proposta**
- Nunca foi executada. Não havia Postgres no ambiente, então a sintaxe não foi validada.
- Os formatos de retorno vêm do que o código lê, sem confirmação no banco real.
- Se o banco do app já tiver funções com esses nomes, aplicar isto sobrescreve (`create or replace`). Conferir antes.
- Ninguém grava em `mow_factory_analysis_runs` no código atual; a tabela só serve à leitura.
- Falta revisar RLS, grants e o isolamento do convite (item D do `TODO.md`).

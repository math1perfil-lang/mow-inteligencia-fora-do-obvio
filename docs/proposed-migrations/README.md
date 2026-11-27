# Migrações propostas (não aplicadas)

Arquivos aqui são **propostas para revisão**. Não estão em `supabase/migrations/`, portanto nada os executa automaticamente.

## `20261126000000_method_factory_intake_review.sql`
Cobre 8 das 21 funções que o código chama: operador, convites, envio do briefing, caixa de entrada, revisão e mudança de status.

**Ficou de fora de propósito**
- `mow_factory_approve_method_version`: o código mantém `METHOD_APPROVAL_BACKEND_READY = false` com 4 bloqueadores listados em `approval-gate.ts`. Não faz sentido criar a aprovação no banco antes disso.
- As 7 funções `gki_*` (pesquisa, reservas, direitos das fontes, rascunho do método) e as 5 de entrega ao cliente. São maiores e dependem de decisões de modelo de dados e direitos autorais.

**Limites desta proposta**
- Testada em 2026-11-27 num projeto Supabase vazio, dentro de uma transação desfeita (`tests/intake_review_rollback_test.sql`): sintaxe válida e fluxo completo OK (convite único, envio anônimo, bloqueio de reenvio, anon e não-operador negados, inbox, revisão, status). Depois do teste o projeto continuou sem tabelas. Ainda não testada contra o banco real do app.
- Os formatos de retorno vêm do que o código lê, sem confirmação no banco real.
- Se o banco do app já tiver funções com esses nomes, aplicar isto sobrescreve (`create or replace`). Conferir antes.
- Ninguém grava em `mow_factory_analysis_runs` no código atual; a tabela só serve à leitura.
- Falta revisar RLS, grants e o isolamento do convite (item D do `TODO.md`).

## `20261127000000_method_factory_gki.sql`
As 7 funções `gki_*`: execuções de pesquisa, reserva exclusiva da busca externa, fila e registro de revisões de direitos, e gravação do rascunho do método. Depende da migração de intake acima.

- **Direitos das fontes:** por decisão do dono, a proposta só **registra** a decisão informada (versionada por fonte). Não há regra que bloqueie uma fonte com direito pendente, restrito ou revogado. Se isso for desejado depois, precisa ser acrescentado.
- **Teste:** rodada em 2026-11-27 em transação desfeita num projeto Supabase vazio (ver `tests/gki_rollback_test.sql`); todos os cenários listados lá passaram e o projeto continuou sem tabelas. Para isolar o teste, a migração de intake foi substituída por 3 stubs mínimos. As duas migrações juntas, na ordem, não foram testadas em conjunto contra o banco real.
- **Não coberto:** nada no código atual grava em `gki_sources`, então a busca só devolve fontes inseridas manualmente. A aprovação do método e a entrega ao cliente (5 funções `mow_factory_*_client_solution_*` e `approve_method_version`) continuam sem SQL.

## `20261127010000_method_factory_source_catalog.sql`
O **acervo de fontes**: estende `gki_sources` (área, DOI, ano, idioma, autores, resumo, link aberto, licença, origem) e cria `gki_source_texts` para o texto completo. Quatro funções para operador ativo: importar em lote (até 100, sem duplicar por origem + id), guardar texto, ler texto e buscar no acervo (por palavras no título/resumo e por área). Depende das duas migrações anteriores.

- **Teste:** transação desfeita num projeto Supabase vazio, 2026-11-27, com stubs mínimos para as dependências: reimportação sem duplicar, busca por título/resumo, filtro por área, curinga literal, guardar e reler texto, formato inválido e fonte inexistente recusados, não-operador e anônimo negados. Projeto continuou sem tabelas.
- **Importador não existe ainda:** estas funções só guardam. Falta o código de servidor que busca na OpenAlex (o cliente já existe em `src/lib/mow-gki/server/openalex-client.ts`), traz resumos, preenche as áreas e baixa texto completo.
- **Texto completo:** o banco aceita até 2 MB por fonte. Quais fontes terão texto e como extrair de PDF é decisão do importador, não do SQL.

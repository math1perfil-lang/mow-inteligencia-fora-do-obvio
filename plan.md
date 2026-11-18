# Plano — MOW Method Factory e briefing da Fanaticamente

**Status:** primeiro corte aprovado pelo usuário e implementado localmente em 17/11/2026. O usuário aprovou a prévia navegável sem persistência, autorizou a Fanaticamente como empresa participante do piloto e escolheu convite individual expirável. Build, TypeScript, 14 testes e lint dos novos arquivos passaram. Nenhuma alteração de produção, migração, gravação de dados reais, publicação ou compra está autorizada por este plano.

## Objetivo e comportamento requerido

Evoluir progressivamente o app MOW React/TanStack existente com uma área `/method-factory` separada do site institucional e do painel `/admin/entrevistas`. O primeiro incremento deve estruturar e demonstrar o briefing da empresa. A Fanaticamente é uma empresa do sócio-majoritário da MOW; o caso é real, porém relacionado ao proprietário e não equivale a validação independente da demanda de mercado.

O formulário deve pedir contexto, problemas, resultados desejados, parcerias comerciais, aquisição/uso da plataforma, evidências disponíveis, restrições e critérios de sucesso. Deve perguntar qual é o modelo da plataforma, os grupos de usuários e quem paga, sem supor de antemão uma plataforma de dois lados. Deve aceitar “não sei”, “não se aplica” e “não medimos” como respostas legítimas. A entrada inicial aceita texto estruturado, links públicos e dados agregados; não recebe arquivos, gravações, contatos nem dados identificáveis de usuários finais.

O usuário é o revisor humano do método. O envio de um briefing não deverá disparar geração automática de método nem marcar uma metodologia como validada. A saída de IA será acrescentada em etapa posterior, depois de selecionar a integração disponível, revisar custos, direitos e segurança. Fontes com direitos pendentes não podem ser processadas automaticamente; conteúdo de livros e artigos deve ser rastreado e não copiado sem permissão aplicável.

## Limites da primeira entrega

A primeira implementação será uma **prévia navegável, sem persistência**, com dados fictícios e mensagem visível de que o formulário ainda não recebe nem armazena respostas. Não serão gerados links reais de convite nem tokens no frontend. Não haverá chamadas a IA, envio de webhook, upload, escrita no Supabase ou acesso às tabelas de entrevistas.

Depois de concluir a revisão de grants, RLS, funções expostas, autenticação, Storage e tratamento do `.env` versionado, será preparada uma migração aditiva isolada para análise. A migração não será aplicada. Só após revisão e autorização explícita poderão ser implementados token aleatório limitado e expirável, armazenamento seguro da submissão e uma página externa que aceite apenas o envio do brief.

## Implementação e fronteiras

- Stack: reaproveitar React 19, TanStack Start/Router, Vite, Tailwind e componentes já presentes; não trocar o framework.
- Rotas pretendidas: `/method-factory` para visão geral interna; `/method-factory/brief-preview` para a prévia interna do questionário; reservar `/method-factory/intake/$token` para a fase segura, ainda não ativa.
- Separação: não reutilizar rotas, páginas, tabelas, áudio, contatos, roteiros ou lógica de entrevista de `/admin`.
- Segurança futura: convites de submissão única com token criptograficamente aleatório, apenas hash persistido, data de expiração, revogação e leitura negada; submissão sem acesso ao painel. Revisar privilégios SQL, RLS, funções, grants e storage. Nada é implantado em produção nesta etapa.
- Dados: não capturar e-mail/nome do parceiro se não for necessário. A permissão do proprietário da empresa não autoriza automaticamente tratamento de dados pessoais de usuários finais.
- Pesquisa/fonte: guardar metadados e referências; distinguir observação, fonte, síntese, hipótese e recomendação MOW.
- Versionamento: trabalhar em branch local isolada `manus/method-factory-intake`, usando uma worktree separada do checkout de auditoria; não fazer commit/push para `main` nem sincronizar ao Lovable sem autorização.

## Estrutura de projeto prevista

- `src/routes/method-factory.tsx`: layout/entrada e proteção da área interna quando a autorização for implementada.
- `src/routes/method-factory.index.tsx`: resumo da Factory, estado do piloto e acesso à prévia.
- `src/routes/method-factory.brief-preview.tsx`: formulário de briefing de demonstração, sem persistência.
- `src/components/method-factory/`: cabeçalho, progresso por etapa, campos, avisos de privacidade, estado de prévia e componentes específicos do formulário.
- `src/lib/method-factory/brief-schema.ts`: tipos e validação compartilháveis do briefing, sem chamadas externas.
- `src/lib/method-factory/`: futuras funções servidoras para convite, submissão e acesso, somente depois da revisão de segurança.
- `supabase/migrations/`: migração futura aditiva a ser criada apenas para revisão; nunca aplicada nesta etapa.
- `plan.md` e `TODO.md`: decisões de produto, design, estrutura e progresso do desenvolvimento local.

Não editar `src/routeTree.gen.ts` manualmente; TanStack o gera. Não alterar `/`, estilos globais do site ou a rota `/admin`.

## Design

- **Movimento:** editorial suíço/digital, com brutalismo leve inspirado no próprio site MOW, sem copiar o tema claro específico de entrevistas.
- **Princípios:** foco em clareza; confiança sem burocracia; conteúdo por etapas com progresso explícito; rigor sem fingir certeza.
- **Paleta:** preservar preto, branco e cinzas MOW com acentos de alto contraste para estados e progresso; não introduzir uma nova cor de marca global.
- **Layout:** formulário em coluna de leitura confortável, barra lateral/linha de progresso em telas largas e navegação linear em celular; evitar dashboards densos e tabelas antes de haver dados.
- **Elementos:** número/estado da etapa, cartões de contexto, etiquetas “informado pela empresa”, “não medido” e “direito pendente”.
- **Interação:** permitir voltar sem perder o que foi digitado durante a sessão; mostrar claramente o que é obrigatório; validar os campos necessários; não guardar respostas depois que a página fecha; submeter não deve aparentar sucesso.
- **Microcopy:** direta, acolhedora e ligeiramente irreverente sem banalizar privacidade ou problema comercial. Exemplo: “Não mede isso hoje? Marque ‘não medimos’. Melhor uma lacuna honesta do que um número inventado.”
- **Tipografia:** manter Geist e Geist Mono já carregadas pelo site; não adicionar fontes externas.
- **Marca:** usar a identidade textual MOW e os componentes atuais; não gerar ilustração decorativa para ferramenta interna.

## Dependências e custos

O primeiro incremento não exige novas bibliotecas, provedor de IA, banco, armazenamento ou serviço pago. Os custos de banco/modelo/armazenamento só podem ser estimados depois de definir o serviço de IA e volume de uso; nenhuma integração será presumida. O teste local pode necessitar instalar dependências a partir do lockfile existente, sem ler/imprimir valores de `.env`.

## Restrições operacionais

- Não aplicar DDL/DML no Supabase Mow Group nesta etapa.
- Não processar informação interna da Fanaticamente antes do envio pelo fluxo autorizado e da revisão de acesso/retention.
- Não usar entrevistas, gravações, contatos, CSVs ou dados do painel existente.
- Não criar cópia de aplicação gerenciada separada, não fazer push, não publicar e não remover `.env` do repositório sem aprovação e plano de rotação/impacto.
- Como o app Lovable/GitHub não tem recurso Manus Webdev anexado nesta sessão, trabalhar somente na worktree local já indicada; validações utilizarão os scripts do projeto. A falta de preview gerenciado será explicitada.

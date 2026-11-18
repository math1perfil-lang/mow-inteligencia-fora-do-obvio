# TODO — MOW Method Factory

## A. Prévia navegável do briefing (concluído localmente — não publicado)

**Evidência:** rotas `/method-factory` e `/method-factory/brief-preview` responderam HTTP 200; 14 testes passaram, incluindo navegação, retorno, limpeza, detalhes condicionais e simulação sem rede/storage. Build e TypeScript passaram, assim como lint dos novos arquivos. Revisão somente leitura não identificou defeitos materiais. A área é um protótipo sem acesso a dados internos, não um painel privado operacional com autenticação.

**Critérios de aceitação**
- Existe uma área `/method-factory` distinta da página pública e da rota `/admin/entrevistas`.
- O briefing de demonstração está dividido em etapas claras para contexto do negócio; problemas e resultados desejados; parcerias; aquisição e uso da plataforma; evidências e materiais; restrições e critérios de sucesso.
- O formulário pergunta qual é o modelo da plataforma, quais grupos usam/pagam e o que cada grupo recebe de valor; não presume marketplace ou dois lados.
- Há espaço de narrativa e campos estruturados com ramificações pertinentes; “não sei”, “não se aplica” e “não medimos” podem ser selecionados sem bloqueio ou sugestão de inventar valor.
- As respostas pedem período e unidade para métricas agregadas quando disponíveis.
- A primeira versão não solicita nomes ou contatos de parceiros, listas de clientes, credenciais, gravações, transcrições ou dados identificáveis de usuários finais; aceita texto estruturado e links, sem upload de arquivos.
- A prévia mostra em local visível que é protótipo e que nenhum dado é enviado ou armazenado. A ação de envio não pode fingir sucesso nem chamar webhook/IA/Supabase.
- O formulário mantém os campos enquanto o usuário navega pelas etapas da mesma sessão, valida campos obrigatórios e é utilizável em celular e com teclado.

## B. Acesso por convite limitado — bloqueado pela revisão de segurança

**Critérios de aceitação**
- O responsável interno pode criar um convite individual para uma empresa específica.
- O convite usa valor aleatório suficiente, armazena somente hash, tem expiração e pode ser revogado/invalidado após submissão.
- A rota de convite permite apenas enviar um briefing; não pode ler o próprio briefing após submissão, outros briefs, métodos, painel ou dados administrativos.
- Tokens inválidos, expirados, revogados ou já usados falham de forma segura sem revelar a existência de outros registros.
- O token não é gravado em logs, analytics, URL referer de terceiros ou localStorage; definir política segura de cache/headers e evitar indexação.
- A implementação depende de nova persistência e de revisão explícita de segurança; não aplicar migração ou permitir dados reais antes da aprovação.

## C. Revisão interna de brief e governança — aberto

**Critérios de aceitação**
- O usuário é revisor humano designado e consegue identificar o estado do briefing recebido.
- Status distinguem recebido, em análise, precisa de esclarecimentos, aprovado para síntese e arquivado.
- O revisor identifica origem, autorização, direitos e limites dos materiais; fontes com direitos pendentes não alimentam processamento automático.
- Toda síntese registra se o conteúdo é informação da empresa, fonte externa, interpretação, hipótese ou recomendação autoral MOW.
- Aprovação humana de um rascunho não é chamada de validação; status de método validado exige evidência de aplicação.

## D. Segurança e privacidade do projeto — bloqueador antes da persistência

**Critérios de aceitação**
- Revisar grants, policies RLS, funções expostas, permissões de Storage e papéis do projeto Mow Group, além de acesso no cliente e servidor.
- Criar proposta de tabelas novas, sem dependência das tabelas, políticas, áudio ou dados de entrevistas.
- Criar migração aditiva para revisão sem aplicá-la no Supabase compartilhado/produção.
- Confirmar armazenamento de token apenas como hash, escopo de acesso e limites de retenção/apagamento.
- Manter qualquer chave privilegiada exclusivamente no servidor; não imprimir, copiar ou expor valores do `.env` versionado.
- Não armazenar PII, gravações, credenciais ou dados de usuário final que não sejam indispensáveis e autorizados.

## E. Cadastro de fontes e direitos — aberto

**Critérios de aceitação**
- Uma fonte registra autoria, título, origem/URL, data/versão, titularidade, licença ou autorização conhecida, usos permitidos, restrições e responsável.
- O sistema diferencia fonte pública apenas consultável, licença aberta, autorização específica, material próprio, domínio público e direitos pendentes.
- Livros/artigos adquiridos ou acessíveis não são considerados automaticamente licenciados para reprodução, adaptação comercial, armazenamento integral ou redistribuição.
- A MOW produz sínteses e instrumentos originais, com referências localizáveis, sem apresentar conceitos de terceiros como invenção própria.

## F. Síntese de conhecimento e método assistidos — aberto, depende da seleção de IA

**Critérios de aceitação**
- Qualquer chamada de modelo ocorre do lado do servidor, somente após selecionar integração real, revisar custo, credencial e disponibilidade.
- Um brief enviado não aciona geração sem revisão inicial humana.
- Cada afirmação relevante é ligada à fonte/localização quando disponível ou rotulada como informação da empresa, interpretação, hipótese ou recomendação MOW.
- O método resultante inclui objetivo, público, problema, premissas, princípios, etapas, instrumentos, critérios de saída, responsáveis, métricas, limites e fontes.
- A aprovação do usuário é necessária antes de piloto/aplicação; geração por IA isoladamente nunca valida o método.

## G. Registro de aplicação e aprendizado — aberto

**Critérios de aceitação**
- Cada execução registra versão usada, responsável, resultado esperado, observado, dificuldades, evidências e aprendizados.
- O piloto Fanaticamente é marcado como caso real de empresa relacionada ao proprietário, não como validação independente de mercado.
- Divulgação de caso ou resultados externos requer autorização específica, separada do consentimento para participar.

## H. Entrega do primeiro corte — concluída apenas na branch local, acesso gerenciado pendente

**Evidência:** build local, TypeScript e testes concluídos; manifesto com 8 rotas respondeu JSON/HTTP 200. Nenhum push/publicação ou migração executados. O lint global tem 656 erros e 8 avisos, reproduzidos no commit-base com os mesmos arquivos de configuração; não foram corrigidos por estarem fora deste corte. A aplicação Lovable não tem Resource WebDev vinculado nesta sessão; não existe Preview gerenciado nem versão atualizada no site público.

**Critérios de aceitação**
- Toda alteração fica na branch local `manus/method-factory-intake` e não é enviada a `main`/Lovable nem publicada sem autorização.
- Build, tipos, lint e testes existentes são executados quando o ambiente puder ser restaurado com segurança.
- A rota manifestada pelo app permanece sincronizada quando uma configuração Webdev/hosting compatível estiver disponível.
- Nenhuma tarefa é marcada completa sem evidência funcional e sem preservar as limitações da prévia versus persistência real.

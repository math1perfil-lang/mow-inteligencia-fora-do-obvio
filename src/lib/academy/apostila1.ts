import {
  CASOS,
  GLOSSARIO,
  QUIZ,
  RUBRICA,
  RUBRICA_ANCORAS,
  U6_MODELO,
  U7_CHECKLIST,
} from "./modulo1";

export const APOSTILA1_TITULO =
  "MOW Academy — IA Corporativa | Módulo 1: Fundamentos de IA Corporativa";

const code = (t: string) => "```text\n" + t + "\n```";

const TEXTO_BASE = `#### Aprender antes de acelerar

A primeira competência de quem usa IA no trabalho não é escrever comandos complexos. É saber escolher uma tarefa adequada e reconhecer o que precisa ser conferido. Um texto elegante pode conter um prazo inventado. Uma análise pode confundir correlação com causa. Um resumo pode transformar uma sugestão em decisão.

Neste módulo, você aprenderá a usar a velocidade da IA sem confundir fluência com confiança técnica. O resultado será uma coleção inicial de cinco prompts da sua área e o registro de um teste. Os exemplos são fictícios para que a prática não dependa da exposição de informações internas.

#### Quatro operações diferentes

Gerar conteúdo, buscar informação, calcular e executar ações são operações distintas. A geração cria ou transforma textos e outros conteúdos. A busca recupera fontes. O cálculo opera sobre valores segundo regras. A automação executa etapas e ações.

Uma mesma aplicação pode combinar essas capacidades, mas você precisa confirmar quais estão disponíveis. A existência de um campo de conversa não comprova acesso à web, aos arquivos da empresa ou a uma ferramenta de cálculo. Um modelo pode escrever uma fórmula sem executá-la, assim como pode mencionar uma fonte sem tê-la consultado.

Antes de começar, descreva a operação principal: quero localizar uma norma, reescrever um comunicado, somar lançamentos ou enviar lembretes? A resposta ajuda a selecionar a ferramenta e o controle necessário.

#### O que um modelo de linguagem faz

Um modelo de linguagem processa entradas e produz saídas de acordo com o contexto e o que aprendeu em seu desenvolvimento. Pode reconhecer padrões, seguir instruções e construir explicações. Isso não o torna uma pessoa nem uma autoridade profissional.

A instrução “atue como analista” ajuda a orientar a perspectiva. Não comprova habilitação, acesso a sistemas nem responsabilidade técnica. Quando a decisão exige um profissional qualificado, o papel da IA deve continuar limitado ao apoio permitido.

No trabalho, responsabilidade começa pela definição de quem revisará a entrega. Evite o raciocínio “a ferramenta disse, então está certo”. Pergunte de onde veio a informação, como foi obtida e o que falta verificar.

#### Prompt e contexto

Prompt é a entrada que orienta a tarefa. Contexto é o conjunto de informações disponíveis e relevantes para realizá-la. Um bom contexto pode incluir público, objetivo, dados, exemplos, políticas aplicáveis e limites.

Ser específico não significa escrever muito. “Faça um relatório” é vago porque não define objetivo nem formato. “Transforme estas notas em um resumo executivo com situação, pendências e próximos passos; marque como não informado o que faltar” é mais útil porque orienta a transformação e protege contra preenchimentos indevidos.

Evite o excesso de informação. Dados irrelevantes podem dificultar o foco e aumentar a exposição. Para um aviso de manutenção, talvez bastem período aprovado, público afetado e canal de suporte. Salários e CPFs não ajudam a resolver essa tarefa.

#### Tokens e janela de contexto

Tokens são unidades usadas no processamento da informação. Podem representar partes de palavras, palavras e outros elementos. Não há uma proporção fixa universal entre palavras e tokens.

A janela de contexto indica a capacidade de informação considerada em determinado uso. Seu tamanho varia entre modelos e configurações. Caber no limite não significa que todo detalhe foi corretamente recuperado ou interpretado.

Ao trabalhar com documentos, verifique se a ferramenta realmente teve acesso ao material. Em tarefas críticas, peça referências a seções ou trechos e confira o original. Não presuma que outra conversa será lembrada; reapresente os dados necessários se o produto não oferecer essa continuidade de maneira explícita.

#### Alucinação e fontes

Alucinação é conteúdo incorreto ou sem sustentação apresentado como válido. O problema não se restringe a grandes invenções. Uma pequena alteração de prazo ou a atribuição indevida de uma decisão pode gerar consequências operacionais.

A regra “não invente” é uma orientação útil, mas não uma garantia. Para reduzir o risco, delimite a fonte, indique como tratar lacunas e verifique a resposta. Em pesquisa, abra as referências e confira se sustentam a afirmação. Uma citação aparente também pode estar errada.

Observe a diferença entre fato, hipótese e recomendação. Fato é algo sustentado pelo material disponível. Hipótese é uma explicação a investigar. Recomendação é uma proposta de ação. Não apresente uma hipótese como se fosse conclusão demonstrada.

#### Viés e revisão

Vieses podem surgir dos dados, das instruções, dos critérios e do uso da ferramenta. Em atividades que envolvem pessoas, confira se os critérios são pertinentes à tarefa, se há generalizações e se algum grupo está sendo tratado de forma injusta.

Revisão humana não é apenas “dar uma olhada”. É comparar o resultado com as fontes, conferir os pontos de maior impacto e decidir se a entrega é adequada. O responsável deve ter competência para a verificação exigida.

Uma revisão feita pelo próprio modelo pode ser útil, mas não substitui validação independente. Em temas jurídicos, financeiros, trabalhistas ou de segurança, envolva os responsáveis adequados.

#### Dados pessoais e confidencialidade

Dado pessoal se relaciona a uma pessoa identificada ou identificável. Dado pessoal sensível tem definição específica na LGPD, incluindo categorias como saúde, origem racial ou étnica, convicção religiosa, opinião política, filiação sindical e dados genéticos ou biométricos vinculados a uma pessoa.

Informação empresarial confidencial é outra classificação: inclui estratégia não divulgada, condição comercial e segredo de negócio, com ou sem dados pessoais. Dados financeiros e salários podem demandar proteção elevada sem serem automaticamente sensíveis na definição legal.

Não trate a simples remoção de nomes como anonimização garantida. Cargo, local, idade e outros detalhes podem permitir identificar alguém. Use exemplos fictícios no curso e siga a política da empresa em atividades reais.

Antes de usar dados reais, verifique necessidade, finalidade, base legal aplicável, permissões, acesso e condições do fornecedor. Não conclua que um plano pago, por si só, resolve todas as exigências. Esta orientação é introdutória e não substitui análise jurídica.

#### Escolha da tarefa e da ferramenta

Uma boa tarefa inicial é frequente, reversível, verificável e de baixo risco. Exemplos incluem rascunhar uma pauta, organizar um checklist e transformar dados fictícios em um resumo.

Uma tarefa inadequada para começar é uma decisão sensível automatizada, uma ação irreversível ou uma demanda que exige compartilhar dados sem autorização. A IA pode apoiar partes dessas atividades em contextos devidamente governados, mas isso não significa delegar a decisão nem dispensar regras internas.

ChatGPT, Claude, Gemini, Microsoft 365 Copilot e Perplexity são plataformas que podem ser exploradas conforme a tarefa e os recursos disponíveis. Não há necessidade de usar todas. Compare requisitos, autorização, acesso a documentos, pesquisa, cálculo e custo antes de escolher.

Recursos e planos mudam. Consulte a documentação atual e o ambiente efetivamente contratado, sem se apoiar apenas no nome da plataforma.

#### PACTO como apoio

Neste curso, PACTO significa Papel, Ação, Contexto, Tom e Output. É um apoio didático, não uma lei da tecnologia. Um prompt simples pode funcionar muito bem se a tarefa estiver clara e o contexto for suficiente.

Papel orienta a perspectiva; ação define o trabalho; contexto fornece a situação; tom ajusta a comunicação; output especifica a estrutura. Acrescente restrições, tratamento de lacunas e forma de conferência quando necessário.

Exemplo transversal: “Organize as notas abaixo em uma pauta de 30 minutos para o time. Use tom objetivo, entregue tópicos com tempo sugerido e marque decisões pendentes. Não invente participantes ou compromissos. Fonte: [notas fictícias].”

O valor do prompt aparece no teste. Se a resposta falha, observe se faltam informações, se o objetivo está confuso ou se a ferramenta não dispõe do recurso necessário.

#### Testar e documentar

Escolha um dos cinco prompts e execute-o com o caso fictício. Guarde a resposta e confira fonte, números, lacunas, formato, compromissos e segurança. Identifique uma melhoria e registre uma nova versão.

Se não tiver ferramenta disponível, use a comparação guiada com resposta inadequada e padrão de conferência. A habilidade exercitada é reconhecer erros e melhorar a instrução, não apenas apertar um botão.

Uma biblioteca profissional registra tarefa, versão, fonte, limites e evidências do teste. Não basta salvar uma frase bonita. Você deve saber em que situação o prompt funciona e o que ainda precisa ser revisado.

Ao medir tempo, inclua preparação, revisão e correção. Um rascunho produzido em segundos pode demandar muito trabalho de conferência. Sem uma comparação justa, não prometa economia.

#### Sua entrega

Ao concluir este módulo, reúna a matriz de oportunidades, os cinco prompts, o teste documentado e três limites de delegação. Atualize seu perfil e escolha o próximo experimento de baixo risco.

Na Semana 2, você aprofundará a estrutura das instruções e aprenderá a tornar as entregas mais consistentes. A meta continua a mesma: usar IA para ampliar sua capacidade sem transferir a ela sua responsabilidade.`;

export function buildApostila1(): string {
  const s: string[] = [];
  s.push(`# ${APOSTILA1_TITULO}

*Material de apoio. A experiência principal do módulo é interativa e orientada a tarefas. Esta apostila está disponível desde o início e não depende de nota.*`);
  s.push(`## Texto-base\n\n${TEXTO_BASE}`);
  s.push(`## Anexo A — Casos e tarefas por trilha

Todos os dados abaixo são fictícios. Não solicite clientes, currículos ou contratos reais para completar o módulo. Cada aluno produz cinco prompts, um para cada tarefa da sua trilha. O exemplo resolvido é apenas referência.

${CASOS.map(
  (c) => `### ${c.nome}

**Caso:** ${c.caso}

**Cinco tarefas:**

${c.tarefas.map((t, i) => `${i + 1}. ${t}`).join("\n")}

**Prompt resolvido (referência):**

${code(c.resolvido)}

**Padrão esperado / conferência:** ${c.padrao}

**Verificação humana:** ${c.verificacao}

**Resposta inadequada do laboratório:** “${c.inadequada}”. Problemas: ${c.errosReais.join(" ")}`,
).join("\n\n")}`);
  s.push(`## Anexo B — Modelos

### Modelo PACTO editável

${code(U6_MODELO)}

### Modelo de registro de teste

${code(`Prompt v1:
Fonte fictícia:
Ferramenta ou modo guiado:
Resposta recebida:
Três verificações realizadas:
Erro ou melhoria identificada:
Prompt v2:
Resposta v2 (opcional):
Decisão final:
Observações:`)}

Checklist para teste: ${U7_CHECKLIST.join("; ")}.

Registro de tempo é opcional. Não proclame economia sem comparação equivalente que inclua revisão e correção.`);
  s.push(`## Anexo C — Rubrica das entregas

Aplicada a cada prompt, com notas de 0 a 4. Âncoras: ${RUBRICA_ANCORAS.map((a, i) => `${i} ${a}`).join("; ")}.

| Critério | Peso |
|---|---:|
${RUBRICA.map((r) => `| ${r.label} | ${r.peso}% |`).join("\n")}

Nota final = soma dos pesos multiplicados pela nota do critério, dividida por 4; escala de 0 a 100. Faixas propostas: 85–100 excelente; 70–84 bom com ajustes; 50–69 revisão necessária; abaixo de 50 reconstrução guiada. Para concluir, cada prompt precisa de pelo menos 70. Pendência crítica de segurança (como pedir senha ou inserir dados reais sem condições adequadas) não é compensada por nota alta.

Nesta plataforma a avaliação é **${"Autoavaliação guiada — sem correção automática por IA"}**.`);
  s.push(`## Anexo D — Checklist final

- [ ] Atividades das oito unidades realizadas.
- [ ] Quiz com pelo menos 8 de 10 acertos.
- [ ] Cinco prompts completos, com nota mínima 70.
- [ ] Um teste ou comparação guiada documentado.
- [ ] Três limites de delegação definidos.
- [ ] Pendências críticas de segurança resolvidas.
- [ ] Perfil de Uso de IA atualizado.`);
  s.push(`## Anexo E — Quiz com gabarito

${QUIZ.map((q, i) => `**Q${i + 1}.** ${q.q}\n\n${q.options.map((o, j) => `${String.fromCharCode(65 + j)}) ${o}`).join("  \n")}\n\n**Correta:** ${String.fromCharCode(65 + q.answer)}. ${q.why}`).join("\n\n")}`);
  s.push(`## Glossário

${GLOSSARIO.map(([t, d]) => `- **${t}:** ${d}`).join("\n")}`);
  s.push(`## Fontes e controle editorial

Material-base original preparado para a MOW Academy. PACTO é um recurso didático do curso e não método oficial, exclusivo ou registrado de qualquer fornecedor. As regras de progressão são propostas da MOW Academy para este módulo, não requisitos legais ou normas universais.

Referências para conferência editorial (**checagem editorial pendente**: as páginas não foram lidas nem validadas nesta versão):

- OpenAI, Prompt engineering: https://developers.openai.com/api/docs/guides/prompt-engineering
- OpenAI, Model optimization: https://developers.openai.com/api/docs/guides/model-optimization
- Google, Learn about prompts: https://support.google.com/docs/answer/15013615
- Lei 13.709/2018 (LGPD), especialmente o art. 5º: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- Documentação oficial dos fornecedores para recursos, licenças e armazenamento efetivamente usados.`);
  return s.join("\n\n");
}

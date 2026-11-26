import {
  CHECKLIST,
  FUNDAMENTOS,
  IA_AJUDA,
  IA_NAO_DECIDE,
  JOURNEY,
  MINI_OPCOES,
  MINI_SITUACOES,
  MODELO_PROMPT,
  NOT_THIS_COURSE,
  PACTO,
  PACTO_EXEMPLO,
  REGRAS_SEGURANCA,
  TRILHAS,
  WELCOME_GOALS,
} from "./start";

export const APOSTILA_TITULO =
  "MOW Academy — IA Corporativa | Módulo Start: Boas-vindas e Diagnóstico";

const list = (a: string[]) => a.map((x) => `- ${x}`).join("\n");
const code = (t: string) => "```text\n" + t + "\n```";

export function buildApostila(): string {
  const s: string[] = [];
  s.push(`# ${APOSTILA_TITULO}

**MOW Academy · Curso IA Corporativa**
*Use Inteligência Artificial para produzir mais, decidir melhor e transformar seu trabalho — com trilhas aplicadas à sua área.*

Duração estimada do módulo: 60 a 90 minutos. Material de apoio à experiência interativa.`);

  s.push(`## 1. Objetivos de aprendizagem

Ao concluir o Módulo Start, você será capaz de:

- Entender a proposta da MOW Academy e do curso IA Corporativa.
- Compreender os fundamentos básicos de IA generativa.
- Identificar oportunidades reais de uso de IA no próprio trabalho.
- Reconhecer tarefas que exigem supervisão humana.
- Escolher sua trilha de aprendizagem por área de atuação.
- Criar seu primeiro prompt profissional.
- Receber feedback sobre a qualidade do prompt.
- Gerar seu Perfil de Uso de IA.
- Estar preparado para iniciar o Módulo 1.`);

  s.push(`## 2. Introdução

Muita gente já usou uma ferramenta de IA generativa por curiosidade: pediu uma receita, um resumo, uma ideia de título. O desafio começa quando é preciso usar a mesma tecnologia no trabalho, com prazo, responsabilidade e dados que não são seus. Nesse ponto, o “uso aleatório” cobra um preço: respostas genéricas, retrabalho, riscos de confidencialidade e a sensação de que a ferramenta promete mais do que entrega.

Este curso parte de uma ideia simples: a IA rende mais quando é usada com método. Método significa saber qual tarefa vale a pena entregar à IA, dar a ela as informações certas, pedir a entrega no formato certo, revisar o resultado e guardar o que funcionou para reutilizar.

O Módulo Start é a porta de entrada. Em até 90 minutos você conhece a proposta, responde a um diagnóstico, escolhe a trilha da sua área, aprende os fundamentos, treina com um mini-desafio, escreve seu primeiro prompt e recebe feedback. No final, tem em mãos um Perfil de Uso de IA que personaliza as oito semanas seguintes.`);

  s.push(`## 3. Apresentação da MOW Academy

A **MOW Academy** foi criada para transformar conhecimento em prática profissional. O objetivo é ajudar pessoas e empresas a usarem Inteligência Artificial de forma inteligente, ética e orientada a resultados.

Não acreditamos que IA seja sobre substituir pessoas. Acreditamos que IA é sobre ampliar a capacidade humana: dar mais velocidade a tarefas repetitivas, organizar informações dispersas, gerar primeiras versões, apoiar análises e liberar tempo para o que realmente exige julgamento, criatividade e responsabilidade.

Durante as próximas 8 semanas, você vai aprender a:

${list(WELCOME_GOALS)}

Este curso **não** é:

${list(NOT_THIS_COURSE)}

Este curso é sobre **aplicar IA com inteligência, método e responsabilidade**. Ao final, você terá construído o seu **Sistema de Prompts Corporativo**: uma biblioteca pessoal de prompts, fluxos e templates para usar no dia a dia da sua área.`);

  s.push(`## 4. Como funciona o curso

O curso tem 8 semanas, precedidas pelo Módulo Start. Cada semana combina explicações curtas, exemplos aplicados à sua área, tarefas práticas, feedback sobre as entregas e um desafio. As semanas são liberadas em sequência: para avançar, conclua a anterior. No fim, você entrega um projeto final e, cumpridos os critérios, emite o certificado.

| Elemento | Função |
|---|---|
${JOURNEY.map(([a, b]) => `| ${a} | ${b} |`).join("\n")}

Regra de ouro: **não avance apenas lendo.** A cada etapa, aplique o conteúdo a uma situação real do seu trabalho. Quanto mais você praticar com situações reais, mais rápido desenvolverá uma habilidade útil e duradoura.`);

  s.push(`## 5. Como funciona a experiência interativa

A plataforma da MOW Academy acompanha o seu avanço. No Módulo Start, você percorre 12 etapas:

1. Boas-vindas.
2. Como funciona a experiência.
3. Diagnóstico do aluno.
4. Escolha da trilha.
5. Fundamentos de IA corporativa.
6. Onde a IA ajuda e onde não deve decidir sozinha.
7. Framework PACTO.
8. Mini-desafio.
9. Criação do primeiro prompt.
10. Avaliação do prompt.
11. Perfil de Uso de IA.
12. Checklist de conclusão.

Seu progresso, suas respostas e seus prompts ficam salvos no navegador que você está usando. A avaliação do prompt é automática, por regras, e analisa a **forma** do texto (papel, contexto, formato, restrições); ela não verifica se o conteúdo é verdadeiro e não substitui a opinião de um instrutor.`);

  s.push(`## 6. Diagnóstico de perfil

O diagnóstico tem 12 perguntas e serve para personalizar sua experiência. Você será perguntado sobre:

- Sua área de atuação e seu cargo ou função.
- Seu nível de experiência com IA e as ferramentas que já utiliza.
- Seu principal objetivo com IA e as tarefas que gostaria de acelerar.
- As entregas que produz com mais frequência e o tipo da sua rotina (operacional, analítica, de liderança ou estratégica).
- Os indicadores importantes no seu trabalho.
- As informações que **não** podem ser compartilhadas com ferramentas de IA.
- Seus maiores desafios hoje e se você já usa IA em alguma tarefa.

Suas respostas ajudam o sistema a selecionar exemplos, tarefas, templates, estudos de caso e projetos adequados. Você pode atualizar essas informações depois.`);

  s.push(`## 7. Trilhas por área

As oito trilhas abaixo definem os exemplos, exercícios, templates, estudos de caso e o projeto final que você receberá. É possível alterar a trilha depois, se necessário.

${TRILHAS.map(
  (t) => `### Trilha ${t.n} — ${t.nome}

${t.descricao}

**Tarefas frequentes:** ${t.tarefas.join(" ")}

**Exemplos de uso de IA:** ${t.exemplos.join(" ")}

**Indicadores relevantes:** ${t.indicadores.join(" ")}

**Exemplo de projeto final:** ${t.projeto}${t.importante ? `\n\n> **Importante:** ${t.importante}` : ""}`,
).join("\n\n")}`);

  s.push(`## 8. Fundamentos de IA corporativa

${FUNDAMENTOS.map(
  (f) =>
    `### ${f.titulo}\n\n${f.corpo.join("\n\n")}${f.lista ? `\n\n${list(f.lista)}` : ""}${
      f.codigo
        ? `\n\n${f.codigo.map((c) => `**${c.rotulo}**\n\n${code(c.texto)}`).join("\n\n")}`
        : ""
    }${f.regra ? `\n\n**Regra prática:** ${f.regra}` : ""}`,
).join("\n\n")}`);

  s.push(`## 9. Riscos e uso responsável

### Onde a IA ajuda

| Tarefa | Como a IA ajuda |
|---|---|
${IA_AJUDA.map(([a, b]) => `| ${a} | ${b} |`).join("\n")}

### Onde a IA não deve decidir sozinha

A IA não deve substituir decisões humanas em situações como:

${list(IA_NAO_DECIDE)}

Nesses casos, a IA pode ajudar a **organizar informações, levantar hipóteses e preparar análises**, mas a decisão final deve pertencer a uma pessoa qualificada.

### Regras de segurança

${list(REGRAS_SEGURANCA)}

Uma boa prática para qualquer tarefa: antes de enviar um texto à ferramenta, releia e troque nomes, números e documentos reais por exemplos fictícios ou anonimizados. Se a tarefa realmente exigir dados reais, confirme antes se a empresa autoriza e quais são as políticas de privacidade e segurança da ferramenta.`);

  s.push(`## 10. Framework PACTO

O PACTO organiza um prompt em cinco elementos.

| Letra | Elemento | Pergunta-chave |
|---|---|---|
${PACTO.map((p) => `| **${p.letra}** | ${p.nome} | ${p.pergunta} |`).join("\n")}

${PACTO.map((p) => `- **${p.nome}:** ${p.detalhe}`).join("\n")}

Exemplo completo:

${code(PACTO_EXEMPLO)}

Depois do PACTO, acrescente sempre as **restrições**: o que a IA não deve fazer (por exemplo, não inventar informações), o limite de tamanho e a orientação para usar apenas os dados fornecidos. Restrições são a parte do prompt que mais protege você de respostas inventadas.`);

  s.push(`## 11. Exemplos de prompts

Modelo para completar:

${code(MODELO_PROMPT)}

Exemplos por trilha:

${TRILHAS.map((t) => `### ${t.nome}\n\n${code(t.exemploPrompt)}`).join("\n\n")}`);

  s.push(`## 12. Mini-desafio: a IA pode ajudar?

Para cada situação, escolha uma das opções: ${MINI_OPCOES.map((o) => `**${o}**`).join(" · ")}

${MINI_SITUACOES.map(
  (m, i) =>
    `**Situação ${i + 1}.** ${m.texto}\n\n*Resposta:* ${MINI_OPCOES[m.correta]} ${m.porque}`,
).join("\n\n")}`);

  s.push(`## 13. Exercícios práticos

1. **Mapa de oportunidades.** Liste cinco tarefas da sua semana. Para cada uma, classifique: “IA pode apoiar, com revisão humana”, “exige validação de fontes”, “IA não deve decidir sozinha” ou “não deve receber essas informações”.
2. **Do simples ao profissional.** Pegue um pedido que você já fez a uma IA (“escreva um e-mail para o cliente”) e reescreva usando o PACTO, com restrições.
3. **Contexto em tópicos.** Para a mesma tarefa, escreva três versões do contexto: mínimo, adequado e excessivo. Qual funcionou melhor? Por quê?
4. **Revisão humana.** Escolha uma resposta de IA e liste o que você precisa conferir antes de usá-la: números, nomes, datas, promessas, tom.
5. **Lista do que não compartilho.** Escreva sua lista pessoal de informações que nunca vão para uma ferramenta de IA sem autorização, com um exemplo fictício substituto para cada uma.`);

  s.push(`## 14. Modelo de Perfil de Uso de IA

${code(`MEU PERFIL DE USO DE IA

Área de atuação:
Cargo ou função:
Nível de experiência:
Ferramenta principal:
Objetivo principal:
Trilha recomendada:
Tarefas prioritárias:
Entregas frequentes:
Tipo de rotina:
Indicadores importantes:
Informações que não posso compartilhar:
Principais desafios:
Oportunidades de uso de IA:
Primeiro prompt criado:
Regras de segurança:
Próximo passo:`)}

A plataforma preenche esse perfil com base no diagnóstico, na trilha escolhida e no seu primeiro prompt. Revise e edite antes de salvar.`);

  s.push(`## 15. Avaliação do primeiro prompt

Seu primeiro prompt é avaliado por seis critérios:

| Critério | Pergunta-chave | Peso |
|---|---|---:|
| Clareza | O objetivo está claro? | 20% |
| Papel | O papel da IA está definido? | 15% |
| Contexto | Há informações suficientes? | 20% |
| Formato | O formato da entrega está definido? | 15% |
| Restrições | Há limites e regras de segurança? | 15% |
| Aplicabilidade | O prompt resolve uma tarefa real? | 15% |

Níveis: Excelente, Bom com ajustes, Precisa melhorar e Precisa refazer. O feedback traz pontos fortes, pontos a melhorar, sugestões específicas e, quando possível, uma versão melhorada do seu prompt.`);

  s.push(`## 16. Checklist de conclusão

${CHECKLIST.map((c) => `- [ ] ${c}`).join("\n")}`);

  s.push(`## 17. Glossário inicial

- **IA generativa:** tecnologia que cria textos, imagens, códigos, áudios ou vídeos a partir de instruções.
- **Prompt:** instrução entregue à IA para orientar a resposta.
- **Contexto:** informações que ajudam a IA a entender a tarefa.
- **PACTO:** framework com Papel, Ação, Contexto, Tom e Output.
- **Alucinação:** informação incorreta ou inventada apresentada com aparência de verdade.
- **Viés:** distorção nas respostas, muitas vezes refletindo padrões dos dados de treinamento.
- **Dado sensível:** informação que identifica uma pessoa ou expõe dados confidenciais de uma empresa.
- **Revisão humana:** verificação feita por uma pessoa antes de usar uma resposta de IA.
- **Trilha:** percurso personalizado por área de atuação.
- **Sistema de Prompts Corporativo:** biblioteca pessoal de prompts, fluxos e templates construída ao longo do curso.`);

  s.push(`## 18. Próximos passos

Concluído o Módulo Start, o seu Perfil de Uso de IA passa a personalizar os exemplos, tarefas, templates e desafios das próximas semanas.

No **Módulo 1 — Fundamentos de IA Corporativa**, você vai aprofundar sua compreensão sobre IA generativa, aprender a identificar oportunidades reais de uso e criar seus primeiros prompts aplicados à sua área.

Antes de começar, teste seu primeiro prompt em uma situação real (com dados fictícios ou autorizados), registre o que funcionou e salve a melhor versão na sua biblioteca.`);

  return s.join("\n\n");
}

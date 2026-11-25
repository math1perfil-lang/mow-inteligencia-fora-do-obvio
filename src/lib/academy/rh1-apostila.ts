import {
  CICLO_NOTA,
  CICLO_RH,
  COMPONENTES_NOTA,
  CRIVO,
  CRIVO_NOTA,
  ERROS_CRITICOS_DEF,
  ESCALA_COMPONENTE,
  FONTES,
  GLOSSARIO_RH,
  HORIZONTE,
  MAPA_FUNCIONAL,
  MAPA_NOTA,
  METRICAS,
  METRICAS_NOTA,
  PILOTO_DIAS,
  PILOTO_NOTA,
  REFERENCIAS,
  REFERENCIAS_NOTA,
  RH_AVISO_FICCAO,
  RH_QUIZ,
  RH_TAREFAS,
  RUBRICA,
  RUBRICA_ANCORAS,
  TEMPLATE_TEXTO,
  U2_NOTA_JURIDICA,
  U7A,
  U7B,
  FAIXAS,
  LAB_DICA,
  MSG,
} from "./rh1";

export const APOSTILA_RH1_TITULO =
  "MOW Academy — IA Corporativa | Recursos Humanos e Gestão de Pessoas | Módulo 1 — IA na prática do RH";

const code = (t: string) => "```text\n" + t + "\n```";
const list = (a: string[]) => a.map((x) => `- ${x}`).join("\n");

const BASE: [string, string[]][] = [
  [
    "O papel profissional continua sendo seu",
    [
      "Uma entrega de RH pode afetar como uma pessoa entende sua candidatura, sua entrada na empresa, seu desenvolvimento ou seus direitos. Por isso, usar IA exige mais do que obter uma resposta rápida. Exige preservar a diferença entre fato, proposta e decisão.",
      "A ferramenta pode organizar um rascunho, resumir uma diretriz e sugerir uma estrutura de conversa. Ela não conhece automaticamente a política da empresa, não recebe autoridade para decidir e não deve preencher lacunas com aquilo que parece comum no mercado.",
      "Neste módulo, o objetivo é desenvolver uma competência inicial completa: transformar uma demanda de RH em instrução, produzir uma entrega, conferir o resultado e definir quem aprova. O caso fictício Horizonte Serviços permite praticar sem expor pessoas reais.",
    ],
  ],
  [
    "Enxergue tarefas, não promessas amplas",
    [
      "“Aplicar IA em RH” é uma intenção, não um projeto. Um projeto começa quando você escolhe um produto de trabalho e sabe como avaliar sua qualidade.",
      "No recrutamento, esse produto pode ser uma descrição de vaga derivada de uma requisição. No onboarding, um plano com etapas e responsáveis. No atendimento, um FAQ baseado em política. No desenvolvimento, um roteiro que usa fatos observáveis e prevê escuta.",
      "A mesma lógica se estende a outras frentes: planejamento de pessoas, benefícios, remuneração, carreira, relações de trabalho, clima e indicadores. Mas isso não torna todos os usos equivalentes. A tarefa pode ser simples; a decisão apoiada por ela pode ser sensível.",
      "Um mapa de oportunidades útil contém tarefa, fonte, saída, risco, aprovador e critério de conferência. Evite começar por automações que afetam pessoas sem compreender o processo.",
    ],
  ],
  [
    "Como a IA participa do trabalho",
    [
      "Uma ferramenta de IA generativa produz conteúdo a partir das entradas e recursos disponíveis. Pode transformar texto, estruturar ideias e apoiar análises. Algumas aplicações têm busca, acesso a arquivos e cálculo; outras não. Confirme a capacidade habilitada antes de confiar na execução.",
      "Não é necessário estudar uma plataforma de cada vez para começar. ChatGPT e Claude podem ser usados para rascunhos e revisão conforme os recursos disponíveis. Gemini pode ser uma opção em ambientes Google Workspace; Microsoft 365 Copilot, em ambientes Microsoft 365. Perplexity pode apoiar pesquisa com fontes. Recursos, preços e configurações mudam e precisam ser conferidos no ambiente contratado.",
      "Para RH, a primeira pergunta sobre a ferramenta é se o uso está autorizado para aquela finalidade e para aqueles dados. O nome do produto ou a existência de um plano pago não garante adequação.",
      "No módulo, você pode usar qualquer ferramenta autorizada com o caso fictício. Se não tiver acesso, o modo de comparação guiada exercita a mesma habilidade de reconhecer limites e revisar entregas, sem fingir uma execução externa.",
    ],
  ],
  [
    "CICLO RH: uma rotina de trabalho",
    [
      "Contextualize a demanda antes de escrever o prompt. Identifique o processo, o público e a consequência de um erro. Um anúncio de vaga e uma mensagem individual de benefício exigem verificações diferentes.",
      "Identifique a fonte. A política interna, a requisição e a diretriz de onboarding devem ter versão e aprovação adequadas. Se você não sabe de onde veio uma regra, não peça à IA que a apresente como válida.",
      "Construa a instrução com tarefa e formato claros. Use PACTO como apoio: papel, ação, contexto, tom e output. O papel é uma orientação, não uma credencial profissional.",
      "Leia criticamente a resposta. Compare com a fonte, marque o que não foi informado e pergunte se a saída criou barreira, promessa ou exposição desnecessária.",
      "Operacionalize somente após a aprovação prevista. Mantenha a fonte, a versão do prompt e o registro de revisão. A responsabilidade humana atravessa todo o ciclo.",
    ],
  ],
  [
    "Dados: classificar para proteger",
    [
      "Dado pessoal é informação sobre pessoa identificada ou identificável. Dado pessoal sensível possui definição específica na LGPD. Saúde, origem racial ou étnica e filiação sindical são exemplos das categorias protegidas de maneira específica pela lei.",
      "Salário e desempenho identificáveis são dados pessoais que exigem cuidado, mas não se tornam automaticamente sensíveis na classificação legal. Uma política de remuneração não divulgada também pode ser informação empresarial confidencial.",
      "A anonimização não é garantida pela troca de nomes por códigos. Em uma equipe pequena, o cargo e o contexto podem revelar quem escreveu um comentário. Uma síntese pode inclusive reproduzir informações que deveriam permanecer restritas.",
      "Em uso real, avalie finalidade, necessidade, base legal aplicável, acesso, retenção e condições do fornecedor. Consentimento não é solução universal nem dispensa os demais requisitos. Envolva privacidade, segurança e jurídico conforme o contexto.",
      "No curso, não use currículos, prontuários, contracheques, denúncias ou avaliações reais. Aprender o processo não exige colocar pessoas em risco.",
    ],
  ],
  [
    "Equidade e acessibilidade não são filtros decorativos",
    [
      "Uma instrução como “seja justo” não demonstra que uma aplicação é justa. A distorção pode estar na requisição, no histórico usado, nos critérios de avaliação e na interpretação de quem lê.",
      "Ao revisar uma vaga, confira se os requisitos são necessários às atividades e se foram confirmados. Ao estruturar uma entrevista, privilegie questões relacionadas ao trabalho e evite inferências sobre vida pessoal.",
      "Uma ferramenta também pode criar barreiras de acesso. Uma atividade que exige certo modo de fala, visão ou interação pode medir uma limitação de acesso em vez da competência profissional pretendida. Avaliação de tecnologia de seleção exige análise específica, não apenas boa intenção.",
      "Neste laboratório, não usamos análise facial ou de voz para inferir personalidade, comprometimento ou saúde. Não produzimos rankings de candidatos nem listas de risco individual de desligamento.",
    ],
  ],
  [
    "A descrição de vaga como primeiro teste",
    [
      "A fonte F1 traz atividades e requisitos, mas não informa salário, local ou jornada. Também contém uma anotação pessoal inadequada. Uma resposta ruim pode tentar preencher todos os campos e reproduzir o viés recebido.",
      "A resposta profissional separa o confirmado das pendências e sinaliza o que precisa de revisão. Não inventa inglês, diploma ou experiência para tornar o texto mais sofisticado. Não transforma “preferência por jovem” em “perfil energético” para disfarçar o mesmo problema.",
      "A entrega só deve ser publicada após a validação dos requisitos, das condições e do canal de candidatura. No módulo, ela permanece rascunho.",
    ],
  ],
  [
    "Onboarding: coordenação antes de automação",
    [
      "Um plano de integração deve tornar responsabilidades visíveis. Em F2, RH coordena agenda, gestor valida atividades e TI concede acessos. Uma IA que atribui todos os acessos ao RH está criando um problema de processo.",
      "Não invente data, sala, ferramenta ou nome. Se a fonte não define quem conduz uma etapa, marque a confirmação necessária. Diferencie uma sugestão de evidência de conclusão de uma exigência já vigente.",
      "O onboarding também inclui acompanhamento. Não resuma o processo ao primeiro dia quando a diretriz prevê primeira semana e dia 30. Acessibilidade deve ser tratada por canal adequado, sem expor informação pessoal à equipe.",
    ],
  ],
  [
    "Atendimento interno: responder e saber encaminhar",
    [
      "Um FAQ não é autorização para ampliar a política. A F3 exige informações para solicitar treinamento e estabelece análise de pertinência e disponibilidade. Não define teto, prazo de resposta nem regra sobre curso comprado antes.",
      "A resposta correta explica o que está previsto e encaminha a pergunta não coberta. Não basta gerar uma frase simpática: é preciso evitar promessa financeira ou condição inexistente.",
      "Ausência de regra também não equivale automaticamente a proibição. “A política fornecida não informa; procure a Central de Pessoas” é mais preciso do que declarar um direito ou negar algo sem base.",
      "Antes de transformar um FAQ em atendimento automatizado real, serão necessários governança, fontes versionadas, controles de acesso e mecanismos de encaminhamento, correção e monitoramento.",
    ],
  ],
  [
    "Desenvolvimento: comportamento não é identidade",
    [
      "O caso F4 contém falhas em registros simulados e um pedido de apoio. Não contém informação sobre comprometimento, personalidade ou saúde. O roteiro de desenvolvimento deve respeitar essa diferença.",
      "Uma boa conversa descreve a observação, abre espaço à pessoa e combina apoio. Um plano útil conecta objetivo, atividade, recurso e evidência de progresso. Os critérios propostos devem ser pactuados, não apresentados como meta já acordada.",
      "A IA não deve converter a dificuldade de aprendizagem em sanção, nota de desempenho ou recomendação salarial. Essas decisões exigem contexto e responsabilidade que não estão no exercício.",
    ],
  ],
  [
    "Indicadores: contar não é explicar",
    [
      "Na F5, março tem 15 conclusões em 20 ingressantes: 75%. Abril tem 20 em 25: 80%. A diferença é de cinco pontos percentuais. Maio registra 18 conclusões, mas falta o denominador; a taxa não pode ser determinada.",
      "Esses dados não medem retenção, satisfação nem qualidade do trabalho. Também não mostram a causa da mudança. Uma apresentação convincente não deve ligar a variação à IA sem evidência.",
      "Use indicadores para fazer perguntas melhores. Verifique definição, período, comparabilidade e qualidade da base. Em uso real, também considere se a segmentação preserva a privacidade.",
    ],
  ],
  [
    "Testar antes de chamar de solução",
    [
      "Escolha um prompt e guarde a primeira resposta. Compare cada parte com a fonte. Identifique o que precisa de revisão e registre uma nova versão. Teste uma pergunta sem resposta na fonte: o sistema reconhece o limite ou inventa uma regra?",
      "Um piloto de baixo risco começa com escopo pequeno e revisão definida. Meça o tempo total, incluindo conferência e correção. Registre erros relevantes e motivos de encaminhamento.",
      "Não prometemos economia de tempo ou eliminação de viés. O objetivo é construir competência para identificar quando a IA ajuda e quando a intervenção precisa ser interrompida.",
    ],
  ],
  [
    "Seu Kit Inicial de IA para RH",
    [
      "Reúna o mapa de oportunidades, os quatro prompts, as quatro entregas revisadas, o teste documentado e o plano de piloto. Inclua os limites: o que a ferramenta não pode decidir e quem aprova.",
      "O kit não é uma política corporativa automaticamente válida nem uma habilitação profissional. É uma evidência de aprendizagem e um ponto de partida para uma aplicação autorizada e contextualizada.",
      "A próxima etapa da trilha deve aprofundar instruções e testes em processos de RH. Você continuará aprendendo a operar IA com evidência, respeito às pessoas e responsabilidade.",
    ],
  ],
];

export function buildApostilaRh1(): string {
  const s: string[] = [];
  s.push(`# ${APOSTILA_RH1_TITULO}

*Trilha: Recursos Humanos e Gestão de Pessoas · Pré-requisito: Módulo Start · Duração estimada: 4 a 5 horas com prática, sem cronômetro obrigatório.*

${RH_AVISO_FICCAO}. Contexto jurídico de referência: Brasil.`);
  s.push(BASE.map(([t, ps]) => `## ${t}\n\n${ps.join("\n\n")}`).join("\n\n"));

  s.push(`# Anexos

## Anexo A — Fontes F1 a F5 (${RH_AVISO_FICCAO.toLowerCase()})

**${HORIZONTE.nome}.** ${HORIZONTE.intro}

Dificuldades relatadas:

${list(HORIZONTE.dificuldades)}

${HORIZONTE.nota} ${HORIZONTE.autorizacao}

${FONTES.map((f) => `### Fonte ${f.id} — ${f.titulo}\n\n${list(f.linhas)}`).join("\n\n")}`);

  s.push(`## Anexo B — Mapa funcional do RH

${MAPA_FUNCIONAL.map((m, i) => `${i + 1}. **${m.nome}:** pode apoiar ${m.apoia}; não deve ${m.naoFaz}.`).join("\n")}

${MAPA_NOTA}`);

  s.push(`## Anexo C — CICLO RH e template de prompt

${CICLO_RH.map(([a, b]) => `- **${a}** ${b}`).join("\n")}

${CICLO_NOTA}

${code(TEMPLATE_TEXTO)}

Dentro da etapa de instrução, use o PACTO do Módulo Start: Papel, Ação, Contexto, Tom e Output. Persona não é obrigatória nem confere credencial real à ferramenta.`);

  s.push(`## Anexo D — Prompts P1 a P4 e entregas-modelo

${RH_TAREFAS.map(
  (t) => `### ${t.codigo} — ${t.titulo} (fonte ${t.fonte})

**Prompt resolvido**

${code(t.promptResolvido)}

**Entrega-modelo**

${code(t.entregaModelo)}${t.notaModelo ? `\n\n${t.notaModelo}` : ""}

**Resposta propositalmente inadequada (para revisão):** “${t.inadequada}”

Problemas: ${t.inadequadaErros.join(" ")}${
    t.extras.length
      ? `\n\n${t.extras.map((e) => `**${e.pergunta}** Referência: ${e.ref}`).join("\n\n")}`
      : ""
  }`,
).join("\n\n")}`);

  s.push(`## Anexo E — Formulário de teste e plano de piloto

**Formulário de teste:** tarefa; fonte e versão; prompt v1; ferramenta ou modo guiado; saída v1; verificações; erro ou fronteira testada; prompt v2; resultado da revisão; limitações; aprovador por papel.

Modalidades: "Teste em ferramenta autorizada" ou "Comparação guiada". Não simule execução externa. ${LAB_DICA}

Modo sem ferramenta: use uma das respostas inadequadas das unidades 4, 5 ou 7, ou esta do onboarding: “O RH criará a senha e encerrará o acompanhamento no dia 1.” Falhas: atribuição indevida de acesso e supressão da primeira semana e do dia 30.

**Piloto de sete dias (proposta didática)**

${list(PILOTO_DIAS)}

${PILOTO_NOTA}

**Métricas propostas**

${METRICAS.map((m) => `- **${m.nome}:** ${m.def}`).join("\n")}

${METRICAS_NOTA}`);

  s.push(`## Anexo F — Exercício de indicadores (com gabarito comentado)

Use a fonte F5. Solicite contagem, fórmula, taxa, limitações e duas perguntas de investigação.

${list(U7A.notas)}

Perguntas aceitáveis: ${U7A.perguntasAceitaveis.join(" ")}

**Revisão com falha plantada:** “${U7B.inadequada}”

Gabarito: ${U7B.erros.join(" ")}

Correção de referência: ${U7B.correcao}`);

  s.push(`## Anexo G — Rubrica e checklist CRIVO RH

Avaliação não certifica habilitação em RH, direito, psicologia ou uso de sistema de seleção.

Rubrica para prompts e entregas (cada critério de 0 a 4). Âncoras: ${RUBRICA_ANCORAS.join("; ")}.

| Critério | Peso |
|---|---:|
${RUBRICA.map((r) => `| ${r.label} | ${r.peso}% |`).join("\n")}

Nota ponderada de 0 a 100: soma do peso percentual × nota do critério ÷ 4. Faixas: ${FAIXAS.map(([m, l]) => `${m}+ ${l}`).join("; ")}.

Componentes da nota geral: ${COMPONENTES_NOTA.map((c) => `${c.label} (${c.peso}%)`).join("; ")}. Escala dos demais componentes: ${ESCALA_COMPONENTE.join("; ")}. Conclusão: nota geral mínima 70; quatro pares prompt/entrega; teste completo; quiz aprovado (pelo menos 10 de 12, sem peso na nota); erros críticos resolvidos.

${ERROS_CRITICOS_DEF}

Autoavaliação guiada pode apoiar a progressão, mas é identificada como tal e não é correção por professor humano.

**Checklist CRIVO RH**

${CRIVO.map(([a, b]) => `- **${a}** ${b}`).join("\n")}

${CRIVO_NOTA}

*${MSG.semIa}*`);

  s.push(`## Anexo H — Quiz (perguntas)

${RH_QUIZ.map((q, i) => `${i + 1}. ${q.q}\n${q.options.map((o, j) => `   ${String.fromCharCode(65 + j)}) ${o}`).join("\n")}`).join("\n\n")}

## Anexo I — Respostas comentadas do quiz (seção separada, para consulta)

${RH_QUIZ.map((q, i) => `${i + 1}. **${String.fromCharCode(65 + q.answer)}** — ${q.options[q.answer]} ${q.why}`).join("\n")}`);

  s.push(`## Anexo J — Glossário

${GLOSSARIO_RH.map(([a, b]) => `- **${a}:** ${b}`).join("\n")}

${U2_NOTA_JURIDICA}`);

  s.push(`## Anexo K — Referências editoriais

${REFERENCIAS.map(([t, u]) => (u ? `- ${t}: ${u}` : `- ${t}`)).join("\n")}

${REFERENCIAS_NOTA}`);
  return s.join("\n\n");
}

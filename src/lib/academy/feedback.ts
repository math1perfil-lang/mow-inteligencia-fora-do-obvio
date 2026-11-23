import type { Area } from "./areas";

/**
 * Feedback por regras: analisa a FORMA do prompt (estrutura, contexto, segurança etc.).
 * Não usa IA e não verifica se o conteúdo é verdadeiro. É um apoio ao estudo, não uma nota oficial.
 */
export type Criterion =
  | "clareza"
  | "contexto"
  | "especificidade"
  | "estrutura"
  | "formato"
  | "aplicabilidade"
  | "seguranca"
  | "revisao"
  | "originalidade"
  | "area";

export const CRITERIA: { id: Criterion; label: string }[] = [
  { id: "clareza", label: "Clareza" },
  { id: "contexto", label: "Contexto" },
  { id: "especificidade", label: "Especificidade" },
  { id: "estrutura", label: "Estrutura" },
  { id: "formato", label: "Formato" },
  { id: "aplicabilidade", label: "Aplicabilidade" },
  { id: "seguranca", label: "Segurança" },
  { id: "revisao", label: "Revisão humana" },
  { id: "originalidade", label: "Originalidade" },
  { id: "area", label: "Aderência à área" },
];

export type Tier = "excelente" | "bom" | "mediano" | "fraco";

export interface CriterionResult {
  id: Criterion;
  label: string;
  score: number;
  message: string;
  tip: string;
}

export interface Evaluation {
  total: number;
  tier: Tier;
  summary: string;
  items: CriterionResult[];
  warnings: string[];
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const count = (text: string, re: RegExp) => (text.match(re) ?? []).length;
const level = (n: number, a: number, b: number, c: number) =>
  n >= c ? 9 : n >= b ? 7 : n >= a ? 5 : 2;

const VERBS =
  /\b(crie|escreva|analise|resuma|liste|compare|classifique|elabore|revise|gere|monte|proponha|identifique|redija|prepare|mapeie|estruture|explique|reescreva|transforme|desenvolva)\b/;
const SENSITIVE: [RegExp, string][] = [
  [/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/, "Parece haver um CPF no texto."],
  [/[\w.+-]+@[\w-]+\.[\w.-]+/, "Parece haver um e-mail no texto."],
  [/\(?\b\d{2}\)?\s?9?\d{4}-?\d{4}\b/, "Parece haver um telefone no texto."],
  [/\b(?:\d[ -]?){13,16}\b/, "Parece haver um número de cartão ou conta no texto."],
];

const TEXT: Record<Criterion, { low: string; mid: string; high: string; tip: string }> = {
  clareza: {
    low: "O pedido está curto ou pouco claro.",
    mid: "O pedido é compreensível, mas pode ficar mais direto.",
    high: "O pedido é claro e começa com uma ação definida.",
    tip: "Comece com um verbo de ação (crie, analise, compare) e diga o resultado esperado.",
  },
  contexto: {
    low: "Faltam informações sobre a situação.",
    mid: "Há algum contexto, mas ainda falta detalhe.",
    high: "O contexto da situação está bem apresentado.",
    tip: "Diga quem é o público, qual é a situação e qual restrição importa.",
  },
  especificidade: {
    low: "O pedido é genérico; a IA terá de adivinhar.",
    mid: "Há alguns detalhes, mas faltam limites concretos.",
    high: "Há limites e detalhes concretos que guiam a resposta.",
    tip: "Inclua números, limites (até 150 palavras), critérios ou um exemplo do que é bom.",
  },
  estrutura: {
    low: "O texto é um bloco único, sem organização.",
    mid: "Há alguma organização, mas os blocos não estão separados.",
    high: "Os blocos do prompt estão separados e fáceis de seguir.",
    tip: "Separe em Papel, Contexto, Tarefa, Formato e Critérios, em linhas distintas.",
  },
  formato: {
    low: "Não foi dito como a resposta deve ser entregue.",
    mid: "O formato foi sugerido, mas pode ser mais preciso.",
    high: "O formato de entrega está definido.",
    tip: "Peça tabela, lista numerada, e-mail ou relatório, com os campos que quer ver.",
  },
  aplicabilidade: {
    low: "Não está claro para que a resposta será usada.",
    mid: "O uso está implícito; vale explicitar a finalidade.",
    high: "A finalidade e o uso da resposta estão claros.",
    tip: "Explique para que a resposta será usada e quem vai recebê-la.",
  },
  seguranca: {
    low: "Há sinais de dados sensíveis ou nenhuma proteção.",
    mid: "Não foram detectados dados sensíveis, mas faltou deixar isso explícito.",
    high: "Há cuidado explícito com dados fictícios ou anonimizados.",
    tip: "Use dados fictícios ou anonimizados e escreva isso no prompt.",
  },
  revisao: {
    low: "Não há pedido de verificação ou de pontos a revisar.",
    mid: "Há alguma preocupação com validação, mas pouco explícita.",
    high: "O prompt pede suposições, fontes ou pontos a revisar.",
    tip: "Peça que a IA liste suposições, incertezas e o que você deve conferir antes de usar.",
  },
  originalidade: {
    low: "O prompt pede uma única resposta padrão.",
    mid: "Há alguma abertura para alternativas.",
    high: "O prompt abre espaço para alternativas ou perguntas de volta.",
    tip: "Peça 3 alternativas, um contraponto ou que a IA pergunte o que falta.",
  },
  area: {
    low: "O prompt não parece ligado à sua área de atuação.",
    mid: "Há alguma ligação com a sua área.",
    high: "O prompt está bem ligado à sua área e à sua rotina.",
    tip: "Use termos e situações reais da sua área (com dados fictícios).",
  },
};

export function evaluate(prompt: string, area: Area): Evaluation {
  const raw = prompt.trim();
  const t = norm(raw);
  const words = raw ? raw.split(/\s+/).length : 0;
  const lines = raw.split(/\n+/).filter((l) => l.trim()).length;
  const warnings: string[] = [];
  for (const [re, msg] of SENSITIVE) if (re.test(raw)) warnings.push(msg);

  const s: Record<Criterion, number> = {
    clareza: Math.min(
      10,
      (words < 8 ? 2 : words < 20 ? 4 : words < 40 ? 6 : 8) + (VERBS.test(t) ? 2 : 0),
    ),
    contexto: level(
      count(
        t,
        /\b(contexto|cenario|empresa|cliente|situacao|considerando|atuo|nosso|nossa|setor|segmento|publico|equipe|ficticio)\b/g,
      ),
      1,
      2,
      3,
    ),
    especificidade: level(
      count(t, /\d+|\b(exatamente|no maximo|minimo|ate|somente|apenas|sem|exemplo)\b/g),
      1,
      3,
      5,
    ),
    estrutura: Math.min(
      10,
      (lines >= 5 ? 6 : lines >= 3 ? 4 : lines >= 2 ? 3 : 1) +
        level(
          count(raw, /^(papel|contexto|tarefa|formato|criterios|critérios|revis[aã]o)\s*:/gim),
          1,
          2,
          4,
        ) /
          2,
    ),
    formato: level(
      count(
        t,
        /\b(formato|tabela|lista|topicos|e-mail|email|relatorio|paragrafos|bullets|passos|titulo|tom|numerada)\b/g,
      ),
      1,
      2,
      3,
    ),
    aplicabilidade: level(
      count(
        t,
        /\b(objetivo|para que|finalidade|decisao|usar|apresentar|enviar|prazo|publico|audiencia|reuniao|diretoria)\b/g,
      ),
      1,
      2,
      3,
    ),
    seguranca: warnings.length
      ? 2
      : /(anonimiz|ficticio|sem dados pessoais|nao inclua dados|dados ficticios|confidencial)/.test(
            t,
          )
        ? 10
        : 7,
    revisao: level(
      count(
        t,
        /\b(revis\w*|valid\w*|confirm\w*|fontes?|verifi\w*|aprovacao|checar|hipotese\w*|incerteza\w*|premissas?|suposico\w*)\b/g,
      ),
      1,
      2,
      3,
    ),
    originalidade: level(
      count(
        t,
        /\b(alternativas?|abordagens?|opcoes|opcao|variacoes|criativ\w*|perspectiva|contraponto|pergunte|perguntas|faca perguntas)\b/g,
      ),
      1,
      2,
      3,
    ),
    area: level(area.palavras.filter((w) => t.includes(norm(w))).length, 1, 2, 3),
  };
  if (words === 0) for (const k of Object.keys(s) as Criterion[]) s[k] = 0;

  const items: CriterionResult[] = CRITERIA.map(({ id, label }) => {
    const sc = Math.round(Math.max(0, Math.min(10, s[id])));
    const tx = TEXT[id];
    return {
      id,
      label,
      score: sc,
      message: sc >= 8 ? tx.high : sc >= 5 ? tx.mid : tx.low,
      tip: tx.tip,
    };
  });
  const total = Math.round((items.reduce((a, b) => a + b.score, 0) / items.length) * 10) / 10;
  const tier: Tier =
    total >= 8 ? "excelente" : total >= 6.5 ? "bom" : total >= 4.5 ? "mediano" : "fraco";
  const weakest = [...items].sort((a, b) => a.score - b.score).slice(0, 2);
  const summaries: Record<Tier, string> = {
    excelente:
      "Prompt excelente: pronto para testar e salvar. Lembre-se de revisar a resposta antes de usá-la.",
    bom: "Bom prompt. Com pequenos ajustes ele fica excelente.",
    mediano: "Prompt mediano: tem base, mas a IA ainda precisará adivinhar partes importantes.",
    fraco:
      "Prompt fraco por enquanto: falta informação para obter uma resposta útil. Veja os pontos abaixo.",
  };
  const focus =
    weakest.length && tier !== "excelente"
      ? ` Foque primeiro em: ${weakest.map((w) => w.label.toLowerCase()).join(" e ")}.`
      : "";
  return { total, tier, summary: summaries[tier] + focus, items, warnings };
}

export const PASS_SCORE = 6;

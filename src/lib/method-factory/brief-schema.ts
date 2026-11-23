export interface Field {
  id: string;
  label: string;
  kind: "text" | "textarea" | "select" | "url" | "problem-list";
  required?: boolean;
  help?: string;
  options?: readonly string[];
  when?: { field: string; equals: string };
  placeholder?: string;
}

export interface Step {
  id: string;
  title: string;
  description: string;
  fields: readonly Field[];
}

export type Values = Record<string, string>;

export interface ProblemEntry {
  title: string;
  domain: string;
  urgency: string;
  description: string;
  impact: string;
}

export const PROBLEM_DOMAINS = [
  "Comercial e vendas",
  "Finanças",
  "Marketing e publicidade",
  "Estratégia e modelo de negócio",
  "Operações e processos",
  "Produto e tecnologia",
  "Dados e analytics",
  "Experiência e sucesso do cliente",
  "Pessoas e organização",
  "Parcerias e ecossistema",
  "Jurídico, risco e compliance",
  "Sustentabilidade e impacto",
  "Outro",
  "Ainda não sei",
] as const;

export const PROBLEM_URGENCY = ["Alta", "Média", "Baixa", "Ainda não sei"] as const;

export const BUSINESS_TYPES = [
  "Tecnologia e produtos digitais",
  "Serviços profissionais, incluindo jurídico",
  "Vendas, comércio e distribuição",
  "Indústria, produção e construção",
  "Saúde e cuidado",
  "Educação e formação",
  "Serviços locais e operações de campo",
  "Setor público, associação ou impacto social",
  "Outro ou ainda não sei",
] as const;

export function parseProblemEntries(value: string | undefined): ProblemEntry[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is ProblemEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof entry.title === "string" &&
        typeof entry.domain === "string" &&
        typeof entry.urgency === "string" &&
        typeof entry.description === "string" &&
        typeof entry.impact === "string",
    );
  } catch {
    return [];
  }
}

export function serializeProblemEntries(entries: readonly ProblemEntry[]): string {
  return JSON.stringify(entries);
}

const MEASUREMENT_OPTIONS = [
  "Não medimos",
  "Temos dados agregados",
  "Não sei",
  "Não se aplica",
] as const;

const AGGREGATE_DATA_CONDITION = {
  field: "partnerMeasurement",
  equals: "Temos dados agregados",
} as const;

const USER_AGGREGATE_DATA_CONDITION = {
  field: "userMeasurement",
  equals: "Temos dados agregados",
} as const;

export const BRIEF_STEPS: readonly Step[] = [
  {
    id: "context",
    title: "Contexto do negócio",
    description:
      "Conte o que a empresa ou iniciativa realiza, a quem atende e como funciona hoje. Responda conforme a realidade do negócio, sem presumir tecnologia ou formato específico.",
    fields: [
      {
        id: "businessType",
        label: "Qual tipo de atividade ou negócio melhor descreve a realidade atual?",
        kind: "select",
        required: true,
        options: BUSINESS_TYPES,
        help: "A escolha só define quais perguntas específicas serão exibidas; nenhuma resposta vem preenchida.",
      },
      {
        id: "company",
        label: "Empresa ou iniciativa",
        kind: "text",
        required: true,
        placeholder: "Nome da empresa ou iniciativa",
      },
      {
        id: "platformDescription",
        label: "O que a empresa ou iniciativa oferece ou realiza?",
        kind: "textarea",
        required: true,
        help: "Descreva produtos, serviços, atividades ou resultados, conforme se aplicar.",
      },
      {
        id: "businessModel",
        label: "Como a atividade se sustenta ou gera valor?",
        kind: "textarea",
        required: true,
        help: "Descreva receita, financiamento, trocas ou outra forma de sustentação, se houver.",
      },
      {
        id: "stage",
        label: "Em que estágio está?",
        kind: "select",
        required: true,
        options: [
          "Em planejamento",
          "Em implantação",
          "Em funcionamento",
          "Em mudança ou transição",
          "Não sei",
          "Não se aplica",
        ],
      },
      {
        id: "userGroups",
        label: "Quem é atendido, participa ou se beneficia?",
        kind: "textarea",
        required: true,
        help: "Descreva categorias de pessoas ou organizações, sem incluir dados pessoais.",
      },
      {
        id: "payer",
        label: "Quem paga, ou poderá pagar, e pelo quê?",
        kind: "textarea",
      },
      {
        id: "geography",
        label: "Em quais regiões atua ou pretende atuar?",
        kind: "text",
      },
    ],
  },
  {
    id: "activity-profile",
    title: "Perguntas específicas da atividade",
    description:
      "As perguntas desta etapa mudam conforme o tipo de atividade escolhido. Responda somente ao que se aplicar; não inclua dados pessoais, sigilosos ou identificáveis.",
    fields: [
      {
        id: "digitalOffering",
        label: "Que produto, serviço ou processo digital é oferecido ou utilizado?",
        kind: "textarea",
        required: true,
        when: { field: "businessType", equals: BUSINESS_TYPES[0] },
      },
      {
        id: "digitalJourney",
        label: "Quais etapas levam da necessidade inicial ao resultado entregue?",
        kind: "textarea",
        required: true,
        when: { field: "businessType", equals: BUSINESS_TYPES[0] },
      },
      {
        id: "digitalConstraints",
        label: "Há dependências técnicas, de dados, infraestrutura ou segurança a considerar?",
        kind: "textarea",
        when: { field: "businessType", equals: BUSINESS_TYPES[0] },
      },
      {
        id: "professionalServices",
        label: "Que tipos de serviço ou demanda profissional são atendidos?",
        kind: "textarea",
        required: true,
        when: { field: "businessType", equals: BUSINESS_TYPES[1] },
      },
      {
        id: "professionalWorkflow",
        label: "Quais etapas levam do primeiro contato à conclusão do serviço?",
        kind: "textarea",
        required: true,
        when: { field: "businessType", equals: BUSINESS_TYPES[1] },
      },
      {
        id: "professionalConstraints",
        label:
          "Que deveres de confidencialidade, sigilo, prazo ou conformidade precisam ser respeitados?",
        kind: "textarea",
        required: true,
        when: { field: "businessType", equals: BUSINESS_TYPES[1] },
        help: "Não inclua nomes, casos concretos, documentos ou dados protegidos.",
      },
      {
        id: "salesProcess",
        label: "Quais são as etapas da venda e onde costuma haver espera ou perda?",
        kind: "textarea",
        required: true,
        when: { field: "businessType", equals: BUSINESS_TYPES[2] },
      },
      {
        id: "salesChannels",
        label: "Que canais participam da divulgação, negociação, venda ou pós-venda?",
        kind: "textarea",
        required: true,
        when: { field: "businessType", equals: BUSINESS_TYPES[2] },
      },
      {
        id: "salesConstraints",
        label: "Que limites de preço, margem, estoque ou relacionamento afetam a operação?",
        kind: "textarea",
        when: { field: "businessType", equals: BUSINESS_TYPES[2] },
      },
      {
        id: "productionFlow",
        label: "Como o produto é produzido ou o serviço é entregue?",
        kind: "textarea",
        required: true,
        when: { field: "businessType", equals: BUSINESS_TYPES[3] },
      },
      {
        id: "productionBottleneck",
        label:
          "Que limites de capacidade, materiais, fornecedores ou infraestrutura afetam a entrega?",
        kind: "textarea",
        required: true,
        when: { field: "businessType", equals: BUSINESS_TYPES[3] },
      },
      {
        id: "productionQuality",
        label: "Como qualidade, retrabalho e segurança são acompanhados, se aplicável?",
        kind: "textarea",
        when: { field: "businessType", equals: BUSINESS_TYPES[3] },
      },
      {
        id: "careServices",
        label: "Que serviços ou cuidados são prestados e qual é o percurso de atendimento?",
        kind: "textarea",
        required: true,
        when: { field: "businessType", equals: BUSINESS_TYPES[4] },
      },
      {
        id: "careCapacity",
        label: "Como acesso, capacidade e tempo de espera são organizados?",
        kind: "textarea",
        required: true,
        when: { field: "businessType", equals: BUSINESS_TYPES[4] },
      },
      {
        id: "careConstraints",
        label: "Que requisitos de segurança, privacidade ou conformidade precisam ser respeitados?",
        kind: "textarea",
        required: true,
        when: { field: "businessType", equals: BUSINESS_TYPES[4] },
        help: "Não inclua prontuários, dados de pacientes ou casos identificáveis.",
      },
      {
        id: "learningOutcome",
        label: "Que aprendizagem ou competência a atividade busca desenvolver?",
        kind: "textarea",
        required: true,
        when: { field: "businessType", equals: BUSINESS_TYPES[5] },
      },
      {
        id: "learningProcess",
        label: "Quais etapas compõem a experiência de ensino ou formação?",
        kind: "textarea",
        required: true,
        when: { field: "businessType", equals: BUSINESS_TYPES[5] },
      },
      {
        id: "learningConstraints",
        label: "Que limites de acesso, participação ou avaliação precisam ser considerados?",
        kind: "textarea",
        when: { field: "businessType", equals: BUSINESS_TYPES[5] },
      },
      {
        id: "fieldServiceFlow",
        label: "Como um serviço local ou de campo é solicitado, organizado e concluído?",
        kind: "textarea",
        required: true,
        when: { field: "businessType", equals: BUSINESS_TYPES[6] },
      },
      {
        id: "fieldServiceCapacity",
        label: "Que limites de agenda, localização, equipe ou equipamento afetam o atendimento?",
        kind: "textarea",
        required: true,
        when: { field: "businessType", equals: BUSINESS_TYPES[6] },
      },
      {
        id: "fieldServiceQuality",
        label: "Como a qualidade e a conclusão do serviço são verificadas, se aplicável?",
        kind: "textarea",
        when: { field: "businessType", equals: BUSINESS_TYPES[6] },
      },
      {
        id: "socialPurpose",
        label: "Que finalidade pública, social ou coletiva orienta a atividade?",
        kind: "textarea",
        required: true,
        when: { field: "businessType", equals: BUSINESS_TYPES[7] },
      },
      {
        id: "socialOutcome",
        label: "Que mudança ou resultado para o público atendido se busca alcançar?",
        kind: "textarea",
        required: true,
        when: { field: "businessType", equals: BUSINESS_TYPES[7] },
      },
      {
        id: "socialConstraints",
        label:
          "Que regras, critérios de elegibilidade ou prestações de contas precisam ser respeitados?",
        kind: "textarea",
        when: { field: "businessType", equals: BUSINESS_TYPES[7] },
      },
      {
        id: "otherActivity",
        label: "Descreva a atividade e os aspectos que devemos compreender primeiro.",
        kind: "textarea",
        required: true,
        when: { field: "businessType", equals: BUSINESS_TYPES[8] },
      },
    ],
  },
  {
    id: "problems",
    title: "Problemas e resultados",
    description: "Identifique as dores prioritárias e como uma mudança útil apareceria na prática.",
    fields: [
      {
        id: "pains",
        label: "Quais dores a empresa quer explorar?",
        kind: "problem-list",
        required: true,
        help: "Cadastre uma ou várias dores. Se não souber a área, selecione “Ainda não sei”; a triagem não depende de escolher um único tema.",
      },
      {
        id: "desiredResult",
        label: "Que resultado desejado deveria mudar?",
        kind: "textarea",
        required: true,
      },
      {
        id: "attempts",
        label: "O que já foi tentado para resolvê-los?",
        kind: "textarea",
      },
    ],
  },
  {
    id: "partnerships",
    title: "Parcerias e relações relevantes",
    description:
      "Se houver parcerias ou outras relações relevantes, descreva o papel delas e os gargalos sem identificar contatos.",
    fields: [
      {
        id: "partnerTypes",
        label: "Que tipos de parceiros são relevantes?",
        kind: "textarea",
        help: "Descreva categorias; não informe nomes nem contatos pessoais.",
      },
      {
        id: "partnerValue",
        label: "Que valor é trocado entre as partes, se houver parceria?",
        kind: "textarea",
      },
      {
        id: "partnerDefinition",
        label: "Como vocês definem uma parceria bem-sucedida?",
        kind: "textarea",
      },
      {
        id: "partnerBottleneck",
        label: "Qual é o principal gargalo para iniciar ou desenvolver parcerias?",
        kind: "textarea",
      },
      {
        id: "partnerMeasurement",
        label: "Como medem os resultados das parcerias?",
        kind: "select",
        required: true,
        options: MEASUREMENT_OPTIONS,
      },
      {
        id: "partnerMetrics",
        label: "Quais métricas agregadas estão disponíveis?",
        kind: "textarea",
        when: AGGREGATE_DATA_CONDITION,
        help: "Informe apenas dados agregados, sem identificar pessoas.",
      },
      {
        id: "partnerPeriod",
        label: "A que período esses dados se referem?",
        kind: "text",
        required: true,
        when: AGGREGATE_DATA_CONDITION,
        placeholder: "Informe o período, se conhecido",
      },
      {
        id: "partnerUnit",
        label: "Qual é a unidade das métricas?",
        kind: "text",
        required: true,
        when: AGGREGATE_DATA_CONDITION,
        placeholder: "Informe a unidade, se conhecida",
      },
    ],
  },
  {
    id: "users",
    title: "Público, atendimento e uso",
    description:
      "Descreva, se aplicável, como as pessoas ou organizações conhecem a iniciativa, entram em contato, recebem a oferta e como isso é acompanhado.",
    fields: [
      {
        id: "acquisitionChannels",
        label: "Como as pessoas ou organizações chegam, fazem contato ou acessam a oferta?",
        kind: "textarea",
      },
      {
        id: "activationEvent",
        label: "Que fato indica que a necessidade foi atendida ou que houve valor?",
        kind: "textarea",
      },
      {
        id: "userMeasurement",
        label: "Há acompanhamento sobre procura, atendimento, entrega ou uso?",
        kind: "select",
        required: true,
        options: MEASUREMENT_OPTIONS,
      },
      {
        id: "userMetrics",
        label: "Quais informações agregadas estão disponíveis, se houver?",
        kind: "textarea",
        when: USER_AGGREGATE_DATA_CONDITION,
        help: "Informe apenas dados agregados, sem identificar pessoas.",
      },
      {
        id: "userPeriod",
        label: "A que período esses dados se referem?",
        kind: "text",
        required: true,
        when: USER_AGGREGATE_DATA_CONDITION,
        placeholder: "Informe o período, se conhecido",
      },
      {
        id: "userUnit",
        label: "Qual é a unidade dessas informações?",
        kind: "text",
        required: true,
        when: USER_AGGREGATE_DATA_CONDITION,
        placeholder: "Informe a unidade, se conhecida",
      },
    ],
  },
  {
    id: "evidence",
    title: "Evidências e materiais",
    description:
      "Registre referências e o status de direitos. Links são opcionais; não envie dados identificáveis.",
    fields: [
      {
        id: "sourceLink",
        label: "Link público de uma fonte ou referência",
        kind: "url",
        help: "Aceita somente URLs HTTP(S) com nome de domínio público; não inclua credenciais.",
        placeholder: "https://…",
      },
      {
        id: "materialsDescription",
        label: "Que materiais ou evidências existem?",
        kind: "textarea",
        help: "Descreva-os sem colar conteúdo protegido ou dados pessoais.",
      },
      {
        id: "rightsStatus",
        label: "Qual é o status de direitos dos materiais?",
        kind: "select",
        required: true,
        options: [
          "Material próprio autorizado",
          "Licença/autorização específica",
          "Público: apenas referência",
          "Direitos pendentes",
          "Sem material nesta etapa",
        ],
      },
      {
        id: "rightsDetails",
        label: "Há detalhes ou restrições de uso a registrar?",
        kind: "textarea",
      },
    ],
  },
  {
    id: "limits",
    title: "Limites e critérios de sucesso",
    description:
      "Torne explícitos os limites do trabalho e como reconhecer progresso sem exagerar a evidência.",
    fields: [
      {
        id: "constraints",
        label: "O que não deve acontecer ou ficar fora do escopo?",
        kind: "textarea",
        required: true,
      },
      {
        id: "resources",
        label: "Que recursos, capacidades ou dependências estão disponíveis?",
        kind: "textarea",
      },
      {
        id: "horizon",
        label: "Qual é o horizonte de tempo relevante?",
        kind: "text",
      },
      {
        id: "successCriteria",
        label: "Que critérios indicariam um avanço útil?",
        kind: "textarea",
        required: true,
      },
      {
        id: "restrictions",
        label: "Há outras restrições que devemos respeitar?",
        kind: "textarea",
      },
    ],
  },
];

const MAX_TEXTAREA_LENGTH = 3000;
const MAX_TEXT_LENGTH = 500;
const MAX_URL_LENGTH = 2000;

const NON_PUBLIC_HOST_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".test",
  ".invalid",
  ".example",
  ".onion",
  ".lan",
  ".intranet",
  ".home.arpa",
  ".localdomain",
] as const;

/**
 * Accepts syntactically public HTTP(S) links with a DNS hostname. This is a
 * deterministic check only: it deliberately does not perform DNS resolution.
 */
function isPublicHttpUrl(value: string): boolean {
  const containsWhitespaceOrControl = [...value].some(
    (character) => character.charCodeAt(0) <= 0x20 || character.charCodeAt(0) === 0x7f,
  );
  if (!/^https?:\/\//i.test(value) || value.includes("\\") || containsWhitespaceOrControl) {
    return false;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username.length > 0 ||
    url.password.length > 0
  ) {
    return false;
  }

  let hostname = url.hostname.toLowerCase();
  if (hostname.startsWith("[") || hostname.endsWith("]")) {
    return false;
  }

  hostname = hostname.replace(/\.$/, "");
  if (!hostname || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return false;
  }

  // WHATWG URL canonicalizes shorthand, integer, octal and hexadecimal IPv4
  // forms. Reject IP literals as well as numeric dotted forms that resemble one.
  if (/^[0-9.]+$/.test(hostname) || hostname.split(".").length < 2) {
    return false;
  }

  if (
    NON_PUBLIC_HOST_SUFFIXES.some(
      (suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix),
    )
  ) {
    return false;
  }

  const labels = hostname.split(".");
  if (
    labels.some(
      (label) =>
        label.length === 0 || label.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
    )
  ) {
    return false;
  }

  // A public DNS name needs a non-numeric final label; reject internal-looking
  // single-label/numeric hosts without attempting a network lookup.
  return /[a-z]/.test(labels[labels.length - 1] ?? "");
}

export function visibleFields(step: Step, values: Values): readonly Field[] {
  return step.fields.filter(
    (field) => !field.when || values[field.when.field] === field.when.equals,
  );
}

export function visibleSteps(values: Values): readonly Step[] {
  return BRIEF_STEPS.filter((step) => visibleFields(step, values).length > 0);
}

export function pickVisibleValues(values: Values): Values {
  const activeIds = new Set(
    visibleSteps(values).flatMap((step) => visibleFields(step, values).map((field) => field.id)),
  );
  return Object.fromEntries(Object.entries(values).filter(([fieldId]) => activeIds.has(fieldId)));
}

function maxLengthFor(field: Field): number {
  if (field.kind === "url") return MAX_URL_LENGTH;
  if (field.kind === "textarea") return MAX_TEXTAREA_LENGTH;
  return MAX_TEXT_LENGTH;
}

function validateFields(fields: readonly Field[], values: Values): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const rawValue = values[field.id];
    const value = typeof rawValue === "string" ? rawValue : "";
    const trimmedValue = value.trim();

    if (field.required && trimmedValue.length === 0) {
      errors[field.id] = "Este campo é obrigatório.";
      continue;
    }

    if (field.kind === "problem-list") {
      const entries = parseProblemEntries(value);
      if (
        value.length > 50000 ||
        entries.length === 0 ||
        entries.length > 20 ||
        entries.some(
          (entry) =>
            !entry.title.trim() ||
            entry.title.length > 140 ||
            !PROBLEM_DOMAINS.includes(entry.domain as (typeof PROBLEM_DOMAINS)[number]) ||
            !PROBLEM_URGENCY.includes(entry.urgency as (typeof PROBLEM_URGENCY)[number]) ||
            !entry.description.trim() ||
            entry.description.length > 1500 ||
            entry.impact.length > 600,
        )
      ) {
        errors[field.id] =
          "Inclua de 1 a 20 dores. Cada uma precisa de título, área, prioridade e descrição; respeite os limites de texto.";
      }
      continue;
    }

    if (value.length > maxLengthFor(field)) {
      errors[field.id] = `Use no máximo ${maxLengthFor(field)} caracteres.`;
      continue;
    }

    if (field.kind === "select" && trimmedValue.length > 0) {
      if (!field.options?.includes(value)) {
        errors[field.id] = "Selecione uma das opções disponíveis.";
      }
      continue;
    }

    if (field.kind === "url" && trimmedValue.length > 0 && !isPublicHttpUrl(trimmedValue)) {
      errors[field.id] = "Informe uma URL HTTP(S) pública, sem IP ou credenciais.";
    }
  }

  return errors;
}

export function validateStep(step: Step, values: Values): Record<string, string> {
  return validateFields(visibleFields(step, values), values);
}

export function validateBrief(values: Values): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const step of visibleSteps(values)) {
    Object.assign(errors, validateStep(step, values));
  }
  return errors;
}

export interface Field {
  id: string;
  label: string;
  kind: "text" | "textarea" | "select" | "url";
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
    description: "Conte o que a plataforma faz, para quem existe e como o negócio funciona hoje.",
    fields: [
      {
        id: "company",
        label: "Empresa ou iniciativa",
        kind: "text",
        required: true,
        placeholder: "Nome da empresa ou iniciativa",
      },
      {
        id: "platformDescription",
        label: "O que a plataforma faz?",
        kind: "textarea",
        required: true,
        help: "Descreva a oferta atual ou planejada em palavras simples.",
      },
      {
        id: "businessModel",
        label: "Qual é o modelo da plataforma?",
        kind: "select",
        required: true,
        options: ["B2B", "B2C", "Marketplace / dois ou mais lados", "Outro", "Não sei"],
      },
      {
        id: "stage",
        label: "Em que estágio está?",
        kind: "select",
        required: true,
        options: ["Ideia", "Protótipo", "Em operação", "Não sei"],
      },
      {
        id: "userGroups",
        label: "Quais grupos de pessoas ou organizações usam a plataforma?",
        kind: "textarea",
        required: true,
        help: "Descreva grupos, sem incluir nomes ou dados pessoais de usuários.",
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
    id: "problems",
    title: "Problemas e resultados",
    description: "Identifique as dores prioritárias e como uma mudança útil apareceria na prática.",
    fields: [
      {
        id: "pains",
        label: "Quais problemas ou fricções são mais importantes?",
        kind: "textarea",
        required: true,
      },
      {
        id: "desiredResult",
        label: "Que resultado desejado deveria mudar?",
        kind: "textarea",
        required: true,
      },
      {
        id: "impact",
        label: "Qual é o impacto desses problemas hoje?",
        kind: "textarea",
      },
      {
        id: "attempts",
        label: "O que já foi tentado para resolvê-los?",
        kind: "textarea",
      },
      {
        id: "priority",
        label: "Qual frente merece prioridade agora?",
        kind: "select",
        required: true,
        options: ["Parcerias comerciais", "Aquisição e uso da plataforma", "As duas frentes"],
      },
    ],
  },
  {
    id: "partnerships",
    title: "Parcerias comerciais",
    description:
      "Mapeie o papel das parcerias, o valor trocado e os gargalos sem identificar contatos.",
    fields: [
      {
        id: "partnerTypes",
        label: "Que tipos de parceiros são relevantes?",
        kind: "textarea",
        help: "Descreva categorias; não informe nomes nem contatos pessoais.",
      },
      {
        id: "partnerValue",
        label: "Que valor a plataforma oferece aos parceiros e recebe deles?",
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
        placeholder: "Por exemplo: últimos 90 dias",
      },
      {
        id: "partnerUnit",
        label: "Qual é a unidade das métricas?",
        kind: "text",
        required: true,
        when: AGGREGATE_DATA_CONDITION,
        placeholder: "Por exemplo: parcerias ativas",
      },
    ],
  },
  {
    id: "users",
    title: "Aquisição e uso da plataforma",
    description: "Descreva como os grupos chegam à plataforma, ativam-se e usam a oferta.",
    fields: [
      {
        id: "acquisitionChannels",
        label: "Como os grupos de usuários descobrem ou chegam à plataforma?",
        kind: "textarea",
      },
      {
        id: "activationEvent",
        label: "Que ação indica que um usuário começou a obter valor?",
        kind: "textarea",
      },
      {
        id: "userMeasurement",
        label: "Como medem aquisição, ativação ou uso?",
        kind: "select",
        required: true,
        options: MEASUREMENT_OPTIONS,
      },
      {
        id: "userMetrics",
        label: "Quais métricas agregadas estão disponíveis?",
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
        placeholder: "Por exemplo: último mês",
      },
      {
        id: "userUnit",
        label: "Qual é a unidade das métricas?",
        kind: "text",
        required: true,
        when: USER_AGGREGATE_DATA_CONDITION,
        placeholder: "Por exemplo: usuários ativos por mês",
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
  for (const step of BRIEF_STEPS) {
    Object.assign(errors, validateStep(step, values));
  }
  return errors;
}

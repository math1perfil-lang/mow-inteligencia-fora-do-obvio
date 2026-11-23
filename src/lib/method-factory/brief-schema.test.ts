import { describe, expect, it } from "vitest";
import {
  BUSINESS_TYPES,
  BRIEF_STEPS,
  pickVisibleValues,
  type Step,
  type Values,
  validateBrief,
  validateStep,
  visibleFields,
  visibleSteps,
} from "./brief-schema";

const validBrief: Values = {
  businessType: BUSINESS_TYPES[0],
  company: "Empresa sintética para teste",
  platformDescription: "Serviço digital fictício para exercício interno.",
  businessModel: "Receita por serviços e contratos, se aplicável.",
  stage: "Em funcionamento",
  userGroups: "Pessoas e organizações atendidas em cenário sintético.",
  digitalOffering: "Aplicação fictícia para organizar uma atividade.",
  digitalJourney: "Cadastro, solicitação, atendimento e conclusão fictícios.",
  pains: JSON.stringify([
    {
      title: "Dificuldade para encontrar a oferta adequada",
      domain: "Comercial e vendas",
      urgency: "Média",
      description: "Pessoas não encontram a oferta apropriada.",
      impact: "Não medido.",
    },
  ]),
  desiredResult: "Reduzir o tempo para encontrar uma solução.",
  partnerMeasurement: "Não medimos",
  userMeasurement: "Não sei",
  rightsStatus: "Sem material nesta etapa",
  constraints: "Não tratar dados pessoais de usuários finais.",
  successCriteria: "Definir um próximo passo verificável.",
};

function stepById(id: string): Step {
  const step = BRIEF_STEPS.find((candidate) => candidate.id === id);
  if (!step) throw new Error(`Etapa ausente: ${id}`);
  return step;
}

function evidenceErrors(sourceLink: string): Record<string, string> {
  return validateStep(stepById("evidence"), {
    sourceLink,
    rightsStatus: "Sem material nesta etapa",
  });
}

describe("brief-schema", () => {
  it("declara as etapas gerais e a etapa adaptativa em ordem", () => {
    expect(BRIEF_STEPS.map(({ id }) => id)).toEqual([
      "context",
      "activity-profile",
      "problems",
      "partnerships",
      "users",
      "evidence",
      "limits",
    ]);
  });

  it("começa sem atividade selecionada e varia as perguntas por tipo de negócio", () => {
    const context = stepById("context");
    const profile = stepById("activity-profile");
    const businessTypeField = context.fields[0];

    expect(businessTypeField?.id).toBe("businessType");
    expect(businessTypeField?.options).toEqual(BUSINESS_TYPES);
    expect(visibleSteps({}).map(({ id }) => id)).not.toContain("activity-profile");
    expect(validateBrief({})).toHaveProperty("businessType");

    const digital = visibleFields(profile, { businessType: BUSINESS_TYPES[0] }).map(({ id }) => id);
    expect(digital).toContain("digitalOffering");
    expect(digital).not.toContain("professionalServices");

    const legal = visibleFields(profile, { businessType: BUSINESS_TYPES[1] }).map(({ id }) => id);
    expect(legal).toContain("professionalServices");
    expect(legal).not.toContain("digitalOffering");

    const sales = visibleFields(profile, { businessType: BUSINESS_TYPES[2] }).map(({ id }) => id);
    expect(sales).toContain("salesProcess");
    expect(sales).not.toContain("professionalServices");

    const other = visibleFields(profile, { businessType: BUSINESS_TYPES[8] }).map(({ id }) => id);
    expect(other).toEqual(["otherActivity"]);
  });

  it("mapeia os nove tipos de atividade para ramos exclusivos e completos", () => {
    const profile = stepById("activity-profile");
    const cases: Array<{ businessType: (typeof BUSINESS_TYPES)[number]; fields: string[] }> = [
      {
        businessType: BUSINESS_TYPES[0],
        fields: ["digitalOffering", "digitalJourney", "digitalConstraints"],
      },
      {
        businessType: BUSINESS_TYPES[1],
        fields: ["professionalServices", "professionalWorkflow", "professionalConstraints"],
      },
      {
        businessType: BUSINESS_TYPES[2],
        fields: ["salesProcess", "salesChannels", "salesConstraints"],
      },
      {
        businessType: BUSINESS_TYPES[3],
        fields: ["productionFlow", "productionBottleneck", "productionQuality"],
      },
      {
        businessType: BUSINESS_TYPES[4],
        fields: ["careServices", "careCapacity", "careConstraints"],
      },
      {
        businessType: BUSINESS_TYPES[5],
        fields: ["learningOutcome", "learningProcess", "learningConstraints"],
      },
      {
        businessType: BUSINESS_TYPES[6],
        fields: ["fieldServiceFlow", "fieldServiceCapacity", "fieldServiceQuality"],
      },
      {
        businessType: BUSINESS_TYPES[7],
        fields: ["socialPurpose", "socialOutcome", "socialConstraints"],
      },
      { businessType: BUSINESS_TYPES[8], fields: ["otherActivity"] },
    ];

    expect(cases.map(({ businessType }) => businessType)).toEqual(BUSINESS_TYPES);
    expect(visibleFields(profile, {})).toEqual([]);

    for (const { businessType, fields } of cases) {
      expect(
        visibleFields(profile, { businessType }).map(({ id }) => id),
        businessType,
      ).toEqual(fields);
    }
  });

  it("remove valores de ramificações inativas do conjunto visível", () => {
    const picked = pickVisibleValues({
      ...validBrief,
      professionalServices: "Resposta jurídica antiga",
      salesProcess: "Resposta comercial antiga",
      partnerMetrics: "Métrica oculta",
    });

    expect(picked).toHaveProperty("digitalOffering", validBrief["digitalOffering"]);
    expect(picked).not.toHaveProperty("professionalServices");
    expect(picked).not.toHaveProperty("salesProcess");
    expect(picked).not.toHaveProperty("partnerMetrics");
  });

  it("exige os campos obrigatórios e deixa opcionais em branco", () => {
    const errors = validateBrief({});

    expect(Object.keys(errors).sort()).toEqual(
      [
        "businessModel",
        "businessType",
        "company",
        "constraints",
        "desiredResult",
        "partnerMeasurement",
        "pains",
        "platformDescription",
        "rightsStatus",
        "stage",
        "successCriteria",
        "userGroups",
        "userMeasurement",
      ].sort(),
    );
    expect(validateBrief(validBrief)).toEqual({});
    expect(validateBrief({ ...validBrief, impact: "", attempts: "" })).toEqual({});
  });

  it("aceita várias dores em áreas diferentes e área ainda desconhecida", () => {
    const problems = stepById("problems");
    const entries = [
      {
        title: "Margem abaixo do esperado",
        domain: "Finanças",
        urgency: "Alta",
        description: "A margem não cobre as despesas operacionais.",
        impact: "Não medido.",
      },
      {
        title: "Canal de aquisição incerto",
        domain: "Ainda não sei",
        urgency: "Ainda não sei",
        description: "Ainda não há clareza sobre a origem de novos clientes.",
        impact: "",
      },
    ];
    expect(
      validateStep(problems, { pains: JSON.stringify(entries), desiredResult: "Aprender" }),
    ).toEqual({});
    expect(validateStep(problems, { pains: "[]", desiredResult: "Aprender" })).toHaveProperty(
      "pains",
    );
    expect(
      validateStep(problems, {
        pains: JSON.stringify([{ ...entries[0], domain: "Área inventada" }]),
        desiredResult: "Aprender",
      }),
    ).toHaveProperty("pains");
  });

  it("exige período e unidade quando há dados agregados de parcerias", () => {
    const partnerships = stepById("partnerships");
    const values: Values = { partnerMeasurement: "Temos dados agregados" };
    const visibleIds = visibleFields(partnerships, values).map(({ id }) => id);
    const errors = validateStep(partnerships, values);

    expect(visibleIds).toContain("partnerMetrics");
    expect(visibleIds).toContain("partnerPeriod");
    expect(visibleIds).toContain("partnerUnit");
    expect(errors).toHaveProperty("partnerPeriod");
    expect(errors).toHaveProperty("partnerUnit");
    expect(errors).not.toHaveProperty("partnerMetrics");

    expect(
      validateStep(partnerships, {
        ...values,
        partnerPeriod: "Últimos 90 dias",
        partnerUnit: "Parcerias ativas",
      }),
    ).toEqual({});
  });

  it("exige período e unidade quando há dados agregados de aquisição e uso", () => {
    const users = stepById("users");
    const values: Values = { userMeasurement: "Temos dados agregados" };
    const visibleIds = visibleFields(users, values).map(({ id }) => id);
    const errors = validateStep(users, values);

    expect(visibleIds).toContain("userMetrics");
    expect(errors).toHaveProperty("userPeriod");
    expect(errors).toHaveProperty("userUnit");
    expect(errors).not.toHaveProperty("userMetrics");
    expect(
      validateStep(users, {
        ...values,
        userPeriod: "Último mês",
        userUnit: "Usuários ativos por mês",
      }),
    ).toEqual({});
  });

  it("ignora valores obsoletos de campos condicionais ocultos", () => {
    const errors = validateBrief({
      ...validBrief,
      partnerMetrics: "x".repeat(3001),
      partnerPeriod: "x".repeat(501),
      partnerUnit: "x".repeat(501),
      userMetrics: "x".repeat(3001),
      userPeriod: "x".repeat(501),
      userUnit: "x".repeat(501),
    });

    expect(errors).toEqual({});
  });

  it("aceita respostas legítimas como “Não sei”, “Não medimos” e “Não se aplica”", () => {
    expect(
      validateBrief({
        ...validBrief,
        businessModel: "Não sei",
        stage: "Não sei",
        partnerMeasurement: "Não medimos",
        userMeasurement: "Não se aplica",
      }),
    ).toEqual({});
  });

  it("aceita um modelo de negócio em texto aberto e rejeita opção de estágio inválida", () => {
    const errors = validateBrief({
      ...validBrief,
      businessModel: "Modelo específico descrito livremente pela iniciativa.",
      stage: "Estágio inventado",
    });
    expect(errors).toHaveProperty("stage");
    expect(errors).not.toHaveProperty("businessModel");
  });

  it("aceita URLs HTTP(S) com domínio e rejeita protocolos, hosts ou credenciais não permitidos", () => {
    expect(evidenceErrors("https://www.example.com/source?q=1")).toEqual({});
    expect(evidenceErrors("http://www.example.com/source")).toEqual({});

    const invalidUrls = [
      "ftp://www.example.com/file",
      "https://localhost/path",
      "http://service.localhost/path",
      "http://192.168.1.10/path",
      "http://127.0.0.1/path",
      "http://2130706433/path",
      "http://[::1]/path",
      "http://[::ffff:7f00:1]/path",
      "https://user:password@www.example.com/path",
      "https://service.internal/path",
      "http://intranet/path",
    ];

    for (const url of invalidUrls) {
      expect(evidenceErrors(url), url).toHaveProperty("sourceLink");
    }
  });

  it("aplica limites de texto, textarea e URL nos limites exatos", () => {
    const context = stepById("context");
    expect(
      validateStep(context, {
        businessType: BUSINESS_TYPES[0],
        company: "c".repeat(500),
        platformDescription: "d".repeat(3000),
        businessModel: "Modelo fictício em texto aberto",
        stage: "Em planejamento",
        userGroups: "g",
      }),
    ).toEqual({});

    expect(
      validateStep(context, {
        businessType: BUSINESS_TYPES[0],
        company: "c".repeat(501),
        platformDescription: "d".repeat(3001),
        businessModel: "Modelo fictício em texto aberto",
        stage: "Em planejamento",
        userGroups: "g",
      }),
    ).toHaveProperty("company");
    expect(
      validateStep(context, {
        businessType: BUSINESS_TYPES[0],
        company: "c".repeat(501),
        platformDescription: "d".repeat(3001),
        businessModel: "Modelo fictício em texto aberto",
        stage: "Em planejamento",
        userGroups: "g",
      }),
    ).toHaveProperty("platformDescription");

    const urlPrefix = "https://www.example.com/";
    const maxUrl = `${urlPrefix}${"a".repeat(2000 - urlPrefix.length)}`;
    expect(evidenceErrors(maxUrl)).toEqual({});
    expect(evidenceErrors(`${maxUrl}a`)).toHaveProperty("sourceLink");
  });
});

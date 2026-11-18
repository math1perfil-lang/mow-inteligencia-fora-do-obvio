import { describe, expect, it } from "vitest";
import {
  BRIEF_STEPS,
  type Step,
  type Values,
  validateBrief,
  validateStep,
  visibleFields,
} from "./brief-schema";

const validBrief: Values = {
  company: "Fanaticamente",
  platformDescription: "Plataforma para conectar oferta e demanda.",
  businessModel: "B2B",
  stage: "Em operação",
  userGroups: "Organizações e seus usuários.",
  pains: "Dificuldade para encontrar a oferta adequada.",
  desiredResult: "Reduzir o tempo para encontrar uma solução.",
  priority: "As duas frentes",
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
  it("declara as seis etapas esperadas em ordem", () => {
    expect(BRIEF_STEPS.map(({ id }) => id)).toEqual([
      "context",
      "problems",
      "partnerships",
      "users",
      "evidence",
      "limits",
    ]);
  });

  it("exige os campos obrigatórios e deixa opcionais em branco", () => {
    const errors = validateBrief({});

    expect(Object.keys(errors).sort()).toEqual(
      [
        "businessModel",
        "company",
        "constraints",
        "desiredResult",
        "partnerMeasurement",
        "pains",
        "platformDescription",
        "priority",
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

  it("rejeita valores de select que não constam nas opções", () => {
    const errors = validateBrief({ ...validBrief, businessModel: "modelo inventado" });
    expect(errors).toHaveProperty("businessModel");
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
        company: "c".repeat(500),
        platformDescription: "d".repeat(3000),
        businessModel: "B2B",
        stage: "Ideia",
        userGroups: "g",
      }),
    ).toEqual({});

    expect(
      validateStep(context, {
        company: "c".repeat(501),
        platformDescription: "d".repeat(3001),
        businessModel: "B2B",
        stage: "Ideia",
        userGroups: "g",
      }),
    ).toHaveProperty("company");
    expect(
      validateStep(context, {
        company: "c".repeat(501),
        platformDescription: "d".repeat(3001),
        businessModel: "B2B",
        stage: "Ideia",
        userGroups: "g",
      }),
    ).toHaveProperty("platformDescription");

    const urlPrefix = "https://www.example.com/";
    const maxUrl = `${urlPrefix}${"a".repeat(2000 - urlPrefix.length)}`;
    expect(evidenceErrors(maxUrl)).toEqual({});
    expect(evidenceErrors(`${maxUrl}a`)).toHaveProperty("sourceLink");
  });
});

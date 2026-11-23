import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BUSINESS_TYPES } from "@/lib/method-factory/brief-schema";

const { checkFactoryInviteMock, submitFactoryBriefMock } = vi.hoisted(() => ({
  checkFactoryInviteMock: vi.fn(),
  submitFactoryBriefMock: vi.fn(),
}));

vi.mock("@/lib/method-factory/workflow.functions", () => ({
  checkFactoryInvite: checkFactoryInviteMock,
  submitFactoryBrief: submitFactoryBriefMock,
}));

import { FactoryIntake } from "./FactoryIntake";

function fillField(id: string, value: string) {
  const field = document.getElementById(id);
  if (!field) throw new Error(`Campo de teste não encontrado: ${id}`);
  fireEvent.change(field, { target: { value } });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  window.history.replaceState(null, "", "/method-factory/intake#invite-token-synthetic");
  checkFactoryInviteMock.mockResolvedValue({ valid: true });
  submitFactoryBriefMock.mockResolvedValue({
    ok: true,
    receiptCode: "A1B2C3D4E5",
    internalReport: "INTERNAL-REPORT-SENTINEL",
  });
});

describe("FactoryIntake receipt boundary", () => {
  it("starts blank, adapts to legal services and returns only the receipt", async () => {
    render(<FactoryIntake />);
    await screen.findByRole("button", { name: "Continuar" });

    expect(document.getElementById("businessType")).toHaveValue("");
    expect(document.getElementById("company")).toHaveValue("");
    fillField("businessType", BUSINESS_TYPES[1]);
    fillField("company", "Escritório fictício para teste");
    fillField("platformDescription", "Serviços jurídicos fictícios de consultoria.");
    fillField("businessModel", "Honorários por serviços profissionais.");
    fillField("stage", "Em funcionamento");
    fillField("userGroups", "Organizações fictícias atendidas pelo escritório.");
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(
      screen.getByLabelText(/Que tipos de serviço ou demanda profissional/),
    ).toBeInTheDocument();
    expect(document.getElementById("digitalOffering")).toBeNull();
    fillField("professionalServices", "Consultoria contratual fictícia.");
    fillField("professionalWorkflow", "Triagem, análise, orientação e conclusão.");
    fillField("professionalConstraints", "Preservar confidencialidade e prazos aplicáveis.");
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    fillField("problem-title-0", "Atraso fictício na triagem");
    fillField("problem-domain-0", "Jurídico, risco e compliance");
    fillField("problem-urgency-0", "Média");
    fillField("problem-description-0", "A triagem fictícia demora mais do que o esperado.");
    fillField("desiredResult", "Reduzir o tempo de triagem sem perder qualidade.");
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    fillField("partnerMeasurement", "Não medimos");
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    fillField("userMeasurement", "Não medimos");
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    fillField("rightsStatus", "Sem material nesta etapa");
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    fillField("constraints", "Não usar dados pessoais ou materiais protegidos.");
    fillField("successCriteria", "Uma melhora verificável no tempo de triagem.");
    fireEvent.click(screen.getByRole("button", { name: "Revisar respostas" }));

    fireEvent.click(screen.getByLabelText(/Confirmo que este briefing será usado internamente/));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar e enviar" }));

    expect(await screen.findByRole("heading", { name: "Briefing recebido" })).toBeInTheDocument();
    expect(screen.getByText("Recibo: A1B2C3D4E5")).toBeInTheDocument();
    expect(screen.getByText(/não gera resposta ou recomendação automática/)).toBeInTheDocument();
    expect(screen.queryByText("INTERNAL-REPORT-SENTINEL")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(submitFactoryBriefMock).toHaveBeenCalledTimes(1);
    const payload = submitFactoryBriefMock.mock.calls[0]?.[0]?.data;
    expect(payload).toEqual(
      expect.objectContaining({
        token: "invite-token-synthetic",
        confirmInternalUse: true,
        values: expect.objectContaining({
          businessType: BUSINESS_TYPES[1],
          professionalServices: "Consultoria contratual fictícia.",
        }),
      }),
    );
    expect(payload.values).not.toHaveProperty("digitalOffering");
  });
});

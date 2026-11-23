import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BUSINESS_TYPES } from "@/lib/method-factory/brief-schema";
import { BriefPreview } from "./BriefPreview";

function fillField(id: string, value: string) {
  const field = document.getElementById(id);
  if (!field) throw new Error(`Campo de teste não encontrado: ${id}`);
  fireEvent.change(field, { target: { value } });
}

function continueStep() {
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
}

function fillContext() {
  fillField("businessType", BUSINESS_TYPES[0]);
  fillField("company", "Empresa sintética para teste");
  fillField("platformDescription", "Serviço digital fictício para exercício interno.");
  fillField("businessModel", "Receita por serviços e contratos, se aplicável.");
  fillField("stage", "Em funcionamento");
  fillField("userGroups", "Pessoas e organizações atendidas em cenário sintético.");
  continueStep();
}

function fillDigitalProfile() {
  fillField("digitalOffering", "Aplicação fictícia para organizar uma atividade.");
  fillField("digitalJourney", "Cadastro, solicitação, atendimento e conclusão fictícios.");
  continueStep();
}

function fillFirstPain() {
  fillField("problem-title-0", "Demora fictícia em uma etapa");
  fillField("problem-domain-0", "Operações e processos");
  fillField("problem-urgency-0", "Média");
  fillField("problem-description-0", "Uma tarefa sintética demora mais do que o esperado.");
  fillField("desiredResult", "Reduzir o tempo sem comprometer a qualidade.");
}

function finishCommonSteps() {
  fillField("partnerMeasurement", "Não medimos");
  continueStep();
  fillField("userMeasurement", "Não sei");
  continueStep();
  fillField("rightsStatus", "Sem material nesta etapa");
  continueStep();
  fillField("constraints", "Não usar dados pessoais ou materiais protegidos.");
  fillField("successCriteria", "Uma melhora verificável no cenário sintético.");
  fireEvent.click(screen.getByRole("button", { name: "Revisar respostas" }));
}

function fillToReview() {
  fillContext();
  fillDigitalProfile();
  fillFirstPain();
  continueStep();
  finishCommonSteps();
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("BriefPreview: estado em memória, sem envio", () => {
  it("começa sem empresa, setor ou respostas e foca o primeiro campo obrigatório", () => {
    render(<BriefPreview />);
    expect(document.getElementById("businessType")).toHaveValue("");
    expect(document.getElementById("company")).toHaveValue("");
    expect(document.getElementById("platformDescription")).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    expect(document.activeElement?.id).toBe("businessType");
  });

  it("preserva respostas ao voltar e recomeça em branco após desmontar", () => {
    const first = render(<BriefPreview />);
    fillContext();
    fillField("digitalOffering", "Serviço digital fictício");
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(document.getElementById("company")).toHaveValue("Empresa sintética para teste");
    expect(document.getElementById("digitalOffering")).toBeNull();
    first.unmount();
    render(<BriefPreview />);
    expect(document.getElementById("businessType")).toHaveValue("");
    expect(document.getElementById("company")).toHaveValue("");
  });

  it("troca as perguntas ao trocar de atividade e remove as respostas ocultas", () => {
    render(<BriefPreview />);
    fillContext();
    fillField("digitalOffering", "Resposta digital que não deve persistir");
    fillField("digitalJourney", "Jornada digital fictícia");
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    fillField("businessType", BUSINESS_TYPES[2]);
    continueStep();
    expect(screen.getByLabelText(/Quais são as etapas da venda/)).toBeInTheDocument();
    expect(document.getElementById("digitalOffering")).toBeNull();
    fillField("salesProcess", "Contato, proposta, negociação e fechamento fictícios.");
    fillField("salesChannels", "Canais sintéticos de venda e pós-venda.");
    continueStep();
    expect(screen.getByRole("heading", { name: "Problemas e resultados" })).toBeInTheDocument();
  });

  it("permite acrescentar dores fictícias e mostra-as na revisão", () => {
    render(<BriefPreview />);
    fillContext();
    fillDigitalProfile();
    fillFirstPain();
    fireEvent.click(screen.getByRole("button", { name: "Adicionar outra dor" }));
    fillField("problem-title-1", "Custo fictício acima do previsto");
    fillField("problem-domain-1", "Finanças");
    fillField("problem-urgency-1", "Alta");
    fillField("problem-description-1", "O custo sintético supera a estimativa.");
    continueStep();
    finishCommonSteps();
    expect(screen.getByText("Demora fictícia em uma etapa")).toBeInTheDocument();
    expect(screen.getByText("Custo fictício acima do previsto")).toBeInTheDocument();
    expect(screen.queryByText("Resposta digital que não deve persistir")).not.toBeInTheDocument();
  });

  it("gera rascunho local sem rede ou armazenamento", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const storageSpy = vi.spyOn(Storage.prototype, "setItem");
    render(<BriefPreview />);
    fillToReview();
    expect(screen.getByRole("heading", { name: "Revisar. Não enviar." })).toBeInTheDocument();
    expect(screen.getByText("Empresa sintética para teste")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Gerar rascunho local (não envia)" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Nenhuma resposta foi enviada ou armazenada",
    );
    expect(
      screen.getByRole("heading", {
        name: "Rascunho de método — Empresa sintética para teste",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "1. Medir a linha de base" })).toBeInTheDocument();
    expect(screen.getByText("Rascunho interno — não aprovado nem validado")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Plano interno de áreas e materiais" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Nenhuma fonte real foi consultada/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Gestão de operações; Gestão de processos/).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getByText(/Fontes relacionadas recebidas nesta simulação: 0/),
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Rascunho local gerado — sem envio" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Limpar" }));
    expect(document.getElementById("businessType")).toHaveValue("");
    expect(document.getElementById("company")).toHaveValue("");
  });
});

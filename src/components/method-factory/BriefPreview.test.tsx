import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BriefPreview } from "./BriefPreview";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("BriefPreview: estado em memória, sem envio", () => {
  it("bloqueia etapa incompleta e leva o foco ao primeiro campo necessário", () => {
    render(<BriefPreview />);
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    expect(document.activeElement?.id).toBe("company");
  });

  it("preserva respostas ao voltar e apaga tudo quando é desmontado", () => {
    const first = render(<BriefPreview />);
    fireEvent.click(screen.getByRole("button", { name: "Usar exemplo fictício" }));
    fireEvent.change(document.getElementById("company")!, {
      target: { value: "Empresa Fictícia Ajustada" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(document.getElementById("company")).toHaveValue("Empresa Fictícia Ajustada");
    first.unmount();
    render(<BriefPreview />);
    expect(document.getElementById("company")).toHaveValue("");
  });

  it("permite acrescentar uma dor de outra área e a mostra na revisão", () => {
    render(<BriefPreview />);
    fireEvent.click(screen.getByRole("button", { name: "Usar exemplo fictício" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByRole("button", { name: "Adicionar outra dor" }));
    fireEvent.change(screen.getByLabelText("Nome da dor 3"), {
      target: { value: "Margem abaixo do esperado" },
    });
    fireEvent.change(screen.getByLabelText("Área da dor 3"), {
      target: { value: "Finanças" },
    });
    fireEvent.change(screen.getByLabelText("Prioridade percebida 3"), {
      target: { value: "Alta" },
    });
    fireEvent.change(screen.getByLabelText("Descrição da dor 3"), {
      target: { value: "A margem não cobre as despesas operacionais." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    for (let index = 0; index < 3; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Revisar respostas" }));
    expect(screen.getByText("Margem abaixo do esperado")).toBeInTheDocument();
    expect(screen.getByText("Finanças · Prioridade: Alta")).toBeInTheDocument();
  });

  it("percorre o exemplo, revisa e conclui a simulação sem rede ou storage", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const storageSpy = vi.spyOn(Storage.prototype, "setItem");
    render(<BriefPreview />);
    fireEvent.click(screen.getByRole("button", { name: "Usar exemplo fictício" }));
    for (let index = 0; index < 5; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Revisar respostas" }));
    expect(screen.getByRole("heading", { name: "Revisar. Não enviar." })).toBeInTheDocument();
    expect(screen.getByText("Empresa Exemplo — dados fictícios")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Gerar rascunho local (não envia)" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Nenhuma resposta foi enviada ou armazenada",
    );
    expect(
      screen.getByRole("heading", { name: /Rascunho de método — Empresa Exemplo/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "1. Medir a linha de base" })).toBeInTheDocument();
    expect(screen.getByText("Rascunho interno — não aprovado nem validado")).toBeInTheDocument();
    expect(
      screen.getByText(/Fontes relacionadas recebidas nesta simulação: 0/),
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Rascunho local gerado — sem envio" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Limpar" }));
    expect(document.getElementById("company")).toHaveValue("");
  });

  it("exibe detalhes de medição somente quando existem dados agregados", () => {
    render(<BriefPreview />);
    fireEvent.click(screen.getByRole("button", { name: "Usar exemplo fictício" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(document.getElementById("partnerMetrics")).toBeNull();
    fireEvent.change(document.getElementById("partnerMeasurement")!, {
      target: { value: "Temos dados agregados" },
    });
    expect(document.getElementById("partnerMetrics")).toBeInTheDocument();
    expect(document.getElementById("partnerPeriod")).toBeInTheDocument();
    fireEvent.change(document.getElementById("partnerMeasurement")!, {
      target: { value: "Não medimos" },
    });
    expect(document.getElementById("partnerMetrics")).toBeNull();
  });
});

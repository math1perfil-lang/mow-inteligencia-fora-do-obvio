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
    fireEvent.click(screen.getByRole("button", { name: "Concluir simulação (não envia)" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Nenhuma resposta foi enviada ou armazenada",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Simulação concluída — sem envio" })).toBeDisabled();
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

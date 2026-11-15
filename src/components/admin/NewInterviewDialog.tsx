import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInterview } from "@/lib/admin/api";
import { SECTORS, getSector } from "@/lib/admin/sectors";
import { cn } from "@/lib/utils";

export function NewInterviewDialog({ children, defaultSector }: { children: ReactNode; defaultSector?: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [sectorKey, setSectorKey] = useState(defaultSector ?? "");
  const [company, setCompany] = useState("");
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);

  const sector = sectorKey ? getSector(sectorKey) : null;
  const needsCustom = sector?.key === "geral";
  const canStart = sector !== null && company.trim() !== "" && (!needsCustom || custom.trim() !== "");

  const start = async () => {
    if (!sector || !canStart) return;
    setBusy(true);
    try {
      const created = await createInterview({
        sectorKey: sector.key,
        companyName: company,
        sectorCustomName: needsCustom ? custom : "",
      });
      setOpen(false);
      await navigate({ to: "/admin/entrevistas/$id", params: { id: created.id } });
    } catch {
      toast.error("Não foi possível criar a entrevista. Confira se a migração do banco foi executada.");
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nova entrevista</DialogTitle>
          <DialogDescription>Escolha o setor para carregar o roteiro certo.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Setor">
          {SECTORS.map((s) => (
            <button
              key={s.key}
              type="button"
              role="radio"
              aria-checked={sectorKey === s.key}
              onClick={() => setSectorKey(s.key)}
              className={cn(
                "rounded-md border p-3 text-left transition-colors",
                sectorKey === s.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-accent",
              )}
            >
              <span className="block text-sm font-medium">{s.label}</span>
              <span className={cn("block text-xs", sectorKey === s.key ? "opacity-80" : "text-muted-foreground")}>
                {s.description}
              </span>
            </button>
          ))}
        </div>

        {sector ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-company">{sector.companyLabel}</Label>
              <Input id="new-company" value={company} onChange={(e) => setCompany(e.target.value)} autoFocus />
            </div>
            {needsCustom ? (
              <div className="space-y-2">
                <Label htmlFor="new-custom">Tipo de negócio</Label>
                <Input
                  id="new-custom"
                  placeholder="Ex.: pet shop, academia, contabilidade"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <Button onClick={() => void start()} disabled={!canStart || busy}>
          {busy ? "Criando…" : "Começar entrevista"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

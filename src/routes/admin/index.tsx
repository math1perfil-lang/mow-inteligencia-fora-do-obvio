import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createInterview, listInterviews } from "@/lib/admin/api";
import { COMMITMENT_OPTIONS, SIZE_OPTIONS, labelFrom } from "@/lib/admin/questions";
import type { Interview } from "@/lib/admin/types";

export const Route = createFileRoute("/admin/")({
  component: InterviewList,
});

const selectClass =
  "h-9 border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function InterviewList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Interview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("todas");
  const [sizeFilter, setSizeFilter] = useState("todos");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    listInterviews()
      .then((rows) => active && setItems(rows))
      .catch(() => active && setError("Não foi possível carregar as entrevistas."));
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      (items ?? []).filter(
        (i) =>
          (statusFilter === "todas" || i.status === statusFilter) &&
          (sizeFilter === "todos" || i.store_size === sizeFilter),
      ),
    [items, statusFilter, sizeFilter],
  );

  const startNew = async () => {
    setCreating(true);
    try {
      const created = await createInterview();
      await navigate({ to: "/admin/entrevistas/$id", params: { id: created.id } });
    } catch {
      toast.error("Não foi possível criar a entrevista.");
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Entrevistas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items ? `${items.length} registradas` : "Carregando…"}
          </p>
        </div>
        <Button onClick={() => void startNew()} disabled={creating}>
          {creating ? "Criando…" : "Nova entrevista"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Status
          <select className={selectClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="todas">Todas</option>
            <option value="rascunho">Rascunho</option>
            <option value="concluida">Concluída</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Porte
          <select className={selectClass} value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)}>
            <option value="todos">Todos</option>
            {SIZE_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loja</TableHead>
              <TableHead>Entrevistado</TableHead>
              <TableHead>Porte</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Compromisso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((i) => (
              <TableRow
                key={i.id}
                className="cursor-pointer"
                tabIndex={0}
                onClick={() => void navigate({ to: "/admin/entrevistas/$id", params: { id: i.id } })}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    void navigate({ to: "/admin/entrevistas/$id", params: { id: i.id } });
                }}
              >
                <TableCell className="font-medium">{i.store_name || "Sem nome"}</TableCell>
                <TableCell>{i.interviewee_name || "—"}</TableCell>
                <TableCell>{labelFrom(SIZE_OPTIONS, i.store_size)}</TableCell>
                <TableCell>{formatDate(i.started_at)}</TableCell>
                <TableCell>
                  <Badge variant={i.status === "concluida" ? "default" : "outline"}>
                    {i.status === "concluida" ? "Concluída" : "Rascunho"}
                  </Badge>
                </TableCell>
                <TableCell>{labelFrom(COMMITMENT_OPTIONS, i.commitment_level)}</TableCell>
              </TableRow>
            ))}
            {items && filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhuma entrevista encontrada.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

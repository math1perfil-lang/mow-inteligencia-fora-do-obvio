import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { NewInterviewDialog } from "@/components/admin/NewInterviewDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listInterviews } from "@/lib/admin/api";
import { COMMITMENT_OPTIONS, labelFrom } from "@/lib/admin/questions";
import { SECTORS, getSector, sectorDisplayName } from "@/lib/admin/sectors";
import type { Interview } from "@/lib/admin/types";

export const Route = createFileRoute("/admin/entrevistas/")({
  component: InterviewList,
});

const selectClass =
  "h-9 rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function InterviewList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Interview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("todas");
  const [sectorFilter, setSectorFilter] = useState("todos");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    listInterviews()
      .then((rows) => active && setItems(rows))
      .catch(() => active && setError("Não foi possível carregar as entrevistas."));
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter(
      (i) =>
        (statusFilter === "todas" || i.status === statusFilter) &&
        (sectorFilter === "todos" || i.sector_key === sectorFilter) &&
        (q === "" || `${i.company_name} ${i.interviewee_name}`.toLowerCase().includes(q)),
    );
  }, [items, statusFilter, sectorFilter, query]);

  const open = (id: string) => void navigate({ to: "/admin/entrevistas/$id", params: { id } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Entrevistas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items ? `${filtered.length} de ${items.length}` : "Carregando…"}
          </p>
        </div>
        <NewInterviewDialog>
          <Button>
            <Plus /> Nova entrevista
          </Button>
        </NewInterviewDialog>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="h-9 w-full sm:w-64"
          placeholder="Buscar empresa ou entrevistado"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Setor"
          className={selectClass}
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
        >
          <option value="todos">Todos os setores</option>
          {SECTORS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Status"
          className={selectClass}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="todas">Todos os status</option>
          <option value="rascunho">Rascunho</option>
          <option value="concluida">Concluída</option>
        </select>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Setor</TableHead>
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
                onClick={() => open(i.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") open(i.id);
                }}
              >
                <TableCell className="font-medium">{i.company_name || "Sem nome"}</TableCell>
                <TableCell>{sectorDisplayName(i.sector_key, i.sector_custom_name)}</TableCell>
                <TableCell>{i.interviewee_name || "—"}</TableCell>
                <TableCell>{labelFrom(getSector(i.sector_key).sizeOptions, i.company_size)}</TableCell>
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
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
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

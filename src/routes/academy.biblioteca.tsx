import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AREA_BY_ID } from "@/lib/academy/areas";
import { evaluate } from "@/lib/academy/feedback";
import {
  updateAcademy,
  useAcademy,
  type PromptStatus,
  type SavedPrompt,
} from "@/lib/academy/store";

export const Route = createFileRoute("/academy/biblioteca")({ component: Library });

const STATUS: PromptStatus[] = ["rascunho", "em teste", "aprovado", "arquivado"];
const blank = {
  title: "",
  category: "",
  objective: "",
  text: "",
  result: "",
  notes: "",
  status: "rascunho" as PromptStatus,
};

function Library() {
  const { state, ready } = useAcademy();
  const [filter, setFilter] = useState<PromptStatus | "todos">("todos");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(blank);
  const list = useMemo(
    () => state.prompts.filter((p) => filter === "todos" || p.status === filter),
    [state.prompts, filter],
  );
  if (!ready) return <p className="text-muted-foreground">Carregando…</p>;
  if (!state.profile)
    return (
      <p>
        Faça o{" "}
        <Link to="/academy/diagnostico" className="underline underline-offset-4">
          diagnóstico
        </Link>{" "}
        para usar a biblioteca.
      </p>
    );
  const area = AREA_BY_ID[state.profile.area];
  const f = (k: keyof typeof blank) => (e: { target: { value: string } }) =>
    setForm((v) => ({ ...v, [k]: e.target.value }));
  const open = (p?: SavedPrompt) => {
    setEditing(p ? p.id : "new");
    setForm(
      p
        ? {
            title: p.title,
            category: p.category,
            objective: p.objective,
            text: p.text,
            result: p.result,
            notes: p.notes,
            status: p.status,
          }
        : blank,
    );
  };
  const save = () => {
    const ev = evaluate(form.text, area);
    const now = new Date().toISOString();
    updateAcademy((s) => {
      if (editing === "new")
        return {
          ...s,
          prompts: [
            {
              id: crypto.randomUUID(),
              area: area.id,
              version: 1,
              createdAt: now,
              updatedAt: now,
              quality: ev.total,
              ...form,
            },
            ...s.prompts,
          ],
        };
      return {
        ...s,
        prompts: s.prompts.map((p) =>
          p.id === editing
            ? {
                ...p,
                ...form,
                quality: ev.total,
                updatedAt: now,
                version: p.text !== form.text ? p.version + 1 : p.version,
              }
            : p,
        ),
      };
    });
    setEditing(null);
  };
  const warn = form.text ? evaluate(form.text, area).warnings : [];

  return (
    <div className="space-y-12">
      <header>
        <p className="eyebrow text-muted-foreground">Biblioteca de prompts</p>
        <h1 className="display mt-4 text-[clamp(2.2rem,6vw,4.5rem)]">Seus prompts.</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Salve, edite e reutilize o que funciona. Para a certificação, são necessários prompts
          aprovados, com o resultado obtido descrito. Tudo fica apenas neste navegador.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => open()}>Novo prompt</Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditing("new");
              setForm({
                ...blank,
                title: `Modelo: ${area.name}`,
                category: "Modelo",
                text: area.template,
              });
            }}
          >
            Começar do modelo da minha área
          </Button>
        </div>
      </header>

      {editing && (
        <section aria-label="Editor" className="border border-border p-5 sm:p-6">
          <h2 className="text-xl font-medium">
            {editing === "new" ? "Novo prompt" : "Editar prompt"}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="eyebrow text-muted-foreground" htmlFor="l-t">
                Título
              </label>
              <Input
                id="l-t"
                value={form.title}
                onChange={f("title")}
                className="mt-2 h-12 text-base"
              />
            </div>
            <div>
              <label className="eyebrow text-muted-foreground" htmlFor="l-c">
                Categoria
              </label>
              <Input
                id="l-c"
                value={form.category}
                onChange={f("category")}
                placeholder="Ex.: e-mail, relatório, SOP"
                className="mt-2 h-12 text-base"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="eyebrow text-muted-foreground" htmlFor="l-o">
                Objetivo
              </label>
              <Input
                id="l-o"
                value={form.objective}
                onChange={f("objective")}
                className="mt-2 h-12 text-base"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="eyebrow text-muted-foreground" htmlFor="l-p">
                Prompt
              </label>
              <Textarea
                id="l-p"
                rows={9}
                value={form.text}
                onChange={f("text")}
                className="mt-2 text-base"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="eyebrow text-muted-foreground" htmlFor="l-r">
                Resultado obtido
              </label>
              <Textarea
                id="l-r"
                rows={3}
                value={form.result}
                onChange={f("result")}
                placeholder="O que aconteceu quando você usou? O que precisou corrigir?"
                className="mt-2 text-base"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="eyebrow text-muted-foreground" htmlFor="l-n">
                Observações
              </label>
              <Textarea
                id="l-n"
                rows={2}
                value={form.notes}
                onChange={f("notes")}
                className="mt-2 text-base"
              />
            </div>
            <div>
              <label className="eyebrow text-muted-foreground" htmlFor="l-s">
                Status
              </label>
              <select
                id="l-s"
                value={form.status}
                onChange={f("status")}
                className="mt-2 h-12 w-full border border-input bg-background px-3 text-base"
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {warn.length > 0 && (
            <p role="alert" className="mt-4 border border-foreground p-3 text-sm">
              {warn.join(" ")} Troque por dados fictícios antes de salvar.
            </p>
          )}
          <div className="mt-5 flex gap-2">
            <Button disabled={!form.title.trim() || form.text.trim().length < 10} onClick={save}>
              Salvar
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          </div>
        </section>
      )}

      <section aria-labelledby="lst">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="lst" className="mr-4 text-xl font-medium">
            {list.length} prompt{list.length === 1 ? "" : "s"}
          </h2>
          {(["todos", ...STATUS] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={filter === s}
              onClick={() => setFilter(s)}
              className={`min-h-9 border px-3 text-xs ${filter === s ? "border-foreground bg-foreground text-background" : "border-border"}`}
            >
              {s}
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Nenhum prompt aqui ainda. Crie o primeiro no Módulo 0 ou clique em “Novo prompt”.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {list.map((p) => (
              <li key={p.id} className="border border-border p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-medium">{p.title}</h3>
                  <span className="eyebrow text-muted-foreground">
                    {p.status} · v{p.version} · qualidade {p.quality.toFixed(1)}/10
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.category || "Sem categoria"} · {AREA_BY_ID[p.area]?.name} ·{" "}
                  {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                </p>
                {p.objective && <p className="mt-2 text-sm">{p.objective}</p>}
                <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap border border-border p-3 text-xs leading-relaxed">
                  {p.text}
                </pre>
                {p.result && (
                  <p className="mt-3 text-sm">
                    <span className="text-muted-foreground">Resultado: </span>
                    {p.result}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => open(p)}>
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void navigator.clipboard?.writeText(p.text)}
                  >
                    Copiar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      updateAcademy((s) => ({
                        ...s,
                        prompts: s.prompts.map((x) =>
                          x.id === p.id ? { ...x, status: "arquivado" } : x,
                        ),
                      }))
                    }
                  >
                    Arquivar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm("Excluir este prompt?"))
                        updateAcademy((s) => ({
                          ...s,
                          prompts: s.prompts.filter((x) => x.id !== p.id),
                        }));
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="tpl" className="border border-border p-6">
        <h2 id="tpl" className="text-xl font-medium">
          Template da sua área: {area.name}
        </h2>
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed">
          {area.template}
        </pre>
        <p className="mt-3 text-xs text-muted-foreground">
          Substitua os [campos] por situações fictícias ou anonimizadas.
        </p>
      </section>
    </div>
  );
}

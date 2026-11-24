import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GovernanceRules } from "@/components/academy/GovernanceRules";
import { AREA_BY_ID } from "@/lib/academy/areas";
import { certification, updateAcademy, useAcademy } from "@/lib/academy/store";

export const Route = createFileRoute("/academy/certificado")({ component: Certificate });

function Certificate() {
  const { state, ready } = useAcademy();
  if (!ready) return <p className="text-muted-foreground">Carregando…</p>;
  if (!state.profile)
    return (
      <p>
        Faça o{" "}
        <Link to="/academy/start" className="underline underline-offset-4">
          diagnóstico
        </Link>{" "}
        para iniciar sua trilha.
      </p>
    );
  const c = certification(state);
  const area = AREA_BY_ID[state.profile.area];
  const issued = !!state.issuedAt && c.eligible;
  return (
    <div className="space-y-12">
      <header>
        <p className="eyebrow text-muted-foreground">Projeto final e certificado</p>
        <h1 className="display mt-4 text-[clamp(2.2rem,6vw,4.5rem)]">Certificação.</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          O certificado exige aplicação prática, não só conclusão de etapas.
        </p>
      </header>

      <section aria-labelledby="req">
        <h2 id="req" className="text-xl font-medium">
          Requisitos
        </h2>
        <ul className="mt-4 space-y-2">
          {c.rules.map((r) => (
            <li
              key={r.label}
              className={`flex gap-3 border p-3 text-sm ${r.ok ? "border-foreground" : "border-border text-muted-foreground"}`}
            >
              <span aria-hidden>{r.ok ? "●" : "○"}</span>
              {r.label}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="fp" className="max-w-3xl">
        <h2 id="fp" className="text-xl font-medium">
          Projeto final: {area.entrega}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Descreva o seu Sistema de Prompts Corporativo: quais prompts o compõem, onde você os
          aplicou, o que mudou e como mediu ({area.indicadores.join("; ")}). Sem dados pessoais ou
          confidenciais.
        </p>
        <Textarea
          rows={8}
          className="mt-4 text-base"
          aria-label="Projeto final"
          value={state.finalProject}
          onChange={(e) => updateAcademy((s) => ({ ...s, finalProject: e.target.value }))}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {state.finalProject.trim().length}/200 caracteres mínimos
        </p>
        <details className="mt-6">
          <summary className="cursor-pointer text-sm underline underline-offset-4">
            Ler as regras de governança e segurança
          </summary>
          <div className="mt-4">
            <GovernanceRules />
          </div>
        </details>
        <label className="mt-4 flex min-h-12 cursor-pointer items-start gap-3 border border-border p-4 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 accent-white"
            checked={state.ack}
            onChange={(e) => updateAcademy((s) => ({ ...s, ack: e.target.checked }))}
          />
          Li e me comprometo a seguir as regras de governança e segurança, a revisar o que a IA
          produz e a não inserir dados sensíveis sem autorização.
        </label>
      </section>

      {c.eligible && !issued && (
        <section aria-labelledby="iss" className="max-w-xl border border-border p-6">
          <h2 id="iss" className="text-xl font-medium">
            Emitir certificado
          </h2>
          <label htmlFor="nm" className="eyebrow mt-4 block text-muted-foreground">
            Nome completo
          </label>
          <Input
            id="nm"
            className="mt-2 h-12 text-base"
            value={state.certName}
            onChange={(e) => updateAcademy((s) => ({ ...s, certName: e.target.value }))}
          />
          <Button
            className="mt-4"
            disabled={state.certName.trim().length < 3}
            onClick={() => updateAcademy((s) => ({ ...s, issuedAt: new Date().toISOString() }))}
          >
            Emitir certificado
          </Button>
        </section>
      )}

      {issued && (
        <section aria-label="Certificado">
          <div id="cert" className="border-2 border-foreground p-8 text-center sm:p-14">
            <p className="eyebrow text-muted-foreground">MOW Academy</p>
            <h2 className="display mt-6 text-[clamp(1.8rem,5vw,3.2rem)]">
              Certificado de conclusão
            </h2>
            <p className="mt-8 text-muted-foreground">Certificamos que</p>
            <p className="mt-2 text-3xl font-medium tracking-tight">{state.certName}</p>
            <p className="mx-auto mt-6 max-w-xl leading-relaxed">
              concluiu o curso <strong className="font-medium">IA Corporativa</strong>, trilha{" "}
              {area.name}, com entrega do projeto “{area.entrega}”.
            </p>
            <p className="mt-8 text-sm text-muted-foreground">
              Emitido em {new Date(state.issuedAt!).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Este certificado é gerado neste navegador a partir do seu próprio progresso, sem
            verificação por terceiros. A validação oficial pela MOW será uma etapa futura.
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => window.print()}>Imprimir ou salvar em PDF</Button>
            <Button
              variant="ghost"
              onClick={() => updateAcademy(({ issuedAt: _drop, ...rest }) => rest)}
            >
              Editar nome
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

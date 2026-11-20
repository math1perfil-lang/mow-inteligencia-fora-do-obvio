import type { MethodDraft } from "@/lib/method-factory/analysis";

export function MethodDraftPreview({ draft }: { draft: MethodDraft }) {
  const plan = draft.rascunho_de_método;

  return (
    <section
      className="mt-10 space-y-6 border-t border-white/20 pt-8"
      aria-labelledby="method-draft-result"
    >
      <div className="border border-white/25 bg-white/[0.025] p-5 sm:p-7">
        <p className="eyebrow text-white/60">Resultado local · {draft.engine}</p>
        <h3
          id="method-draft-result"
          tabIndex={-1}
          className="mt-3 text-2xl font-medium tracking-tight outline-none sm:text-3xl"
        >
          {draft.title}
        </h3>
        <p className="mt-3 inline-block border border-white/25 px-3 py-2 text-xs">{draft.status}</p>
        <p className="mt-5 text-sm leading-relaxed text-white/75">{draft.summary}</p>
        <p className="mt-5 border-l-2 border-white/60 pl-4 text-sm leading-relaxed text-white/70">
          Esta simulação roda apenas nesta página com regras determinísticas. Não consultou catálogo
          de fontes, não usou IA, não enviou nem salvou respostas. O resultado é preliminar e exige
          revisão humana.
        </p>
      </div>

      <section className="border border-white/15 p-5 sm:p-6" aria-labelledby="draft-objective">
        <h4 id="draft-objective" className="text-lg font-medium">
          Objetivo provisório
        </h4>
        <p className="mt-3 text-sm leading-relaxed text-white/70">{plan.objetivo}</p>
      </section>

      <section className="border border-white/15 p-5 sm:p-6" aria-labelledby="draft-pains">
        <h4 id="draft-pains" className="text-lg font-medium">
          Dores recebidas e atribuição
        </h4>
        <ul className="mt-4 space-y-4">
          {draft.dores_decompostas.map((pain) => (
            <li key={`${pain.índice}-${pain.título}`} className="border-l border-white/40 pl-4">
              <p className="text-sm font-medium">
                {pain.índice}. {pain.título}
              </p>
              <p className="mt-1 text-xs text-white/65">
                {pain.área} · Prioridade percebida: {pain.prioridade_percebida}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/75">{pain.descrição}</p>
              <p className="mt-2 text-xs leading-relaxed text-white/55">{pain.nota_de_medida}</p>
              {pain.impacto_informado ? (
                <p className="mt-2 text-xs leading-relaxed text-white/65">
                  Impacto informado: {pain.impacto_informado}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="border border-white/15 p-5 sm:p-6" aria-labelledby="draft-steps">
        <h4 id="draft-steps" className="text-lg font-medium">
          Rascunho de método
        </h4>
        <ol className="mt-4 space-y-5">
          {plan.passos.map((step) => (
            <li
              key={step.etapa}
              className="border-t border-white/15 pt-4 first:border-0 first:pt-0"
            >
              <h5 className="text-sm font-medium">{step.etapa}</h5>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{step.descrição}</p>
              <p className="mt-2 text-xs leading-relaxed text-white/55">
                Responsável sugerido: {step.responsável_sugerido}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/55">
                Instrumentos: {step.instrumentos.join("; ")}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {plan.adaptações_por_domínio.length > 0 ? (
        <section className="border border-white/15 p-5 sm:p-6" aria-labelledby="draft-adaptations">
          <h4 id="draft-adaptations" className="text-lg font-medium">
            Adaptações sugeridas por área
          </h4>
          <ul className="mt-4 space-y-4">
            {plan.adaptações_por_domínio.map((item) => (
              <li key={item.domínio}>
                <p className="text-sm font-medium">{item.domínio}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/70">{item.proposta}</p>
                <p className="mt-1 text-xs text-white/50">{item.atribuição}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="border border-white/15 p-5 sm:p-6" aria-labelledby="draft-hypotheses">
        <h4 id="draft-hypotheses" className="text-lg font-medium">
          Hipóteses a testar — não são fatos
        </h4>
        <ul className="mt-4 space-y-3">
          {draft.hipóteses.map((hypothesis) => (
            <li key={hypothesis.dor_relacionada} className="text-sm leading-relaxed text-white/70">
              <span className="font-medium">{hypothesis.dor_relacionada}:</span> {hypothesis.texto}
            </li>
          ))}
        </ul>
      </section>

      {draft.lacunas_e_perguntas.length > 0 ? (
        <section className="border border-white/15 p-5 sm:p-6" aria-labelledby="draft-questions">
          <h4 id="draft-questions" className="text-lg font-medium">
            Perguntas e lacunas para revisão
          </h4>
          <ul className="mt-4 space-y-4">
            {draft.lacunas_e_perguntas.map((item) => (
              <li key={`${item.pergunta}-${item.motivo}`}>
                <p className="text-sm font-medium">{item.pergunta}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/60">{item.motivo}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <details className="border border-white/15 p-5 sm:p-6">
        <summary className="cursor-pointer text-sm font-medium">
          Fontes, limitações e riscos
        </summary>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-white/70">
          <p>{draft.disponibilidade_de_fontes}</p>
          <p>
            Fontes relacionadas recebidas nesta simulação: {draft.fontes_relacionadas.length}.
            Nenhum conteúdo de referência foi consultado.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            {draft.limitações.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
            {plan.riscos.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
          <p className="font-medium">Rascunho interno; não aprovado, validado nem executado.</p>
        </div>
      </details>
    </section>
  );
}

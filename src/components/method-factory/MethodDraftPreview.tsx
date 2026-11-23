import type { MethodDraft } from "@/lib/method-factory/analysis";

export function MethodDraftPreview({ draft }: { draft: MethodDraft }) {
  const plan = draft.rascunho_de_método;
  const knowledge = draft.plano_de_conhecimento;

  return (
    <section
      className="mt-10 space-y-6 border-t border-border pt-8"
      aria-labelledby="method-draft-result"
    >
      <div className="glass p-5 sm:p-7">
        <p className="eyebrow text-muted-foreground">Resultado local · {draft.engine}</p>
        <h3
          id="method-draft-result"
          tabIndex={-1}
          className="mt-3 text-2xl font-medium tracking-tight outline-none sm:text-3xl"
        >
          {draft.title}
        </h3>
        <p className="mt-3 inline-block glass px-3 py-2 text-xs">{draft.status}</p>
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{draft.summary}</p>
        <p className="mt-5 border-l-2 border-foreground/50 pl-4 text-sm leading-relaxed text-muted-foreground">
          Esta simulação roda apenas nesta página com regras determinísticas. Não consultou catálogo
          de fontes, não usou IA, não enviou nem salvou respostas. O resultado é preliminar e exige
          revisão humana.
        </p>
      </div>

      <section className="glass p-5 sm:p-6" aria-labelledby="draft-objective">
        <h4 id="draft-objective" className="text-lg font-medium">
          Objetivo provisório
        </h4>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.objetivo}</p>
      </section>

      <section className="glass p-5 sm:p-6" aria-labelledby="draft-pains">
        <h4 id="draft-pains" className="text-lg font-medium">
          Dores recebidas e atribuição
        </h4>
        <ul className="mt-4 space-y-4">
          {draft.dores_decompostas.map((pain) => (
            <li
              key={`${pain.índice}-${pain.título}`}
              className="border-l border-foreground/30 pl-4"
            >
              <p className="text-sm font-medium">
                {pain.índice}. {pain.título}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {pain.área} · Prioridade percebida: {pain.prioridade_percebida}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pain.descrição}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {pain.nota_de_medida}
              </p>
              {pain.impacto_informado ? (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Impacto informado: {pain.impacto_informado}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="glass p-5 sm:p-6" aria-labelledby="draft-knowledge-plan">
        <h4 id="draft-knowledge-plan" className="text-lg font-medium">
          Plano interno de áreas e materiais
        </h4>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Seleção orientadora para futuras buscas, visível à equipe interna MOW. Nenhuma fonte real
          foi consultada, nenhum conteúdo foi processado ou salvo, e esta seleção não libera uso de
          material.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">{knowledge.status}</p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <h5 className="text-sm font-medium">Áreas candidatas</h5>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {knowledge.candidateAreas.join("; ") || "Nenhuma área candidata"}
            </p>
          </div>
          <div>
            <h5 className="text-sm font-medium">Trilhas condicionais — confirmar no briefing</h5>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {knowledge.conditionalAreas.join("; ") || "Nenhuma trilha condicional"}
            </p>
          </div>
          {knowledge.proposedCrosscuttingAreas.length > 0 ? (
            <div className="sm:col-span-2">
              <h5 className="text-sm font-medium">Extensão taxonômica proposta, não cadastrada</h5>
              <p className="mt-2 text-sm text-muted-foreground">
                {knowledge.proposedCrosscuttingAreas.join("; ")}
              </p>
            </div>
          ) : null}
        </div>

        {knowledge.needsClarification.length > 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Esclarecer antes de ampliar a seleção: {knowledge.needsClarification.join("; ")}.
          </p>
        ) : null}

        {knowledge.mappings.length > 0 ? (
          <ul className="mt-5 space-y-4 border-t border-border pt-4">
            {knowledge.mappings.map((mapping, index) => (
              <li key={`${mapping.problemDomain}-${index}`}>
                <p className="text-sm font-medium">{mapping.problemDomain}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Candidatas: {mapping.candidateAreas.join("; ")}
                  {mapping.conditionalAreas.length > 0
                    ? ` · Condicionais: ${mapping.conditionalAreas.join("; ")}`
                    : ""}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {mapping.rationale}
                </p>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
          <div>
            <h5 className="text-sm font-medium">Evidência principal</h5>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {knowledge.materialPriority.primaryEvidence.join("; ")}
            </p>
          </div>
          <div>
            <h5 className="text-sm font-medium">Desenho metodológico — filtro forte</h5>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {knowledge.materialPriority.methodDesignRequiresValidation.join("; ")}
            </p>
          </div>
          <div>
            <h5 className="text-sm font-medium">Apoio provisório</h5>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {knowledge.materialPriority.contextualAndProvisional.join("; ")}
            </p>
          </div>
          <div>
            <h5 className="text-sm font-medium">Descoberta — não prova de eficácia</h5>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {knowledge.materialPriority.discoveryOnly.join("; ")}
            </p>
          </div>
        </div>

        <ul className="mt-5 list-disc space-y-2 border-t border-border pt-4 pl-5 text-xs leading-relaxed text-muted-foreground">
          {knowledge.safeguards.map((safeguard) => (
            <li key={safeguard}>{safeguard}</li>
          ))}
        </ul>
      </section>

      <section className="glass p-5 sm:p-6" aria-labelledby="draft-steps">
        <h4 id="draft-steps" className="text-lg font-medium">
          Rascunho de método
        </h4>
        <ol className="mt-4 space-y-5">
          {plan.passos.map((step) => (
            <li key={step.etapa} className="border-t border-border pt-4 first:border-0 first:pt-0">
              <h5 className="text-sm font-medium">{step.etapa}</h5>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.descrição}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Responsável sugerido: {step.responsável_sugerido}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Instrumentos: {step.instrumentos.join("; ")}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {plan.adaptações_por_domínio.length > 0 ? (
        <section className="glass p-5 sm:p-6" aria-labelledby="draft-adaptations">
          <h4 id="draft-adaptations" className="text-lg font-medium">
            Adaptações sugeridas por área
          </h4>
          <ul className="mt-4 space-y-4">
            {plan.adaptações_por_domínio.map((item) => (
              <li key={item.domínio}>
                <p className="text-sm font-medium">{item.domínio}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {item.proposta}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{item.atribuição}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="glass p-5 sm:p-6" aria-labelledby="draft-hypotheses">
        <h4 id="draft-hypotheses" className="text-lg font-medium">
          Hipóteses a testar — não são fatos
        </h4>
        <ul className="mt-4 space-y-3">
          {draft.hipóteses.map((hypothesis) => (
            <li
              key={hypothesis.dor_relacionada}
              className="text-sm leading-relaxed text-muted-foreground"
            >
              <span className="font-medium">{hypothesis.dor_relacionada}:</span> {hypothesis.texto}
            </li>
          ))}
        </ul>
      </section>

      {draft.lacunas_e_perguntas.length > 0 ? (
        <section className="glass p-5 sm:p-6" aria-labelledby="draft-questions">
          <h4 id="draft-questions" className="text-lg font-medium">
            Perguntas e lacunas para revisão
          </h4>
          <ul className="mt-4 space-y-4">
            {draft.lacunas_e_perguntas.map((item) => (
              <li key={`${item.pergunta}-${item.motivo}`}>
                <p className="text-sm font-medium">{item.pergunta}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.motivo}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <details className="glass p-5 sm:p-6">
        <summary className="cursor-pointer text-sm font-medium">
          Fontes, limitações e riscos
        </summary>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
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

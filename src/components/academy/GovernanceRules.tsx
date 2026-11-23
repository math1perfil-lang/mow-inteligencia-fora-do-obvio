const RULES: [string, string][] = [
  [
    "Dados pessoais",
    "Não insira nomes, documentos, contatos ou imagens de pessoas. Use dados fictícios ou anonimizados.",
  ],
  [
    "Dados confidenciais",
    "Estratégias, contratos e informações não públicas só entram com autorização expressa da empresa.",
  ],
  [
    "Informações de clientes",
    "Descreva o segmento e a situação, nunca a ficha individual do cliente.",
  ],
  [
    "Propriedade intelectual",
    "Não cole materiais de terceiros sem direito de uso. Confira a originalidade do que a IA produz.",
  ],
  [
    "Dados financeiros",
    "Prefira valores agregados ou fictícios. Números usados em decisão são sempre conferidos na fonte.",
  ],
  [
    "Dados de RH",
    "Avaliações, saúde, remuneração e dados de candidatos ou colaboradores não são inseridos.",
  ],
  [
    "Decisões sensíveis",
    "A IA não decide sobre pessoas, crédito, demissão ou questões jurídicas. Ela apoia; a decisão é humana.",
  ],
  [
    "Revisão humana",
    "Toda saída é revisada antes de ser usada. A IA pode errar com muita confiança.",
  ],
  [
    "Uso responsável",
    "Fatos, hipóteses e recomendações ficam separados. Em pesquisas, peça fontes e confirme.",
  ],
  ["Privacidade", "Siga a política da sua empresa e a LGPD. Em dúvida, use um exemplo fictício."],
  [
    "Rastreabilidade",
    "Guarde prompt, versão, data e o que foi verificado, para poder explicar e repetir o trabalho.",
  ],
];

export function GovernanceRules() {
  return (
    <ul className="grid gap-px border border-border bg-border sm:grid-cols-2">
      {RULES.map(([t, d]) => (
        <li key={t} className="bg-background p-5">
          <h3 className="text-base font-medium">{t}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
        </li>
      ))}
    </ul>
  );
}

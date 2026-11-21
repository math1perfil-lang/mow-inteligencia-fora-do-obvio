/** Objeto de vidro decorativo do cabeçalho das páginas da Method Factory. */
export function FactoryOrb({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`mf-orb-wrap ${className}`}>
      <div className="mf-orb">
        <div className="mf-ring" />
        <div className="mf-ring mf-ring2" />
        <div className="mf-core" />
        <div className="mf-shine" />
      </div>
    </div>
  );
}

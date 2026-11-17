/**
 * Esqueleto de carga instantáneo mientras el servidor prepara la página.
 * Mantiene la barra lateral visible (vive dentro del layout de cada sección).
 */
export default function PageSkeleton() {
  return (
    <div className="page-skeleton" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      <div className="sk sk-banner" />
      <div className="sk-grid">
        <div className="sk sk-card" />
        <div className="sk sk-card" />
        <div className="sk sk-card" />
        <div className="sk sk-card" />
      </div>
      <div className="sk-cols">
        <div className="sk sk-block" />
        <div className="sk sk-block sk-block--side" />
      </div>
    </div>
  )
}

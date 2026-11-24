"use client"
import { useState } from "react"

// Types 

export interface AvisoItem {
  id: string
  tipo: string
  categoria: string
  titulo: string
  contenido: string
  fijado: boolean
  imagen: string | null
  createdAt: string
  audiencia: string
  expiresAt?: string | null
  _kind: "aviso"
}

export interface EventoItem {
  id: string
  tipo: string
  titulo: string
  fecha: string
  hora: string
  lugar: string
  createdAt: string
  audiencia: string
  _kind: "evento"
}

export type Item = AvisoItem | EventoItem

// Helpers 

const MES3 = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"]

function dateOnly(iso: string): Date {
  const d = new Date(iso)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function todayUTC(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

function isEventoActivo(e: EventoItem): boolean {
  return dateOnly(e.fecha) >= todayUTC()
}

function isAvisoActivo(a: AvisoItem): boolean {
  if (!a.expiresAt) return true
  return dateOnly(a.expiresAt) >= todayUTC()
}

function isActivo(item: Item): boolean {
  return item._kind === "evento" ? isEventoActivo(item) : isAvisoActivo(item)
}

function parseFotoUrl(raw: string | null): string | null {
  if (!raw) return null
  try { return (JSON.parse(raw) as { url: string }).url } catch { return raw }
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })
}

function audienciaLabel(aud: string): string | null {
  if (aud === "todos") return null
  if (aud === "colegiados") return "Solo colegiados"
  if (aud === "peritos") return "Solo peritos"
  if (aud === "tesorero") return "Solo tesorero"
  return aud
}

// Modal 

function ModalAviso({ aviso, onClose }: { aviso: AvisoItem; onClose: () => void }) {
  const fotoUrl = parseFotoUrl(aviso.imagen)
  const audLabel = audienciaLabel(aviso.audiencia)

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--surface)", borderRadius: 16,
          maxWidth: 640, width: "100%", maxHeight: "90vh",
          overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,.4)",
          animation: "modalIn .2s ease",
        }}
      >
        {fotoUrl ? (
          <div style={{ position: "relative", height: 220, overflow: "hidden", borderRadius: "16px 16px 0 0" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotoUrl} alt={aviso.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.7) 0%, transparent 60%)" }} />
            <div style={{ position: "absolute", bottom: 14, left: 14, right: 44 }}>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>{aviso.titulo}</div>
            </div>
          </div>
        ) : (
          <div style={{ height: 100, background: "linear-gradient(135deg, #0D2060, #1a3a8a)", borderRadius: "16px 16px 0 0", display: "flex", alignItems: "flex-end", padding: "14px 20px" }}>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff" }}>{aviso.titulo}</div>
          </div>
        )}
        <div style={{ padding: "24px 28px 28px" }}>
          {!fotoUrl && <h2 style={{ margin: "0 0 8px", fontSize: "1.3rem", fontWeight: 800 }}>{aviso.titulo}</h2>}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: ".75rem", fontWeight: 600, background: "var(--surface-raised)", color: "var(--muted)" }}>
              {aviso.categoria}
            </span>
            {audLabel && (
              <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: ".72rem", fontWeight: 700, background: "#E8C06025", color: "#b08020", border: "1px solid #E8C06040" }}>
                {audLabel}
              </span>
            )}
            <span style={{ fontSize: ".8rem", color: "var(--muted)" }}>{fmtFecha(aviso.createdAt)}</span>
            {aviso.expiresAt && (
              <span style={{ fontSize: ".75rem", color: "var(--muted)" }}>
 Vigente hasta: {fmtFecha(aviso.expiresAt)}
              </span>
            )}
          </div>
          <div style={{ fontSize: ".95rem", lineHeight: 1.75, color: "var(--fg)", whiteSpace: "pre-wrap" }}>
            {aviso.contenido}
          </div>
          <button
            onClick={onClose}
            style={{ marginTop: 28, padding: "10px 24px", borderRadius: 8, background: "#0D2060", color: "#fff", border: "none", fontWeight: 700, fontSize: ".9rem", cursor: "pointer", width: "100%" }}
          >
 Cerrar
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1)  translateY(0); }
        }
      `}</style>
    </div>
  )
}

function ModalEvento({ evento, onClose }: { evento: EventoItem; onClose: () => void }) {
  const audLabel = audienciaLabel(evento.audiencia)
  const d = new Date(evento.fecha)
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--surface)", borderRadius: 16,
          maxWidth: 540, width: "100%",
          boxShadow: "0 24px 80px rgba(0,0,0,.4)",
          animation: "modalIn .2s ease",
          overflow: "hidden",
        }}
      >
        <div style={{ height: 100, background: "linear-gradient(135deg, #0D2060, #1a3a8a)", display: "flex", alignItems: "center", gap: 20, padding: "0 24px" }}>
          <div style={{ border: "2px solid rgba(255,255,255,.3)", borderRadius: 10, textAlign: "center", padding: "6px 14px", minWidth: 56 }}>
            <span style={{ display: "block", font: "700 .6rem/1 var(--f-body)", letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.7)", marginBottom: 4 }}>
              {MES3[d.getUTCMonth()]}
            </span>
            <b style={{ display: "block", font: "800 1.6rem/1 var(--f-display)", color: "#fff" }}>{d.getUTCDate()}</b>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff", lineHeight: 1.3 }}>{evento.titulo}</div>
            <div style={{ fontSize: ".8rem", color: "rgba(255,255,255,.7)", marginTop: 4 }}>{evento.tipo}</div>
          </div>
        </div>
        <div style={{ padding: "24px 28px 28px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: ".8rem", color: "var(--muted)", minWidth: 60 }}>Fecha:</span>
              <span style={{ fontWeight: 600 }}>{fmtFecha(evento.fecha)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: ".8rem", color: "var(--muted)", minWidth: 60 }}>Hora:</span>
              <span style={{ fontWeight: 600 }}>{evento.hora} h</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: ".8rem", color: "var(--muted)", minWidth: 60 }}>Lugar:</span>
              <span style={{ fontWeight: 600 }}>{evento.lugar || "Por confirmar"}</span>
            </div>
            {audLabel && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: ".8rem", color: "var(--muted)", minWidth: 60 }}>Para:</span>
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: ".72rem", fontWeight: 700, background: "#E8C06025", color: "#b08020", border: "1px solid #E8C06040" }}>
                  {audLabel}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ padding: "10px 24px", borderRadius: 8, background: "#0D2060", color: "#fff", border: "none", fontWeight: 700, fontSize: ".9rem", cursor: "pointer", width: "100%" }}
          >
 Cerrar
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1)  translateY(0); }
        }
      `}</style>
    </div>
  )
}

// Cards 

function EventoCard({ evento, onClick, archived }: { evento: EventoItem; onClick: () => void; archived?: boolean }) {
  const d = new Date(evento.fecha)
  const audLabel = audienciaLabel(evento.audiencia)
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        gap: 0,
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid var(--line)",
        background: "var(--surface)",
        cursor: "pointer",
        opacity: archived ? 0.65 : 1,
        transform: archived ? "scale(.99)" : undefined,
        transition: "box-shadow .2s, transform .2s",
        boxShadow: "var(--shadow-sm)",
      }}
      onMouseEnter={e => {
        if (!archived) {
          const el = e.currentTarget as HTMLElement
          el.style.boxShadow = "0 8px 32px rgba(13,32,96,.15)"
          el.style.transform = "translateY(-2px)"
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = "var(--shadow-sm)"
        el.style.transform = archived ? "scale(.99)" : ""
      }}
    >
      {/* Left accent bar */}
      <div style={{ width: 3, background: "#0D2060", flexShrink: 0 }} />
      {/* Mini calendar */}
      <div style={{ padding: "14px 14px 14px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 60, borderRight: "1px solid var(--line)" }}>
        <span style={{ font: "700 .6rem/1 var(--f-body)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>
          {MES3[d.getUTCMonth()]}
        </span>
        <b style={{ font: "800 1.5rem/1 var(--f-display)", color: "#0D2060" }}>{d.getUTCDate()}</b>
        <span style={{ font: ".6rem/1 var(--f-body)", color: "var(--muted)", marginTop: 4 }}>
          {d.getUTCFullYear()}
        </span>
      </div>
      {/* Content */}
      <div style={{ padding: "14px 16px", flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
          <span style={{ fontSize: ".7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#0D206015", color: "#0D2060" }}>
            {evento.tipo}
          </span>
          {audLabel && (
            <span style={{ fontSize: ".68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#E8C06025", color: "#b08020", border: "1px solid #E8C06040" }}>
              {audLabel}
            </span>
          )}
        </div>
        <div style={{ fontWeight: 700, fontSize: ".92rem", lineHeight: 1.3, marginBottom: 4 }}>{evento.titulo}</div>
        <div style={{ fontSize: ".78rem", color: "var(--muted)" }}>
          {evento.hora} h{evento.lugar ? ` · ${evento.lugar}` : ""}
        </div>
      </div>
    </div>
  )
}

function AvisoCard({ aviso, onClick, archived }: { aviso: AvisoItem; onClick: () => void; archived?: boolean }) {
  const audLabel = audienciaLabel(aviso.audiencia)
  const accentColor = aviso.fijado ? "#E8C060" : "var(--line)"
  const fotoUrl = parseFotoUrl(aviso.imagen)
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        gap: 0,
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid var(--line)",
        background: "var(--surface)",
        cursor: "pointer",
        opacity: archived ? 0.65 : 1,
        transform: archived ? "scale(.99)" : undefined,
        transition: "box-shadow .2s, transform .2s",
        boxShadow: "var(--shadow-sm)",
      }}
      onMouseEnter={e => {
        if (!archived) {
          const el = e.currentTarget as HTMLElement
          el.style.boxShadow = "0 8px 32px rgba(13,32,96,.12)"
          el.style.transform = "translateY(-2px)"
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = "var(--shadow-sm)"
        el.style.transform = archived ? "scale(.99)" : ""
      }}
    >
      {/* Left accent bar */}
      <div style={{ width: 3, background: accentColor, flexShrink: 0 }} />
      {/* Icon area */}
      <div style={{ padding: "14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 60, borderRight: "1px solid var(--line)" }}>
        {fotoUrl && !archived ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fotoUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />
        ) : (
          <div style={{ width: 36, height: 36, borderRadius: 8, background: aviso.fijado ? "#E8C06020" : "var(--surface-raised)", display: "grid", placeItems: "center", fontSize: "1.1rem" }}>
            {aviso.fijado ? "" : ""}
          </div>
        )}
        {aviso.fijado && !archived && (
          <span style={{ fontSize: ".58rem", fontWeight: 700, color: "#b08020", marginTop: 4, letterSpacing: ".05em" }}>FIJADO</span>
        )}
      </div>
      {/* Content */}
      <div style={{ padding: "14px 16px", flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
          <span style={{ fontSize: ".7rem", fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "var(--surface-raised)", color: "var(--muted)" }}>
            {aviso.categoria}
          </span>
          {audLabel && (
            <span style={{ fontSize: ".68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#E8C06025", color: "#b08020", border: "1px solid #E8C06040" }}>
              {audLabel}
            </span>
          )}
        </div>
        <div style={{ fontWeight: 700, fontSize: ".92rem", lineHeight: 1.3, marginBottom: 4 }}>{aviso.titulo}</div>
        <div style={{ fontSize: ".78rem", color: "var(--muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
          {aviso.contenido}
        </div>
        <div style={{ fontSize: ".7rem", color: "var(--muted)", marginTop: 6 }}>{fmtFecha(aviso.createdAt)}</div>
      </div>
    </div>
  )
}

// Main Component 

export default function ComunicadosGrid({ items }: { items: Item[] }) {
  const [selectedAviso, setSelectedAviso] = useState<AvisoItem | null>(null)
  const [selectedEvento, setSelectedEvento] = useState<EventoItem | null>(null)
  const [archivedOpen, setArchivedOpen] = useState(false)

  const activos = items.filter(isActivo)
  const archivados = items.filter(item => !isActivo(item))

  // Sort activos: fijados first, then by date
  const activosSorted = [...activos].sort((a, b) => {
    const aFijado = a._kind === "aviso" && a.fijado ? 1 : 0
    const bFijado = b._kind === "aviso" && b.fijado ? 1 : 0
    if (bFijado !== aFijado) return bFijado - aFijado
    // eventos by fecha asc, avisos by createdAt desc
    const aDate = a._kind === "evento" ? new Date(a.fecha) : new Date(a.createdAt)
    const bDate = b._kind === "evento" ? new Date(b.fecha) : new Date(b.createdAt)
    if (a._kind === "evento" && b._kind === "evento") return aDate.getTime() - bDate.getTime()
    return bDate.getTime() - aDate.getTime()
  })

  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--muted)" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}></div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Sin comunicados por el momento</div>
        <div style={{ fontSize: ".85rem" }}>Cuando haya eventos o avisos aparecerán aquí.</div>
      </div>
    )
  }

  return (
    <>
      {/* Active section */}
      {activosSorted.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: ".7rem", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#0D2060" }}>
 Proximos y Recientes
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
            <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>{activosSorted.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activosSorted.map(item =>
              item._kind === "evento" ? (
                <EventoCard
                  key={`e-${item.id}`}
                  evento={item}
                  onClick={() => setSelectedEvento(item)}
                />
              ) : (
                <AvisoCard
                  key={`a-${item.id}`}
                  aviso={item}
                  onClick={() => setSelectedAviso(item)}
                />
              )
            )}
          </div>
        </div>
      )}

      {/* Archived section */}
      {archivados.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setArchivedOpen(o => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "none", border: "none", cursor: "pointer",
              padding: "8px 0", width: "100%", textAlign: "left",
              marginBottom: archivedOpen ? 14 : 0,
            }}
          >
            <span style={{ fontSize: ".7rem", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)" }}>
              {archivedOpen ? "" : ""} Ver archivo ({archivados.length})
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </button>

          {archivedOpen && (
            <div style={{ background: "var(--surface-raised)", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {archivados.map(item =>
                  item._kind === "evento" ? (
                    <EventoCard
                      key={`e-${item.id}`}
                      evento={item}
                      onClick={() => setSelectedEvento(item)}
                      archived
                    />
                  ) : (
                    <AvisoCard
                      key={`a-${item.id}`}
                      aviso={item}
                      onClick={() => setSelectedAviso(item)}
                      archived
                    />
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedAviso && <ModalAviso aviso={selectedAviso} onClose={() => setSelectedAviso(null)} />}
      {selectedEvento && <ModalEvento evento={selectedEvento} onClose={() => setSelectedEvento(null)} />}
    </>
  )
}

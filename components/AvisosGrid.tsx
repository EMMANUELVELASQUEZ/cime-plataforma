"use client"
import { useState } from "react"

export interface AvisoItem {
  id: string
  tipo: string
  categoria: string
  titulo: string
  contenido: string
  fijado: boolean
  imagen: string | null
  createdAt: string
}

const TIPO_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  Urgente:      { color: "#ef4444", bg: "#ef444415", border: "#ef444430" },
  Importante:   { color: "#f59e0b", bg: "#f59e0b15", border: "#f59e0b30" },
  Informativo:  { color: "#3b82f6", bg: "#3b82f615", border: "#3b82f630" },
  Convocatoria: { color: "#10b981", bg: "#10b98115", border: "#10b98130" },
}
const tipoOf = (t: string) => TIPO_CONFIG[t] ?? { color: "#6b7280", bg: "#6b728015", border: "#6b728030" }

function parseFotoUrl(raw: string | null): string | null {
  if (!raw) return null
  try { return (JSON.parse(raw) as { url: string }).url } catch { return raw }
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })
}

function Modal({ aviso, onClose }: { aviso: AvisoItem; onClose: () => void }) {
  const cfg     = tipoOf(aviso.tipo)
  const fotoUrl = parseFotoUrl(aviso.imagen)

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
        {/* Image header */}
        {fotoUrl ? (
          <div style={{ position: "relative", height: 220, overflow: "hidden", borderRadius: "16px 16px 0 0" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotoUrl} alt={aviso.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.7) 0%, transparent 60%)" }} />
            <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 8 }}>
              <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: ".75rem", fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, backdropFilter: "blur(8px)" }}>
                {aviso.tipo}
              </span>
              {aviso.fijado && (
                <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: ".75rem", fontWeight: 700, background: "rgba(255,255,255,.15)", color: "#fff", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 4 }}>
                  📌 Fijado
                </span>
              )}
            </div>
            <div style={{ position: "absolute", bottom: 14, left: 14, right: 44 }}>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>{aviso.titulo}</div>
            </div>
          </div>
        ) : (
          <div style={{ height: 100, background: `linear-gradient(135deg, #0D2060, #1a3a8a)`, borderRadius: "16px 16px 0 0", display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "14px 20px" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: ".75rem", fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{aviso.tipo}</span>
              {aviso.fijado && <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: ".75rem", fontWeight: 700, background: "rgba(255,255,255,.15)", color: "#fff" }}>📌 Fijado</span>}
            </div>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: "24px 28px 28px" }}>
          {!fotoUrl && <h2 style={{ margin: "0 0 8px", fontSize: "1.3rem", fontWeight: 800 }}>{aviso.titulo}</h2>}

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: ".75rem", fontWeight: 600, background: "var(--surface-raised)", color: "var(--muted)" }}>
              {aviso.categoria}
            </span>
            <span style={{ fontSize: ".8rem", color: "var(--muted)" }}>
              {fmtFecha(aviso.createdAt)}
            </span>
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
          to   { opacity: 1; transform: scale(1)  translateY(0);     }
        }
      `}</style>
    </div>
  )
}

export default function AvisosGrid({ avisos }: { avisos: AvisoItem[] }) {
  const [selected, setSelected] = useState<AvisoItem | null>(null)

  const fijados  = avisos.filter(a => a.fijado)
  const normales = avisos.filter(a => !a.fijado)

  function AvisoCard({ aviso }: { aviso: AvisoItem }) {
    const cfg     = tipoOf(aviso.tipo)
    const fotoUrl = parseFotoUrl(aviso.imagen)

    return (
      <div
        onClick={() => setSelected(aviso)}
        style={{
          cursor: "pointer", borderRadius: 12,
          overflow: "hidden", border: "1px solid var(--line)",
          background: "var(--surface)",
          transition: "transform .2s ease, box-shadow .2s ease",
          boxShadow: "var(--shadow-sm)",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = "translateY(-6px) scale(1.01)"
          el.style.boxShadow = "0 16px 48px rgba(13,32,96,.18)"
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = ""
          el.style.boxShadow = "var(--shadow-sm)"
        }}
      >
        {/* Image / gradient header */}
        <div style={{ position: "relative", height: fotoUrl ? 180 : 90, overflow: "hidden" }}>
          {fotoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fotoUrl} alt={aviso.titulo} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s ease" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.65) 0%, transparent 55%)" }} />
              <div style={{ position: "absolute", bottom: 10, left: 12, right: 12, fontWeight: 700, fontSize: ".95rem", color: "#fff", lineHeight: 1.3 }}>
                {aviso.titulo}
              </div>
            </>
          ) : (
            <div style={{ height: "100%", background: `linear-gradient(135deg, ${cfg.bg.replace("15", "30")}, ${cfg.bg})`, display: "flex", alignItems: "center", padding: "0 16px" }}>
              <span style={{ fontSize: "2rem" }}>
                {{ Urgente: "🚨", Importante: "⚠️", Informativo: "ℹ️", Convocatoria: "📢" }[aviso.tipo] ?? "📋"}
              </span>
            </div>
          )}
          {/* Badges */}
          <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
            <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: ".7rem", fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, backdropFilter: "blur(6px)" }}>
              {aviso.tipo}
            </span>
            {aviso.fijado && (
              <span style={{ padding: "3px 8px", borderRadius: 20, fontSize: ".7rem", fontWeight: 700, background: "rgba(232,192,96,.9)", color: "#0D2060", display: "flex", alignItems: "center", gap: 3 }}>
                📌 Fijado
              </span>
            )}
          </div>
        </div>

        {/* Card body */}
        <div style={{ padding: "14px 16px 16px" }}>
          {!fotoUrl && <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: 6, lineHeight: 1.3 }}>{aviso.titulo}</div>}
          <div style={{ fontSize: ".82rem", color: "var(--muted)", marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
            {aviso.contenido}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: ".72rem", padding: "2px 8px", borderRadius: 4, background: "var(--surface-raised)", color: "var(--muted)", fontWeight: 500 }}>
              {aviso.categoria}
            </span>
            <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>{fmtFecha(aviso.createdAt)}</span>
          </div>
        </div>
      </div>
    )
  }

  if (avisos.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--muted)" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Sin avisos por el momento</div>
        <div style={{ fontSize: ".85rem" }}>Cuando haya comunicados aparecerán aquí.</div>
      </div>
    )
  }

  return (
    <>
      {/* Fijados */}
      {fijados.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: ".7rem", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#E8C060" }}>📌 Fijados</span>
            <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {fijados.map(a => <AvisoCard key={a.id} aviso={a} />)}
          </div>
        </div>
      )}

      {/* Normales */}
      {normales.length > 0 && (
        <div>
          {fijados.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: ".7rem", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)" }}>Todos los avisos</span>
              <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {normales.map(a => <AvisoCard key={a.id} aviso={a} />)}
          </div>
        </div>
      )}

      {/* Modal */}
      {selected && <Modal aviso={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

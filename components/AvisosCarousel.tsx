"use client"
import { useState, useEffect, useCallback } from "react"
import type { AvisoItem } from "./AvisosGrid"

const TIPO_CONFIG: Record<string, { color: string; accent: string }> = {
  Urgente:      { color: "#ef4444", accent: "#fca5a5" },
  Importante:   { color: "#f59e0b", accent: "#fcd34d" },
  Informativo:  { color: "#3b82f6", accent: "#93c5fd" },
  Convocatoria: { color: "#10b981", accent: "#6ee7b7" },
}
const tipoOf = (t: string) => TIPO_CONFIG[t] ?? { color: "#E8C060", accent: "#fde68a" }

function parseFotoUrl(raw: string | null): string | null {
  if (!raw) return null
  try { return (JSON.parse(raw) as { url: string }).url } catch { return raw }
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
}

const BG_GRADIENTS = [
  "linear-gradient(135deg, #0D2060 0%, #1a3a8a 50%, #0d3060 100%)",
  "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)",
  "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0d4b3a 100%)",
  "linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #7c2d12 100%)",
  "linear-gradient(135deg, #1e3a5f 0%, #0D2060 50%, #0a1a40 100%)",
]

export default function AvisosCarousel({ avisos, titulo = "Avisos del Colegio" }: { avisos: AvisoItem[]; titulo?: string }) {
  const [current, setCurrent] = useState(0)
  const [paused,  setPaused]  = useState(false)
  const [animDir, setAnimDir] = useState<"left" | "right">("right")

  const total = avisos.length

  const goTo = useCallback((idx: number, dir: "left" | "right" = "right") => {
    setAnimDir(dir)
    setCurrent((idx + total) % total)
  }, [total])

  const next = useCallback(() => goTo(current + 1, "right"), [current, goTo])
  const prev = useCallback(() => goTo(current - 1, "left"),  [current, goTo])

  useEffect(() => {
    if (paused || total <= 1) return
    const id = setInterval(next, 4500)
    return () => clearInterval(id)
  }, [paused, next, total])

  if (total === 0) return null

  const aviso   = avisos[current]
  const fotoUrl = parseFotoUrl(aviso.imagen)
  const cfg     = tipoOf(aviso.tipo)
  const bgColor = BG_GRADIENTS[current % BG_GRADIENTS.length]

  return (
    <div
      style={{ marginTop: 0 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Section title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{titulo}</h2>
        <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
        <span style={{ fontSize: ".8rem", color: "var(--muted)" }}>{current + 1} / {total}</span>
      </div>

      {/* Slide */}
      <div style={{
        position: "relative", borderRadius: 14, overflow: "hidden",
        height: 220, cursor: "pointer",
        boxShadow: "0 8px 32px rgba(13,32,96,.22)",
      }}>
        {/* Background: image or gradient */}
        {fotoUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={aviso.id}
              src={fotoUrl}
              alt={aviso.titulo}
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "cover",
                animation: `slideIn${animDir === "right" ? "R" : "L"} .4s ease`,
              }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,.75) 0%, rgba(0,0,0,.35) 60%, transparent 100%)" }} />
          </>
        ) : (
          <div
            key={aviso.id}
            style={{
              position: "absolute", inset: 0, background: bgColor,
              animation: `slideIn${animDir === "right" ? "R" : "L"} .4s ease`,
            }}
          >
            {/* Decorative grid */}
            <div style={{ position: "absolute", inset: 0, opacity: .06, backgroundImage: "repeating-linear-gradient(0deg, #fff 0px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #fff 0px, transparent 1px, transparent 40px)" }} />
            {/* Big icon */}
            <div style={{ position: "absolute", right: 32, top: "50%", transform: "translateY(-50%)", fontSize: 100, opacity: .15, userSelect: "none" }}>
              {{ Urgente: "🚨", Importante: "⚠️", Informativo: "ℹ️", Convocatoria: "📢" }[aviso.tipo] ?? "📋"}
            </div>
          </div>
        )}

        {/* Content overlay */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "24px 32px", maxWidth: "75%" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <span style={{
              padding: "4px 12px", borderRadius: 20, fontSize: ".72rem", fontWeight: 800,
              letterSpacing: ".06em", textTransform: "uppercase",
              background: `${cfg.color}25`, color: cfg.accent,
              border: `1px solid ${cfg.color}40`, backdropFilter: "blur(4px)",
            }}>
              {aviso.tipo}
            </span>
            <span style={{
              padding: "4px 12px", borderRadius: 20, fontSize: ".72rem", fontWeight: 600,
              background: "rgba(255,255,255,.12)", color: "rgba(255,255,255,.8)", backdropFilter: "blur(4px)",
            }}>
              {aviso.categoria}
            </span>
            {aviso.fijado && (
              <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: ".72rem", fontWeight: 700, background: "rgba(232,192,96,.85)", color: "#0D2060" }}>
                📌 Fijado
              </span>
            )}
          </div>

          <h3 style={{ margin: "0 0 8px", fontSize: "1.3rem", fontWeight: 800, color: "#fff", lineHeight: 1.3, textShadow: "0 2px 8px rgba(0,0,0,.4)" }}>
            {aviso.titulo}
          </h3>

          <p style={{ margin: "0 0 12px", fontSize: ".85rem", color: "rgba(255,255,255,.75)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
            {aviso.contenido}
          </p>

          <span style={{ fontSize: ".75rem", color: "rgba(255,255,255,.55)" }}>{fmtFecha(aviso.createdAt)}</span>
        </div>

        {/* Prev / Next arrows */}
        {total > 1 && (
          <>
            <button onClick={prev} style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(255,255,255,.25)",
              background: "rgba(0,0,0,.35)", backdropFilter: "blur(6px)",
              color: "#fff", cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background .15s",
            }}>‹</button>
            <button onClick={next} style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(255,255,255,.25)",
              background: "rgba(0,0,0,.35)", backdropFilter: "blur(6px)",
              color: "#fff", cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background .15s",
            }}>›</button>
          </>
        )}

        {/* Progress bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,.12)" }}>
          <div
            key={`${current}-${paused}`}
            style={{
              height: "100%", background: cfg.accent,
              transition: paused ? "none" : "width 4.5s linear",
              width: paused ? "0%" : "100%",
            }}
          />
        </div>
      </div>

      {/* Dots */}
      {total > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 7, marginTop: 12 }}>
          {avisos.map((_, i) => (
            <button key={i} onClick={() => goTo(i, i > current ? "right" : "left")} style={{
              width: i === current ? 22 : 7, height: 7,
              borderRadius: 4, border: "none", cursor: "pointer", padding: 0,
              background: i === current ? "#0D2060" : "var(--line)",
              transition: "width .3s ease, background .2s",
            }} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideInR { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInL { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  )
}

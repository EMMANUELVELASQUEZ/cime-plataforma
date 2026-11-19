"use client"

import { useState } from "react"
import { FileText } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────
export type SolicitudResumen = {
  id: string
  estado: string
  createdAt: string
}

export type PlanConSolicitud = {
  id: string
  nombre: string
  descripcion: string | null
  monto: number
  iva: boolean
  tipo: string
  activo: boolean
  createdAt: string
  solicitudes: SolicitudResumen[]
}

interface Props {
  planes: PlanConSolicitud[]
  userId: string
  userName: string
}

const WA_NUMBER = "522292654241"

function buildWaUrl(planNombre: string, userName: string) {
  const text = encodeURIComponent(
    `Hola, soy ${userName} y estoy interesado/a en el plan "${planNombre}" publicado en la plataforma del CIME Veracruz. ¿Me podría orientar sobre el proceso de inscripción? Gracias.`
  )
  return `https://wa.me/${WA_NUMBER}?text=${text}`
}

// ─── WhatsApp Icon SVG ────────────────────────────────────────────
function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────
const money = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n)

// ─── Toast system ─────────────────────────────────────────────────
type Toast = { id: number; message: string; type: "ok" | "bad" }

let toastId = 0

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  function push(message: string, type: "ok" | "bad" = "ok") {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  return { toasts, push }
}

// ─── Card gradients by tipo ───────────────────────────────────────
const CARD_STYLES: Record<string, { gradient: string; accent: string }> = {
  ANUALIDAD: {
    gradient: "linear-gradient(135deg, #040714 0%, #131847 100%)",
    accent: "#C8B820",
  },
  REFRENDO: {
    gradient: "linear-gradient(135deg, #0A0F1E 0%, #1A1040 60%, #0D2135 100%)",
    accent: "#7C3AED",
  },
  OTRO: {
    gradient: "linear-gradient(135deg, #071428 0%, #0C2340 100%)",
    accent: "#1B4F91",
  },
}

// ─── Estado config ────────────────────────────────────────────────
type EstadoCfg = {
  label: string
  color: string
  bg: string
  btnLabel: string
  disabled: boolean
}

const ESTADO_CFG: Record<string, EstadoCfg> = {
  PENDIENTE: {
    label: "Solicitud enviada",
    color: "#D97706",
    bg: "#FEF3C7",
    btnLabel: "Solicitud enviada · Pendiente",
    disabled: true,
  },
  CONTACTADO: {
    label: "En contacto",
    color: "#2563EB",
    bg: "#DBEAFE",
    btnLabel: "En contacto con la administracion",
    disabled: true,
  },
  ACTIVO: {
    label: "Activo",
    color: "#059669",
    bg: "#D1FAE5",
    btnLabel: "Plan activo",
    disabled: true,
  },
  RECHAZADO: {
    label: "Rechazado",
    color: "#DC2626",
    bg: "#FEE2E2",
    btnLabel: "Rechazado — Reintentar",
    disabled: false,
  },
}

// ─── Main Component ───────────────────────────────────────────────
export default function PlanesView({ planes, userId, userName }: Props) {
  const { toasts, push } = useToast()
  const [solicitudes, setSolicitudes] = useState<Record<string, SolicitudResumen | undefined>>(() => {
    const map: Record<string, SolicitudResumen | undefined> = {}
    for (const p of planes) {
      if (p.solicitudes.length > 0) map[p.id] = p.solicitudes[0]
    }
    return map
  })
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  async function handleSolicitar(planId: string) {
    setLoading(prev => ({ ...prev, [planId]: true }))
    try {
      const res = await fetch(`/api/planes/${planId}/solicitar`, { method: "POST" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        push(data.error ?? "Error al enviar solicitud.", "bad")
        return
      }
      const sol: SolicitudResumen = await res.json()
      setSolicitudes(prev => ({ ...prev, [planId]: sol }))
      push("Solicitud enviada. La administración se pondrá en contacto contigo pronto.", "ok")
    } catch {
      push("Error de conexion. Intenta de nuevo.", "bad")
    } finally {
      setLoading(prev => ({ ...prev, [planId]: false }))
    }
  }

  if (planes.length === 0) {
    return (
      <div style={{
        padding: 60,
        textAlign: "center",
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        color: "var(--muted)",
      }}>
        <FileText size={40} strokeWidth={1.25} style={{ margin: "0 auto 16px", opacity: .3 }} />
        <p style={{ fontSize: ".9rem" }}>No hay planes disponibles en este momento.</p>
        <p style={{ fontSize: ".8rem", marginTop: 6 }}>El colegio publicara los planes activos pronto.</p>
      </div>
    )
  }

  return (
    <>
      {/* Toast container */}
      <div style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: "12px 18px",
            borderRadius: 10,
            fontSize: ".85rem",
            fontWeight: 500,
            color: t.type === "ok" ? "var(--ok)" : "var(--bad)",
            background: t.type === "ok" ? "var(--ok-bg)" : "var(--bad-bg)",
            border: `1px solid ${t.type === "ok" ? "color-mix(in srgb, var(--ok) 30%, var(--line))" : "color-mix(in srgb, var(--bad) 30%, var(--line))"}`,
            boxShadow: "0 8px 24px rgba(0,0,0,.12)",
            maxWidth: 380,
            lineHeight: 1.4,
            pointerEvents: "auto",
            animation: "fadeIn .2s ease",
          }}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Plan cards grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 20,
      }}>
        {planes.map(plan => {
          const sol = solicitudes[plan.id]
          const estadoCfg = sol ? ESTADO_CFG[sol.estado] : null
          const style = CARD_STYLES[plan.tipo] ?? CARD_STYLES.OTRO
          const isLoading = loading[plan.id]

          return (
            <div key={plan.id} style={{
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,.08)",
              boxShadow: "0 8px 32px rgba(0,0,0,.18)",
              display: "flex",
              flexDirection: "column",
            }}>
              {/* Dark header */}
              <div style={{
                background: style.gradient,
                padding: "24px 22px 20px",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Decorative glow */}
                <div style={{
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${style.accent}22 0%, transparent 70%)`,
                  pointerEvents: "none",
                }} />

                {/* Tipo label */}
                <div style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: 20,
                  fontSize: ".68rem",
                  fontWeight: 700,
                  letterSpacing: ".08em",
                  textTransform: "uppercase" as const,
                  color: style.accent,
                  border: `1px solid ${style.accent}44`,
                  marginBottom: 10,
                }}>
                  {plan.tipo}
                </div>

                {/* Nombre */}
                <div className="font-montserrat" style={{
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  color: "#fff",
                  lineHeight: 1.25,
                  marginBottom: 8,
                }}>
                  {plan.nombre}
                </div>

                {/* Monto */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 12 }}>
                  <span className="font-montserrat" style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: "-.03em",
                    lineHeight: 1,
                  }}>
                    {money(plan.monto)}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column" as const }}>
                    <span style={{ fontSize: ".68rem", color: "rgba(255,255,255,.45)", lineHeight: 1.2 }}>MXN</span>
                    {plan.iva && (
                      <span style={{ fontSize: ".68rem", color: "rgba(255,255,255,.45)", lineHeight: 1.2 }}>+ IVA</span>
                    )}
                  </div>
                </div>

                {/* Estado badge if solicited */}
                {estadoCfg && (
                  <div style={{
                    marginTop: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 12px",
                    borderRadius: 20,
                    background: estadoCfg.bg,
                    color: estadoCfg.color,
                    fontSize: ".73rem",
                    fontWeight: 700,
                  }}>
                    <span style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: estadoCfg.color,
                      flexShrink: 0,
                    }} />
                    {estadoCfg.label}
                  </div>
                )}
              </div>

              {/* Light body */}
              <div style={{
                flex: 1,
                background: "var(--surface)",
                borderTop: "1px solid var(--line)",
                padding: "16px 22px 20px",
                display: "flex",
                flexDirection: "column" as const,
                gap: 12,
              }}>
                {plan.descripcion && (
                  <p style={{
                    margin: 0,
                    fontSize: ".82rem",
                    color: "var(--muted)",
                    lineHeight: 1.5,
                  }}>
                    {plan.descripcion}
                  </p>
                )}

                {plan.iva && (
                  <div style={{
                    fontSize: ".76rem",
                    color: "var(--muted)",
                    padding: "6px 10px",
                    background: "var(--surface-2)",
                    borderRadius: 6,
                    border: "1px solid var(--line)",
                  }}>
                    Precio + 16% IVA. Se emite factura electronica.
                  </div>
                )}

                {/* Contact info strip */}
                <div style={{
                  fontSize: ".75rem",
                  color: "var(--muted)",
                  padding: "8px 10px",
                  background: "var(--surface-2)",
                  borderRadius: 6,
                  border: "1px solid var(--line)",
                  lineHeight: 1.5,
                }}>
                  Contáctanos para coordinar tu inscripción a través de la plataforma (Mensajes) o por WhatsApp al <strong>229 265 4241</strong>.
                </div>

                {/* CTA */}
                <div style={{ marginTop: "auto", paddingTop: 4, display: "flex", flexDirection: "column" as const, gap: 8 }}>
                  {!estadoCfg ? (
                    <button
                      onClick={() => handleSolicitar(plan.id)}
                      disabled={isLoading}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        borderRadius: 8,
                        border: "none",
                        background: "#1B4F91",
                        color: "#fff",
                        fontSize: ".88rem",
                        fontWeight: 600,
                        cursor: isLoading ? "not-allowed" : "pointer",
                        opacity: isLoading ? .7 : 1,
                        transition: "opacity .15s",
                        fontFamily: "inherit",
                      }}
                    >
                      {isLoading ? "Enviando..." : "Solicitar información"}
                    </button>
                  ) : (
                    <button
                      onClick={estadoCfg.disabled ? undefined : () => handleSolicitar(plan.id)}
                      disabled={estadoCfg.disabled || isLoading}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        borderRadius: 8,
                        border: `1px solid ${estadoCfg.color}44`,
                        background: estadoCfg.bg,
                        color: estadoCfg.color,
                        fontSize: ".85rem",
                        fontWeight: 600,
                        cursor: estadoCfg.disabled ? "default" : "pointer",
                        opacity: isLoading ? .7 : 1,
                        fontFamily: "inherit",
                      }}
                    >
                      {isLoading ? "Enviando..." : estadoCfg.btnLabel}
                    </button>
                  )}

                  {/* WhatsApp button */}
                  <a
                    href={buildWaUrl(plan.nombre, userName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: "#25D366",
                      color: "#fff",
                      fontSize: ".88rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      textDecoration: "none",
                      boxSizing: "border-box" as const,
                    }}
                  >
                    <WhatsAppIcon size={17} />
                    Contactar por WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

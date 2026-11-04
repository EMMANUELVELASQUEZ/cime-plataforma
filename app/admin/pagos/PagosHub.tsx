"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  CreditCard, ChevronDown, ChevronUp, Plus, Printer,
  Upload, ExternalLink, Trash2, Lock, Unlock,
  FileText, AlertCircle, CheckCircle2, Clock, X,
  Download, FileSpreadsheet, FileType2, Search,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────────
type PagoData = {
  id: string
  concepto: string
  monto: number
  estado: string
  folio: string
  comprobante: string | null
  cursoId: string | null
  createdAt: string
}

type InscripcionData = {
  id: string
  estado: string
  progreso: number
  createdAt: string
  curso: {
    id: string
    codigo: string
    titulo: string
    horas: number
    precio: number
    area: string
    fechaFin: string
    fechaInicio: string
  }
}

type ColegiadoData = {
  id: string
  nombre: string
  correo: string
  numeroColegiado: string | null
  estado: string
  pagos: PagoData[]
  inscripciones: InscripcionData[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const HUES = [211, 142, 262, 24, 199, 327, 38, 172]
const avatarHue = (n: string) => HUES[n.charCodeAt(0) % HUES.length]

function initials(name: string) {
  return name
    .replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function fmt$(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
}

function autoFolio(nombre: string) {
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`
  const rand = Math.floor(Math.random() * 900 + 100)
  const initN = nombre.replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "").split(/\s+/)[0]?.slice(0, 3).toUpperCase() ?? "PAG"
  return `PAG-CIME-${dateStr}-${initN}-${rand}`
}

// ─── Estado chip config ───────────────────────────────────────────────────────
const ESTADO_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  PAGADO:    { label: "Pagado",    color: "#059669", bg: "rgba(5,150,105,.12)",  dot: "#10b981" },
  PENDIENTE: { label: "Pendiente", color: "#d97706", bg: "rgba(217,119,6,.12)",  dot: "#f59e0b" },
  VENCIDO:   { label: "Vencido",  color: "#dc2626", bg: "rgba(220,38,38,.12)",  dot: "#ef4444" },
  CANCELADO: { label: "Cancelado", color: "#6b7280", bg: "rgba(107,114,128,.12)", dot: "#9ca3af" },
}

const COLEGIADO_ESTADO_CFG: Record<string, { label: string; color: string; bg: string }> = {
  VIGENTE:     { label: "Vigente",     color: "#059669", bg: "rgba(5,150,105,.1)"  },
  POR_RENOVAR: { label: "Por renovar", color: "#d97706", bg: "rgba(217,119,6,.1)"  },
  SUSPENDIDO:  { label: "Suspendido",  color: "#dc2626", bg: "rgba(220,38,38,.1)"  },
}

const AREA_CFG: Record<string, { label: string; color: string; bg: string }> = {
  ELE: { label: "ELE", color: "#2563eb", bg: "rgba(37,99,235,.1)"  },
  MEC: { label: "MEC", color: "#7c3aed", bg: "rgba(124,58,237,.1)" },
  SOL: { label: "SOL", color: "#059669", bg: "rgba(5,150,105,.1)"  },
}

const INSCRIPCION_ESTADO_CFG: Record<string, { label: string; color: string; bg: string }> = {
  INSCRITO:   { label: "Inscrito",   color: "#2563eb", bg: "rgba(37,99,235,.1)"  },
  EN_CURSO:   { label: "En curso",   color: "#d97706", bg: "rgba(217,119,6,.1)"  },
  COMPLETADO: { label: "Completado", color: "#059669", bg: "rgba(5,150,105,.1)"  },
  BLOQUEADO:  { label: "Bloqueado",  color: "#dc2626", bg: "rgba(220,38,38,.1)"  },
}

// ─── Export functions ─────────────────────────────────────────────────────────
function exportCSV(data: ColegiadoData[]) {
  const rows: string[][] = [
    ["No. Colegiado", "Nombre", "Folio", "Concepto", "Monto", "Estado", "Fecha", "Comprobante"],
  ]
  data.forEach((c) => {
    if (c.pagos.length === 0) {
      rows.push([c.numeroColegiado ?? "", c.nombre, "", "", "", "SIN PAGOS", "", ""])
    } else {
      c.pagos.forEach((p) => {
        rows.push([
          c.numeroColegiado ?? "",
          c.nombre,
          p.folio,
          p.concepto,
          p.monto.toFixed(2),
          p.estado,
          fmtDate(p.createdAt),
          p.comprobante ?? "",
        ])
      })
    }
  })
  const csv = rows
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `pagos-cime-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportWord(data: ColegiadoData[]) {
  const rows = data.flatMap((c) =>
    c.pagos.length === 0
      ? [{ nc: c.numeroColegiado ?? "", nombre: c.nombre, folio: "", concepto: "", monto: "", estado: "SIN PAGOS", fecha: "" }]
      : c.pagos.map((p) => ({
          nc: c.numeroColegiado ?? "",
          nombre: c.nombre,
          folio: p.folio,
          concepto: p.concepto,
          monto: fmt$(p.monto),
          estado: p.estado,
          fecha: fmtDate(p.createdAt),
        }))
  )
  const tableRows = rows
    .map(
      (r) =>
        `<tr><td>${r.nc}</td><td>${r.nombre}</td><td>${r.folio}</td><td>${r.concepto}</td><td>${r.monto}</td><td>${r.estado}</td><td>${r.fecha}</td></tr>`
    )
    .join("")
  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'><title>Reporte de Pagos CIME</title><style>body{font-family:Calibri,sans-serif}h1{color:#1E3A8A}table{border-collapse:collapse;width:100%}th{background:#1E3A8A;color:white;padding:8px;text-align:left}td{padding:8px;border:1px solid #ddd}tr:nth-child(even){background:#f8f8f8}</style></head><body><h1>Reporte de Pagos · CIME Veracruz</h1><p>Generado: ${new Date().toLocaleDateString("es-MX")}</p><table><thead><tr><th>No. Colegiado</th><th>Nombre</th><th>Folio</th><th>Concepto</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>${tableRows}</tbody></table></body></html>`
  const blob = new Blob([html], { type: "application/msword" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `reporte-pagos-cime-${new Date().toISOString().slice(0, 10)}.doc`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Toast ───────────────────────────────────────────────────────────────────
type Toast = { id: number; msg: string; type: "ok" | "err" }

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            borderRadius: 10,
            background: t.type === "ok" ? "#059669" : "#dc2626",
            color: "white",
            fontSize: ".86rem",
            fontWeight: 500,
            boxShadow: "0 4px 20px rgba(0,0,0,.18)",
            minWidth: 240,
            maxWidth: 380,
          }}
        >
          {t.type === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span style={{ flex: 1 }}>{t.msg}</span>
          <button onClick={() => remove(t.id)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 0 }}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Ticket Modal ─────────────────────────────────────────────────────────────
function TicketModal({
  pago,
  colegiado,
  onClose,
}: {
  pago: PagoData
  colegiado: ColegiadoData
  onClose: () => void
}) {
  const NAV   = "#152D5F"
  const GOLD  = "#C89B2A"

  const estadoMap: Record<string, { label: string; bg: string; color: string; border: string }> = {
    PAGADO:    { label: "PAGADO",    bg: "#ECFDF5", color: "#065F46", border: "#6EE7B7" },
    PENDIENTE: { label: "PENDIENTE", bg: "#FFFBEB", color: "#92400E", border: "#FCD34D" },
    VENCIDO:   { label: "VENCIDO",   bg: "#FEF2F2", color: "#991B1B", border: "#FCA5A5" },
    CANCELADO: { label: "CANCELADO", bg: "#F9FAFB", color: "#6B7280", border: "#D1D5DB" },
  }
  const ec = estadoMap[pago.estado] ?? estadoMap.PENDIENTE

  const issuedDate = new Date(pago.createdAt).toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
  })
  const issuedLong = new Date(pago.createdAt).toLocaleDateString("es-MX", {
    day: "numeric", month: "long", year: "numeric",
  })

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,.7)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
      onClick={onClose}
    >
      <style>{`
        @media print {
          body > *:not(#ticket-print-root) { display: none !important; }
          #ticket-print-root { display: flex !important; position: static !important; padding: 0 !important; background: none !important; }
          #ticket-print-root > div { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; width: 100% !important; }
        }
      `}</style>

      <div
        id="ticket-print-root"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          background: "white", borderRadius: 14, width: "100%", maxWidth: 540,
          overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,.45)",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}>

          {/* ── Header navy ─────────────────────────────────── */}
          <div style={{ background: NAV, padding: "22px 28px 18px", position: "relative", overflow: "hidden" }}>
            {/* Fondo textura sutil */}
            <div style={{
              position: "absolute", inset: 0, opacity: .06,
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }} />
            {/* Franja diagonal decorativa */}
            <div style={{
              position: "absolute", right: -20, top: 0, bottom: 0, width: 140,
              background: "rgba(255,255,255,.04)", transform: "skewX(-10deg)",
            }} />

            {/* Logo + nombre institución */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
              <img
                src="/logo.jpeg" alt="CIME"
                style={{ width: 46, height: 46, borderRadius: 9, objectFit: "cover", border: "2px solid rgba(255,255,255,.18)", flexShrink: 0 }}
              />
              <div>
                <div style={{ color: "white", fontWeight: 800, fontSize: ".92rem", lineHeight: 1.25, letterSpacing: ".01em" }}>
                  COLEGIO DE INGENIEROS MECÁNICOS
                </div>
                <div style={{ color: "white", fontWeight: 800, fontSize: ".92rem", lineHeight: 1.25 }}>
                  Y ELECTRICISTAS DE VERACRUZ A.C.
                </div>
                <div style={{ color: "rgba(255,255,255,.45)", fontSize: ".67rem", marginTop: 4, letterSpacing: ".05em" }}>
                  Xalapa, Veracruz
                </div>
              </div>
            </div>

            {/* Separador */}
            <div style={{ height: 1, background: "rgba(255,255,255,.12)", marginBottom: 14 }} />

            {/* Título documento + folio */}
            <div style={{ position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div>
                <div style={{ color: "rgba(255,255,255,.45)", fontSize: ".58rem", letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 4 }}>
                  Documento oficial
                </div>
                <div style={{ color: "white", fontWeight: 800, fontSize: "1.05rem", letterSpacing: ".07em", textTransform: "uppercase" }}>
                  Recibo de Pago
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "rgba(255,255,255,.4)", fontSize: ".58rem", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 4 }}>
                  Folio
                </div>
                <div style={{ color: GOLD, fontWeight: 800, fontSize: ".95rem", fontFamily: "monospace", letterSpacing: ".06em" }}>
                  {pago.folio}
                </div>
              </div>
            </div>
          </div>

          {/* ── Cuerpo ──────────────────────────────────────── */}
          <div style={{ padding: "0 28px 24px" }}>

            {/* Colegiado / Fecha */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr auto", gap: 20,
              padding: "18px 0 16px", borderBottom: "1px solid #EEF2F7",
            }}>
              <div>
                <div style={{ fontSize: ".58rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".14em", color: "#94A3B8", marginBottom: 10 }}>
                  Datos del colegiado
                </div>
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                  <tbody>
                    {[
                      ["Nombre",        colegiado.nombre],
                      ["No. Colegiado", colegiado.numeroColegiado ? `CIME-VER-${colegiado.numeroColegiado}` : "—"],
                      ["Correo",        colegiado.correo],
                    ].map(([label, val]) => (
                      <tr key={label}>
                        <td style={{ fontSize: ".8rem", color: "#64748B", paddingBottom: 5, paddingRight: 12, verticalAlign: "top", whiteSpace: "nowrap" }}>
                          {label}
                        </td>
                        <td style={{
                          fontSize: ".8rem", fontWeight: label === "Correo" ? 400 : 700,
                          color: "#0F172A", paddingBottom: 5,
                          fontFamily: label === "No. Colegiado" ? "monospace" : undefined,
                        }}>
                          {val}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ textAlign: "right", paddingLeft: 16, borderLeft: "1px solid #EEF2F7" }}>
                <div style={{ fontSize: ".58rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".14em", color: "#94A3B8", marginBottom: 8 }}>
                  Expedido
                </div>
                <div style={{ fontSize: ".9rem", fontWeight: 800, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>
                  {issuedDate}
                </div>
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: ".58rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".14em", color: "#94A3B8", marginBottom: 7 }}>
                    Estado
                  </div>
                  <span style={{
                    display: "inline-block",
                    background: ec.bg, color: ec.color,
                    border: `1px solid ${ec.border}`,
                    borderRadius: 20, padding: "4px 11px",
                    fontSize: ".7rem", fontWeight: 800, letterSpacing: ".04em",
                  }}>
                    {ec.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabla de concepto */}
            <div style={{ marginTop: 18, marginBottom: 16 }}>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 110px",
                background: "#F1F5FB", borderRadius: "6px 6px 0 0",
                padding: "7px 12px",
              }}>
                <span style={{ fontSize: ".62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "#475569" }}>Concepto</span>
                <span style={{ fontSize: ".62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "#475569", textAlign: "right" }}>Importe</span>
              </div>
              <div style={{ border: "1px solid #E2E8F0", borderTop: "none", borderRadius: "0 0 6px 6px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", padding: "14px 12px", alignItems: "start", borderBottom: "1px solid #EEF2F7" }}>
                  <div>
                    <div style={{ fontSize: ".875rem", fontWeight: 600, color: "#0F172A", lineHeight: 1.4 }}>
                      {pago.concepto}
                    </div>
                    <div style={{ fontSize: ".72rem", color: "#94A3B8", marginTop: 5 }}>
                      Registrado el {issuedLong}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700, fontSize: ".9rem", color: "#0F172A" }}>
                    {fmt$(pago.monto)}
                  </div>
                </div>
                {/* Fila subtotal */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", padding: "8px 12px", background: "#F8FAFC" }}>
                  <span style={{ fontSize: ".76rem", color: "#64748B" }}>Subtotal</span>
                  <span style={{ textAlign: "right", fontFamily: "monospace", fontSize: ".76rem", color: "#64748B" }}>{fmt$(pago.monto)}</span>
                </div>
              </div>
            </div>

            {/* Total */}
            <div style={{
              background: NAV, borderRadius: 8, padding: "13px 12px",
              display: "grid", gridTemplateColumns: "1fr 110px",
              alignItems: "center", marginBottom: 24,
            }}>
              <span style={{ color: "rgba(255,255,255,.65)", fontWeight: 700, fontSize: ".78rem", textTransform: "uppercase", letterSpacing: ".1em" }}>
                Total a Pagar
              </span>
              <div style={{ textAlign: "right" }}>
                <span style={{ color: "white", fontWeight: 900, fontSize: "1.1rem", fontFamily: "monospace" }}>
                  {fmt$(pago.monto)}
                </span>
                <span style={{ color: "rgba(255,255,255,.4)", fontSize: ".68rem", marginLeft: 5 }}>MXN</span>
              </div>
            </div>

            {/* Firma + sello */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 16, borderTop: "1px solid #EEF2F7" }}>
              <div>
                <div style={{ width: 190, borderTop: "1px solid #334155", marginBottom: 6 }} />
                <div style={{ fontSize: ".75rem", fontWeight: 700, color: "#334155" }}>Firma autorizada</div>
                <div style={{ fontSize: ".7rem", color: "#94A3B8", marginTop: 2 }}>Administración · CIME Veracruz</div>
              </div>

              {/* Sello SVG circular */}
              <svg width="78" height="78" viewBox="0 0 78 78">
                <circle cx="39" cy="39" r="36" fill="none" stroke={NAV} strokeWidth="2.5"/>
                <circle cx="39" cy="39" r="29" fill="none" stroke={NAV} strokeWidth="1" strokeDasharray="2.5 3"/>
                <defs>
                  <path id="arc-top" d="M 39,39 m -31,0 a 31,31 0 1,1 62,0"/>
                  <path id="arc-bot" d="M 39,39 m -26,0 a 26,26 0 0,0 52,0"/>
                </defs>
                <text fill={NAV} fontSize="7.2" fontWeight="700" fontFamily="system-ui" letterSpacing="1.5">
                  <textPath href="#arc-top" startOffset="13%">CIME VERACRUZ · A.C.</textPath>
                </text>
                <text fill={NAV} fontSize="6.5" fontFamily="system-ui" letterSpacing="1">
                  <textPath href="#arc-bot" startOffset="17%">OFICIAL</textPath>
                </text>
                <text x="39" y="37" textAnchor="middle" fill={NAV} fontSize="11" fontWeight="900" fontFamily="system-ui">CIME</text>
                <text x="39" y="49" textAnchor="middle" fill={NAV} fontSize="6.5" fontFamily="system-ui" letterSpacing="1.2">VERACRUZ</text>
              </svg>
            </div>

            {/* Pie legal */}
            <div style={{
              marginTop: 16, paddingTop: 10, borderTop: "1px solid #EEF2F7",
              textAlign: "center", fontSize: ".64rem", color: "#94A3B8", lineHeight: 1.6,
            }}>
              Este documento es un comprobante oficial emitido por CIME Veracruz A.C.<br/>
              Xalapa, Veracruz · portal.cimeveracruz.mx
            </div>
          </div>

          {/* ── Pie de modal ──────────────────────────────────── */}
          <div style={{
            display: "flex", gap: 10, padding: "14px 28px",
            borderTop: "1px solid #EEF2F7", background: "#F8FAFC", justifyContent: "flex-end",
          }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 20px", borderRadius: 8,
                border: "1px solid #E2E8F0", background: "white",
                cursor: "pointer", fontSize: ".86rem", fontWeight: 600, color: "#374151",
              }}
            >
              Cerrar
            </button>
            <button
              onClick={() => window.print()}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "8px 20px", borderRadius: 8, border: "none",
                background: NAV, color: "white", cursor: "pointer",
                fontSize: ".86rem", fontWeight: 600,
              }}
            >
              <Printer size={15} /> Imprimir PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Comprobante Upload Modal ─────────────────────────────────────────────────
function ComprobanteModal({
  pago,
  onClose,
  onUploaded,
  addToast,
}: {
  pago: PagoData
  onClose: () => void
  onUploaded: (pagoId: string, url: string) => void
  addToast: (msg: string, type: "ok" | "err") => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setErr("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const r1 = await fetch("/api/upload", { method: "POST", body: fd })
      const d1 = await r1.json()
      if (!r1.ok) throw new Error(d1.error ?? "Error al subir archivo")

      const r2 = await fetch(`/api/admin/pagos/${pago.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comprobante: d1.url }),
      })
      const d2 = await r2.json()
      if (!r2.ok) throw new Error(d2.error ?? "Error al guardar comprobante")

      onUploaded(pago.id, d1.url)
      addToast("Comprobante subido correctamente", "ok")
      onClose()
    } catch (e: any) {
      setErr(e.message ?? "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--surface)", borderRadius: 14, width: "100%", maxWidth: 440, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.2)", border: "1px solid var(--line)" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--line)" }}>
          <span style={{ fontWeight: 700, color: "var(--fg)", fontSize: ".9rem" }}>Comprobante de pago</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 12, fontSize: ".84rem", color: "var(--muted)" }}>
            Folio: <strong style={{ color: "var(--fg)", fontFamily: "monospace" }}>{pago.folio}</strong>
          </div>

          {pago.comprobante && (
            <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10 }}>
              <FileText size={16} style={{ color: "var(--brand)", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: ".8rem", fontWeight: 600, color: "var(--fg)" }}>Comprobante actual</div>
                <div style={{ fontSize: ".74rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pago.comprobante}</div>
              </div>
              <a href={pago.comprobante} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand)", flexShrink: 0 }}>
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          <div
            onClick={() => inputRef.current?.click()}
            style={{
              border: "2px dashed var(--line)",
              borderRadius: 10,
              padding: "28px 20px",
              textAlign: "center",
              cursor: "pointer",
              background: file ? "rgba(37,99,235,.04)" : "var(--surface-2)",
              transition: "all .15s",
            }}
          >
            <Upload size={28} style={{ color: file ? "#2563eb" : "var(--muted)", marginBottom: 10 }} />
            <div style={{ fontSize: ".86rem", fontWeight: 600, color: file ? "#2563eb" : "var(--fg)" }}>
              {file ? file.name : "Haz clic para seleccionar archivo"}
            </div>
            <div style={{ fontSize: ".76rem", color: "var(--muted)", marginTop: 4 }}>
              Imagen (JPG, PNG, WEBP) o PDF · máx. 4.5 MB
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) {
                  if (f.size > 4.5 * 1024 * 1024) { setErr("Archivo muy grande (máx 4.5 MB)"); return }
                  setFile(f)
                  setErr("")
                }
              }}
            />
          </div>

          {err && (
            <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "var(--bad-bg)", color: "var(--bad)", fontSize: ".82rem", display: "flex", gap: 7, alignItems: "center" }}>
              <AlertCircle size={14} /> {err}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, padding: "12px 20px", borderTop: "1px solid var(--line)", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface-2)", cursor: "pointer", fontSize: ".86rem", fontWeight: 600, color: "var(--fg)" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              background: !file || loading ? "#93c5fd" : "#1E3A8A",
              color: "white",
              cursor: !file || loading ? "not-allowed" : "pointer",
              fontSize: ".86rem",
              fontWeight: 600,
            }}
          >
            {loading ? "Subiendo..." : <><Upload size={14} /> Subir</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Registrar Pago Modal ─────────────────────────────────────────────────────
function RegistrarPagoModal({
  colegiado,
  onClose,
  onRegistered,
  addToast,
}: {
  colegiado: ColegiadoData
  onClose: () => void
  onRegistered: (pago: PagoData) => void
  addToast: (msg: string, type: "ok" | "err") => void
}) {
  const [concepto, setConcepto] = useState("")
  const [monto, setMonto] = useState("")
  const [estado, setEstado] = useState("PAGADO")
  const [folio, setFolio] = useState(() => autoFolio(colegiado.nombre))
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!concepto.trim() || !monto || !folio.trim()) {
      setErr("Completa todos los campos requeridos")
      return
    }
    setLoading(true)
    setErr("")
    try {
      const r = await fetch(`/api/admin/colegiados/${colegiado.id}/pago`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concepto: concepto.trim(), monto: parseFloat(monto), estado, folio: folio.trim() }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? "Error al registrar pago")
      onRegistered({
        id: d.id,
        concepto: d.concepto,
        monto: d.monto,
        estado: d.estado,
        folio: d.folio,
        comprobante: null,
        cursoId: null,
        createdAt: d.createdAt,
      })
      addToast("Pago registrado correctamente", "ok")
      onClose()
    } catch (e: any) {
      setErr(e.message ?? "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid var(--line)",
    background: "var(--surface-2)",
    fontSize: ".87rem",
    color: "var(--fg)",
    outline: "none",
    boxSizing: "border-box",
  }

  const labelStyle: React.CSSProperties = {
    fontSize: ".78rem",
    fontWeight: 700,
    color: "var(--muted)",
    marginBottom: 5,
    display: "block",
    textTransform: "uppercase",
    letterSpacing: ".06em",
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--surface)", borderRadius: 14, width: "100%", maxWidth: 480, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.2)", border: "1px solid var(--line)" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--line)" }}>
          <div>
            <div style={{ fontWeight: 700, color: "var(--fg)", fontSize: ".9rem" }}>Registrar pago</div>
            <div style={{ fontSize: ".76rem", color: "var(--muted)", marginTop: 2 }}>{colegiado.nombre}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: "20px", display: "grid", gap: 14 }}>
            <div>
              <label style={labelStyle}>Concepto *</label>
              <input
                style={inputStyle}
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej. Cuota anual 2025, Inscripción curso..."
                required
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Monto (MXN) *</label>
                <input
                  style={inputStyle}
                  type="number"
                  step="0.01"
                  min="0"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Estado</label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                >
                  <option value="PAGADO">Pagado</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="VENCIDO">Vencido</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Folio *</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  style={{ ...inputStyle, fontFamily: "monospace", flex: 1 }}
                  value={folio}
                  onChange={(e) => setFolio(e.target.value)}
                  placeholder="PAG-CIME-..."
                  required
                />
                <button
                  type="button"
                  onClick={() => setFolio(autoFolio(colegiado.nombre))}
                  style={{
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--line)",
                    background: "var(--surface-2)",
                    cursor: "pointer",
                    fontSize: ".78rem",
                    color: "var(--muted)",
                    flexShrink: 0,
                  }}
                >
                  Auto
                </button>
              </div>
            </div>
            {err && (
              <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--bad-bg)", color: "var(--bad)", fontSize: ".82rem", display: "flex", gap: 7, alignItems: "center" }}>
                <AlertCircle size={14} /> {err}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, padding: "12px 20px", borderTop: "1px solid var(--line)", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface-2)", cursor: "pointer", fontSize: ".86rem", fontWeight: 600, color: "var(--fg)" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                background: loading ? "#93c5fd" : "#1E3A8A",
                color: "white",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: ".86rem",
                fontWeight: 600,
              }}
            >
              {loading ? "Registrando..." : <><Plus size={14} /> Registrar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Colegiado Row ────────────────────────────────────────────────────────────
function ColegiadoRow({
  col,
  onUpdatePago,
  onDeletePago,
  onUploadComprobante,
  onNewPago,
  onShowTicket,
  addToast,
  router,
}: {
  col: ColegiadoData
  onUpdatePago: (pagoId: string, patch: Partial<PagoData>) => void
  onDeletePago: (pagoId: string) => void
  onUploadComprobante: (pagoId: string, url: string) => void
  onNewPago: (pago: PagoData) => void
  onShowTicket: (pago: PagoData, col: ColegiadoData) => void
  addToast: (msg: string, type: "ok" | "err") => void
  router: ReturnType<typeof useRouter>
}) {
  const [expanded, setExpanded] = useState(false)
  const [comprobanteTarget, setComprobanteTarget] = useState<PagoData | null>(null)
  const [showRegistrar, setShowRegistrar] = useState(false)
  const [inscripciones, setInscripciones] = useState<InscripcionData[]>(col.inscripciones)
  const [pagos, setPagos] = useState<PagoData[]>(col.pagos)

  const totalPagado = pagos.filter((p) => p.estado === "PAGADO").reduce((s, p) => s + p.monto, 0)
  const totalPendiente = pagos.filter((p) => p.estado === "PENDIENTE").reduce((s, p) => s + p.monto, 0)
  const hue = avatarHue(col.nombre)

  const estadoCol = COLEGIADO_ESTADO_CFG[col.estado] ?? COLEGIADO_ESTADO_CFG.VIGENTE
  const cursosActivos = inscripciones.filter((i) => i.estado !== "BLOQUEADO" && i.estado !== "COMPLETADO").length

  async function changeEstadoPago(pago: PagoData, nuevoEstado: string) {
    try {
      const r = await fetch(`/api/admin/pagos/${pago.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? "Error")
      setPagos((prev) => prev.map((p) => (p.id === pago.id ? { ...p, estado: nuevoEstado } : p)))
      onUpdatePago(pago.id, { estado: nuevoEstado })
      addToast(`Estado actualizado: ${nuevoEstado}`, "ok")
    } catch (e: any) {
      addToast(e.message ?? "Error al actualizar estado", "err")
    }
  }

  async function deletePago(pago: PagoData) {
    if (!confirm(`¿Eliminar el pago con folio ${pago.folio}? Esta acción no se puede deshacer.`)) return
    try {
      const r = await fetch(`/api/admin/pagos/${pago.id}`, { method: "DELETE" })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? "Error")
      setPagos((prev) => prev.filter((p) => p.id !== pago.id))
      onDeletePago(pago.id)
      addToast("Pago eliminado", "ok")
    } catch (e: any) {
      addToast(e.message ?? "Error al eliminar pago", "err")
    }
  }

  async function toggleBloqueoInscripcion(ins: InscripcionData) {
    const bloqueado = ins.estado === "BLOQUEADO"
    const nuevoEstado = bloqueado ? (ins.progreso > 0 ? "EN_CURSO" : "INSCRITO") : "BLOQUEADO"
    try {
      const r = await fetch(`/api/admin/inscripciones/${ins.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? "Error")
      setInscripciones((prev) => prev.map((i) => (i.id === ins.id ? { ...i, estado: nuevoEstado } : i)))
      addToast(bloqueado ? "Curso desbloqueado" : "Curso bloqueado", "ok")
      router.refresh()
    } catch (e: any) {
      addToast(e.message ?? "Error al cambiar estado", "err")
    }
  }

  function handleComprobanteUploaded(pagoId: string, url: string) {
    setPagos((prev) => prev.map((p) => (p.id === pagoId ? { ...p, comprobante: url } : p)))
    onUploadComprobante(pagoId, url)
  }

  function handleNewPago(pago: PagoData) {
    setPagos((prev) => [pago, ...prev])
    onNewPago(pago)
  }

  return (
    <>
      {comprobanteTarget && (
        <ComprobanteModal
          pago={comprobanteTarget}
          onClose={() => setComprobanteTarget(null)}
          onUploaded={handleComprobanteUploaded}
          addToast={addToast}
        />
      )}
      {showRegistrar && (
        <RegistrarPagoModal
          colegiado={col}
          onClose={() => setShowRegistrar(false)}
          onRegistered={handleNewPago}
          addToast={addToast}
        />
      )}

      {/* Summary row */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: expanded ? "12px 12px 0 0" : 12,
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          transition: "border-radius .15s",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: `hsl(${hue} 45% 32%)`,
            display: "grid",
            placeItems: "center",
            color: "white",
            fontWeight: 700,
            fontSize: ".82rem",
            flexShrink: 0,
          }}
        >
          {initials(col.nombre)}
        </div>

        {/* Identity */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: ".9rem", color: "var(--fg)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {col.nombre}
          </div>
          <div style={{ fontSize: ".76rem", color: "var(--muted)", marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "monospace" }}>{col.numeroColegiado ? `CIME-VER-${col.numeroColegiado}` : "Sin número"}</span>
            <span>·</span>
            <span>{col.correo}</span>
          </div>
        </div>

        {/* Estado chip */}
        <span
          style={{
            padding: "3px 10px",
            borderRadius: 20,
            background: estadoCol.bg,
            color: estadoCol.color,
            fontSize: ".76rem",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {estadoCol.label}
        </span>

        {/* Stats */}
        <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: ".7rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>Cursos</div>
            <div style={{ fontWeight: 700, fontSize: ".92rem", color: "var(--fg)", fontFamily: "monospace" }}>{cursosActivos}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: ".7rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>Pagado</div>
            <div style={{ fontWeight: 700, fontSize: ".92rem", color: "#059669", fontFamily: "monospace" }}>{fmt$(totalPagado)}</div>
          </div>
          {totalPendiente > 0 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: ".7rem", color: "#d97706", textTransform: "uppercase", letterSpacing: ".07em" }}>Pendiente</div>
              <div style={{ fontWeight: 700, fontSize: ".92rem", color: "#d97706", fontFamily: "monospace" }}>{fmt$(totalPendiente)}</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 7, flexShrink: 0, alignItems: "center" }}>
          <button
            onClick={() => setShowRegistrar(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 12px",
              borderRadius: 8,
              border: "none",
              background: "#1E3A8A",
              color: "white",
              cursor: "pointer",
              fontSize: ".8rem",
              fontWeight: 600,
            }}
          >
            <Plus size={13} /> Registrar pago
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 12px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "var(--surface-2)",
              color: "var(--fg)",
              cursor: "pointer",
              fontSize: ".8rem",
              fontWeight: 600,
            }}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? "Ocultar" : "Ver detalle"}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--line)",
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
            padding: "0 0 16px",
          }}
        >
          {/* ── Historial de pagos ── */}
          <div style={{ padding: "16px 20px 8px" }}>
            <div style={{ fontSize: ".76rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <CreditCard size={14} style={{ color: "var(--brand)" }} />
              Historial de pagos
              <span style={{ marginLeft: "auto", padding: "2px 8px", borderRadius: 20, background: "var(--surface)", border: "1px solid var(--line)", fontSize: ".7rem", color: "var(--muted)", fontWeight: 600 }}>
                {pagos.length} registro{pagos.length !== 1 ? "s" : ""}
              </span>
            </div>

            {pagos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 0", color: "var(--muted)", fontSize: ".86rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <CreditCard size={28} strokeWidth={1.25} style={{ opacity: .4 }} />
                <span>Sin historial de pagos</span>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".83rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--line)" }}>
                      {["Folio", "Concepto", "Monto", "Estado", "Fecha", "Comprobante", "Acciones"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "7px 10px", fontSize: ".71rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.map((pago) => {
                      const ec = ESTADO_CFG[pago.estado] ?? ESTADO_CFG.PENDIENTE
                      return (
                        <tr key={pago.id} style={{ borderBottom: "1px solid var(--line)" }}>
                          <td style={{ padding: "9px 10px", fontFamily: "monospace", fontSize: ".8rem", fontWeight: 600, color: "var(--fg)", whiteSpace: "nowrap" }}>
                            {pago.folio}
                          </td>
                          <td style={{ padding: "9px 10px", color: "var(--fg)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {pago.concepto}
                          </td>
                          <td style={{ padding: "9px 10px", fontFamily: "monospace", fontWeight: 700, color: "var(--fg)", whiteSpace: "nowrap" }}>
                            {fmt$(pago.monto)}
                          </td>
                          <td style={{ padding: "9px 10px", whiteSpace: "nowrap" }}>
                            <span style={{ padding: "3px 9px", borderRadius: 20, background: ec.bg, color: ec.color, fontSize: ".75rem", fontWeight: 700 }}>
                              {ec.label}
                            </span>
                          </td>
                          <td style={{ padding: "9px 10px", color: "var(--muted)", whiteSpace: "nowrap", fontSize: ".8rem" }}>
                            {fmtDate(pago.createdAt)}
                          </td>
                          <td style={{ padding: "9px 10px" }}>
                            {pago.comprobante ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <a
                                  href={pago.comprobante}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: ".78rem", color: "#2563eb", fontWeight: 600 }}
                                >
                                  <ExternalLink size={12} /> Ver
                                </a>
                                <button
                                  onClick={() => setComprobanteTarget(pago)}
                                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: ".76rem", padding: 0 }}
                                >
                                  Cambiar
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setComprobanteTarget(pago)}
                                style={{ display: "flex", alignItems: "center", gap: 4, fontSize: ".78rem", color: "var(--muted)", cursor: "pointer", background: "none", border: "1px dashed var(--line)", borderRadius: 6, padding: "3px 8px" }}
                              >
                                <Upload size={11} /> Subir
                              </button>
                            )}
                          </td>
                          <td style={{ padding: "9px 10px" }}>
                            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                              <button
                                title="Ver ticket"
                                onClick={() => onShowTicket(pago, col)}
                                style={{ background: "none", border: "1px solid var(--line)", borderRadius: 6, cursor: "pointer", padding: "4px 7px", color: "var(--muted)" }}
                              >
                                <Printer size={13} />
                              </button>
                              <select
                                value={pago.estado}
                                onChange={(e) => changeEstadoPago(pago, e.target.value)}
                                style={{
                                  padding: "4px 7px",
                                  borderRadius: 6,
                                  border: "1px solid var(--line)",
                                  background: "var(--surface)",
                                  color: "var(--fg)",
                                  fontSize: ".78rem",
                                  cursor: "pointer",
                                }}
                              >
                                <option value="PAGADO">Pagado</option>
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="VENCIDO">Vencido</option>
                                <option value="CANCELADO">Cancelado</option>
                              </select>
                              <button
                                title="Eliminar pago"
                                onClick={() => deletePago(pago)}
                                style={{ background: "none", border: "1px solid var(--line)", borderRadius: 6, cursor: "pointer", padding: "4px 7px", color: "var(--bad)" }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Cursos inscritos ── */}
          {inscripciones.length > 0 && (
            <div style={{ padding: "12px 20px 0" }}>
              <div style={{ height: 1, background: "var(--line)", marginBottom: 14 }} />
              <div style={{ fontSize: ".76rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <FileText size={14} style={{ color: "var(--brand)" }} />
                Cursos inscritos
                <span style={{ marginLeft: "auto", padding: "2px 8px", borderRadius: 20, background: "var(--surface)", border: "1px solid var(--line)", fontSize: ".7rem", color: "var(--muted)", fontWeight: 600 }}>
                  {inscripciones.length} curso{inscripciones.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {inscripciones.map((ins) => {
                  const areaCfg = AREA_CFG[ins.curso.area] ?? AREA_CFG.ELE
                  const insCfg = INSCRIPCION_ESTADO_CFG[ins.estado] ?? INSCRIPCION_ESTADO_CFG.INSCRITO
                  const bloqueado = ins.estado === "BLOQUEADO"
                  return (
                    <div
                      key={ins.id}
                      style={{
                        background: "var(--surface)",
                        border: `1px solid ${bloqueado ? "rgba(220,38,38,.3)" : "var(--line)"}`,
                        borderRadius: 10,
                        padding: "12px 16px",
                        display: "flex",
                        gap: 14,
                        alignItems: "center",
                        opacity: bloqueado ? .85 : 1,
                      }}
                    >
                      {/* Code + area */}
                      <div style={{ flexShrink: 0 }}>
                        <div style={{ fontFamily: "monospace", fontSize: ".78rem", fontWeight: 700, color: "var(--fg)" }}>{ins.curso.codigo}</div>
                        <span style={{ padding: "2px 7px", borderRadius: 20, background: areaCfg.bg, color: areaCfg.color, fontSize: ".68rem", fontWeight: 700 }}>
                          {areaCfg.label}
                        </span>
                      </div>

                      {/* Title */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: ".85rem", color: "var(--fg)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {ins.curso.titulo}
                        </div>
                        <div style={{ fontSize: ".74rem", color: "var(--muted)", marginTop: 2 }}>
                          {ins.curso.horas}h · {fmtDate(ins.curso.fechaInicio)} – {fmtDate(ins.curso.fechaFin)}
                        </div>
                      </div>

                      {/* Estado */}
                      <span style={{ padding: "3px 9px", borderRadius: 20, background: insCfg.bg, color: insCfg.color, fontSize: ".75rem", fontWeight: 700, flexShrink: 0 }}>
                        {insCfg.label}
                      </span>

                      {/* Progress bar */}
                      <div style={{ width: 80, flexShrink: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: ".68rem", color: "var(--muted)" }}>Progreso</span>
                          <span style={{ fontSize: ".68rem", fontFamily: "monospace", fontWeight: 700, color: "var(--fg)" }}>{ins.progreso}%</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 10, background: "var(--line)", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${ins.progreso}%`,
                              background: bloqueado ? "#ef4444" : areaCfg.color,
                              borderRadius: 10,
                              transition: "width .4s",
                            }}
                          />
                        </div>
                      </div>

                      {/* Block/Unblock */}
                      <button
                        onClick={() => toggleBloqueoInscripcion(ins)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "6px 12px",
                          borderRadius: 8,
                          border: `1px solid ${bloqueado ? "rgba(5,150,105,.4)" : "rgba(220,38,38,.4)"}`,
                          background: bloqueado ? "rgba(5,150,105,.08)" : "rgba(220,38,38,.08)",
                          color: bloqueado ? "#059669" : "#dc2626",
                          cursor: "pointer",
                          fontSize: ".78rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {bloqueado ? <Unlock size={12} /> : <Lock size={12} />}
                        {bloqueado ? "Desbloquear" : "Bloquear"}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PagosHub({ data }: { data: ColegiadoData[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"todos" | "al_corriente" | "con_atraso" | "sin_historial">("todos")
  const [ticketTarget, setTicketTarget] = useState<{ pago: PagoData; col: ColegiadoData } | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastCounter = useRef(0)

  function addToast(msg: string, type: "ok" | "err") {
    const id = ++toastCounter.current
    setToasts((prev) => [...prev, { id, msg, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }

  function removeToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // KPIs
  const totalRecaudado = data.reduce(
    (sum, c) => sum + c.pagos.filter((p) => p.estado === "PAGADO").reduce((s, p) => s + p.monto, 0),
    0
  )
  const alCorriente = data.filter(
    (c) => c.pagos.length > 0 && !c.pagos.some((p) => p.estado === "PENDIENTE" || p.estado === "VENCIDO")
  ).length
  const conAtraso = data.filter((c) => c.pagos.some((p) => p.estado === "PENDIENTE")).length
  const cursosBloqueados = data.reduce(
    (sum, c) => sum + c.inscripciones.filter((i) => i.estado === "BLOQUEADO").length,
    0
  )

  // Filter
  const filtered = data.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      c.nombre.toLowerCase().includes(q) ||
      (c.numeroColegiado ?? "").toLowerCase().includes(q) ||
      c.correo.toLowerCase().includes(q)

    const matchTab =
      tab === "todos" ||
      (tab === "al_corriente" && c.pagos.length > 0 && !c.pagos.some((p) => p.estado === "PENDIENTE" || p.estado === "VENCIDO")) ||
      (tab === "con_atraso" && c.pagos.some((p) => p.estado === "PENDIENTE")) ||
      (tab === "sin_historial" && c.pagos.length === 0)

    return matchSearch && matchTab
  })

  const tabCounts = {
    todos: data.length,
    al_corriente: data.filter((c) => c.pagos.length > 0 && !c.pagos.some((p) => p.estado === "PENDIENTE" || p.estado === "VENCIDO")).length,
    con_atraso: data.filter((c) => c.pagos.some((p) => p.estado === "PENDIENTE")).length,
    sin_historial: data.filter((c) => c.pagos.length === 0).length,
  }

  const kpis = [
    {
      label: "Total Recaudado",
      val: fmt$(totalRecaudado),
      icon: <CreditCard size={18} strokeWidth={1.75} />,
      color: "#059669",
      bg: "rgba(5,150,105,.1)",
      sub: "pagos confirmados",
    },
    {
      label: "Al Corriente",
      val: alCorriente,
      icon: <CheckCircle2 size={18} strokeWidth={1.75} />,
      color: "#2563eb",
      bg: "rgba(37,99,235,.1)",
      sub: "colegiados",
    },
    {
      label: "Con Atraso",
      val: conAtraso,
      icon: <Clock size={18} strokeWidth={1.75} />,
      color: "#d97706",
      bg: "rgba(217,119,6,.1)",
      sub: "colegiados",
    },
    {
      label: "Cursos Bloqueados",
      val: cursosBloqueados,
      icon: <Lock size={18} strokeWidth={1.75} />,
      color: "#dc2626",
      bg: "rgba(220,38,38,.1)",
      sub: "inscripciones",
    },
  ]

  const TABS: { key: typeof tab; label: string }[] = [
    { key: "todos",          label: "Todos"         },
    { key: "al_corriente",   label: "Al corriente"  },
    { key: "con_atraso",     label: "Con atraso"    },
    { key: "sin_historial",  label: "Sin historial" },
  ]

  return (
    <>
      <ToastContainer toasts={toasts} remove={removeToast} />

      {ticketTarget && (
        <TicketModal
          pago={ticketTarget.pago}
          colegiado={ticketTarget.col}
          onClose={() => setTicketTarget(null)}
        />
      )}

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="page-head">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(27,79,145,.12)", display: "grid", placeItems: "center", color: "var(--brand)" }}>
              <CreditCard size={19} strokeWidth={1.75} />
            </span>
            Gestión de Pagos
          </h1>
          <p>Historial, comprobantes y estado de pagos de los colegiados</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => exportCSV(data)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "var(--surface)",
              color: "var(--fg)",
              cursor: "pointer",
              fontSize: ".83rem",
              fontWeight: 600,
            }}
          >
            <FileSpreadsheet size={15} style={{ color: "#059669" }} /> Excel / CSV
          </button>
          <button
            onClick={() => exportWord(data)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "var(--surface)",
              color: "var(--fg)",
              cursor: "pointer",
              fontSize: ".83rem",
              fontWeight: 600,
            }}
          >
            <FileType2 size={15} style={{ color: "#2563eb" }} /> Word
          </button>
          <button
            onClick={() => window.print()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: "#1E3A8A",
              color: "white",
              cursor: "pointer",
              fontSize: ".83rem",
              fontWeight: 600,
            }}
          >
            <Download size={15} /> PDF
          </button>
        </div>
      </div>

      {/* ── KPI strip ───────────────────────────────────────── */}
      <div className="grid g-4">
        {kpis.map((k) => (
          <div key={k.label} className="card stat">
            <div className="ico-wrap" style={{ background: k.bg, color: k.color }}>{k.icon}</div>
            <div className="eyebrow">{k.label}</div>
            <b style={{ fontFamily: typeof k.val === "string" ? "monospace" : undefined }}>{k.val}</b>
            <small>{k.sub}</small>
          </div>
        ))}
      </div>

      {/* ── Filter bar ──────────────────────────────────────── */}
      <div className="card" style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1", minWidth: 220 }}>
            <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Buscar por nombre, número, correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                background: "var(--surface-2)",
                fontSize: ".86rem",
                color: "var(--fg)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "var(--surface-2)", borderRadius: 10, padding: 4, border: "1px solid var(--line)" }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 7,
                  border: "none",
                  background: tab === t.key ? "var(--surface)" : "transparent",
                  color: tab === t.key ? "var(--fg)" : "var(--muted)",
                  fontWeight: tab === t.key ? 700 : 500,
                  fontSize: ".82rem",
                  cursor: "pointer",
                  boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                  transition: "all .15s",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {t.label}
                <span
                  style={{
                    padding: "1px 6px",
                    borderRadius: 20,
                    background: tab === t.key ? "var(--brand)" : "var(--line)",
                    color: tab === t.key ? "white" : "var(--muted)",
                    fontSize: ".68rem",
                    fontWeight: 700,
                    minWidth: 18,
                    textAlign: "center",
                  }}
                >
                  {tabCounts[t.key]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Colegiado rows ──────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "48px 20px", color: "var(--muted)" }}>
            <CreditCard size={36} strokeWidth={1.25} style={{ marginBottom: 12, opacity: .4 }} />
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Sin resultados</div>
            <div style={{ fontSize: ".84rem" }}>Intenta ajustar los filtros de búsqueda</div>
          </div>
        ) : (
          filtered.map((col) => (
            <ColegiadoRow
              key={col.id}
              col={col}
              onUpdatePago={() => {}}
              onDeletePago={() => {}}
              onUploadComprobante={() => {}}
              onNewPago={() => {}}
              onShowTicket={(pago, c) => setTicketTarget({ pago, col: c })}
              addToast={addToast}
              router={router}
            />
          ))
        )}
      </div>
    </>
  )
}

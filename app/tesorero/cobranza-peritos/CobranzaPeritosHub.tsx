"use client"

import { useState } from "react"
import * as XLSX from "xlsx"

// ─── Types ───────────────────────────────────────────────────────────────────

interface PagoCursoPerito {
  id: string
  usuarioId: string
  anio: number
  mes: number | null
  concepto: string
  monto: number
  pagado: number
  saldo: number
  estado: string
  notas: string | null
  orden: number
  createdAt: string | Date
  updatedAt: string | Date
}

interface PeritoData {
  usuarioId: string
  nombre: string
  numeroPerito: string | null
  especialidad: string | null
  estado: string
  pagos: PagoCursoPerito[]
  cuota2025: number
  cuota2026: number
  total: number
  pagado: number
  saldo: number
}

interface Props {
  initialData: PeritoData[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  "PAGÓ":      { label: "PAGÓ",      color: "var(--ok)", bg: "var(--ok-bg)", border: "var(--ok-ring)" },
  "NO PAGÓ":   { label: "NO PAGÓ",   color: "var(--bad)", bg: "var(--bad-bg)", border: "var(--bad-ring)" },
  "PARCIAL":   { label: "PARCIAL",   color: "var(--warn)", bg: "var(--warn-bg)", border: "var(--warn-ring)" },
  "EXENTO":    { label: "EXENTO",    color: "var(--muted)", bg: "var(--surface-2)", border: "var(--line)" },
  "PENDIENTE": { label: "PENDIENTE", color: "var(--brand)", bg: "var(--info-bg)", border: "var(--info-ring)" },
}

const MESES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function fmt(n: number) {
  return `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
}

function getStatusChip(saldo: number, pagos: PagoCursoPerito[]) {
  if (pagos.length === 0) return { label: "SIN REGISTROS", color: "var(--muted)", bg: "var(--surface-2)" }
  if (saldo <= 0) return { label: "AL DÍA", color: "var(--ok)", bg: "var(--ok-bg)" }
  if (saldo < (pagos.reduce((s, p) => s + p.monto, 0) * 0.5)) return { label: "PENDIENTE", color: "var(--warn)", bg: "var(--warn-bg)" }
  return { label: "CON DEUDA", color: "var(--bad)", bg: "var(--bad-bg)" }
}

function getInitials(name: string) {
  return name
    .replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "")
    .split(/\s+/).slice(0, 2).map((w: string) => w[0] ?? "").join("").toUpperCase()
}

const AVATAR_COLORS = ["var(--navy)", "#13306F", "#1549B8", "#1B3C7A", "#102A6B", "#1A4290"]
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

// ─── Empty Row Form ───────────────────────────────────────────────────────────

interface AddRowFormProps {
  peritoId: string
  onAdded: (pago: PagoCursoPerito) => void
}

function AddRowForm({ peritoId, onAdded }: AddRowFormProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    anio: new Date().getFullYear(),
    mes: "",
    concepto: "",
    monto: "",
    pagado: "",
    estado: "PENDIENTE",
    notas: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.concepto.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/peritos/${peritoId}/pagos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anio: Number(form.anio),
          mes: form.mes ? Number(form.mes) : null,
          concepto: form.concepto.trim(),
          monto: parseFloat(form.monto) || 0,
          pagado: parseFloat(form.pagado) || 0,
          estado: form.estado,
          notas: form.notas || null,
        }),
      })
      if (res.ok) {
        const pago = await res.json()
        onAdded(pago)
        setForm({ anio: new Date().getFullYear(), mes: "", concepto: "", monto: "", pagado: "", estado: "PENDIENTE", notas: "" })
        setOpen(false)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 14px",
          marginTop: 8,
          background: "none",
          border: "1px dashed var(--line-2)",
          borderRadius: 6,
          color: "var(--ink)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all .15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--navy)"; e.currentTarget.style.background = "var(--surface-3)" }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.background = "none" }}
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Agregar concepto
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{
      marginTop: 8,
      padding: "14px 16px",
      background: "var(--surface-2)",
      border: "1px solid var(--info-ring)",
      borderRadius: 8,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>
        Nuevo concepto
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "80px 100px 1fr 110px 110px 130px", gap: 8, marginBottom: 8 }}>
        <div>
          <label style={labelStyle}>Año</label>
          <input type="number" value={form.anio} onChange={e => setForm(f => ({ ...f, anio: Number(e.target.value) }))}
            style={inputStyle} min={2020} max={2030} required />
        </div>
        <div>
          <label style={labelStyle}>Mes</label>
          <select value={form.mes} onChange={e => setForm(f => ({ ...f, mes: e.target.value }))} style={inputStyle}>
            <option value="">—</option>
            {MESES.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Concepto / Curso <span style={{ color: "var(--bad)" }}>*</span></label>
          <input type="text" value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}
            style={inputStyle} placeholder="Nombre del curso..." required />
        </div>
        <div>
          <label style={labelStyle}>Monto</label>
          <input type="number" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
            style={inputStyle} min={0} step="0.01" placeholder="0.00" />
        </div>
        <div>
          <label style={labelStyle}>Pagado</label>
          <input type="number" value={form.pagado} onChange={e => setForm(f => ({ ...f, pagado: e.target.value }))}
            style={inputStyle} min={0} step="0.01" placeholder="0.00" />
        </div>
        <div>
          <label style={labelStyle}>Estado</label>
          <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} style={inputStyle}>
            {Object.keys(ESTADO_CONFIG).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Notas</label>
        <input type="text" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
          style={{ ...inputStyle, width: "100%" }} placeholder="Observaciones opcionales..." />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={saving} style={{
          padding: "7px 18px",
          background: saving ? "var(--muted-2)" : "var(--navy)",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: saving ? "not-allowed" : "pointer",
        }}>
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <button type="button" onClick={() => setOpen(false)} style={{
          padding: "7px 14px",
          background: "none",
          border: "1px solid var(--line-2)",
          borderRadius: 6,
          fontSize: 13,
          color: "var(--muted)",
          cursor: "pointer",
        }}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: ".05em",
  marginBottom: 3,
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "5px 8px",
  border: "1px solid var(--line-2)",
  borderRadius: 5,
  fontSize: 13,
  color: "var(--fg)",
  background: "var(--surface)",
  outline: "none",
  boxSizing: "border-box",
}

// ─── Editable Cell ────────────────────────────────────────────────────────────

interface EditableCellProps {
  value: string | number
  type?: "text" | "number" | "select"
  options?: string[]
  onSave: (val: string) => Promise<void>
  style?: React.CSSProperties
  align?: "left" | "right" | "center"
}

function EditableCell({ value, type = "text", options = [], onSave, style = {}, align = "left" }: EditableCellProps) {
  const [editing, setEditing] = useState(false)
  const [localVal, setLocalVal] = useState(String(value))
  const [saving, setSaving] = useState(false)

  async function commit() {
    if (localVal === String(value)) { setEditing(false); return }
    setSaving(true)
    await onSave(localVal)
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    if (type === "select") {
      return (
        <select
          autoFocus
          value={localVal}
          onChange={e => setLocalVal(e.target.value)}
          onBlur={commit}
          style={{ ...inputStyle, minWidth: 90, fontSize: 12 }}
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )
    }
    return (
      <input
        autoFocus
        type={type}
        value={localVal}
        onChange={e => setLocalVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setLocalVal(String(value)); setEditing(false) } }}
        style={{ ...inputStyle, fontSize: 12, textAlign: align, minWidth: 60 }}
      />
    )
  }

  return (
    <span
      onClick={() => { setLocalVal(String(value)); setEditing(true) }}
      title="Clic para editar"
      style={{
        display: "block",
        cursor: "text",
        textAlign: align,
        padding: "2px 4px",
        borderRadius: 3,
        minHeight: 20,
        transition: "background .1s",
        color: saving ? "var(--muted-2)" : undefined,
        ...style,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(13,32,96,.06)" }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
    >
      {saving ? "guardando..." : (value === "" || value === null || value === undefined ? "—" : value)}
    </span>
  )
}

// ─── Payment Table ────────────────────────────────────────────────────────────

interface PaymentTableProps {
  perito: PeritoData
  onUpdate: (pagos: PagoCursoPerito[]) => void
}

function PaymentTable({ perito, onUpdate }: PaymentTableProps) {
  const [pagos, setPagos] = useState<PagoCursoPerito[]>(perito.pagos)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function saveField(id: string, field: string, val: string) {
    const existing = pagos.find(p => p.id === id)
    if (!existing) return

    const payload: Record<string, unknown> = { id, [field]: val }
    if (field === "monto") payload.monto = parseFloat(val) || 0
    if (field === "pagado") payload.pagado = parseFloat(val) || 0
    if (field === "anio") payload.anio = Number(val)
    if (field === "mes") payload.mes = val ? Number(val) : null

    const res = await fetch(`/api/admin/peritos/${perito.usuarioId}/pagos`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const updated = await res.json()
      const newPagos = pagos.map(p => p.id === id ? updated : p)
      setPagos(newPagos)
      onUpdate(newPagos)
    }
  }

  async function deletePago(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/peritos/${perito.usuarioId}/pagos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        const newPagos = pagos.filter(p => p.id !== id)
        setPagos(newPagos)
        onUpdate(newPagos)
      }
    } finally {
      setDeleting(null)
    }
  }

  function handleAdded(pago: PagoCursoPerito) {
    const newPagos = [...pagos, pago]
    setPagos(newPagos)
    onUpdate(newPagos)
  }

  const totalMonto = pagos.reduce((s, p) => s + p.monto, 0)
  const totalPagado = pagos.reduce((s, p) => s + p.pagado, 0)
  const totalSaldo = pagos.reduce((s, p) => s + p.saldo, 0)

  function downloadCSV() {
    const headers = ["AÑO", "MES", "CONCEPTO", "MONTO", "PAGADO", "SALDO", "ESTADO", "NOTAS"]
    const rows = pagos.map(p => [
      p.anio,
      p.mes ? MESES[p.mes] : "",
      `"${p.concepto}"`,
      p.monto.toFixed(2),
      p.pagado.toFixed(2),
      p.saldo.toFixed(2),
      p.estado,
      `"${p.notas ?? ""}"`,
    ])
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cobranza_${perito.nombre.replace(/\s+/g, "_")}_${new Date().getFullYear()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const thStyle: React.CSSProperties = {
    padding: "9px 10px",
    textAlign: "left",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: ".07em",
    textTransform: "uppercase",
    color: "var(--info-bg)",
    whiteSpace: "nowrap",
    borderBottom: "2px solid rgba(255,255,255,.12)",
  }

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Facturado", value: fmt(totalMonto), color: "var(--ink)", accent: "var(--brand)" },
          { label: "Total Pagado", value: fmt(totalPagado), color: "var(--ok)", accent: "var(--ok)" },
          { label: "Saldo Pendiente", value: fmt(totalSaldo), color: totalSaldo > 0 ? "var(--bad)" : "var(--ok)", accent: totalSaldo > 0 ? "var(--bad)" : "var(--ok)" },
          { label: "Cursos Registrados", value: String(pagos.length), color: "var(--ink)", accent: "var(--gold)" },
        ].map((card) => (
          <div key={card.label} style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            padding: "14px 16px",
            borderLeft: `4px solid ${card.accent}`,
            boxShadow: "0 1px 3px rgba(0,0,0,.06)",
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: card.color, fontFamily: "monospace", letterSpacing: "-.01em" }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Table toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", textTransform: "uppercase", letterSpacing: ".06em" }}>
          Registro de Pagos
        </div>
        <button onClick={downloadCSV} style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 14px",
          background: "var(--navy)",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          letterSpacing: ".02em",
        }}>
          Descargar Excel
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid var(--line)", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--navy)" }}>
              <th style={{ ...thStyle, width: 60 }}>Año</th>
              <th style={{ ...thStyle, width: 90 }}>Mes</th>
              <th style={{ ...thStyle }}>Concepto / Curso</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Monto</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Pagado</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Saldo</th>
              <th style={{ ...thStyle, width: 100 }}>Estado</th>
              <th style={{ ...thStyle }}>Notas</th>
              <th style={{ ...thStyle, width: 48 }}></th>
            </tr>
          </thead>
          <tbody>
            {pagos.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: "28px 16px", textAlign: "center", color: "var(--muted-2)", fontSize: 13 }}>
                  No hay registros de pago. Use el botón para agregar el primer concepto.
                </td>
              </tr>
            )}
            {pagos.map((pago, idx) => {
              const ec = ESTADO_CONFIG[pago.estado] ?? ESTADO_CONFIG["PENDIENTE"]
              const rowBg = idx % 2 === 0 ? ec.bg : shiftColor(ec.bg)

              return (
                <tr key={pago.id} style={{ background: rowBg, borderBottom: `1px solid ${ec.border}` }}>
                  <td style={{ padding: "6px 10px" }}>
                    <EditableCell
                      value={pago.anio}
                      type="number"
                      align="center"
                      onSave={val => saveField(pago.id, "anio", val)}
                    />
                  </td>
                  <td style={{ padding: "6px 10px" }}>
                    <EditableCell
                      value={pago.mes ? MESES[pago.mes] : ""}
                      type="select"
                      options={["", ...MESES.slice(1)]}
                      onSave={async (val) => {
                        const mesNum = MESES.indexOf(val)
                        await saveField(pago.id, "mes", mesNum > 0 ? String(mesNum) : "")
                      }}
                    />
                  </td>
                  <td style={{ padding: "6px 10px", fontWeight: 500, color: "var(--fg)", maxWidth: 240 }}>
                    <EditableCell
                      value={pago.concepto}
                      type="text"
                      onSave={val => saveField(pago.id, "concepto", val)}
                    />
                  </td>
                  <td style={{ padding: "6px 10px", fontFamily: "monospace" }}>
                    <EditableCell
                      value={pago.monto.toFixed(2)}
                      type="number"
                      align="right"
                      style={{ color: "var(--ink)", fontWeight: 600 }}
                      onSave={val => saveField(pago.id, "monto", val)}
                    />
                  </td>
                  <td style={{ padding: "6px 10px", fontFamily: "monospace" }}>
                    <EditableCell
                      value={pago.pagado.toFixed(2)}
                      type="number"
                      align="right"
                      style={{ color: "var(--ok)", fontWeight: 600 }}
                      onSave={val => saveField(pago.id, "pagado", val)}
                    />
                  </td>
                  <td style={{ padding: "6px 10px", fontFamily: "monospace" }}>
                    <span style={{
                      display: "block",
                      textAlign: "right",
                      fontWeight: 700,
                      color: pago.saldo > 0 ? "var(--bad)" : "var(--ok)",
                      padding: "2px 4px",
                    }}>
                      {fmt(pago.saldo)}
                    </span>
                  </td>
                  <td style={{ padding: "6px 10px" }}>
                    <EditableCell
                      value={pago.estado}
                      type="select"
                      options={Object.keys(ESTADO_CONFIG)}
                      onSave={val => saveField(pago.id, "estado", val)}
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        background: ec.bg,
                        color: ec.color,
                        border: `1px solid ${ec.border}`,
                        letterSpacing: ".04em",
                      }}
                    />
                  </td>
                  <td style={{ padding: "6px 10px", color: "var(--muted)" }}>
                    <EditableCell
                      value={pago.notas ?? ""}
                      type="text"
                      onSave={val => saveField(pago.id, "notas", val)}
                      style={{ color: "var(--muted)", fontSize: 12 }}
                    />
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                    <button
                      onClick={() => deletePago(pago.id)}
                      disabled={deleting === pago.id}
                      title="Eliminar fila"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: deleting === pago.id ? "not-allowed" : "pointer",
                        color: deleting === pago.id ? "var(--line-2)" : "var(--bad)",
                        fontSize: 15,
                        lineHeight: 1,
                        padding: "2px 4px",
                        borderRadius: 4,
                        transition: "color .15s, background .15s",
                      }}
                      onMouseEnter={e => { if (deleting !== pago.id) (e.currentTarget as HTMLElement).style.background = "var(--bad-bg)" }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none" }}
                    >
                      {deleting === pago.id ? "..." : "×"}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          {pagos.length > 0 && (
            <tfoot>
              <tr style={{ background: "var(--navy)", borderTop: "2px solid rgba(255,255,255,.2)" }}>
                <td colSpan={3} style={{ padding: "9px 10px", color: "var(--info-bg)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  TOTALES
                </td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "var(--info-bg)" }}>{fmt(totalMonto)}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "var(--ok-ring)" }}>{fmt(totalPagado)}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: totalSaldo > 0 ? "var(--bad-ring)" : "var(--ok-ring)" }}>{fmt(totalSaldo)}</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <AddRowForm peritoId={perito.usuarioId} onAdded={handleAdded} />
    </div>
  )
}

function shiftColor(hex: string): string {
  // Lighten hex color slightly for alternating rows
  const val = parseInt(hex.replace("#", ""), 16)
  if (isNaN(val)) return hex
  const r = Math.min(255, ((val >> 16) & 0xff) + 4)
  const g = Math.min(255, ((val >> 8) & 0xff) + 4)
  const b = Math.min(255, (val & 0xff) + 4)
  return `rgb(${r},${g},${b})`
}

// ─── Global Excel Export ──────────────────────────────────────────────────────

function exportAllToExcel(data: PeritoData[]) {
  const wb = XLSX.utils.book_new()

  // ── Summary sheet ──────────────────────────────────────────────────────────
  const summaryHeader = [
    ["COLEGIO DE INGENIEROS MECÁNICOS Y ELECTRÓNICOS DE VERACRUZ A.C."],
    ["Cobranza de Peritos — Resumen General"],
    [`Generado: ${new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}`],
    [],
    ["#", "PERITO", "NÚMERO", "ESPECIALIDAD", "ESTADO", "CURSOS", "TOTAL FACTURADO", "TOTAL PAGADO", "SALDO PENDIENTE", "% CUMPLIMIENTO"],
  ]

  const summaryRows = data.map((p, i) => {
    const pct = p.total > 0 ? Math.round((p.pagado / p.total) * 100) : 100
    return [
      i + 1,
      p.nombre,
      p.numeroPerito ? `CIME-PER-${p.numeroPerito}` : "—",
      p.especialidad ?? "—",
      p.estado,
      p.pagos.length,
      p.total,
      p.pagado,
      p.saldo,
      pct / 100,
    ]
  })

  const totalRow = [
    "",
    "TOTALES",
    "", "", "",
    data.reduce((s, p) => s + p.pagos.length, 0),
    data.reduce((s, p) => s + p.total, 0),
    data.reduce((s, p) => s + p.pagado, 0),
    data.reduce((s, p) => s + p.saldo, 0),
    "",
  ]

  const summaryData = [...summaryHeader, ...summaryRows, [], totalRow]
  const summaryWS = XLSX.utils.aoa_to_sheet(summaryData)

  // Column widths for summary
  summaryWS["!cols"] = [
    { wch: 4 }, { wch: 32 }, { wch: 14 }, { wch: 24 }, { wch: 12 },
    { wch: 8 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 14 },
  ]

  // Format currency cols in summary
  const currencyCols = [6, 7, 8] // G, H, I (0-indexed)
  for (let r = 5; r < 5 + summaryRows.length + 2; r++) {
    currencyCols.forEach(c => {
      const cellRef = XLSX.utils.encode_cell({ r, c })
      if (summaryWS[cellRef]) summaryWS[cellRef].z = '"$"#,##0.00'
    })
    // Percent col
    const pctRef = XLSX.utils.encode_cell({ r, c: 9 })
    if (summaryWS[pctRef]) summaryWS[pctRef].z = "0%"
  }

  summaryWS["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }]
  XLSX.utils.book_append_sheet(wb, summaryWS, "RESUMEN GENERAL")

  // ── One sheet per perito ───────────────────────────────────────────────────
  for (const perito of data) {
    const sheetName = perito.nombre
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .substring(0, 31)
      .trim()

    const totalMonto  = perito.pagos.reduce((s, p) => s + p.monto,  0)
    const totalPagado = perito.pagos.reduce((s, p) => s + p.pagado, 0)
    const totalSaldo  = perito.pagos.reduce((s, p) => s + p.saldo,  0)
    const pct = totalMonto > 0 ? Math.round((totalPagado / totalMonto) * 100) : 100

    const header = [
      ["COLEGIO DE INGENIEROS MECÁNICOS Y ELECTRÓNICOS DE VERACRUZ A.C."],
      ["EXPEDIENTE DE COBRANZA — PERITO"],
      [],
      ["PERITO:", perito.nombre],
      ["NÚMERO:", perito.numeroPerito ? `CIME-PER-${perito.numeroPerito}` : "—"],
      ["ESPECIALIDAD:", perito.especialidad ?? "—"],
      ["ESTADO:", perito.estado],
      ["% CUMPLIMIENTO:", pct / 100],
      [],
      ["AÑO", "MES", "CONCEPTO / CURSO", "MONTO", "PAGADO", "SALDO", "ESTADO", "NOTAS"],
    ]

    const dataRows = perito.pagos
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map(p => [
        p.anio,
        p.mes ? MESES[p.mes] : "—",
        p.concepto,
        p.monto,
        p.pagado,
        p.saldo,
        p.estado,
        p.notas ?? "",
      ])

    const footerRows = [
      [],
      ["", "", "TOTALES", totalMonto, totalPagado, totalSaldo, "", ""],
    ]

    const ws = XLSX.utils.aoa_to_sheet([...header, ...dataRows, ...footerRows])

    // Col widths
    ws["!cols"] = [
      { wch: 6 }, { wch: 12 }, { wch: 36 },
      { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 12 }, { wch: 36 },
    ]

    // Format currency in data rows (cols 3,4,5 → D,E,F)
    const dataStart = header.length
    for (let r = dataStart; r < dataStart + dataRows.length + 2; r++) {
      [3, 4, 5].forEach(c => {
        const cellRef = XLSX.utils.encode_cell({ r, c })
        if (ws[cellRef] && typeof ws[cellRef].v === "number") ws[cellRef].z = '"$"#,##0.00'
      })
    }

    // Format % cell (H8 → row 7, col 1)
    const pctRef = XLSX.utils.encode_cell({ r: 7, c: 1 })
    if (ws[pctRef]) ws[pctRef].z = "0%"

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    ]

    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  }

  // Download
  const fecha = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `CIME_Cobranza_Peritos_${fecha}.xlsx`)
}

// ─── Main Hub ─────────────────────────────────────────────────────────────────

export default function CobranzaPeritosHub({ initialData }: Props) {
  const [data, setData] = useState<PeritoData[]>(initialData)
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(initialData[0]?.usuarioId ?? null)
  const [exporting, setExporting] = useState(false)

  function handleExportAll() {
    setExporting(true)
    setTimeout(() => {
      try { exportAllToExcel(data) }
      finally { setExporting(false) }
    }, 50)
  }

  const filtered = data.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.numeroPerito ?? "").includes(search) ||
    (p.especialidad ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const selected = data.find(p => p.usuarioId === selectedId) ?? null

  function handlePagosUpdate(peritoId: string, pagos: PagoCursoPerito[]) {
    setData(prev => prev.map(p => {
      if (p.usuarioId !== peritoId) return p
      const total = pagos.reduce((s, pg) => s + pg.monto, 0)
      const pagado = pagos.reduce((s, pg) => s + pg.pagado, 0)
      const saldo = pagos.reduce((s, pg) => s + pg.saldo, 0)
      return { ...p, pagos, total, pagado, saldo }
    }))
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 60px)", overflow: "hidden", background: "var(--surface-2)" }}>

      {/* LEFT PANEL */}
      <div style={{
        width: 280,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--surface)",
        borderRight: "1px solid var(--line)",
        overflow: "hidden",
      }}>
        {/* Panel header */}
        <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid var(--line)", background: "var(--navy)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--info-ring)", textTransform: "uppercase", letterSpacing: ".08em" }}>
              Cobranza de Peritos
            </div>
            <button
              onClick={handleExportAll}
              disabled={exporting}
              title="Exportar todos los peritos a Excel"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 11px",
                background: exporting ? "rgba(255,255,255,.1)" : "var(--ok)",
                color: "#fff",
                border: "none",
                borderRadius: 5,
                fontSize: 11,
                fontWeight: 700,
                cursor: exporting ? "not-allowed" : "pointer",
                letterSpacing: ".03em",
                whiteSpace: "nowrap",
                transition: "background .15s",
              }}
              onMouseEnter={e => { if (!exporting) e.currentTarget.style.background = "var(--ok)" }}
              onMouseLeave={e => { if (!exporting) e.currentTarget.style.background = "var(--ok)" }}
            >
              {exporting ? "Generando..." : "Exportar Excel"}
            </button>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar perito..."
            style={{
              width: "100%",
              padding: "7px 10px",
              border: "1px solid rgba(255,255,255,.2)",
              borderRadius: 6,
              fontSize: 13,
              background: "rgba(255,255,255,.1)",
              color: "#fff",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,.5)" }}>
            {filtered.length} perito{filtered.length !== 1 ? "s" : ""} · {data.length} total
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0 && (
            <div style={{ padding: "24px 14px", textAlign: "center", color: "var(--muted-2)", fontSize: 13 }}>
              No se encontraron peritos
            </div>
          )}
          {filtered.map(p => {
            const chip = getStatusChip(p.saldo, p.pagos)
            const pct = p.total > 0 ? Math.min(100, Math.round((p.pagado / p.total) * 100)) : 0
            const isSelected = p.usuarioId === selectedId

            return (
              <button
                key={p.usuarioId}
                onClick={() => setSelectedId(p.usuarioId)}
                style={{
                  width: "100%",
                  display: "block",
                  textAlign: "left",
                  padding: "12px 14px",
                  background: isSelected ? "var(--info-bg)" : "transparent",
                  borderBottom: "1px solid var(--surface-2)",
                  border: "none",
                  borderLeft: isSelected ? "3px solid var(--navy)" : "3px solid transparent",
                  cursor: "pointer",
                  transition: "background .1s",
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--surface-2)" }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: avatarColor(p.nombre),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                    letterSpacing: ".04em",
                  }}>
                    {getInitials(p.nombre)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.nombre}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "monospace", marginTop: 1 }}>
                      {p.numeroPerito ? `CIME-PER-${p.numeroPerito}` : "Sin número"}
                    </div>
                    {p.total > 0 && (
                      <div style={{ marginTop: 5 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted-2)", marginBottom: 2 }}>
                          <span>{fmt(p.pagado)}</span>
                          <span>{fmt(p.total)}</span>
                        </div>
                        <div style={{ height: 4, background: "var(--line)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            borderRadius: 2,
                            width: `${pct}%`,
                            background: pct === 100 ? "var(--ok)" : pct > 50 ? "var(--warn)" : "var(--bad)",
                            transition: "width .3s",
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{
                    flexShrink: 0,
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: ".05em",
                    background: chip.bg,
                    color: chip.color,
                  }}>
                    {chip.label}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
        {!selected ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted-2)", fontSize: 15 }}>
            Selecciona un perito para ver su estado de cuenta
          </div>
        ) : (
          <div>
            {/* Perito header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 20,
              padding: "16px 20px",
              background: "var(--surface)",
              borderRadius: 10,
              border: "1px solid var(--line)",
              boxShadow: "0 1px 4px rgba(0,0,0,.05)",
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: avatarColor(selected.nombre),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {getInitials(selected.nombre)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }}>
                  {selected.nombre}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                  {selected.numeroPerito && (
                    <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--muted)", fontWeight: 600 }}>
                      CIME-PER-{selected.numeroPerito}
                    </span>
                  )}
                  {selected.especialidad && (
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{selected.especialidad}</span>
                  )}
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 4,
                    background: selected.estado === "VIGENTE" ? "var(--ok-bg)" : selected.estado === "SUSPENDIDO" ? "var(--bad-bg)" : "var(--warn-bg)",
                    color: selected.estado === "VIGENTE" ? "var(--ok)" : selected.estado === "SUSPENDIDO" ? "var(--bad)" : "var(--warn)",
                    letterSpacing: ".05em",
                  }}>
                    {selected.estado}
                  </span>
                </div>
              </div>
            </div>

            <PaymentTable
              key={selected.usuarioId}
              perito={selected}
              onUpdate={(pagos) => handlePagosUpdate(selected.usuarioId, pagos)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

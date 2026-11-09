"use client"

import { useState } from "react"
import { FileText, Plus, Edit2, Trash2, ChevronDown, X, Check } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────
export type SolicitudUsuario = {
  id: string
  nombre: string
  correo: string
  numeroColegiado: string | null
}

export type SolicitudItem = {
  id: string
  planId: string
  usuarioId: string
  estado: string
  notas: string | null
  createdAt: string
  updatedAt: string
  usuario: SolicitudUsuario
}

export type PlanItem = {
  id: string
  nombre: string
  descripcion: string | null
  monto: number
  iva: boolean
  tipo: string
  activo: boolean
  createdAt: string
  updatedAt: string
  solicitudes: SolicitudItem[]
}

interface Props {
  data: PlanItem[]
}

// ─── Helpers ─────────────────────────────────────────────────────
const money = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })

const TIPO_LABELS: Record<string, string> = {
  ANUALIDAD: "Anualidad",
  REFRENDO: "Refrendo",
  OTRO: "Otro",
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDIENTE:  { label: "Pendiente",  color: "#D97706", bg: "#FEF3C7" },
  CONTACTADO: { label: "Contactado", color: "#2563EB", bg: "#DBEAFE" },
  ACTIVO:     { label: "Activo",     color: "#059669", bg: "#D1FAE5" },
  RECHAZADO:  { label: "Rechazado",  color: "#DC2626", bg: "#FEE2E2" },
}

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CONFIG[estado] ?? { label: estado, color: "var(--muted)", bg: "var(--surface-2)" }
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: ".73rem",
      fontWeight: 700,
      letterSpacing: ".04em",
      color: cfg.color,
      background: cfg.bg,
    }}>
      {cfg.label}
    </span>
  )
}

function TipoBadge({ tipo }: { tipo: string }) {
  const colors: Record<string, { color: string; bg: string }> = {
    ANUALIDAD: { color: "#1B4F91", bg: "#DBEAFE" },
    REFRENDO:  { color: "#6D28D9", bg: "#EDE9FE" },
    OTRO:      { color: "#374151", bg: "#F3F4F6" },
  }
  const cfg = colors[tipo] ?? colors.OTRO
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 9px",
      borderRadius: 20,
      fontSize: ".7rem",
      fontWeight: 700,
      letterSpacing: ".05em",
      textTransform: "uppercase" as const,
      color: cfg.color,
      background: cfg.bg,
    }}>
      {TIPO_LABELS[tipo] ?? tipo}
    </span>
  )
}

// ─── Default seed plans ──────────────────────────────────────────
const SEED_PLANES = [
  {
    nombre: "Anualidad CIME 2026",
    descripcion: "Pago anual de membresía del Colegio de Ingenieros Mecánicos y Electricistas de Veracruz",
    monto: 3500,
    iva: false,
    tipo: "ANUALIDAD",
  },
  {
    nombre: "Refrendo Perito 2027",
    descripcion: "Refrendo de perito judicial para el ejercicio 2027. Incluye factura.",
    monto: 1000,
    iva: true,
    tipo: "REFRENDO",
  },
]

// ─── Plan form state ─────────────────────────────────────────────
type PlanForm = {
  nombre: string
  descripcion: string
  monto: string
  iva: boolean
  tipo: string
  activo: boolean
}

const EMPTY_FORM: PlanForm = {
  nombre: "",
  descripcion: "",
  monto: "",
  iva: false,
  tipo: "OTRO",
  activo: true,
}

// ─── Main Component ───────────────────────────────────────────────
export default function PlanesAdminHub({ data }: Props) {
  const [planes, setPlanes] = useState<PlanItem[]>(data)
  const [solicitudes, setSolicitudes] = useState<SolicitudItem[]>(
    data.flatMap(p => p.solicitudes)
  )

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null)
  const [form, setForm] = useState<PlanForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Solicitud estado edits
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [notasEditing, setNotasEditing] = useState<string | null>(null)
  const [notasValue, setNotasValue] = useState("")

  // Seed
  const [seeding, setSeeding] = useState(false)

  function openCreate() {
    setEditingPlan(null)
    setForm(EMPTY_FORM)
    setError("")
    setModalOpen(true)
  }

  function openEdit(plan: PlanItem) {
    setEditingPlan(plan)
    setForm({
      nombre: plan.nombre,
      descripcion: plan.descripcion ?? "",
      monto: String(plan.monto),
      iva: plan.iva,
      tipo: plan.tipo,
      activo: plan.activo,
    })
    setError("")
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingPlan(null)
    setForm(EMPTY_FORM)
    setError("")
  }

  async function handleSavePlan() {
    if (!form.nombre.trim() || !form.monto) {
      setError("Nombre y monto son obligatorios.")
      return
    }
    setSaving(true)
    setError("")
    try {
      if (editingPlan) {
        const res = await fetch(`/api/admin/planes/${editingPlan.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim() || null,
            monto: parseFloat(form.monto),
            iva: form.iva,
            tipo: form.tipo,
            activo: form.activo,
          }),
        })
        if (!res.ok) throw new Error("Error al actualizar plan.")
        const updated: PlanItem = await res.json()
        setPlanes(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
      } else {
        const res = await fetch("/api/admin/planes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim() || null,
            monto: parseFloat(form.monto),
            iva: form.iva,
            tipo: form.tipo,
          }),
        })
        if (!res.ok) throw new Error("Error al crear plan.")
        const created: PlanItem = await res.json()
        setPlanes(prev => [{ ...created, solicitudes: [] }, ...prev])
      }
      closeModal()
    } catch (e: any) {
      setError(e.message ?? "Error inesperado.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDeletePlan(id: string) {
    if (!confirm("¿Eliminar este plan? Se eliminarán también las solicitudes asociadas.")) return
    const res = await fetch(`/api/admin/planes/${id}`, { method: "DELETE" })
    if (res.ok) {
      setPlanes(prev => prev.filter(p => p.id !== id))
      setSolicitudes(prev => prev.filter(s => s.planId !== id))
    }
  }

  async function handleToggleActivo(plan: PlanItem) {
    const res = await fetch(`/api/admin/planes/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !plan.activo }),
    })
    if (res.ok) {
      setPlanes(prev => prev.map(p => p.id === plan.id ? { ...p, activo: !p.activo } : p))
    }
  }

  async function handleEstadoChange(solicitudId: string, estado: string) {
    setUpdatingId(solicitudId)
    try {
      const res = await fetch(`/api/admin/solicitudes/${solicitudId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      })
      if (res.ok) {
        setSolicitudes(prev => prev.map(s => s.id === solicitudId ? { ...s, estado } : s))
      }
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleSaveNotas(solicitudId: string) {
    const res = await fetch(`/api/admin/solicitudes/${solicitudId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notas: notasValue.trim() || null }),
    })
    if (res.ok) {
      setSolicitudes(prev => prev.map(s =>
        s.id === solicitudId ? { ...s, notas: notasValue.trim() || null } : s
      ))
      setNotasEditing(null)
    }
  }

  async function handleSeedPlanes() {
    if (!confirm("¿Crear los planes predeterminados de CIME?")) return
    setSeeding(true)
    try {
      for (const p of SEED_PLANES) {
        const res = await fetch("/api/admin/planes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p),
        })
        if (res.ok) {
          const created: PlanItem = await res.json()
          setPlanes(prev => [{ ...created, solicitudes: [] }, ...prev])
        }
      }
    } finally {
      setSeeding(false)
    }
  }

  // Gather all solicitudes for right panel (sorted: PENDIENTE first)
  const ORDER = ["PENDIENTE", "CONTACTADO", "ACTIVO", "RECHAZADO"]
  const sortedSolicitudes = [...solicitudes].sort((a, b) => {
    return ORDER.indexOf(a.estado) - ORDER.indexOf(b.estado)
  })

  const planById = (id: string) => planes.find(p => p.id === id)

  return (
    <>
      {/* Page header */}
      <div className="page-head">
        <div>
          <h1>Planes de Pago</h1>
          <p>Administra los planes de membresía y suscripciones del colegio.</p>
        </div>
        <button className="btn primary" onClick={openCreate}>
          <Plus size={15} strokeWidth={2} />
          Nuevo plan
        </button>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.2fr)", gap: 24, alignItems: "start" }}>

        {/* ── Left: Plans ──────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 className="font-montserrat" style={{ fontSize: ".95rem", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
              Planes activos
            </h2>
            {planes.length === 0 && (
              <button
                className="btn"
                onClick={handleSeedPlanes}
                disabled={seeding}
                style={{ fontSize: ".8rem" }}
              >
                {seeding ? "Creando..." : "Crear planes predeterminados"}
              </button>
            )}
          </div>

          {planes.length === 0 ? (
            <div style={{
              padding: 40,
              textAlign: "center",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              color: "var(--muted)",
              fontSize: ".88rem",
            }}>
              <FileText size={32} strokeWidth={1.25} style={{ margin: "0 auto 12px", opacity: .35 }} />
              <p>No hay planes configurados.</p>
              <p style={{ marginTop: 4, fontSize: ".8rem" }}>Crea los planes predeterminados o agrega uno nuevo.</p>
            </div>
          ) : (
            planes.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onEdit={() => openEdit(plan)}
                onDelete={() => handleDeletePlan(plan.id)}
                onToggleActivo={() => handleToggleActivo(plan)}
              />
            ))
          )}
        </div>

        {/* ── Right: Solicitudes ───────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 className="font-montserrat" style={{ fontSize: ".95rem", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
            Solicitudes
            {solicitudes.length > 0 && (
              <span style={{
                marginLeft: 8,
                display: "inline-block",
                minWidth: 20,
                height: 20,
                lineHeight: "20px",
                textAlign: "center",
                borderRadius: 10,
                background: "var(--brand, #1B4F91)",
                color: "#fff",
                fontSize: ".68rem",
                fontWeight: 700,
                padding: "0 6px",
              }}>
                {solicitudes.length}
              </span>
            )}
          </h2>

          {sortedSolicitudes.length === 0 ? (
            <div style={{
              padding: 40,
              textAlign: "center",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              color: "var(--muted)",
              fontSize: ".88rem",
            }}>
              <p>Aun no hay solicitudes.</p>
            </div>
          ) : (
            sortedSolicitudes.map(sol => {
              const plan = planById(sol.planId)
              return (
                <div key={sol.id} style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}>
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: ".9rem", color: "var(--fg)", marginBottom: 2 }}>
                        {sol.usuario.nombre}
                      </div>
                      <div style={{ fontSize: ".76rem", color: "var(--muted)", fontFamily: "var(--f-mono, monospace)" }}>
                        {sol.usuario.numeroColegiado ? `CIME-VER-${sol.usuario.numeroColegiado}` : sol.usuario.correo}
                      </div>
                    </div>
                    <EstadoBadge estado={sol.estado} />
                  </div>

                  {/* Plan name + date */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontSize: ".8rem", color: "var(--muted)" }}>
                      {plan ? (
                        <span style={{ color: "var(--fg)", fontWeight: 500 }}>{plan.nombre}</span>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>Plan eliminado</span>
                      )}
                    </div>
                    <div style={{ fontSize: ".74rem", color: "var(--muted)", whiteSpace: "nowrap" as const }}>
                      {fmtDate(sol.createdAt)}
                    </div>
                  </div>

                  {/* Estado select */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: ".76rem", color: "var(--muted)", flexShrink: 0 }}>Estado:</span>
                    <div style={{ position: "relative", flex: 1 }}>
                      <select
                        value={sol.estado}
                        disabled={updatingId === sol.id}
                        onChange={e => handleEstadoChange(sol.id, e.target.value)}
                        style={{
                          width: "100%",
                          appearance: "none" as const,
                          border: "1px solid var(--line)",
                          borderRadius: 6,
                          background: "var(--surface-2)",
                          color: "var(--fg)",
                          fontSize: ".8rem",
                          padding: "5px 28px 5px 10px",
                          cursor: "pointer",
                        }}
                      >
                        {Object.entries(ESTADO_CONFIG).map(([val, cfg]) => (
                          <option key={val} value={val}>{cfg.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} strokeWidth={2} style={{
                        position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                        color: "var(--muted)", pointerEvents: "none",
                      }} />
                    </div>
                  </div>

                  {/* Notes */}
                  {notasEditing === sol.id ? (
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                      <textarea
                        value={notasValue}
                        onChange={e => setNotasValue(e.target.value)}
                        placeholder="Agregar nota sobre esta solicitud..."
                        rows={2}
                        style={{
                          width: "100%",
                          border: "1px solid var(--line)",
                          borderRadius: 6,
                          background: "var(--surface-2)",
                          color: "var(--fg)",
                          fontSize: ".8rem",
                          padding: "6px 10px",
                          resize: "vertical" as const,
                          fontFamily: "inherit",
                        }}
                      />
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button
                          className="btn"
                          style={{ fontSize: ".76rem", padding: "4px 10px" }}
                          onClick={() => setNotasEditing(null)}
                        >
                          Cancelar
                        </button>
                        <button
                          className="btn primary"
                          style={{ fontSize: ".76rem", padding: "4px 10px" }}
                          onClick={() => handleSaveNotas(sol.id)}
                        >
                          <Check size={12} strokeWidth={2.5} /> Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => { setNotasEditing(sol.id); setNotasValue(sol.notas ?? "") }}
                      style={{
                        fontSize: ".78rem",
                        color: sol.notas ? "var(--fg)" : "var(--muted)",
                        cursor: "pointer",
                        padding: "5px 8px",
                        borderRadius: 6,
                        border: "1px dashed var(--line)",
                        lineHeight: 1.4,
                        minHeight: 30,
                      }}
                    >
                      {sol.notas || "Agregar nota..."}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Modal ─────────────────────────────────── */}
      {modalOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(4,10,20,.55)",
          backdropFilter: "blur(6px)",
        }}>
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            width: "100%",
            maxWidth: 480,
            margin: "0 16px",
            boxShadow: "0 24px 64px rgba(0,0,0,.25)",
          }}>
            {/* Modal header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 20px 16px",
              borderBottom: "1px solid var(--line)",
            }}>
              <h3 className="font-montserrat" style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--fg)" }}>
                {editingPlan ? "Editar plan" : "Nuevo plan de pago"}
              </h3>
              <button onClick={closeModal} style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 32, height: 32, borderRadius: 8, border: "none",
                background: "var(--surface-2)", cursor: "pointer", color: "var(--muted)",
              }}>
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column" as const, gap: 14 }}>
              {error && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8, fontSize: ".82rem",
                  background: "var(--bad-bg)", color: "var(--bad)",
                  border: "1px solid color-mix(in srgb, var(--bad) 30%, var(--line))",
                }}>
                  {error}
                </div>
              )}

              <label style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
                <span style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--muted)", letterSpacing: ".04em" }}>
                  NOMBRE DEL PLAN *
                </span>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej. Anualidad CIME 2026"
                  style={{
                    border: "1px solid var(--line)", borderRadius: 8,
                    background: "var(--surface-2)", color: "var(--fg)",
                    padding: "9px 12px", fontSize: ".88rem", fontFamily: "inherit",
                  }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
                <span style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--muted)", letterSpacing: ".04em" }}>
                  DESCRIPCION
                </span>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Descripción breve del plan..."
                  rows={2}
                  style={{
                    border: "1px solid var(--line)", borderRadius: 8,
                    background: "var(--surface-2)", color: "var(--fg)",
                    padding: "9px 12px", fontSize: ".88rem", fontFamily: "inherit",
                    resize: "vertical" as const,
                  }}
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
                  <span style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--muted)", letterSpacing: ".04em" }}>
                    MONTO (MXN) *
                  </span>
                  <input
                    type="number"
                    value={form.monto}
                    onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                    style={{
                      border: "1px solid var(--line)", borderRadius: 8,
                      background: "var(--surface-2)", color: "var(--fg)",
                      padding: "9px 12px", fontSize: ".88rem", fontFamily: "var(--f-mono, monospace)",
                    }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
                  <span style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--muted)", letterSpacing: ".04em" }}>
                    TIPO
                  </span>
                  <div style={{ position: "relative" }}>
                    <select
                      value={form.tipo}
                      onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                      style={{
                        width: "100%",
                        appearance: "none" as const,
                        border: "1px solid var(--line)", borderRadius: 8,
                        background: "var(--surface-2)", color: "var(--fg)",
                        padding: "9px 28px 9px 12px", fontSize: ".88rem", cursor: "pointer",
                      }}
                    >
                      <option value="ANUALIDAD">Anualidad</option>
                      <option value="REFRENDO">Refrendo</option>
                      <option value="OTRO">Otro</option>
                    </select>
                    <ChevronDown size={12} strokeWidth={2} style={{
                      position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                      color: "var(--muted)", pointerEvents: "none",
                    }} />
                  </div>
                </label>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.iva}
                    onChange={e => setForm(f => ({ ...f, iva: e.target.checked }))}
                    style={{ width: 15, height: 15, accentColor: "#1B4F91" }}
                  />
                  <span style={{ fontSize: ".85rem", color: "var(--fg)" }}>Incluye IVA (16%)</span>
                </label>

                {editingPlan && (
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={form.activo}
                      onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                      style={{ width: 15, height: 15, accentColor: "#1B4F91" }}
                    />
                    <span style={{ fontSize: ".85rem", color: "var(--fg)" }}>Plan activo</span>
                  </label>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div style={{
              display: "flex", justifyContent: "flex-end", gap: 10,
              padding: "14px 20px 18px",
              borderTop: "1px solid var(--line)",
            }}>
              <button className="btn" onClick={closeModal} disabled={saving}>
                Cancelar
              </button>
              <button className="btn primary" onClick={handleSavePlan} disabled={saving}>
                {saving ? "Guardando..." : editingPlan ? "Guardar cambios" : "Crear plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Plan Card ────────────────────────────────────────────────────
function PlanCard({
  plan,
  onEdit,
  onDelete,
  onToggleActivo,
}: {
  plan: PlanItem
  onEdit: () => void
  onDelete: () => void
  onToggleActivo: () => void
}) {
  const totalSolicitudes = plan.solicitudes.length
  const pendientes = plan.solicitudes.filter(s => s.estado === "PENDIENTE").length

  return (
    <div style={{
      background: "var(--surface)",
      border: `1px solid ${plan.activo ? "var(--line)" : "color-mix(in srgb, var(--line) 70%, transparent)"}`,
      borderRadius: 12,
      padding: 16,
      opacity: plan.activo ? 1 : .65,
      transition: "opacity .2s",
    }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" as const, marginBottom: 4 }}>
            <TipoBadge tipo={plan.tipo} />
            {!plan.activo && (
              <span style={{
                fontSize: ".68rem", fontWeight: 700, color: "var(--muted)",
                background: "var(--surface-3)", borderRadius: 20, padding: "2px 8px",
                letterSpacing: ".05em", textTransform: "uppercase" as const,
              }}>
                Inactivo
              </span>
            )}
          </div>
          <div style={{ fontWeight: 700, fontSize: ".95rem", color: "var(--fg)", lineHeight: 1.3 }}>
            {plan.nombre}
          </div>
          {plan.descripcion && (
            <div style={{ fontSize: ".78rem", color: "var(--muted)", marginTop: 4, lineHeight: 1.4 }}>
              {plan.descripcion}
            </div>
          )}
        </div>
      </div>

      {/* Monto */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "10px 0" }}>
        <span className="font-montserrat" style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--fg)", letterSpacing: "-.02em" }}>
          {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(plan.monto)}
        </span>
        {plan.iva && (
          <span style={{ fontSize: ".76rem", color: "var(--muted)", fontWeight: 500 }}>+ IVA</span>
        )}
      </div>

      {/* Stats */}
      {totalSolicitudes > 0 && (
        <div style={{
          display: "flex", gap: 12, marginBottom: 12,
          padding: "8px 10px", borderRadius: 8, background: "var(--surface-2)",
        }}>
          <div style={{ fontSize: ".76rem", color: "var(--muted)" }}>
            <span style={{ fontWeight: 700, color: "var(--fg)" }}>{totalSolicitudes}</span> solicitud{totalSolicitudes !== 1 ? "es" : ""}
          </div>
          {pendientes > 0 && (
            <div style={{ fontSize: ".76rem", color: "#D97706" }}>
              <span style={{ fontWeight: 700 }}>{pendientes}</span> pendiente{pendientes !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={onToggleActivo}
          className="btn"
          style={{ fontSize: ".76rem", flex: 1 }}
        >
          {plan.activo ? "Desactivar" : "Activar"}
        </button>
        <button onClick={onEdit} className="btn" style={{ padding: "6px 10px" }} title="Editar">
          <Edit2 size={13} strokeWidth={2} />
        </button>
        <button
          onClick={onDelete}
          className="btn"
          style={{ padding: "6px 10px", color: "var(--bad)" }}
          title="Eliminar"
        >
          <Trash2 size={13} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

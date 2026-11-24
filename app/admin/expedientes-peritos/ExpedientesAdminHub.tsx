"use client"

import { useState, useEffect, useCallback } from "react"
import type { PeritoConConteos } from "./page"

// Types 
type Especialidad = { id: string; numero: number; nombre: string; claveRegistro: string }
type Formacion = { id: string; anio: number; mes: string | null; nombre: string; estado: string; orden: number }

const ESTADOS_FORMACION = ["REGISTRADO", "ACREDITADO", "INSTRUCTOR", "POR_VERIFICAR", "NO_PARTICIPO"]

const BADGE: Record<string, { bg: string; color: string; label: string }> = {
 REGISTRADO:    { bg: "#EFF6FF", color: "#1D4ED8", label: "Registrado" },
 ACREDITADO:    { bg: "#ECFDF5", color: "#059669", label: "Acreditado" },
 INSTRUCTOR:    { bg: "#CFFAFE", color: "#0891B2", label: "Instructor" },
 POR_VERIFICAR: { bg: "#FFFBEB", color: "#D97706", label: "Por verificar" },
 NO_PARTICIPO:  { bg: "#F9FAFB", color: "#6B7280", label: "No participó" },
}

// Helper: avatar initials 
function initials(nombre: string) {
  const parts = nombre.trim().split(" ")
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?"
  return ((parts[0][0] ?? "") + (parts[1][0] ?? "")).toUpperCase()
}

// Status badge for perito 
function PeritoEstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { bg: string; color: string }> = {
 ACTIVO:   { bg: "#ECFDF5", color: "#059669" },
 INACTIVO: { bg: "#FEF2F2", color: "#DC2626" },
 SUSPENDIDO: { bg: "#FFFBEB", color: "#D97706" },
  }
  const s = map[estado] ?? { bg: "#F3F4F6", color: "#6B7280" }
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: 11, fontWeight: 600,
      padding: "2px 7px", borderRadius: 20, letterSpacing: 0.3,
    }}>
      {estado}
    </span>
  )
}

// Formación status badge 
function EstadoBadge({ estado }: { estado: string }) {
  const b = BADGE[estado] ?? { bg: "#F3F4F6", color: "#6B7280", label: estado }
  return (
    <span style={{
      background: b.bg, color: b.color, fontSize: 11, fontWeight: 600,
      padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap",
    }}>
      {b.label}
    </span>
  )
}

// Flash message 
function Flash({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      background: ok ? "#ECFDF5" : "#FEF2F2",
      color: ok ? "#059669" : "#DC2626",
      border: `1px solid ${ok ? "#6EE7B7" : "#FCA5A5"}`,
      borderRadius: 8, padding: "9px 14px", fontSize: 13,
      marginBottom: 12, fontWeight: 500,
    }}>
      {msg}
    </div>
  )
}

// 
// Detail panel — full CRUD for a selected perito
// 
function PeritoDetailPanel({ peritoId, peritoNombre }: { peritoId: string; peritoNombre: string }) {
  const [tab, setTab] = useState<"especialidades" | "formacion">("especialidades")
  const [flash, setFlash] = useState<{ msg: string; ok: boolean } | null>(null)

  // Especialidades state
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [loadingEsp, setLoadingEsp] = useState(true)
  const [newEsp, setNewEsp] = useState({ nombre: "", claveRegistro: "" })
  const [addingEsp, setAddingEsp] = useState(false)

  // Formación state
  const [formacion, setFormacion] = useState<Formacion[]>([])
  const [loadingForm, setLoadingForm] = useState(true)
  const [newForm, setNewForm] = useState({ anio: new Date().getFullYear(), mes: "", nombre: "", estado: "REGISTRADO", orden: 0 })
  const [addingForm, setAddingForm] = useState(false)

  const showFlash = (msg: string, ok: boolean) => {
    setFlash({ msg, ok })
    setTimeout(() => setFlash(null), 3500)
  }

  const loadEspecialidades = useCallback(async () => {
    setLoadingEsp(true)
    try {
      const r = await fetch(`/api/admin/peritos/${peritoId}/especialidades`)
      if (r.ok) setEspecialidades(await r.json())
    } finally { setLoadingEsp(false) }
  }, [peritoId])

  const loadFormacion = useCallback(async () => {
    setLoadingForm(true)
    try {
      const r = await fetch(`/api/admin/peritos/${peritoId}/formacion`)
      if (r.ok) setFormacion(await r.json())
    } finally { setLoadingForm(false) }
  }, [peritoId])

  useEffect(() => { loadEspecialidades(); loadFormacion() }, [loadEspecialidades, loadFormacion])

  const addEspecialidad = async () => {
    if (!newEsp.nombre.trim() || !newEsp.claveRegistro.trim()) return
    setAddingEsp(true)
    try {
      const r = await fetch(`/api/admin/peritos/${peritoId}/especialidades`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newEsp),
      })
      if (r.ok) {
        setNewEsp({ nombre: "", claveRegistro: "" })
        await loadEspecialidades()
        showFlash("Especialidad agregada correctamente.", true)
      } else { showFlash("Error al agregar especialidad.", false) }
    } finally { setAddingEsp(false) }
  }

  const deleteEspecialidad = async (id: string) => {
    if (!confirm("¿Eliminar esta especialidad?")) return
    const r = await fetch(`/api/admin/peritos/${peritoId}/especialidades`, {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    })
    if (r.ok) { await loadEspecialidades(); showFlash("Especialidad eliminada.", true) }
    else showFlash("Error al eliminar.", false)
  }

  const addFormacion = async () => {
    if (!newForm.nombre.trim()) return
    setAddingForm(true)
    try {
      const r = await fetch(`/api/admin/peritos/${peritoId}/formacion`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newForm),
      })
      if (r.ok) {
        setNewForm({ anio: new Date().getFullYear(), mes: "", nombre: "", estado: "REGISTRADO", orden: 0 })
        await loadFormacion()
        showFlash("Curso/actividad agregado correctamente.", true)
      } else { showFlash("Error al agregar formación.", false) }
    } finally { setAddingForm(false) }
  }

  const deleteFormacion = async (id: string) => {
    if (!confirm("¿Eliminar este registro de formación?")) return
    const r = await fetch(`/api/admin/peritos/${peritoId}/formacion`, {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    })
    if (r.ok) { await loadFormacion(); showFlash("Registro eliminado.", true) }
    else showFlash("Error al eliminar.", false)
  }

  const byYear = formacion.reduce<Record<number, Formacion[]>>((acc, f) => {
    ;(acc[f.anio] ??= []).push(f)
    return acc
  }, {})

  const inputStyle: React.CSSProperties = {
    border: "1px solid #E5E7EB", borderRadius: 7, padding: "7px 11px",
    fontSize: 13, background: "#fff", outline: "none", width: "100%",
  }
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" }
  const btnPrimary: React.CSSProperties = {
    background: "#1D4ED8", color: "#fff", border: "none", borderRadius: 7,
    padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
    whiteSpace: "nowrap",
  }
  const btnDanger: React.CSSProperties = {
    background: "none", border: "1px solid #FCA5A5", color: "#DC2626",
    borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer",
    fontWeight: 500,
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0D2060 0%, #1D4ED8 100%)",
        padding: "20px 28px", borderRadius: "12px 12px 0 0",
      }}>
        <p style={{ color: "#93C5FD", fontSize: 11, fontWeight: 600, letterSpacing: 1, margin: 0 }}>
 EXPEDIENTE PROFESIONAL
        </p>
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "4px 0 0" }}>{peritoNombre}</h2>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid #E5E7EB", background: "#F8FAFC" }}>
        {(["especialidades", "formacion"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "12px 22px", fontSize: 13, fontWeight: 600, border: "none",
            background: "none", cursor: "pointer",
            color: tab === t ? "#1D4ED8" : "#6B7280",
            borderBottom: tab === t ? "2px solid #1D4ED8" : "2px solid transparent",
            marginBottom: -2,
          }}>
            {t === "especialidades" ? "Pericias y Especialidades" : "Formación y Participación"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto", background: "#fff", borderRadius: "0 0 12px 12px" }}>
        {flash && <Flash msg={flash.msg} ok={flash.ok} />}

        {/* Especialidades Tab  */}
        {tab === "especialidades" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Add form */}
            <div style={{
              background: "#F8FAFC", border: "1px solid #E5E7EB", borderRadius: 10, padding: 18,
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 12, letterSpacing: 0.5 }}>
 AGREGAR ESPECIALIDAD / PERICIA
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
                <div>
                  <label style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>Nombre de especialidad</label>
                  <input style={inputStyle} placeholder="Ej. Accidentología Vial"
                    value={newEsp.nombre} onChange={e => setNewEsp(p => ({ ...p, nombre: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>Clave de registro</label>
                  <input style={inputStyle} placeholder="Ej. VER-15-001"
                    value={newEsp.claveRegistro} onChange={e => setNewEsp(p => ({ ...p, claveRegistro: e.target.value }))} />
                </div>
                <button onClick={addEspecialidad} disabled={addingEsp} style={btnPrimary}>
                  {addingEsp ? "Guardando..." : "+ Agregar"}
                </button>
              </div>
            </div>

            {/* Table */}
            {loadingEsp ? (
              <p style={{ color: "#9CA3AF", fontSize: 13 }}>Cargando...</p>
            ) : especialidades.length === 0 ? (
              <p style={{ color: "#9CA3AF", fontSize: 13 }}>No hay especialidades registradas.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#0D2060" }}>
                      {["NÚM", "ESPECIALIDAD / PERICIA", "CLAVE DE REGISTRO", ""].map(h => (
                        <th key={h} style={{
                          color: "#fff", fontWeight: 600, padding: "10px 14px",
                          textAlign: h === "" ? "center" : "left", fontSize: 12, letterSpacing: 0.5,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {especialidades.map((e, i) => (
                      <tr key={e.id} style={{ background: i % 2 === 0 ? "#fff" : "#F8FAFC" }}>
                        <td style={{ padding: "10px 14px", color: "#374151", fontWeight: 600 }}>{e.numero}</td>
                        <td style={{ padding: "10px 14px", color: "#111827" }}>{e.nombre}</td>
                        <td style={{ padding: "10px 14px", color: "#1D4ED8", fontWeight: 600 }}>{e.claveRegistro}</td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <button onClick={() => deleteEspecialidad(e.id)} style={btnDanger}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Formación Tab  */}
        {tab === "formacion" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Add form */}
            <div style={{
              background: "#F8FAFC", border: "1px solid #E5E7EB", borderRadius: 10, padding: 18,
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 12, letterSpacing: 0.5 }}>
 AGREGAR CURSO / ACTIVIDAD DE FORMACIÓN
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>Año</label>
                  <input type="number" style={inputStyle} value={newForm.anio}
                    onChange={e => setNewForm(p => ({ ...p, anio: parseInt(e.target.value) || p.anio }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>Nombre del curso / actividad</label>
                  <input style={inputStyle} placeholder="Ej. Actualización en Criminalística"
                    value={newForm.nombre} onChange={e => setNewForm(p => ({ ...p, nombre: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>Mes (opcional)</label>
                  <input style={inputStyle} placeholder="Ej. Marzo"
                    value={newForm.mes} onChange={e => setNewForm(p => ({ ...p, mes: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
                <div>
                  <label style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>Estado</label>
                  <select style={selectStyle} value={newForm.estado}
                    onChange={e => setNewForm(p => ({ ...p, estado: e.target.value }))}>
                    {ESTADOS_FORMACION.map(s => <option key={s} value={s}>{BADGE[s]?.label ?? s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>Orden (opcional)</label>
                  <input type="number" style={inputStyle} value={newForm.orden}
                    onChange={e => setNewForm(p => ({ ...p, orden: parseInt(e.target.value) || 0 }))} />
                </div>
                <button onClick={addFormacion} disabled={addingForm} style={btnPrimary}>
                  {addingForm ? "Guardando..." : "+ Agregar"}
                </button>
              </div>
            </div>

            {/* By year */}
            {loadingForm ? (
              <p style={{ color: "#9CA3AF", fontSize: 13 }}>Cargando...</p>
            ) : formacion.length === 0 ? (
              <p style={{ color: "#9CA3AF", fontSize: 13 }}>No hay registros de formación.</p>
            ) : (
 Object.entries(byYear).sort(([a], [b]) => Number(b) - Number(a)).map(([year, items]) => (
                <div key={year}>
                  <div style={{
                    background: "#0D2060", color: "#fff", padding: "8px 16px",
                    borderRadius: "8px 8px 0 0", display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>FORMACIÓN {year}</span>
                    <span style={{
                      background: "rgba(255,255,255,0.15)", color: "#E0E7FF",
                      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                    }}>{items.length} registro{items.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div style={{ border: "1px solid #E5E7EB", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
                    {items.sort((a, b) => a.orden - b.orden).map((f, i) => (
                      <div key={f.id} style={{
                        display: "grid", gridTemplateColumns: "auto 1fr auto auto",
                        alignItems: "center", gap: 12, padding: "11px 16px",
                        background: i % 2 === 0 ? "#fff" : "#F8FAFC",
                        borderTop: i > 0 ? "1px solid #F3F4F6" : "none",
                      }}>
                        <span style={{ color: "#6B7280", fontSize: 12, fontWeight: 500, minWidth: 60 }}>
                          {f.mes ?? "—"}
                        </span>
                        <span style={{ fontSize: 13, color: "#111827" }}>{f.nombre}</span>
                        <EstadoBadge estado={f.estado} />
                        <button onClick={() => deleteFormacion(f.id)} style={btnDanger}>Eliminar</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// 
// Main Hub — master-detail
// 
export default function ExpedientesAdminHub({ peritos }: { peritos: PeritoConConteos[] }) {
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = peritos.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.especialidad ?? "").toLowerCase().includes(search.toLowerCase()) ||
 String(p.numeroPerito ?? "").includes(search)
  )

  const selected = peritos.find(p => p.id === selectedId) ?? null

  return (
    <div style={{
      display: "flex", gap: 0, border: "1px solid #E5E7EB", borderRadius: 14,
      overflow: "hidden", minHeight: 620, background: "#fff",
      boxShadow: "0 1px 8px rgba(0,0,0,0.07)",
    }}>
      {/* Left Panel  */}
      <div style={{
        width: 320, minWidth: 280, borderRight: "1px solid #E5E7EB",
        display: "flex", flexDirection: "column", background: "#F8FAFC",
      }}>
        {/* Search */}
        <div style={{ padding: "16px 14px 10px", borderBottom: "1px solid #E5E7EB" }}>
          <div style={{ position: "relative" }}>
            <input
              placeholder="Buscar perito..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", border: "1px solid #D1D5DB", borderRadius: 8,
                padding: "8px 12px 8px 34px", fontSize: 13, background: "#fff",
                outline: "none", boxSizing: "border-box",
              }}
            />
            <span style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              color: "#9CA3AF", fontSize: 15, pointerEvents: "none",
            }}>⌕</span>
          </div>
          <p style={{ fontSize: 11, color: "#9CA3AF", margin: "6px 0 0", fontWeight: 500 }}>
            {filtered.length} perito{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <p style={{ color: "#9CA3AF", fontSize: 13, padding: "20px 16px" }}>Sin resultados.</p>
          ) : (
            filtered.map(p => {
              const isSelected = p.id === selectedId
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  style={{
                    width: "100%", textAlign: "left", border: "none",
                    background: isSelected ? "#EEF2FF" : "transparent",
                    borderLeft: isSelected ? "3px solid #1D4ED8" : "3px solid transparent",
                    padding: "13px 14px", cursor: "pointer",
                    borderBottom: "1px solid #F3F4F6",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                      background: isSelected ? "#1D4ED8" : "#0D2060",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 14, fontWeight: 700,
                    }}>
                      {initials(p.nombre)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 13, fontWeight: 600, color: "#111827",
                        margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>{p.nombre}</p>
                      <p style={{ fontSize: 11, color: "#6B7280", margin: "2px 0 0" }}>
                        {p.numeroPerito ? `CIME-PER-${String(p.numeroPerito).padStart(3, "0")}` : "Sin número"}
                        {p.especialidad ? ` · ${p.especialidad}` : ""}
                      </p>
                      <div style={{ display: "flex", gap: 6, marginTop: 5, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{
                          background: "#EFF6FF", color: "#1D4ED8", fontSize: 10,
                          fontWeight: 600, padding: "2px 7px", borderRadius: 20,
                        }}>
                          {p._count.especialidadesPerito} pericias
                        </span>
                        <span style={{
                          background: "#F0FDF4", color: "#15803D", fontSize: 10,
                          fontWeight: 600, padding: "2px 7px", borderRadius: 20,
                        }}>
                          {p._count.formacionPerito} cursos
                        </span>
                        <PeritoEstadoBadge estado={p.estado} />
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Right Panel  */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!selected ? (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 14, color: "#9CA3AF",
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", background: "#F3F4F6",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
            }}>
              
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#6B7280", margin: 0 }}>
 Selecciona un perito
              </p>
              <p style={{ fontSize: 13, color: "#9CA3AF", margin: "4px 0 0" }}>
 Elige un perito de la lista para gestionar su expediente profesional.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <PeritoDetailPanel
              key={selected.id}
              peritoId={selected.id}
              peritoNombre={selected.nombre}
            />
          </div>
        )}
      </div>
    </div>
  )
}

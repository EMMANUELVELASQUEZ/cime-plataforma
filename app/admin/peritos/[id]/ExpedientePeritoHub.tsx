"use client"
import { useState, useEffect } from "react"

type Especialidad = { id: string; numero: number; nombre: string; claveRegistro: string }
type FormacionItem = { id: string; anio: number; mes: string | null; nombre: string; estado: string; orden: number }

const ESTADOS_FORMACION = [
  { value: "REGISTRADO",    label: "Registrado" },
  { value: "ACREDITADO",    label: "Acreditado" },
  { value: "INSTRUCTOR",    label: "Instructor" },
  { value: "POR_VERIFICAR", label: "Acreditación por verificar" },
  { value: "NO_PARTICIPO",  label: "No participó" },
]

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre","Diplomado","Jun·sep","Seminario"]

const ESTADO_COLOR: Record<string, { color: string; bg: string }> = {
  REGISTRADO:    { color: "#1D4ED8", bg: "#EFF6FF" },
  ACREDITADO:    { color: "#059669", bg: "#ECFDF5" },
  INSTRUCTOR:    { color: "#0891B2", bg: "#CFFAFE" },
  POR_VERIFICAR: { color: "#D97706", bg: "#FFFBEB" },
  NO_PARTICIPO:  { color: "#6B7280", bg: "#F9FAFB" },
}

export default function ExpedientePeritoHub({ peritoId, peritoNombre }: { peritoId: string; peritoNombre: string }) {
  const [tab, setTab] = useState<"especialidades" | "formacion">("especialidades")
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [formacion, setFormacion] = useState<FormacionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  // Form states — Especialidad
  const [espNombre, setEspNombre] = useState("")
  const [espClave, setEspClave] = useState("")

  // Form states — Formación
  const [fAnio, setFAnio] = useState("2026")
  const [fMes, setFMes] = useState("")
  const [fNombre, setFNombre] = useState("")
  const [fEstado, setFEstado] = useState("REGISTRADO")

  function flash(text: string, ok = true) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 3000)
  }

  async function reload() {
    setLoading(true)
    try {
      const [eRes, fRes] = await Promise.all([
        fetch(`/api/admin/peritos/${peritoId}/especialidades`),
        fetch(`/api/admin/peritos/${peritoId}/formacion`),
      ])
      setEspecialidades(await eRes.json())
      setFormacion(await fRes.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [peritoId])

  async function addEspecialidad(e: React.FormEvent) {
    e.preventDefault()
    if (!espNombre.trim() || !espClave.trim()) return
    setSaving(true)
    try {
      const nextNum = especialidades.length > 0 ? Math.max(...especialidades.map(e => e.numero)) + 1 : 1
      const res = await fetch(`/api/admin/peritos/${peritoId}/especialidades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: nextNum, nombre: espNombre.trim(), claveRegistro: espClave.trim() }),
      })
      if (res.ok) {
        setEspNombre(""); setEspClave("")
        await reload()
        flash("Especialidad agregada")
      } else {
        flash("Error al agregar", false)
      }
    } finally { setSaving(false) }
  }

  async function deleteEspecialidad(id: string) {
    if (!confirm("¿Eliminar esta especialidad?")) return
    await fetch(`/api/admin/peritos/${peritoId}/especialidades`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    await reload()
    flash("Especialidad eliminada")
  }

  async function addFormacion(e: React.FormEvent) {
    e.preventDefault()
    if (!fNombre.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/peritos/${peritoId}/formacion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anio: Number(fAnio), mes: fMes || null, nombre: fNombre.trim(), estado: fEstado }),
      })
      if (res.ok) {
        setFNombre(""); setFMes("")
        await reload()
        flash("Curso de formación agregado")
      } else {
        flash("Error al agregar", false)
      }
    } finally { setSaving(false) }
  }

  async function deleteFormacion(id: string) {
    if (!confirm("¿Eliminar este registro de formación?")) return
    await fetch(`/api/admin/peritos/${peritoId}/formacion`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    await reload()
    flash("Registro eliminado")
  }

  const INPUT: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 7,
    border: "1px solid var(--line)", background: "var(--surface-2)",
    color: "var(--fg)", fontSize: ".88rem", fontFamily: "inherit",
    boxSizing: "border-box",
  }
  const BTN: React.CSSProperties = {
    padding: "9px 18px", borderRadius: 7, border: "none",
    background: "#0D2060", color: "#fff",
    fontSize: ".87rem", fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  }
  const BTN_DEL: React.CSSProperties = {
    padding: "5px 10px", borderRadius: 6, border: "1px solid var(--bad-bg)",
    background: "var(--bad-bg)", color: "var(--bad)",
    fontSize: ".8rem", fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  }

  const f2025 = formacion.filter(f => f.anio === 2025)
  const f2026 = formacion.filter(f => f.anio === 2026)

  return (
    <div style={{ marginTop: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 4px" }}>Expediente Profesional</h2>
        <p style={{ fontSize: ".84rem", color: "var(--muted)", margin: 0 }}>
          Gestionar pericias, especialidades y formación de <strong>{peritoNombre}</strong>
        </p>
      </div>

      {/* Flash message */}
      {msg && (
        <div style={{
          marginBottom: 16, padding: "10px 16px", borderRadius: 8,
          background: msg.ok ? "var(--ok-bg)" : "var(--bad-bg)",
          color: msg.ok ? "var(--ok)" : "var(--bad)",
          fontSize: ".85rem", fontWeight: 500,
          border: `1px solid ${msg.ok ? "color-mix(in srgb, var(--ok) 25%, var(--line))" : "color-mix(in srgb, var(--bad) 25%, var(--line))"}`,
        }}>
          {msg.text}
        </div>
      )}

      {/* Tab switcher */}
      <div style={{
        display: "inline-flex", gap: 4, padding: 4,
        background: "var(--surface-2)", border: "1px solid var(--line)",
        borderRadius: 10, marginBottom: 20,
      }}>
        {[
          { key: "especialidades", label: "Pericias y Especialidades" },
          { key: "formacion", label: "Formación y Participación" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} style={{
            padding: "7px 16px", borderRadius: 7, border: "none",
            cursor: "pointer", fontFamily: "inherit", fontSize: ".84rem", fontWeight: 600,
            background: tab === t.key ? "#0D2060" : "transparent",
            color: tab === t.key ? "#fff" : "var(--muted)",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)" }}>Cargando…</div>
      ) : (
        <>
          {/* ── Tab: Especialidades ── */}
          {tab === "especialidades" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Add form */}
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: ".9rem", fontWeight: 700, margin: "0 0 14px" }}>Agregar especialidad / pericia</h3>
                <form onSubmit={addEspecialidad} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
                  <div>
                    <label style={{ display: "block", fontSize: ".75rem", fontWeight: 600, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Nombre de la especialidad</label>
                    <input style={INPUT} value={espNombre} onChange={e => setEspNombre(e.target.value)} placeholder="Perito Corresponsable de Obra..." required />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: ".75rem", fontWeight: 600, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Clave de registro</label>
                    <input style={INPUT} value={espClave} onChange={e => setEspClave(e.target.value)} placeholder="PI-01-2026-15" required />
                  </div>
                  <button type="submit" style={BTN} disabled={saving}>
                    {saving ? "…" : "+ Agregar"}
                  </button>
                </form>
              </div>

              {/* List */}
              <div className="card" style={{ overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
                  <h3 style={{ fontSize: ".9rem", fontWeight: 700, margin: 0 }}>
                    Especialidades registradas <span style={{ color: "var(--muted)", fontWeight: 400 }}>({especialidades.length})</span>
                  </h3>
                </div>
                {especialidades.length === 0 ? (
                  <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontSize: ".86rem" }}>
                    Sin especialidades. Agrega la primera arriba.
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#0D2060" }}>
                        <th style={{ padding: "10px 16px", fontSize: ".67rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.75)", textAlign: "left", width: 60 }}>NÚM.</th>
                        <th style={{ padding: "10px 16px", fontSize: ".67rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.75)", textAlign: "left" }}>ESPECIALIDAD</th>
                        <th style={{ padding: "10px 16px", fontSize: ".67rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.75)", textAlign: "left" }}>CLAVE</th>
                        <th style={{ padding: "10px 16px", width: 80 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {especialidades.map((e, idx) => (
                        <tr key={e.id} style={{ background: idx % 2 === 0 ? "var(--surface)" : "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
                          <td style={{ padding: "11px 16px", fontFamily: "monospace", fontSize: ".82rem", fontWeight: 700, color: "#0D2060" }}>
                            {String(e.numero).padStart(2, "0")}
                          </td>
                          <td style={{ padding: "11px 16px", fontSize: ".87rem", color: "var(--fg)" }}>{e.nombre}</td>
                          <td style={{ padding: "11px 16px", fontFamily: "monospace", fontSize: ".8rem", fontWeight: 700, color: "#1D4ED8" }}>{e.claveRegistro}</td>
                          <td style={{ padding: "11px 16px", textAlign: "right" }}>
                            <button onClick={() => deleteEspecialidad(e.id)} style={BTN_DEL}>Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Formación ── */}
          {tab === "formacion" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Add form */}
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: ".9rem", fontWeight: 700, margin: "0 0 14px" }}>Agregar curso de formación</h3>
                <form onSubmit={addFormacion} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "120px 140px 1fr", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: ".75rem", fontWeight: 600, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Año</label>
                      <select style={{ ...INPUT }} value={fAnio} onChange={e => setFAnio(e.target.value)}>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: ".75rem", fontWeight: 600, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Mes</label>
                      <select style={{ ...INPUT }} value={fMes} onChange={e => setFMes(e.target.value)}>
                        <option value="">— Sin mes —</option>
                        {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: ".75rem", fontWeight: 600, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Estado</label>
                      <select style={{ ...INPUT }} value={fEstado} onChange={e => setFEstado(e.target.value)}>
                        {ESTADOS_FORMACION.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" }}>
                    <div>
                      <label style={{ display: "block", fontSize: ".75rem", fontWeight: 600, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Nombre del curso / actividad</label>
                      <input style={INPUT} value={fNombre} onChange={e => setFNombre(e.target.value)} placeholder="Marco jurídico y legal del perito profesional" required />
                    </div>
                    <button type="submit" style={{ ...BTN, whiteSpace: "nowrap" }} disabled={saving}>
                      {saving ? "…" : "+ Agregar"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Lists by year */}
              {[{ year: 2025, items: f2025 }, { year: 2026, items: f2026 }].map(({ year, items }) => (
                <div key={year} className="card" style={{ overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3 style={{ fontSize: ".9rem", fontWeight: 700, margin: 0 }}>
                      Formación {year} <span style={{ color: "var(--muted)", fontWeight: 400 }}>({items.length} registros)</span>
                    </h3>
                    {items.length > 0 && (
                      <span style={{ fontSize: ".76rem", color: "var(--muted)" }}>
                        {items.filter(i => i.estado !== "NO_PARTICIPO").length} participó · {items.filter(i => i.estado === "NO_PARTICIPO").length} no participó
                      </span>
                    )}
                  </div>
                  {items.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "var(--muted)", fontSize: ".86rem" }}>
                      Sin registros para {year}.
                    </div>
                  ) : (
                    <div>
                      {items.map((f, idx) => {
                        const ec = ESTADO_COLOR[f.estado] ?? ESTADO_COLOR.REGISTRADO
                        return (
                          <div key={f.id} style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "11px 16px",
                            borderBottom: idx < items.length - 1 ? "1px solid var(--line)" : "none",
                            background: idx % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
                          }}>
                            {f.mes && (
                              <span style={{ fontFamily: "var(--f-data)", fontSize: ".72rem", fontWeight: 700, color: "#1D4ED8", width: 90, flexShrink: 0 }}>
                                {f.mes}
                              </span>
                            )}
                            <span style={{ flex: 1, fontSize: ".86rem", color: "var(--fg)" }}>{f.nombre}</span>
                            <span style={{
                              padding: "2px 9px", borderRadius: 20,
                              fontSize: ".68rem", fontWeight: 700,
                              color: ec.color, background: ec.bg,
                              border: `1px solid ${ec.color}33`, flexShrink: 0,
                            }}>
                              {ESTADOS_FORMACION.find(e => e.value === f.estado)?.label ?? f.estado}
                            </span>
                            <button onClick={() => deleteFormacion(f.id)} style={{ ...BTN_DEL, flexShrink: 0 }}>✕</button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

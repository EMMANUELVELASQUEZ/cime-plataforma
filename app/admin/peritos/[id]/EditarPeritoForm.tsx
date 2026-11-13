"use client"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const ESPS = [
  "Ingeniería Eléctrica","Ingeniería Mecánica","Ingeniería Mecánica Eléctrica",
  "Ingeniería Electromecánica","Ingeniería en Energías Renovables","Ingeniería Industrial Eléctrica",
]
const CIUDADES = ["Veracruz","Boca del Río","Xalapa","Coatzacoalcos","Córdoba","Orizaba","Poza Rica","Tuxpan","Minatitlán","Alvarado","Pánuco","San Andrés Tuxtla"]

function calcStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0
  if (pwd.length >= 12) score++
  if (pwd.length >= 16) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[a-z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  if (score <= 2) return { score, label: "Débil",    color: "#ef4444" }
  if (score <= 4) return { score, label: "Regular",  color: "#f59e0b" }
  if (score === 5) return { score, label: "Fuerte",  color: "#3b82f6" }
  return { score, label: "Muy fuerte", color: "#10b981" }
}

function generatePassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  const lower = "abcdefghjkmnpqrstuvwxyz"
  const nums  = "23456789"
  const syms  = "!@#$%^&*()-_=+[]{}|;"
  const pool  = upper + lower + nums + syms
  const required = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    nums[Math.floor(Math.random()  * nums.length)],
    syms[Math.floor(Math.random()  * syms.length)],
  ]
  const rest = Array.from({ length: 10 }, () => pool[Math.floor(Math.random() * pool.length)])
  return [...required, ...rest].sort(() => Math.random() - 0.5).join("")
}

interface PeritoData {
  id: string; nombre: string; correo: string; telefono?: string;
  numeroPerito?: string; especialidad?: string; ciudad?: string; cedula?: string;
  estado: string; alta: number; vigencia?: string; horas: number; horasMeta: number;
}

export default function EditarPeritoForm({ perito }: { perito: PeritoData }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")
  const [success, setSuccess] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [copied,  setCopied]  = useState(false)

  const [form, setForm] = useState({
    nombre:      perito.nombre,
    correo:      perito.correo,
    telefono:    perito.telefono ?? "",
    numeroPerito: perito.numeroPerito ?? "",
    especialidad: perito.especialidad ?? "",
    ciudad:      perito.ciudad ?? "",
    cedula:      perito.cedula ?? "",
    estado:      perito.estado,
    alta:        String(perito.alta),
    vigencia:    perito.vigencia ?? "",
    horas:       String(perito.horas),
    horasMeta:   String(perito.horasMeta),
    password:    "",
  })

  const strength = calcStrength(form.password)
  function set(key: string, val: string) { setForm(prev => ({ ...prev, [key]: val })) }

  const generate = useCallback(() => { set("password", generatePassword()); setCopied(false) }, [])
  async function copyPwd() {
    if (!form.password) return
    await navigator.clipboard.writeText(form.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(""); setSuccess("")
    if (form.password && form.password.length < 12) {
      setError("La nueva contraseña debe tener al menos 12 caracteres.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/peritos/${perito.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          alta: parseInt(form.alta),
          horas: parseInt(form.horas),
          horasMeta: parseInt(form.horasMeta),
          password: form.password || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error al guardar."); return }
      setSuccess("Cambios guardados.")
      setTimeout(() => router.push("/admin/peritos"), 1200)
    } catch {
      setError("Error de conexión.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid" style={{ gap: 20 }}>
        <div className="card">
          <div className="card-h"><h2>Datos personales</h2></div>
          <div className="card-b" style={{ display: "grid", gap: 20 }}>
            {error && <div className="form-err">{error}</div>}
            {success && <div className="form-ok">{success}</div>}
            <div className="form-grid">
              <div className="field" style={{ gridColumn: "1/-1" }}>
                <label>Nombre completo</label>
                <input className="input" value={form.nombre} onChange={e => set("nombre", e.target.value)} required />
              </div>
              <div className="field">
                <label>Correo</label>
                <input className="input" type="email" value={form.correo} onChange={e => set("correo", e.target.value)} required />
              </div>
              <div className="field">
                <label>Teléfono</label>
                <input className="input" value={form.telefono} onChange={e => set("telefono", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h"><h2>Datos del perito</h2></div>
          <div className="card-b">
            <div className="form-grid">
              <div className="field">
                <label>Número de perito</label>
                <input className="input" value={form.numeroPerito} onChange={e => set("numeroPerito", e.target.value)} />
              </div>
              <div className="field">
                <label>Cédula profesional</label>
                <input className="input" value={form.cedula} onChange={e => set("cedula", e.target.value)} />
              </div>
              <div className="field">
                <label>Especialidad</label>
                <input className="input" list="esps-e" value={form.especialidad} onChange={e => set("especialidad", e.target.value)} autoComplete="off" />
                <datalist id="esps-e">{ESPS.map(e => <option key={e} value={e} />)}</datalist>
              </div>
              <div className="field">
                <label>Ciudad</label>
                <select className="input" value={form.ciudad} onChange={e => set("ciudad", e.target.value)}>
                  <option value="">—</option>
                  {CIUDADES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Año de alta</label>
                <input className="input" type="number" value={form.alta} onChange={e => set("alta", e.target.value)} />
              </div>
              <div className="field">
                <label>Vigencia</label>
                <input className="input" type="date" value={form.vigencia} onChange={e => set("vigencia", e.target.value)} />
              </div>
              <div className="field">
                <label>Estatus</label>
                <select className="input" value={form.estado} onChange={e => set("estado", e.target.value)}>
                  <option value="VIGENTE">Vigente</option>
                  <option value="POR_RENOVAR">Por renovar</option>
                  <option value="SUSPENDIDO">Suspendido</option>
                </select>
              </div>
              <div className="field">
                <label>Horas acreditadas</label>
                <input className="input" type="number" value={form.horas} onChange={e => set("horas", e.target.value)} />
              </div>
              <div className="field">
                <label>Meta de horas</label>
                <input className="input" type="number" value={form.horasMeta} onChange={e => set("horasMeta", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Password change */}
        <div className="card">
          <div className="card-h">
            <h2>Cambiar contraseña</h2>
            <span className="chip nodot" style={{ color: "var(--muted)", background: "var(--surface-raised)" }}>Dejar en blanco para no cambiar</span>
          </div>
          <div className="card-b">
            <div className="field">
              <label>Nueva contraseña</label>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <input className="input" type={showPwd ? "text" : "password"} value={form.password}
                    onChange={e => set("password", e.target.value)} placeholder="Mínimo 12 caracteres"
                    style={{ paddingRight: 40, fontFamily: showPwd ? "monospace" : undefined }} />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                    <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      {showPwd ? <><path d="M17.94 17.94a10.07 10.07 0 0 1-5.94 1.94C5 20 1 12 1 12a18.09 18.09 0 0 1 2.77-3.47" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                    </svg>
                  </button>
                </div>
                <button type="button" className="btn" onClick={generate} title="Generar contraseña segura">
                  <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
                </button>
                <button type="button" className="btn" onClick={copyPwd}
                  style={{ background: copied ? "#10b981" : undefined, color: copied ? "#fff" : undefined }}>
                  {copied ? "✓" : (
                    <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z" /><path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" /></svg>
                  )}
                </button>
              </div>
              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div className="meter" style={{ height: 4 }}>
                    <i style={{ width: `${Math.round(strength.score / 6 * 100)}%`, background: strength.color }} />
                  </div>
                  <span style={{ fontSize: ".75rem", color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Link href="/admin/peritos" className="btn">Cancelar</Link>
          <button className="btn primary" type="submit" disabled={loading} style={{ minWidth: 140 }}>
            {loading ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </form>
  )
}

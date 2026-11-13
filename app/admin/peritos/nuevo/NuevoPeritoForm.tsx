"use client"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const ESPS = [
  "Ingeniería Eléctrica","Ingeniería Mecánica","Ingeniería Mecánica Eléctrica",
  "Ingeniería Electromecánica","Ingeniería en Energías Renovables",
  "Ingeniería Industrial Eléctrica","Ingeniería en Sistemas Eléctricos de Potencia",
  "Ingeniería en Automatización y Control","Ingeniería en Telecomunicaciones",
  "Ingeniería Biomédica","Ingeniería en Robótica e Inteligencia Artificial",
  "Ingeniería Civil","Ingeniería Industrial","Ingeniería Química","Ingeniería en Computación",
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

function generatePassword(opts: { upper: boolean; lower: boolean; nums: boolean; syms: boolean; length: number }) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  const lower = "abcdefghjkmnpqrstuvwxyz"
  const nums  = "23456789"
  const syms  = "!@#$%^&*()-_=+[]{}|;:,.<>?"

  let pool = ""
  const required: string[] = []

  if (opts.upper) { pool += upper; required.push(upper[Math.floor(Math.random() * upper.length)]) }
  if (opts.lower) { pool += lower; required.push(lower[Math.floor(Math.random() * lower.length)]) }
  if (opts.nums)  { pool += nums;  required.push(nums[Math.floor(Math.random()  * nums.length)])  }
  if (opts.syms)  { pool += syms;  required.push(syms[Math.floor(Math.random()  * syms.length)])  }

  if (!pool) pool = upper + lower + nums

  const rest = Array.from({ length: opts.length - required.length }, () =>
    pool[Math.floor(Math.random() * pool.length)]
  )

  return [...required, ...rest]
    .sort(() => Math.random() - 0.5)
    .join("")
}

export default function NuevoPeritoForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")
  const [success, setSuccess] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [copied,  setCopied]  = useState(false)
  const [pwdOpts, setPwdOpts] = useState({ upper: true, lower: true, nums: true, syms: true, length: 14 })

  const [form, setForm] = useState({
    nombre: "", correo: "", password: "", numeroPerito: "",
    especialidad: "", ciudad: "", cedula: "", telefono: "",
    estado: "VIGENTE", alta: new Date().getFullYear().toString(),
    horasMeta: "60", vigencia: "",
  })

  const strength = calcStrength(form.password)

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const generate = useCallback(() => {
    const pwd = generatePassword(pwdOpts)
    set("password", pwd)
    setCopied(false)
  }, [pwdOpts])

  async function copyPwd() {
    if (!form.password) return
    await navigator.clipboard.writeText(form.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(""); setSuccess("")
    if (!form.nombre || !form.correo || !form.password) {
      setError("Nombre, correo y contraseña son obligatorios.")
      return
    }
    if (form.password.length < 12) {
      setError("La contraseña debe tener al menos 12 caracteres.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/admin/peritos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, alta: parseInt(form.alta), horasMeta: parseInt(form.horasMeta) }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error al crear la cuenta."); return }
      setSuccess(`Cuenta de perito creada para ${form.nombre}.`)
      setTimeout(() => router.push("/admin/peritos"), 1500)
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid" style={{ gap: 20 }}>

        {/* Datos personales */}
        <div className="card">
          <div className="card-h">
            <h2>Datos personales</h2>
            <span className="chip nodot info">Obligatorio: nombre, correo y contraseña</span>
          </div>
          <div className="card-b" style={{ display: "grid", gap: 20 }}>
            {error && (
              <div className="form-err" role="alert">
                <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" /><path d="M12 16h.01" /></svg>
                {error}
              </div>
            )}
            {success && (
              <div className="form-ok" role="status">
                <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>
                {success}
              </div>
            )}
            <div className="form-grid">
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="nombre">Nombre completo *</label>
                <input className="input" id="nombre" placeholder="Ej. Ing. Ana García Ruiz" value={form.nombre} onChange={e => set("nombre", e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="correo">Correo electrónico *</label>
                <input className="input" id="correo" type="email" placeholder="correo@ejemplo.mx" value={form.correo} onChange={e => set("correo", e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="telefono">Teléfono</label>
                <input className="input" id="telefono" placeholder="229 000 0000" value={form.telefono} onChange={e => set("telefono", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Datos del perito */}
        <div className="card">
          <div className="card-h"><h2>Datos del perito</h2></div>
          <div className="card-b" style={{ display: "grid", gap: 20 }}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="numeroPerito">Número de perito</label>
                <input className="input" id="numeroPerito" placeholder="Ej. 0001" value={form.numeroPerito} onChange={e => set("numeroPerito", e.target.value)} />
                <span className="hint">Se mostrará como CIME-PER-{form.numeroPerito || "0001"}</span>
              </div>
              <div className="field">
                <label htmlFor="cedula">Cédula profesional</label>
                <input className="input" id="cedula" placeholder="Número de cédula SEP" value={form.cedula} onChange={e => set("cedula", e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="especialidad">Especialidad</label>
                <input className="input" id="especialidad" list="esps-list" value={form.especialidad} onChange={e => set("especialidad", e.target.value)} placeholder="Escribe o selecciona" autoComplete="off" />
                <datalist id="esps-list">{ESPS.map(e => <option key={e} value={e} />)}</datalist>
              </div>
              <div className="field">
                <label htmlFor="ciudad">Ciudad</label>
                <select className="input" id="ciudad" value={form.ciudad} onChange={e => set("ciudad", e.target.value)}>
                  <option value="">Seleccionar ciudad</option>
                  {CIUDADES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="alta">Año de alta</label>
                <input className="input" id="alta" type="number" min="1990" max="2030" value={form.alta} onChange={e => set("alta", e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="vigencia">Vigencia</label>
                <input className="input" id="vigencia" type="date" value={form.vigencia} onChange={e => set("vigencia", e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="estado">Estatus inicial</label>
                <select className="input" id="estado" value={form.estado} onChange={e => set("estado", e.target.value)}>
                  <option value="VIGENTE">Vigente</option>
                  <option value="POR_RENOVAR">Por renovar</option>
                  <option value="SUSPENDIDO">Suspendido</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="horasMeta">Meta de horas anuales</label>
                <input className="input" id="horasMeta" type="number" min="1" max="200" value={form.horasMeta} onChange={e => set("horasMeta", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Contraseña profesional */}
        <div className="card">
          <div className="card-h">
            <h2>Credenciales de acceso</h2>
            <span className="chip nodot" style={{ background: "#0D206018", color: "#0D2060" }}>Mínimo 12 caracteres</span>
          </div>
          <div className="card-b" style={{ display: "grid", gap: 20 }}>

            {/* Generator options */}
            <div style={{ padding: "16px", background: "var(--surface-raised)", borderRadius: 8, display: "grid", gap: 14 }}>
              <div style={{ fontSize: ".85rem", fontWeight: 600, color: "var(--muted)" }}>Generador de contraseña segura</div>

              {/* Checkboxes */}
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[
                  { key: "upper", label: "Mayúsculas (A–Z)" },
                  { key: "lower", label: "Minúsculas (a–z)" },
                  { key: "nums",  label: "Números (0–9)" },
                  { key: "syms",  label: "Símbolos (!@#…)" },
                ].map(opt => (
                  <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: ".85rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={pwdOpts[opt.key as keyof typeof pwdOpts] as boolean}
                      onChange={e => setPwdOpts(prev => ({ ...prev, [opt.key]: e.target.checked }))}
                      style={{ width: 15, height: 15, accentColor: "#0D2060" }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              {/* Length slider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <label style={{ fontSize: ".85rem", whiteSpace: "nowrap" }}>Longitud: <b>{pwdOpts.length}</b></label>
                <input
                  type="range" min="12" max="32"
                  value={pwdOpts.length}
                  onChange={e => setPwdOpts(prev => ({ ...prev, length: parseInt(e.target.value) }))}
                  style={{ flex: 1, accentColor: "#0D2060" }}
                />
              </div>

              <button type="button" className="btn" onClick={generate}
                style={{ background: "#0D2060", color: "#fff", alignSelf: "flex-start" }}>
                <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
                Generar contraseña
              </button>
            </div>

            {/* Password field */}
            <div className="field">
              <label htmlFor="password">Contraseña *</label>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    className="input"
                    id="password"
                    type={showPwd ? "text" : "password"}
                    placeholder="Mínimo 12 caracteres"
                    value={form.password}
                    onChange={e => set("password", e.target.value)}
                    required
                    minLength={12}
                    style={{ paddingRight: 40, fontFamily: showPwd ? "monospace" : undefined, letterSpacing: showPwd ? ".1em" : undefined }}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 2 }}>
                    <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      {showPwd
                        ? <><path d="M17.94 17.94a10.07 10.07 0 0 1-5.94 1.94C5 20 1 12 1 12a18.09 18.09 0 0 1 2.77-3.47" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                    </svg>
                  </button>
                </div>
                <button type="button" onClick={copyPwd} className="btn"
                  style={{ background: copied ? "#10b981" : undefined, color: copied ? "#fff" : undefined, flexShrink: 0 }}>
                  {copied ? (
                    <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12l5 5l10 -10" /></svg>
                  ) : (
                    <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z" /><path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" /></svg>
                  )}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>

              {/* Strength bar */}
              {form.password && (
                <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".78rem" }}>
                    <span style={{ color: "var(--muted)" }}>Fortaleza de la contraseña</span>
                    <span style={{ fontWeight: 600, color: strength.color }}>{strength.label}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "var(--line)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.round(strength.score / 6 * 100)}%`,
                      background: strength.color,
                      borderRadius: 3,
                      transition: "width .3s, background .3s",
                    }} />
                  </div>
                  <div style={{ fontSize: ".75rem", color: "var(--muted)", display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ color: form.password.length >= 12 ? "#10b981" : "var(--muted)" }}>✓ 12+ chars</span>
                    <span style={{ color: /[A-Z]/.test(form.password) ? "#10b981" : "var(--muted)" }}>✓ Mayúscula</span>
                    <span style={{ color: /[a-z]/.test(form.password) ? "#10b981" : "var(--muted)" }}>✓ Minúscula</span>
                    <span style={{ color: /[0-9]/.test(form.password) ? "#10b981" : "var(--muted)" }}>✓ Número</span>
                    <span style={{ color: /[^A-Za-z0-9]/.test(form.password) ? "#10b981" : "var(--muted)" }}>✓ Símbolo</span>
                  </div>
                </div>
              )}
              <span className="hint">El perito usará esta contraseña para su primer acceso.</span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Link href="/admin/peritos" className="btn">Cancelar</Link>
          <button className="btn primary" type="submit" disabled={loading} style={{ minWidth: 160 }}>
            {loading ? "Guardando…" : (
              <>
                <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                Crear perito
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}

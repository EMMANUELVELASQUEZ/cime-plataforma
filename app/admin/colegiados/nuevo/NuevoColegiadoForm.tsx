"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const ESPS = [
  "Ingeniería Eléctrica",
  "Ingeniería Mecánica",
  "Ingeniería Mecánica Eléctrica",
  "Ingeniería Electromecánica",
  "Ingeniería en Energías Renovables",
  "Ingeniería Industrial Eléctrica",
]
const CIUDADES = ["Veracruz","Boca del Río","Xalapa","Coatzacoalcos","Córdoba","Orizaba","Poza Rica","Tuxpan","Minatitlán","Alvarado","Pánuco","San Andrés Tuxtla"]

export default function NuevoColegiadoForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [form, setForm] = useState({
    nombre: "", correo: "", password: "", numeroColegiado: "",
    especialidad: "", ciudad: "", cedula: "", telefono: "",
    estado: "VIGENTE", alta: new Date().getFullYear().toString(),
    horasMeta: "60",
  })

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(""); setSuccess("")
    if (!form.nombre || !form.correo || !form.password) {
      setError("Nombre, correo y contraseña son obligatorios.")
      return
    }
    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/admin/colegiados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, alta: parseInt(form.alta), horasMeta: parseInt(form.horasMeta) }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error al crear la cuenta."); return }
      setSuccess(`Cuenta creada exitosamente para ${form.nombre}.`)
      setTimeout(() => router.push("/admin/colegiados"), 1500)
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
                <input className="input" id="nombre" placeholder="Ej. Ing. Juan Pérez García" value={form.nombre} onChange={e => set("nombre", e.target.value)} required />
                <span className="hint">Incluye título profesional (Ing., Lic., Dr., etc.)</span>
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

        {/* Datos de colegiación */}
        <div className="card">
          <div className="card-h"><h2>Datos de colegiación</h2></div>
          <div className="card-b" style={{ display: "grid", gap: 20 }}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="numeroColegiado">Número de colegiado</label>
                <input className="input" id="numeroColegiado" placeholder="Ej. 0427" value={form.numeroColegiado} onChange={e => set("numeroColegiado", e.target.value)} />
                <span className="hint">Si se deja vacío, el sistema no asignará número</span>
              </div>
              <div className="field">
                <label htmlFor="cedula">Cédula profesional</label>
                <input className="input" id="cedula" placeholder="Número de cédula SEP" value={form.cedula} onChange={e => set("cedula", e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="especialidad">Especialidad</label>
                <select className="input" id="especialidad" value={form.especialidad} onChange={e => set("especialidad", e.target.value)}>
                  <option value="">Seleccionar especialidad</option>
                  {ESPS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
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

        {/* Contraseña */}
        <div className="card">
          <div className="card-h">
            <h2>Credenciales de acceso</h2>
            <span className="chip nodot warn">Se recomienda que el colegiado la cambie al primer acceso</span>
          </div>
          <div className="card-b">
            <div className="form-grid">
              <div className="field">
                <label htmlFor="password">Contraseña inicial *</label>
                <input className="input" id="password" type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={e => set("password", e.target.value)} required minLength={8} />
                <span className="hint">El colegiado usará esta contraseña para su primer acceso</span>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Link href="/admin/colegiados" className="btn">Cancelar</Link>
          <button className="btn primary" type="submit" disabled={loading} style={{ minWidth: 160 }}>
            {loading
              ? "Guardando…"
              : <>
                  <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                  Crear cuenta
                </>}
          </button>
        </div>
      </div>
    </form>
  )
}

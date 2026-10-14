"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const ESPS = [
  "Ingeniería Eléctrica","Ingeniería Mecánica","Ingeniería Mecánica Eléctrica",
  "Ingeniería Electromecánica","Ingeniería en Energías Renovables","Ingeniería Industrial Eléctrica",
]
const CIUDADES = ["Veracruz","Boca del Río","Xalapa","Coatzacoalcos","Córdoba","Orizaba","Poza Rica","Tuxpan","Minatitlán","Alvarado","Pánuco","San Andrés Tuxtla"]

interface Colegiado {
  id: string; nombre: string; correo: string; numeroColegiado: string | null;
  especialidad: string | null; ciudad: string | null; cedula: string | null;
  telefono: string | null; estado: string; alta: number; horas: number;
  horasMeta: number; vigencia: string | null;
}

export default function EditarColegiadoForm({ colegiado }: { colegiado: Colegiado }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [newPassword, setNewPassword] = useState("")

  const [form, setForm] = useState({
    nombre: colegiado.nombre,
    correo: colegiado.correo,
    numeroColegiado: colegiado.numeroColegiado ?? "",
    especialidad: colegiado.especialidad ?? "",
    ciudad: colegiado.ciudad ?? "",
    cedula: colegiado.cedula ?? "",
    telefono: colegiado.telefono ?? "",
    estado: colegiado.estado,
    alta: String(colegiado.alta),
    horas: String(colegiado.horas),
    horasMeta: String(colegiado.horasMeta),
    vigencia: colegiado.vigencia ?? "",
  })

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(""); setSuccess("")
    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        ...form,
        alta: parseInt(form.alta),
        horas: parseInt(form.horas),
        horasMeta: parseInt(form.horasMeta),
      }
      if (newPassword) body.password = newPassword

      const res = await fetch(`/api/admin/colegiados/${colegiado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error al actualizar."); return }
      setSuccess("Cambios guardados correctamente.")
      setNewPassword("")
      router.refresh()
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
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
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Nombre completo</label>
                <input className="input" value={form.nombre} onChange={e => set("nombre", e.target.value)} required />
              </div>
              <div className="field">
                <label>Correo electrónico</label>
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
          <div className="card-h"><h2>Datos de colegiación</h2></div>
          <div className="card-b" style={{ display: "grid", gap: 20 }}>
            <div className="form-grid">
              <div className="field">
                <label>Número de colegiado</label>
                <input className="input" value={form.numeroColegiado} onChange={e => set("numeroColegiado", e.target.value)} />
              </div>
              <div className="field">
                <label>Cédula profesional</label>
                <input className="input" value={form.cedula} onChange={e => set("cedula", e.target.value)} />
              </div>
              <div className="field">
                <label>Especialidad</label>
                <select className="input" value={form.especialidad} onChange={e => set("especialidad", e.target.value)}>
                  <option value="">Seleccionar</option>
                  {ESPS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Ciudad</label>
                <select className="input" value={form.ciudad} onChange={e => set("ciudad", e.target.value)}>
                  <option value="">Seleccionar</option>
                  {CIUDADES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
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
                <label>Año de alta</label>
                <input className="input" type="number" value={form.alta} onChange={e => set("alta", e.target.value)} />
              </div>
              <div className="field">
                <label>Horas acreditadas 2026</label>
                <input className="input" type="number" min="0" value={form.horas} onChange={e => set("horas", e.target.value)} />
              </div>
              <div className="field">
                <label>Meta de horas anuales</label>
                <input className="input" type="number" min="1" value={form.horasMeta} onChange={e => set("horasMeta", e.target.value)} />
              </div>
              <div className="field">
                <label>Vigencia</label>
                <input className="input" placeholder="Ej. 31 dic 2026" value={form.vigencia} onChange={e => set("vigencia", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <h2>Cambiar contraseña</h2>
            <span className="chip nodot">Opcional — dejar vacío para no cambiar</span>
          </div>
          <div className="card-b">
            <div className="field" style={{ maxWidth: 360 }}>
              <label>Nueva contraseña</label>
              <input className="input" type="password" placeholder="Mínimo 8 caracteres" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Link href="/admin/colegiados" className="btn">Cancelar</Link>
          <button className="btn primary" type="submit" disabled={loading} style={{ minWidth: 160 }}>
            {loading ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </form>
  )
}

"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NuevoEventoForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")
  const [form, setForm] = useState({ titulo: "", fecha: "", hora: "18:00", lugar: "", tipo: "asamblea" })

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setMsg("")
    setLoading(true)
    await fetch("/api/admin/eventos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setLoading(false); setMsg("Evento agregado.")
    setForm({ titulo: "", fecha: "", hora: "18:00", lugar: "", tipo: "asamblea" })
    router.refresh()
  }

  return (
    <div className="card">
      <div className="card-h"><h2>Nuevo evento</h2></div>
      <form onSubmit={handleSubmit}>
        <div className="card-b" style={{ display: "grid", gap: 16 }}>
          {msg && <div className="form-ok">{msg}</div>}
          <div className="field">
            <label>Título del evento *</label>
            <input className="input" value={form.titulo} onChange={e => set("titulo", e.target.value)} required placeholder="Ej. Asamblea ordinaria de octubre" />
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Fecha *</label>
              <input className="input" type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} required />
            </div>
            <div className="field">
              <label>Hora</label>
              <input className="input" type="time" value={form.hora} onChange={e => set("hora", e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Tipo</label>
            <select className="input" value={form.tipo} onChange={e => set("tipo", e.target.value)}>
              <option value="asamblea">Asamblea</option>
              <option value="curso">Curso</option>
              <option value="conferencia">Conferencia</option>
              <option value="visita">Visita técnica</option>
              <option value="examen">Evaluación</option>
            </select>
          </div>
          <div className="field">
            <label>Lugar</label>
            <input className="input" value={form.lugar} onChange={e => set("lugar", e.target.value)} placeholder="Sede CIME Veracruz" />
          </div>
          <button className="btn primary block" type="submit" disabled={loading}>
            {loading ? "Guardando…" : "Agregar evento"}
          </button>
        </div>
      </form>
    </div>
  )
}

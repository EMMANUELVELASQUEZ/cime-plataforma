"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NuevoAvisoForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")
  const [form, setForm] = useState({ titulo: "", contenido: "", categoria: "Evento", tipo: "conferencia", fijado: false })

  function set(k: string, v: string | boolean) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setMsg("")
    setLoading(true)
    await fetch("/api/admin/avisos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setLoading(false); setMsg("Aviso publicado.")
    setForm({ titulo: "", contenido: "", categoria: "Evento", tipo: "conferencia", fijado: false })
    router.refresh()
  }

  return (
    <div className="card">
      <div className="card-h"><h2>Nuevo aviso</h2></div>
      <form onSubmit={handleSubmit}>
        <div className="card-b" style={{ display: "grid", gap: 16 }}>
          {msg && <div className="form-ok">{msg}</div>}
          <div className="field">
            <label>Título *</label>
            <input className="input" value={form.titulo} onChange={e => set("titulo", e.target.value)} required />
          </div>
          <div className="field">
            <label>Contenido *</label>
            <textarea className="input" value={form.contenido} onChange={e => set("contenido", e.target.value)} rows={4} required />
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Categoría</label>
              <select className="input" value={form.categoria} onChange={e => set("categoria", e.target.value)}>
                <option>Convocatoria</option><option>Cuotas</option><option>Evento</option><option>Cursos</option><option>Sistema</option>
              </select>
            </div>
            <div className="field">
              <label>Tipo</label>
              <select className="input" value={form.tipo} onChange={e => set("tipo", e.target.value)}>
                <option value="asamblea">Asamblea</option><option value="curso">Curso</option>
                <option value="conferencia">Conferencia</option><option value="visita">Visita</option>
                <option value="examen">Examen</option><option value="sistema">Sistema</option>
              </select>
            </div>
          </div>
          <label className="check">
            <input type="checkbox" checked={form.fijado} onChange={e => set("fijado", e.target.checked)} />
            Fijar este aviso (aparece primero)
          </label>
          <button className="btn primary block" type="submit" disabled={loading}>
            {loading ? "Publicando…" : "Publicar aviso"}
          </button>
        </div>
      </form>
    </div>
  )
}

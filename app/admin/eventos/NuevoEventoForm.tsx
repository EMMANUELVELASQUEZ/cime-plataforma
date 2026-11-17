"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

const TIPOS_SUGERIDOS = ["Asamblea", "Curso", "Conferencia", "Visita técnica", "Evaluación", "Taller", "Congreso"]

const AUDIENCIAS = [
  { label: "Todos", value: "todos" },
  { label: "Colegiados", value: "colegiados" },
  { label: "Peritos", value: "peritos" },
  { label: "Tesorero", value: "tesorero" },
]

export default function NuevoEventoForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")
  const [form, setForm] = useState({ titulo: "", fecha: "", hora: "18:00", lugar: "", tipo: "", audiencia: "todos" })

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setMsg("")
    setLoading(true)
    await fetch("/api/admin/eventos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setLoading(false); setMsg("Evento agregado.")
    setForm({ titulo: "", fecha: "", hora: "18:00", lugar: "", tipo: "", audiencia: "todos" })
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
            <input
              className="input"
              list="tipos-sugeridos"
              value={form.tipo}
              onChange={e => set("tipo", e.target.value)}
              placeholder="Ej. Asamblea, Curso, Congreso…"
              autoComplete="off"
            />
            <datalist id="tipos-sugeridos">
              {TIPOS_SUGERIDOS.map(t => <option key={t} value={t} />)}
            </datalist>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {TIPOS_SUGERIDOS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("tipo", t)}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    border: `1.5px solid ${form.tipo === t ? "var(--accent)" : "var(--line)"}`,
                    background: form.tipo === t ? "var(--accent)" : "transparent",
                    color: form.tipo === t ? "#fff" : "var(--muted)",
                    fontSize: ".75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all .15s",
                    letterSpacing: ".03em",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Audiencia</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {AUDIENCIAS.map(a => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => set("audiencia", a.value)}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    border: `1.5px solid ${form.audiencia === a.value ? "#0D2060" : "var(--line)"}`,
                    background: form.audiencia === a.value ? "#0D2060" : "transparent",
                    color: form.audiencia === a.value ? "#fff" : "var(--muted)",
                    fontSize: ".75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all .15s",
                    letterSpacing: ".03em",
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
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

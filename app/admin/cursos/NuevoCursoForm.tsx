"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NuevoCursoForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")
  const router = useRouter()

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr("")
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const body = Object.fromEntries(fd)
    const res = await fetch("/api/admin/cursos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    setLoading(false)
    if (!res.ok) { setErr((await res.json()).error ?? "Error"); return }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button className="btn primary" onClick={() => setOpen(true)}>
        <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
        Nuevo curso
      </button>

      {open && (
        <div className="dialog-backdrop" onClick={() => setOpen(false)}>
          <div className="dialog" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="dialog-head">
              <h3>Nuevo curso</h3>
              <button className="btn ghost sm" onClick={() => setOpen(false)}>✕</button>
            </div>
            <form onSubmit={submit} style={{ display: "grid", gap: "1rem" }}>
              <div className="grid g-2">
                <div className="field">
                  <label>Título *</label>
                  <input name="titulo" required placeholder="Instalaciones Eléctricas Industriales" />
                </div>
                <div className="field">
                  <label>Código *</label>
                  <input name="codigo" required placeholder="ELE-2026-001" />
                </div>
              </div>
              <div className="grid g-3">
                <div className="field">
                  <label>Área</label>
                  <select name="area">
                    <option value="ELE">Eléctrica</option>
                    <option value="MEC">Mecánica</option>
                    <option value="SOL">Solar/Renovable</option>
                  </select>
                </div>
                <div className="field">
                  <label>Modalidad</label>
                  <select name="modalidad">
                    <option value="Presencial">Presencial</option>
                    <option value="En línea">En línea</option>
                    <option value="Híbrido">Híbrido</option>
                  </select>
                </div>
                <div className="field">
                  <label>Instructor</label>
                  <input name="instructor" placeholder="Ing. García" />
                </div>
              </div>
              <div className="field">
                <label>Lugar / Sede</label>
                <input name="lugar" placeholder="Auditorio CIME, Xalapa" />
              </div>
              <div className="grid g-3">
                <div className="field">
                  <label>Horas</label>
                  <input name="horas" type="number" min="1" defaultValue="8" />
                </div>
                <div className="field">
                  <label>Precio (MXN)</label>
                  <input name="precio" type="number" min="0" defaultValue="0" />
                </div>
                <div className="field">
                  <label>Cupo máximo</label>
                  <input name="cupo" type="number" min="1" defaultValue="20" />
                </div>
              </div>
              <div className="grid g-2">
                <div className="field">
                  <label>Fecha inicio *</label>
                  <input name="fechaInicio" type="date" required />
                </div>
                <div className="field">
                  <label>Fecha fin</label>
                  <input name="fechaFin" type="date" />
                </div>
              </div>
              {err && <p style={{ color: "var(--bad)", fontSize: ".85rem", margin: 0 }}>{err}</p>}
              <div style={{ display: "flex", gap: ".75rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Cancelar</button>
                <button type="submit" className="btn primary" disabled={loading}>{loading ? "Guardando…" : "Crear curso"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

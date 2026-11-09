"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

export default function NuevoAvisoForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")
  const [form, setForm] = useState({ titulo: "", contenido: "", categoria: "Evento", tipo: "conferencia", fijado: false })
  const [imagen, setImagen] = useState<string | null>(null)
  const [imgPreview, setImgPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function set(k: string, v: string | boolean) { setForm(p => ({ ...p, [k]: v })) }

  function handleImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) {
      alert("La imagen no puede superar 3 MB.")
      e.target.value = ""
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      const payload = JSON.stringify({ url, nombre: file.name, tipo: file.type, bytes: file.size })
      setImagen(payload)
      setImgPreview(url)
    }
    reader.readAsDataURL(file)
  }

  function clearImagen() {
    setImagen(null)
    setImgPreview(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setMsg("")
    setLoading(true)
    await fetch("/api/admin/avisos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, imagen }),
    })
    setLoading(false); setMsg("Aviso publicado.")
    setForm({ titulo: "", contenido: "", categoria: "Evento", tipo: "conferencia", fijado: false })
    clearImagen()
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

          {/* Image upload */}
          <div className="field">
            <label>Imagen del aviso (opcional, máx. 3 MB)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="input"
              onChange={handleImagen}
              style={{ padding: "6px 10px", cursor: "pointer" }}
            />
            {imgPreview && (
              <div style={{ marginTop: 10, position: "relative", display: "inline-block" }}>
                <img
                  src={imgPreview}
                  alt="Vista previa"
                  style={{
                    width: "100%",
                    maxHeight: 220,
                    objectFit: "cover",
                    borderRadius: "var(--r)",
                    border: "1px solid var(--line)",
                    display: "block",
                  }}
                />
                <button
                  type="button"
                  onClick={clearImagen}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,.55)",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "1rem",
                    lineHeight: 1,
                  }}
                  aria-label="Quitar imagen"
                >
                  ×
                </button>
              </div>
            )}
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

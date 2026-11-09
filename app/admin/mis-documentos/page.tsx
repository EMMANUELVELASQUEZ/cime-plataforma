"use client"

import { useState, useEffect, useRef } from "react"
import {
  FileText, Archive, Image, Paperclip, Download, Trash2, Pencil,
  Plus, X, Check, Loader2, FolderOpen,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────────
interface Documento {
  id: string
  nombre: string
  descripcion: string | null
  categoria: string
  url: string        // JSON: { url: "data:...", nombre, tipo, bytes }
  nombreArchivo: string
  tipoMime: string
  bytes: number
  createdAt: string
}

interface FormState {
  nombre: string
  descripcion: string
  categoria: string
  file: File | null
}

// ─── Constants ───────────────────────────────────────────────────────────────
const CATEGORIAS = ["Certificados", "Títulos y Diplomas", "Contratos", "Comunicados Oficiales", "General"]
const MAX_MB = 3
const MAX_BYTES = MAX_MB * 1024 * 1024

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtBytes(b: number): string {
  if (b === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB"]
  const i = Math.min(Math.floor(Math.log(b) / Math.log(k)), sizes.length - 1)
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getFileIcon(tipoMime: string, nombreArchivo: string) {
  const ext = nombreArchivo.split(".").pop()?.toLowerCase() ?? ""
  if (tipoMime === "application/pdf" || ext === "pdf")
    return { Icon: FileText, color: "#ef4444" }
  if (["doc", "docx"].includes(ext) || tipoMime.includes("word"))
    return { Icon: FileText, color: "#3b82f6" }
  if (["xls", "xlsx"].includes(ext) || tipoMime.includes("excel") || tipoMime.includes("spreadsheet"))
    return { Icon: FileText, color: "#22c55e" }
  if (["ppt", "pptx"].includes(ext) || tipoMime.includes("powerpoint") || tipoMime.includes("presentation"))
    return { Icon: FileText, color: "#f97316" }
  if (ext === "zip" || tipoMime.includes("zip"))
    return { Icon: Archive, color: "#f59e0b" }
  if (tipoMime.startsWith("image/"))
    return { Icon: Image, color: "#14b8a6" }
  return { Icon: Paperclip, color: "var(--muted)" }
}

function nameWithoutExt(filename: string): string {
  const parts = filename.split(".")
  if (parts.length > 1) parts.pop()
  return parts.join(".").replace(/[-_]/g, " ")
}

function parseDocUrl(raw: string): { url: string; nombre: string; tipo: string; bytes: number } | null {
  try { return JSON.parse(raw) } catch { return null }
}

function downloadDoc(doc: Documento) {
  const info = parseDocUrl(doc.url)
  if (!info) return
  const base64 = info.url.split(",")[1]
  if (!base64) return
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  const blob = new Blob([bytes], { type: info.tipo })
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = blobUrl
  a.download = info.nombre
  a.click()
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1500)
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function MisDocumentosPage() {
  const [docs, setDocs] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ nombre: "", descripcion: "", categoria: "" })
  const [form, setForm] = useState<FormState>({ nombre: "", descripcion: "", categoria: "Certificados", file: null })
  const [msg, setMsg] = useState("")
  const [err, setErr] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchDocs() }, [])

  async function fetchDocs() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/documentos")
      if (res.ok) setDocs(await res.json())
    } finally {
      setLoading(false)
    }
  }

  function showMsg(text: string) {
    setMsg(text); setErr("")
    setTimeout(() => setMsg(""), 3500)
  }
  function showErr(text: string) {
    setErr(text); setMsg("")
    setTimeout(() => setErr(""), 4000)
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!form.file || !form.nombre.trim()) return

    if (form.file.size > MAX_BYTES) {
      showErr(`El archivo supera el límite de ${MAX_MB} MB.`)
      return
    }

    setUploading(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = ev => resolve(ev.target?.result as string)
        reader.onerror = reject
        reader.readAsDataURL(form.file!)
      })

      const payload = JSON.stringify({
        url: dataUrl,
        nombre: form.file.name,
        tipo: form.file.type || "application/octet-stream",
        bytes: form.file.size,
      })

      const res = await fetch("/api/admin/documentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          categoria: form.categoria,
          url: payload,
          nombreArchivo: form.file.name,
          tipoMime: form.file.type || "application/octet-stream",
          bytes: form.file.size,
        }),
      })

      if (res.ok) {
        const newDoc: Documento = await res.json()
        setDocs(prev => [newDoc, ...prev])
        setForm({ nombre: "", descripcion: "", categoria: "Certificados", file: null })
        if (fileInputRef.current) fileInputRef.current.value = ""
        showMsg("Documento subido correctamente.")
      } else {
        const data = await res.json()
        showErr(data.error ?? "Error al guardar el documento.")
      }
    } catch {
      showErr("Error al procesar el archivo. Intenta de nuevo.")
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(doc: Documento) {
    if (!confirm(`¿Eliminar "${doc.nombre}"? Esta acción no se puede deshacer.`)) return
    setDeletingId(doc.id)
    try {
      const res = await fetch(`/api/admin/documentos/${doc.id}`, { method: "DELETE" })
      if (res.ok) {
        setDocs(prev => prev.filter(d => d.id !== doc.id))
        showMsg("Documento eliminado.")
      } else {
        showErr("Error al eliminar el documento.")
      }
    } finally {
      setDeletingId(null)
    }
  }

  function startEdit(doc: Documento) {
    setEditingId(doc.id)
    setEditForm({ nombre: doc.nombre, descripcion: doc.descripcion ?? "", categoria: doc.categoria })
  }

  async function handleSaveEdit(id: string) {
    try {
      const res = await fetch(`/api/admin/documentos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        const updated: Documento = await res.json()
        setDocs(prev => prev.map(d => d.id === id ? updated : d))
        setEditingId(null)
        showMsg("Cambios guardados.")
      } else {
        showErr("Error al actualizar.")
      }
    } catch {
      showErr("Error de red.")
    }
  }

  // Group by categoria
  const grouped = docs.reduce<Record<string, Documento[]>>((acc, doc) => {
    const key = doc.categoria || "General"
    if (!acc[key]) acc[key] = []
    acc[key].push(doc)
    return acc
  }, {})

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>

      {/* Page Header */}
      <div className="page-head" style={{ marginBottom: 32 }}>
        <div>
          <p style={{
            fontFamily: "var(--f-data)",
            fontSize: ".68rem",
            fontWeight: 700,
            letterSpacing: ".15em",
            textTransform: "uppercase",
            color: "var(--muted-2)",
            marginBottom: 6,
          }}>
            Administración · Panel del Colegio
          </p>
          <h1 style={{ fontSize: "1.75rem" }}>Mis Documentos</h1>
          <p style={{ color: "var(--muted)", fontSize: ".9rem", marginTop: 4 }}>
            Almacén privado de certificados, títulos y documentos oficiales.
          </p>
        </div>
        {docs.length > 0 && (
          <div style={{
            alignSelf: "flex-start",
            fontFamily: "var(--f-data)",
            fontSize: ".75rem",
            fontWeight: 700,
            letterSpacing: ".04em",
            padding: "5px 12px",
            borderRadius: 4,
            background: "var(--info-bg)",
            color: "var(--info)",
            border: "1px solid var(--info-ring)",
            whiteSpace: "nowrap",
          }}>
            {docs.length} documento{docs.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Toast messages */}
      {msg && (
        <div className="form-ok" style={{ marginBottom: 16 }}>{msg}</div>
      )}
      {err && (
        <div className="form-err" style={{ marginBottom: 16 }}>{err}</div>
      )}

      {/* Upload Form */}
      <div className="card" style={{ marginBottom: 32 }}>
        <div className="card-h">
          <h2 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
            <Plus size={18} style={{ color: "var(--brand)" }} />
            Subir nuevo documento
          </h2>
        </div>
        <form onSubmit={handleUpload}>
          <div className="card-b" style={{ display: "grid", gap: 16 }}>
            <div className="form-grid">
              {/* File picker */}
              <div className="field">
                <label>Archivo <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: ".8rem" }}>(máx. {MAX_MB} MB)</span></label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="input"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.zip,.txt"
                  style={{ padding: "6px 10px", cursor: "pointer" }}
                  onChange={e => {
                    const file = e.target.files?.[0] ?? null
                    setForm(f => ({
                      ...f,
                      file,
                      nombre: f.nombre || (file ? nameWithoutExt(file.name) : ""),
                    }))
                  }}
                  required
                />
              </div>

              {/* Categoría */}
              <div className="field">
                <label>Categoría</label>
                <select
                  className="input"
                  value={form.categoria}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                >
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Nombre */}
            <div className="field">
              <label>Nombre del documento *</label>
              <input
                type="text"
                className="input"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej. Certificado Profesional 2024"
                required
              />
            </div>

            {/* Descripción */}
            <div className="field">
              <label>Descripción <span style={{ color: "var(--muted)", fontWeight: 400 }}>(opcional)</span></label>
              <textarea
                className="input"
                rows={2}
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Notas adicionales sobre este documento…"
                style={{ resize: "vertical" }}
              />
            </div>

            <button
              type="submit"
              className="btn primary"
              disabled={uploading || !form.file}
              style={{ display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start" }}
            >
              {uploading
                ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Guardando…</>
                : <><Plus size={15} /> Subir documento</>
              }
            </button>
          </div>
        </form>
      </div>

      {/* Documents list */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <Loader2 size={28} style={{ color: "var(--muted)", animation: "spin 1s linear infinite" }} />
        </div>
      ) : docs.length === 0 ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          padding: "64px 24px",
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r)",
          color: "var(--muted)",
        }}>
          <FolderOpen size={56} strokeWidth={1.25} />
          <p style={{ margin: 0, fontSize: ".9rem", fontWeight: 600, color: "var(--fg)" }}>Sin documentos</p>
          <p style={{ margin: 0, fontSize: ".85rem", textAlign: "center", maxWidth: 320 }}>
            Aún no has subido ningún documento. Usa el formulario de arriba para comenzar.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([categoria, items]) => (
          <div key={categoria} style={{ marginBottom: 32 }}>
            {/* Category header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{
                fontFamily: "var(--f-data)",
                fontSize: ".65rem",
                fontWeight: 700,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "var(--brand)",
              }}>
                {categoria}
              </span>
              <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
              <span style={{
                fontFamily: "var(--f-data)",
                fontSize: ".7rem",
                color: "var(--muted)",
                fontWeight: 600,
              }}>
                {items.length}
              </span>
            </div>

            {/* Cards grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}>
              {items.map(doc => {
                const { Icon, color } = getFileIcon(doc.tipoMime, doc.nombreArchivo)
                const isEditing = editingId === doc.id
                const isDeleting = deletingId === doc.id

                return (
                  <div
                    key={doc.id}
                    className="card"
                    style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}
                  >
                    {isEditing ? (
                      /* ── Edit mode ── */
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                          <span style={{ fontSize: ".8rem", fontWeight: 600, color: "var(--muted)" }}>Editar documento</span>
                          <button
                            className="btn sm"
                            onClick={() => setEditingId(null)}
                            style={{ display: "flex", alignItems: "center", gap: 4 }}
                          >
                            <X size={13} /> Cancelar
                          </button>
                        </div>
                        <div className="field">
                          <label style={{ fontSize: ".75rem" }}>Nombre</label>
                          <input
                            className="input"
                            value={editForm.nombre}
                            onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                          />
                        </div>
                        <div className="field">
                          <label style={{ fontSize: ".75rem" }}>Descripción</label>
                          <textarea
                            className="input"
                            rows={2}
                            value={editForm.descripcion}
                            onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))}
                            style={{ resize: "vertical" }}
                          />
                        </div>
                        <div className="field">
                          <label style={{ fontSize: ".75rem" }}>Categoría</label>
                          <select
                            className="input"
                            value={editForm.categoria}
                            onChange={e => setEditForm(f => ({ ...f, categoria: e.target.value }))}
                          >
                            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <button
                          className="btn primary sm"
                          onClick={() => handleSaveEdit(doc.id)}
                          style={{ display: "flex", alignItems: "center", gap: 5, alignSelf: "flex-start" }}
                        >
                          <Check size={13} /> Guardar cambios
                        </button>
                      </div>
                    ) : (
                      /* ── View mode ── */
                      <>
                        {/* Top row: icon + name */}
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: "var(--r)",
                            background: `${color}18`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}>
                            <Icon size={24} style={{ color }} strokeWidth={1.75} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              margin: 0,
                              fontWeight: 600,
                              fontSize: ".875rem",
                              color: "var(--fg)",
                              lineHeight: 1.3,
                              wordBreak: "break-word",
                            }}>
                              {doc.nombre}
                            </p>
                            {doc.descripcion && (
                              <p style={{
                                margin: "4px 0 0",
                                fontSize: ".75rem",
                                color: "var(--muted)",
                                lineHeight: 1.4,
                              }}>
                                {doc.descripcion}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Meta row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{
                            fontFamily: "var(--f-data)",
                            fontSize: ".62rem",
                            fontWeight: 700,
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: "var(--info-bg)",
                            color: "var(--info)",
                            border: "1px solid var(--info-ring)",
                          }}>
                            {doc.categoria}
                          </span>
                          <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>
                            {fmtBytes(doc.bytes)}
                          </span>
                          <span style={{ fontSize: ".72rem", color: "var(--muted)", opacity: .5 }}>·</span>
                          <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>
                            {doc.nombreArchivo.split(".").pop()?.toUpperCase()}
                          </span>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                          <button
                            className="btn sm"
                            onClick={() => downloadDoc(doc)}
                            style={{ display: "flex", alignItems: "center", gap: 5 }}
                          >
                            <Download size={13} /> Descargar
                          </button>
                          <button
                            className="btn sm"
                            onClick={() => startEdit(doc)}
                            style={{ display: "flex", alignItems: "center", gap: 5 }}
                          >
                            <Pencil size={13} /> Editar
                          </button>
                          <button
                            className="btn sm"
                            onClick={() => handleDelete(doc)}
                            disabled={isDeleting}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              color: "var(--bad)",
                              marginLeft: "auto",
                            }}
                          >
                            {isDeleting
                              ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                              : <Trash2 size={13} />
                            }
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

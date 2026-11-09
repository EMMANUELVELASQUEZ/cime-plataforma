"use client"

import { useState, useEffect, useRef } from "react"
import { upload } from "@vercel/blob/client"
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
  url: string
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtBytes(b: number): string {
  if (b === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(b) / Math.log(k))
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

// ─── Component ───────────────────────────────────────────────────────────────
export default function MisDocumentosPage() {
  const [docs, setDocs] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ nombre: "", descripcion: "", categoria: "" })
  const [form, setForm] = useState<FormState>({ nombre: "", descripcion: "", categoria: "General", file: null })
  const [msg, setMsg] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchDocs()
  }, [])

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
    setMsg(text)
    setTimeout(() => setMsg(""), 3500)
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!form.file || !form.nombre.trim()) return
    setUploading(true)
    setUploadProgress(0)
    try {
      const blob = await upload(form.file.name, form.file, {
        access: "public",
        handleUploadUrl: "/api/admin/documentos/upload",
      })
      setUploadProgress(80)
      const res = await fetch("/api/admin/documentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          categoria: form.categoria,
          url: blob.url,
          nombreArchivo: form.file.name,
          tipoMime: form.file.type || "application/octet-stream",
          bytes: form.file.size,
        }),
      })
      setUploadProgress(100)
      if (res.ok) {
        const newDoc: Documento = await res.json()
        setDocs(prev => [newDoc, ...prev])
        setForm({ nombre: "", descripcion: "", categoria: "General", file: null })
        if (fileInputRef.current) fileInputRef.current.value = ""
        showMsg("Documento subido correctamente.")
      } else {
        const err = await res.json()
        showMsg(err.error || "Error al guardar el documento.")
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al subir el archivo."
      showMsg(message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
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
        showMsg("Error al eliminar el documento.")
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
        showMsg("Error al actualizar.")
      }
    } catch {
      showMsg("Error de red.")
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
    <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Mis Documentos</h1>
          <p>Almacén privado de certificados, títulos y documentos oficiales.</p>
        </div>
      </div>

      {/* Toast message */}
      {msg && (
        <div style={{
          marginBottom: 16,
          padding: "10px 16px",
          borderRadius: "var(--r)",
          background: "var(--ok-bg, #dcfce7)",
          color: "var(--ok, #16a34a)",
          fontSize: ".875rem",
          fontWeight: 500,
          border: "1px solid var(--ok-line, #bbf7d0)",
        }}>
          {msg}
        </div>
      )}

      {/* Upload Form */}
      <div className="card" style={{ marginBottom: 32, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Plus size={18} style={{ color: "var(--brand)" }} />
          <span style={{ fontWeight: 600, fontSize: ".925rem", color: "var(--fg)" }}>Subir nuevo documento</span>
        </div>
        <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* File picker */}
          <div className="field">
            <label style={{ fontSize: ".8rem", color: "var(--muted)", fontWeight: 500, marginBottom: 4, display: "block" }}>
              Archivo
            </label>
            <input
              ref={fileInputRef}
              type="file"
              className="input"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.gif,.zip,.txt"
              onChange={e => {
                const file = e.target.files?.[0] ?? null
                if (file) {
                  setForm(f => ({ ...f, file, nombre: form.nombre || nameWithoutExt(file.name) }))
                } else {
                  setForm(f => ({ ...f, file: null }))
                }
              }}
              required
            />
          </div>

          {/* Nombre */}
          <div className="field">
            <label style={{ fontSize: ".8rem", color: "var(--muted)", fontWeight: 500, marginBottom: 4, display: "block" }}>
              Nombre <span style={{ color: "var(--bad)" }}>*</span>
            </label>
            <input
              type="text"
              className="input"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Nombre del documento"
              required
            />
          </div>

          {/* Descripción */}
          <div className="field">
            <label style={{ fontSize: ".8rem", color: "var(--muted)", fontWeight: 500, marginBottom: 4, display: "block" }}>
              Descripción <span style={{ color: "var(--muted)" }}>(opcional)</span>
            </label>
            <textarea
              className="input"
              rows={2}
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Descripción breve..."
              style={{ resize: "vertical" }}
            />
          </div>

          {/* Categoría */}
          <div className="field">
            <label style={{ fontSize: ".8rem", color: "var(--muted)", fontWeight: 500, marginBottom: 4, display: "block" }}>
              Categoría
            </label>
            <select
              className="input"
              value={form.categoria}
              onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
            >
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Progress bar */}
          {uploading && uploadProgress > 0 && (
            <div style={{ height: 4, borderRadius: 999, background: "var(--line)", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                borderRadius: 999,
                background: "var(--brand)",
                width: `${uploadProgress}%`,
                transition: "width .3s ease",
              }} />
            </div>
          )}

          <button type="submit" className="btn primary" disabled={uploading || !form.file} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6 }}>
            {uploading
              ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Subiendo...</>
              : <><Plus size={15} /> Subir documento</>
            }
          </button>
        </form>
      </div>

      {/* Documents list */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <Loader2 size={28} style={{ color: "var(--muted)", animation: "spin 1s linear infinite" }} />
        </div>
      ) : docs.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "64px 24px", color: "var(--muted)" }}>
          <FolderOpen size={64} strokeWidth={1.25} style={{ color: "var(--muted)" }} />
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "var(--fg)" }}>Sin documentos</h2>
          <p style={{ margin: 0, fontSize: ".875rem", textAlign: "center", maxWidth: 320 }}>
            Aún no has subido ningún documento. Usa el formulario de arriba para comenzar.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([categoria, items]) => (
          <div key={categoria} style={{ marginBottom: 32 }}>
            {/* Category header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{
                fontSize: ".7rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
                color: "var(--muted)", paddingRight: 10,
              }}>
                {categoria}
              </span>
              <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
              <span style={{ fontSize: ".75rem", color: "var(--muted)" }}>{items.length}</span>
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
                  <div key={doc.id} className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                    {isEditing ? (
                      /* Edit mode */
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                          <span style={{ fontSize: ".8rem", fontWeight: 600, color: "var(--muted)" }}>Editar documento</span>
                          <button className="btn sm" onClick={() => setEditingId(null)} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <X size={13} /> Cancelar
                          </button>
                        </div>
                        <div className="field">
                          <label style={{ fontSize: ".75rem", color: "var(--muted)", display: "block", marginBottom: 3 }}>Nombre</label>
                          <input
                            className="input"
                            value={editForm.nombre}
                            onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                          />
                        </div>
                        <div className="field">
                          <label style={{ fontSize: ".75rem", color: "var(--muted)", display: "block", marginBottom: 3 }}>Descripción</label>
                          <textarea
                            className="input"
                            rows={2}
                            value={editForm.descripcion}
                            onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))}
                            style={{ resize: "vertical" }}
                          />
                        </div>
                        <div className="field">
                          <label style={{ fontSize: ".75rem", color: "var(--muted)", display: "block", marginBottom: 3 }}>Categoría</label>
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
                      /* View mode */
                      <>
                        {/* Top row: icon + name */}
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <div style={{
                            width: 48, height: 48, borderRadius: "var(--r)",
                            background: `${color}18`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                          }}>
                            <Icon size={24} style={{ color }} strokeWidth={1.75} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: ".875rem", color: "var(--fg)", lineHeight: 1.3, wordBreak: "break-word" }}>
                              {doc.nombre}
                            </p>
                            {doc.descripcion && (
                              <p style={{ margin: "4px 0 0", fontSize: ".75rem", color: "var(--muted)", lineHeight: 1.4 }}>
                                {doc.descripcion}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Meta row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span className="chip" style={{ fontSize: ".68rem" }}>{doc.categoria}</span>
                          <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>{fmtBytes(doc.bytes)}</span>
                          <span style={{ fontSize: ".72rem", color: "var(--muted)", opacity: .6 }}>·</span>
                          <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>
                            {doc.tipoMime.split("/")[1]?.toUpperCase() ?? doc.tipoMime}
                          </span>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                          <a
                            href={doc.url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn sm"
                            style={{ display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}
                          >
                            <Download size={13} /> Descargar
                          </a>
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
                              display: "flex", alignItems: "center", gap: 5,
                              color: "var(--bad)", marginLeft: "auto",
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

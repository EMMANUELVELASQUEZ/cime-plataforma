"use client"
import { useState, useRef } from "react"
import {
  Plus, Trash2, ChevronDown, ChevronRight, Pencil, Check, X,
  Video, FileText, Image, Link2, AlignLeft, Upload, Loader2, GripVertical,
  BookOpen, FolderOpen,
} from "lucide-react"

/* ─── Types ───────────────────────────────────────────── */
type TipoRecurso = "VIDEO_LINK" | "DOCUMENTO" | "IMAGEN" | "TEXTO" | "LINK_EXTERNO"

interface Recurso {
  id: string; tipo: TipoRecurso; titulo: string
  url: string | null; contenido: string | null; tamano: number | null; orden: number
}
interface Leccion {
  id: string; titulo: string; descripcion: string | null; orden: number; recursos: Recurso[]
}
interface Modulo {
  id: string; titulo: string; orden: number; lecciones: Leccion[]
}

/* ─── Helpers ─────────────────────────────────────────── */
const TIPO_ICON: Record<TipoRecurso, React.ReactNode> = {
  VIDEO_LINK: <Video size={15} strokeWidth={1.75} />,
  DOCUMENTO: <FileText size={15} strokeWidth={1.75} />,
  IMAGEN: <Image size={15} strokeWidth={1.75} />,
  TEXTO: <AlignLeft size={15} strokeWidth={1.75} />,
  LINK_EXTERNO: <Link2 size={15} strokeWidth={1.75} />,
}
const TIPO_LABEL: Record<TipoRecurso, string> = {
  VIDEO_LINK: "Video",
  DOCUMENTO: "Documento",
  IMAGEN: "Imagen",
  TEXTO: "Texto",
  LINK_EXTERNO: "Enlace",
}
const TIPO_COLOR: Record<TipoRecurso, string> = {
  VIDEO_LINK: "#ef4444",
  DOCUMENTO: "#3b82f6",
  IMAGEN: "#10b981",
  TEXTO: "#8b5cf6",
  LINK_EXTERNO: "#f59e0b",
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function parseRecursoUrl(raw: string | null): { url: string; nombre: string; tipo: string; bytes: number } | null {
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function openRecurso(raw: string | null) {
  const info = parseRecursoUrl(raw)
  if (!info) return
  const base64 = info.url.split(",")[1]
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  const blob = new Blob([bytes], { type: info.tipo })
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = blobUrl
  a.download = info.nombre
  a.click()
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1500)
}

function getYoutubeThumb(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/)
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null
}

/* ─── Component ────────────────────────────────────────── */
export default function CursoEditorClient({ cursoId, curso }: { cursoId: string; curso: { modulos: Modulo[] } }) {
  const [modulos, setModulos] = useState<Modulo[]>(curso.modulos)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [editingModulo, setEditingModulo] = useState<string | null>(null)
  const [editingLeccion, setEditingLeccion] = useState<string | null>(null)
  const [editTitulo, setEditTitulo] = useState("")
  const [loading, setLoading] = useState<string | null>(null)

  // Add resource modal state
  const [showAddRecurso, setShowAddRecurso] = useState<string | null>(null) // leccionId
  const [recursoTipo, setRecursoTipo] = useState<TipoRecurso>("VIDEO_LINK")
  const [recursoTitulo, setRecursoTitulo] = useState("")
  const [recursoUrl, setRecursoUrl] = useState("")
  const [recursoTexto, setRecursoTexto] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Add lesson form state
  const [showAddLeccion, setShowAddLeccion] = useState<string | null>(null) // moduloId
  const [leccionTitulo, setLeccionTitulo] = useState("")

  /* ── Modules ─────────────────────────────────────────── */
  async function addModulo() {
    const titulo = `Módulo ${modulos.length + 1}`
    setLoading("modulo-new")
    const res = await fetch(`/api/admin/cursos/${cursoId}/modulos`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo }),
    })
    const m = await res.json()
    setModulos(prev => [...prev, m])
    setExpanded(prev => ({ ...prev, [m.id]: true }))
    setLoading(null)
    // Auto-start edit
    setEditingModulo(m.id)
    setEditTitulo(titulo)
  }

  async function saveModulo(moduloId: string) {
    if (!editTitulo.trim()) return cancelEdit()
    setLoading(`modulo-${moduloId}`)
    await fetch(`/api/admin/cursos/${cursoId}/modulos/${moduloId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: editTitulo }),
    })
    setModulos(prev => prev.map(m => m.id === moduloId ? { ...m, titulo: editTitulo } : m))
    cancelEdit()
    setLoading(null)
  }

  async function deleteModulo(moduloId: string) {
    if (!confirm("¿Eliminar este módulo y todas sus lecciones?")) return
    setLoading(`del-modulo-${moduloId}`)
    await fetch(`/api/admin/cursos/${cursoId}/modulos/${moduloId}`, { method: "DELETE" })
    setModulos(prev => prev.filter(m => m.id !== moduloId))
    setLoading(null)
  }

  /* ── Lessons ─────────────────────────────────────────── */
  async function addLeccion(moduloId: string) {
    if (!leccionTitulo.trim()) return
    setLoading(`leccion-${moduloId}`)
    const res = await fetch(`/api/admin/lecciones`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduloId, titulo: leccionTitulo }),
    })
    const lec = await res.json()
    setModulos(prev => prev.map(m =>
      m.id === moduloId ? { ...m, lecciones: [...m.lecciones, lec] } : m
    ))
    setLeccionTitulo("")
    setShowAddLeccion(null)
    setLoading(null)
  }

  async function saveLeccion(leccionId: string, moduloId: string) {
    if (!editTitulo.trim()) return cancelEdit()
    setLoading(`leccion-save-${leccionId}`)
    await fetch(`/api/admin/lecciones/${leccionId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: editTitulo }),
    })
    setModulos(prev => prev.map(m =>
      m.id === moduloId
        ? { ...m, lecciones: m.lecciones.map(l => l.id === leccionId ? { ...l, titulo: editTitulo } : l) }
        : m
    ))
    cancelEdit()
    setLoading(null)
  }

  async function deleteLeccion(leccionId: string, moduloId: string) {
    if (!confirm("¿Eliminar esta lección y todos sus recursos?")) return
    setLoading(`del-leccion-${leccionId}`)
    await fetch(`/api/admin/lecciones/${leccionId}`, { method: "DELETE" })
    setModulos(prev => prev.map(m =>
      m.id === moduloId ? { ...m, lecciones: m.lecciones.filter(l => l.id !== leccionId) } : m
    ))
    setLoading(null)
  }

  /* ── Resources ───────────────────────────────────────── */
  function openAddRecurso(leccionId: string) {
    setShowAddRecurso(leccionId)
    setRecursoTipo("VIDEO_LINK")
    setRecursoTitulo("")
    setRecursoUrl("")
    setRecursoTexto("")
    setUploadErr("")
    dialogRef.current?.showModal()
  }

  function closeDialog() {
    dialogRef.current?.close()
    setShowAddRecurso(null)
    setUploadErr("")
  }

  async function handleFileUpload(file: File): Promise<{ url: string; tamano: number; nombre: string } | null> {
    const fd = new FormData()
    fd.append("file", file)
    setUploading(true)
    setUploadErr("")
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) { setUploadErr(data.error ?? "Error al subir"); return null }
      return data
    } catch {
      setUploadErr("Error de conexión al subir archivo")
      return null
    } finally {
      setUploading(false)
    }
  }

  async function saveRecurso() {
    if (!showAddRecurso || !recursoTitulo.trim()) return
    setLoading("recurso-new")

    let url: string | null = null
    let contenido: string | null = null
    let tamano: number | null = null

    if (recursoTipo === "VIDEO_LINK" || recursoTipo === "LINK_EXTERNO") {
      if (!recursoUrl.trim()) { setLoading(null); return }
      url = recursoUrl.trim()
    } else if (recursoTipo === "TEXTO") {
      if (!recursoTexto.trim()) { setLoading(null); return }
      contenido = recursoTexto.trim()
    } else if (recursoTipo === "DOCUMENTO" || recursoTipo === "IMAGEN") {
      const file = fileRef.current?.files?.[0]
      if (!file) { setUploadErr("Selecciona un archivo"); setLoading(null); return }
      const uploaded = await handleFileUpload(file)
      if (!uploaded) { setLoading(null); return }
      url = uploaded.url
      tamano = uploaded.tamano
    }

    const res = await fetch("/api/admin/recursos", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leccionId: showAddRecurso, tipo: recursoTipo, titulo: recursoTitulo, url, contenido, tamano }),
    })
    const recurso = await res.json()

    setModulos(prev => prev.map(m => ({
      ...m,
      lecciones: m.lecciones.map(l =>
        l.id === showAddRecurso ? { ...l, recursos: [...l.recursos, recurso] } : l
      ),
    })))
    setLoading(null)
    closeDialog()
  }

  async function deleteRecurso(recursoId: string, leccionId: string) {
    setLoading(`del-recurso-${recursoId}`)
    await fetch(`/api/admin/recursos/${recursoId}`, { method: "DELETE" })
    setModulos(prev => prev.map(m => ({
      ...m,
      lecciones: m.lecciones.map(l =>
        l.id === leccionId ? { ...l, recursos: l.recursos.filter(r => r.id !== recursoId) } : l
      ),
    })))
    setLoading(null)
  }

  function cancelEdit() {
    setEditingModulo(null)
    setEditingLeccion(null)
    setEditTitulo("")
  }

  /* ── Stats ───────────────────────────────────────────── */
  const totalLecciones = modulos.reduce((s, m) => s + m.lecciones.length, 0)
  const totalRecursos = modulos.reduce((s, m) => s + m.lecciones.reduce((s2, l) => s2 + l.recursos.length, 0), 0)

  return (
    <>
      {/* Stats */}
      <div className="grid g-3">
        <div className="card stat">
          <span className="eyebrow">Módulos</span>
          <b>{modulos.length}</b>
          <small>Secciones del curso</small>
        </div>
        <div className="card stat">
          <span className="eyebrow">Lecciones</span>
          <b style={{ color: "var(--brand)" }}>{totalLecciones}</b>
          <small>Clases en total</small>
        </div>
        <div className="card stat">
          <span className="eyebrow">Recursos</span>
          <b style={{ color: "var(--ok)" }}>{totalRecursos}</b>
          <small>Videos, archivos y más</small>
        </div>
      </div>

      {/* Module list */}
      <div style={{ display: "grid", gap: 14 }}>
        {modulos.map((modulo, mIdx) => {
          const isOpen = expanded[modulo.id] !== false
          const isEditM = editingModulo === modulo.id

          return (
            <div key={modulo.id} className="editor-module">
              {/* Module header */}
              <div className="editor-module-head">
                <button className="icon-btn" onClick={() => setExpanded(p => ({ ...p, [modulo.id]: !isOpen }))}>
                  {isOpen ? <ChevronDown size={16} strokeWidth={2} /> : <ChevronRight size={16} strokeWidth={2} />}
                </button>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--brand)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <FolderOpen size={14} strokeWidth={2} color="#fff" />
                </div>
                {isEditM ? (
                  <input
                    className="input"
                    style={{ flex: 1, height: 32, fontSize: ".88rem" }}
                    value={editTitulo}
                    autoFocus
                    onChange={e => setEditTitulo(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveModulo(modulo.id); if (e.key === "Escape") cancelEdit() }}
                  />
                ) : (
                  <span style={{ flex: 1, fontWeight: 700, fontSize: ".9rem" }}>
                    <span style={{ color: "var(--muted)", marginRight: 6, fontSize: ".78rem", fontFamily: "var(--f-mono)" }}>
                      {String(mIdx + 1).padStart(2, "0")}
                    </span>
                    {modulo.titulo}
                    <span style={{ marginLeft: 8, fontSize: ".75rem", color: "var(--muted)", fontWeight: 400 }}>
                      {modulo.lecciones.length} lecciones
                    </span>
                  </span>
                )}
                {isEditM ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="btn sm primary" onClick={() => saveModulo(modulo.id)} disabled={loading === `modulo-${modulo.id}`}>
                      <Check size={13} strokeWidth={2.5} />
                    </button>
                    <button className="btn sm" onClick={cancelEdit}><X size={13} strokeWidth={2.5} /></button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="btn sm ghost" onClick={() => { setEditingModulo(modulo.id); setEditTitulo(modulo.titulo) }}>
                      <Pencil size={13} strokeWidth={2} />
                    </button>
                    <button className="btn sm ghost danger" onClick={() => deleteModulo(modulo.id)} disabled={loading === `del-modulo-${modulo.id}`}>
                      {loading === `del-modulo-${modulo.id}` ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} strokeWidth={2} />}
                    </button>
                  </div>
                )}
              </div>

              {/* Lessons */}
              {isOpen && (
                <div>
                  {modulo.lecciones.map((leccion, lIdx) => {
                    const isEditL = editingLeccion === leccion.id
                    return (
                      <div key={leccion.id} className="editor-lesson">
                        {/* Lesson header */}
                        <div className="editor-lesson-head" style={{ background: lIdx % 2 === 0 ? "var(--surface)" : "var(--surface-2)" }}>
                          <div style={{ width: 22, height: 22, borderRadius: 50, border: "1.5px solid var(--line-2)", display: "grid", placeItems: "center", flexShrink: 0, fontSize: ".7rem", fontFamily: "var(--f-mono)", color: "var(--muted)" }}>
                            {mIdx + 1}.{lIdx + 1}
                          </div>
                          {isEditL ? (
                            <input
                              className="input"
                              style={{ flex: 1, height: 30, fontSize: ".85rem" }}
                              value={editTitulo}
                              autoFocus
                              onChange={e => setEditTitulo(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") saveLeccion(leccion.id, modulo.id); if (e.key === "Escape") cancelEdit() }}
                            />
                          ) : (
                            <span style={{ flex: 1, fontSize: ".88rem", fontWeight: 500 }}>{leccion.titulo}</span>
                          )}
                          <div style={{ fontSize: ".72rem", color: "var(--muted)", marginRight: 6 }}>
                            {leccion.recursos.length > 0 && `${leccion.recursos.length} recurso${leccion.recursos.length > 1 ? "s" : ""}`}
                          </div>
                          {isEditL ? (
                            <div style={{ display: "flex", gap: 3 }}>
                              <button className="btn sm primary" onClick={() => saveLeccion(leccion.id, modulo.id)}><Check size={12} strokeWidth={2.5} /></button>
                              <button className="btn sm" onClick={cancelEdit}><X size={12} strokeWidth={2.5} /></button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: 3 }}>
                              <button className="btn sm ghost" onClick={() => openAddRecurso(leccion.id)}>
                                <Plus size={13} strokeWidth={2} /> Recurso
                              </button>
                              <button className="btn sm ghost" onClick={() => { setEditingLeccion(leccion.id); setEditTitulo(leccion.titulo) }}>
                                <Pencil size={12} strokeWidth={2} />
                              </button>
                              <button className="btn sm ghost danger" onClick={() => deleteLeccion(leccion.id, modulo.id)}>
                                <Trash2 size={12} strokeWidth={2} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Resources */}
                        {leccion.recursos.map(recurso => (
                          <div key={recurso.id} className="editor-resource">
                            <div
                              className="editor-resource-icon"
                              style={{ background: `${TIPO_COLOR[recurso.tipo]}18`, color: TIPO_COLOR[recurso.tipo] }}
                            >
                              {TIPO_ICON[recurso.tipo]}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: ".83rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {recurso.titulo}
                              </div>
                              <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>
                                {TIPO_LABEL[recurso.tipo]}
                                {recurso.tamano ? ` · ${formatBytes(recurso.tamano)}` : ""}
                              </div>
                            </div>
                            {recurso.url && (recurso.tipo === "VIDEO_LINK" || recurso.tipo === "LINK_EXTERNO") && (
                              <a href={recurso.url} target="_blank" rel="noopener noreferrer" className="btn sm ghost" style={{ fontSize: ".72rem" }}>
                                <Link2 size={11} strokeWidth={2} /> Ver
                              </a>
                            )}
                            {recurso.url && (recurso.tipo === "DOCUMENTO" || recurso.tipo === "IMAGEN") && (
                              <button className="btn sm ghost" style={{ fontSize: ".72rem" }} onClick={() => openRecurso(recurso.url)}>
                                Ver
                              </button>
                            )}
                            <button
                              className="btn sm ghost danger"
                              onClick={() => deleteRecurso(recurso.id, leccion.id)}
                              disabled={loading === `del-recurso-${recurso.id}`}
                            >
                              {loading === `del-recurso-${recurso.id}` ? <Loader2 size={12} className="spin" /> : <Trash2 size={12} strokeWidth={2} />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  })}

                  {/* Add lesson */}
                  <div style={{ padding: "10px 16px", borderTop: modulo.lecciones.length > 0 ? "1px dashed var(--line)" : "none" }}>
                    {showAddLeccion === modulo.id ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          className="input"
                          style={{ flex: 1, height: 34, fontSize: ".85rem" }}
                          placeholder="Título de la lección..."
                          value={leccionTitulo}
                          autoFocus
                          onChange={e => setLeccionTitulo(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") addLeccion(modulo.id); if (e.key === "Escape") { setShowAddLeccion(null); setLeccionTitulo("") } }}
                        />
                        <button className="btn sm primary" onClick={() => addLeccion(modulo.id)} disabled={loading === `leccion-${modulo.id}`}>
                          {loading === `leccion-${modulo.id}` ? <Loader2 size={13} className="spin" /> : <Check size={13} strokeWidth={2.5} />}
                        </button>
                        <button className="btn sm" onClick={() => { setShowAddLeccion(null); setLeccionTitulo("") }}>
                          <X size={13} strokeWidth={2} />
                        </button>
                      </div>
                    ) : (
                      <button className="btn sm ghost" style={{ fontSize: ".8rem", color: "var(--brand)" }} onClick={() => { setShowAddLeccion(modulo.id); setLeccionTitulo("") }}>
                        <Plus size={14} strokeWidth={2} /> Agregar lección
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Add module */}
        <button
          className="btn"
          style={{ border: "2px dashed var(--line-2)", background: "transparent", height: 46, justifyContent: "center", fontSize: ".88rem" }}
          onClick={addModulo}
          disabled={loading === "modulo-new"}
        >
          {loading === "modulo-new" ? <Loader2 size={16} className="spin" /> : <Plus size={16} strokeWidth={2} />}
          {loading === "modulo-new" ? "Creando..." : "Agregar módulo"}
        </button>
      </div>

      {/* ── Add Resource Dialog ──────────────────────────── */}
      <dialog ref={dialogRef}>
        <div className="dlg-h">
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Agregar recurso</h3>
            <p style={{ fontSize: ".8rem", color: "var(--muted)", marginTop: 2 }}>Sube un archivo o agrega un enlace</p>
          </div>
          <button className="icon-btn" onClick={closeDialog}><X size={18} strokeWidth={2} /></button>
        </div>

        <div className="dlg-b">
          {/* Type selector */}
          <div className="field">
            <label>Tipo de recurso</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["VIDEO_LINK", "DOCUMENTO", "IMAGEN", "TEXTO", "LINK_EXTERNO"] as TipoRecurso[]).map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setRecursoTipo(tipo)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: "var(--r-sm)", fontSize: ".8rem",
                    border: recursoTipo === tipo ? `1.5px solid ${TIPO_COLOR[tipo]}` : "1.5px solid var(--line)",
                    background: recursoTipo === tipo ? `${TIPO_COLOR[tipo]}12` : "var(--surface-2)",
                    color: recursoTipo === tipo ? TIPO_COLOR[tipo] : "var(--fg-2)",
                    cursor: "pointer", fontWeight: recursoTipo === tipo ? 700 : 400,
                  }}
                >
                  {TIPO_ICON[tipo]} {TIPO_LABEL[tipo]}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="field">
            <label>Título</label>
            <input
              className="input"
              placeholder={recursoTipo === "VIDEO_LINK" ? "ej. Introducción al tema" : recursoTipo === "DOCUMENTO" ? "ej. Manual de referencia" : "Título del recurso"}
              value={recursoTitulo}
              onChange={e => setRecursoTitulo(e.target.value)}
            />
          </div>

          {/* Content by type */}
          {(recursoTipo === "VIDEO_LINK") && (
            <div className="field">
              <label>URL del video (YouTube / Vimeo)</label>
              <input
                className="input"
                placeholder="https://youtube.com/watch?v=..."
                value={recursoUrl}
                onChange={e => setRecursoUrl(e.target.value)}
              />
              {recursoUrl && getYoutubeThumb(recursoUrl) && (
                <img src={getYoutubeThumb(recursoUrl)!} alt="" style={{ borderRadius: "var(--r-sm)", marginTop: 4, height: 90, objectFit: "cover" }} />
              )}
            </div>
          )}

          {(recursoTipo === "LINK_EXTERNO") && (
            <div className="field">
              <label>URL del enlace</label>
              <input
                className="input"
                placeholder="https://..."
                value={recursoUrl}
                onChange={e => setRecursoUrl(e.target.value)}
              />
            </div>
          )}

          {(recursoTipo === "TEXTO") && (
            <div className="field">
              <label>Contenido</label>
              <textarea
                className="input"
                rows={6}
                placeholder="Escribe el contenido de texto aquí..."
                value={recursoTexto}
                onChange={e => setRecursoTexto(e.target.value)}
              />
            </div>
          )}

          {(recursoTipo === "DOCUMENTO" || recursoTipo === "IMAGEN") && (
            <div className="field">
              <label>{recursoTipo === "DOCUMENTO" ? "Archivo (PDF, Word, Excel, ZIP, PPT — máx 3 MB)" : "Imagen (JPG, PNG, WebP, GIF — máx 3 MB)"}</label>
              <div
                style={{
                  border: "2px dashed var(--line-2)", borderRadius: "var(--r)", padding: "24px 16px",
                  textAlign: "center", background: "var(--surface-2)", cursor: "pointer",
                }}
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={24} strokeWidth={1.5} style={{ color: "var(--muted)", margin: "0 auto 8px" }} />
                <div style={{ fontSize: ".84rem", color: "var(--fg-2)", marginBottom: 4 }}>
                  {fileRef.current?.files?.[0]?.name ?? "Haz clic o arrastra el archivo aquí"}
                </div>
                <div style={{ fontSize: ".74rem", color: "var(--muted)" }}>
                  {recursoTipo === "DOCUMENTO" ? "PDF · Word · Excel · ZIP" : "JPG · PNG · WebP"}
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                style={{ display: "none" }}
                accept={recursoTipo === "DOCUMENTO"
                  ? ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt"
                  : "image/jpeg,image/png,image/webp,image/gif"}
                onChange={() => {
                  const f = fileRef.current?.files?.[0]
                  if (f && !recursoTitulo) setRecursoTitulo(f.name.replace(/\.[^.]+$/, ""))
                }}
              />
              {uploadErr && <div className="form-err">{uploadErr}</div>}
              {uploading && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--brand)", fontSize: ".83rem", marginTop: 6 }}>
                  <Loader2 size={14} className="spin" /> Subiendo archivo...
                </div>
              )}
            </div>
          )}
        </div>

        <div className="dlg-f">
          <button className="btn" onClick={closeDialog}>Cancelar</button>
          <button
            className="btn primary"
            onClick={saveRecurso}
            disabled={loading === "recurso-new" || uploading || !recursoTitulo.trim()}
          >
            {loading === "recurso-new" ? <><Loader2 size={14} className="spin" /> Guardando...</> : "Agregar recurso"}
          </button>
        </div>
      </dialog>

      <style>{`.spin { animation: spin .8s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

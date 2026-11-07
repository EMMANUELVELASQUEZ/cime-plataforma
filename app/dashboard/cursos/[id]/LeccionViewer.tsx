"use client"
import { useState, useCallback } from "react"
import Link from "next/link"
import {
  ChevronLeft, ChevronRight, ChevronDown,
  Check, Circle, Video, FileText, Image, Link2, AlignLeft,
  Download, ExternalLink, BookOpen, Trophy, Archive, Paperclip,
} from "lucide-react"

/* ─── Types ───────────────────────────────────────────── */
type TipoRecurso = "VIDEO_LINK" | "DOCUMENTO" | "IMAGEN" | "TEXTO" | "LINK_EXTERNO"
interface Recurso { id: string; tipo: TipoRecurso; titulo: string; url: string | null; contenido: string | null; tamano: number | null }
interface Leccion { id: string; titulo: string; descripcion: string | null; orden: number; recursos: Recurso[] }
interface Modulo { id: string; titulo: string; orden: number; lecciones: Leccion[] }
interface Curso { id: string; titulo: string; instructor: string; horas: number; modulos: Modulo[] }

/* ─── Helpers ─────────────────────────────────────────── */
function getEmbedUrl(url: string): string | null {
  // YouTube
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`
  // Vimeo
  const vm = url.match(/vimeo\.com\/([0-9]+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return null
}

interface ArchivoInfo { url: string; nombre: string; tipo: string; bytes: number }

function parseArchivo(raw: string | null): ArchivoInfo | null {
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function downloadArchivo(raw: string | null) {
  const info = parseArchivo(raw)
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

function getBlobUrl(info: ArchivoInfo): string {
  const base64 = info.url.split(",")[1]
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  const blob = new Blob([bytes], { type: info.tipo })
  return URL.createObjectURL(blob)
}

type IconInfo = { Icon: React.ElementType; color: string; bg: string }

function getDocIconByNombre(nombre: string | undefined): IconInfo {
  const ext = (nombre ?? "").split(".").pop()?.toLowerCase()
  if (ext === "pdf") return { Icon: FileText, color: "#ef4444", bg: "#ef444415" }
  if (ext === "docx" || ext === "doc") return { Icon: FileText, color: "#2563eb", bg: "#2563eb15" }
  if (ext === "xlsx" || ext === "xls") return { Icon: FileText, color: "#16a34a", bg: "#16a34a15" }
  if (ext === "pptx" || ext === "ppt") return { Icon: FileText, color: "#f97316", bg: "#f9731615" }
  if (ext === "zip" || ext === "rar") return { Icon: Archive, color: "#f59e0b", bg: "#f59e0b15" }
  if (ext === "txt") return { Icon: AlignLeft, color: "#6b7280", bg: "#6b728015" }
  return { Icon: Paperclip, color: "#6b7280", bg: "#6b728015" }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

const resourceHeaderIcon = { width: 28, height: 28, borderRadius: 7, display: "grid", placeItems: "center", flexShrink: 0 }

/* ─── Resource renderers ──────────────────────────────── */
function RecursoVideo({ recurso }: { recurso: Recurso }) {
  const embed = recurso.url ? getEmbedUrl(recurso.url) : null
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ ...resourceHeaderIcon, background: "#ef444415", color: "#ef4444" }}>
          <Video size={15} strokeWidth={1.75} />
        </div>
        <span style={{ fontWeight: 600, fontSize: ".9rem" }}>{recurso.titulo}</span>
      </div>
      {embed ? (
        <div style={{ aspectRatio: "16/9", background: "#000" }}>
          <iframe src={embed} style={{ width: "100%", height: "100%", border: 0 }} allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
        </div>
      ) : recurso.url ? (
        <div style={{ padding: 20 }}>
          <a href={recurso.url} target="_blank" rel="noopener noreferrer" className="btn primary">
            <ExternalLink size={15} strokeWidth={2} /> Abrir video
          </a>
        </div>
      ) : null}
    </div>
  )
}

function RecursoDocPdf({ recurso, info }: { recurso: Recurso; info: ArchivoInfo }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  function loadPdf() {
    if (blobUrl) return
    setBlobUrl(getBlobUrl(info))
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ ...resourceHeaderIcon, background: "#ef444415", color: "#ef4444" }}>
            <FileText size={15} strokeWidth={1.75} />
          </div>
          <span style={{ fontWeight: 600, fontSize: ".9rem" }}>{recurso.titulo}</span>
          <span style={{ fontSize: ".73rem", color: "var(--muted)" }}>{formatBytes(info.bytes)}</span>
        </div>
        <button className="btn sm" onClick={() => downloadArchivo(recurso.url)}>
          <Download size={13} strokeWidth={2} /> Descargar
        </button>
      </div>
      {!blobUrl ? (
        <div style={{ padding: 24, textAlign: "center" }}>
          <button className="btn primary" onClick={loadPdf}>Ver PDF</button>
        </div>
      ) : (
        <iframe src={blobUrl} style={{ width: "100%", height: 560, border: 0, display: "block" }} />
      )}
    </div>
  )
}

function RecursoDoc({ recurso }: { recurso: Recurso }) {
  const info = parseArchivo(recurso.url)
  if (!info) return null
  if (info.tipo === "application/pdf") return <RecursoDocPdf recurso={recurso} info={info} />
  const { Icon, color, bg } = getDocIconByNombre(info.nombre)
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
      <button
        onClick={() => downloadArchivo(recurso.url)}
        style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", width: "100%", background: "none", border: "none", cursor: "pointer", color: "inherit", textAlign: "left" }}
      >
        <div style={{ width: 46, height: 46, borderRadius: 10, background: bg, color, display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icon size={22} strokeWidth={1.5} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: ".9rem", marginBottom: 2, color: "var(--fg)" }}>{recurso.titulo}</div>
          <div style={{ fontSize: ".76rem", color: "var(--muted)" }}>
            {info.nombre} · {formatBytes(info.bytes)}
          </div>
        </div>
        <Download size={18} strokeWidth={1.75} style={{ color: "var(--muted)", flexShrink: 0 }} />
      </button>
    </div>
  )
}

function RecursoImagen({ recurso }: { recurso: Recurso }) {
  const info = parseArchivo(recurso.url)
  const [imgErr, setImgErr] = useState(false)
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ ...resourceHeaderIcon, background: "#10b98115", color: "#10b981" }}>
            <Image size={15} strokeWidth={1.75} />
          </div>
          <span style={{ fontWeight: 600, fontSize: ".9rem" }}>{recurso.titulo}</span>
          {info && <span style={{ fontSize: ".73rem", color: "var(--muted)" }}>{formatBytes(info.bytes)}</span>}
        </div>
        {info && (
          <button className="btn sm" onClick={() => downloadArchivo(recurso.url)}>
            <Download size={13} strokeWidth={2} /> Descargar
          </button>
        )}
      </div>
      {info && !imgErr && (
        <div style={{ padding: 16, textAlign: "center", background: "var(--surface-2)" }}>
          <img
            src={info.url}
            alt={recurso.titulo}
            style={{ maxWidth: "100%", maxHeight: 500, borderRadius: "var(--r)", objectFit: "contain", margin: "0 auto" }}
            onError={() => setImgErr(true)}
          />
        </div>
      )}
      {info && imgErr && (
        <div style={{ padding: "20px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ color: "var(--muted)", fontSize: ".84rem" }}>No se puede previsualizar esta imagen.</div>
          <button className="btn sm" onClick={() => downloadArchivo(recurso.url)}>
            <Download size={13} strokeWidth={2} /> Descargar
          </button>
        </div>
      )}
    </div>
  )
}

function RecursoTexto({ recurso }: { recurso: Recurso }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ ...resourceHeaderIcon, background: "#8b5cf615", color: "#8b5cf6" }}>
          <AlignLeft size={15} strokeWidth={1.75} />
        </div>
        <span style={{ fontWeight: 600, fontSize: ".9rem" }}>{recurso.titulo}</span>
      </div>
      <div style={{ padding: "20px 24px", lineHeight: 1.75, fontSize: ".9rem", color: "var(--fg-2)", whiteSpace: "pre-wrap" }}>
        {recurso.contenido}
      </div>
    </div>
  )
}

function RecursoLink({ recurso }: { recurso: Recurso }) {
  return (
    <a
      href={recurso.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", textDecoration: "none", color: "inherit" }}
    >
      <div style={{ width: 46, height: 46, borderRadius: 10, background: "#f59e0b15", color: "#f59e0b", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Link2 size={22} strokeWidth={1.5} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: ".9rem", color: "var(--fg)", marginBottom: 2 }}>{recurso.titulo}</div>
        <div style={{ fontSize: ".76rem", color: "var(--brand)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{recurso.url}</div>
      </div>
      <ExternalLink size={18} strokeWidth={1.75} style={{ color: "var(--muted)", flexShrink: 0 }} />
    </a>
  )
}

function RenderRecurso({ recurso }: { recurso: Recurso }) {
  switch (recurso.tipo) {
    case "VIDEO_LINK": return <RecursoVideo recurso={recurso} />
    case "DOCUMENTO": return <RecursoDoc recurso={recurso} />
    case "IMAGEN": return <RecursoImagen recurso={recurso} />
    case "TEXTO": return <RecursoTexto recurso={recurso} />
    case "LINK_EXTERNO": return <RecursoLink recurso={recurso} />
  }
}

/* ─── Main Viewer ─────────────────────────────────────── */
export default function LeccionViewer({
  curso,
  inscripcionId,
  completadasIds: initialCompletadas,
  leccionInicialId,
}: {
  curso: Curso
  inscripcionId: string
  completadasIds: string[]
  leccionInicialId: string | null
}) {
  const todasLecciones = curso.modulos.flatMap(m => m.lecciones)
  const [completadas, setCompletadas] = useState(new Set(initialCompletadas))
  const [leccionId, setLeccionId] = useState(leccionInicialId ?? todasLecciones[0]?.id ?? null)
  const [expandedModulos, setExpandedModulos] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    curso.modulos.forEach(m => { init[m.id] = true })
    return init
  })
  const [marking, setMarking] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const leccionActual = todasLecciones.find(l => l.id === leccionId)
  const idxActual = todasLecciones.findIndex(l => l.id === leccionId)
  const leccionAnterior = idxActual > 0 ? todasLecciones[idxActual - 1] : null
  const leccionSiguiente = idxActual < todasLecciones.length - 1 ? todasLecciones[idxActual + 1] : null
  const progreso = todasLecciones.length > 0 ? Math.round((completadas.size / todasLecciones.length) * 100) : 0
  const cursoCompletado = progreso === 100

  async function marcarCompleta() {
    if (!leccionId || completadas.has(leccionId)) return
    setMarking(true)
    await fetch(`/api/cursos/${curso.id}/progreso`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leccionId }),
    })
    setCompletadas(prev => { const s = new Set(prev); s.add(leccionId); return s })
    setMarking(false)
    if (leccionSiguiente) setLeccionId(leccionSiguiente.id)
  }

  const isCompleta = leccionId ? completadas.has(leccionId) : false

  return (
    <div className="viewer-wrap">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 50 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className={`viewer-nav ${sidebarOpen ? "open" : ""}`}>
        {/* Course info */}
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--line)", background: "var(--surface-2)" }}>
          <Link href="/dashboard/cursos" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: ".76rem", color: "var(--muted)", marginBottom: 10 }}>
            <ChevronLeft size={13} strokeWidth={2} /> Mis cursos
          </Link>
          <div style={{ fontSize: ".88rem", fontWeight: 700, color: "var(--fg)", lineHeight: 1.3, marginBottom: 10 }}>{curso.titulo}</div>
          <div style={{ marginBottom: 5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".72rem", color: "var(--muted)", marginBottom: 4 }}>
              <span>Progreso</span>
              <b style={{ color: progreso === 100 ? "var(--ok)" : "var(--brand)", fontFamily: "var(--f-mono)" }}>{progreso}%</b>
            </div>
            <div className="lms-progress-track">
              <div className="lms-progress-fill" style={{ width: `${progreso}%`, background: progreso === 100 ? "var(--ok)" : "var(--brand)" }} />
            </div>
          </div>
          <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>
            {completadas.size} / {todasLecciones.length} lecciones
          </div>
        </div>

        {/* Module/lesson tree */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {curso.modulos.map((modulo, mIdx) => {
            const isOpen = expandedModulos[modulo.id] !== false
            return (
              <div key={modulo.id} style={{ borderBottom: "1px solid var(--line)" }}>
                <button
                  onClick={() => setExpandedModulos(p => ({ ...p, [modulo.id]: !isOpen }))}
                  style={{
                    width: "100%", textAlign: "left", padding: "10px 14px",
                    display: "flex", alignItems: "center", gap: 8,
                    background: "var(--surface-2)", border: 0, cursor: "pointer",
                    fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: ".08em", color: "var(--fg-2)",
                  }}
                >
                  {isOpen ? <ChevronDown size={13} strokeWidth={2.5} /> : <ChevronRight size={13} strokeWidth={2.5} />}
                  <span style={{ fontFamily: "var(--f-mono)", marginRight: 4, opacity: .6 }}>{String(mIdx + 1).padStart(2, "0")}</span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{modulo.titulo}</span>
                </button>

                {isOpen && modulo.lecciones.map((lec, lIdx) => {
                  const isActive = lec.id === leccionId
                  const isDone = completadas.has(lec.id)
                  return (
                    <button
                      key={lec.id}
                      onClick={() => { setLeccionId(lec.id); setSidebarOpen(false) }}
                      style={{
                        width: "100%", textAlign: "left",
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 14px 9px 24px",
                        background: isActive ? "var(--info-bg)" : "transparent",
                        borderLeft: isActive ? "3px solid var(--brand)" : "3px solid transparent",
                        border: "none", cursor: "pointer",
                        borderBottom: "1px solid var(--line)",
                        fontSize: ".82rem",
                        color: isActive ? "var(--brand)" : isDone ? "var(--ok)" : "var(--fg-2)",
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                        display: "grid", placeItems: "center",
                        background: isDone ? "var(--ok-bg)" : isActive ? "var(--info-bg)" : "var(--surface-3)",
                        border: `1.5px solid ${isDone ? "var(--ok-ring)" : isActive ? "var(--info-ring)" : "var(--line-2)"}`,
                      }}>
                        {isDone
                          ? <Check size={11} strokeWidth={3} style={{ color: "var(--ok)" }} />
                          : <span style={{ fontSize: ".6rem", fontFamily: "var(--f-mono)", color: isActive ? "var(--brand)" : "var(--muted)" }}>{mIdx + 1}.{lIdx + 1}</span>
                        }
                      </div>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{lec.titulo}</span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <div className="viewer-content">
        {cursoCompletado && (
          <div style={{ background: "var(--ok-bg)", border: "1px solid var(--ok-ring)", borderRadius: "var(--r)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <Trophy size={22} strokeWidth={1.75} style={{ color: "var(--ok)", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: "var(--ok)", fontSize: ".92rem" }}>¡Curso completado!</div>
              <div style={{ fontSize: ".8rem", color: "var(--ok)", opacity: .8 }}>Has terminado todas las lecciones. Puedes descargar tu constancia.</div>
            </div>
          </div>
        )}

        {leccionActual ? (
          <>
            {/* Lesson header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <button
                  className="btn sm ghost"
                  style={{ display: "none" }}
                  onClick={() => setSidebarOpen(true)}
                  id="sidebar-toggle"
                >
                  <BookOpen size={14} strokeWidth={2} />
                </button>
                <span style={{ fontSize: ".76rem", color: "var(--muted)", fontFamily: "var(--f-mono)" }}>
                  Lección {idxActual + 1} de {todasLecciones.length}
                </span>
                {isCompleta && (
                  <span className="chip nodot ok" style={{ height: 20, fontSize: ".68rem" }}>
                    <Check size={10} strokeWidth={3} /> Completada
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-.02em" }}>{leccionActual.titulo}</h2>
              {leccionActual.descripcion && (
                <p style={{ marginTop: 6, color: "var(--muted)", fontSize: ".88rem" }}>{leccionActual.descripcion}</p>
              )}
            </div>

            {/* Resources */}
            {leccionActual.recursos.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)" }}>
                <BookOpen size={32} strokeWidth={1.25} style={{ color: "var(--muted)", margin: "0 auto 10px" }} />
                <p style={{ color: "var(--muted)", fontSize: ".88rem" }}>Esta lección aún no tiene contenido.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {leccionActual.recursos.map(r => <RenderRecurso key={r.id} recurso={r} />)}
              </div>
            )}

            {/* Navigation bar */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              marginTop: 32, padding: "16px 0", borderTop: "1px solid var(--line)", flexWrap: "wrap",
            }}>
              <button
                className="btn"
                onClick={() => leccionAnterior && setLeccionId(leccionAnterior.id)}
                disabled={!leccionAnterior}
              >
                <ChevronLeft size={16} strokeWidth={2} /> Anterior
              </button>

              {isCompleta ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ok)", fontSize: ".84rem", fontWeight: 600 }}>
                  <Check size={16} strokeWidth={2.5} /> Completada
                </div>
              ) : (
                <button className="btn primary" onClick={marcarCompleta} disabled={marking}>
                  {marking
                    ? "Guardando..."
                    : leccionSiguiente ? "Completar y continuar →" : "Completar lección ✓"
                  }
                </button>
              )}

              <button
                className="btn"
                onClick={() => leccionSiguiente && setLeccionId(leccionSiguiente.id)}
                disabled={!leccionSiguiente}
              >
                Siguiente <ChevronRight size={16} strokeWidth={2} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <BookOpen size={40} strokeWidth={1.25} style={{ color: "var(--muted)", margin: "0 auto 14px" }} />
            <p style={{ color: "var(--muted)" }}>Este curso aún no tiene contenido.</p>
            <Link href="/dashboard/cursos" className="btn" style={{ marginTop: 16 }}>← Volver a mis cursos</Link>
          </div>
        )}
      </div>
    </div>
  )
}

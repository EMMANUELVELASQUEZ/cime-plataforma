"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Send, ArrowLeft, Search, MessageSquarePlus } from "lucide-react"

// Types 
interface Conversacion {
  usuarioId:       string
  nombre:          string
  numeroColegiado: string | null
  numeroPerito:    string | null
  rol:             string
  ultimoMensaje:   string | null
  ultimaFecha:     string | null
  noLeidos:        number
}

interface Mensaje {
  id:        string
  contenido: string
  deAdmin:   boolean
  leido:     boolean
  usuarioId: string
  createdAt: string
}

// Helpers 
function initials(name: string) {
  return name
    .replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "")
    .split(/\s+/).slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase()
}

const HUES = [211, 142, 262, 24, 199, 327, 38, 172]
const avatarHue = (name: string) => HUES[name.charCodeAt(0) % HUES.length]

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
}

function formatListDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getDate() - d.getDate()
  if (diff === 0 && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth())
    return formatTime(iso)
  if (diff === 1) return "Ayer"
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
}

function groupMessagesByDate(mensajes: Mensaje[]) {
  const groups: { label: string; items: Mensaje[] }[] = []
  let lastLabel = ""
  for (const m of mensajes) {
    const d = new Date(m.createdAt)
    const now = new Date()
    let label: string
    if (d.toDateString() === now.toDateString()) label = "Hoy"
    else {
      const yesterday = new Date(); yesterday.setDate(now.getDate() - 1)
      if (d.toDateString() === yesterday.toDateString()) label = "Ayer"
      else label = d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })
    }
    if (label !== lastLabel) { groups.push({ label, items: [] }); lastLabel = label }
    groups[groups.length - 1].items.push(m)
  }
  return groups
}

// Avatar 
function Avatar({ name, size = 42 }: { name: string; size?: number }) {
  const hue = avatarHue(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `hsl(${hue} 40% 32%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: size * 0.33, fontWeight: 700,
    }}>
      {initials(name)}
    </div>
  )
}

// Role badge 
function RoleBadge({ rol }: { rol: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
 PERITO:    { bg: "#EEF2FF", color: "#4F46E5", label: "Perito" },
 COLEGIADO: { bg: "#F0FDF4", color: "#16A34A", label: "Colegiado" },
 CONTADOR_TESORERO: { bg: "#FFFBEB", color: "#D97706", label: "Tesorero" },
  }
  const s = map[rol] ?? { bg: "#F3F4F6", color: "#6B7280", label: rol }
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: 10, fontWeight: 700,
      padding: "1px 6px", borderRadius: 20, letterSpacing: 0.3, whiteSpace: "nowrap",
    }}>{s.label}</span>
  )
}

// 
// Main page
// 
export default function AdminMensajesPage() {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [search, setSearch]                 = useState("")
  const [seleccionado, setSeleccionado]     = useState<Conversacion | null>(null)
  const [mensajes, setMensajes]             = useState<Mensaje[]>([])
  const [input, setInput]                   = useState("")
  const [sending, setSending]               = useState(false)
  const [mobileView, setMobileView]         = useState<"list" | "chat">("list")
  const [isMobile, setIsMobile]             = useState(false)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 769)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const fetchConversaciones = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/mensajes")
      if (r.ok) setConversaciones(await r.json())
    } catch {}
  }, [])

  const fetchThread = useCallback(async (uid: string) => {
    try {
      const r = await fetch(`/api/admin/mensajes/${uid}`)
      if (r.ok) setMensajes(await r.json())
    } catch {}
  }, [])

  useEffect(() => { fetchConversaciones() }, [fetchConversaciones])
  useEffect(() => {
    const id = setInterval(fetchConversaciones, 5000)
    return () => clearInterval(id)
  }, [fetchConversaciones])
  useEffect(() => {
    if (!seleccionado) return
    const id = setInterval(() => fetchThread(seleccionado.usuarioId), 5000)
    return () => clearInterval(id)
  }, [seleccionado, fetchThread])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensajes])

  const filtered = conversaciones.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (c.numeroColegiado ?? "").includes(search) ||
    (c.numeroPerito ?? "").includes(search)
  )

  // Split: unread + with messages first, then the rest (new conversations)
  const conMensajes  = filtered.filter(c => c.ultimoMensaje !== null)
  const sinMensajes  = filtered.filter(c => c.ultimoMensaje === null)

  async function selectConversacion(c: Conversacion) {
    setSeleccionado(c)
    setMensajes([])
    if (isMobile) setMobileView("chat")
    await fetchThread(c.usuarioId)
    // Optimistically clear unread badge
    setConversaciones(prev => prev.map(x => x.usuarioId === c.usuarioId ? { ...x, noLeidos: 0 } : x))
  }

  async function sendMessage() {
    if (!input.trim() || sending || !seleccionado) return
    setSending(true)
    const contenido = input.trim()
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    try {
      const r = await fetch(`/api/admin/mensajes/${seleccionado.usuarioId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido }),
      })
      if (r.ok) {
        await fetchThread(seleccionado.usuarioId)
        await fetchConversaciones()
      }
    } catch {}
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = e.target; el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  const groups = groupMessagesByDate(mensajes)

  // Conversation row 
  const ConvRow = ({ c }: { c: Conversacion }) => {
    const active = seleccionado?.usuarioId === c.usuarioId
    const idLabel = c.rol === "PERITO"
      ? (c.numeroPerito ? `CIME-PER-${String(c.numeroPerito).padStart(3,"0")}` : "Sin número")
      : (c.numeroColegiado ? `CIME-VER-${c.numeroColegiado}` : "Sin número")
    return (
      <button
        onClick={() => selectConversacion(c)}
        style={{
          width: "100%", textAlign: "left", border: "none", cursor: "pointer",
          padding: "11px 16px", outline: "none",
          background: active ? "var(--surface)" : "transparent",
          borderBottom: "1px solid var(--line)",
          transition: "background .1s",
        }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface-2)" }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent" }}
      >
        <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Avatar name={c.nombre} size={44} />
            {c.noLeidos > 0 && (
              <span style={{
                position: "absolute", bottom: -1, right: -1,
                background: "#25D366", color: "#fff",
                borderRadius: "50%", width: 18, height: 18,
                fontSize: 10, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid var(--surface-2)",
              }}>
                {c.noLeidos > 9 ? "9+" : c.noLeidos}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4 }}>
              <span style={{
                fontWeight: c.noLeidos > 0 ? 700 : 600,
                fontSize: ".86rem", color: "var(--fg)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{c.nombre}</span>
              <span style={{ fontSize: ".67rem", color: c.noLeidos > 0 ? "#25D366" : "var(--muted)", flexShrink: 0 }}>
                {c.ultimaFecha ? formatListDate(c.ultimaFecha) : ""}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <RoleBadge rol={c.rol} />
              <span style={{ fontSize: ".69rem", color: "var(--muted)", fontFamily: "monospace" }}>
                {idLabel}
              </span>
            </div>
            <div style={{
              fontSize: ".76rem", color: c.noLeidos > 0 ? "var(--fg)" : "var(--muted)",
              fontWeight: c.noLeidos > 0 ? 500 : 400,
              marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {c.ultimoMensaje
                ? (c.ultimoMensaje.length > 45 ? c.ultimoMensaje.slice(0, 45) + "…" : c.ultimoMensaje)
                : <span style={{ fontStyle: "italic", color: "var(--muted)" }}>Iniciar conversación</span>
              }
            </div>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div style={{ padding: "0 0 0 0", height: "calc(100vh - 61px)", display: "flex", flexDirection: "column" }}>
      <div style={{
        display: "flex",
        flex: 1,
        overflow: "hidden",
        borderTop: "1px solid var(--line)",
      }}>

        {/* LEFT PANEL  */}
        <div style={{
          width: isMobile ? "100%" : 320,
          flexShrink: 0,
          borderRight: isMobile ? "none" : "1px solid var(--line)",
          display: isMobile && mobileView !== "list" ? "none" : "flex",
          flexDirection: "column",
          background: "var(--surface-2)",
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 16px 10px",
            borderBottom: "1px solid var(--line)",
            background: "var(--surface)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h2 style={{ fontSize: ".96rem", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
 Mensajes
              </h2>
              <span style={{
                fontSize: 11, fontWeight: 600, color: "var(--muted)",
                background: "var(--surface-2)", border: "1px solid var(--line)",
                padding: "2px 8px", borderRadius: 20,
              }}>
                {conversaciones.length} usuarios
              </span>
            </div>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search size={14} style={{
                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                color: "var(--muted)", pointerEvents: "none",
              }} />
              <input
                placeholder="Buscar por nombre o número..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: "100%", border: "1px solid var(--line)", borderRadius: 8,
                  padding: "7px 10px 7px 30px", fontSize: ".82rem",
                  background: "var(--surface-2)", color: "var(--fg)",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "var(--brand)" }}
                onBlur={e => { e.currentTarget.style.borderColor = "var(--line)" }}
              />
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {/* Conversations with messages */}
            {conMensajes.length > 0 && (
              <>
                <div style={{
                  padding: "7px 16px 4px",
                  fontSize: ".62rem", fontWeight: 700, letterSpacing: 1,
                  color: "var(--muted)", textTransform: "uppercase",
                  background: "var(--surface-2)",
                  borderBottom: "1px solid var(--line)",
                }}>Conversaciones recientes</div>
                {conMensajes.map(c => <ConvRow key={c.usuarioId} c={c} />)}
              </>
            )}

            {/* New conversations (no messages yet) */}
            {sinMensajes.length > 0 && (
              <>
                <div style={{
                  padding: "7px 16px 4px",
                  fontSize: ".62rem", fontWeight: 700, letterSpacing: 1,
                  color: "var(--muted)", textTransform: "uppercase",
                  background: "var(--surface-2)",
                  borderBottom: "1px solid var(--line)",
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  <MessageSquarePlus size={11} />
 Nuevas conversaciones
                </div>
                {sinMensajes.map(c => <ConvRow key={c.usuarioId} c={c} />)}
              </>
            )}

            {filtered.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: ".84rem" }}>
 No se encontraron usuarios
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL  */}
        <div style={{
          flex: 1, minWidth: 0,
          display: isMobile && mobileView !== "chat" ? "none" : "flex",
          flexDirection: "column",
          background: "var(--surface)",
        }}>
          {!seleccionado ? (
            /* Empty state */
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 14,
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "var(--surface-2)", border: "1px solid var(--line)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MessageSquarePlus size={30} style={{ color: "var(--muted)" }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--fg)", margin: 0 }}>
 Selecciona una conversación
                </p>
                <p style={{ fontSize: ".82rem", color: "var(--muted)", margin: "5px 0 0" }}>
 Elige un usuario de la lista para ver o iniciar una conversación.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{
                padding: "12px 18px",
                borderBottom: "1px solid var(--line)",
                background: "var(--surface-2)",
                display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
              }}>
                {isMobile && (
                  <button onClick={() => { setMobileView("list"); setSeleccionado(null) }}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--brand)", fontSize: ".84rem", fontWeight: 600,
                      padding: "0 4px 0 0", flexShrink: 0,
                    }}>
                    <ArrowLeft size={16} strokeWidth={2} /> Volver
                  </button>
                )}
                <Avatar name={seleccionado.nombre} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: ".94rem", color: "var(--fg)", lineHeight: 1.3 }}>
                    {seleccionado.nombre}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                    <RoleBadge rol={seleccionado.rol} />
                    <span style={{ fontSize: ".71rem", color: "var(--muted)", fontFamily: "monospace" }}>
                      {seleccionado.rol === "PERITO"
                        ? (seleccionado.numeroPerito ? `CIME-PER-${String(seleccionado.numeroPerito).padStart(3,"0")}` : "Sin número")
                        : (seleccionado.numeroColegiado ? `CIME-VER-${seleccionado.numeroColegiado}` : "Sin número")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bubbles */}
              <div style={{
                flex: 1, overflowY: "auto", padding: "16px 20px",
                display: "flex", flexDirection: "column", gap: 2,
              }}>
                {mensajes.length === 0 ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <Avatar name={seleccionado.nombre} size={56} />
                    <p style={{ color: "var(--muted)", fontSize: ".86rem", textAlign: "center", maxWidth: 260 }}>
 Aún no hay mensajes con <strong>{seleccionado.nombre.split(" ")[0]}</strong>.<br />
 Inicia la conversación aquí abajo.
                    </p>
                  </div>
                ) : (
                  groups.map(g => (
                    <div key={g.label}>
                      {/* Date separator */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0 10px" }}>
                        <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
                        <span style={{
                          fontSize: ".67rem", fontWeight: 600, color: "var(--muted)",
                          padding: "2px 10px", background: "var(--surface-2)",
                          borderRadius: 20, border: "1px solid var(--line)",
                          whiteSpace: "nowrap",
                        }}>{g.label}</span>
                        <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
                      </div>

                      {g.items.map(m => {
                        const isAdmin = m.deAdmin
                        return (
                          <div key={m.id} style={{
                            display: "flex",
                            justifyContent: isAdmin ? "flex-end" : "flex-start",
                            marginBottom: 4,
                          }}>
                            {!isAdmin && (
                              <div style={{ marginRight: 6, alignSelf: "flex-end", flexShrink: 0 }}>
                                <Avatar name={seleccionado.nombre} size={26} />
                              </div>
                            )}
                            <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", gap: 2 }}>
                              <div style={{
                                padding: "9px 13px",
                                borderRadius: isAdmin ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                                background: isAdmin ? "#1D4ED8" : "var(--surface-2)",
                                color: isAdmin ? "#fff" : "var(--fg)",
                                fontSize: ".85rem", lineHeight: 1.55,
                                wordBreak: "break-word",
                                border: isAdmin ? "none" : "1px solid var(--line)",
                                boxShadow: "0 1px 2px rgba(0,0,0,.07)",
                                whiteSpace: "pre-wrap",
                              }}>
                                {m.contenido}
                              </div>
                              <div style={{
                                fontSize: ".63rem", color: "var(--muted)",
                                textAlign: isAdmin ? "right" : "left",
                                display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start",
                                alignItems: "center", gap: 4,
                              }}>
                                {formatTime(m.createdAt)}
                                {isAdmin && (
                                  <span style={{ color: m.leido ? "#25D366" : "var(--muted)" }}>
                                    {m.leido ? "" : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input bar */}
              <div style={{
                padding: "10px 16px",
                borderTop: "1px solid var(--line)",
                background: "var(--surface-2)",
                display: "flex", gap: 8, alignItems: "flex-end", flexShrink: 0,
              }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje… (Enter para enviar, Shift+Enter para nueva línea)"
                  rows={1}
                  disabled={sending}
                  style={{
                    flex: 1, resize: "none",
                    border: "1px solid var(--line)", borderRadius: 22,
                    padding: "9px 14px", fontSize: ".85rem",
                    color: "var(--fg)", background: "var(--surface)",
                    outline: "none", lineHeight: "20px",
                    maxHeight: 120, overflowY: "auto", fontFamily: "inherit",
                    transition: "border-color .15s",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = "var(--brand)" }}
                  onBlur={e => { e.currentTarget.style.borderColor = "var(--line)" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  style={{
                    width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                    background: input.trim() && !sending ? "#1D4ED8" : "var(--surface)",
                    border: `1px solid ${input.trim() && !sending ? "#1D4ED8" : "var(--line)"}`,
                    cursor: input.trim() && !sending ? "pointer" : "not-allowed",
                    color: input.trim() && !sending ? "#fff" : "var(--muted)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background .15s, border-color .15s, color .15s",
                  }}
                >
                  <Send size={16} strokeWidth={2} style={{ transform: "translateX(1px)" }} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

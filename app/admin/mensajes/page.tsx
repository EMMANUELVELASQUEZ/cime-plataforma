"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Send } from "lucide-react"

interface Conversacion {
  usuarioId:       string
  nombre:          string
  numeroColegiado: string | null
  ultimoMensaje:   string | null
  ultimaFecha:     string | null
  noLeidos:        number
}

interface Mensaje {
  id:        string
  contenido:  string
  deAdmin:   boolean
  leido:     boolean
  usuarioId: string
  createdAt: string
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
}

export default function AdminMensajesPage() {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [seleccionado, setSeleccionado]     = useState<Conversacion | null>(null)
  const [mensajes, setMensajes]             = useState<Mensaje[]>([])
  const [input, setInput]                   = useState("")
  const [sending, setSending]               = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  // Initial load
  useEffect(() => { fetchConversaciones() }, [fetchConversaciones])

  // Poll conversations every 5s
  useEffect(() => {
    const id = setInterval(fetchConversaciones, 5000)
    return () => clearInterval(id)
  }, [fetchConversaciones])

  // Poll thread every 5s when a conversation is selected
  useEffect(() => {
    if (!seleccionado) return
    const id = setInterval(() => fetchThread(seleccionado.usuarioId), 5000)
    return () => clearInterval(id)
  }, [seleccionado, fetchThread])

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensajes])

  async function selectConversacion(c: Conversacion) {
    setSeleccionado(c)
    setMensajes([])
    await fetchThread(c.usuarioId)
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`
  }

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Page header */}
      <div className="page-head" style={{ marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: ".76rem", color: "var(--muted)", marginBottom: 2 }}>
            Administracion
          </p>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
            Mensajes
          </h1>
        </div>
      </div>

      {/* Split pane */}
      <div
        style={{
          display: "flex",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
          height: "calc(100vh - 180px)",
          minHeight: 400,
          background: "var(--surface)",
        }}
      >
        {/* Left pane — conversation list */}
        <div
          style={{
            width: 280,
            flexShrink: 0,
            borderRight: "1px solid var(--line)",
            display: "flex",
            flexDirection: "column",
            background: "var(--surface-2)",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--line)",
              fontWeight: 700,
              fontSize: ".92rem",
              color: "var(--fg)",
            }}
          >
            Mensajes
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {conversaciones.length === 0 ? (
              <div style={{ padding: 20, fontSize: ".82rem", color: "var(--muted)", textAlign: "center" }}>
                No hay colegiados registrados
              </div>
            ) : (
              conversaciones.map(c => {
                const active = seleccionado?.usuarioId === c.usuarioId
                return (
                  <button
                    key={c.usuarioId}
                    onClick={() => selectConversacion(c)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 14px",
                      borderTop: "none",
                      borderLeft: "none",
                      borderRight: "none",
                      borderBottom: "1px solid var(--line)",
                      background: active ? "var(--surface)" : "transparent",
                      cursor: "pointer",
                      outline: "none",
                      transition: "background .12s",
                    }}
                    onMouseEnter={e => {
                      if (!active) (e.currentTarget as HTMLButtonElement).style.background = "var(--surface)"
                    }}
                    onMouseLeave={e => {
                      if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontWeight: 600, fontSize: ".84rem", color: "var(--fg)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>
                            {c.nombre}
                          </span>
                          {c.noLeidos > 0 && (
                            <span style={{
                              background: "var(--bad)",
                              color: "#fff",
                              borderRadius: "50%",
                              width: 18,
                              height: 18,
                              fontSize: ".6rem",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}>
                              {c.noLeidos > 9 ? "9+" : c.noLeidos}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: ".71rem", color: "var(--muted)", marginBottom: 3 }}>
                          {c.numeroColegiado ? `Col. ${c.numeroColegiado}` : "Sin numero"}
                        </div>
                        <div style={{ fontSize: ".76rem", color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.ultimoMensaje
                            ? (c.ultimoMensaje.length > 40 ? c.ultimoMensaje.slice(0, 40) + "..." : c.ultimoMensaje)
                            : <span style={{ fontStyle: "italic" }}>Sin mensajes aún</span>
                          }
                        </div>
                      </div>
                      <div style={{ fontSize: ".67rem", color: "var(--muted)", flexShrink: 0, marginTop: 2 }}>
                        {c.ultimaFecha ? formatDate(c.ultimaFecha) : ""}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right pane — chat thread */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {!seleccionado ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: "var(--muted)", fontSize: ".9rem" }}>
                Selecciona una conversacion
              </p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div
                style={{
                  padding: "12px 18px",
                  borderBottom: "1px solid var(--line)",
                  background: "var(--surface-2)",
                  flexShrink: 0,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: ".92rem", color: "var(--fg)" }}>
                  {seleccionado.nombre}
                </div>
                <div style={{ fontSize: ".74rem", color: "var(--muted)", marginTop: 1 }}>
                  {seleccionado.numeroColegiado ? `Col. ${seleccionado.numeroColegiado}` : "Sin numero"}
                </div>
              </div>

              {/* Bubbles */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {mensajes.length === 0 ? (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <p style={{ color: "var(--muted)", fontSize: ".84rem" }}>Sin mensajes aun</p>
                  </div>
                ) : (
                  mensajes.map(m => {
                    const isAdmin = m.deAdmin
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: "flex",
                          justifyContent: isAdmin ? "flex-end" : "flex-start",
                        }}
                      >
                        <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", gap: 3 }}>
                          <div
                            style={{
                              padding: "9px 13px",
                              borderRadius: isAdmin ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                              background: isAdmin ? "var(--brand)" : "var(--surface-2)",
                              color: isAdmin ? "#fff" : "var(--fg)",
                              fontSize: ".85rem",
                              lineHeight: 1.5,
                              wordBreak: "break-word",
                              border: isAdmin ? "none" : "1px solid var(--line)",
                            }}
                          >
                            {m.contenido}
                          </div>
                          <div
                            style={{
                              fontSize: ".67rem",
                              color: "var(--muted)",
                              textAlign: isAdmin ? "right" : "left",
                            }}
                          >
                            {formatTime(m.createdAt)}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div
                style={{
                  padding: "10px 14px",
                  borderTop: "1px solid var(--line)",
                  background: "var(--surface)",
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-end",
                  flexShrink: 0,
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe una respuesta... (Enter para enviar)"
                  rows={1}
                  style={{
                    flex: 1,
                    resize: "none",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--r)",
                    padding: "8px 10px",
                    fontSize: ".84rem",
                    color: "var(--fg)",
                    background: "var(--surface-2)",
                    outline: "none",
                    lineHeight: "20px",
                    maxHeight: 100,
                    overflowY: "auto",
                    fontFamily: "inherit",
                  }}
                  disabled={sending}
                  onFocus={e => { e.currentTarget.style.borderColor = "var(--brand)" }}
                  onBlur={e => { e.currentTarget.style.borderColor = "var(--line)" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--r)",
                    background: input.trim() && !sending ? "var(--brand)" : "var(--surface-2)",
                    border: "1px solid var(--line)",
                    cursor: input.trim() && !sending ? "pointer" : "not-allowed",
                    color: input.trim() && !sending ? "#fff" : "var(--muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background .15s, color .15s",
                  }}
                >
                  <Send size={15} strokeWidth={2} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

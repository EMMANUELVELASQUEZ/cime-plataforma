"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Send } from "lucide-react"

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

export default function ColegiadoMensajesPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [input, setInput]       = useState("")
  const [sending, setSending]   = useState(false)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fetchMensajes = useCallback(async () => {
    try {
      const r = await fetch("/api/mensajes")
      if (r.ok) setMensajes(await r.json())
    } catch {}
  }, [])

  useEffect(() => { fetchMensajes() }, [fetchMensajes])

  // Poll every 5s
  useEffect(() => {
    const id = setInterval(fetchMensajes, 5000)
    return () => clearInterval(id)
  }, [fetchMensajes])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensajes])

  async function sendMessage() {
    if (!input.trim() || sending) return
    setSending(true)
    const contenido = input.trim()
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    try {
      const r = await fetch("/api/mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido }),
      })
      if (r.ok) await fetchMensajes()
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
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", height: "calc(100vh - 60px)" }}>
      {/* Header */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
          Chat con Administracion
        </h1>
        <p style={{ fontSize: ".8rem", color: "var(--muted)", marginTop: 4 }}>
          Las respuestas pueden tardar unos minutos
        </p>
      </div>

      {/* Chat container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
          background: "var(--surface)",
          minHeight: 0,
        }}
      >
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
              <p style={{ color: "var(--muted)", fontSize: ".88rem", textAlign: "center" }}>
                Envia un mensaje a la administracion para iniciar la conversacion.
              </p>
            </div>
          ) : (
            mensajes.map(m => {
              const isMine = !m.deAdmin
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    justifyContent: isMine ? "flex-end" : "flex-start",
                  }}
                >
                  <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", gap: 3 }}>
                    <div
                      style={{
                        padding: "9px 13px",
                        borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: isMine ? "var(--brand)" : "var(--surface-2)",
                        color: isMine ? "#fff" : "var(--fg)",
                        fontSize: ".85rem",
                        lineHeight: 1.5,
                        wordBreak: "break-word",
                        border: isMine ? "none" : "1px solid var(--line)",
                      }}
                    >
                      {m.contenido}
                    </div>
                    <div
                      style={{
                        fontSize: ".67rem",
                        color: "var(--muted)",
                        textAlign: isMine ? "right" : "left",
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
            placeholder="Escribe tu mensaje... (Enter para enviar)"
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
      </div>
    </div>
  )
}

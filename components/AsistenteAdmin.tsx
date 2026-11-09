"use client"
import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Loader2, Bot, User, Minimize2, Trash2 } from "lucide-react"

interface Msg { role: "user" | "assistant"; content: string }

const STORAGE_KEY = "cime.asistente.msgs"
const GREETING: Msg = {
  role: "assistant",
  content: "Hola, soy tu asistente de administración del Portal CIME Veracruz. ¿En qué puedo ayudarte hoy?",
}

function renderContent(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, "• $1")
    .replace(/\n/g, "<br>")
}

export default function AsistenteAdmin() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Msg[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed)
          setInitialized(true)
          return
        }
      }
    } catch {}
    setInitialized(true)
  }, [])

  // Show greeting when first opened with no messages
  useEffect(() => {
    if (open && initialized && messages.length === 0) {
      setMessages([GREETING])
    }
  }, [open, initialized])

  // Save to localStorage on changes
  useEffect(() => {
    if (!initialized) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {}
  }, [messages, initialized])

  // Auto-scroll to bottom
  useEffect(() => {
    if (open) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
    }
  }, [messages, open])

  // Escape key to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  // Auto-resize textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = "auto"
    const lineHeight = 20
    const maxHeight = lineHeight * 3 + 20
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg: Msg = { role: "user", content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
    setLoading(true)

    // Add empty assistant message placeholder
    setMessages(prev => [...prev, { role: "assistant", content: "" }])

    try {
      const res = await fetch("/api/admin/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.ok || !res.body) {
        let errMsg = "Error al conectar con el asistente."
        try {
          const errData = await res.json()
          if (errData?.error?.includes("configurado") || res.status === 503) {
            errMsg = "El asistente no está configurado. Contacta al administrador del sistema."
          } else if (res.status === 401) {
            errMsg = "Sin autorización para usar el asistente."
          }
        } catch {}
        setMessages(prev =>
          prev.slice(0, -1).concat({ role: "assistant", content: errMsg })
        )
        setLoading(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data:")) continue
          const data = line.slice(5).trim()
          if (data === "[DONE]") break
          try {
            const j = JSON.parse(data)
            if (j.type === "content_block_delta" && j.delta?.type === "text_delta") {
              full += j.delta.text
              setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: full }])
            }
          } catch {}
        }
      }
    } catch {
      setMessages(prev =>
        prev.slice(0, -1).concat({ role: "assistant", content: "Error al conectar con el asistente." })
      )
    } finally {
      setLoading(false)
    }
  }

  function clearConversation() {
    setMessages([GREETING])
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        title="Asistente IA"
        aria-label="Asistente IA"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 999,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--brand)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,.28)",
          transition: "transform .15s ease, box-shadow .15s ease",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.transform = "scale(1.08)"
          el.style.boxShadow = "0 8px 32px rgba(0,0,0,.35)"
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.transform = "scale(1)"
          el.style.boxShadow = "0 4px 24px rgba(0,0,0,.28)"
        }}
      >
        {open
          ? <Minimize2 size={22} strokeWidth={2} />
          : <MessageCircle size={22} strokeWidth={2} />
        }
      </button>

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 92,
            right: 24,
            zIndex: 1000,
            width: 380,
            height: 520,
            borderRadius: "var(--r-lg)",
            background: "var(--surface)",
            boxShadow: "0 24px 64px rgba(0,0,0,.35)",
            border: "1px solid var(--line)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderBottom: "1px solid var(--line)",
            background: "var(--surface-2, var(--surface))",
            flexShrink: 0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "var(--brand)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Bot size={17} style={{ color: "#fff" }} strokeWidth={2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: ".875rem", color: "var(--fg)", lineHeight: 1.2 }}>
                Asistente CIME
              </p>
              <p style={{ margin: 0, fontSize: ".7rem", color: "var(--muted)" }}>
                {loading ? "Escribiendo..." : "En línea"}
              </p>
            </div>
            <button
              onClick={clearConversation}
              title="Limpiar conversación"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--muted)", padding: 4, borderRadius: "var(--r-sm)",
                display: "flex", alignItems: "center",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--bad)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)" }}
            >
              <Trash2 size={15} strokeWidth={1.75} />
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--muted)", padding: 4, borderRadius: "var(--r-sm)",
                display: "flex", alignItems: "center",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--fg)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)" }}
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}>
            {messages.map((msg, i) => {
              const isUser = msg.role === "user"
              const isEmpty = msg.content === "" && loading && i === messages.length - 1
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                    alignItems: "flex-end",
                    gap: 6,
                  }}
                >
                  {!isUser && (
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: "var(--brand)", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginBottom: 2,
                    }}>
                      <Bot size={13} style={{ color: "#fff" }} strokeWidth={2} />
                    </div>
                  )}
                  <div style={{
                    maxWidth: "78%",
                    padding: "9px 12px",
                    borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: isUser ? "var(--brand)" : "var(--surface-2, rgba(0,0,0,.04))",
                    color: isUser ? "#fff" : "var(--fg)",
                    fontSize: ".84rem",
                    lineHeight: 1.5,
                    wordBreak: "break-word",
                    border: isUser ? "none" : "1px solid var(--line)",
                  }}>
                    {isEmpty ? (
                      /* Animated dots */
                      <div style={{ display: "flex", gap: 4, padding: "2px 4px" }}>
                        {[0, 1, 2].map(j => (
                          <div key={j} style={{
                            width: 7, height: 7, borderRadius: "50%",
                            background: "var(--muted)",
                            animation: `dotPulse 1.4s ease-in-out ${j * 0.2}s infinite`,
                          }} />
                        ))}
                      </div>
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
                    )}
                  </div>
                  {isUser && (
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: "var(--surface-2, rgba(0,0,0,.08))",
                      border: "1px solid var(--line)",
                      flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginBottom: 2,
                    }}>
                      <User size={13} style={{ color: "var(--muted)" }} strokeWidth={2} />
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "10px 12px",
            borderTop: "1px solid var(--line)",
            background: "var(--surface)",
            flexShrink: 0,
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
          }}>
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
                background: "var(--surface-2, var(--surface))",
                outline: "none",
                lineHeight: "20px",
                maxHeight: 80,
                overflowY: "auto",
                fontFamily: "inherit",
              }}
              disabled={loading}
              onFocus={e => { e.currentTarget.style.borderColor = "var(--brand)" }}
              onBlur={e => { e.currentTarget.style.borderColor = "var(--line)" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, borderRadius: "var(--r)",
                background: input.trim() && !loading ? "var(--brand)" : "var(--surface-2, rgba(0,0,0,.06))",
                border: "1px solid var(--line)",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                color: input.trim() && !loading ? "#fff" : "var(--muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                transition: "background .15s, color .15s",
              }}
            >
              {loading
                ? <Loader2 size={15} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} />
                : <Send size={15} strokeWidth={2} />
              }
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: .4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  )
}

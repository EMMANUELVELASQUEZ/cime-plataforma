"use client"
import { useState } from "react"

const PLANTILLAS = [
  {
    label: "Renovación de vigencia",
    texto: "Estimado miembro,\n\nLe informamos que su vigencia en el Colegio de Ingenieros Mecánicos y Eléctricos de Veracruz está próxima a vencer. Para renovarla, comuníquese con la administración o realice el trámite correspondiente.\n\nAtentamente,\nAdministración CIME Veracruz",
  },
  {
    label: "Convocatoria a curso",
    texto: "Estimado miembro,\n\nLe informamos que tenemos disponible un nuevo curso de actualización profesional. Para inscribirse, ingrese a su portal y consulte la sección de Cursos.\n\nAtentamente,\nAdministración CIME Veracruz",
  },
  {
    label: "Pago pendiente",
    texto: "Estimado miembro,\n\nLe recordamos que tiene un pago pendiente con el Colegio. Le pedimos regularice su situación a la brevedad posible para mantener su membresía activa.\n\nAtentamente,\nAdministración CIME Veracruz",
  },
  {
    label: "Aviso general",
    texto: "Estimado miembro,\n\nLe hacemos llegar un aviso importante de la administración del Colegio de Ingenieros Mecánicos y Eléctricos de Veracruz.\n\n[Escriba aquí el contenido del aviso]\n\nAtentamente,\nAdministración CIME Veracruz",
  },
]

export default function ComunicadosPage() {
  const [contenido, setContenido] = useState("")
  const [roles, setRoles] = useState<Record<string, boolean>>({ COLEGIADO: true, PERITO: true })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [charCount, setCharCount] = useState(0)

  function toggleRole(r: string) {
    setRoles(prev => ({ ...prev, [r]: !prev[r] }))
  }

  function applyTemplate(texto: string) {
    setContenido(texto)
    setCharCount(texto.length)
    setResult(null)
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContenido(e.target.value)
    setCharCount(e.target.value.length)
    setResult(null)
  }

  async function handleSend() {
    if (!contenido.trim()) return
    const selectedRoles = Object.entries(roles).filter(([, v]) => v).map(([k]) => k)
    if (selectedRoles.length === 0) {
      setResult({ ok: false, msg: "Selecciona al menos un grupo destinatario." })
      return
    }
    setSending(true)
    setResult(null)
    try {
      const res = await fetch("/api/admin/mensajes/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido, roles: selectedRoles }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult({ ok: false, msg: data.error ?? "Error al enviar." })
      } else {
        setResult({ ok: true, msg: `✓ Comunicado enviado a ${data.enviados} miembro${data.enviados !== 1 ? "s" : ""} exitosamente.` })
        setContenido("")
        setCharCount(0)
      }
    } catch {
      setResult({ ok: false, msg: "Error de conexión. Intenta de nuevo." })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Comunicados masivos</h1>
          <p>Envía un mensaje a todos los miembros de un grupo.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
        {/* Compose panel */}
        <div style={{ display: "grid", gap: 16 }}>

          {/* Destinatarios */}
          <div className="card">
            <div className="card-h"><h2>Destinatarios</h2></div>
            <div className="card-b">
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { key: "COLEGIADO", label: "Colegiados", icon: "🎓", color: "#0D2060" },
                  { key: "PERITO",    label: "Peritos",    icon: "⚖️", color: "#7c3aed" },
                ].map(r => (
                  <label key={r.key} style={{
                    display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                    padding: "12px 18px", borderRadius: 8, border: `2px solid ${roles[r.key] ? r.color : "var(--line)"}`,
                    background: roles[r.key] ? `${r.color}10` : "transparent",
                    transition: "all .15s",
                  }}>
                    <input type="checkbox" checked={roles[r.key]} onChange={() => toggleRole(r.key)}
                      style={{ width: 16, height: 16, accentColor: r.color }} />
                    <span style={{ fontSize: 20 }}>{r.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: roles[r.key] ? r.color : "var(--fg)" }}>{r.label}</div>
                      <div style={{ fontSize: ".75rem", color: "var(--muted)" }}>Todos los activos</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Message compose */}
          <div className="card">
            <div className="card-h">
              <h2>Mensaje</h2>
              <span style={{ fontSize: ".8rem", color: "var(--muted)" }}>{charCount} caracteres</span>
            </div>
            <div className="card-b">
              <textarea
                value={contenido}
                onChange={handleChange}
                placeholder="Escribe el mensaje que recibirán todos los miembros seleccionados…"
                rows={10}
                style={{
                  width: "100%", resize: "vertical", border: "1px solid var(--line)",
                  borderRadius: 8, padding: "12px 14px", fontSize: ".9rem",
                  lineHeight: 1.6, color: "var(--fg)", background: "var(--surface)",
                  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                  transition: "border-color .15s",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "#0D2060" }}
                onBlur={e => { e.currentTarget.style.borderColor = "var(--line)" }}
              />

              {result && (
                <div style={{ marginTop: 12 }} className={result.ok ? "form-ok" : "form-err"} role={result.ok ? "status" : "alert"}>
                  {result.msg}
                </div>
              )}

              <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="btn" onClick={() => { setContenido(""); setCharCount(0); setResult(null) }}>
                  Limpiar
                </button>
                <button
                  className="btn primary"
                  onClick={handleSend}
                  disabled={sending || !contenido.trim()}
                  style={{ minWidth: 160, background: "#0D2060" }}
                >
                  {sending ? "Enviando…" : (
                    <>
                      <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10 14l11 -11" /><path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" /></svg>
                      Enviar comunicado
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Templates panel */}
        <div style={{ display: "grid", gap: 12 }}>
          <div className="card">
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
              <h2 style={{ margin: 0, fontSize: ".95rem" }}>Plantillas rápidas</h2>
              <p style={{ margin: "4px 0 0", fontSize: ".78rem", color: "var(--muted)" }}>Haz clic para usar</p>
            </div>
            <div style={{ padding: "8px 0" }}>
              {PLANTILLAS.map(t => (
                <button key={t.label} type="button" onClick={() => applyTemplate(t.texto)}
                  style={{
                    width: "100%", textAlign: "left", padding: "10px 18px",
                    background: "none", border: "none", cursor: "pointer",
                    borderBottom: "1px solid var(--line)", transition: "background .1s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-raised)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none" }}
                >
                  <div style={{ fontWeight: 500, fontSize: ".87rem" }}>{t.label}</div>
                  <div style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }}>
                    {t.texto.substring(0, 60)}…
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Info card */}
          <div className="card" style={{ padding: "16px 18px", background: "#0D206008", border: "1px solid #0D206020" }}>
            <div style={{ fontSize: ".82rem", color: "#0D2060", fontWeight: 600, marginBottom: 8 }}>
              ¿Cómo funciona?
            </div>
            <ul style={{ fontSize: ".8rem", color: "var(--muted)", margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
              <li>El mensaje llega al buzón de cada miembro.</li>
              <li>Aparece como mensaje de la administración.</li>
              <li>El miembro puede responder desde su portal.</li>
              <li>Se muestra en la bandeja de mensajes.</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}

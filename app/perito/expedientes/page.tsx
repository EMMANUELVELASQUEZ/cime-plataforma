import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const TIPO_ICON: Record<string, string> = {
  NOTA:        "📝",
  INSTRUCCION: "📋",
  DOCUMENTO:   "📄",
  OBSERVACION: "🔍",
  REPORTE:     "📊",
}

const TIPO_COLOR: Record<string, string> = {
  NOTA:        "#3b82f6",
  INSTRUCCION: "#8b5cf6",
  DOCUMENTO:   "#0D2060",
  OBSERVACION: "#f59e0b",
  REPORTE:     "#10b981",
}

export default async function ExpedientesPeritoPage() {
  const session = await auth()
  if (!session) redirect("/login")
  const userId = (session.user as any)?.id

  const expediente = await prisma.expediente.findUnique({
    where: { usuarioId: userId },
    include: {
      entradas: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  const totalEntradas = expediente?.entradas.length ?? 0
  const documentos    = expediente?.entradas.filter(e => e.tipo === "DOCUMENTO").length ?? 0
  const notas         = expediente?.entradas.filter(e => e.tipo === "NOTA" || e.tipo === "OBSERVACION").length ?? 0

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mi Expediente</h1>
          <p>Historial oficial gestionado por CIME Veracruz. Solo lectura.</p>
        </div>
        <span className="chip nodot" style={{ background: "var(--surface-raised)", color: "var(--muted)", alignSelf: "flex-start" }}>
          <svg style={{ width: 14, height: 14, marginRight: 4, verticalAlign: "middle" }} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 9h.01" /><path d="M11 12h1v4h1" /></svg>
          Solo lectura
        </span>
      </div>

      {/* Stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Estado", value: expediente ? (expediente.estado === "ACTIVO" ? "Activo" : "Archivado") : "Sin expediente", color: expediente?.estado === "ACTIVO" ? "var(--ok)" : "var(--muted)" },
          { label: "Total entradas", value: String(totalEntradas), color: "var(--fg)" },
          { label: "Documentos", value: String(documentos), color: "#0D2060" },
          { label: "Notas / Obs.", value: String(notas), color: "var(--muted)" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: "16px 20px" }}>
            <span style={{ fontSize: ".75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>{s.label}</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {!expediente ? (
        <div className="card">
          <div className="empty" style={{ padding: "60px 24px" }}>
            <svg className="ico lg" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /></svg>
            <b>Sin expediente aún</b>
            <span>El administrador creará tu expediente cuando sea necesario.</span>
          </div>
        </div>
      ) : (
        <>
          {/* Expediente header */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: "#0D2060", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg style={{ width: 24, height: 24, color: "#E8C060" }} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{expediente.nombre}</div>
                  <div style={{ fontSize: ".8rem", color: "var(--muted)" }}>
                    Abierto {new Date(expediente.createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                </div>
              </div>
              <span className={`chip nodot ${expediente.estado === "ACTIVO" ? "ok" : ""}`}>
                {expediente.estado === "ACTIVO" ? "Activo" : "Archivado"}
              </span>
            </div>
            {expediente.instrucciones && (
              <div style={{ padding: "12px 24px 20px", borderTop: "1px solid var(--line)" }}>
                <div style={{ fontSize: ".8rem", color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Instrucciones generales</div>
                <p style={{ fontSize: ".9rem", lineHeight: 1.6, margin: 0 }}>{expediente.instrucciones}</p>
              </div>
            )}
          </div>

          {/* Entradas timeline */}
          {expediente.entradas.length === 0 ? (
            <div className="card">
              <div className="empty" style={{ padding: "48px 24px" }}>
                <svg className="ico lg" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" /><path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" /></svg>
                <b>Sin entradas registradas</b>
                <span>Las entradas aparecerán cuando el administrador las agregue.</span>
              </div>
            </div>
          ) : (
            <div className="card">
              <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--line)" }}>
                <h2 style={{ margin: 0, fontSize: "1rem" }}>Historial ({totalEntradas})</h2>
              </div>
              <div style={{ padding: "8px 0" }}>
                {expediente.entradas.map((entrada, idx) => (
                  <div key={entrada.id} style={{
                    display: "flex", gap: 16, padding: "16px 24px",
                    borderBottom: idx < expediente.entradas.length - 1 ? "1px solid var(--line)" : "none",
                  }}>
                    {/* Timeline dot */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: `${TIPO_COLOR[entrada.tipo]}18`,
                        border: `2px solid ${TIPO_COLOR[entrada.tipo]}40`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16,
                      }}>
                        {TIPO_ICON[entrada.tipo]}
                      </div>
                      {idx < expediente.entradas.length - 1 && (
                        <div style={{ width: 2, flexGrow: 1, background: "var(--line)", marginTop: 6 }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{
                          fontSize: ".72rem", fontWeight: 600, letterSpacing: ".08em",
                          textTransform: "uppercase", color: TIPO_COLOR[entrada.tipo],
                        }}>
                          {entrada.tipo}
                        </span>
                        {entrada.autor && (
                          <span style={{ fontSize: ".75rem", color: "var(--muted)" }}>· {entrada.autor}</span>
                        )}
                        <span style={{ fontSize: ".75rem", color: "var(--muted)", marginLeft: "auto" }}>
                          {new Date(entrada.createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{entrada.titulo}</div>
                      {entrada.contenido && (
                        <p style={{ fontSize: ".88rem", color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>{entrada.contenido}</p>
                      )}
                      {entrada.archivo && (
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8,
                          padding: "6px 12px", borderRadius: 6, background: "var(--surface-raised)",
                          fontSize: ".8rem", color: "var(--muted)",
                        }}>
                          <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /></svg>
                          Archivo adjunto
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

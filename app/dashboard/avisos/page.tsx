import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// ─── Accent config by categoria ─────────────────────────────────────────────
const CAT: Record<string, { color: string; bg: string; label: string }> = {
  Convocatoria: { color: "var(--teal)",  bg: "var(--teal-bg)",  label: "Convocatoria" },
  Cuotas:       { color: "var(--warn)",  bg: "var(--warn-bg)",  label: "Cuotas"       },
  Evento:       { color: "var(--info)",  bg: "var(--info-bg)",  label: "Evento"       },
  Cursos:       { color: "var(--ok)",    bg: "var(--ok-bg)",    label: "Cursos"       },
  Sistema:      { color: "var(--muted)", bg: "var(--surface-2)",label: "Sistema"      },
}
const catOf = (c: string) => CAT[c] ?? { color: "var(--brand)", bg: "var(--info-bg)", label: c }

// ─── SVG icons ───────────────────────────────────────────────────────────────
function IcoPin() {
  return (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17v5" /><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1v3.76z" />
    </svg>
  )
}

function IcoBell() {
  return (
    <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

function IcoConvocatoria() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 15m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M13 17.5v4.5l2-1.5 2 1.5v-4.5" />
      <path d="M10 19H5a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-1 1.73" />
      <path d="M6 9h12M6 12h3M6 15h2" />
    </svg>
  )
}

function IcoCuotas() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2m4-14h6m-6 4h6m-2 4h2" />
    </svg>
  )
}

function IcoEvento() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a3 3 0 0 1 0 6" />
      <path d="M10 8v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-5" />
      <path d="M12 8h0l4.524-3.77a.9.9 0 0 1 1.476.692v12.156a.9.9 0 0 1-1.476.692L12 14H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h8" />
    </svg>
  )
}

function IcoCursos() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 9l-10-4L2 9l10 4 10-4v6" /><path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" />
    </svg>
  )
}

function IcoSistema() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  )
}

const CAT_ICON: Record<string, React.ReactNode> = {
  Convocatoria: <IcoConvocatoria />,
  Cuotas:       <IcoCuotas />,
  Evento:       <IcoEvento />,
  Cursos:       <IcoCursos />,
  Sistema:      <IcoSistema />,
}
const iconOf = (c: string) => CAT_ICON[c] ?? <IcoEvento />

// ─── Date formatter ──────────────────────────────────────────────────────────
function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function AvisosPage() {
  const avisos = await prisma.aviso.findMany({
    orderBy: [{ fijado: "desc" }, { createdAt: "desc" }],
  })

  const pinned  = avisos.filter(a => a.fijado)
  const regular = avisos.filter(a => !a.fijado)

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="page-head" style={{ marginBottom: 28 }}>
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
            Portal CIME · Comunicados oficiales
          </p>
          <h1 style={{ fontSize: "1.75rem" }}>Avisos del Colegio</h1>
          <p style={{ color: "var(--muted)", fontSize: ".9rem", marginTop: 4 }}>
            Convocatorias, cuotas, eventos y comunicados emitidos por el Consejo Directivo.
          </p>
        </div>
        {avisos.length > 0 && (
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
            {avisos.length} aviso{avisos.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {avisos.length === 0 && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: "72px 24px",
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r)",
          textAlign: "center",
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "var(--surface-2)",
            border: "1px solid var(--line)",
            display: "grid",
            placeItems: "center",
            color: "var(--muted-2)",
          }}>
            <IcoBell />
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--f-display)", fontSize: "1.25rem", color: "var(--fg)" }}>
              Sin avisos publicados
            </h2>
            <p style={{ color: "var(--muted)", fontSize: ".88rem", marginTop: 6, maxWidth: "38ch" }}>
              Cuando el Consejo Directivo publique comunicados, aparecerán aquí.
            </p>
          </div>
        </div>
      )}

      {/* ── Pinned section ─────────────────────────────────────────────── */}
      {pinned.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}>
            <span style={{
              fontFamily: "var(--f-data)",
              fontSize: ".62rem",
              fontWeight: 700,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "var(--warn)",
            }}>
              Fijados
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--warn-ring)", opacity: .4 }} />
          </div>

          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r)",
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
          }}>
            {pinned.map((a, idx) => {
              const cat = catOf(a.categoria)
              return (
                <div key={a.id} style={{
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0,1fr) auto",
                  gap: 16,
                  padding: "20px 24px",
                  alignItems: "start",
                  borderBottom: idx < pinned.length - 1 ? "1px solid var(--line)" : undefined,
                  borderLeft: `3px solid ${cat.color}`,
                  background: "color-mix(in srgb, var(--surface) 92%, var(--warn-bg))",
                }}>
                  {/* Icon */}
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: "var(--r-sm)",
                    display: "grid",
                    placeItems: "center",
                    background: cat.bg,
                    color: cat.color,
                    flexShrink: 0,
                  }}>
                    {iconOf(a.categoria)}
                  </div>

                  {/* Body */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{
                        fontFamily: "var(--f-data)",
                        fontSize: ".65rem",
                        fontWeight: 700,
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                        padding: "2px 8px",
                        borderRadius: 3,
                        background: cat.bg,
                        color: cat.color,
                        border: `1px solid color-mix(in srgb, ${cat.color} 30%, transparent)`,
                      }}>
                        {a.categoria}
                      </span>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontFamily: "var(--f-data)",
                        fontSize: ".63rem",
                        fontWeight: 600,
                        color: "var(--warn)",
                        letterSpacing: ".05em",
                      }}>
                        <IcoPin />
                        Fijado
                      </span>
                    </div>
                    <h3 style={{
                      fontFamily: "var(--f-display)",
                      fontSize: "1.05rem",
                      fontWeight: 800,
                      color: "var(--fg)",
                      lineHeight: 1.3,
                      marginBottom: 6,
                    }}>
                      {a.titulo}
                    </h3>
                    <p style={{
                      fontSize: ".875rem",
                      color: "var(--fg-2)",
                      lineHeight: 1.65,
                      maxWidth: "72ch",
                    }}>
                      {a.contenido}
                    </p>
                  </div>

                  {/* Date */}
                  <time style={{
                    fontFamily: "var(--f-data)",
                    fontSize: ".72rem",
                    color: "var(--muted)",
                    whiteSpace: "nowrap",
                    letterSpacing: ".03em",
                    paddingTop: 2,
                  }}>
                    {fmtDate(a.createdAt)}
                  </time>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Regular avisos ─────────────────────────────────────────────── */}
      {regular.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}>
              <span style={{
                fontFamily: "var(--f-data)",
                fontSize: ".62rem",
                fontWeight: 700,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "var(--muted-2)",
              }}>
                Recientes
              </span>
              <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
            </div>
          )}

          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r)",
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
          }}>
            {regular.map((a, idx) => {
              const cat = catOf(a.categoria)
              return (
                <div key={a.id} style={{
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0,1fr) auto",
                  gap: 16,
                  padding: "20px 24px",
                  alignItems: "start",
                  borderBottom: idx < regular.length - 1 ? "1px solid var(--line)" : undefined,
                  borderLeft: `3px solid ${cat.color}`,
                }}>
                  {/* Icon */}
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: "var(--r-sm)",
                    display: "grid",
                    placeItems: "center",
                    background: cat.bg,
                    color: cat.color,
                    flexShrink: 0,
                  }}>
                    {iconOf(a.categoria)}
                  </div>

                  {/* Body */}
                  <div>
                    <div style={{ marginBottom: 6 }}>
                      <span style={{
                        fontFamily: "var(--f-data)",
                        fontSize: ".65rem",
                        fontWeight: 700,
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                        padding: "2px 8px",
                        borderRadius: 3,
                        background: cat.bg,
                        color: cat.color,
                        border: `1px solid color-mix(in srgb, ${cat.color} 30%, transparent)`,
                      }}>
                        {a.categoria}
                      </span>
                    </div>
                    <h3 style={{
                      fontFamily: "var(--f-display)",
                      fontSize: "1.05rem",
                      fontWeight: 800,
                      color: "var(--fg)",
                      lineHeight: 1.3,
                      marginBottom: 6,
                    }}>
                      {a.titulo}
                    </h3>
                    <p style={{
                      fontSize: ".875rem",
                      color: "var(--fg-2)",
                      lineHeight: 1.65,
                      maxWidth: "72ch",
                    }}>
                      {a.contenido}
                    </p>
                  </div>

                  {/* Date */}
                  <time style={{
                    fontFamily: "var(--f-data)",
                    fontSize: ".72rem",
                    color: "var(--muted)",
                    whiteSpace: "nowrap",
                    letterSpacing: ".03em",
                    paddingTop: 2,
                  }}>
                    {fmtDate(a.createdAt)}
                  </time>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

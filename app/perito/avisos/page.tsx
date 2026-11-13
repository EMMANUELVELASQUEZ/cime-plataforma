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

// ─── Helper: safe parse imagen JSON ─────────────────────────────────────────
function parseImagen(raw: string | null): { url: string } | null {
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

// ─── Aviso card component ────────────────────────────────────────────────────
function AvisoCard({
  a,
  pinned,
  isLast,
}: {
  a: { id: string; tipo: string; categoria: string; titulo: string; contenido: string; fijado: boolean; imagen: string | null; createdAt: Date }
  pinned: boolean
  isLast: boolean
}) {
  const cat    = catOf(a.categoria)
  const img    = parseImagen(a.imagen)

  if (img) {
    // ── Image card: standalone card with banner ──────────────────────────────
    return (
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
        marginBottom: isLast ? 0 : 16,
      }}>
        {/* Banner image */}
        <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt={a.titulo}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          {/* Gradient overlay */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.55) 100%)",
          }} />
          {/* Category + pin badges over image */}
          <div style={{
            position: "absolute",
            top: 14,
            left: 16,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}>
            <span style={{
              fontFamily: "var(--f-data)",
              fontSize: ".65rem",
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              padding: "3px 10px",
              borderRadius: 4,
              background: cat.bg,
              color: cat.color,
              border: `1px solid color-mix(in srgb, ${cat.color} 30%, transparent)`,
            }}>
              {a.categoria}
            </span>
            {pinned && (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontFamily: "var(--f-data)",
                fontSize: ".63rem",
                fontWeight: 600,
                color: "var(--warn)",
                letterSpacing: ".05em",
                background: "var(--warn-bg)",
                padding: "3px 8px",
                borderRadius: 4,
                border: "1px solid color-mix(in srgb, var(--warn) 25%, transparent)",
              }}>
                <IcoPin />
                Fijado
              </span>
            )}
          </div>
          {/* Title overlay at bottom */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "16px 20px 14px",
          }}>
            <h3 style={{
              fontFamily: "var(--f-display)",
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.3,
              textShadow: "0 1px 6px rgba(0,0,0,.45)",
            }}>
              {a.titulo}
            </h3>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px 18px" }}>
          <p style={{
            fontSize: ".875rem",
            color: "var(--fg-2)",
            lineHeight: 1.65,
          }}>
            {a.contenido}
          </p>
          <time style={{
            display: "block",
            fontFamily: "var(--f-data)",
            fontSize: ".72rem",
            color: "var(--muted)",
            letterSpacing: ".03em",
            marginTop: 12,
          }}>
            {fmtDate(a.createdAt)}
          </time>
        </div>
      </div>
    )
  }

  // ── Text-only card: original row style ──────────────────────────────────────
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "auto minmax(0,1fr) auto",
      gap: 16,
      padding: "20px 24px",
      alignItems: "start",
      borderBottom: isLast ? undefined : "1px solid var(--line)",
      borderLeft: `3px solid ${cat.color}`,
      background: pinned ? "color-mix(in srgb, var(--surface) 92%, var(--warn-bg))" : undefined,
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
          {pinned && (
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
          )}
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
}

// ─── Helper: group avisos by whether they have an image ─────────────────────
// Image cards render outside the grouped list container (they are standalone cards).
// Text-only cards are batched into a grouped bordered container.

function renderGroup(
  items: { id: string; tipo: string; categoria: string; titulo: string; contenido: string; fijado: boolean; imagen: string | null; createdAt: Date }[],
  pinned: boolean
) {
  if (items.length === 0) return null

  // Split into consecutive runs of text-only vs image cards
  const nodes: React.ReactNode[] = []
  let textBuffer: typeof items = []

  function flushTextBuffer(keyPrefix: string) {
    if (textBuffer.length === 0) return
    const buf = textBuffer
    textBuffer = []
    nodes.push(
      <div key={`${keyPrefix}-text`} style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r)",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
        marginBottom: 16,
      }}>
        {buf.map((a, idx) => (
          <AvisoCard key={a.id} a={a} pinned={pinned} isLast={idx === buf.length - 1} />
        ))}
      </div>
    )
  }

  items.forEach((a, i) => {
    if (a.imagen) {
      flushTextBuffer(`before-${a.id}`)
      nodes.push(
        <AvisoCard key={a.id} a={a} pinned={pinned} isLast={false} />
      )
    } else {
      textBuffer.push(a)
    }
    if (i === items.length - 1) flushTextBuffer(`end-${i}`)
  })

  return <>{nodes}</>
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
          {renderGroup(pinned, true)}
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
          {renderGroup(regular, false)}
        </div>
      )}
    </div>
  )
}

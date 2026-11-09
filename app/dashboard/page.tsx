import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  GraduationCap, Clock, Award, CreditCard, Calendar, Megaphone,
  ChevronRight, ArrowRight, CheckCircle2, AlertCircle, User,
  MapPin, BookOpen, Shield,
} from "lucide-react"

export const dynamic = "force-dynamic"

// ─── Area config (Classroom-style header colours) ──────────────────────────
const AREA: Record<string, {
  label: string; headerBg: string; chipBg: string; chipText: string
}> = {
  ELE: { label: "Eléctrica",        headerBg: "#1E40AF", chipBg: "rgba(147,197,253,.22)", chipText: "#93C5FD" },
  MEC: { label: "Mecánica",         headerBg: "#5B21B6", chipBg: "rgba(196,181,253,.22)", chipText: "#C4B5FD" },
  SOL: { label: "Sol / Renovable",  headerBg: "#064E3B", chipBg: "rgba(110,231,183,.22)", chipText: "#6EE7B7" },
}
const areaOf = (a: string) => AREA[a] ?? { label: a, headerBg: "#1E3A8A", chipBg: "rgba(147,197,253,.2)", chipText: "#93C5FD" }

// ─── Status config ──────────────────────────────────────────────────────────
const ESTC: Record<string, { label: string; bg: string; text: string; ring: string }> = {
  VIGENTE:     { label: "Vigente",     bg: "rgba(16,185,129,.12)", text: "#34D399", ring: "rgba(52,211,153,.3)"  },
  POR_RENOVAR: { label: "Por renovar", bg: "rgba(245,158,11,.12)", text: "#FBBF24", ring: "rgba(251,191,36,.3)"  },
  SUSPENDIDO:  { label: "Suspendido",  bg: "rgba(239,68,68,.12)",  text: "#F87171", ring: "rgba(248,113,113,.3)" },
}
const estadoOf = (e: string) => ESTC[e] ?? ESTC.VIGENTE

// ─── Aviso colour ───────────────────────────────────────────────────────────
const AVISO_DOT: Record<string, string> = {
  Urgente:      "#EF4444",
  Importante:   "#F59E0B",
  Informativo:  "#3B82F6",
  Convocatoria: "#10B981",
}

// ─── Event type colour ──────────────────────────────────────────────────────
const EV_COLOR: Record<string, { bg: string; text: string }> = {
  Asamblea:    { bg: "#EEF2FF", text: "#4F46E5" },
  Taller:      { bg: "#E0F2FE", text: "#0284C7" },
  Conferencia: { bg: "#F3E8FF", text: "#7C3AED" },
  Evaluación:  { bg: "#D1FAE5", text: "#059669" },
  Cuota:       { bg: "#FEF3C7", text: "#D97706" },
}
const evColor = (t: string) => EV_COLOR[t] ?? { bg: "#DBEAFE", text: "#1D4ED8" }

function initials(name: string) {
  return name.replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "")
    .split(/\s+/).slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase()
}

// ─── Shared card wrapper ────────────────────────────────────────────────────
const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: "var(--surface)", border: "1px solid var(--line)",
    borderRadius: 10, boxShadow: "var(--shadow-sm)",
    overflow: "hidden", ...style,
  }}>
    {children}
  </div>
)

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 18px", borderBottom: "1px solid var(--line)",
    gap: 12,
  }}>
    {children}
  </div>
)

const SectionHeading = ({ label, href, count }: { label: string; href?: string; count?: number }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <h2 className="font-montserrat" style={{
        fontSize: "1rem", fontWeight: 700, color: "var(--fg)",
        letterSpacing: "-.01em", margin: 0,
      }}>
        {label}
      </h2>
      {count !== undefined && (
        <span style={{
          fontFamily: "var(--f-data)", fontSize: ".62rem", fontWeight: 700,
          padding: "1px 7px", borderRadius: 10,
          background: "var(--surface-3)", color: "var(--muted)",
          border: "1px solid var(--line)",
        }}>
          {count}
        </span>
      )}
    </div>
    {href && (
      <Link href={href} style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: ".8rem", fontWeight: 600, color: "var(--brand)",
        textDecoration: "none", fontFamily: "var(--f-data)",
      }}>
        Ver todos <ChevronRight size={13} strokeWidth={2.5} />
      </Link>
    )}
  </div>
)

// ─── Page ───────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const session = await auth()
  const userId  = (session?.user as any)?.id

  const [usuario, inscripciones, eventos, avisos, pagos] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        nombre: true, numeroColegiado: true, especialidad: true,
        alta: true, cedula: true, vigencia: true, ciudad: true,
        horas: true, horasMeta: true, estado: true,
      },
    }),
    prisma.inscripcionCurso.findMany({
      where: { usuarioId: userId },
      include: { curso: { include: { modulos: { orderBy: { orden: "asc" } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.evento.findMany({
      where: { fecha: { gte: new Date() } },
      orderBy: { fecha: "asc" },
      take: 4,
    }),
    prisma.aviso.findMany({
      orderBy: [{ fijado: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
    prisma.pago.findMany({
      where: { usuarioId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  if (!usuario) return <p style={{ color: "var(--muted)", padding: 24 }}>Sin datos de sesión.</p>

  const enCurso     = inscripciones.filter(i => i.estado !== "COMPLETADO")
  const completados = inscripciones.filter(i => i.estado === "COMPLETADO")
  const pct         = Math.min(100, Math.round((usuario.horas / usuario.horasMeta) * 100))
  const faltanH     = Math.max(0, usuario.horasMeta - usuario.horas)
  const pagosPend   = pagos.filter(p => ["PENDIENTE","pendiente","VENCIDO","vencido"].includes(p.estado))
  const est         = estadoOf(usuario.estado)

  const hour   = new Date().getHours()
  const saludo = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches"

  // SVG circular progress — both computed server-side (no JS needed)
  const R_BIG = 68, CIRC_BIG = +(2 * Math.PI * R_BIG).toFixed(2)
  const OFFSET_BIG = +(CIRC_BIG * (1 - pct / 100)).toFixed(2)
  const R_MINI = 24, CIRC_MINI = +(2 * Math.PI * R_MINI).toFixed(2)
  const OFFSET_MINI = +(CIRC_MINI * (1 - pct / 100)).toFixed(2)
  const progressColor = pct >= 100 ? "#10B981" : "#F59E0B"

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          PROFILE BANNER  —  Institutional navy + gold
         ══════════════════════════════════════════════════════════ */}
      <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 32px rgba(10,30,80,.28)" }}>

        {/* Top decorative banner */}
        <div style={{
          height: 130,
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #0B1D3E 0%, #0F2860 45%, #1A3A8C 100%)",
        }}>
          {/* Subtle diagonal line pattern */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "repeating-linear-gradient(135deg, rgba(255,255,255,.025) 0px, rgba(255,255,255,.025) 1px, transparent 1px, transparent 24px)",
          }} />

          {/* Left gold vertical accent */}
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0,
            width: 4,
            background: "linear-gradient(180deg, #C9962A 0%, #E8C060 50%, #C9962A 100%)",
          }} />

          {/* Bottom gold line */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: 2,
            background: "linear-gradient(90deg, #C9962A 0%, #F0D080 40%, #E8C060 70%, transparent 100%)",
          }} />

          {/* Right glow */}
          <div style={{
            position: "absolute", top: -60, right: -60,
            width: 220, height: 220, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,150,42,.14) 0%, transparent 68%)",
          }} />

          {/* CIME — logo treatment, clearly visible */}
          <div style={{
            position: "absolute",
            right: 28,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            userSelect: "none",
            pointerEvents: "none",
          }}>
            <div style={{
              fontFamily: "var(--font-montserrat), Montserrat, system-ui",
              fontWeight: 900,
              fontSize: "3.6rem",
              letterSpacing: ".22em",
              lineHeight: 1,
              background: "linear-gradient(180deg, rgba(240,208,128,.75) 0%, rgba(201,150,42,.45) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            } as React.CSSProperties}>
              CIME
            </div>
            <div style={{
              fontFamily: "var(--f-data)",
              fontSize: ".52rem",
              letterSpacing: ".2em",
              textTransform: "uppercase",
              color: "rgba(240,208,128,.4)",
              marginTop: 2,
            }}>
              Veracruz · México
            </div>
          </div>

          {/* Top-left institution name */}
          <div style={{
            position: "absolute",
            top: 14,
            left: 20,
            fontFamily: "var(--f-data)",
            fontSize: ".58rem",
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,.35)",
          }}>
            Portal del Colegiado
          </div>
        </div>

        {/* Profile info row */}
        <div style={{
          background: "linear-gradient(180deg, #0F2256 0%, #0B1D3E 100%)",
          padding: "0 28px 24px",
          display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 18,
          marginTop: -48,
        }}>
          {/* Avatar with gold ring */}
          <div style={{
            width: 88, height: 88, flexShrink: 0,
            borderRadius: "50%",
            border: "3px solid #C9962A",
            boxShadow: "0 0 0 3px rgba(201,150,42,.2), 0 6px 20px rgba(0,0,0,.35)",
            background: "linear-gradient(135deg, #1A3A8C 0%, #0F2860 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-montserrat), Montserrat, system-ui",
            fontSize: "1.7rem", fontWeight: 800, color: "#E8C060",
            letterSpacing: ".04em",
          }}>
            {initials(usuario.nombre)}
          </div>

          {/* Identity */}
          <div style={{ flex: "1 1 220px", paddingBottom: 2 }}>
            {/* Chips row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 7 }}>
              {usuario.numeroColegiado && (
                <span style={{
                  fontFamily: "var(--f-mono)", fontSize: ".65rem",
                  color: "rgba(232,192,96,.7)", letterSpacing: ".1em",
                  background: "rgba(201,150,42,.12)",
                  border: "1px solid rgba(201,150,42,.25)",
                  padding: "1px 8px", borderRadius: 4,
                }}>
                  CIME-VER-{usuario.numeroColegiado}
                </span>
              )}
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontFamily: "var(--f-data)", fontSize: ".64rem", fontWeight: 700,
                letterSpacing: ".07em", textTransform: "uppercase",
                padding: "2px 9px", borderRadius: 99,
                background: est.bg, color: est.text,
                boxShadow: `0 0 0 1px ${est.ring}`,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: est.text, flexShrink: 0 }} />
                {est.label}
              </span>
              {usuario.vigencia && (
                <span style={{
                  fontFamily: "var(--f-data)", fontSize: ".63rem",
                  color: "rgba(255,255,255,.3)",
                }}>
                  Vigencia {usuario.vigencia}
                </span>
              )}
            </div>

            {/* Greeting + Name */}
            <h1 className="font-montserrat" style={{
              fontSize: "clamp(1.25rem, 2.4vw, 1.7rem)",
              fontWeight: 700, color: "white", lineHeight: 1.2,
              letterSpacing: "-.01em", margin: "0 0 6px",
            }}>
              {saludo},{" "}
              <span style={{ color: "#E8C060" }}>
                {usuario.nombre.split(" ").slice(0, 2).join(" ")}
              </span>
            </h1>

            {/* Meta info */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 18px" }}>
              {usuario.especialidad && (
                <span style={{
                  fontFamily: "var(--f-data)", fontSize: ".75rem",
                  color: "rgba(255,255,255,.55)",
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  <Shield size={10} strokeWidth={2} style={{ color: "rgba(232,192,96,.5)" }} />
                  {usuario.especialidad}
                </span>
              )}
              {usuario.ciudad && (
                <span style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontFamily: "var(--f-data)", fontSize: ".73rem", color: "rgba(255,255,255,.35)",
                }}>
                  <MapPin size={10} strokeWidth={2} /> {usuario.ciudad}
                </span>
              )}
              {usuario.alta && (
                <span style={{
                  fontFamily: "var(--f-data)", fontSize: ".72rem",
                  color: "rgba(255,255,255,.28)",
                }}>
                  Alta {usuario.alta}
                </span>
              )}
            </div>
          </div>

          {/* Hours stat + mini SVG ring */}
          <div style={{
            display: "flex", alignItems: "center", gap: 18,
            paddingBottom: 2, flexShrink: 0,
          }}>
            <div style={{ textAlign: "right" }}>
              <div style={{
                fontFamily: "var(--font-montserrat), Montserrat, system-ui",
                fontSize: "2.8rem", fontWeight: 800,
                color: "#E8C060", lineHeight: 1, letterSpacing: "-.04em",
              }}>
                {usuario.horas}
                <span style={{ fontSize: "1.3rem", color: "rgba(232,192,96,.5)", fontWeight: 600 }}>h</span>
              </div>
              <div style={{
                fontFamily: "var(--f-data)", fontSize: ".65rem",
                color: "rgba(255,255,255,.35)", marginTop: 4,
              }}>
                de {usuario.horasMeta}h meta · {pct}%
              </div>
            </div>

            {/* Mini ring */}
            <div style={{ position: "relative", width: 66, height: 66, flexShrink: 0 }}>
              <svg width="66" height="66" viewBox="0 0 66 66" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="33" cy="33" r={R_MINI} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
                <circle cx="33" cy="33" r={R_MINI} fill="none"
                  stroke={progressColor} strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={CIRC_MINI} strokeDashoffset={OFFSET_MINI}
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-montserrat), Montserrat",
                fontWeight: 700, fontSize: ".82rem", color: "white",
              }}>
                {pct}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MAIN GRID  —  8-col content + 4-col sidebar
         ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12" style={{ gap: 24, alignItems: "start" }}>

        {/* ── LEFT COLUMN (content area) ─────────────────────────── */}
        <div className="lg:col-span-8" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* KPI strip — 4 cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))", gap: 12 }}>
            {[
              {
                label: "Horas acreditadas",
                val: `${usuario.horas}`, unit: "h",
                sub: `${pct}% de ${usuario.horasMeta}h meta`,
                icon: <Clock size={20} strokeWidth={2} />,
                accent: "#B45309",
                cardBg: "linear-gradient(145deg,#FFFBEB,#FEF3C7)",
                iconBg: "#FDE68A", iconColor: "#B45309", valColor: "#78350F",
              },
              {
                label: "Cursos activos",
                val: String(enCurso.length), unit: "",
                sub: enCurso.length === 0 ? "Sin inscritos" : "En progreso",
                icon: <BookOpen size={20} strokeWidth={2} />,
                accent: "#1D4ED8",
                cardBg: "linear-gradient(145deg,#EFF6FF,#DBEAFE)",
                iconBg: "#BFDBFE", iconColor: "#1D4ED8", valColor: "#1E3A8A",
              },
              {
                label: "Constancias",
                val: String(completados.length), unit: "",
                sub: completados.length === 1 ? "Acreditado" : "Acreditados",
                icon: <Award size={20} strokeWidth={2} />,
                accent: "#059669",
                cardBg: "linear-gradient(145deg,#ECFDF5,#D1FAE5)",
                iconBg: "#A7F3D0", iconColor: "#059669", valColor: "#064E3B",
              },
              {
                label: pagosPend.length > 0 ? "Pago pendiente" : "Pagos",
                val: pagosPend.length > 0 ? `${pagosPend.length}` : "✓", unit: "",
                sub: pagosPend.length > 0 ? "Por realizar" : "Sin adeudos",
                icon: <CreditCard size={20} strokeWidth={2} />,
                accent: pagosPend.length > 0 ? "#B45309" : "#059669",
                cardBg: pagosPend.length > 0
                  ? "linear-gradient(145deg,#FFFBEB,#FEF3C7)"
                  : "linear-gradient(145deg,#ECFDF5,#D1FAE5)",
                iconBg:   pagosPend.length > 0 ? "#FDE68A" : "#A7F3D0",
                iconColor:pagosPend.length > 0 ? "#B45309" : "#059669",
                valColor: pagosPend.length > 0 ? "#78350F" : "#064E3B",
              },
            ].map(kpi => (
              <div key={kpi.label} style={{
                background: kpi.cardBg,
                border: `1px solid ${kpi.accent}28`,
                borderLeft: `4px solid ${kpi.accent}`,
                borderRadius: 12, padding: "16px 14px",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{
                    fontFamily: "var(--f-data)", fontSize: ".63rem", fontWeight: 700,
                    color: kpi.accent, letterSpacing: ".05em", textTransform: "uppercase", lineHeight: 1.3,
                  }}>{kpi.label}</span>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    display: "grid", placeItems: "center",
                    background: kpi.iconBg, color: kpi.iconColor,
                  }}>{kpi.icon}</div>
                </div>
                <div>
                  <div className="font-montserrat" style={{
                    fontSize: "2.1rem", fontWeight: 800,
                    color: kpi.valColor, lineHeight: 1, letterSpacing: "-.05em",
                  }}>
                    {kpi.val}
                    {kpi.unit && <span style={{ fontSize: "1.1rem", fontWeight: 600, color: kpi.accent, marginLeft: 1 }}>{kpi.unit}</span>}
                  </div>
                  <div style={{
                    fontFamily: "var(--f-data)", fontSize: ".67rem",
                    color: kpi.accent, marginTop: 5, opacity: .75,
                  }}>{kpi.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Active courses — Classroom cards */}
          <section>
            <SectionHeading label="Mis cursos activos" href="/dashboard/cursos" count={enCurso.length} />

            {enCurso.length > 0 ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 14,
              }}>
                {enCurso.slice(0, 4).map(insc => {
                  const a = areaOf(insc.curso.area)
                  const p = Math.round(insc.progreso)
                  const totalMods = insc.curso.modulos.length
                  return (
                    <article key={insc.id} style={{
                      background: "var(--surface)", border: "1px solid var(--line)",
                      borderRadius: 10, overflow: "hidden",
                      display: "flex", flexDirection: "column",
                      boxShadow: "var(--shadow-sm)",
                      transition: "box-shadow .15s, transform .12s",
                    }}>
                      {/* Classroom-style coloured card header */}
                      <div style={{
                        height: 96, position: "relative", padding: "14px 16px",
                        display: "flex", flexDirection: "column", justifyContent: "flex-end",
                        background: a.headerBg,
                        flexShrink: 0,
                      }}>
                        {/* Dot texture */}
                        <div style={{
                          position: "absolute", inset: 0, opacity: .25,
                          backgroundImage: "radial-gradient(circle, rgba(255,255,255,.3) 1px, transparent 1px)",
                          backgroundSize: "16px 16px",
                        }} />
                        <span style={{
                          position: "relative", zIndex: 1, alignSelf: "flex-start",
                          fontFamily: "var(--f-data)", fontSize: ".6rem", fontWeight: 700,
                          letterSpacing: ".1em", textTransform: "uppercase",
                          padding: "2px 8px", borderRadius: 3,
                          background: a.chipBg, color: a.chipText,
                        }}>
                          {a.label}
                        </span>
                      </div>

                      {/* Body */}
                      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
                        <h3 className="font-montserrat" style={{
                          fontSize: ".92rem", fontWeight: 600,
                          color: "var(--fg)", lineHeight: 1.3, marginBottom: 6,
                          display: "-webkit-box",
                          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        } as React.CSSProperties}>
                          {insc.curso.titulo}
                        </h3>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                          fontFamily: "var(--f-data)", fontSize: ".67rem", color: "var(--muted)",
                          marginBottom: "auto",
                        }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <User size={10} strokeWidth={2} /> {insc.curso.instructor}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Clock size={10} strokeWidth={2} /> {insc.curso.horas}h
                          </span>
                          {totalMods > 0 && (
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <BookOpen size={10} strokeWidth={2} /> {totalMods} móds.
                            </span>
                          )}
                        </div>

                        {/* Progress */}
                        <div style={{ marginTop: 14 }}>
                          <div style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "baseline", marginBottom: 5,
                          }}>
                            <span style={{
                              fontFamily: "var(--f-data)", fontSize: ".62rem",
                              color: "var(--muted)", letterSpacing: ".06em", textTransform: "uppercase",
                            }}>
                              Progreso
                            </span>
                            <span style={{
                              fontFamily: "var(--font-montserrat), Montserrat",
                              fontSize: ".82rem", fontWeight: 700,
                              color: p >= 100 ? "#10B981" : "#D97706",
                            }}>
                              {p}%
                            </span>
                          </div>
                          <div style={{ height: 6, background: "var(--surface-3)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{
                              height: "100%", borderRadius: 3,
                              width: `${p}%`,
                              background: p >= 100
                                ? "linear-gradient(90deg, #059669, #10B981)"
                                : "linear-gradient(90deg, #D97706, #F59E0B)",
                            }} />
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div style={{
                        borderTop: "1px solid var(--line)",
                        padding: "9px 16px",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        background: "var(--surface-2)",
                      }}>
                        <span style={{ fontFamily: "var(--f-data)", fontSize: ".65rem", color: "var(--muted)" }}>
                          {new Date(insc.curso.fechaFin).toLocaleDateString("es-MX", { month: "short", year: "numeric" }).toUpperCase()}
                        </span>
                        <Link href={`/dashboard/cursos/${insc.curso.id}`} style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          fontFamily: "var(--f-data)", fontSize: ".74rem", fontWeight: 700,
                          color: "var(--brand)", textDecoration: "none",
                          letterSpacing: ".02em",
                        }}>
                          Continuar <ArrowRight size={12} strokeWidth={2.5} />
                        </Link>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <Card>
                <div style={{ padding: "36px 24px", textAlign: "center" }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%", margin: "0 auto 14px",
                    background: "var(--info-bg)", border: "1px solid var(--info-ring)",
                    display: "grid", placeItems: "center",
                  }}>
                    <GraduationCap size={26} strokeWidth={1.5} style={{ color: "var(--info)" }} />
                  </div>
                  <h3 className="font-montserrat" style={{
                    fontSize: ".95rem", fontWeight: 600,
                    color: "var(--fg)", marginBottom: 6,
                  }}>
                    Sin cursos activos
                  </h3>
                  <p style={{ fontSize: ".84rem", color: "var(--muted)", maxWidth: "36ch", margin: "0 auto 18px" }}>
                    Inscríbete a los cursos disponibles para acumular horas de actualización profesional.
                  </p>
                  <Link href="/dashboard/cursos" className="btn primary" style={{ borderRadius: 8, gap: 7 }}>
                    <BookOpen size={15} strokeWidth={1.75} /> Ver catálogo
                  </Link>
                </div>
              </Card>
            )}
          </section>

          {/* Completed courses — compact horizontal list */}
          {completados.length > 0 && (
            <section>
              <SectionHeading label="Constancias obtenidas" href="/dashboard/constancias" count={completados.length} />
              <Card>
                {completados.slice(0, 4).map((insc, idx) => {
                  const a = areaOf(insc.curso.area)
                  return (
                    <div key={insc.id} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 16px",
                      borderBottom: idx < Math.min(completados.length, 4) - 1 ? "1px solid var(--line)" : undefined,
                    }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                        background: "var(--ok-bg)", border: "1px solid var(--ok-ring)",
                        display: "grid", placeItems: "center",
                      }}>
                        <CheckCircle2 size={16} strokeWidth={2} style={{ color: "var(--ok)" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 600, fontSize: ".87rem", color: "var(--fg)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {insc.curso.titulo}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                          <span style={{
                            fontFamily: "var(--f-data)", fontSize: ".6rem", fontWeight: 700,
                            letterSpacing: ".08em", textTransform: "uppercase",
                            padding: "1px 6px", borderRadius: 3,
                            background: a.chipBg, color: a.chipText,
                            filter: "brightness(.85) saturate(1.2)",
                          }}>
                            {a.label}
                          </span>
                          <span style={{ fontFamily: "var(--f-data)", fontSize: ".67rem", color: "var(--muted)" }}>
                            {insc.curso.horas}h acreditadas
                          </span>
                          {insc.folio && (
                            <span style={{ fontFamily: "var(--f-mono)", fontSize: ".65rem", color: "var(--muted-2)" }}>
                              · {insc.folio}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link href="/dashboard/constancias" style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        fontFamily: "var(--f-data)", fontSize: ".7rem", fontWeight: 600,
                        color: "var(--muted)", textDecoration: "none", flexShrink: 0,
                      }}>
                        <Award size={12} strokeWidth={2} /> Ver
                      </Link>
                    </div>
                  )
                })}
              </Card>
            </section>
          )}

          {/* Quick Actions */}
          <section>
            <SectionHeading label="Accesos rápidos" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
              {[
                {
                  href: "/dashboard/cursos",
                  icon: <GraduationCap size={22} strokeWidth={1.75} />,
                  label: "Mis cursos",
                  sub: `${inscripciones.length} inscrito${inscripciones.length !== 1 ? "s" : ""}`,
                  iconBg: "#DBEAFE", iconColor: "#1D4ED8", accent: "#1D4ED8",
                },
                {
                  href: "/dashboard/constancias",
                  icon: <Award size={22} strokeWidth={1.75} />,
                  label: "Constancias",
                  sub: `${completados.length} obtenida${completados.length !== 1 ? "s" : ""}`,
                  iconBg: "#D1FAE5", iconColor: "#059669", accent: "#059669",
                },
                {
                  href: "/dashboard/calendario",
                  icon: <Calendar size={22} strokeWidth={1.75} />,
                  label: "Calendario",
                  sub: `${eventos.length} próximo${eventos.length !== 1 ? "s" : ""}`,
                  iconBg: "#EDE9FE", iconColor: "#7C3AED", accent: "#7C3AED",
                },
                {
                  href: "/dashboard/pagos",
                  icon: <CreditCard size={22} strokeWidth={1.75} />,
                  label: "Pagos y cuotas",
                  sub: pagosPend.length > 0
                    ? `${pagosPend.length} pendiente${pagosPend.length !== 1 ? "s" : ""}`
                    : "Al corriente",
                  iconBg: pagosPend.length > 0 ? "#FEF3C7" : "#D1FAE5",
                  iconColor: pagosPend.length > 0 ? "#D97706" : "#059669",
                  accent: pagosPend.length > 0 ? "#D97706" : "#059669",
                },
              ].map(item => (
                <Link key={item.href} href={item.href} className="dash-quick-link" style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px", textDecoration: "none",
                  background: "var(--surface)", border: "1px solid var(--line)",
                  borderLeft: `3px solid ${item.accent}`,
                  borderRadius: 10, boxShadow: "var(--shadow-sm)",
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                    display: "grid", placeItems: "center",
                    background: item.iconBg, color: item.iconColor,
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: ".9rem", color: "var(--fg)", marginBottom: 2 }}>
                      {item.label}
                    </div>
                    <div style={{ fontFamily: "var(--f-data)", fontSize: ".7rem", color: "var(--muted)" }}>
                      {item.sub}
                    </div>
                  </div>
                  <ChevronRight size={15} strokeWidth={2.5} style={{ color: "var(--muted-2)", flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </section>

          {/* Upcoming events */}
          {eventos.length > 0 && (
            <section>
              <SectionHeading label="Próximos eventos" href="/dashboard/calendario" count={eventos.length} />
              <Card>
                {eventos.map((ev, idx) => {
                  const fecha = new Date(ev.fecha)
                  const d   = fecha.getDate()
                  const mes = fecha.toLocaleDateString("es-MX", { month: "short" }).replace(".", "").toUpperCase()
                  const tc  = evColor(ev.tipo)
                  return (
                    <div key={ev.id} style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "12px 18px",
                      borderBottom: idx < eventos.length - 1 ? "1px solid var(--line)" : undefined,
                    }}>
                      <div style={{
                        width: 44, height: 44, flexShrink: 0, borderRadius: 8,
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        background: tc.bg,
                      }}>
                        <span style={{ fontFamily: "var(--font-montserrat), Montserrat", fontWeight: 700, fontSize: ".95rem", color: tc.text, lineHeight: 1 }}>{d}</span>
                        <span style={{ fontFamily: "var(--f-data)", fontWeight: 700, fontSize: ".5rem", letterSpacing: ".1em", color: tc.text }}>{mes}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: ".87rem", color: "var(--fg)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ev.titulo}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            fontFamily: "var(--f-data)", fontSize: ".58rem", fontWeight: 700,
                            padding: "1px 6px", borderRadius: 3,
                            background: tc.bg, color: tc.text, letterSpacing: ".07em", textTransform: "uppercase",
                          }}>
                            {ev.tipo}
                          </span>
                          <span style={{ fontFamily: "var(--f-data)", fontSize: ".67rem", color: "var(--muted)" }}>
                            {ev.hora} · {ev.lugar}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={14} strokeWidth={1.75} style={{ color: "var(--muted-2)", flexShrink: 0 }} />
                    </div>
                  )
                })}
              </Card>
            </section>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ───────────────────────────────────────── */}
        <div className="lg:col-span-4" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Large circular progress card ── */}
          <Card>
            <CardHeader>
              <h3 className="font-montserrat" style={{ fontSize: ".9rem", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
                Actualización 2026
              </h3>
              <span style={{
                fontFamily: "var(--f-data)", fontSize: ".62rem", fontWeight: 700,
                letterSpacing: ".06em",
                color: pct >= 100 ? "var(--ok)" : "var(--muted)",
                padding: "2px 8px", borderRadius: 10,
                background: pct >= 100 ? "var(--ok-bg)" : "var(--surface-2)",
              }}>
                {pct >= 100 ? "¡Meta alcanzada!" : `${faltanH}h restantes`}
              </span>
            </CardHeader>

            <div style={{ padding: "24px 20px 20px" }}>
              {/* Large SVG ring */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                <div style={{ position: "relative", width: 160, height: 160 }}>
                  <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
                    {/* Track ring */}
                    <circle cx="80" cy="80" r={R_BIG} fill="none"
                      stroke="var(--surface-3)" strokeWidth="12" />
                    {/* Progress ring */}
                    <circle cx="80" cy="80" r={R_BIG} fill="none"
                      stroke={progressColor} strokeWidth="12" strokeLinecap="round"
                      strokeDasharray={CIRC_BIG} strokeDashoffset={OFFSET_BIG}
                    />
                    {/* Background track (subtle glow) */}
                    <circle cx="80" cy="80" r={R_BIG} fill="none"
                      stroke={progressColor} strokeWidth="12" strokeLinecap="round"
                      strokeDasharray={CIRC_BIG} strokeDashoffset={OFFSET_BIG}
                      opacity=".12"
                      style={{ filter: "blur(6px)" }}
                    />
                  </svg>
                  {/* Center text */}
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <span className="font-montserrat" style={{
                      fontSize: "2.5rem", fontWeight: 700,
                      color: "var(--fg)", lineHeight: 1, letterSpacing: "-.04em",
                    }}>
                      {pct}
                      <span style={{ fontSize: "1.3rem", color: "var(--muted)", fontWeight: 500 }}>%</span>
                    </span>
                    <span style={{
                      fontFamily: "var(--f-data)", fontSize: ".7rem",
                      color: "var(--muted)", marginTop: 4,
                    }}>
                      {usuario.horas} / {usuario.horasMeta}h
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress stats */}
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  { label: "Horas acreditadas", val: `${usuario.horas}h`, color: "#F59E0B" },
                  { label: "Meta anual",         val: `${usuario.horasMeta}h`, color: "var(--muted)" },
                  { label: "Cursos en progreso", val: String(enCurso.length),   color: "#3B82F6" },
                  { label: "Cursos completados", val: String(completados.length),color: "#10B981" },
                  ...(faltanH > 0 ? [{ label: "Horas faltantes", val: `${faltanH}h`, color: "#F87171" }] : []),
                  ...(usuario.vigencia ? [{ label: "Vigencia", val: usuario.vigencia, color: "var(--muted)" }] : []),
                ].map(stat => (
                  <div key={stat.label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{
                      fontFamily: "var(--f-data)", fontSize: ".72rem", color: "var(--muted)",
                    }}>
                      {stat.label}
                    </span>
                    <span className="font-montserrat" style={{
                      fontSize: ".82rem", fontWeight: 700, color: stat.color,
                    }}>
                      {stat.val}
                    </span>
                  </div>
                ))}
              </div>

              {/* Full progress bar */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  fontFamily: "var(--f-data)", fontSize: ".65rem",
                  color: "var(--muted)", marginBottom: 7,
                }}>
                  <span>Avance anual</span>
                  <span style={{ fontWeight: 700, color: progressColor }}>{pct}%</span>
                </div>
                <div style={{ height: 8, background: "var(--surface-3)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 4, width: `${pct}%`,
                    background: `linear-gradient(90deg, ${pct >= 100 ? "#059669, #10B981" : "#D97706, #F59E0B"})`,
                  }} />
                </div>
                {faltanH > 0 && (
                  <p style={{
                    fontFamily: "var(--f-data)", fontSize: ".67rem",
                    color: "var(--muted)", marginTop: 7,
                  }}>
                    Faltan <strong style={{ color: "#F59E0B" }}>{faltanH}h</strong> para tu meta
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* ── Avisos card ── */}
          <Card>
            <CardHeader>
              <h3 className="font-montserrat" style={{
                display: "flex", alignItems: "center", gap: 7,
                fontSize: ".9rem", fontWeight: 700, color: "var(--fg)", margin: 0,
              }}>
                <Megaphone size={14} strokeWidth={2} style={{ color: "#F59E0B" }} />
                Avisos del colegio
              </h3>
              <Link href="/dashboard/avisos" style={{
                fontFamily: "var(--f-data)", fontSize: ".72rem", fontWeight: 600,
                color: "var(--brand)", textDecoration: "none",
              }}>
                Ver todos
              </Link>
            </CardHeader>

            {avisos.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center" }}>
                <Megaphone size={28} strokeWidth={1.25} style={{ color: "var(--muted-2)", margin: "0 auto 10px" }} />
                <p style={{ fontSize: ".84rem", color: "var(--muted)" }}>Sin avisos recientes</p>
              </div>
            ) : (
              <div>
                {avisos.map((av, idx) => {
                  const dot = AVISO_DOT[av.tipo] ?? "#3B82F6"
                  return (
                    <Link key={av.id} href="/dashboard/avisos" className="dash-aviso-row" style={{
                      display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 18px",
                      borderBottom: idx < avisos.length - 1 ? "1px solid var(--line)" : undefined,
                      textDecoration: "none",
                    }}
                    >
                      {/* Dot indicator */}
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                        background: dot, marginTop: 7,
                        boxShadow: `0 0 6px ${dot}66`,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 500, fontSize: ".84rem", color: "var(--fg)",
                          lineHeight: 1.35, marginBottom: 4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                        } as React.CSSProperties}>
                          {av.titulo}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{
                            fontFamily: "var(--f-data)", fontSize: ".6rem", fontWeight: 700,
                            letterSpacing: ".08em", textTransform: "uppercase", color: dot,
                          }}>
                            {av.tipo}
                          </span>
                          <span style={{ fontFamily: "var(--f-data)", fontSize: ".65rem", color: "var(--muted-2)" }}>
                            · {av.categoria}
                          </span>
                          {av.fijado && (
                            <span style={{
                              fontFamily: "var(--f-data)", fontSize: ".6rem", fontWeight: 700,
                              color: "#F59E0B", letterSpacing: ".06em",
                            }}>
                              · Fijado
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>

          {/* ── Perfil quick info ── */}
          <Card>
            <CardHeader>
              <h3 className="font-montserrat" style={{ fontSize: ".9rem", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
                Mi perfil
              </h3>
              <Link href="/dashboard/perfil" style={{
                fontFamily: "var(--f-data)", fontSize: ".72rem", fontWeight: 600,
                color: "var(--brand)", textDecoration: "none",
              }}>
                Editar
              </Link>
            </CardHeader>
            <div style={{ padding: "14px 18px", display: "grid", gap: 10 }}>
              {[
                { label: "Colegiado",    val: usuario.numeroColegiado ? `CIME-VER-${usuario.numeroColegiado}` : "Sin asignar" },
                { label: "Especialidad", val: usuario.especialidad ?? "—" },
                { label: "Ciudad",       val: usuario.ciudad ?? "—" },
                { label: "Cédula",       val: usuario.cedula ?? "—" },
                { label: "Alta",         val: usuario.alta ? String(usuario.alta) : "—" },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                  <span style={{
                    fontFamily: "var(--f-data)", fontSize: ".67rem", fontWeight: 600,
                    color: "var(--muted)", letterSpacing: ".04em", textTransform: "uppercase",
                    flexShrink: 0,
                  }}>
                    {row.label}
                  </span>
                  <span style={{
                    fontSize: ".8rem", color: "var(--fg-2)", textAlign: "right",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {row.val}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

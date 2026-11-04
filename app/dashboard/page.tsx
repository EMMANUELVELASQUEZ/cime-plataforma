import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  GraduationCap, Clock, Award, CreditCard, Calendar, Megaphone,
  ChevronRight, BookOpen, Shield, TrendingUp,
  ArrowRight, CheckCircle2, AlertCircle, User, MapPin, Star,
} from "lucide-react"

export const dynamic = "force-dynamic"

const AREA_LABEL: Record<string, string> = { ELE: "Eléctrica", MEC: "Mecánica", SOL: "Solar / Renovable" }
const AREA_COLOR: Record<string, string> = { ELE: "#1B6FC8", MEC: "#7C3AED", SOL: "#0D9F6F" }
const AREA_BG:    Record<string, string> = { ELE: "#EBF3FC",  MEC: "#F3EFFE", SOL: "#E6F5EE" }

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const parsed = new Date(dateStr.replace(/(\d+)\s+(\w+)\s+(\d+)/, (_, d, m, y) => {
    const months: Record<string, string> = { ene:"01",feb:"02",mar:"03",abr:"04",may:"05",jun:"06",jul:"07",ago:"08",sep:"09",oct:"10",nov:"11",dic:"12" }
    return `${y}-${months[m.toLowerCase()] ?? "12"}-${d.padStart(2,"0")}`
  }))
  if (isNaN(parsed.getTime())) return null
  return Math.ceil((parsed.getTime() - Date.now()) / 86400000)
}

const money = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })

// ─── Micro helpers ───────────────────────────────────────────────
const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    fontSize: ".58rem", fontFamily: "var(--f-data)", fontWeight: 700,
    letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)",
    marginBottom: 4,
  }}>
    {children}
  </div>
)

const SectionRule = ({ label, action }: { label: string; action?: React.ReactNode }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    gap: 14, marginBottom: 14, paddingBottom: 12,
    borderBottom: "1px solid var(--line)",
  }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
      <h2 style={{
        fontFamily: "var(--f-display)", fontSize: "1.05rem",
        fontWeight: 800, margin: 0, letterSpacing: "-.02em",
      }}>
        {label}
      </h2>
    </div>
    {action}
  </div>
)

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
      include: {
        curso: {
          include: {
            modulos: { orderBy: { orden: "asc" } },
            inscritos: { select: { id: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.evento.findMany({
      where: { fecha: { gte: new Date() } },
      orderBy: { fecha: "asc" },
      take: 4,
    }),
    prisma.aviso.findMany({
      orderBy: [{ fijado: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.pago.findMany({
      where: { usuarioId: userId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ])

  if (!usuario) return <div className="empty">Sin datos de sesión.</div>

  const enCurso    = inscripciones.filter(i => i.estado !== "COMPLETADO")
  const completados = inscripciones.filter(i => i.estado === "COMPLETADO")
  const pct        = Math.min(100, Math.round((usuario.horas / usuario.horasMeta) * 100))
  const diasVig    = daysUntil(usuario.vigencia)
  const pagosPend  = pagos.filter(p => p.estado === "pendiente")
  const montoPend  = pagosPend.reduce((s, p) => s + p.monto, 0)

  const now   = new Date()
  const hour  = now.getHours()
  const saludo = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches"

  const ESTC: Record<string, { label: string; color: string; bg: string }> = {
    VIGENTE:     { label: "Vigente",     color: "#1A7A4A", bg: "rgba(26,122,74,.15)"  },
    POR_RENOVAR: { label: "Por renovar", color: "#C8960A", bg: "rgba(200,150,10,.15)" },
    SUSPENDIDO:  { label: "Suspendido",  color: "#B03030", bg: "rgba(176,48,48,.15)"  },
  }
  const est = ESTC[usuario.estado] ?? ESTC.VIGENTE

  const kpis = [
    {
      label: "Horas acreditadas",
      val:   `${usuario.horas}`,
      unit:  "h",
      sub:   `${pct}% de ${usuario.horasMeta}h meta`,
      color: "#C8B820",
      icon:  <Clock size={12} strokeWidth={2} />,
    },
    {
      label: "Cursos activos",
      val:   String(enCurso.length),
      unit:  "",
      sub:   enCurso.length === 0 ? "Sin cursos en progreso" : "Inscritos en progreso",
      color: "#1B4F91",
      icon:  <BookOpen size={12} strokeWidth={2} />,
    },
    {
      label: "Constancias",
      val:   String(completados.length),
      unit:  "",
      sub:   completados.length === 1 ? "Curso acreditado" : "Cursos acreditados",
      color: "#1A7A4A",
      icon:  <Award size={12} strokeWidth={2} />,
    },
    montoPend > 0
      ? { label: "Saldo pendiente", val: money(montoPend),  unit: "", sub: `${pagosPend.length} pago${pagosPend.length > 1 ? "s" : ""} por realizar`, color: "#906012", icon: <CreditCard size={12} strokeWidth={2} /> }
      : { label: "Pagos",           val: "Al corriente",    unit: "", sub: "Sin adeudos pendientes",                                                   color: "#1A7A4A", icon: <CreditCard size={12} strokeWidth={2} /> },
  ]

  return (
    <>
      {/* ── CREDENTIAL HERO ─────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(165deg, #070A24 0%, #0D1540 52%, #080E2E 100%)",
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
        borderLeft: "3px solid #E5D330",
      }}>
        {/* Grid texture */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(229,211,48,.035) 1px, transparent 1px), " +
            "linear-gradient(90deg, rgba(229,211,48,.025) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }} />
        {/* Radial glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 60% 80% at 100% 50%, rgba(229,211,48,.04), transparent 65%)",
        }} />

        <div style={{
          position: "relative",
          display: "flex", gap: 0, alignItems: "stretch", flexWrap: "wrap",
        }}>
          {/* ─ Left: Identity ─ */}
          <div style={{ flex: "1 1 340px", minWidth: 0, padding: "28px 32px 26px 36px" }}>
            {/* Eyebrow */}
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              fontSize: ".58rem", color: "rgba(229,211,48,.5)",
              fontFamily: "var(--f-data)", letterSpacing: ".16em",
              textTransform: "uppercase", marginBottom: 9,
            }}>
              <Shield size={8} strokeWidth={2.5} />
              Colegio de Ingenieros Mecánicos y Electricistas de Veracruz
            </div>

            {/* Greeting */}
            <div style={{
              fontSize: ".62rem", color: "rgba(255,255,255,.22)",
              fontFamily: "var(--f-data)", letterSpacing: ".06em", marginBottom: 5,
            }}>
              {saludo}
            </div>

            {/* Name — Playfair Display */}
            <h1 style={{
              fontFamily: "var(--f-display)",
              fontSize: "clamp(1.45rem,2.5vw,2.05rem)",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-.03em",
              lineHeight: 1.08,
              margin: "0 0 5px",
            }}>
              {usuario.nombre}
            </h1>

            {usuario.especialidad && (
              <div style={{
                fontSize: ".76rem", color: "rgba(255,255,255,.4)",
                fontFamily: "var(--f-data)", marginBottom: 16, letterSpacing: ".02em",
              }}>
                {usuario.especialidad}
              </div>
            )}

            {/* Meta row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "2px 8px 2px 7px", borderRadius: 2,
                background: est.bg, border: `1px solid ${est.color}44`,
                color: est.color, fontSize: ".6rem", fontWeight: 700,
                letterSpacing: ".1em", textTransform: "uppercase",
                fontFamily: "var(--f-data)",
              }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: est.color, flexShrink: 0 }} />
                {est.label}
              </span>

              {([
                usuario.numeroColegiado && { text: `CIME-VER-${usuario.numeroColegiado}`, icon: <Shield size={9} strokeWidth={2.5} /> },
                usuario.ciudad          && { text: usuario.ciudad,           icon: <MapPin size={9} strokeWidth={2.5} /> },
                usuario.alta            && { text: `Alta ${usuario.alta}`,   icon: <Star   size={9} strokeWidth={2.5} /> },
              ] as { text: string; icon: React.ReactNode }[]).filter(Boolean).map((item, i) => (
                <span key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: ".62rem", color: "rgba(255,255,255,.28)",
                  fontFamily: "var(--f-data)", letterSpacing: ".02em",
                }}>
                  {item.icon} {item.text}
                </span>
              ))}
            </div>
          </div>

          {/* Vertical rule */}
          <div style={{
            width: 1, background: "rgba(255,255,255,.06)",
            flexShrink: 0, alignSelf: "stretch",
            margin: "20px 0",
          }} />

          {/* ─ Right: Progress metrics ─ */}
          <div style={{
            flex: "0 1 300px", minWidth: 220,
            padding: "28px 36px 26px 32px",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            gap: 16,
          }}>
            <div style={{
              fontSize: ".58rem", color: "rgba(255,255,255,.22)",
              fontFamily: "var(--f-data)", letterSpacing: ".14em",
              textTransform: "uppercase",
            }}>
              Actualización profesional 2026
            </div>

            {/* Hours display */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
              <div>
                <div style={{
                  fontFamily: "var(--f-data)", fontSize: ".56rem",
                  color: "rgba(255,255,255,.22)", letterSpacing: ".12em",
                  textTransform: "uppercase", marginBottom: 2,
                }}>
                  Acreditadas
                </div>
                <div style={{
                  fontFamily: "var(--f-data)",
                  fontSize: "2.4rem", fontWeight: 700,
                  color: "#E5D330", lineHeight: 1,
                  letterSpacing: "-.04em",
                }}>
                  {usuario.horas}<span style={{ fontSize: "1.1rem", opacity: .65 }}>h</span>
                </div>
              </div>
              <div style={{ paddingBottom: 5 }}>
                <div style={{
                  fontFamily: "var(--f-data)", fontSize: ".56rem",
                  color: "rgba(255,255,255,.22)", letterSpacing: ".12em",
                  textTransform: "uppercase", marginBottom: 2,
                }}>
                  Meta
                </div>
                <div style={{
                  fontFamily: "var(--f-data)", fontWeight: 700,
                  fontSize: "1.1rem", color: "rgba(255,255,255,.35)",
                }}>
                  {usuario.horasMeta}h
                </div>
              </div>
              {diasVig !== null && (
                <div style={{ paddingBottom: 5, marginLeft: "auto" }}>
                  <div style={{
                    fontFamily: "var(--f-data)", fontSize: ".56rem",
                    color: "rgba(255,255,255,.22)", letterSpacing: ".12em",
                    textTransform: "uppercase", marginBottom: 2, textAlign: "right",
                  }}>
                    Vence en
                  </div>
                  <div style={{
                    fontFamily: "var(--f-data)", fontWeight: 700, fontSize: "1.1rem",
                    color: diasVig <= 30 ? "#E06060" : diasVig <= 90 ? "#D4A033" : "rgba(255,255,255,.38)",
                    textAlign: "right",
                  }}>
                    {diasVig}d
                  </div>
                </div>
              )}
            </div>

            {/* Progress bar — flat, no radius */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{
                  fontFamily: "var(--f-data)", fontSize: ".58rem",
                  color: "rgba(255,255,255,.2)", letterSpacing: ".08em", textTransform: "uppercase",
                }}>
                  Avance anual
                </span>
                <span style={{
                  fontFamily: "var(--f-data)", fontSize: ".68rem", fontWeight: 700,
                  color: pct >= 100 ? "#3DB87A" : "#E5D330",
                }}>
                  {pct}%
                </span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,.07)" }}>
                <div style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: pct >= 100
                    ? "linear-gradient(90deg,#22c55e,#3db87a)"
                    : "linear-gradient(90deg,#c8b820,#e5d330)",
                  transition: "width 1.4s cubic-bezier(0.4,0,.2,1)",
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI STRIP ───────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        border: "1px solid var(--line)",
        borderRadius: 4,
        overflow: "hidden",
        background: "var(--surface)",
        boxShadow: "0 1px 3px rgba(7,10,36,.06), 0 1px 2px rgba(7,10,36,.04)",
      }}>
        {kpis.map((kpi, i) => (
          <div key={kpi.label} style={{
            padding: "15px 18px 13px",
            borderRight: i < kpis.length - 1 ? "1px solid var(--line)" : "none",
            boxShadow: `inset 3px 0 0 0 ${kpi.color}`,
            cursor: "default",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: ".57rem", letterSpacing: ".13em",
              textTransform: "uppercase", color: "var(--muted)",
              fontFamily: "var(--f-data)", marginBottom: 9,
            }}>
              {kpi.icon} {kpi.label}
            </div>
            <div style={{
              fontFamily: "var(--f-data)",
              fontSize: kpi.val.length > 7 ? "1.2rem" : "1.85rem",
              fontWeight: 700, letterSpacing: "-.03em",
              lineHeight: 1, color: kpi.color, marginBottom: 5,
            }}>
              {kpi.val}<span style={{ fontSize: ".75em", opacity: .6 }}>{kpi.unit}</span>
            </div>
            <div style={{
              fontSize: ".67rem", color: "var(--muted)",
              fontFamily: "var(--f-data)",
            }}>
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── CURSOS EN PROGRESO ──────────────────────────────────── */}
      {enCurso.length > 0 ? (
        <section>
          <SectionRule
            label="Continúa donde lo dejaste"
            action={
              <Link href="/dashboard/cursos" className="btn sm ghost" style={{
                fontFamily: "var(--f-data)", fontSize: ".7rem",
                letterSpacing: ".05em", gap: 4,
              }}>
                Ver catálogo <ChevronRight size={12} strokeWidth={2.5} />
              </Link>
            }
          />
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 1,
            border: "1px solid var(--line)",
            borderRadius: 4,
            overflow: "hidden",
            background: "var(--line)",
            boxShadow: "0 1px 3px rgba(7,10,36,.06)",
          }}>
            {enCurso.slice(0, 3).map(insc => {
              const c     = insc.curso
              const color = AREA_COLOR[c.area] ?? "#5754D0"
              const bg    = AREA_BG[c.area]    ?? "#F0F0FF"
              const p     = Math.round(insc.progreso)
              const totalMods = c.modulos.length
              return (
                <article key={insc.id} style={{
                  background: "var(--surface)",
                  display: "flex", flexDirection: "column",
                }}>
                  {/* Top area stripe */}
                  <div style={{ height: 3, background: color, flexShrink: 0 }} />

                  {/* Header */}
                  <div style={{ padding: "16px 18px 12px", flex: 1 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center",
                      padding: "2px 7px", marginBottom: 10,
                      background: bg, color,
                      fontSize: ".58rem", fontWeight: 700,
                      letterSpacing: ".1em", textTransform: "uppercase",
                      fontFamily: "var(--f-data)", borderRadius: 2,
                    }}>
                      {AREA_LABEL[c.area]}
                    </span>

                    <h3 style={{
                      fontFamily: "var(--f-display)",
                      fontSize: ".97rem", fontWeight: 800,
                      color: "var(--fg)", lineHeight: 1.25,
                      margin: 0, letterSpacing: "-.01em",
                    }}>
                      {c.titulo}
                    </h3>
                  </div>

                  {/* Meta row */}
                  <div style={{
                    padding: "0 18px 14px",
                    display: "flex", alignItems: "center", gap: 14,
                    fontSize: ".68rem", color: "var(--muted)",
                    fontFamily: "var(--f-data)", letterSpacing: ".02em",
                    borderBottom: "1px solid var(--line)",
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <User size={10} strokeWidth={2} />
                      {c.instructor}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={10} strokeWidth={2} />
                      {c.horas}h
                    </span>
                    {totalMods > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <BookOpen size={10} strokeWidth={2} />
                        {totalMods} móds.
                      </span>
                    )}
                  </div>

                  {/* Progress */}
                  <div style={{ padding: "12px 18px 14px" }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "baseline", marginBottom: 7,
                    }}>
                      <span style={{
                        fontSize: ".58rem", color: "var(--muted)",
                        fontFamily: "var(--f-data)", letterSpacing: ".1em",
                        textTransform: "uppercase",
                      }}>
                        Avance
                      </span>
                      <span style={{
                        fontFamily: "var(--f-data)", fontWeight: 700,
                        fontSize: ".9rem", letterSpacing: "-.01em", color,
                      }}>
                        {p}<span style={{ fontSize: ".65rem", opacity: .6 }}>%</span>
                      </span>
                    </div>
                    <div style={{ height: 4, background: "var(--surface-2)" }}>
                      <div style={{
                        height: "100%", width: `${p}%`, background: color,
                        transition: "width 1s ease",
                        boxShadow: p > 5 ? `0 0 6px ${color}55` : "none",
                      }} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{
                    padding: "9px 18px",
                    borderTop: "1px solid var(--line)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "var(--surface-2)", gap: 8,
                  }}>
                    <span style={{
                      fontSize: ".64rem", color: "var(--muted)",
                      fontFamily: "var(--f-data)", letterSpacing: ".03em",
                    }}>
                      {new Date(c.fechaFin).toLocaleDateString("es-MX", {
                        day: "numeric", month: "short", year: "numeric",
                      }).toUpperCase()}
                    </span>
                    <Link href={`/dashboard/cursos/${c.id}`} className="btn sm primary" style={{
                      fontSize: ".7rem", height: 28, padding: "0 11px",
                      borderRadius: 2, gap: 4, letterSpacing: ".02em",
                      fontFamily: "var(--f-data)",
                    }}>
                      Continuar <ArrowRight size={11} strokeWidth={2.5} />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : (
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 4,
          borderLeft: "3px solid var(--info)",
          padding: "28px 24px",
          display: "flex", alignItems: "center", gap: 20,
          boxShadow: "0 1px 3px rgba(7,10,36,.06)",
        }}>
          <div style={{
            width: 44, height: 44, flexShrink: 0,
            background: "var(--info-bg)", border: "1px solid var(--info-ring)",
            borderRadius: 3, display: "grid", placeItems: "center",
          }}>
            <GraduationCap size={22} strokeWidth={1.5} style={{ color: "var(--info)" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontFamily: "var(--f-display)", fontSize: ".95rem",
              fontWeight: 800, marginBottom: 3,
            }}>
              Sin cursos activos
            </h3>
            <p style={{ fontSize: ".8rem", margin: 0 }}>
              Inscríbete al catálogo de cursos para acumular horas de actualización profesional.
            </p>
          </div>
          <Link href="/dashboard/cursos" className="btn primary" style={{
            borderRadius: 2, flexShrink: 0,
            fontFamily: "var(--f-data)", letterSpacing: ".04em", fontSize: ".78rem",
          }}>
            <BookOpen size={14} strokeWidth={1.75} /> Catálogo
          </Link>
        </div>
      )}

      {/* ── CURSOS COMPLETADOS ──────────────────────────────────── */}
      {completados.length > 0 && (
        <section>
          <SectionRule
            label="Constancias obtenidas"
            action={
              <span className="chip nodot ok" style={{ fontFamily: "var(--f-data)", fontSize: ".62rem" }}>
                {completados.length} acreditado{completados.length > 1 ? "s" : ""}
              </span>
            }
          />
          <div style={{
            display: "grid", gap: 1,
            border: "1px solid var(--line)", borderRadius: 4,
            overflow: "hidden", background: "var(--line)",
            boxShadow: "0 1px 3px rgba(7,10,36,.05)",
          }}>
            {completados.slice(0, 4).map(insc => {
              const color = AREA_COLOR[insc.curso.area] ?? "#5754D0"
              const bg    = AREA_BG[insc.curso.area]   ?? "#F0F0FF"
              return (
                <div key={insc.id} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  background: "var(--surface)",
                  padding: "12px 18px",
                  borderLeft: `3px solid ${color}`,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 2, flexShrink: 0,
                    background: "var(--ok-bg)", border: "1px solid var(--ok-ring)",
                    display: "grid", placeItems: "center",
                  }}>
                    <CheckCircle2 size={16} strokeWidth={2} style={{ color: "var(--ok)" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600, fontSize: ".88rem", marginBottom: 3,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {insc.curso.titulo}
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10,
                      fontSize: ".68rem", color: "var(--muted)",
                      fontFamily: "var(--f-data)",
                    }}>
                      <span style={{
                        padding: "1px 6px", background: bg, color,
                        fontSize: ".58rem", fontWeight: 700, letterSpacing: ".1em",
                        textTransform: "uppercase", borderRadius: 2,
                      }}>
                        {AREA_LABEL[insc.curso.area]}
                      </span>
                      <span>{insc.curso.horas}h acreditadas</span>
                      {insc.folio && <span>· Folio {insc.folio}</span>}
                    </div>
                  </div>
                  <Link href="/dashboard/constancias" className="btn sm" style={{
                    flexShrink: 0, borderRadius: 2,
                    fontFamily: "var(--f-data)", fontSize: ".68rem", letterSpacing: ".04em",
                  }}>
                    <Award size={12} strokeWidth={2} /> Constancia
                  </Link>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── EVENTOS + AVISOS ────────────────────────────────────── */}
      <div className="grid g-dash">

        {/* Eventos */}
        <div className="card" style={{ borderRadius: 4 }}>
          <div className="card-h">
            <h2 style={{
              display: "flex", alignItems: "center", gap: 8,
              fontFamily: "var(--f-display)", fontSize: ".95rem",
              fontWeight: 800, letterSpacing: "-.02em",
            }}>
              <Calendar size={14} strokeWidth={2} style={{ color: "var(--brand)" }} />
              Próximos eventos
            </h2>
            <Link href="/dashboard/calendario" className="btn sm ghost" style={{
              fontFamily: "var(--f-data)", fontSize: ".68rem", letterSpacing: ".04em",
            }}>
              Ver todo
            </Link>
          </div>
          {eventos.length === 0 ? (
            <div className="empty" style={{ padding: "28px 16px" }}>
              <Calendar size={24} strokeWidth={1.25} />
              <span>Sin eventos próximos</span>
            </div>
          ) : (
            <div>
              {eventos.map((ev, idx) => {
                const fecha = new Date(ev.fecha)
                const d   = fecha.getDate()
                const mes = fecha.toLocaleDateString("es-MX", { month: "short" }).replace(".","").toUpperCase()
                const TIPO_COLOR: Record<string, { color: string; bg: string }> = {
                  Asamblea:    { color: "#6366f1", bg: "#6366f112" },
                  Taller:      { color: "#0ea5e9", bg: "#0ea5e912" },
                  Evaluación:  { color: "#10b981", bg: "#10b98112" },
                  Cuota:       { color: "#f59e0b", bg: "#f59e0b12" },
                  Conferencia: { color: "#8b5cf6", bg: "#8b5cf612" },
                }
                const tc = TIPO_COLOR[ev.tipo] ?? { color: "var(--brand)", bg: "var(--info-bg)" }
                return (
                  <div key={ev.id} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "12px 18px",
                    borderBottom: idx < eventos.length - 1 ? "1px solid var(--line)" : "none",
                  }}>
                    {/* Date box */}
                    <div style={{
                      width: 40, height: 40, flexShrink: 0,
                      background: tc.bg, borderRadius: 2,
                      border: `1px solid ${tc.color}22`,
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{
                        fontFamily: "var(--f-data)", fontSize: ".9rem",
                        fontWeight: 700, color: tc.color, lineHeight: 1,
                      }}>{d}</span>
                      <span style={{
                        fontFamily: "var(--f-data)", fontSize: ".52rem",
                        color: tc.color, fontWeight: 700, letterSpacing: ".1em",
                      }}>{mes}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 600, fontSize: ".84rem", marginBottom: 3,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {ev.titulo}
                      </div>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap",
                        fontSize: ".68rem", color: "var(--muted)", fontFamily: "var(--f-data)",
                      }}>
                        <span style={{
                          padding: "1px 6px", background: tc.bg, color: tc.color,
                          fontSize: ".57rem", fontWeight: 700, letterSpacing: ".1em",
                          textTransform: "uppercase", borderRadius: 2,
                        }}>{ev.tipo}</span>
                        <span>{ev.hora} · {ev.lugar}</span>
                      </div>
                    </div>
                    <ChevronRight size={13} strokeWidth={1.75} style={{ color: "var(--muted)", flexShrink: 0 }} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Avisos */}
        <div className="card" style={{ borderRadius: 4 }}>
          <div className="card-h">
            <h2 style={{
              display: "flex", alignItems: "center", gap: 8,
              fontFamily: "var(--f-display)", fontSize: ".95rem",
              fontWeight: 800, letterSpacing: "-.02em",
            }}>
              <Megaphone size={14} strokeWidth={2} style={{ color: "var(--warn)" }} />
              Avisos del colegio
            </h2>
            <Link href="/dashboard/avisos" className="btn sm ghost" style={{
              fontFamily: "var(--f-data)", fontSize: ".68rem", letterSpacing: ".04em",
            }}>
              Ver todos
            </Link>
          </div>
          {avisos.length === 0 ? (
            <div className="empty" style={{ padding: "28px 16px" }}>
              <Megaphone size={24} strokeWidth={1.25} />
              <span>Sin avisos recientes</span>
            </div>
          ) : (
            <div>
              {avisos.map((av, idx) => {
                const AVISO_COLOR: Record<string, { color: string; bg: string }> = {
                  Urgente:      { color: "var(--bad)",  bg: "var(--bad-bg)"  },
                  Importante:   { color: "var(--warn)", bg: "var(--warn-bg)" },
                  Informativo:  { color: "var(--info)", bg: "var(--info-bg)" },
                  Convocatoria: { color: "var(--ok)",   bg: "var(--ok-bg)"   },
                }
                const ac = AVISO_COLOR[av.tipo] ?? AVISO_COLOR.Informativo
                return (
                  <div key={av.id} style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "12px 18px",
                    borderBottom: idx < avisos.length - 1 ? "1px solid var(--line)" : "none",
                    borderLeft: av.fijado || av.tipo === "Urgente" ? `3px solid ${ac.color}` : "3px solid transparent",
                  }}>
                    <div style={{
                      width: 28, height: 28, flexShrink: 0, marginTop: 1,
                      background: ac.bg, borderRadius: 2,
                      display: "grid", placeItems: "center",
                    }}>
                      {av.tipo === "Urgente" || av.fijado
                        ? <AlertCircle size={13} strokeWidth={1.75} style={{ color: ac.color }} />
                        : <Megaphone   size={13} strokeWidth={1.75} style={{ color: ac.color }} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 600, fontSize: ".84rem", lineHeight: 1.3, marginBottom: 4,
                        overflow: "hidden",
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                      } as React.CSSProperties}>
                        {av.titulo}
                      </div>
                      <div style={{
                        display: "flex", gap: 7, alignItems: "center",
                        fontSize: ".65rem", fontFamily: "var(--f-data)",
                      }}>
                        <span style={{
                          padding: "1px 6px", background: ac.bg,
                          color: ac.color, fontSize: ".57rem", fontWeight: 700,
                          letterSpacing: ".1em", textTransform: "uppercase", borderRadius: 2,
                        }}>{av.tipo}</span>
                        <span style={{ color: "var(--muted)" }}>{av.categoria}</span>
                        {av.fijado && (
                          <span style={{
                            fontFamily: "var(--f-data)", fontSize: ".57rem",
                            color: "var(--warn)", fontWeight: 700, letterSpacing: ".1em",
                          }}>
                            FIJADO
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── ACCESOS RÁPIDOS ─────────────────────────────────────── */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 4,
        padding: "16px 20px",
        boxShadow: "0 1px 3px rgba(7,10,36,.05)",
      }}>
        <div style={{
          fontSize: ".58rem", fontFamily: "var(--f-data)", fontWeight: 700,
          letterSpacing: ".15em", textTransform: "uppercase",
          color: "var(--muted)", marginBottom: 14,
        }}>
          Accesos rápidos
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
          gap: 1,
          border: "1px solid var(--line)",
          borderRadius: 2, overflow: "hidden",
          background: "var(--line)",
        }}>
          {[
            { href: "/dashboard/cursos",      icon: <GraduationCap size={16} strokeWidth={1.75} />, label: "Mis cursos",  sub: `${inscripciones.length} inscritos`,                                                                       color: "#1B4F91" },
            { href: "/dashboard/constancias", icon: <Award         size={16} strokeWidth={1.75} />, label: "Constancias", sub: `${completados.length} obtenidas`,                                                                        color: "#1A7A4A" },
            { href: "/dashboard/calendario",  icon: <Calendar      size={16} strokeWidth={1.75} />, label: "Calendario",  sub: `${eventos.length} próximos`,                                                                             color: "#6366f1" },
            { href: "/dashboard/pagos",       icon: <CreditCard    size={16} strokeWidth={1.75} />, label: "Pagos",       sub: pagosPend.length > 0 ? `${pagosPend.length} pendiente${pagosPend.length > 1 ? "s" : ""}` : "Al corriente", color: pagosPend.length > 0 ? "#906012" : "#1A7A4A" },
          ].map(item => (
            <Link key={item.href} href={item.href} className="ent-quick" style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "13px 16px",
              boxShadow: `inset 3px 0 0 0 ${item.color}`,
            }}>
              <div style={{ color: item.color, flexShrink: 0 }}>{item.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontWeight: 600, fontSize: ".84rem",
                  color: "var(--fg)", marginBottom: 1,
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: ".68rem", color: "var(--muted)",
                  fontFamily: "var(--f-data)", letterSpacing: ".02em",
                }}>
                  {item.sub}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}

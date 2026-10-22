import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  GraduationCap, Clock, Award, CreditCard,
  Calendar, Megaphone, ChevronRight, BookOpen,
} from "lucide-react"

export const dynamic = "force-dynamic"

const AREA_LABEL: Record<string, string> = { ELE: "Eléctrica", MEC: "Mecánica", SOL: "Solar" }
const AREA_COLOR: Record<string, string>  = { ELE: "#0ea5e9", MEC: "#10b981", SOL: "#f59e0b" }
const AREA_GRAD: Record<string, string>   = {
  ELE: "linear-gradient(135deg,#052233,#0e4a6e)",
  MEC: "linear-gradient(135deg,#05231a,#0a5c3a)",
  SOL: "linear-gradient(135deg,#231a05,#7a5000)",
}

export default async function DashboardPage() {
  const session = await auth()
  const userId  = (session?.user as any)?.id

  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      nombre: true, numeroColegiado: true, especialidad: true,
      alta: true, cedula: true, vigencia: true,
      horas: true, horasMeta: true, estado: true,
    },
  })

  if (!usuario) return <div className="empty">Sin datos de sesión.</div>

  const inscripciones = await prisma.inscripcionCurso.findMany({
    where: { usuarioId: userId },
    include: { curso: { include: { modulos: true } } },
    orderBy: { updatedAt: "desc" },
  })

  const enCurso   = inscripciones.filter(i => i.estado !== "COMPLETADO")
  const completados = inscripciones.filter(i => i.estado === "COMPLETADO")

  const pct  = Math.min(100, Math.round((usuario.horas / usuario.horasMeta) * 100))
  const circ = 2 * Math.PI * 42

  const now   = new Date()
  const hour  = now.getHours()
  const saludo = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches"
  const firstName = usuario.nombre.replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "").split(/\s+/)[0]

  const ESTC: Record<string, string>   = { VIGENTE: "ok", POR_RENOVAR: "warn", SUSPENDIDO: "bad" }
  const ESTNOMB: Record<string, string> = { VIGENTE: "Vigente", POR_RENOVAR: "Por renovar", SUSPENDIDO: "Suspendido" }

  return (
    <>
      {/* ── Hero banner ─────────────────────────────────────── */}
      <div className="lms-hero">
        <div style={{ display: "grid", gap: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: ".7rem", color: "rgba(255,255,255,.45)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
                {saludo}
              </div>
              <h1 style={{ color: "#fff", fontSize: "clamp(1.5rem,2.5vw,2.1rem)", fontWeight: 800, letterSpacing: "-.03em", margin: 0 }}>
                {firstName} 👋
              </h1>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
                {usuario.numeroColegiado && (
                  <span style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 6, padding: "4px 11px", fontSize: ".73rem", fontFamily: "var(--f-mono)", color: "rgba(255,255,255,.82)", letterSpacing: ".04em" }}>
                    CIME-VER-{usuario.numeroColegiado}
                  </span>
                )}
                {usuario.especialidad && (
                  <span style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 6, padding: "4px 11px", fontSize: ".73rem", color: "rgba(255,255,255,.65)" }}>
                    {usuario.especialidad}
                  </span>
                )}
                <span className={`chip ${ESTC[usuario.estado]}`} style={{ fontSize: ".7rem" }}>
                  {ESTNOMB[usuario.estado]}
                </span>
              </div>
            </div>

            {/* Hours ring */}
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ position: "relative", width: 106, height: 106 }}>
                <svg width="106" height="106" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="7" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#E8B84B" strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circ.toFixed(1)}
                    strokeDashoffset={(circ * (1 - pct / 100)).toFixed(1)} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "grid", placeContent: "center", textAlign: "center" }}>
                  <b style={{ fontSize: "1.45rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{pct}%</b>
                  <span style={{ fontSize: ".6rem", color: "rgba(255,255,255,.45)", marginTop: 2 }}>completado</span>
                </div>
              </div>
              <div style={{ fontSize: ".68rem", color: "rgba(255,255,255,.5)", marginTop: 5 }}>
                {usuario.horas} / {usuario.horasMeta} h · 2026
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".72rem", color: "rgba(255,255,255,.45)", marginBottom: 7 }}>
              <span>Horas de actualización profesional 2026</span>
              <span>{usuario.horasMeta - usuario.horas} h restantes</span>
            </div>
            <div style={{ height: 7, borderRadius: 99, background: "rgba(255,255,255,.12)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#c89b2a,#f5c842)", borderRadius: 99 }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────── */}
      <div className="lms-stat-bar">
        {[
          {
            label: "Horas acreditadas",
            val:   `${usuario.horas}h`,
            sub:   `de ${usuario.horasMeta}h requeridas`,
            color: "#c89b2a", bg: "rgba(200,155,42,.12)",
            icon:  <Clock size={16} strokeWidth={2} />,
          },
          {
            label: "Cursos activos",
            val:   enCurso.length,
            sub:   "En progreso ahora",
            color: "var(--brand)", bg: "var(--info-bg)",
            icon:  <BookOpen size={16} strokeWidth={2} />,
          },
          {
            label: "Constancias",
            val:   completados.length,
            sub:   "Cursos acreditados",
            color: "var(--ok)", bg: "var(--ok-bg)",
            icon:  <Award size={16} strokeWidth={2} />,
          },
          {
            label: "Saldo pendiente",
            val:   "$750",
            sub:   "Vence 15 oct 2026",
            color: "var(--warn)", bg: "var(--warn-bg)",
            icon:  <CreditCard size={16} strokeWidth={2} />,
          },
        ].map(s => (
          <div key={s.label} className="lms-stat">
            <div className="s-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="s-label">{s.label}</div>
            <div className="s-val" style={{ color: s.color }}>{s.val}</div>
            <div className="s-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Cursos en progreso ──────────────────────────────── */}
      {enCurso.length > 0 && (
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>Continúa donde lo dejaste</h2>
              <p style={{ fontSize: ".78rem", margin: "3px 0 0", color: "var(--muted)" }}>Tus cursos en progreso</p>
            </div>
            <Link href="/dashboard/cursos" className="btn sm ghost" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              Ver todos <ChevronRight size={13} strokeWidth={2.5} />
            </Link>
          </div>
          <div className="lms-course-grid">
            {enCurso.slice(0, 3).map(i => {
              const c     = i.curso
              const color = AREA_COLOR[c.area] ?? "#6366f1"
              const grad  = AREA_GRAD[c.area] ?? "linear-gradient(135deg,#1a1a2e,#6366f1)"
              const p     = Math.round(i.progreso)
              return (
                <div key={i.id} className="lms-course">
                  <div className="lms-course-banner" style={{ background: grad }}>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%", gap: 8 }}>
                      <div>
                        <span className="subject-tag" style={{ background: `${color}22`, color, borderColor: `${color}44`, marginBottom: 5, display: "inline-block" }}>
                          {AREA_LABEL[c.area]}
                        </span>
                        <div style={{ fontSize: ".88rem", fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{c.titulo}</div>
                      </div>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}22`, border: `1px solid ${color}44`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <GraduationCap size={18} strokeWidth={1.75} color={color} />
                      </div>
                    </div>
                  </div>
                  <div className="lms-course-body">
                    <div style={{ fontSize: ".76rem", color: "var(--muted)", display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span>{c.instructor}</span>
                      <span>·</span>
                      <span>{c.modalidad}</span>
                      <span>·</span>
                      <span>{c.horas} h</span>
                    </div>
                    <div>
                      <div className="lms-progress-label">
                        <span>Módulo {i.moduloActual + 1} de {c.modulos.length}</span>
                        <b style={{ color, fontFamily: "var(--f-mono)" }}>{p}%</b>
                      </div>
                      <div className="lms-progress-track">
                        <div className="lms-progress-fill" style={{ width: `${p}%`, background: color }} />
                      </div>
                    </div>
                  </div>
                  <div className="lms-course-footer">
                    <span style={{ fontSize: ".73rem", color: "var(--muted)" }}>
                      Termina {new Date(c.fechaFin).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <Link href="/dashboard/cursos" className="btn sm primary" style={{ fontSize: ".78rem", height: 30, padding: "0 12px" }}>
                      Continuar →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {enCurso.length === 0 && (
        <div className="card card-b" style={{ textAlign: "center", padding: "32px 24px" }}>
          <GraduationCap size={36} strokeWidth={1.25} style={{ margin: "0 auto 12px", color: "var(--muted)" }} />
          <h3 style={{ fontWeight: 600, marginBottom: 6 }}>Sin cursos activos</h3>
          <p style={{ fontSize: ".84rem", color: "var(--muted)", marginBottom: 16 }}>Inscríbete a un curso del catálogo para acumular horas de actualización.</p>
          <Link href="/dashboard/cursos" className="btn primary">Ver catálogo de cursos</Link>
        </div>
      )}

      {/* ── Eventos + Avisos ─────────────────────────────────── */}
      <div className="grid g-dash">
        <div className="card">
          <div className="card-h">
            <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={16} strokeWidth={1.75} style={{ color: "var(--brand)" }} />
              Próximos eventos
            </h2>
            <Link href="/dashboard/calendario" className="btn sm ghost">Ver calendario</Link>
          </div>
          <div className="event-list">
            {[
              { label: "Asamblea ordinaria oct.", date: "25 oct 2026", type: "Asamblea", color: "#6366f1", bg: "#6366f115" },
              { label: "Taller: Instalaciones industriales", date: "3 nov 2026", type: "Taller", color: "#0ea5e9", bg: "#0ea5e915" },
              { label: "Vencimiento cuota anual 2026", date: "15 oct 2026", type: "Cuota", color: "#f59e0b", bg: "#f59e0b15" },
              { label: "Examen final módulo 3", date: "28 oct 2026", type: "Evaluación", color: "#10b981", bg: "#10b98115" },
            ].map(ev => (
              <div key={ev.label} className="event-item">
                <div className="event-dot" style={{ background: ev.bg, color: ev.color }}>
                  <Calendar size={16} strokeWidth={1.75} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: ".85rem", marginBottom: 3, lineHeight: 1.3 }}>{ev.label}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span className="subject-tag" style={{ background: ev.bg, color: ev.color, borderColor: `${ev.color}33` }}>{ev.type}</span>
                    <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>{ev.date}</span>
                  </div>
                </div>
                <ChevronRight size={14} strokeWidth={1.75} style={{ color: "var(--muted)", flexShrink: 0, marginTop: 2 }} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Megaphone size={16} strokeWidth={1.75} style={{ color: "var(--warn)" }} />
              Avisos recientes
            </h2>
            <Link href="/dashboard/avisos" className="btn sm ghost">Ver todos</Link>
          </div>
          <div className="event-list">
            {[
              { title: "Convocatoria cursos 2027 abierta", time: "Hace 2 días", urgent: false },
              { title: "Pago de cuota anual vence el 15 oct", time: "Hace 3 días", urgent: true },
              { title: "Nuevos módulos: Protección de Sistemas", time: "Hace 1 sem", urgent: false },
              { title: "Asamblea ordinaria — orden del día", time: "Hace 1 sem", urgent: false },
              { title: "Actualización reglamento interno 2026", time: "Hace 2 sem", urgent: false },
            ].map(a => (
              <div key={a.title} className="event-item">
                <div className="event-dot" style={{ background: a.urgent ? "var(--warn-bg)" : "var(--info-bg)", color: a.urgent ? "var(--warn)" : "var(--info)" }}>
                  <Megaphone size={14} strokeWidth={1.75} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: ".84rem", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}>{a.title}</div>
                  <div style={{ fontSize: ".71rem", color: "var(--muted)", marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Accesos rápidos ─────────────────────────────────── */}
      <div className="card card-b">
        <span style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", display: "block", marginBottom: 12 }}>Accesos rápidos</span>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/dashboard/cursos"       className="btn" style={{ gap: 8 }}><GraduationCap size={15} strokeWidth={1.75} /> Ver mis cursos</Link>
          <Link href="/dashboard/calendario"   className="btn" style={{ gap: 8 }}><Calendar size={15} strokeWidth={1.75} />    Calendario</Link>
          <Link href="/dashboard/constancias"  className="btn" style={{ gap: 8 }}><Award size={15} strokeWidth={1.75} />       Mis constancias</Link>
          <Link href="/dashboard/pagos"        className="btn" style={{ gap: 8 }}><CreditCard size={15} strokeWidth={1.75} />  Pagos y cuotas</Link>
        </div>
      </div>
    </>
  )
}

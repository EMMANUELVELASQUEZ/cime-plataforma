import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  GraduationCap, Clock, Award, CreditCard, Calendar, Megaphone,
  ChevronRight, BookOpen, Zap, Shield, TrendingUp, Star,
  ArrowRight, CheckCircle2, AlertCircle, User, MapPin,
} from "lucide-react"

export const dynamic = "force-dynamic"

const AREA_LABEL: Record<string, string> = { ELE: "Eléctrica", MEC: "Mecánica", SOL: "Solar/Renovable" }
const AREA_COLOR: Record<string, string> = { ELE: "#0ea5e9", MEC: "#10b981", SOL: "#f59e0b" }
const AREA_GRAD: Record<string, string>  = {
  ELE: "linear-gradient(140deg,#052233 0%,#0e4a6e 100%)",
  MEC: "linear-gradient(140deg,#05231a 0%,#0a5c3a 100%)",
  SOL: "linear-gradient(140deg,#231a05 0%,#7a5000 100%)",
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  // Supports "31 dic 2026" or ISO or "31/12/2026"
  const parsed = new Date(dateStr.replace(/(\d+)\s+(\w+)\s+(\d+)/, (_, d, m, y) => {
    const months: Record<string, string> = { ene:"01",feb:"02",mar:"03",abr:"04",may:"05",jun:"06",jul:"07",ago:"08",sep:"09",oct:"10",nov:"11",dic:"12" }
    return `${y}-${months[m.toLowerCase()] ?? "12"}-${d.padStart(2,"0")}`
  }))
  if (isNaN(parsed.getTime())) return null
  return Math.ceil((parsed.getTime() - Date.now()) / 86400000)
}

const money = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })

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
  const circ       = 2 * Math.PI * 44
  const diasVig    = daysUntil(usuario.vigencia)
  const pagosPend  = pagos.filter(p => p.estado === "pendiente")
  const montoPend  = pagosPend.reduce((s, p) => s + p.monto, 0)

  const now   = new Date()
  const hour  = now.getHours()
  const saludo = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches"

  const ESTC: Record<string, { cls: string; label: string; color: string }> = {
    VIGENTE:    { cls: "ok",   label: "Vigente",    color: "#3DB87A" },
    POR_RENOVAR:{ cls: "warn", label: "Por renovar", color: "#D4A033" },
    SUSPENDIDO: { cls: "bad",  label: "Suspendido",  color: "#E06060" },
  }
  const est = ESTC[usuario.estado] ?? ESTC.VIGENTE

  return (
    <>
      {/* ── CREDENTIAL HERO ──────────────────────────────────────── */}
      <div className="dash-credential">
        {/* Background decoration */}
        <div className="dash-credential-bg" />

        <div className="dash-credential-inner">
          {/* Left: identity */}
          <div className="dash-cred-identity">
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16, flexShrink: 0,
                background: `hsl(${(usuario.nombre.charCodeAt(0)) * 47 % 360} 45% 28%)`,
                display: "grid", placeItems: "center",
                border: "2px solid rgba(255,255,255,.15)",
                boxShadow: "0 4px 20px rgba(0,0,0,.3)",
                fontSize: "1.3rem", fontWeight: 800, color: "#fff",
                letterSpacing: ".02em",
              }}>
                {usuario.nombre.replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i,"").split(/\s+/).slice(0,2).map(w => w[0]).join("").toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: ".65rem", color: "rgba(255,255,255,.4)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 4 }}>
                  {saludo}
                </div>
                <h1 style={{ color: "#fff", fontSize: "clamp(1.25rem,2vw,1.65rem)", fontWeight: 800, letterSpacing: "-.03em", margin: 0, lineHeight: 1.15 }}>
                  {usuario.nombre}
                </h1>
                {usuario.especialidad && (
                  <div style={{ fontSize: ".78rem", color: "rgba(255,255,255,.55)", marginTop: 4 }}>
                    {usuario.especialidad}
                  </div>
                )}
              </div>
            </div>

            {/* Credential details row */}
            <div className="dash-cred-pills">
              {usuario.numeroColegiado && (
                <div className="cred-pill">
                  <Shield size={11} strokeWidth={2.5} />
                  CIME-VER-{usuario.numeroColegiado}
                </div>
              )}
              {usuario.ciudad && (
                <div className="cred-pill">
                  <MapPin size={11} strokeWidth={2.5} />
                  {usuario.ciudad}
                </div>
              )}
              {usuario.alta && (
                <div className="cred-pill">
                  <Star size={11} strokeWidth={2.5} />
                  Alta {usuario.alta}
                </div>
              )}
              <span className={`chip ${est.cls}`} style={{ fontSize: ".68rem", height: 22 }}>
                {est.label}
              </span>
            </div>

            {/* Hours bar */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".72rem", color: "rgba(255,255,255,.45)", marginBottom: 8 }}>
                <span>Actualización profesional 2026</span>
                <span style={{ fontFamily: "var(--f-mono)" }}>
                  {usuario.horas} / {usuario.horasMeta} h
                  {usuario.horasMeta > usuario.horas ? ` · faltan ${usuario.horasMeta - usuario.horas}h` : " · ¡Meta alcanzada!"}
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,.1)", overflow: "hidden", position: "relative" }}>
                <div style={{
                  height: "100%", width: `${pct}%`,
                  background: pct >= 100 ? "linear-gradient(90deg,#22c55e,#4ade80)" : "linear-gradient(90deg,#c89b2a,#f5c842,#fde68a)",
                  borderRadius: 99, transition: "width 1s ease",
                  boxShadow: "0 0 12px rgba(200,155,42,.5)",
                }} />
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                {[
                  { label: "Acreditadas", val: `${usuario.horas}h`, color: "#f5c842" },
                  { label: "Meta anual",  val: `${usuario.horasMeta}h`, color: "rgba(255,255,255,.4)" },
                  { label: "Vigencia",    val: usuario.vigencia ?? "—", color: diasVig !== null && diasVig <= 30 ? "#E06060" : "rgba(255,255,255,.4)" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: ".6rem", color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".08em" }}>{item.label}</span>
                    <span style={{ fontSize: ".82rem", fontWeight: 700, color: item.color, fontFamily: "var(--f-mono)" }}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: progress ring */}
          <div className="dash-cred-ring">
            <div style={{ position: "relative", width: 120, height: 120 }}>
              <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
                <circle cx="50" cy="50" r="44" fill="none"
                  stroke={pct >= 100 ? "#22c55e" : "#E8B84B"}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={circ.toFixed(1)}
                  strokeDashoffset={(circ * (1 - pct / 100)).toFixed(1)} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "grid", placeContent: "center", textAlign: "center" }}>
                <div style={{ fontSize: "1.9rem", fontWeight: 900, color: "#fff", letterSpacing: "-.04em", lineHeight: 1 }}>{pct}%</div>
                <div style={{ fontSize: ".58rem", color: "rgba(255,255,255,.4)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".08em" }}>completado</div>
              </div>
            </div>
            {diasVig !== null && (
              <div style={{
                marginTop: 14, textAlign: "center",
                background: diasVig <= 30 ? "rgba(224,96,96,.15)" : "rgba(255,255,255,.06)",
                border: `1px solid ${diasVig <= 30 ? "rgba(224,96,96,.3)" : "rgba(255,255,255,.1)"}`,
                borderRadius: 8, padding: "6px 14px",
              }}>
                <div style={{ fontSize: ".6rem", color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".08em" }}>Vence en</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: diasVig <= 30 ? "#E06060" : "#E8B84B", fontFamily: "var(--f-mono)" }}>
                  {diasVig} días
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ────────────────────────────────────────────── */}
      <div className="lms-stat-bar">
        {[
          {
            label: "Horas acreditadas",
            val:   `${usuario.horas}`,
            unit:  "h",
            sub:   `${pct}% de la meta ${usuario.horasMeta}h`,
            color: "#C89B2A", bg: "rgba(200,155,42,.12)",
            icon:  <Clock size={17} strokeWidth={1.75} />,
          },
          {
            label: "Cursos activos",
            val:   String(enCurso.length),
            unit:  "",
            sub:   enCurso.length === 0 ? "Sin cursos en progreso" : "Inscrito y en progreso",
            color: "var(--brand)", bg: "var(--info-bg)",
            icon:  <BookOpen size={17} strokeWidth={1.75} />,
          },
          {
            label: "Constancias",
            val:   String(completados.length),
            unit:  "",
            sub:   completados.length === 1 ? "Curso acreditado" : `Cursos acreditados`,
            color: "var(--ok)", bg: "var(--ok-bg)",
            icon:  <Award size={17} strokeWidth={1.75} />,
          },
          montoPend > 0 ? {
            label: "Saldo pendiente",
            val:   money(montoPend),
            unit:  "",
            sub:   `${pagosPend.length} pago${pagosPend.length > 1 ? "s" : ""} por realizar`,
            color: "var(--warn)", bg: "var(--warn-bg)",
            icon:  <CreditCard size={17} strokeWidth={1.75} />,
          } : {
            label: "Pagos",
            val:   "Al corriente",
            unit:  "",
            sub:   "Sin adeudos pendientes",
            color: "var(--ok)", bg: "var(--ok-bg)",
            icon:  <CreditCard size={17} strokeWidth={1.75} />,
          },
        ].map(s => (
          <div key={s.label} className="lms-stat" style={{ cursor: "default" }}>
            <div className="s-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="s-label">{s.label}</div>
            <div className="s-val" style={{ color: s.color, fontSize: s.val.length > 6 ? "1.2rem" : "1.65rem" }}>
              {s.val}<span style={{ fontSize: ".9rem", opacity: .7 }}>{s.unit}</span>
            </div>
            <div className="s-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── CURSOS EN PROGRESO ───────────────────────────────────── */}
      {enCurso.length > 0 ? (
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>Continúa donde lo dejaste</h2>
              <p style={{ fontSize: ".78rem", margin: "3px 0 0", color: "var(--muted)" }}>
                {enCurso.length} curso{enCurso.length > 1 ? "s" : ""} en progreso
              </p>
            </div>
            <Link href="/dashboard/cursos" className="btn sm ghost" style={{ display: "flex", alignItems: "center", gap: 5 }}>
              Ver catálogo <ChevronRight size={13} strokeWidth={2.5} />
            </Link>
          </div>
          <div className="lms-course-grid">
            {enCurso.slice(0, 3).map(i => {
              const c     = i.curso
              const color = AREA_COLOR[c.area] ?? "#6366f1"
              const grad  = AREA_GRAD[c.area] ?? "linear-gradient(140deg,#1a1a2e,#6366f1)"
              const p     = Math.round(i.progreso)
              const totalMods = c.modulos.length
              return (
                <div key={i.id} className="lms-course" style={{ position: "relative" }}>
                  {/* Banner */}
                  <div className="lms-course-banner" style={{ background: grad, height: 108 }}>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="subject-tag" style={{ background: `${color}22`, color, borderColor: `${color}44`, marginBottom: 6, display: "inline-block" }}>
                          {AREA_LABEL[c.area]}
                        </span>
                        <div style={{ fontSize: ".9rem", fontWeight: 700, color: "#fff", lineHeight: 1.3, paddingRight: 8 }}>{c.titulo}</div>
                      </div>
                      <div style={{ width: 38, height: 38, borderRadius: 9, background: `${color}22`, border: `1px solid ${color}44`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <GraduationCap size={18} strokeWidth={1.75} color={color} />
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="lms-course-body">
                    <div style={{ fontSize: ".75rem", color: "var(--muted)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <User size={11} strokeWidth={2} />{c.instructor}
                      </span>
                      <span>·</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Clock size={11} strokeWidth={2} />{c.horas}h
                      </span>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="lms-progress-label">
                        <span style={{ color: "var(--muted)", fontSize: ".72rem" }}>
                          {totalMods > 0 ? `${totalMods} módulo${totalMods > 1 ? "s" : ""}` : "Sin módulos aún"}
                        </span>
                        <b style={{ color, fontFamily: "var(--f-mono)", fontSize: ".78rem" }}>{p}%</b>
                      </div>
                      <div className="lms-progress-track" style={{ height: 7 }}>
                        <div className="lms-progress-fill" style={{
                          width: `${p}%`, background: color,
                          boxShadow: p > 0 ? `0 0 8px ${color}66` : "none",
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="lms-course-footer">
                    <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>
                      {new Date(c.fechaFin).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <Link
                      href={`/dashboard/cursos/${c.id}`}
                      className="btn sm primary"
                      style={{ fontSize: ".78rem", height: 30, padding: "0 12px", gap: 4 }}
                    >
                      Continuar <ArrowRight size={13} strokeWidth={2.5} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : (
        <div className="card" style={{ padding: "36px 28px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--info-bg)", border: "1px solid var(--info-ring)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <GraduationCap size={26} strokeWidth={1.5} style={{ color: "var(--brand)" }} />
          </div>
          <h3 style={{ fontWeight: 700, marginBottom: 6, fontSize: "1rem" }}>Sin cursos activos</h3>
          <p style={{ fontSize: ".85rem", color: "var(--muted)", marginBottom: 20, maxWidth: 380, margin: "0 auto 20px" }}>
            Inscríbete a un curso del catálogo para comenzar a acumular horas de actualización profesional.
          </p>
          <Link href="/dashboard/cursos" className="btn primary" style={{ margin: "0 auto", display: "inline-flex" }}>
            <BookOpen size={16} strokeWidth={1.75} /> Explorar catálogo
          </Link>
        </div>
      )}

      {/* ── COMPLETADOS (si tiene) ───────────────────────────────── */}
      {completados.length > 0 && (
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Cursos acreditados</h2>
            <span className="chip nodot ok">{completados.length} constancia{completados.length > 1 ? "s" : ""}</span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {completados.slice(0, 3).map(i => {
              const color = AREA_COLOR[i.curso.area] ?? "#6366f1"
              return (
                <div key={i.id} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  background: "var(--surface)", border: "1px solid var(--line)",
                  borderRadius: "var(--r)", padding: "14px 18px",
                  boxShadow: "var(--shadow-sm)",
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--ok-bg)", border: "1px solid var(--ok-ring)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <CheckCircle2 size={20} strokeWidth={1.75} style={{ color: "var(--ok)" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: ".9rem", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {i.curso.titulo}
                    </div>
                    <div style={{ fontSize: ".74rem", color: "var(--muted)", display: "flex", gap: 8 }}>
                      <span className="subject-tag" style={{ background: `${color}12`, color, borderColor: `${color}30` }}>{AREA_LABEL[i.curso.area]}</span>
                      <span>{i.curso.horas} h acreditadas</span>
                      {i.folio && <span>· Folio {i.folio}</span>}
                    </div>
                  </div>
                  <Link href="/dashboard/constancias" className="btn sm" style={{ flexShrink: 0 }}>
                    <Award size={13} strokeWidth={2} /> Constancia
                  </Link>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── EVENTOS + AVISOS ─────────────────────────────────────── */}
      <div className="grid g-dash">
        {/* Eventos */}
        <div className="card">
          <div className="card-h">
            <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".95rem" }}>
              <Calendar size={16} strokeWidth={1.75} style={{ color: "var(--brand)" }} />
              Próximos eventos
            </h2>
            <Link href="/dashboard/calendario" className="btn sm ghost">Ver todo</Link>
          </div>
          {eventos.length === 0 ? (
            <div className="empty" style={{ padding: "28px 16px" }}>
              <Calendar size={28} strokeWidth={1.25} />
              <span>Sin eventos próximos</span>
            </div>
          ) : (
            <div className="event-list">
              {eventos.map(ev => {
                const fecha = new Date(ev.fecha)
                const d = fecha.getDate()
                const mes = fecha.toLocaleDateString("es-MX", { month: "short" }).replace(".","").toUpperCase()
                const TIPO_COLOR: Record<string, { color: string; bg: string }> = {
                  Asamblea:    { color: "#6366f1", bg: "#6366f115" },
                  Taller:      { color: "#0ea5e9", bg: "#0ea5e915" },
                  Evaluación:  { color: "#10b981", bg: "#10b98115" },
                  Cuota:       { color: "#f59e0b", bg: "#f59e0b15" },
                  Conferencia: { color: "#8b5cf6", bg: "#8b5cf615" },
                }
                const tc = TIPO_COLOR[ev.tipo] ?? { color: "var(--brand)", bg: "var(--info-bg)" }
                return (
                  <div key={ev.id} className="event-item">
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: tc.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${tc.color}22` }}>
                      <span style={{ fontSize: ".85rem", fontWeight: 800, color: tc.color, fontFamily: "var(--f-mono)", lineHeight: 1 }}>{d}</span>
                      <span style={{ fontSize: ".55rem", color: tc.color, fontWeight: 700, letterSpacing: ".08em" }}>{mes}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: ".85rem", marginBottom: 3, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ev.titulo}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span className="subject-tag" style={{ background: tc.bg, color: tc.color, borderColor: `${tc.color}33` }}>{ev.tipo}</span>
                        <span style={{ fontSize: ".71rem", color: "var(--muted)" }}>{ev.hora} · {ev.lugar}</span>
                      </div>
                    </div>
                    <ChevronRight size={14} strokeWidth={1.75} style={{ color: "var(--muted)", flexShrink: 0 }} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Avisos */}
        <div className="card">
          <div className="card-h">
            <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".95rem" }}>
              <Megaphone size={16} strokeWidth={1.75} style={{ color: "var(--warn)" }} />
              Avisos del colegio
            </h2>
            <Link href="/dashboard/avisos" className="btn sm ghost">Ver todos</Link>
          </div>
          {avisos.length === 0 ? (
            <div className="empty" style={{ padding: "28px 16px" }}>
              <Megaphone size={28} strokeWidth={1.25} />
              <span>Sin avisos recientes</span>
            </div>
          ) : (
            <div className="event-list">
              {avisos.map(av => {
                const AVISO_COLOR: Record<string, { color: string; bg: string }> = {
                  Urgente:      { color: "var(--bad)",  bg: "var(--bad-bg)" },
                  Importante:   { color: "var(--warn)", bg: "var(--warn-bg)" },
                  Informativo:  { color: "var(--info)", bg: "var(--info-bg)" },
                  Convocatoria: { color: "var(--ok)",   bg: "var(--ok-bg)" },
                }
                const ac = AVISO_COLOR[av.tipo] ?? AVISO_COLOR.Informativo
                const isUrgent = av.tipo === "Urgente" || av.fijado
                return (
                  <div key={av.id} className="event-item">
                    <div className="event-dot" style={{ background: ac.bg, color: ac.color, border: `1px solid ${ac.color}22` }}>
                      {isUrgent ? <AlertCircle size={14} strokeWidth={1.75} /> : <Megaphone size={14} strokeWidth={1.75} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: ".85rem", lineHeight: 1.3, marginBottom: 3,
                        overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
                      } as React.CSSProperties}>
                        {av.titulo}
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span className="subject-tag" style={{ background: ac.bg, color: ac.color, borderColor: `${ac.color}30` }}>{av.tipo}</span>
                        <span style={{ fontSize: ".7rem", color: "var(--muted)" }}>{av.categoria}</span>
                      </div>
                    </div>
                    {av.fijado && <span style={{ fontSize: ".62rem", color: "var(--warn)", fontWeight: 700, flexShrink: 0 }}>FIJADO</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── ACCESOS RÁPIDOS ──────────────────────────────────────── */}
      <div className="card card-b">
        <div style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: 14 }}>
          Accesos rápidos
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10 }}>
          {[
            { href: "/dashboard/cursos",      icon: <GraduationCap size={18} strokeWidth={1.5} />, label: "Mis cursos",     sub: `${inscripciones.length} inscritos`, color: "var(--brand)", bg: "var(--info-bg)" },
            { href: "/dashboard/constancias",  icon: <Award size={18} strokeWidth={1.5} />,          label: "Constancias",    sub: `${completados.length} obtenidas`,   color: "var(--ok)",    bg: "var(--ok-bg)" },
            { href: "/dashboard/calendario",   icon: <Calendar size={18} strokeWidth={1.5} />,        label: "Calendario",     sub: `${eventos.length} próximos`,        color: "#6366f1",      bg: "#6366f115" },
            { href: "/dashboard/pagos",        icon: <CreditCard size={18} strokeWidth={1.5} />,      label: "Pagos",          sub: pagosPend.length > 0 ? `${pagosPend.length} pendiente${pagosPend.length > 1?"s":""}` : "Al corriente", color: pagosPend.length > 0 ? "var(--warn)" : "var(--ok)", bg: pagosPend.length > 0 ? "var(--warn-bg)" : "var(--ok-bg)" },
          ].map(item => (
            <Link key={item.href} href={item.href} className="quick-action">
              <div style={{ width: 38, height: 38, borderRadius: 9, background: item.bg, color: item.color, display: "grid", placeItems: "center", flexShrink: 0 }}>
                {item.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: ".84rem", color: "var(--fg)" }}>{item.label}</div>
                <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: 1 }}>{item.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}

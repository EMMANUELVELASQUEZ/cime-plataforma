import { auth }   from "@/lib/auth"
import { prisma }  from "@/lib/prisma"
import Link        from "next/link"
import AvisosCarousel from "@/components/AvisosCarousel"
import {
  Users, CheckCircle2, AlertTriangle, XCircle,
  GraduationCap, CreditCard, MessageCircle, Bell,
  Plus, UserCog, BookOpen, Calendar, Megaphone,
  FileText, ChevronRight, TrendingUp, Shield,
  UserPlus, ArrowRight, Clock, MapPin,
} from "lucide-react"

export const dynamic = "force-dynamic"

function initials(name: string) {
  return name.replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "")
    .split(/\s+/).slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase()
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n)
}

const ESTC_CFG: Record<string, { label: string; color: string; bg: string }> = {
  VIGENTE:     { label: "Vigente",     color: "#10b981", bg: "rgba(16,185,129,.12)" },
  POR_RENOVAR: { label: "Por renovar", color: "#f59e0b", bg: "rgba(245,158,11,.12)" },
  SUSPENDIDO:  { label: "Suspendido",  color: "#ef4444", bg: "rgba(239,68,68,.12)"  },
}

const EV_CFG: Record<string, { color: string; bg: string }> = {
  Asamblea:    { color: "#4F46E5", bg: "#EEF2FF" },
  Taller:      { color: "#0284C7", bg: "#E0F2FE" },
  Conferencia: { color: "#7C3AED", bg: "#F3E8FF" },
  Evaluación:  { color: "#059669", bg: "#D1FAE5" },
  Cuota:       { color: "#D97706", bg: "#FEF3C7" },
}
const evCfg = (t: string) => EV_CFG[t] ?? { color: "#1D4ED8", bg: "#DBEAFE" }

export default async function AdminDashboard() {
  const session = await auth()
  const userId  = (session?.user as any)?.id

  const [
    adminUser,
    totalColegiados, vigentesC, porRenovarC, suspendidosC,
    totalPeritos, vigentesP, porRenovarP,
    pagosPendientesData,
    mensajesSinLeer,
    totalCursos, cursosActivos,
    totalAvisos,
    eventos,
    ultimosMiembros,
    solicitudesPendientes,
    avisosCarousel,
  ] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: userId }, select: { nombre: true, correo: true } }),

    prisma.usuario.count({ where: { rol: "COLEGIADO" } }),
    prisma.usuario.count({ where: { rol: "COLEGIADO", estado: "VIGENTE" } }),
    prisma.usuario.count({ where: { rol: "COLEGIADO", estado: "POR_RENOVAR" } }),
    prisma.usuario.count({ where: { rol: "COLEGIADO", estado: "SUSPENDIDO" } }),

    prisma.usuario.count({ where: { rol: "PERITO" } }),
    prisma.usuario.count({ where: { rol: "PERITO", estado: "VIGENTE" } }),
    prisma.usuario.count({ where: { rol: "PERITO", estado: "POR_RENOVAR" } }),

    prisma.pago.aggregate({
      where: { estado: { in: ["PENDIENTE", "pendiente", "VENCIDO", "vencido"] } },
      _count: true,
      _sum: { monto: true },
    }),

    prisma.mensaje.count({ where: { deAdmin: false, leido: false } }),

    prisma.curso.count(),
    prisma.curso.count({ where: { estado: { in: ["ABIERTO", "EN_CURSO"] } } }),

    prisma.aviso.count(),

    prisma.evento.findMany({
      where: { fecha: { gte: new Date() } },
      orderBy: { fecha: "asc" },
      take: 4,
    }),

    prisma.usuario.findMany({
      where: { rol: { in: ["COLEGIADO", "PERITO"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, nombre: true, rol: true, especialidad: true, estado: true, numeroColegiado: true, numeroPerito: true, alta: true, createdAt: true },
    }),

    prisma.solicitudPlan.count({ where: { estado: "PENDIENTE" } }),

    prisma.aviso.findMany({
      orderBy: [{ fijado: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
  ])

  const nombre   = adminUser?.nombre ?? session?.user?.name ?? "Administración"
  const hour     = new Date().getHours()
  const saludo   = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches"
  const hoy      = new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  const pagosPendCount = pagosPendientesData._count
  const pagosPendMonto = pagosPendientesData._sum.monto ?? 0

  const pct = (a: number, b: number) => b > 0 ? Math.round(a / b * 100) : 0

  return (
    <>
      {/* ══ BANNER ══════════════════════════════════════════════════ */}
      <div style={{
        position: "relative", borderRadius: 16, overflow: "hidden",
        background: "linear-gradient(120deg, #0D2060 0%, #1549B8 55%, #0d3080 100%)",
        display: "flex", boxShadow: "0 4px 32px rgba(0,0,0,.22)",
      }}>
        {/* Gold left bar */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 5, zIndex: 2,
          background: "linear-gradient(180deg, #DBAB3A 0%, #F0D060 50%, #DBAB3A 100%)",
        }} />
        {/* Grid texture */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
        {/* Decorative circle */}
        <div style={{
          position: "absolute", right: -60, top: -60, width: 280, height: 280,
          borderRadius: "50%", border: "1px solid rgba(255,255,255,.06)", zIndex: 0,
        }} />

        {/* Identity */}
        <div style={{
          position: "relative", zIndex: 1, flex: 1, minWidth: 0,
          display: "flex", alignItems: "center", gap: 20,
          padding: "28px 24px 28px 36px",
        }}>
          {/* Avatar */}
          <div style={{
            width: 76, height: 76, flexShrink: 0, borderRadius: "50%",
            border: "3px solid #E8C060",
            boxShadow: "0 0 0 4px rgba(232,192,96,.18), 0 6px 20px rgba(0,0,0,.35)",
            background: "linear-gradient(135deg, #1549B8 0%, #0D2060 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-montserrat), Montserrat, system-ui",
            fontSize: "1.6rem", fontWeight: 800, color: "#E8C060",
          }}>
            {initials(nombre)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badges */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 9 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontFamily: "var(--f-data)", fontSize: ".6rem", fontWeight: 800,
                letterSpacing: ".1em", textTransform: "uppercase",
                padding: "3px 10px", borderRadius: 99,
                background: "rgba(232,192,96,.18)", color: "#E8C060",
                border: "1px solid rgba(232,192,96,.35)",
              }}>
                <Shield size={9} strokeWidth={2.5} /> ADMINISTRACIÓN
              </span>
              <span style={{
                fontFamily: "var(--f-data)", fontSize: ".6rem", fontWeight: 600,
                color: "rgba(255,255,255,.45)", letterSpacing: ".05em",
              }}>
                CIME Veracruz
              </span>
              {solicitudesPendientes > 0 && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontFamily: "var(--f-data)", fontSize: ".6rem", fontWeight: 800,
                  letterSpacing: ".07em", textTransform: "uppercase",
                  padding: "3px 10px", borderRadius: 99,
                  background: "rgba(245,158,11,.22)", color: "#FBBF24",
                  border: "1px solid rgba(245,158,11,.4)",
                }}>
                  <AlertTriangle size={9} strokeWidth={2.5} /> {solicitudesPendientes} pendiente{solicitudesPendientes !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <h1 style={{
              fontSize: "clamp(1.1rem,2.2vw,1.6rem)", fontWeight: 700,
              color: "#FFFFFF", lineHeight: 1.2, letterSpacing: "-.01em", margin: "0 0 8px",
              fontFamily: "var(--font-montserrat), Montserrat, system-ui",
            }}>
              {saludo},{" "}
              <span style={{ color: "#E8C060" }}>
                {nombre.split(" ").slice(0, 2).join(" ")}
              </span>
            </h1>

            <p style={{
              fontFamily: "var(--f-data)", fontSize: ".72rem",
              color: "rgba(255,255,255,.45)", margin: 0,
              textTransform: "capitalize",
            }}>
              {hoy}
            </p>
          </div>
        </div>

        {/* Right stats */}
        <div style={{
          position: "relative", zIndex: 1, flexShrink: 0,
          display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center",
          gap: 14, padding: "20px 32px 20px 24px",
          borderLeft: "1px solid rgba(255,255,255,.1)", minWidth: 200,
        }}>
          <div style={{ userSelect: "none", textAlign: "right" }}>
            <div style={{
              fontFamily: "var(--font-montserrat), Montserrat, system-ui",
              fontWeight: 900, fontSize: "clamp(1.8rem,3.5vw,2.8rem)",
              letterSpacing: ".2em", lineHeight: 1, color: "#E8C060",
              textShadow: "0 2px 16px rgba(232,192,96,.3)",
            }}>CIME</div>
            <div style={{ fontFamily: "var(--f-data)", fontSize: ".48rem", letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(232,192,96,.5)", marginTop: 3 }}>
              Veracruz · México
            </div>
          </div>
          <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,.1)" }} />
          {/* Padrón health */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--f-data)", fontSize: ".58rem", color: "rgba(255,255,255,.4)", marginBottom: 4, letterSpacing: ".05em", textTransform: "uppercase" }}>
              Padrón activo
            </div>
            <div style={{
              fontFamily: "var(--font-montserrat), Montserrat",
              fontSize: "2rem", fontWeight: 800, color: "#E8C060", lineHeight: 1,
            }}>
              {totalColegiados + totalPeritos}
              <span style={{ fontSize: ".9rem", fontWeight: 500, color: "rgba(232,192,96,.5)", marginLeft: 3 }}>miembros</span>
            </div>
            <div style={{ fontFamily: "var(--f-data)", fontSize: ".62rem", color: "rgba(255,255,255,.35)", marginTop: 4 }}>
              {totalColegiados} colegiados · {totalPeritos} peritos
            </div>
          </div>
        </div>
      </div>

      {/* ══ CAROUSEL ══════════════════════════════════════════════ */}
      <AvisosCarousel
        avisos={avisosCarousel.map(a => ({ ...a, createdAt: a.createdAt.toISOString() }))}
        titulo="Comunicados del Colegio"
      />

      {/* ══ KPI STRIP ═════════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          {
            label: "Colegiados", val: totalColegiados, unit: "",
            sub: `${vigentesC} vigentes · ${pct(vigentesC, totalColegiados)}%`,
            icon: <Users size={20} strokeWidth={1.75} />,
            cardBg: "linear-gradient(145deg,#EFF6FF,#DBEAFE)",
            iconBg: "#BFDBFE", iconColor: "#1D4ED8",
            accent: "#1D4ED8", valColor: "#1E3A8A",
          },
          {
            label: "Peritos registrados", val: totalPeritos, unit: "",
            sub: `${vigentesP} vigentes`,
            icon: <Shield size={20} strokeWidth={1.75} />,
            cardBg: "linear-gradient(145deg,#ECFDF5,#D1FAE5)",
            iconBg: "#A7F3D0", iconColor: "#059669",
            accent: "#059669", valColor: "#064E3B",
          },
          {
            label: pagosPendCount > 0 ? "Pagos pendientes" : "Cobranza",
            val: pagosPendCount, unit: "",
            sub: pagosPendCount > 0 ? fmtMoney(pagosPendMonto) : "Sin adeudos",
            icon: <CreditCard size={20} strokeWidth={1.75} />,
            cardBg: pagosPendCount > 0 ? "linear-gradient(145deg,#FFFBEB,#FEF3C7)" : "linear-gradient(145deg,#ECFDF5,#D1FAE5)",
            iconBg:   pagosPendCount > 0 ? "#FDE68A" : "#A7F3D0",
            iconColor:pagosPendCount > 0 ? "#B45309" : "#059669",
            accent:   pagosPendCount > 0 ? "#B45309" : "#059669",
            valColor: pagosPendCount > 0 ? "#78350F" : "#064E3B",
          },
          {
            label: mensajesSinLeer > 0 ? "Mensajes nuevos" : "Mensajes",
            val: mensajesSinLeer > 0 ? mensajesSinLeer : "✓", unit: "",
            sub: mensajesSinLeer > 0 ? "Sin responder" : "Al día",
            icon: <MessageCircle size={20} strokeWidth={1.75} />,
            cardBg: mensajesSinLeer > 0 ? "linear-gradient(145deg,#FFF1F2,#FFE4E6)" : "linear-gradient(145deg,#EFF6FF,#DBEAFE)",
            iconBg:   mensajesSinLeer > 0 ? "#FECDD3" : "#BFDBFE",
            iconColor:mensajesSinLeer > 0 ? "#BE123C" : "#1D4ED8",
            accent:   mensajesSinLeer > 0 ? "#BE123C" : "#1D4ED8",
            valColor: mensajesSinLeer > 0 ? "#881337" : "#1E3A8A",
          },
          {
            label: "Cursos activos", val: cursosActivos, unit: "",
            sub: `${totalCursos} en catálogo`,
            icon: <GraduationCap size={20} strokeWidth={1.75} />,
            cardBg: "linear-gradient(145deg,#F5F3FF,#EDE9FE)",
            iconBg: "#DDD6FE", iconColor: "#6D28D9",
            accent: "#6D28D9", valColor: "#3B0764",
          },
          {
            label: "Avisos publicados", val: totalAvisos, unit: "",
            sub: "Comunicados activos",
            icon: <Bell size={20} strokeWidth={1.75} />,
            cardBg: "linear-gradient(145deg,#FFFBEB,#FEF3C7)",
            iconBg: "#FDE68A", iconColor: "#B45309",
            accent: "#B45309", valColor: "#78350F",
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
                fontFamily: "var(--f-data)", fontSize: ".6rem", fontWeight: 700,
                color: kpi.accent, letterSpacing: ".06em", textTransform: "uppercase", lineHeight: 1.3,
              }}>{kpi.label}</span>
              <div style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                display: "grid", placeItems: "center",
                background: kpi.iconBg, color: kpi.iconColor,
              }}>{kpi.icon}</div>
            </div>
            <div>
              <div style={{
                fontFamily: "var(--font-montserrat), Montserrat",
                fontSize: "2rem", fontWeight: 800,
                color: kpi.valColor, lineHeight: 1, letterSpacing: "-.05em",
              }}>
                {kpi.val}
                {kpi.unit && <span style={{ fontSize: "1rem", fontWeight: 600, color: kpi.accent, marginLeft: 2 }}>{kpi.unit}</span>}
              </div>
              <div style={{ fontFamily: "var(--f-data)", fontSize: ".67rem", color: kpi.accent, marginTop: 5, opacity: .75 }}>
                {kpi.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ MAIN GRID ═════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12" style={{ gap: 24, alignItems: "start" }}>

        {/* ── COLUMNA IZQUIERDA 8/12 ─────────────────────────── */}
        <div className="lg:col-span-8" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Últimos miembros registrados */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderBottom: "1px solid var(--line)",
            }}>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <UserPlus size={16} strokeWidth={2} style={{ color: "#1D4ED8" }} />
                Últimas altas al padrón
              </h2>
              <div style={{ display: "flex", gap: 8 }}>
                <Link href="/admin/colegiados" style={{ fontSize: ".75rem", fontWeight: 600, color: "var(--brand)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  Colegiados <ChevronRight size={12} strokeWidth={2.5} />
                </Link>
                <Link href="/admin/peritos" style={{ fontSize: ".75rem", fontWeight: 600, color: "#059669", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  Peritos <ChevronRight size={12} strokeWidth={2.5} />
                </Link>
              </div>
            </div>
            <div>
              {ultimosMiembros.map((m, idx) => {
                const esColegiado = m.rol === "COLEGIADO"
                const est = ESTC_CFG[m.estado] ?? ESTC_CFG.VIGENTE
                const hue = (m.nombre.charCodeAt(0) * 47) % 360
                const profileHref = esColegiado ? `/admin/colegiados/${m.id}` : `/admin/peritos/${m.id}`
                const num = esColegiado
                  ? (m.numeroColegiado ? `CIME-VER-${m.numeroColegiado}` : "—")
                  : (m.numeroPerito   ? `CIME-PER-${m.numeroPerito}`   : "—")
                return (
                  <div key={m.id} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "12px 20px",
                    borderBottom: idx < ultimosMiembros.length - 1 ? "1px solid var(--line)" : undefined,
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                      background: `hsl(${hue} 38% 34%)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 700, fontSize: ".9rem",
                      border: "2px solid var(--line)",
                    }}>
                      {initials(m.nombre)}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: ".87rem", color: "var(--fg)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.nombre}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{
                          fontFamily: "var(--f-data)", fontSize: ".58rem", fontWeight: 700,
                          letterSpacing: ".08em", textTransform: "uppercase",
                          padding: "1px 6px", borderRadius: 3,
                          background: esColegiado ? "rgba(29,78,216,.1)" : "rgba(5,150,105,.1)",
                          color: esColegiado ? "#1D4ED8" : "#059669",
                        }}>
                          {esColegiado ? "Colegiado" : "Perito"}
                        </span>
                        <span style={{ fontFamily: "var(--f-mono)", fontSize: ".7rem", color: "var(--muted-2)" }}>{num}</span>
                        {m.especialidad && (
                          <span style={{ fontFamily: "var(--f-data)", fontSize: ".67rem", color: "var(--muted)" }}>{m.especialidad}</span>
                        )}
                      </div>
                    </div>
                    {/* Estado */}
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      fontFamily: "var(--f-data)", fontSize: ".62rem", fontWeight: 700,
                      letterSpacing: ".05em", textTransform: "uppercase",
                      padding: "3px 10px", borderRadius: 99,
                      background: est.bg, color: est.color, flexShrink: 0,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: est.color, flexShrink: 0 }} />
                      {est.label}
                    </span>
                    {/* Link */}
                    <Link href={profileHref} style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: "var(--surface-raised)", border: "1px solid var(--line)",
                      color: "var(--muted)", textDecoration: "none",
                    }}>
                      <ChevronRight size={14} strokeWidth={2.5} />
                    </Link>
                  </div>
                )
              })}
              {ultimosMiembros.length === 0 && (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
                  Sin miembros registrados aún
                </div>
              )}
            </div>
          </div>

          {/* Estado del padrón — barras dobles */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <TrendingUp size={16} strokeWidth={2} style={{ color: "#059669" }} />
                Salud del padrón
              </h2>
            </div>
            <div style={{ padding: "20px 24px", display: "grid", gap: 20 }}>

              {/* Colegiados */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontFamily: "var(--f-data)", fontSize: ".7rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#1D4ED8" }}>
                    Colegiados · {totalColegiados}
                  </span>
                  <span style={{ fontFamily: "var(--f-data)", fontSize: ".7rem", color: "var(--muted)" }}>{pct(vigentesC, totalColegiados)}% vigentes</span>
                </div>
                {[
                  { label: "Vigente",     count: vigentesC,    total: totalColegiados, color: "#10b981" },
                  { label: "Por renovar", count: porRenovarC,  total: totalColegiados, color: "#f59e0b" },
                  { label: "Suspendido",  count: suspendidosC, total: totalColegiados, color: "#ef4444" },
                ].map(row => (
                  <div key={row.label} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".78rem", marginBottom: 4 }}>
                      <span style={{ color: "var(--fg-2)" }}>{row.label}</span>
                      <strong style={{ fontFamily: "var(--f-mono)", color: row.color }}>{row.count}</strong>
                    </div>
                    <div style={{ height: 7, borderRadius: 99, background: "var(--surface-raised)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct(row.count, row.total)}%`, background: row.color, borderRadius: 99 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ height: 1, background: "var(--line)" }} />

              {/* Peritos */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontFamily: "var(--f-data)", fontSize: ".7rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#059669" }}>
                    Peritos · {totalPeritos}
                  </span>
                  <span style={{ fontFamily: "var(--f-data)", fontSize: ".7rem", color: "var(--muted)" }}>{pct(vigentesP, totalPeritos)}% vigentes</span>
                </div>
                {[
                  { label: "Vigente",     count: vigentesP,                           total: totalPeritos, color: "#10b981" },
                  { label: "Por renovar", count: porRenovarP,                          total: totalPeritos, color: "#f59e0b" },
                  { label: "Suspendido",  count: totalPeritos - vigentesP - porRenovarP, total: totalPeritos, color: "#ef4444" },
                ].map(row => (
                  <div key={row.label} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".78rem", marginBottom: 4 }}>
                      <span style={{ color: "var(--fg-2)" }}>{row.label}</span>
                      <strong style={{ fontFamily: "var(--f-mono)", color: row.color }}>{row.count}</strong>
                    </div>
                    <div style={{ height: 7, borderRadius: 99, background: "var(--surface-raised)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct(row.count, row.total)}%`, background: row.color, borderRadius: 99 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── SIDEBAR DERECHO 4/12 ───────────────────────────── */}
        <div className="lg:col-span-4" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Acciones rápidas */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
              <h3 style={{ margin: 0, fontSize: ".9rem", fontWeight: 700 }}>Acciones rápidas</h3>
            </div>
            <div style={{ padding: "12px 14px", display: "grid", gap: 7 }}>
              {[
                { href: "/admin/colegiados/nuevo", icon: <UserPlus   size={15} strokeWidth={2}    />, label: "Alta de colegiado",  color: "#1D4ED8", bg: "#DBEAFE" },
                { href: "/admin/peritos/nuevo",    icon: <UserPlus   size={15} strokeWidth={2}    />, label: "Alta de perito",     color: "#059669", bg: "#D1FAE5" },
                { href: "/admin/colegiados",       icon: <UserCog    size={15} strokeWidth={1.75} />, label: "Gestionar padrón",   color: "#7C3AED", bg: "#EDE9FE" },
                { href: "/admin/peritos",          icon: <Shield     size={15} strokeWidth={1.75} />, label: "Gestionar peritos",  color: "#0284C7", bg: "#E0F2FE" },
                { href: "/admin/cursos",           icon: <BookOpen   size={15} strokeWidth={1.75} />, label: "Gestionar cursos",   color: "#6D28D9", bg: "#F5F3FF" },
                { href: "/admin/avisos",           icon: <Megaphone  size={15} strokeWidth={1.75} />, label: "Publicar aviso",     color: "#D97706", bg: "#FEF3C7" },
                { href: "/admin/mensajes",         icon: <MessageCircle size={15} strokeWidth={1.75} />, label: mensajesSinLeer > 0 ? `Mensajes (${mensajesSinLeer})` : "Mensajes", color: mensajesSinLeer > 0 ? "#BE123C" : "#1D4ED8", bg: mensajesSinLeer > 0 ? "#FFE4E6" : "#DBEAFE" },
                { href: "/admin/comunicados",      icon: <FileText   size={15} strokeWidth={1.75} />, label: "Enviar comunicado",  color: "#0F766E", bg: "#CCFBF1" },
                { href: "/admin/expedientes",      icon: <FileText   size={15} strokeWidth={1.75} />, label: "Expedientes",        color: "#854D0E", bg: "#FEF3C7" },
                { href: "/admin/eventos",          icon: <Calendar   size={15} strokeWidth={1.75} />, label: "Gestionar eventos",  color: "#1D4ED8", bg: "#DBEAFE" },
              ].map(a => (
                <Link key={a.href} href={a.href} style={{
                  display: "flex", alignItems: "center", gap: 11,
                  padding: "10px 12px", borderRadius: 8, textDecoration: "none",
                  background: "var(--surface-raised)", border: "1px solid var(--line)",
                  transition: "background .15s",
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, display: "grid", placeItems: "center", background: a.bg, color: a.color }}>
                    {a.icon}
                  </div>
                  <span style={{ fontSize: ".83rem", fontWeight: 600, color: "var(--fg)", flex: 1 }}>{a.label}</span>
                  <ChevronRight size={13} strokeWidth={2.5} style={{ color: "var(--muted-2)", flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </div>

          {/* Próximos eventos */}
          {eventos.length > 0 && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
                <h3 style={{ margin: 0, fontSize: ".9rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 7 }}>
                  <Calendar size={14} strokeWidth={2} style={{ color: "var(--brand)" }} />
                  Próximos eventos
                </h3>
                <Link href="/admin/eventos" style={{ fontSize: ".72rem", fontWeight: 600, color: "var(--brand)", textDecoration: "none" }}>
                  Gestionar
                </Link>
              </div>
              <div>
                {eventos.map((ev, idx) => {
                  const fecha = new Date(ev.fecha)
                  const d   = fecha.getDate()
                  const mes = fecha.toLocaleDateString("es-MX", { month: "short" }).replace(".", "").toUpperCase()
                  const cfg = evCfg(ev.tipo)
                  return (
                    <div key={ev.id} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "11px 18px",
                      borderBottom: idx < eventos.length - 1 ? "1px solid var(--line)" : undefined,
                    }}>
                      <div style={{
                        width: 42, height: 44, borderRadius: 8, flexShrink: 0,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        background: cfg.bg,
                      }}>
                        <span style={{ fontWeight: 800, fontSize: ".95rem", lineHeight: 1, color: cfg.color }}>{d}</span>
                        <span style={{ fontWeight: 700, fontSize: ".5rem", letterSpacing: ".1em", color: cfg.color }}>{mes}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: ".84rem", color: "var(--fg)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ev.titulo}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ fontFamily: "var(--f-data)", fontSize: ".58rem", fontWeight: 700, padding: "1px 6px", borderRadius: 3, background: cfg.bg, color: cfg.color, letterSpacing: ".07em", textTransform: "uppercase" }}>
                            {ev.tipo}
                          </span>
                          {ev.hora && (
                            <span style={{ display: "flex", alignItems: "center", gap: 3, fontFamily: "var(--f-data)", fontSize: ".65rem", color: "var(--muted)" }}>
                              <Clock size={9} strokeWidth={2} /> {ev.hora}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <Link href="/admin/eventos" style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  padding: "10px 16px", fontSize: ".75rem", fontWeight: 600,
                  color: "var(--brand)", textDecoration: "none", borderTop: "1px solid var(--line)",
                  background: "var(--surface-raised)",
                }}>
                  Ver todos los eventos <ChevronRight size={12} strokeWidth={2.5} />
                </Link>
              </div>
            </div>
          )}

          {/* Alerta solicitudes pendientes */}
          {solicitudesPendientes > 0 && (
            <Link href="/admin/planes" style={{
              display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
              textDecoration: "none", borderRadius: 12,
              background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
              border: "1px solid #FDE68A",
              boxShadow: "var(--shadow-sm)",
            }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, display: "grid", placeItems: "center", background: "#FDE68A", color: "#B45309" }}>
                <AlertTriangle size={20} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: ".87rem", color: "#78350F", marginBottom: 2 }}>
                  {solicitudesPendientes} solicitud{solicitudesPendientes !== 1 ? "es" : ""} pendiente{solicitudesPendientes !== 1 ? "s" : ""}
                </div>
                <div style={{ fontFamily: "var(--f-data)", fontSize: ".7rem", color: "#B45309" }}>
                  Planes de pago por revisar
                </div>
              </div>
              <ArrowRight size={16} strokeWidth={2.5} style={{ color: "#B45309", flexShrink: 0 }} />
            </Link>
          )}
        </div>
      </div>
    </>
  )
}

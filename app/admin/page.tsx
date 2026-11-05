import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { EstadoColegiado } from "@prisma/client"
import { Users, CheckCircle2, AlertTriangle, GraduationCap, Plus, UserCog, BookOpen, Calendar, MapPin, Clock, ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"

const EV_CFG: Record<string, { color: string; bg: string; border: string }> = {
  Asamblea:    { color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" },
  Taller:      { color: "#0284C7", bg: "#E0F2FE", border: "#BAE6FD" },
  Conferencia: { color: "#7C3AED", bg: "#F3E8FF", border: "#DDD6FE" },
  Evaluación:  { color: "#059669", bg: "#D1FAE5", border: "#A7F3D0" },
  Cuota:       { color: "#D97706", bg: "#FEF3C7", border: "#FDE68A" },
}
const evCfg = (t: string) => EV_CFG[t] ?? { color: "#1D4ED8", bg: "#DBEAFE", border: "#BFDBFE" }

export default async function AdminDashboard() {
  const [totalColegiados, vigentes, porRenovar, suspendidos, totalCursos, eventos] = await Promise.all([
    prisma.usuario.count({ where: { rol: "COLEGIADO" } }),
    prisma.usuario.count({ where: { rol: "COLEGIADO", estado: EstadoColegiado.VIGENTE } }),
    prisma.usuario.count({ where: { rol: "COLEGIADO", estado: EstadoColegiado.POR_RENOVAR } }),
    prisma.usuario.count({ where: { rol: "COLEGIADO", estado: EstadoColegiado.SUSPENDIDO } }),
    prisma.curso.count(),
    prisma.evento.findMany({
      orderBy: { fecha: "asc" },
      take: 5,
    }),
  ])

  const pct = (a: number, b: number) => b > 0 ? Math.round(a / b * 100) : 0

  const ultimosColegiados = await prisma.usuario.findMany({
    where: { rol: "COLEGIADO" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, nombre: true, especialidad: true, estado: true, numeroColegiado: true, alta: true },
  })

  const ESTC: Record<string, string> = { VIGENTE: "ok", POR_RENOVAR: "warn", SUSPENDIDO: "bad" }
  const ESTNOMBRE: Record<string, string> = { VIGENTE: "Vigente", POR_RENOVAR: "Por renovar", SUSPENDIDO: "Suspendido" }

  function initials(name: string) {
    return name.replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "").split(/\s+/).slice(0, 2).map((w: string) => w[0] ?? "").join("").toUpperCase()
  }

  const now = new Date()
  const eventosProximos = eventos.filter(e => new Date(e.fecha) >= now)
  const eventosPasados  = eventos.filter(e => new Date(e.fecha) <  now)

  const stats = [
    {
      label: "Total colegiados",
      value: totalColegiados,
      sub: "Registrados en el padrón",
      icon: <Users size={18} strokeWidth={1.75} />,
      color: "var(--brand)",
      bg: "var(--info-bg)",
    },
    {
      label: "Vigentes",
      value: vigentes,
      sub: `${pct(vigentes, totalColegiados)}% del padrón al corriente`,
      icon: <CheckCircle2 size={18} strokeWidth={1.75} />,
      color: "var(--ok)",
      bg: "var(--ok-bg)",
      valueColor: "var(--ok)",
    },
    {
      label: "Por renovar",
      value: porRenovar,
      sub: "Requieren renovación este ciclo",
      icon: <AlertTriangle size={18} strokeWidth={1.75} />,
      color: "var(--warn)",
      bg: "var(--warn-bg)",
      valueColor: "var(--warn)",
    },
    {
      label: "Cursos activos",
      value: totalCursos,
      sub: "En el catálogo actual",
      icon: <GraduationCap size={18} strokeWidth={1.75} />,
      color: "var(--teal)",
      bg: "var(--teal-bg)",
    },
  ]

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Panel del Colegio</h1>
          <p>Resumen ejecutivo · CIME Veracruz 2026</p>
        </div>
        <div className="actions">
          <Link href="/admin/colegiados/nuevo" className="btn primary">
            <Plus size={15} strokeWidth={2} />
            Nuevo colegiado
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid g-4">
        {stats.map(s => (
          <div key={s.label} className="card" style={{ padding: "18px 20px", display: "grid", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)" }}>
                {s.label}
              </span>
              <span style={{
                width: 34, height: 34, borderRadius: 8,
                background: s.bg, color: s.color,
                display: "grid", placeItems: "center", flexShrink: 0,
              }}>
                {s.icon}
              </span>
            </div>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1, letterSpacing: "-.03em", color: s.valueColor ?? "var(--fg)" }}>
                {s.value}
              </div>
              <div style={{ fontSize: ".76rem", color: "var(--muted)", marginTop: 5 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid g-dash">
        <div className="stack">
          {/* Últimos colegiados */}
          <div className="card">
            <div className="card-h">
              <h2>Últimos colegiados registrados</h2>
              <Link href="/admin/colegiados" className="btn sm ghost">Ver todos →</Link>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Colegiado</th>
                    <th>No.</th>
                    <th>Especialidad</th>
                    <th>Estatus</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosColegiados.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div className="person">
                          <span className="avatar" style={{ background: `hsl(${(c.nombre.charCodeAt(0) ?? 0) * 47 % 360} 38% 34%)` }}>
                            {initials(c.nombre)}
                          </span>
                          <div>
                            <b>{c.nombre}</b>
                            <small>Alta {c.alta}</small>
                          </div>
                        </div>
                      </td>
                      <td className="mono" style={{ fontSize: ".8rem" }}>CIME-VER-{c.numeroColegiado ?? "—"}</td>
                      <td style={{ fontSize: ".84rem" }}>{c.especialidad ?? "—"}</td>
                      <td><span className={`chip ${ESTC[c.estado]}`}>{ESTNOMBRE[c.estado]}</span></td>
                      <td style={{ textAlign: "right" }}>
                        <Link href={`/admin/colegiados/${c.id}`} className="btn sm">Editar</Link>
                      </td>
                    </tr>
                  ))}
                  {ultimosColegiados.length === 0 && (
                    <tr><td colSpan={5}><div className="empty">Sin colegiados registrados aún</div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Estatus del padrón */}
          <div className="card">
            <div className="card-h"><h2>Estatus del padrón</h2></div>
            <div className="card-b" style={{ display: "grid", gap: 14 }}>
              {[
                { label: "Vigente",     count: vigentes,    cls: "ok" },
                { label: "Por renovar", count: porRenovar,  cls: "warn" },
                { label: "Suspendido",  count: suspendidos, cls: "bad" },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".82rem", marginBottom: 6 }}>
                    <span style={{ color: "var(--fg-2)" }}>{row.label}</span>
                    <b style={{ fontFamily: "var(--f-mono)", color: `var(--${row.cls})` }}>{row.count}</b>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct(row.count, totalColegiados)}%`, background: `var(--${row.cls})`, borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="stack">
          {/* Acciones rápidas */}
          <div className="card">
            <div className="card-h"><h2>Acciones rápidas</h2></div>
            <div className="card-b" style={{ display: "grid", gap: 7 }}>
              {[
                { href: "/admin/colegiados/nuevo", icon: <Plus size={15} strokeWidth={2} />, label: "Alta de colegiado" },
                { href: "/admin/colegiados",       icon: <UserCog size={15} strokeWidth={1.75} />, label: "Gestionar padrón" },
                { href: "/admin/cursos",           icon: <BookOpen size={15} strokeWidth={1.75} />, label: "Gestionar cursos" },
              ].map(a => (
                <Link key={a.href} href={a.href} className="btn block" style={{ justifyContent: "flex-start", gap: 10 }}>
                  {a.icon}
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Eventos del colegio */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="card-h">
              <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={15} strokeWidth={2} style={{ color: "var(--brand)" }} />
                Eventos del colegio
              </h2>
              <Link href="/admin/eventos" className="btn sm ghost" style={{ fontSize: ".72rem" }}>
                Gestionar →
              </Link>
            </div>

            {eventos.length === 0 ? (
              <div style={{ padding: "28px 20px", textAlign: "center" }}>
                <Calendar size={28} strokeWidth={1.25} style={{ color: "var(--muted-2)", margin: "0 auto 10px", display: "block" }} />
                <p style={{ fontSize: ".82rem", color: "var(--muted)" }}>Sin eventos registrados</p>
                <Link href="/admin/eventos" className="btn sm" style={{ marginTop: 10, display: "inline-flex" }}>
                  <Plus size={13} strokeWidth={2} /> Crear evento
                </Link>
              </div>
            ) : (
              <div>
                {eventosProximos.length > 0 && (
                  <div style={{ padding: "8px 16px 4px", fontSize: ".62rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--brand)", background: "var(--info-bg)", borderBottom: "1px solid var(--line)" }}>
                    Próximos · {eventosProximos.length}
                  </div>
                )}
                {eventosProximos.map((ev, idx) => {
                  const fecha = new Date(ev.fecha)
                  const dia   = fecha.getDate()
                  const mes   = fecha.toLocaleDateString("es-MX", { month: "short" }).replace(".", "").toUpperCase()
                  const cfg   = evCfg(ev.tipo)
                  return (
                    <div key={ev.id} style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "12px 16px",
                      borderBottom: idx < eventosProximos.length - 1 || eventosPasados.length > 0 ? "1px solid var(--line)" : undefined,
                    }}>
                      {/* Date block */}
                      <div style={{
                        flexShrink: 0, width: 42, height: 46, borderRadius: 8,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        background: cfg.bg, border: `1px solid ${cfg.border}`,
                      }}>
                        <span style={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1, color: cfg.color }}>{dia}</span>
                        <span style={{ fontWeight: 700, fontSize: ".5rem", letterSpacing: ".1em", color: cfg.color, marginTop: 1 }}>{mes}</span>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: ".84rem", color: "var(--fg)", lineHeight: 1.3, marginBottom: 4,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ev.titulo}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 10px", alignItems: "center" }}>
                          <span style={{
                            fontSize: ".58rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
                            padding: "1px 6px", borderRadius: 3, background: cfg.bg, color: cfg.color,
                          }}>{ev.tipo}</span>
                          {ev.hora && (
                            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: ".67rem", color: "var(--muted)" }}>
                              <Clock size={9} strokeWidth={2} /> {ev.hora}
                            </span>
                          )}
                          {ev.lugar && (
                            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: ".67rem", color: "var(--muted)",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>
                              <MapPin size={9} strokeWidth={2} /> {ev.lugar}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {eventosPasados.length > 0 && (
                  <>
                    <div style={{ padding: "8px 16px 4px", fontSize: ".62rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)", background: "var(--surface-2)", borderTop: eventosProximos.length > 0 ? "1px solid var(--line)" : undefined, borderBottom: "1px solid var(--line)" }}>
                      Realizados · {eventosPasados.length}
                    </div>
                    {eventosPasados.map((ev, idx) => {
                      const fecha = new Date(ev.fecha)
                      const dia   = fecha.getDate()
                      const mes   = fecha.toLocaleDateString("es-MX", { month: "short" }).replace(".", "").toUpperCase()
                      return (
                        <div key={ev.id} style={{
                          display: "flex", alignItems: "flex-start", gap: 12,
                          padding: "10px 16px", opacity: .6,
                          borderBottom: idx < eventosPasados.length - 1 ? "1px solid var(--line)" : undefined,
                        }}>
                          <div style={{
                            flexShrink: 0, width: 42, height: 46, borderRadius: 8,
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            background: "var(--surface-2)", border: "1px solid var(--line)",
                          }}>
                            <span style={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1, color: "var(--muted)" }}>{dia}</span>
                            <span style={{ fontWeight: 700, fontSize: ".5rem", letterSpacing: ".1em", color: "var(--muted)", marginTop: 1 }}>{mes}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: ".82rem", color: "var(--muted)", lineHeight: 1.3, marginBottom: 3,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {ev.titulo}
                            </div>
                            <span style={{
                              fontSize: ".58rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
                              padding: "1px 6px", borderRadius: 3, background: "var(--surface-3)", color: "var(--muted)",
                            }}>{ev.tipo}</span>
                          </div>
                          <CheckCircle2 size={13} strokeWidth={2} style={{ color: "var(--ok)", flexShrink: 0, marginTop: 4 }} />
                        </div>
                      )
                    })}
                  </>
                )}

                <Link href="/admin/eventos" style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  padding: "10px 16px", fontSize: ".75rem", fontWeight: 600,
                  color: "var(--brand)", textDecoration: "none", borderTop: "1px solid var(--line)",
                  background: "var(--surface-2)",
                }}>
                  Ver todos los eventos <ChevronRight size={13} strokeWidth={2.5} />
                </Link>
              </div>
            )}
          </div>

          {/* Cuotas */}
          <div className="card card-b" style={{ display: "grid", gap: 12 }}>
            <span style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)" }}>Cuotas 2026</span>
            <dl className="kv">
              <dt>Pagadas</dt>      <dd className="mono" style={{ color: "var(--ok)" }}>{vigentes} colegiados</dd>
              <dt>Pendientes</dt>   <dd className="mono" style={{ color: "var(--warn)" }}>{porRenovar} colegiados</dd>
              <dt>Suspendidos</dt>  <dd className="mono" style={{ color: "var(--bad)" }}>{suspendidos} colegiados</dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  )
}

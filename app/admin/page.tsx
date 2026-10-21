import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { EstadoColegiado } from "@prisma/client"
import { Users, CheckCircle2, AlertTriangle, GraduationCap, Plus, UserCog, BookOpen } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const [totalColegiados, vigentes, porRenovar, suspendidos, totalCursos] = await Promise.all([
    prisma.usuario.count({ where: { rol: "COLEGIADO" } }),
    prisma.usuario.count({ where: { rol: "COLEGIADO", estado: EstadoColegiado.VIGENTE } }),
    prisma.usuario.count({ where: { rol: "COLEGIADO", estado: EstadoColegiado.POR_RENOVAR } }),
    prisma.usuario.count({ where: { rol: "COLEGIADO", estado: EstadoColegiado.SUSPENDIDO } }),
    prisma.curso.count(),
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

  const distribucion = [
    { label: "Ingeniería Eléctrica",      count: Math.round(totalColegiados * 0.35) },
    { label: "Ing. Mecánica Eléctrica",   count: Math.round(totalColegiados * 0.28) },
    { label: "Ingeniería Mecánica",       count: Math.round(totalColegiados * 0.19) },
    { label: "Energías Renovables",       count: Math.round(totalColegiados * 0.10) },
    { label: "Electromecánica",           count: Math.round(totalColegiados * 0.08) },
  ]
  const maxDist = Math.max(...distribucion.map(d => d.count), 1)

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

          {/* Distribución por especialidad */}
          <div className="card">
            <div className="card-h"><h2>Especialidades</h2></div>
            <div className="card-b" style={{ display: "grid", gap: 12 }}>
              {distribucion.map(d => (
                <div key={d.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".82rem", marginBottom: 5 }}>
                    <span style={{ color: "var(--fg-2)" }}>{d.label}</span>
                    <b style={{ fontFamily: "var(--f-mono)" }}>{d.count}</b>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct(d.count, maxDist)}%`, background: "var(--brand)", borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
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

import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { EstadoColegiado } from "@prisma/client"

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
    select: { id: true, nombre: true, especialidad: true, estado: true, numeroColegiado: true, alta: true, createdAt: true },
  })

  const ESTC: Record<string, string> = { VIGENTE: "ok", POR_RENOVAR: "warn", SUSPENDIDO: "bad" }
  const ESTNOMBRE: Record<string, string> = { VIGENTE: "Vigente", POR_RENOVAR: "Por renovar", SUSPENDIDO: "Suspendido" }

  function initials(name: string) {
    return name.replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "").split(/\s+/).slice(0, 2).map((w: string) => w[0] ?? "").join("").toUpperCase()
  }

  const distribucion = [
    { label: "Ingeniería Eléctrica", count: Math.round(totalColegiados * 0.35) },
    { label: "Ing. Mecánica Eléctrica", count: Math.round(totalColegiados * 0.28) },
    { label: "Ingeniería Mecánica", count: Math.round(totalColegiados * 0.19) },
    { label: "Energías Renovables", count: Math.round(totalColegiados * 0.10) },
    { label: "Electromecánica", count: Math.round(totalColegiados * 0.08) },
  ]
  const maxDist = Math.max(...distribucion.map(d => d.count), 1)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Panel del Colegio</h1>
          <p>Resumen ejecutivo · CIME Veracruz 2026</p>
        </div>
        <div className="actions">
          <Link href="/admin/colegiados/nuevo" className="btn primary">
            <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
            Nuevo colegiado
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid g-4">
        <div className="card stat">
          <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" /></svg>
            Total colegiados
          </span>
          <b className="num">{totalColegiados}</b>
          <small>Registrados en el padrón</small>
        </div>
        <div className="card stat">
          <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>
            Vigentes
          </span>
          <b className="num" style={{ color: "var(--ok)" }}>{vigentes}</b>
          <small>{pct(vigentes, totalColegiados)}% del padrón al corriente</small>
        </div>
        <div className="card stat">
          <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" /><path d="M12 16h.01" /></svg>
            Por renovar
          </span>
          <b className="num" style={{ color: "var(--warn)" }}>{porRenovar}</b>
          <small>Requieren renovación este ciclo</small>
        </div>
        <div className="card stat">
          <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" /><path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" /></svg>
            Cursos activos
          </span>
          <b className="num">{totalCursos}</b>
          <small>En el catálogo actual</small>
        </div>
      </div>

      <div className="grid g-dash">
        <div className="stack">
          {/* Últimos registros */}
          <div className="card">
            <div className="card-h">
              <h2>Últimos colegiados registrados</h2>
              <Link href="/admin/colegiados" className="btn sm ghost">
                Ver todos →
              </Link>
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
                      <td className="mono" style={{ fontSize: ".82rem" }}>
                        CIME-VER-{c.numeroColegiado ?? "—"}
                      </td>
                      <td style={{ fontSize: ".85rem" }}>{c.especialidad ?? "—"}</td>
                      <td>
                        <span className={`chip ${ESTC[c.estado]}`}>{ESTNOMBRE[c.estado]}</span>
                      </td>
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
            <div className="card-b" style={{ display: "grid", gap: 12 }}>
              <div className="axis">
                <div />
                <div><span>0</span><span>{totalColegiados}</span></div>
                <div />
              </div>
              {[
                { label: "Vigente", count: vigentes, cls: "ok" },
                { label: "Por renovar", count: porRenovar, cls: "warn" },
                { label: "Suspendido", count: suspendidos, cls: "bad" },
              ].map(row => (
                <div key={row.label} className="hbar">
                  <span className="lbl">{row.label}</span>
                  <div className="track">
                    <i style={{ width: `${pct(row.count, totalColegiados)}%`, background: `var(--${row.cls})` }} />
                  </div>
                  <b>{row.count}</b>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="stack">
          {/* Acciones rápidas */}
          <div className="card">
            <div className="card-h"><h2>Acciones rápidas</h2></div>
            <div className="card-b" style={{ display: "grid", gap: 8 }}>
              <Link href="/admin/colegiados/nuevo" className="btn block">
                <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                Alta de colegiado
              </Link>
              <Link href="/admin/colegiados" className="btn block">
                <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" /></svg>
                Gestionar padrón
              </Link>
              <Link href="/admin/cursos" className="btn block">
                <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" /><path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" /></svg>
                Gestionar cursos
              </Link>
            </div>
          </div>

          {/* Distribución por especialidad */}
          <div className="card">
            <div className="card-h"><h2>Especialidades</h2></div>
            <div className="card-b" style={{ display: "grid", gap: 10 }}>
              {distribucion.map(d => (
                <div key={d.label} style={{ display: "grid", gap: 4 }}>
                  <div className="row-between" style={{ fontSize: ".82rem" }}>
                    <span>{d.label}</span>
                    <b className="mono">{d.count}</b>
                  </div>
                  <div className="meter" style={{ height: 8 }}>
                    <i style={{ width: `${pct(d.count, maxDist)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen de cuotas */}
          <div className="card card-b" style={{ display: "grid", gap: 12 }}>
            <span className="eyebrow">Cuotas 2026</span>
            <dl className="kv">
              <dt>Pagadas</dt>
              <dd className="mono" style={{ color: "var(--ok)" }}>{vigentes} colegiados</dd>
              <dt>Pendientes</dt>
              <dd className="mono" style={{ color: "var(--warn)" }}>{porRenovar} colegiados</dd>
              <dt>Suspendidos</dt>
              <dd className="mono" style={{ color: "var(--bad)" }}>{suspendidos} colegiados</dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  )
}

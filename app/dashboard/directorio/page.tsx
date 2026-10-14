import { prisma } from "@/lib/prisma"
import { EstadoColegiado } from "@prisma/client"

export const dynamic = "force-dynamic"

const ESTC: Record<string, string> = { VIGENTE: "ok", POR_RENOVAR: "warn", SUSPENDIDO: "bad" }
const ESTNOMBRE: Record<string, string> = { VIGENTE: "Vigente", POR_RENOVAR: "Por renovar", SUSPENDIDO: "Suspendido" }

function initials(name: string) {
  return name.replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "").split(/\s+/).slice(0, 2).map((w: string) => w[0] ?? "").join("").toUpperCase()
}

interface SearchParams { q?: string; esp?: string; st?: string; page?: string }

export default async function DirectorioPage({ searchParams }: { searchParams: SearchParams }) {
  const q = searchParams.q ?? ""
  const esp = searchParams.esp ?? ""
  const st = searchParams.st ?? ""
  const page = Math.max(1, parseInt(searchParams.page ?? "1"))
  const PER = 15

  const where = {
    rol: "COLEGIADO" as const,
    ...(q && { OR: [{ nombre: { contains: q, mode: "insensitive" as const } }, { ciudad: { contains: q, mode: "insensitive" as const } }] }),
    ...(esp && { especialidad: esp }),
    ...(st && { estado: st as EstadoColegiado }),
  }

  const [total, colegiados] = await Promise.all([
    prisma.usuario.count({ where }),
    prisma.usuario.findMany({
      where, orderBy: { nombre: "asc" },
      skip: (page - 1) * PER, take: PER,
      select: { id: true, nombre: true, numeroColegiado: true, especialidad: true, ciudad: true, estado: true, alta: true, horas: true },
    }),
  ])

  const especialidades = await prisma.usuario.groupBy({ by: ["especialidad"], where: { rol: "COLEGIADO", especialidad: { not: null } } })
  const pages = Math.max(1, Math.ceil(total / PER))

  function buildUrl(params: Record<string, string>) {
    const p = new URLSearchParams({ ...(q && { q }), ...(esp && { esp }), ...(st && { st }), page: String(page), ...params })
    return `/dashboard/directorio?${p.toString()}`
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Directorio de colegiados</h1>
          <p>{total} ingenieros registrados en el padrón. Solo se muestra información profesional pública.</p>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <form method="GET" action="/dashboard/directorio" style={{ display: "contents" }}>
            <div className="input-wrap" style={{ flex: "1 1 240px" }}>
              <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
              <input className="input" name="q" placeholder="Buscar por nombre o ciudad…" defaultValue={q} style={{ height: 40 }} />
            </div>
            <select className="input" name="esp" defaultValue={esp} style={{ height: 40, width: "auto", minWidth: 200 }}>
              <option value="">Todas las especialidades</option>
              {especialidades.map(e => <option key={e.especialidad ?? ""} value={e.especialidad ?? ""}>{e.especialidad}</option>)}
            </select>
            <select className="input" name="st" defaultValue={st} style={{ height: 40, width: "auto", minWidth: 140 }}>
              <option value="">Todos</option>
              <option value="VIGENTE">Vigente</option>
              <option value="POR_RENOVAR">Por renovar</option>
            </select>
            <button className="btn" type="submit">Buscar</button>
          </form>
        </div>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Colegiado</th><th>No.</th><th>Especialidad</th><th>Ciudad</th><th>Desde</th><th>Horas 2026</th><th>Estatus</th></tr></thead>
            <tbody>
              {colegiados.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="person">
                      <span className="avatar" style={{ background: `hsl(${(c.nombre.charCodeAt(0) ?? 0) * 47 % 360} 38% 34%)` }}>{initials(c.nombre)}</span>
                      <div><b>{c.nombre}</b></div>
                    </div>
                  </td>
                  <td className="mono" style={{ fontSize: ".82rem" }}>{c.numeroColegiado ? `CIME-VER-${c.numeroColegiado}` : "—"}</td>
                  <td style={{ fontSize: ".85rem" }}>{c.especialidad ?? "—"}</td>
                  <td style={{ fontSize: ".85rem" }}>{c.ciudad ?? "—"}</td>
                  <td className="mono">{c.alta}</td>
                  <td>
                    <div style={{ display: "grid", gap: 3, minWidth: 100 }}>
                      <div style={{ fontSize: ".72rem", display: "flex", justifyContent: "space-between" }}>
                        <span>{c.horas} h</span><span className="muted">{Math.min(100, Math.round(c.horas / 60 * 100))}%</span>
                      </div>
                      <div className="meter" style={{ height: 5 }}><i style={{ width: `${Math.min(100, Math.round(c.horas / 60 * 100))}%`, background: c.horas >= 60 ? "var(--ok)" : "var(--volt)" }} /></div>
                    </div>
                  </td>
                  <td><span className={`chip ${ESTC[c.estado]}`}>{ESTNOMBRE[c.estado]}</span></td>
                </tr>
              ))}
              {colegiados.length === 0 && <tr><td colSpan={7}><div className="empty">Sin resultados</div></td></tr>}
            </tbody>
          </table>
        </div>

        <div className="pager">
          <span>Mostrando {total > 0 ? (page - 1) * PER + 1 : 0}–{Math.min(page * PER, total)} de {total}</span>
          <div className="btns">
            {page > 1 ? <a href={buildUrl({ page: String(page - 1) })} className="btn sm">← Anterior</a> : <button className="btn sm" disabled>← Anterior</button>}
            <span className="mono" style={{ alignSelf: "center", padding: "0 6px" }}>{page}/{pages}</span>
            {page < pages ? <a href={buildUrl({ page: String(page + 1) })} className="btn sm">Siguiente →</a> : <button className="btn sm" disabled>Siguiente →</button>}
          </div>
        </div>
      </div>
    </>
  )
}

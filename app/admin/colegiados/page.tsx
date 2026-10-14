import { prisma } from "@/lib/prisma"
import { EstadoColegiado } from "@prisma/client"
import Link from "next/link"
import DeleteButton from "./DeleteButton"

export const dynamic = "force-dynamic"

const ESTC: Record<string, string> = { VIGENTE: "ok", POR_RENOVAR: "warn", SUSPENDIDO: "bad" }
const ESTNOMBRE: Record<string, string> = { VIGENTE: "Vigente", POR_RENOVAR: "Por renovar", SUSPENDIDO: "Suspendido" }
const ESPS = ["Ingeniería Eléctrica","Ingeniería Mecánica","Ingeniería Mecánica Eléctrica","Ingeniería Electromecánica","Ingeniería en Energías Renovables","Ingeniería Industrial Eléctrica"]

function initials(name: string) {
  return name.replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "").split(/\s+/).slice(0, 2).map((w: string) => w[0] ?? "").join("").toUpperCase()
}

interface SearchParams { q?: string; esp?: string; st?: string; page?: string }

export default async function ColegiadosPage({ searchParams }: { searchParams: SearchParams }) {
  const q = searchParams.q ?? ""
  const esp = searchParams.esp ?? ""
  const st = searchParams.st ?? ""
  const page = Math.max(1, parseInt(searchParams.page ?? "1"))
  const PER = 12

  const where = {
    rol: "COLEGIADO" as const,
    ...(q && {
      OR: [
        { nombre: { contains: q, mode: "insensitive" as const } },
        { numeroColegiado: { contains: q, mode: "insensitive" as const } },
        { correo: { contains: q, mode: "insensitive" as const } },
        { ciudad: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(esp && { especialidad: esp }),
    ...(st && { estado: st as EstadoColegiado }),
  }

  const [total, colegiados] = await Promise.all([
    prisma.usuario.count({ where }),
    prisma.usuario.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER,
      take: PER,
      select: { id: true, nombre: true, correo: true, numeroColegiado: true, especialidad: true, ciudad: true, estado: true, alta: true, horas: true },
    }),
  ])

  const pages = Math.max(1, Math.ceil(total / PER))
  const pct = (a: number, b: number) => Math.min(100, Math.round(a / b * 100))

  function buildUrl(params: Record<string, string>) {
    const p = new URLSearchParams({ ...(q && { q }), ...(esp && { esp }), ...(st && { st }), page: String(page), ...params })
    return `/admin/colegiados?${p.toString()}`
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Colegiados</h1>
          <p>{total} ingenieros registrados en el padrón.</p>
        </div>
        <div className="actions">
          <Link href="/admin/colegiados" className="btn">
            <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
            Exportar CSV
          </Link>
          <Link href="/admin/colegiados/nuevo" className="btn primary">
            <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
            Nuevo colegiado
          </Link>
        </div>
      </div>

      <div className="card">
        {/* Toolbar */}
        <div className="toolbar">
          <form method="GET" action="/admin/colegiados" style={{ display: "contents" }}>
            <div className="input-wrap" style={{ flex: "1 1 240px" }}>
              <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
              <input className="input" name="q" placeholder="Buscar por nombre, número o correo…" defaultValue={q} style={{ height: 40 }} />
            </div>
            <select className="input" name="esp" defaultValue={esp} style={{ height: 40, width: "auto", minWidth: 200 }}>
              <option value="">Todas las especialidades</option>
              {ESPS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <select className="input" name="st" defaultValue={st} style={{ height: 40, width: "auto", minWidth: 160 }}>
              <option value="">Todos los estatus</option>
              <option value="VIGENTE">Vigente</option>
              <option value="POR_RENOVAR">Por renovar</option>
              <option value="SUSPENDIDO">Suspendido</option>
            </select>
            <button className="btn" type="submit">Filtrar</button>
            {(q || esp || st) && <Link href="/admin/colegiados" className="btn ghost">Limpiar</Link>}
          </form>
        </div>

        {/* Tabla */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Colegiado</th>
                <th>No.</th>
                <th>Especialidad</th>
                <th>Ciudad</th>
                <th>Horas 2026</th>
                <th>Estatus</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {colegiados.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="person">
                      <span className="avatar" style={{ background: `hsl(${(c.nombre.charCodeAt(0) ?? 0) * 47 % 360} 38% 34%)` }}>
                        {initials(c.nombre)}
                      </span>
                      <div>
                        <b>{c.nombre}</b>
                        <small>{c.correo}</small>
                      </div>
                    </div>
                  </td>
                  <td className="mono" style={{ fontSize: ".82rem" }}>
                    {c.numeroColegiado ? `CIME-VER-${c.numeroColegiado}` : <span className="muted">—</span>}
                  </td>
                  <td style={{ fontSize: ".85rem" }}>{c.especialidad ?? <span className="muted">—</span>}</td>
                  <td style={{ fontSize: ".85rem" }}>{c.ciudad ?? <span className="muted">—</span>}</td>
                  <td>
                    <div style={{ display: "grid", gap: 4, minWidth: 120 }}>
                      <div className="row-between" style={{ fontSize: ".75rem" }}>
                        <span className={c.horas >= 60 ? "mono" : "mono muted"}>{c.horas} h</span>
                        <span className="muted">{pct(c.horas, 60)}%</span>
                      </div>
                      <div className="meter" style={{ height: 6 }}>
                        <i style={{ width: `${pct(c.horas, 60)}%`, background: c.horas >= 60 ? "var(--ok)" : "var(--volt)" }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`chip ${ESTC[c.estado]}`}>{ESTNOMBRE[c.estado]}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <Link href={`/admin/colegiados/${c.id}`} className="btn sm">Editar</Link>
                      <DeleteButton id={c.id} nombre={c.nombre} />
                    </div>
                  </td>
                </tr>
              ))}
              {colegiados.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <svg className="ico lg" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                      <b>Sin resultados</b>
                      <span>Prueba con otro término o limpia los filtros.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador */}
        <div className="pager">
          <span>Mostrando {total > 0 ? (page - 1) * PER + 1 : 0}–{Math.min(page * PER, total)} de {total}</span>
          <div className="btns">
            {page > 1
              ? <Link href={buildUrl({ page: String(page - 1) })} className="btn sm">← Anterior</Link>
              : <button className="btn sm" disabled>← Anterior</button>}
            <span className="mono" style={{ alignSelf: "center", padding: "0 6px" }}>{page}/{pages}</span>
            {page < pages
              ? <Link href={buildUrl({ page: String(page + 1) })} className="btn sm">Siguiente →</Link>
              : <button className="btn sm" disabled>Siguiente →</button>}
          </div>
        </div>
      </div>
    </>
  )
}

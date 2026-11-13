import { prisma } from "@/lib/prisma"
import { EstadoColegiado } from "@prisma/client"
import Link from "next/link"
import DeletePeritoButton from "./DeletePeritoButton"

export const dynamic = "force-dynamic"

const ESTC: Record<string, string> = { VIGENTE: "ok", POR_RENOVAR: "warn", SUSPENDIDO: "bad" }
const ESTNOMBRE: Record<string, string> = { VIGENTE: "Vigente", POR_RENOVAR: "Por renovar", SUSPENDIDO: "Suspendido" }

function initials(name: string) {
  return name.replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "").split(/\s+/).slice(0, 2).map((w: string) => w[0] ?? "").join("").toUpperCase()
}

interface SearchParams { q?: string; esp?: string; st?: string; page?: string }

export default async function PeritosPage({ searchParams }: { searchParams: SearchParams }) {
  const q    = searchParams.q ?? ""
  const esp  = searchParams.esp ?? ""
  const st   = searchParams.st ?? ""
  const page = Math.max(1, parseInt(searchParams.page ?? "1"))
  const PER  = 12

  const where = {
    rol: "PERITO" as const,
    ...(q && {
      OR: [
        { nombre:      { contains: q, mode: "insensitive" as const } },
        { numeroPerito: { contains: q, mode: "insensitive" as const } },
        { correo:      { contains: q, mode: "insensitive" as const } },
        { ciudad:      { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(esp && { especialidad: esp }),
    ...(st  && { estado: st as EstadoColegiado }),
  }

  const [total, peritos] = await Promise.all([
    prisma.usuario.count({ where }),
    prisma.usuario.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER,
      take: PER,
      select: { id: true, nombre: true, correo: true, numeroPerito: true, especialidad: true, ciudad: true, estado: true, alta: true, horas: true, vigencia: true },
    }),
  ])

  const pages = Math.max(1, Math.ceil(total / PER))

  function buildUrl(params: Record<string, string>) {
    const p = new URLSearchParams({ ...(q && { q }), ...(esp && { esp }), ...(st && { st }), page: String(page), ...params })
    return `/admin/peritos?${p.toString()}`
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Peritos</h1>
          <p>{total} perito{total !== 1 ? "s" : ""} registrados en el sistema.</p>
        </div>
        <div className="actions">
          <Link href="/admin/peritos/nuevo" className="btn primary">
            <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
            Nuevo perito
          </Link>
        </div>
      </div>

      <div className="card">
        {/* Toolbar */}
        <div className="toolbar">
          <form method="GET" action="/admin/peritos" style={{ display: "contents" }}>
            <div className="input-wrap" style={{ flex: "1 1 240px" }}>
              <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
              <input className="input" name="q" placeholder="Buscar por nombre, número o correo…" defaultValue={q} style={{ height: 40 }} />
            </div>
            <select className="input" name="st" defaultValue={st} style={{ height: 40, width: "auto", minWidth: 160 }}>
              <option value="">Todos los estatus</option>
              <option value="VIGENTE">Vigente</option>
              <option value="POR_RENOVAR">Por renovar</option>
              <option value="SUSPENDIDO">Suspendido</option>
            </select>
            <button className="btn" type="submit">Filtrar</button>
            {(q || esp || st) && <Link href="/admin/peritos" className="btn ghost">Limpiar</Link>}
          </form>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Perito</th>
                <th>No. Perito</th>
                <th>Especialidad</th>
                <th>Ciudad</th>
                <th>Vigencia</th>
                <th>Estatus</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {peritos.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="person">
                      <span className="avatar" style={{ background: `hsl(${(p.nombre.charCodeAt(0) ?? 0) * 47 % 360} 38% 34%)` }}>
                        {initials(p.nombre)}
                      </span>
                      <div>
                        <b>{p.nombre}</b>
                        <small>{p.correo}</small>
                      </div>
                    </div>
                  </td>
                  <td className="mono" style={{ fontSize: ".82rem" }}>
                    {p.numeroPerito ? `CIME-PER-${p.numeroPerito}` : <span className="muted">—</span>}
                  </td>
                  <td style={{ fontSize: ".85rem" }}>{p.especialidad ?? <span className="muted">—</span>}</td>
                  <td style={{ fontSize: ".85rem" }}>{p.ciudad ?? <span className="muted">—</span>}</td>
                  <td style={{ fontSize: ".83rem", color: "var(--muted)" }}>
                    {p.vigencia ?? "—"}
                  </td>
                  <td>
                    <span className={`chip ${ESTC[p.estado]}`}>{ESTNOMBRE[p.estado]}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <Link href={`/admin/peritos/${p.id}`} className="btn sm">Editar</Link>
                      <DeletePeritoButton id={p.id} nombre={p.nombre} />
                    </div>
                  </td>
                </tr>
              ))}
              {peritos.length === 0 && (
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

        {/* Paginator */}
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

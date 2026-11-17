import { prisma } from "@/lib/prisma"
import NuevoEventoForm from "./NuevoEventoForm"
import DeleteEventoButton from "./DeleteEventoButton"
import ComunicadosGrid, { type Item } from "@/components/ComunicadosGrid"

export const dynamic = "force-dynamic"

function dateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}
function todayUTC(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

function audienciaLabel(aud: string): string {
  if (aud === "todos") return "Todos"
  if (aud === "colegiados") return "Colegiados"
  if (aud === "peritos") return "Peritos"
  if (aud === "tesorero") return "Tesorero"
  return aud
}

export default async function AdminEventosPage() {
  const [eventos, avisos] = await Promise.all([
    prisma.evento.findMany({ orderBy: { fecha: "asc" } }),
    prisma.aviso.findMany({ orderBy: [{ fijado: "desc" }, { createdAt: "desc" }] }),
  ])

  const today = todayUTC()

  const eventoItems: Item[] = eventos.map(e => ({
    id:        e.id,
    tipo:      e.tipo,
    titulo:    e.titulo,
    fecha:     e.fecha.toISOString(),
    hora:      e.hora,
    lugar:     e.lugar,
    createdAt: e.createdAt.toISOString(),
    audiencia: e.audiencia,
    _kind:     "evento" as const,
  }))

  const avisoItems: Item[] = avisos.map(a => ({
    id:        a.id,
    tipo:      a.tipo,
    categoria: a.categoria,
    titulo:    a.titulo,
    contenido: a.contenido,
    fijado:    a.fijado,
    imagen:    a.imagen,
    createdAt: a.createdAt.toISOString(),
    audiencia: a.audiencia,
    expiresAt: a.expiresAt?.toISOString() ?? null,
    _kind:     "aviso" as const,
  }))

  const allItems: Item[] = [...eventoItems, ...avisoItems]

  // For the unified admin table: combine and sort by date descending
  const tableItems = [...allItems].sort((a, b) => {
    const aDate = a._kind === "evento" ? new Date(a.fecha) : new Date(a.createdAt)
    const bDate = b._kind === "evento" ? new Date(b.fecha) : new Date(b.createdAt)
    return bDate.getTime() - aDate.getTime()
  })

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Eventos y Avisos</h1>
          <p>Gestión de comunicaciones y calendario del Colegio.</p>
        </div>
      </div>

      <div className="grid g-dash">
        <div className="stack">
          {/* Comunicados activos */}
          <div className="card">
            <div className="card-h"><h2>Comunicaciones activas</h2></div>
            <div className="card-b">
              <ComunicadosGrid items={allItems} />
            </div>
          </div>

          {/* Unified admin table */}
          <div className="card">
            <div className="card-h"><h2>Administrar todo ({tableItems.length})</h2></div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Tipo</th>
                    <th>Audiencia</th>
                    <th>Fecha / Vigencia</th>
                    <th>Fijado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tableItems.map(item => {
                    if (item._kind === "evento") {
                      const isActive = dateOnly(new Date(item.fecha)) >= today
                      return (
                        <tr key={`e-${item.id}`} style={{ opacity: isActive ? 1 : 0.6 }}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0D2060", display: "inline-block", flexShrink: 0 }} />
                              <b style={{ fontSize: ".88rem" }}>{item.titulo}</b>
                            </div>
                          </td>
                          <td>
                            <span className="chip nodot info" style={{ fontSize: ".68rem" }}>{item.tipo}</span>
                          </td>
                          <td>
                            <span style={{ fontSize: ".78rem", color: "var(--muted)" }}>{audienciaLabel(item.audiencia)}</span>
                          </td>
                          <td className="mono" style={{ fontSize: ".78rem" }}>
                            {new Date(item.fecha).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                            {" · "}{item.hora} h
                          </td>
                          <td style={{ textAlign: "center" }}>—</td>
                          <td style={{ textAlign: "right" }}>
                            <DeleteEventoButton id={item.id} />
                          </td>
                        </tr>
                      )
                    } else {
                      const isActive = !item.expiresAt || dateOnly(new Date(item.expiresAt)) >= today
                      return (
                        <tr key={`a-${item.id}`} style={{ opacity: isActive ? 1 : 0.6 }}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.fijado ? "#E8C060" : "var(--line)", display: "inline-block", flexShrink: 0 }} />
                              <b style={{ fontSize: ".88rem" }}>{item.titulo}</b>
                            </div>
                          </td>
                          <td>
                            <span className="chip nodot" style={{ fontSize: ".68rem" }}>{item.categoria}</span>
                          </td>
                          <td>
                            <span style={{ fontSize: ".78rem", color: "var(--muted)" }}>{audienciaLabel(item.audiencia)}</span>
                          </td>
                          <td className="mono" style={{ fontSize: ".78rem" }}>
                            {item.expiresAt
                              ? `Vence: ${new Date(item.expiresAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}`
                              : new Date(item.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td style={{ textAlign: "center", fontSize: ".85rem" }}>
                            {item.fijado ? "📌" : "—"}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {/* Avisos don't have a delete button in the original, leave empty for now */}
                          </td>
                        </tr>
                      )
                    }
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <NuevoEventoForm />
        </div>
      </div>
    </>
  )
}

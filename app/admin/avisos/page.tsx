import { prisma } from "@/lib/prisma"
import NuevoAvisoForm from "./NuevoAvisoForm"
import DeleteAvisoButton from "./DeleteAvisoButton"

export const dynamic = "force-dynamic"

const TIPO_COLOR: Record<string, string> = { asamblea: "warn", curso: "info", conferencia: "teal", visita: "ok", examen: "bad", sistema: "muted" }

export default async function AdminAvisosPage() {
  const avisos = await prisma.aviso.findMany({ orderBy: [{ fijado: "desc" }, { createdAt: "desc" }] })

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Avisos</h1>
          <p>Comunicados y noticias para los colegiados.</p>
        </div>
      </div>

      <div className="grid g-dash">
        <div className="card">
          <div className="card-h"><h2>Avisos publicados ({avisos.length})</h2></div>
          {avisos.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Título</th><th>Categoría</th><th>Fecha</th><th>Fijado</th><th></th></tr></thead>
                <tbody>
                  {avisos.map(a => (
                    <tr key={a.id}>
                      <td>
                        <b style={{ fontSize: ".9rem" }}>{a.titulo}</b>
                        <div className="muted" style={{ fontSize: ".78rem", maxWidth: "40ch", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.contenido}</div>
                      </td>
                      <td><span className={`chip nodot ${TIPO_COLOR[a.tipo] ?? "info"}`}>{a.categoria}</span></td>
                      <td className="mono" style={{ fontSize: ".8rem" }}>{new Date(a.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td>{a.fijado ? <span className="chip nodot warn">Fijado</span> : <span className="muted" style={{ fontSize: ".82rem" }}>No</span>}</td>
                      <td style={{ textAlign: "right" }}><DeleteAvisoButton id={a.id} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">Sin avisos publicados</div>
          )}
        </div>

        <div>
          <NuevoAvisoForm />
        </div>
      </div>
    </>
  )
}

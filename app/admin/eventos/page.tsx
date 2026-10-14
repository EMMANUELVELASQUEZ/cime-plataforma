import { prisma } from "@/lib/prisma"
import NuevoEventoForm from "./NuevoEventoForm"
import DeleteEventoButton from "./DeleteEventoButton"

export const dynamic = "force-dynamic"

const TIPOS: Record<string, string> = { curso: "Curso", asamblea: "Asamblea", conferencia: "Conferencia", visita: "Visita técnica", examen: "Evaluación" }
const TIPO_COLOR: Record<string, string> = { curso: "info", asamblea: "warn", conferencia: "teal", visita: "ok", examen: "bad" }
const MES3 = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]

export default async function AdminEventosPage() {
  const eventos = await prisma.evento.findMany({ orderBy: { fecha: "asc" } })
  const proximos = eventos.filter(e => new Date(e.fecha) >= new Date())
  const pasados = eventos.filter(e => new Date(e.fecha) < new Date())

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Eventos</h1>
          <p>Gestión del calendario del Colegio.</p>
        </div>
      </div>

      <div className="grid g-dash">
        <div className="stack">
          <div className="card">
            <div className="card-h"><h2>Próximos ({proximos.length})</h2></div>
            {proximos.length > 0 ? proximos.map(e => {
              const d = new Date(e.fecha)
              return (
                <div key={e.id} style={{ display: "grid", gridTemplateColumns: "56px minmax(0,1fr) auto", gap: 14, padding: "14px 20px", borderBottom: "1px solid var(--line)", alignItems: "start" }}>
                  <div style={{ border: "1px solid var(--line)", borderRadius: 8, textAlign: "center", overflow: "hidden" }}>
                    <span style={{ display: "block", font: "600 .65rem/1 var(--f-body)", letterSpacing: ".1em", textTransform: "uppercase", padding: "5px 0", background: "var(--surface-2)", color: "var(--muted)" }}>{MES3[d.getMonth()]}</span>
                    <b style={{ display: "block", font: "750 1.35rem/1.6 var(--f-display)", fontStretch: "85%" }}>{d.getDate()}</b>
                  </div>
                  <div>
                    <span className={`chip nodot ${TIPO_COLOR[e.tipo]}`} style={{ height: 20, fontSize: ".68rem" }}>{TIPOS[e.tipo]}</span>
                    <h3 style={{ fontSize: ".95rem", marginTop: 6 }}>{e.titulo}</h3>
                    <p style={{ fontSize: ".8rem", color: "var(--muted)", marginTop: 3 }}>{e.hora} h · {e.lugar}</p>
                  </div>
                  <DeleteEventoButton id={e.id} />
                </div>
              )
            }) : <div className="empty">Sin eventos próximos</div>}
          </div>

          {pasados.length > 0 && (
            <div className="card">
              <div className="card-h"><h2>Pasados ({pasados.length})</h2></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Fecha</th><th>Evento</th><th>Tipo</th><th></th></tr></thead>
                  <tbody>
                    {pasados.slice(-10).reverse().map(e => (
                      <tr key={e.id} style={{ opacity: .7 }}>
                        <td className="mono" style={{ fontSize: ".8rem" }}>{new Date(e.fecha).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}</td>
                        <td><b style={{ fontSize: ".88rem" }}>{e.titulo}</b></td>
                        <td><span className={`chip nodot ${TIPO_COLOR[e.tipo]}`}>{TIPOS[e.tipo]}</span></td>
                        <td style={{ textAlign: "right" }}><DeleteEventoButton id={e.id} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div>
          <NuevoEventoForm />
        </div>
      </div>
    </>
  )
}

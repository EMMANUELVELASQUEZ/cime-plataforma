import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const TIPOS: Record<string, string> = { curso: "Curso", asamblea: "Asamblea", conferencia: "Conferencia", visita: "Visita técnica", examen: "Evaluación" }
const TIPO_COLOR: Record<string, string> = { curso: "info", asamblea: "warn", conferencia: "teal", visita: "ok", examen: "bad" }
const MES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]
const MES3 = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]

export default async function CalendarioPage() {
  const eventos = await prisma.evento.findMany({
    orderBy: { fecha: "asc" },
  })

  const now = new Date()
  const proximos = eventos.filter(e => new Date(e.fecha) >= now).slice(0, 20)

  const mesActual = now.getMonth()
  const anioActual = now.getFullYear()
  const eventosMes = eventos.filter(e => {
    const d = new Date(e.fecha)
    return d.getMonth() === mesActual && d.getFullYear() === anioActual
  })

  const primero = new Date(anioActual, mesActual, 1)
  const startDow = (primero.getDay() + 6) % 7
  const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate()

  const celdas: (number | null)[] = []
  for (let i = 0; i < startDow; i++) celdas.push(null)
  for (let i = 1; i <= diasEnMes; i++) celdas.push(i)

  function eventosDia(dia: number) {
    return eventosMes.filter(e => new Date(e.fecha).getDate() === dia)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Calendario del Colegio</h1>
          <p>Sesiones de cursos, asambleas, conferencias, visitas técnicas y evaluaciones.</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "minmax(0,1fr) 320px", gap: 20, alignItems: "start" }}>
        {/* Calendario */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
            <h2 style={{ marginRight: "auto", textTransform: "capitalize" }}>{MES[mesActual]} {anioActual}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0,1fr))" }}>
            {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(d => (
              <div key={d} style={{ padding: "10px 8px", font: "600 .7rem var(--f-body)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", borderBottom: "1px solid var(--line)", textAlign: "center" }}>{d}</div>
            ))}
            {celdas.map((dia, i) => {
              const evs = dia ? eventosDia(dia) : []
              const isToday = dia === now.getDate()
              return (
                <div key={i} style={{ minHeight: 80, padding: 6, borderRight: (i + 1) % 7 === 0 ? "none" : "1px solid var(--line)", borderBottom: "1px solid var(--line)", background: !dia ? "color-mix(in srgb, var(--surface-2) 60%, var(--surface))" : "var(--surface)" }}>
                  {dia && (
                    <>
                      <span style={{ width: 26, height: 26, display: "grid", placeItems: "center", borderRadius: "50%", fontFamily: "var(--f-mono)", fontSize: ".8rem", fontWeight: 500, background: isToday ? "var(--volt)" : "none", color: isToday ? "var(--volt-fg)" : "inherit" }}>{dia}</span>
                      {evs.slice(0, 2).map((e, j) => (
                        <span key={j} title={e.titulo} style={{ display: "block", fontSize: ".68rem", fontWeight: 600, padding: "2px 5px", borderRadius: 3, marginTop: 2, borderLeft: `3px solid var(--${TIPO_COLOR[e.tipo]})`, background: `var(--${TIPO_COLOR[e.tipo]}-bg)`, color: `var(--${TIPO_COLOR[e.tipo]})`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {e.titulo}
                        </span>
                      ))}
                      {evs.length > 2 && <span style={{ fontSize: ".68rem", color: "var(--muted)", paddingLeft: 4 }}>+{evs.length - 2}</span>}
                    </>
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", padding: "12px 16px", borderTop: "1px solid var(--line)", fontSize: ".78rem", color: "var(--muted)" }}>
            {Object.entries(TIPOS).map(([k, v]) => (
              <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <i style={{ width: 10, height: 10, borderRadius: 3, background: `var(--${TIPO_COLOR[k]})`, display: "inline-block" }} />{v}
              </span>
            ))}
          </div>
        </div>

        {/* Próximos eventos */}
        <div className="card">
          <div className="card-h"><h2>Próximos eventos</h2></div>
          <div>
            {proximos.slice(0, 8).map(e => {
              const d = new Date(e.fecha)
              return (
                <div key={e.id} style={{ display: "grid", gridTemplateColumns: "56px minmax(0,1fr)", gap: 14, padding: "14px 20px", borderBottom: "1px solid var(--line)", alignItems: "start" }}>
                  <div style={{ border: "1px solid var(--line)", borderRadius: 8, textAlign: "center", overflow: "hidden" }}>
                    <span style={{ display: "block", font: "600 .65rem/1 var(--f-body)", letterSpacing: ".1em", textTransform: "uppercase", padding: "5px 0", background: "var(--surface-2)", color: "var(--muted)" }}>{MES3[d.getMonth()]}</span>
                    <b style={{ display: "block", font: "750 1.35rem/1.6 var(--f-display)", fontStretch: "85%" }}>{d.getDate()}</b>
                  </div>
                  <div>
                    <span className={`chip nodot ${TIPO_COLOR[e.tipo]}`} style={{ height: 20, fontSize: ".68rem" }}>{TIPOS[e.tipo]}</span>
                    <h3 style={{ fontSize: ".95rem", marginTop: 6 }}>{e.titulo}</h3>
                    <p style={{ fontSize: ".8rem", color: "var(--muted)", marginTop: 3, display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
                      <span>{e.hora} h</span>
                      <span>{e.lugar}</span>
                    </p>
                  </div>
                </div>
              )
            })}
            {proximos.length === 0 && <div className="empty">Sin eventos próximos</div>}
          </div>
        </div>
      </div>
    </>
  )
}

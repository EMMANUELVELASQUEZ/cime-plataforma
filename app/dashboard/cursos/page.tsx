import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import InscribirBtn from "./InscribirBtn"

export const dynamic = "force-dynamic"

const AREA_LABEL: Record<string, string> = { ELE: "Eléctrica", MEC: "Mecánica", SOL: "Solar" }
const AREA_COLOR: Record<string, string> = { ELE: "info", MEC: "teal", SOL: "warn" }
const ESTADO_CHIP: Record<string, string> = { ABIERTO: "ok", EN_CURSO: "info", LLENO: "bad", COMPLETADO: "teal" }
const ESTADO_LABEL: Record<string, string> = { ABIERTO: "Abierto", EN_CURSO: "En curso", LLENO: "Cupo lleno", COMPLETADO: "Completado" }

const money = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })

export default async function CursosPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id

  const inscripciones = await prisma.inscripcionCurso.findMany({
    where: { usuarioId: userId },
    include: { curso: { include: { modulos: { orderBy: { orden: "asc" } } } } },
    orderBy: { createdAt: "desc" },
  })

  const cursosAbiertos = await prisma.curso.findMany({
    where: { estado: { in: ["ABIERTO", "LLENO"] } },
    include: { modulos: true, inscritos: true },
    orderBy: { fechaInicio: "asc" },
  })

  const inscritosIds = new Set(inscripciones.map(i => i.cursoId))
  const enCurso = inscripciones.filter(i => i.estado !== "COMPLETADO")
  const completados = inscripciones.filter(i => i.estado === "COMPLETADO")

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mis cursos</h1>
          <p>Cursos de actualización con valor curricular.</p>
        </div>
      </div>

      {enCurso.length > 0 && (
        <div className="card">
          <div className="card-h"><h2>En curso</h2><span className="chip nodot info">{enCurso.length} activos</span></div>
          <div>
            {enCurso.map(i => {
              const c = i.curso
              const pct = Math.round(i.progreso)
              return (
                <div key={i.id} style={{ padding: "18px 20px", borderBottom: "1px solid var(--line)" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 9, display: "grid", placeItems: "center", flexShrink: 0, background: `var(--${AREA_COLOR[c.area]}-bg)`, color: `var(--${AREA_COLOR[c.area]})` }}>
                      <svg className="ico" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" /><path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" /></svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="eyebrow mono" style={{ letterSpacing: ".04em" }}>{c.codigo}</span>
                      <h3 style={{ marginTop: 2 }}>{c.titulo}</h3>
                      <div style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: 4 }}>{c.instructor} · {c.modalidad} · {c.lugar}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, alignItems: "center", marginTop: 12 }}>
                        <div className="meter" style={{ height: 8 }}><i style={{ width: `${pct}%` }} /></div>
                        <b className="mono" style={{ fontSize: ".85rem" }}>{pct}%</b>
                      </div>
                      <div style={{ fontSize: ".78rem", color: "var(--muted)", marginTop: 4 }}>
                        Módulo {i.moduloActual + 1} de {c.modulos.length} · Termina {new Date(c.fechaFin).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    <span className="chip nodot info">{c.horas} h</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-h"><h2>Inscripciones abiertas</h2></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Curso</th><th>Área</th><th>Inicio</th><th>Modalidad</th><th>Horas</th><th>Precio</th><th>Inscritos</th><th></th></tr></thead>
            <tbody>
              {cursosAbiertos.map(c => {
                const yaInscrito = inscritosIds.has(c.id)
                const lleno = c.estado === "LLENO" || c.inscritos.length >= c.cupo
                return (
                  <tr key={c.id}>
                    <td>
                      <b style={{ display: "block", fontSize: ".9rem" }}>{c.titulo}</b>
                      <span className="mono muted" style={{ fontSize: ".75rem" }}>{c.codigo}</span>
                    </td>
                    <td><span className={`chip nodot ${AREA_COLOR[c.area]}`}>{AREA_LABEL[c.area]}</span></td>
                    <td className="mono" style={{ fontSize: ".82rem" }}>{new Date(c.fechaInicio).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</td>
                    <td style={{ fontSize: ".85rem" }}>{c.modalidad}</td>
                    <td className="mono">{c.horas} h</td>
                    <td className="mono">{money(c.precio)}</td>
                    <td>
                      <div style={{ display: "grid", gap: 3, minWidth: 100 }}>
                        <div className="row-between" style={{ fontSize: ".72rem" }}>
                          <span>{c.inscritos.length}/{c.cupo}</span>
                        </div>
                        <div className="meter" style={{ height: 5 }}>
                          <i style={{ width: `${Math.round(c.inscritos.length / c.cupo * 100)}%`, background: lleno ? "var(--bad)" : "var(--volt)" }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {yaInscrito
                        ? <span className="chip ok nodot">Inscrito</span>
                        : lleno
                          ? <span className="chip bad nodot">Cupo lleno</span>
                          : <InscribirBtn cursoId={c.id} titulo={c.titulo} />}
                    </td>
                  </tr>
                )
              })}
              {cursosAbiertos.length === 0 && (
                <tr><td colSpan={8}><div className="empty">Sin cursos disponibles en este momento</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {completados.length > 0 && (
        <div className="card">
          <div className="card-h"><h2>Completados</h2><span className="chip nodot ok">{completados.length} acreditados</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Curso</th><th>Folio</th><th>Horas</th><th>Calificación</th><th></th></tr></thead>
              <tbody>
                {completados.map(i => (
                  <tr key={i.id}>
                    <td><b>{i.curso.titulo}</b></td>
                    <td className="mono" style={{ fontSize: ".8rem" }}>{i.folio ?? "—"}</td>
                    <td className="mono">{i.curso.horas} h</td>
                    <td className="mono">{i.calificacion?.toFixed(1) ?? "—"}</td>
                    <td style={{ textAlign: "right" }}><button className="btn sm">Ver constancia</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = "force-dynamic"

const ESTADO_CHIP: Record<string, string> = { ABIERTO: "ok", EN_CURSO: "info", LLENO: "bad", COMPLETADO: "teal" }
const ESTADO_LABEL: Record<string, string> = { ABIERTO: "Abierto", EN_CURSO: "En curso", LLENO: "Cupo lleno", COMPLETADO: "Completado" }
const AREA_LABEL: Record<string, string> = { ELE: "Eléctrica", MEC: "Mecánica", SOL: "Solar/Renovable" }
const money = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })

export default async function AdminCursosPage() {
  const cursos = await prisma.curso.findMany({
    include: { inscritos: true, modulos: true },
    orderBy: { fechaInicio: "desc" },
  })

  const totales = { total: cursos.length, activos: cursos.filter(c => c.estado !== "COMPLETADO").length, inscritos: cursos.reduce((s, c) => s + c.inscritos.length, 0) }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Cursos</h1>
          <p>Catálogo de cursos de actualización profesional.</p>
        </div>
        <div className="actions">
          <button className="btn primary">
            <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
            Nuevo curso
          </button>
        </div>
      </div>

      <div className="grid g-3">
        <div className="card stat"><span className="eyebrow">Total cursos</span><b>{totales.total}</b><small>En el catálogo</small></div>
        <div className="card stat"><span className="eyebrow">Activos</span><b style={{ color: "var(--ok)" }}>{totales.activos}</b><small>En curso o abiertos</small></div>
        <div className="card stat"><span className="eyebrow">Inscripciones</span><b>{totales.inscritos}</b><small>Registros totales</small></div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Código</th><th>Curso</th><th>Área</th><th>Modalidad</th><th>Inicio</th><th>Horas</th><th>Precio</th><th>Cupo</th><th>Estatus</th><th></th></tr>
            </thead>
            <tbody>
              {cursos.map(c => (
                <tr key={c.id}>
                  <td className="mono" style={{ fontSize: ".78rem" }}>{c.codigo}</td>
                  <td>
                    <b style={{ fontSize: ".9rem" }}>{c.titulo}</b>
                    <div className="muted" style={{ fontSize: ".78rem" }}>{c.instructor}</div>
                  </td>
                  <td style={{ fontSize: ".85rem" }}>{AREA_LABEL[c.area]}</td>
                  <td style={{ fontSize: ".85rem" }}>{c.modalidad}</td>
                  <td className="mono" style={{ fontSize: ".82rem" }}>{new Date(c.fechaInicio).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</td>
                  <td className="mono">{c.horas} h</td>
                  <td className="mono">{money(c.precio)}</td>
                  <td>
                    <div style={{ display: "grid", gap: 3, minWidth: 80 }}>
                      <div style={{ fontSize: ".72rem", display: "flex", justifyContent: "space-between" }}>
                        <span>{c.inscritos.length}/{c.cupo}</span>
                      </div>
                      <div className="meter" style={{ height: 5 }}>
                        <i style={{ width: `${Math.round(c.inscritos.length / c.cupo * 100)}%`, background: c.inscritos.length >= c.cupo ? "var(--bad)" : "var(--volt)" }} />
                      </div>
                    </div>
                  </td>
                  <td><span className={`chip nodot ${ESTADO_CHIP[c.estado]}`}>{ESTADO_LABEL[c.estado]}</span></td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn sm">Editar</button>
                  </td>
                </tr>
              ))}
              {cursos.length === 0 && (
                <tr><td colSpan={10}><div className="empty">Sin cursos registrados aún<br /><button className="btn primary" style={{ marginTop: 12 }}>Agregar primer curso</button></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

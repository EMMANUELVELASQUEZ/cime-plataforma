import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function ConstanciasPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id

  const completados = await prisma.inscripcionCurso.findMany({
    where: { usuarioId: userId, estado: "COMPLETADO" },
    include: { curso: true },
    orderBy: { createdAt: "desc" },
  })

  const totalHoras = completados.reduce((s, i) => s + i.curso.horas, 0)
  const promedio = completados.length > 0
    ? (completados.reduce((s, i) => s + (i.calificacion ?? 0), 0) / completados.length).toFixed(1)
    : "—"

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Constancias</h1>
          <p>Constancias con valor curricular emitidas por el Colegio. Cada una lleva folio y código de verificación.</p>
        </div>
      </div>

      <div className="grid g-3">
        <div className="card stat">
          <span className="eyebrow">Constancias 2026</span>
          <b>{completados.length}</b>
          <small>Emitidas este año</small>
        </div>
        <div className="card stat">
          <span className="eyebrow">Horas acreditadas</span>
          <b>{totalHoras} h</b>
          <small>Meta anual: 60 h</small>
        </div>
        <div className="card stat">
          <span className="eyebrow">Promedio</span>
          <b>{promedio}</b>
          <small>Calificación de cursos concluidos</small>
        </div>
      </div>

      <div className="card">
        {completados.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Curso</th><th>Folio</th><th>Concluido</th><th>Horas</th><th>Calif.</th><th></th></tr>
              </thead>
              <tbody>
                {completados.map(i => (
                  <tr key={i.id}>
                    <td>
                      <b>{i.curso.titulo}</b>
                      <div className="mono muted" style={{ fontSize: ".75rem" }}>{i.curso.codigo}</div>
                    </td>
                    <td className="mono" style={{ fontSize: ".82rem" }}>{i.folio ?? "—"}</td>
                    <td className="num">{new Date(i.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="mono">{i.curso.horas}</td>
                    <td className="mono">{i.calificacion?.toFixed(1) ?? "—"}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn sm">
                        <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
                        Descargar PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <svg className="ico lg" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 8v-3a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-5" /><path d="M6 14m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M4.5 17l-1.5 5l3 -1.5l3 1.5l-1.5 -5" /></svg>
            <b>Sin constancias aún</b>
            <span>Acredita un curso para obtener tu primera constancia.</span>
          </div>
        )}
      </div>
    </>
  )
}

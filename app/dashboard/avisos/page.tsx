import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const TIPO_COLOR: Record<string, string> = { asamblea: "warn", curso: "info", conferencia: "teal", visita: "ok", examen: "bad", sistema: "muted" }
const TIPO_ICON: Record<string, string> = { Convocatoria: "certificate", Cuotas: "receipt", Evento: "speakerphone", Cursos: "school", Sistema: "tool" }

const ICO_SVG: Record<string, React.ReactNode> = {
  certificate: <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 15m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M13 17.5v4.5l2 -1.5l2 1.5v-4.5" /><path d="M10 19h-5a2 2 0 0 1 -2 -2v-10c0 -1.1 .9 -2 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -1 1.73" /><path d="M6 9l12 0" /><path d="M6 12l3 0" /><path d="M6 15l2 0" /></svg>,
  receipt: <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16l-3 -2l-2 2l-2 -2l-2 2l-2 -2l-3 2m4 -14h6m-6 4h6m-2 4h2" /></svg>,
  speakerphone: <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 8a3 3 0 0 1 0 6" /><path d="M10 8v11a1 1 0 0 1 -1 1h-1a1 1 0 0 1 -1 -1v-5" /><path d="M12 8h0l4.524 -3.77a.9 .9 0 0 1 1.476 .692v12.156a.9 .9 0 0 1 -1.476 .692l-4.524 -3.77h-8a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h8" /></svg>,
  school: <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" /><path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" /></svg>,
  tool: <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M7 10h3v-3l-3.5 -3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1 -3 3l-6 -6a6 6 0 0 1 -8 -8l3.5 3.5" /></svg>,
}

export default async function AvisosPage() {
  const avisos = await prisma.aviso.findMany({ orderBy: [{ fijado: "desc" }, { createdAt: "desc" }] })

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Avisos</h1>
          <p>Comunicados oficiales del Consejo Directivo, convocatorias y recordatorios.</p>
        </div>
      </div>

      <div className="card">
        {avisos.length > 0 ? avisos.map(a => (
          <div key={a.id} style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr) auto", gap: 16, padding: "18px 20px", borderBottom: "1px solid var(--line)", alignItems: "start", borderLeft: a.fijado ? "3px solid var(--volt)" : undefined }}>
            <div style={{ width: 40, height: 40, borderRadius: 9, display: "grid", placeItems: "center", background: `var(--${TIPO_COLOR[a.tipo] ?? "info"}-bg)`, color: `var(--${TIPO_COLOR[a.tipo] ?? "info"})` }}>
              {ICO_SVG[TIPO_ICON[a.categoria]] ?? ICO_SVG.speakerphone}
            </div>
            <div>
              <span className={`chip nodot ${TIPO_COLOR[a.tipo] ?? "info"}`} style={{ height: 20, fontSize: ".68rem" }}>{a.categoria}{a.fijado ? " · Fijado" : ""}</span>
              <h3 style={{ marginTop: 4 }}>{a.titulo}</h3>
              <p style={{ fontSize: ".88rem", color: "var(--muted)", marginTop: 4, maxWidth: "70ch" }}>{a.contenido}</p>
            </div>
            <time style={{ fontFamily: "var(--f-mono)", fontSize: ".75rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
              {new Date(a.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
            </time>
          </div>
        )) : (
          <div className="empty">Sin avisos publicados</div>
        )}
      </div>
    </>
  )
}

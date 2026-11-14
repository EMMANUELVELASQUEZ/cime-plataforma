import { prisma } from "@/lib/prisma"
import AvisosGrid from "@/components/AvisosGrid"

export const dynamic = "force-dynamic"

export default async function AvisosPage() {
  const avisos = await prisma.aviso.findMany({
    orderBy: [{ fijado: "desc" }, { createdAt: "desc" }],
  })

  const data = avisos.map(a => ({
    id:        a.id,
    tipo:      a.tipo,
    categoria: a.categoria,
    titulo:    a.titulo,
    contenido: a.contenido,
    fijado:    a.fijado,
    imagen:    a.imagen,
    createdAt: a.createdAt.toISOString(),
  }))

  return (
    <>
      <div className="page-head">
        <div>
          <p style={{ fontSize: ".7rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>
            PORTAL CIME · COMUNICADOS OFICIALES
          </p>
          <h1>Avisos del Colegio</h1>
          <p style={{ color: "var(--muted)" }}>Convocatorias, cuotas, eventos y comunicados emitidos por el Consejo Directivo.</p>
        </div>
        <span className="chip nodot" style={{ background: "#0D206018", color: "#0D2060", fontWeight: 700, alignSelf: "flex-start" }}>
          {avisos.length} aviso{avisos.length !== 1 ? "s" : ""}
        </span>
      </div>

      <AvisosGrid avisos={data} />
    </>
  )
}

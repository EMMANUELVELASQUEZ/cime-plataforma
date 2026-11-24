import { prisma } from "@/lib/prisma"
import ComunicadosGrid, { type Item } from "@/components/ComunicadosGrid"

export const dynamic = "force-dynamic"

export default async function AvisosTesoreroPage() {
  const [avisos, eventos] = await Promise.all([
    prisma.aviso.findMany({
      where: { audiencia: { in: ["todos", "tesorero"] } },
      orderBy: [{ fijado: "desc" }, { createdAt: "desc" }],
    }),
    prisma.evento.findMany({
      where: { audiencia: { in: ["todos", "tesorero"] } },
      orderBy: { fecha: "asc" },
    }),
  ])

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

  const items: Item[] = [...eventoItems, ...avisoItems]
  const total = items.length

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
          {total} comunicado{total !== 1 ? "s" : ""}
        </span>
      </div>

      <ComunicadosGrid items={items} />
    </>
  )
}

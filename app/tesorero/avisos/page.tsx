import { prisma } from "@/lib/prisma"
import ComunicadosGrid, { type Item } from "@/components/ComunicadosGrid"
import { Megaphone } from "lucide-react"
import { TesHero } from "@/components/tesoreria/TesUI"

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
      <TesHero
        eyebrow="Portal CIME · Comunicados oficiales"
        title="Avisos del"
        highlight="Colegio"
        sub="Convocatorias, cuotas, eventos y comunicados emitidos por el Consejo Directivo"
        icon={<Megaphone size={26} strokeWidth={1.6} />}
        figure={total}
        figureLabel={`comunicado${total !== 1 ? "s" : ""}`}
      />

      <ComunicadosGrid items={items} />
    </>
  )
}

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import PlanesView, { type PlanConSolicitud } from "./PlanesView"

export const dynamic = "force-dynamic"

export default async function PlanesPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string
  const userName: string = (session?.user as any)?.name ?? "Colegiado/a"

  const planes = await prisma.planPago.findMany({
    where: { activo: true },
    orderBy: { createdAt: "asc" },
    include: {
      solicitudes: {
        where: { usuarioId: userId },
        select: { id: true, estado: true, createdAt: true },
      },
    },
  })

  // Serialize dates via JSON round-trip; cast to PlanConSolicitud[] since dates become strings
  const serialized: PlanConSolicitud[] = JSON.parse(JSON.stringify(planes))

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Planes e inscripciones</h1>
          <p>Selecciona el plan de tu interés y contáctanos para coordinar tu inscripción.</p>
        </div>
      </div>
      <PlanesView planes={serialized} userId={userId} userName={userName} />
    </>
  )
}

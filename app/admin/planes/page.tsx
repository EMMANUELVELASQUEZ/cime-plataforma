import { prisma } from "@/lib/prisma"
import PlanesAdminHub, { type PlanItem } from "./PlanesAdminHub"

export const dynamic = "force-dynamic"

export default async function PlanesAdminPage() {
  const planes = await prisma.planPago.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      solicitudes: {
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              correo: true,
              numeroColegiado: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  // Serialize dates via JSON round-trip; cast to PlanItem[] since dates become strings
  const serialized: PlanItem[] = JSON.parse(JSON.stringify(planes))

  return <PlanesAdminHub data={serialized} />
}

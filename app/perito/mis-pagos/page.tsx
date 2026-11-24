import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import MisPagosView from "./MisPagosView"

export const dynamic = "force-dynamic"

export default async function MisPagosPage() {
  const session = await auth()
  if (!session) redirect("/login")
  const user = session.user as any
  if (user?.role !== "PERITO") redirect("/")

  const userId = user?.id
  if (!userId) redirect("/login")

  const pagos = await prisma.pagoCursoPerito.findMany({
    where: { usuarioId: userId },
    orderBy: [{ anio: "asc" }, { orden: "asc" }],
  })

  const dbUser = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { nombre: true, numeroPerito: true, especialidad: true },
  })

  const serializedPagos = pagos.map(pg => ({
    ...pg,
    createdAt: pg.createdAt.toISOString(),
    updatedAt: pg.updatedAt.toISOString(),
  }))

  return (
    <MisPagosView
      pagos={serializedPagos}
      nombre={dbUser?.nombre ?? session.user?.name ?? ""}
      numeroPerito={dbUser?.numeroPerito ?? null}
    />
  )
}

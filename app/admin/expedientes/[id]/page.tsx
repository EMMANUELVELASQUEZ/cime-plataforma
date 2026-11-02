import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ExpedienteClient from "./ExpedienteClient"

export const dynamic = "force-dynamic"

export default async function ExpedienteDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()

  const usuario = await prisma.usuario.findUnique({
    where: { id: params.id, rol: "COLEGIADO" },
    select: {
      id: true, nombre: true, correo: true,
      numeroColegiado: true, especialidad: true,
      estado: true, horas: true, horasMeta: true,
      vigencia: true, alta: true, ciudad: true,
      expediente: {
        include: { entradas: { orderBy: { createdAt: "desc" } } },
      },
    },
  })

  if (!usuario) notFound()

  return (
    <ExpedienteClient
      usuario={usuario}
      expediente={usuario.expediente}
      adminName={session?.user?.name ?? "Admin"}
    />
  )
}

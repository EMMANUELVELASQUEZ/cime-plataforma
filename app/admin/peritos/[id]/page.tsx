import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import EditarPeritoForm from "./EditarPeritoForm"

export const dynamic = "force-dynamic"

export default async function EditarPeritoPage({ params }: { params: { id: string } }) {
  const perito = await prisma.usuario.findUnique({
    where: { id: params.id },
    select: {
      id: true, nombre: true, correo: true, telefono: true,
      numeroPerito: true, especialidad: true, ciudad: true, cedula: true,
      estado: true, alta: true, vigencia: true, horas: true, horasMeta: true,
      rol: true,
    },
  })

  if (!perito || perito.rol !== "PERITO") notFound()

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Editar perito</h1>
          <p>{perito.nombre}</p>
        </div>
      </div>
      <EditarPeritoForm perito={{
        ...perito,
        telefono: perito.telefono ?? undefined,
        numeroPerito: perito.numeroPerito ?? undefined,
        especialidad: perito.especialidad ?? undefined,
        ciudad: perito.ciudad ?? undefined,
        cedula: perito.cedula ?? undefined,
        vigencia: perito.vigencia ?? undefined,
      }} />
    </>
  )
}

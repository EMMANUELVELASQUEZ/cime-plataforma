import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import EditarColegiadoForm from "./EditarColegiadoForm"

export const dynamic = "force-dynamic"

export default async function EditarColegiadoPage({ params }: { params: { id: string } }) {
  const colegiado = await prisma.usuario.findUnique({
    where: { id: params.id },
    select: {
      id: true, nombre: true, correo: true, numeroColegiado: true,
      especialidad: true, ciudad: true, cedula: true, telefono: true,
      estado: true, alta: true, horas: true, horasMeta: true, vigencia: true,
    },
  })

  if (!colegiado) notFound()

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Editar colegiado</h1>
          <p>{colegiado.nombre}</p>
        </div>
      </div>
      <EditarColegiadoForm colegiado={colegiado} />
    </>
  )
}

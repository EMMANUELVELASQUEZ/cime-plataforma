import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import PagosHub from "./PagosHub"

export const dynamic = "force-dynamic"

export default async function AdminPagosPage() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") notFound()

  const colegiados = await prisma.usuario.findMany({
    where: { rol: "COLEGIADO" },
    orderBy: { nombre: "asc" },
    include: {
      inscripciones: {
        include: {
          curso: {
            select: {
              id: true,
              codigo: true,
              titulo: true,
              horas: true,
              precio: true,
              fechaFin: true,
              fechaInicio: true,
              area: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      pagos: { orderBy: { createdAt: "desc" } },
    },
  })

  const data = colegiados.map((c) => ({
    id:              c.id,
    nombre:          c.nombre,
    correo:          c.correo,
    numeroColegiado: c.numeroColegiado,
    estado:          c.estado,
    pagos: c.pagos.map((p) => ({
      id:          p.id,
      concepto:    p.concepto,
      monto:       p.monto,
      estado:      p.estado,
      folio:       p.folio,
      comprobante: (p as any).comprobante ?? null,
      cursoId:     (p as any).cursoId ?? null,
      createdAt:   p.createdAt.toISOString(),
    })),
    inscripciones: c.inscripciones.map((i) => ({
      id:        i.id,
      estado:    i.estado,
      progreso:  i.progreso,
      createdAt: i.createdAt.toISOString(),
      curso: {
        id:          i.curso.id,
        codigo:      i.curso.codigo,
        titulo:      i.curso.titulo,
        horas:       i.curso.horas,
        precio:      i.curso.precio,
        area:        i.curso.area,
        fechaFin:    i.curso.fechaFin.toISOString(),
        fechaInicio: i.curso.fechaInicio.toISOString(),
      },
    })),
  }))

  return <PagosHub data={data} />
}

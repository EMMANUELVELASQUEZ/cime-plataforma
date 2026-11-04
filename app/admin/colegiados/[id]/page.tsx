import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import MemberHub from "./MemberHub"

export const dynamic = "force-dynamic"

export default async function ColegiadoAdminPage({ params }: { params: { id: string } }) {
  const member = await prisma.usuario.findUnique({
    where: { id: params.id },
    include: {
      inscripciones: {
        include: { curso: true },
        orderBy: { createdAt: "desc" },
      },
      pagos: { orderBy: { createdAt: "desc" } },
      expediente: {
        include: { entradas: { orderBy: { createdAt: "desc" } } },
      },
    },
  })

  if (!member || member.rol === "ADMIN") notFound()

  // Serialize all Date objects before passing to the client component
  const data = {
    id:              member.id,
    nombre:          member.nombre,
    correo:          member.correo,
    telefono:        member.telefono,
    numeroColegiado: member.numeroColegiado,
    especialidad:    member.especialidad,
    ciudad:          member.ciudad,
    cedula:          member.cedula,
    estado:          member.estado,
    alta:            member.alta,
    vigencia:        member.vigencia,
    horas:           member.horas,
    horasMeta:       member.horasMeta,
    createdAt:       member.createdAt.toISOString(),
    inscripciones: member.inscripciones.map(i => ({
      id:          i.id,
      progreso:    i.progreso,
      estado:      i.estado,
      folio:       i.folio,
      calificacion:i.calificacion,
      createdAt:   i.createdAt.toISOString(),
      curso: {
        id:         i.curso.id,
        codigo:     i.curso.codigo,
        titulo:     i.curso.titulo,
        area:       i.curso.area,
        horas:      i.curso.horas,
        modalidad:  i.curso.modalidad,
        instructor: i.curso.instructor,
        fechaInicio:i.curso.fechaInicio.toISOString(),
        fechaFin:   i.curso.fechaFin.toISOString(),
      },
    })),
    pagos: member.pagos.map(p => ({
      id:        p.id,
      concepto:  p.concepto,
      monto:     p.monto,
      estado:    p.estado,
      folio:     p.folio,
      createdAt: p.createdAt.toISOString(),
    })),
    expediente: member.expediente ? {
      id:            member.expediente.id,
      nombre:        member.expediente.nombre,
      instrucciones: member.expediente.instrucciones,
      estado:        member.expediente.estado,
      entradas: member.expediente.entradas.map(e => ({
        id:        e.id,
        tipo:      e.tipo,
        titulo:    e.titulo,
        contenido: e.contenido,
        autor:     e.autor,
        createdAt: e.createdAt.toISOString(),
      })),
    } : null,
  }

  return <MemberHub member={data} />
}

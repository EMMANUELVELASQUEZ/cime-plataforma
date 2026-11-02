import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { leccionId } = await req.json()
  if (!leccionId) return NextResponse.json({ error: "leccionId requerido" }, { status: 400 })

  const inscripcion = await prisma.inscripcionCurso.findUnique({
    where: { usuarioId_cursoId: { usuarioId: userId, cursoId: params.id } },
  })
  if (!inscripcion) return NextResponse.json({ error: "No inscrito" }, { status: 403 })

  await prisma.leccionCompletada.upsert({
    where: { inscripcionId_leccionId: { inscripcionId: inscripcion.id, leccionId } },
    create: { inscripcionId: inscripcion.id, leccionId },
    update: {},
  })

  const totalLecciones = await prisma.leccion.count({
    where: { modulo: { cursoId: params.id } },
  })
  const completadas = await prisma.leccionCompletada.count({
    where: { inscripcionId: inscripcion.id },
  })

  const progreso = totalLecciones > 0 ? Math.round((completadas / totalLecciones) * 100) : 0
  const estado = progreso === 100 ? "COMPLETADO" : completadas > 0 ? "EN_CURSO" : "INSCRITO"

  await prisma.inscripcionCurso.update({
    where: { id: inscripcion.id },
    data: { progreso, estado },
  })

  // Sync acredited hours on the user record
  const todasInscripciones = await prisma.inscripcionCurso.findMany({
    where: { usuarioId: userId },
    include: { curso: { select: { horas: true } } },
  })
  const horasAcreditadas = Math.round(
    todasInscripciones.reduce((sum, i) => sum + (i.curso.horas * i.progreso / 100), 0)
  )
  await prisma.usuario.update({
    where: { id: userId },
    data: { horas: horasAcreditadas },
  })

  return NextResponse.json({ progreso, completadas, total: totalLecciones })
}

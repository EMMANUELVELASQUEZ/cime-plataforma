import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const usuarioId = (session.user as any).id
  const cursoId = params.id

  const curso = await prisma.curso.findUnique({ where: { id: cursoId }, include: { inscritos: true } })
  if (!curso) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 })
  if (curso.estado === "COMPLETADO") return NextResponse.json({ error: "Este curso ya finalizó" }, { status: 400 })
  if (curso.inscritos.length >= curso.cupo) return NextResponse.json({ error: "El curso está lleno" }, { status: 400 })

  const yaInscrito = curso.inscritos.some(i => i.usuarioId === usuarioId)
  if (yaInscrito) return NextResponse.json({ error: "Ya estás inscrito en este curso" }, { status: 400 })

  const inscripcion = await prisma.inscripcionCurso.create({
    data: { usuarioId, cursoId, estado: "INSCRITO" },
  })

  if (curso.inscritos.length + 1 >= curso.cupo) {
    await prisma.curso.update({ where: { id: cursoId }, data: { estado: "LLENO" } })
  }

  return NextResponse.json(inscripcion, { status: 201 })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const usuarioId = (session.user as any).id
  const inscripcion = await prisma.inscripcionCurso.findFirst({ where: { cursoId: params.id, usuarioId } })
  if (!inscripcion) return NextResponse.json({ error: "No inscrito" }, { status: 404 })

  await prisma.inscripcionCurso.delete({ where: { id: inscripcion.id } })

  await prisma.curso.update({ where: { id: params.id }, data: { estado: "ABIERTO" } })

  return NextResponse.json({ ok: true })
}

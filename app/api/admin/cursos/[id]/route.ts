import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  return session && (session.user as any)?.role === "ADMIN" ? session : null
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { titulo, area, modalidad, horas, precio, cupo, fechaInicio, fechaFin, instructor, estado } = await req.json()
  const curso = await prisma.curso.update({
    where: { id: params.id },
    data: {
      ...(titulo && { titulo }),
      ...(area && { area }),
      ...(modalidad && { modalidad }),
      ...(horas !== undefined && { horas: Number(horas) }),
      ...(precio !== undefined && { precio: Number(precio) }),
      ...(cupo !== undefined && { cupo: Number(cupo) }),
      ...(fechaInicio && { fechaInicio: new Date(fechaInicio) }),
      ...(fechaFin && { fechaFin: new Date(fechaFin) }),
      ...(instructor !== undefined && { instructor }),
      ...(estado && { estado }),
    },
  })
  return NextResponse.json(curso)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  await prisma.curso.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}

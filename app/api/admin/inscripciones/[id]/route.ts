import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.folio       !== undefined) data.folio       = body.folio
  if (body.estado      !== undefined) data.estado      = body.estado
  if (body.progreso    !== undefined) data.progreso    = Number(body.progreso)
  if (body.calificacion!== undefined) data.calificacion= Number(body.calificacion)

  try {
    const updated = await prisma.inscripcionCurso.update({ where: { id: params.id }, data })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Error al actualizar inscripción" }, { status: 500 })
  }
}

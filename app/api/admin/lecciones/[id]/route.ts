import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  return session && (session.user as any)?.role === "ADMIN" ? session : null
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  try {
    const { titulo, descripcion } = await req.json()
    const leccion = await prisma.leccion.update({
      where: { id: params.id },
      data: {
        ...(titulo?.trim() && { titulo: titulo.trim() }),
        ...(descripcion !== undefined && { descripcion: descripcion?.trim() || null }),
      },
    })
    return NextResponse.json(leccion)
  } catch {
    return NextResponse.json({ error: "Error al actualizar lección" }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  try {
    await prisma.leccion.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error al eliminar lección" }, { status: 500 })
  }
}

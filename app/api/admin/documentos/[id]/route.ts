import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { del } from "@vercel/blob"

async function requireAdmin() {
  const session = await auth()
  return session && (session.user as any)?.role === "ADMIN" ? session : null
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { nombre, descripcion, categoria } = await req.json()
  try {
    const doc = await prisma.documentoAdmin.update({
      where: { id: params.id },
      data: { nombre: nombre?.trim(), descripcion: descripcion?.trim() || null, categoria: categoria || "General" }
    })
    return NextResponse.json(doc)
  } catch {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  try {
    const doc = await prisma.documentoAdmin.findUnique({ where: { id: params.id } })
    if (doc) {
      await del(doc.url)
      await prisma.documentoAdmin.delete({ where: { id: params.id } })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
  }
}

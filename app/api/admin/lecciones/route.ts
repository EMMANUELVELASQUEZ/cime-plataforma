import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  return session && (session.user as any)?.role === "ADMIN" ? session : null
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { moduloId, titulo, descripcion } = await req.json()
  if (!moduloId || !titulo?.trim()) return NextResponse.json({ error: "Faltan campos" }, { status: 400 })

  try {
    const count = await prisma.leccion.count({ where: { moduloId } })
    const leccion = await prisma.leccion.create({
      data: { moduloId, titulo: titulo.trim(), descripcion: descripcion?.trim() || null, orden: count + 1 },
      include: { recursos: { orderBy: { orden: "asc" } } },
    })
    return NextResponse.json(leccion, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al crear lección" }, { status: 500 })
  }
}

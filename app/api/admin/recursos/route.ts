import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  return session && (session.user as any)?.role === "ADMIN" ? session : null
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { leccionId, tipo, titulo, url, contenido, tamano } = await req.json()
  if (!leccionId || !tipo || !titulo?.trim()) return NextResponse.json({ error: "Faltan campos" }, { status: 400 })

  try {
    const count = await prisma.recursoLeccion.count({ where: { leccionId } })
    const recurso = await prisma.recursoLeccion.create({
      data: {
        leccionId,
        tipo,
        titulo: titulo.trim(),
        url: url || null,
        contenido: contenido || null,
        tamano: tamano ? Number(tamano) : null,
        orden: count + 1,
      },
    })
    return NextResponse.json(recurso, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al crear recurso" }, { status: 500 })
  }
}

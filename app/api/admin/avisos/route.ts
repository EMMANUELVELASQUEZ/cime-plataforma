import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  return session && (session.user as any)?.role === "ADMIN" ? session : null
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { titulo, contenido, categoria, tipo, fijado, imagen } = await req.json()
  if (!titulo || !contenido) return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
  try {
    const aviso = await prisma.aviso.create({
      data: { titulo, contenido, categoria: categoria ?? "Evento", tipo: tipo ?? "conferencia", fijado: !!fijado, imagen: imagen ?? null },
    })
    return NextResponse.json(aviso, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al crear aviso" }, { status: 500 })
  }
}

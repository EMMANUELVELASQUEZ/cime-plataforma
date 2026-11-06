import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  return session && (session.user as any)?.role === "ADMIN" ? session : null
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { tipo, titulo, contenido, archivo } = await req.json()
  if (!titulo) return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 })

  try {
    const entrada = await prisma.entradaExpediente.create({
      data: {
        expedienteId: params.id,
        tipo: tipo ?? "NOTA",
        titulo: titulo.trim(),
        contenido: contenido?.trim() || null,
        archivo: archivo ?? null,
        autor: session.user?.name ?? "Admin",
      },
    })

    await prisma.expediente.update({ where: { id: params.id }, data: {} })

    return NextResponse.json(entrada, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al crear entrada" }, { status: 500 })
  }
}

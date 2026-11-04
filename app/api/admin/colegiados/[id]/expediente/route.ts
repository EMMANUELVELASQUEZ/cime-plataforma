import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { tipo, titulo, contenido, autor } = await req.json()
  if (!titulo) return NextResponse.json({ error: "Título requerido" }, { status: 400 })

  try {
    let expediente = await prisma.expediente.findUnique({ where: { usuarioId: params.id } })
    if (!expediente) {
      const user = await prisma.usuario.findUnique({ where: { id: params.id }, select: { nombre: true } })
      expediente = await prisma.expediente.create({
        data: { usuarioId: params.id, nombre: user?.nombre ?? "Sin nombre" },
      })
    }

    const entrada = await prisma.entradaExpediente.create({
      data: { expedienteId: expediente.id, tipo: tipo ?? "NOTA", titulo, contenido, autor },
    })
    return NextResponse.json(entrada, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al agregar entrada" }, { status: 500 })
  }
}

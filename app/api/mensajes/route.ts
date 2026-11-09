import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const userId = (session.user as any)?.id as string

  // Mark admin messages as read
  await prisma.mensaje.updateMany({
    where: { usuarioId: userId, deAdmin: true, leido: false },
    data: { leido: true },
  })

  const mensajes = await prisma.mensaje.findMany({
    where: { usuarioId: userId },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(mensajes)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const userId = (session.user as any)?.id as string

  const body = await req.json()
  const contenido = (body.contenido ?? "").trim()
  if (!contenido) return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 })

  const mensaje = await prisma.mensaje.create({
    data: { contenido, deAdmin: false, usuarioId: userId },
  })

  return NextResponse.json(mensaje, { status: 201 })
}

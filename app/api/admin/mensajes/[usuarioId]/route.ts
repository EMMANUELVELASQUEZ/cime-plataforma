import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: { usuarioId: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if ((session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Prohibido" }, { status: 403 })

  const { usuarioId } = params

  // Mark colegiado messages as read
  await prisma.mensaje.updateMany({
    where: { usuarioId, deAdmin: false, leido: false },
    data: { leido: true },
  })

  const mensajes = await prisma.mensaje.findMany({
    where: { usuarioId },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(mensajes)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { usuarioId: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if ((session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Prohibido" }, { status: 403 })

  const { usuarioId } = params
  const body = await req.json()
  const contenido = (body.contenido ?? "").trim()
  if (!contenido) return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 })

  const mensaje = await prisma.mensaje.create({
    data: { contenido, deAdmin: true, usuarioId },
  })

  return NextResponse.json(mensaje, { status: 201 })
}

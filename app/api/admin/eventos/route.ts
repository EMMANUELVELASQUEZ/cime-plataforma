import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  return session && (session.user as any)?.role === "ADMIN" ? session : null
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { titulo, fecha, hora, lugar, tipo } = await req.json()
  if (!titulo || !fecha) return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
  const evento = await prisma.evento.create({ data: { titulo, fecha: new Date(fecha), hora: hora ?? "18:00", lugar: lugar ?? "", tipo } })
  return NextResponse.json(evento, { status: 201 })
}

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

async function checkAdmin() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") return null
  return session
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  const items = await prisma.formacionPerito.findMany({
    where: { usuarioId: params.id },
    orderBy: [{ anio: "asc" }, { orden: "asc" }, { createdAt: "asc" }],
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  const { anio, mes, nombre, estado, orden } = await req.json()
  if (!nombre || !anio) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
  const item = await prisma.formacionPerito.create({
    data: {
      usuarioId: params.id,
      anio: Number(anio),
      mes: mes || null,
      nombre,
      estado: estado || "REGISTRADO",
      orden: Number(orden) || 0,
    },
  })
  return NextResponse.json(item, { status: 201 })
}

export async function DELETE(req: NextRequest, _ctx: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  const { id } = await req.json()
  await prisma.formacionPerito.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

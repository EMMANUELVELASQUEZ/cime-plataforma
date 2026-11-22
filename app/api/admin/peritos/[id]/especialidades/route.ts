import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

async function checkAdmin() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN")
    return null
  return session
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  const especialidades = await prisma.especialidadPerito.findMany({
    where: { usuarioId: params.id },
    orderBy: { numero: "asc" },
  })
  return NextResponse.json(especialidades)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  const { numero, nombre, claveRegistro } = await req.json()
  if (!nombre || !claveRegistro) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
  const item = await prisma.especialidadPerito.create({
    data: { usuarioId: params.id, numero: Number(numero) || 1, nombre, claveRegistro },
  })
  return NextResponse.json(item, { status: 201 })
}

export async function DELETE(req: NextRequest, { params: _ }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  const { id } = await req.json()
  await prisma.especialidadPerito.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

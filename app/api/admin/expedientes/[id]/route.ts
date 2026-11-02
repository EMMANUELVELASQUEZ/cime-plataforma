import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  return session && (session.user as any)?.role === "ADMIN" ? session : null
}

// GET /api/admin/expedientes/[id]
export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const exp = await prisma.expediente.findUnique({
    where: { id: params.id },
    include: {
      usuario: { select: { nombre: true, numeroColegiado: true, especialidad: true, estado: true, horas: true, vigencia: true } },
      entradas: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!exp) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  return NextResponse.json(exp)
}

// PATCH /api/admin/expedientes/[id]
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.nombre       !== undefined) data.nombre       = body.nombre.trim()
  if (body.instrucciones!== undefined) data.instrucciones= body.instrucciones?.trim() || null
  if (body.estado       !== undefined) data.estado       = body.estado

  const exp = await prisma.expediente.update({
    where: { id: params.id },
    data,
    include: { entradas: { orderBy: { createdAt: "desc" } }, usuario: { select: { nombre: true, numeroColegiado: true, especialidad: true, estado: true } } },
  })

  return NextResponse.json(exp)
}

// DELETE /api/admin/expedientes/[id]
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  await prisma.expediente.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}

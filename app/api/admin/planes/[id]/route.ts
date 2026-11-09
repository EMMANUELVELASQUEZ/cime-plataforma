import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") return null
  return session
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  try {
    const body = await req.json()
    const { nombre, descripcion, monto, iva, tipo, activo } = body
    const plan = await prisma.planPago.update({
      where: { id: params.id },
      data: {
        ...(nombre    !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(monto     !== undefined && { monto: Number(monto) }),
        ...(iva       !== undefined && { iva: Boolean(iva) }),
        ...(tipo      !== undefined && { tipo }),
        ...(activo    !== undefined && { activo: Boolean(activo) }),
      },
    })
    return NextResponse.json(plan)
  } catch {
    return NextResponse.json({ error: "Error al actualizar plan" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  try {
    await prisma.planPago.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error al eliminar plan" }, { status: 500 })
  }
}

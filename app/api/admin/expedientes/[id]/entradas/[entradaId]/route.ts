import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  return session && (session.user as any)?.role === "ADMIN" ? session : null
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string; entradaId: string } }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  try {
    await prisma.entradaExpediente.delete({ where: { id: params.entradaId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error al eliminar entrada" }, { status: 500 })
  }
}

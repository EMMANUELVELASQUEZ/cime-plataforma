import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  return session && (session.user as any)?.role === "ADMIN" ? session : null
}

// DELETE /api/admin/expedientes/[id]/entradas/[entradaId]
export async function DELETE(
  _: Request,
  { params }: { params: { id: string; entradaId: string } }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  await prisma.entradaExpediente.delete({ where: { id: params.entradaId } })
  return NextResponse.json({ ok: true })
}

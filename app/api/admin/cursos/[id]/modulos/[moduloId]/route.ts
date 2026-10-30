import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  return session && (session.user as any)?.role === "ADMIN" ? session : null
}

export async function PATCH(req: Request, { params }: { params: { id: string; moduloId: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { titulo } = await req.json()
  const modulo = await prisma.moduloCurso.update({
    where: { id: params.moduloId },
    data: { ...(titulo?.trim() && { titulo: titulo.trim() }) },
  })
  return NextResponse.json(modulo)
}

export async function DELETE(_: Request, { params }: { params: { id: string; moduloId: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  await prisma.moduloCurso.delete({ where: { id: params.moduloId } })
  return NextResponse.json({ ok: true })
}

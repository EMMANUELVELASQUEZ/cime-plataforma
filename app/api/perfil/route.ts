import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const userId = (session.user as any)?.id
  const { telefono, password } = await req.json()

  const data: Record<string, unknown> = {}
  if (telefono !== undefined) data.telefono = telefono || null
  if (password && password.length >= 8) data.password = await bcrypt.hash(password, 12)

  await prisma.usuario.update({ where: { id: userId }, data })
  return NextResponse.json({ ok: true })
}

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const userId = (session.user as any)?.id as string
  const role   = (session.user as any)?.role as string

  let count: number
  if (role === "ADMIN") {
    count = await prisma.mensaje.count({
      where: { deAdmin: false, leido: false },
    })
  } else {
    count = await prisma.mensaje.count({
      where: { usuarioId: userId, deAdmin: true, leido: false },
    })
  }

  return NextResponse.json({ count })
}

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const userId = (session.user as any)?.id
  try {
    const planes = await prisma.planPago.findMany({
      where: { activo: true },
      orderBy: { createdAt: "asc" },
      include: {
        solicitudes: {
          where: { usuarioId: userId },
          select: { id: true, estado: true, createdAt: true },
        },
      },
    })
    return NextResponse.json(planes)
  } catch {
    return NextResponse.json({ error: "Error al obtener planes" }, { status: 500 })
  }
}

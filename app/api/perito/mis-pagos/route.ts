import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const user = session.user as any
  if (user?.role !== "PERITO") {
    return NextResponse.json({ error: "Acceso restringido a peritos" }, { status: 403 })
  }

  const userId = user?.id
  if (!userId) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
  }

  try {
    const pagos = await prisma.pagoCursoPerito.findMany({
      where: { usuarioId: userId },
      orderBy: [{ anio: "asc" }, { orden: "asc" }],
    })
    return NextResponse.json(pagos)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Error al obtener pagos" }, { status: 500 })
  }
}

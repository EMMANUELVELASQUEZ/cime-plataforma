import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") return null
  return session
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const planes = await prisma.planPago.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { solicitudes: true } } },
  })

  return NextResponse.json(planes)
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const { nombre, descripcion, monto, iva, tipo } = body

  if (!nombre || monto == null) {
    return NextResponse.json({ error: "Nombre y monto son obligatorios." }, { status: 400 })
  }

  const plan = await prisma.planPago.create({
    data: {
      nombre,
      descripcion: descripcion ?? null,
      monto: Number(monto),
      iva: Boolean(iva),
      tipo: tipo ?? "OTRO",
    },
  })

  return NextResponse.json(plan, { status: 201 })
}

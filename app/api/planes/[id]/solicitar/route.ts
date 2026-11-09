import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const userId = (session.user as any)?.id
  try {
    const plan = await prisma.planPago.findUnique({ where: { id: params.id } })
    if (!plan || !plan.activo)
      return NextResponse.json({ error: "Plan no disponible" }, { status: 404 })
    const solicitud = await prisma.solicitudPlan.upsert({
      where:  { planId_usuarioId: { planId: params.id, usuarioId: userId } },
      create: { planId: params.id, usuarioId: userId, estado: "PENDIENTE" },
      update: { estado: "PENDIENTE", notas: null },
    })
    return NextResponse.json(solicitud, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al procesar solicitud" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") return null
  return session
}

const ESTADOS_VALIDOS = ["PENDIENTE", "CONTACTADO", "ACTIVO", "RECHAZADO"]

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  try {
    const body = await req.json()
    const { estado, notas } = body
    if (estado && !ESTADOS_VALIDOS.includes(estado))
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
    const solicitud = await prisma.solicitudPlan.update({
      where: { id: params.id },
      data: {
        ...(estado !== undefined && { estado }),
        ...(notas  !== undefined && { notas }),
      },
      include: {
        usuario: { select: { nombre: true, numeroColegiado: true } },
        plan:    { select: { nombre: true } },
      },
    })
    return NextResponse.json(solicitud)
  } catch {
    return NextResponse.json({ error: "Error al actualizar solicitud" }, { status: 500 })
  }
}

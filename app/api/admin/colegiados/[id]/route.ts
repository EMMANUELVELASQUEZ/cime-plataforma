import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { EstadoColegiado } from "@prisma/client"

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") return null
  return session
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const { password, ...rest } = body

  const updateData: Record<string, unknown> = {
    nombre: rest.nombre,
    correo: rest.correo?.toLowerCase(),
    numeroColegiado: rest.numeroColegiado || null,
    especialidad: rest.especialidad || null,
    ciudad: rest.ciudad || null,
    cedula: rest.cedula || null,
    telefono: rest.telefono || null,
    estado: (rest.estado as EstadoColegiado),
    alta: rest.alta,
    horas: rest.horas,
    horasMeta: rest.horasMeta,
    vigencia: rest.vigencia || null,
  }

  if (password && password.length >= 8) {
    updateData.password = await bcrypt.hash(password, 12)
  }

  try {
    const usuario = await prisma.usuario.update({
      where: { id: params.id },
      data: updateData,
    })
    return NextResponse.json({ id: usuario.id })
  } catch {
    return NextResponse.json({ error: "Error al actualizar." }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    await prisma.usuario.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error al eliminar." }, { status: 500 })
  }
}

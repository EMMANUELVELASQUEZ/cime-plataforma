import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") return null
  return session
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const { contenido, roles } = body as { contenido: string; roles?: string[] }

  if (!contenido?.trim()) {
    return NextResponse.json({ error: "El contenido es obligatorio." }, { status: 400 })
  }

  const targetRoles = roles && roles.length > 0 ? roles : ["COLEGIADO", "PERITO"]

  try {
    const destinatarios = await prisma.usuario.findMany({
      where: { rol: { in: targetRoles as any[] } },
      select: { id: true },
    })

    if (destinatarios.length === 0) {
      return NextResponse.json({ error: "No hay destinatarios para los roles seleccionados." }, { status: 400 })
    }

    await prisma.mensaje.createMany({
      data: destinatarios.map(u => ({
        usuarioId: u.id,
        contenido: contenido.trim(),
        deAdmin: true,
        leido: false,
      })),
    })

    return NextResponse.json({ enviados: destinatarios.length })
  } catch {
    return NextResponse.json({ error: "Error al enviar el comunicado." }, { status: 500 })
  }
}

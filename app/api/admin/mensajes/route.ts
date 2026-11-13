import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if ((session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Prohibido" }, { status: 403 })

  // All colegiados + peritos + their messages
  const colegiados = await prisma.usuario.findMany({
    where: { rol: { in: ["COLEGIADO", "PERITO"] } },
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      numeroColegiado: true,
      numeroPerito: true,
      rol: true,
      mensajes: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { contenido: true, createdAt: true, deAdmin: true },
      },
    },
  })

  // Unread count per member (messages from member not yet read)
  const noLeidosPorUsuario = await prisma.mensaje.groupBy({
    by: ["usuarioId"],
    where: { deAdmin: false, leido: false },
    _count: { id: true },
  })
  const noLeidosMap = new Map(noLeidosPorUsuario.map(r => [r.usuarioId, r._count.id]))

  const result = colegiados.map(c => ({
    usuarioId:       c.id,
    nombre:          c.nombre,
    numeroColegiado: c.numeroColegiado ?? null,
    numeroPerito:    (c as any).numeroPerito ?? null,
    rol:             (c as any).rol,
    ultimoMensaje:   c.mensajes[0]?.contenido ?? null,
    ultimaFecha:     c.mensajes[0]?.createdAt ?? null,
    noLeidos:        noLeidosMap.get(c.id) ?? 0,
  }))

  // Sort: colegiados with unread first, then by last message date, then alphabetically
  result.sort((a, b) => {
    if (b.noLeidos !== a.noLeidos) return b.noLeidos - a.noLeidos
    if (a.ultimaFecha && b.ultimaFecha) return new Date(b.ultimaFecha).getTime() - new Date(a.ultimaFecha).getTime()
    if (a.ultimaFecha) return -1
    if (b.ultimaFecha) return 1
    return a.nombre.localeCompare(b.nombre)
  })

  return NextResponse.json(result)
}

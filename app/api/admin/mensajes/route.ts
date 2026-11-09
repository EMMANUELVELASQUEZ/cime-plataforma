import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if ((session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Prohibido" }, { status: 403 })

  // Find all colegiados that have at least one message
  const mensajes = await prisma.mensaje.findMany({
    orderBy: { createdAt: "desc" },
    include: { usuario: { select: { id: true, nombre: true, numeroColegiado: true } } },
  })

  // Group by usuarioId
  const map = new Map<
    string,
    {
      usuarioId:        string
      nombre:           string
      numeroColegiado:  string | null
      ultimoMensaje:    string
      ultimaFecha:      Date
      noLeidos:         number
    }
  >()

  for (const m of mensajes) {
    if (!map.has(m.usuarioId)) {
      map.set(m.usuarioId, {
        usuarioId:       m.usuarioId,
        nombre:          m.usuario.nombre,
        numeroColegiado: m.usuario.numeroColegiado ?? null,
        ultimoMensaje:   m.contenido,
        ultimaFecha:     m.createdAt,
        noLeidos:        0,
      })
    }
    // Count unread colegiado messages (deAdmin=false, leido=false)
    if (!m.deAdmin && !m.leido) {
      const entry = map.get(m.usuarioId)!
      entry.noLeidos += 1
    }
  }

  // Most-recent message is first (already sorted desc, first occurrence = latest)
  const conversations = Array.from(map.values())

  return NextResponse.json(conversations)
}

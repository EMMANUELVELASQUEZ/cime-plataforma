import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireTesoreroOrAdmin() {
  const session = await auth()
  if (!session) return null
  const role = (session.user as any)?.role
  if (role !== "ADMIN" && role !== "CONTADOR_TESORERO") return null
  return session
}

export async function GET() {
  if (!await requireTesoreroOrAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const peritos = await prisma.usuario.findMany({
      where: { rol: "PERITO" },
      select: {
        id: true,
        nombre: true,
        numeroPerito: true,
        especialidad: true,
        estado: true,
        pagosCurso: {
          orderBy: [{ anio: "asc" }, { orden: "asc" }],
        },
      },
      orderBy: { nombre: "asc" },
    })

    const result = peritos.map((p) => {
      const pagos = p.pagosCurso
      const cuota2025 = pagos
        .filter((pg) => pg.anio === 2025)
        .reduce((s, pg) => s + pg.monto, 0)
      const cuota2026 = pagos
        .filter((pg) => pg.anio === 2026)
        .reduce((s, pg) => s + pg.monto, 0)
      const total = pagos.reduce((s, pg) => s + pg.monto, 0)
      const pagado = pagos.reduce((s, pg) => s + pg.pagado, 0)
      const saldo = pagos.reduce((s, pg) => s + pg.saldo, 0)

      return {
        usuarioId: p.id,
        nombre: p.nombre,
        numeroPerito: p.numeroPerito,
        especialidad: p.especialidad,
        estado: p.estado,
        pagos,
        cuota2025,
        cuota2026,
        total,
        pagado,
        saldo,
      }
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Error al obtener pagos" }, { status: 500 })
  }
}

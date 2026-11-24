import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import CobranzaPeritosHub from "./CobranzaPeritosHub"

export const dynamic = "force-dynamic"

export default async function CobranzaPeritosPage() {
  const session = await auth()
  if (!session) redirect("/login")
  const role = (session.user as any)?.role
  if (role !== "ADMIN" && role !== "CONTADOR_TESORERO") redirect("/")

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

  const data = peritos.map((p) => {
    const pagos = p.pagosCurso
    const total = pagos.reduce((s, pg) => s + pg.monto, 0)
    const pagado = pagos.reduce((s, pg) => s + pg.pagado, 0)
    const saldo = pagos.reduce((s, pg) => s + pg.saldo, 0)
    const cuota2025 = pagos.filter((pg) => pg.anio === 2025).reduce((s, pg) => s + pg.monto, 0)
    const cuota2026 = pagos.filter((pg) => pg.anio === 2026).reduce((s, pg) => s + pg.monto, 0)

    return {
      usuarioId: p.id,
      nombre: p.nombre,
      numeroPerito: p.numeroPerito,
      especialidad: p.especialidad,
      estado: p.estado as string,
      pagos: pagos.map(pg => ({
        ...pg,
        createdAt: pg.createdAt.toISOString(),
        updatedAt: pg.updatedAt.toISOString(),
      })),
      cuota2025,
      cuota2026,
      total,
      pagado,
      saldo,
    }
  })

  return <CobranzaPeritosHub initialData={data} />
}

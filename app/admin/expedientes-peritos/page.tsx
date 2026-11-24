import { prisma } from "@/lib/prisma"
import ExpedientesAdminHub from "./ExpedientesAdminHub"

export const dynamic = "force-dynamic"

export type PeritoConConteos = {
  id: string
  nombre: string
  numeroPerito: number | null
  especialidad: string | null
  estado: string
  _count: { especialidadesPerito: number; formacionPerito: number }
}

export default async function ExpedientesPeritosPage() {
  const raw = await prisma.usuario.findMany({
    where: { rol: "PERITO" },
    select: {
      id: true,
      nombre: true,
      numeroPerito: true,
      especialidad: true,
      estado: true,
      _count: { select: { especialidadesPerito: true, formacionPerito: true } },
    },
    orderBy: { nombre: "asc" },
  })
  const peritos: PeritoConConteos[] = JSON.parse(JSON.stringify(raw))

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Expedientes de Peritos</h1>
          <p>Gestión de especialidades, pericias y formación profesional por perito.</p>
        </div>
      </div>
      <ExpedientesAdminHub peritos={peritos} />
    </>
  )
}

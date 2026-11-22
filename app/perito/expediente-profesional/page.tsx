import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ExpedienteProView from "./ExpedienteProView"

export const dynamic = "force-dynamic"

export default async function ExpedienteProfesionalPage() {
  const session = await auth()
  if (!session) redirect("/login")
  const userId = (session.user as any)?.id

  const [usuario, especialidades, formacion, expediente] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        nombre: true,
        numeroPerito: true,
        especialidad: true,
        alta: true,
        vigencia: true,
        estado: true,
      },
    }),
    prisma.especialidadPerito.findMany({
      where: { usuarioId: userId },
      orderBy: { numero: "asc" },
    }),
    prisma.formacionPerito.findMany({
      where: { usuarioId: userId },
      orderBy: [{ anio: "asc" }, { orden: "asc" }, { createdAt: "asc" }],
    }),
    prisma.expediente.findUnique({
      where: { usuarioId: userId },
      select: { instrucciones: true },
    }),
  ])

  if (!usuario) redirect("/login")

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Expediente Profesional</h1>
          <p>Registro de pericias, especialidades y formación — CIME Veracruz 2025–2026</p>
        </div>
        <span className="chip nodot" style={{ background: "var(--surface-raised)", color: "var(--muted)", alignSelf: "flex-start" }}>
          <svg style={{ width: 14, height: 14, marginRight: 4, verticalAlign: "middle" }} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 9h.01" /><path d="M11 12h1v4h1" /></svg>
          Solo lectura
        </span>
      </div>
      <ExpedienteProView
        usuario={usuario}
        especialidades={especialidades.map(e => ({ ...e, createdAt: e.createdAt.toISOString() }))}
        formacion={formacion.map(f => ({ ...f, createdAt: f.createdAt.toISOString() }))}
        observaciones={expediente?.instrucciones ?? null}
      />
    </>
  )
}

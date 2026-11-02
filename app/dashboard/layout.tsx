import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import AppShell from "@/components/AppShell"
import type { AppShellUser } from "@/components/AppShell"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  const userId = (session.user as any)?.id

  const dbUser = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      horasMeta:    true,
      vigencia:     true,
      estado:       true,
      especialidad: true,
      inscripciones: {
        select: {
          progreso: true,
          estado:   true,
          createdAt: true,
          curso: { select: { titulo: true, horas: true, area: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  const inscripciones = dbUser?.inscripciones ?? []

  // Derive acredited hours from actual course completion (progreso = 0-100 %)
  const horasAcreditadas = Math.round(
    inscripciones.reduce((sum, i) => sum + (i.curso.horas * i.progreso / 100), 0)
  )

  // Sort: EN_CURSO first → INSCRITO → COMPLETADO
  const cursosResumen = [
    ...inscripciones.filter(i => i.estado === "EN_CURSO"),
    ...inscripciones.filter(i => i.estado === "INSCRITO"),
    ...inscripciones.filter(i => i.estado === "COMPLETADO"),
  ].map(i => ({
    titulo:  i.curso.titulo,
    horas:   i.curso.horas,
    progreso: i.progreso,
    area:    i.curso.area as string,
    estado:  i.estado   as string,
  }))

  const user: AppShellUser = {
    name:            session.user?.name,
    email:           session.user?.email,
    role:            (session.user as any)?.role,
    numeroColegiado: (session.user as any)?.numeroColegiado,
    horas:           horasAcreditadas,
    horasMeta:       dbUser?.horasMeta    ?? 60,
    vigencia:        dbUser?.vigencia     ?? null,
    estado:          dbUser?.estado       ?? "VIGENTE",
    especialidad:    dbUser?.especialidad ?? null,
    cursosResumen,
  }

  return (
    <AppShell user={user}>
      {children}
    </AppShell>
  )
}

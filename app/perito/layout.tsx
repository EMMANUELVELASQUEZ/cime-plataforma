import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import AppShell from "@/components/AppShell"
import type { AppShellUser } from "@/components/AppShell"

export const dynamic = "force-dynamic"

export default async function PeritoLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  if ((session.user as any)?.role !== "PERITO") redirect("/")

  const userId = (session.user as any)?.id

  const [dbUser, avisosCount, mensajesNoLeidos] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        horasMeta: true, vigencia: true, estado: true,
        especialidad: true, numeroPerito: true,
        inscripciones: {
          select: { progreso: true, estado: true, createdAt: true,
            curso: { select: { titulo: true, horas: true, area: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.aviso.count(),
    prisma.mensaje.count({ where: { usuarioId: userId, deAdmin: true, leido: false } }),
  ])

  const inscripciones = dbUser?.inscripciones ?? []
  const horasAcreditadas = Math.round(
    inscripciones.reduce((sum, i) => sum + (i.curso.horas * i.progreso / 100), 0)
  )
  const cursosResumen = inscripciones.map(i => ({
    titulo: i.curso.titulo, horas: i.curso.horas,
    progreso: i.progreso, area: i.curso.area as string, estado: i.estado as string,
  }))

  const user: AppShellUser = {
    name:            session.user?.name,
    email:           session.user?.email,
    role:            (session.user as any)?.role,
    numeroColegiado: null,
    numeroPerito:    dbUser?.numeroPerito ?? null,
    horas:           horasAcreditadas,
    horasMeta:       dbUser?.horasMeta ?? 60,
    vigencia:        dbUser?.vigencia  ?? null,
    estado:          dbUser?.estado    ?? "VIGENTE",
    especialidad:    dbUser?.especialidad ?? null,
    cursosResumen,
    avisosCount,
    mensajesNoLeidos: mensajesNoLeidos > 0 ? mensajesNoLeidos : undefined,
  }

  return <AppShell user={user}>{children}</AppShell>
}

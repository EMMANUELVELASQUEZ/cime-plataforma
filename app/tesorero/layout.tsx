import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import AppShell from "@/components/AppShell"
import type { AppShellUser } from "@/components/AppShell"

export const dynamic = "force-dynamic"

export default async function TesoreronLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  if ((session.user as any)?.role !== "CONTADOR_TESORERO") redirect("/")

  const userId = (session.user as any)?.id

  const [dbUser, avisosCount, mensajesNoLeidos] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: userId },
      select: { horasMeta: true, vigencia: true, estado: true, especialidad: true },
    }),
    prisma.aviso.count(),
    prisma.mensaje.count({ where: { usuarioId: userId, deAdmin: true, leido: false } }),
  ])

  const user: AppShellUser = {
    name:            session.user?.name,
    email:           session.user?.email,
    role:            (session.user as any)?.role,
    numeroColegiado: null,
    numeroPerito:    null,
    horas:           0,
    horasMeta:       0,
    vigencia:        dbUser?.vigencia  ?? null,
    estado:          dbUser?.estado    ?? "VIGENTE",
    especialidad:    dbUser?.especialidad ?? null,
    cursosResumen:   [],
    avisosCount,
    mensajesNoLeidos: mensajesNoLeidos > 0 ? mensajesNoLeidos : undefined,
  }

  return <AppShell user={user}>{children}</AppShell>
}

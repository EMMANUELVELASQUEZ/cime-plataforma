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
      horas:       true,
      horasMeta:   true,
      vigencia:    true,
      estado:      true,
      especialidad:true,
    },
  })

  const user: AppShellUser = {
    name:            session.user?.name,
    email:           session.user?.email,
    role:            (session.user as any)?.role,
    numeroColegiado: (session.user as any)?.numeroColegiado,
    horas:           dbUser?.horas        ?? 0,
    horasMeta:       dbUser?.horasMeta    ?? 60,
    vigencia:        dbUser?.vigencia     ?? null,
    estado:          dbUser?.estado       ?? "VIGENTE",
    especialidad:    dbUser?.especialidad ?? null,
  }

  return (
    <AppShell user={user}>
      {children}
    </AppShell>
  )
}

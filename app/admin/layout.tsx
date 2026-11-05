import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import AppShell from "@/components/AppShell"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  if ((session.user as any)?.role !== "ADMIN") redirect("/dashboard")

  const planesAlerta = await prisma.solicitudPlan.count({ where: { estado: "PENDIENTE" } })

  const user = {
    name: session.user?.name,
    email: session.user?.email,
    role: (session.user as any)?.role,
    numeroColegiado: (session.user as any)?.numeroColegiado,
    planesAlerta: planesAlerta > 0 ? planesAlerta : undefined,
  }

  return (
    <AppShell user={user}>
      {children}
    </AppShell>
  )
}

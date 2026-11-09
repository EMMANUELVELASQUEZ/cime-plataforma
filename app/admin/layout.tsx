import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import AppShell from "@/components/AppShell"
import AsistenteAdmin from "@/components/AsistenteAdmin"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  if ((session.user as any)?.role !== "ADMIN") redirect("/dashboard")

  const [planesAlerta, totalColegiados, vigentes] = await Promise.all([
    prisma.solicitudPlan.count({ where: { estado: "PENDIENTE" } }),
    prisma.usuario.count({ where: { rol: "COLEGIADO" } }),
    prisma.usuario.count({ where: { rol: "COLEGIADO", estado: "VIGENTE" } }),
  ])

  const user = {
    name: session.user?.name,
    email: session.user?.email,
    role: (session.user as any)?.role,
    numeroColegiado: (session.user as any)?.numeroColegiado,
    planesAlerta: planesAlerta > 0 ? planesAlerta : undefined,
    totalColegiados,
    padronPct: totalColegiados > 0 ? Math.round(vigentes / totalColegiados * 100) : 0,
  }

  return (
    <AppShell user={user}>
      {children}
      <AsistenteAdmin />
    </AppShell>
  )
}

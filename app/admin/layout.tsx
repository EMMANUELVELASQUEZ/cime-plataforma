import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import AppShell from "@/components/AppShell"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  if ((session.user as any)?.role !== "ADMIN") redirect("/dashboard")

  const adminId = (session.user as any)?.id as string | undefined
  const [planesAlerta, totalColegiados, vigentes, mensajesNoLeidos, perfil] = await Promise.all([
    prisma.solicitudPlan.count({ where: { estado: "PENDIENTE" } }),
    prisma.usuario.count({ where: { rol: "COLEGIADO" } }),
    prisma.usuario.count({ where: { rol: "COLEGIADO", estado: "VIGENTE" } }),
    prisma.mensaje.count({ where: { deAdmin: false, leido: false } }),
    adminId
      ? prisma.usuario.findUnique({ where: { id: adminId }, select: { nombre: true, correo: true, cargo: true } })
      : null,
  ])

  const user = {
    name: perfil?.nombre ?? session.user?.name,
    email: perfil?.correo ?? session.user?.email,
    cargo: perfil?.cargo ?? null,
    role: (session.user as any)?.role,
    numeroColegiado: (session.user as any)?.numeroColegiado,
    planesAlerta: planesAlerta > 0 ? planesAlerta : undefined,
    totalColegiados,
    padronPct: totalColegiados > 0 ? Math.round(vigentes / totalColegiados * 100) : 0,
    mensajesNoLeidos: mensajesNoLeidos > 0 ? mensajesNoLeidos : undefined,
  }

  return (
    <AppShell user={user}>
      {children}
    </AppShell>
  )
}

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import PerfilPeritoForm from "./PerfilPeritoForm"

export const dynamic = "force-dynamic"

export default async function PerfilPeritoPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) redirect("/login")

  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      nombre: true,
      correo: true,
      telefono: true,
      numeroPerito: true,
    },
  })

  if (!usuario) redirect("/login")

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mi perfil</h1>
          <p>Actualiza tus datos de contacto y contraseña.</p>
        </div>
      </div>
      <PerfilPeritoForm usuario={usuario} />
    </>
  )
}

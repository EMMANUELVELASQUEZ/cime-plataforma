import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { EstadoColegiado } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/** Solo ADMIN; nunca sobre cuentas de administrador ni sobre la propia cuenta. */
async function guard(id: string) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) }
  if ((session.user as any)?.id === id) return { error: NextResponse.json({ error: "No puede modificar su propia cuenta desde aquí." }, { status: 400 }) }
  const u = await prisma.usuario.findUnique({ where: { id }, select: { id: true, rol: true, nombre: true } })
  if (!u) return { error: NextResponse.json({ error: "La cuenta no existe." }, { status: 404 }) }
  if (u.rol === "ADMIN") return { error: NextResponse.json({ error: "Las cuentas de administrador no se gestionan aquí." }, { status: 403 }) }
  return { u }
}

/** { accion: "clave", password } | { accion: "estado", activo: boolean } — cambia solo ese dato. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const g = await guard(params.id)
  if (g.error) return g.error
  const body = await req.json().catch(() => ({}))

  if (body.accion === "clave") {
    const pw = String(body.password ?? "")
    if (pw.length < 10) return NextResponse.json({ error: "La contraseña debe tener al menos 10 caracteres." }, { status: 400 })
    await prisma.usuario.update({ where: { id: params.id }, data: { password: await bcrypt.hash(pw, 12) } })
    return NextResponse.json({ ok: true })
  }
  if (body.accion === "estado") {
    const estado = body.activo ? EstadoColegiado.VIGENTE : EstadoColegiado.SUSPENDIDO
    await prisma.usuario.update({ where: { id: params.id }, data: { estado } })
    return NextResponse.json({ ok: true, estado })
  }
  return NextResponse.json({ error: "Acción no válida." }, { status: 400 })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const g = await guard(params.id)
  if (g.error) return g.error
  // Las relaciones están en cascada: eliminar borraría pagos, expedientes y cobranza.
  // Solo se elimina una cuenta sin historial; las demás se desactivan.
  const c = await prisma.usuario.findUnique({
    where: { id: params.id },
    select: { _count: { select: { pagos: true, pagosCurso: true, inscripciones: true, solicitudes: true, mensajes: true, especialidadesPerito: true, formacionPerito: true } }, expediente: { select: { id: true } } },
  })
  const historial = c ? Object.values(c._count).reduce((a, b) => a + b, 0) + (c.expediente ? 1 : 0) : 0
  if (historial > 0) {
    return NextResponse.json({ error: "Esta cuenta tiene historial (pagos, cursos, expediente o mensajes). Para no perderlo, desactívela en lugar de eliminarla." }, { status: 409 })
  }
  await prisma.usuario.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}

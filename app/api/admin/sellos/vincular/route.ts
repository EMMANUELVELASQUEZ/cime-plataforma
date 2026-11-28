import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { obtenerPeritoSellos } from "@/lib/sellos"
import { requireAdmin } from "../_auth"

export const dynamic = "force-dynamic"

/** Vincula una cuenta PERITO de la plataforma con un perito del sistema de sellos. */
export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { usuarioId, selloId } = await req.json().catch(() => ({}))
  const sid = Number(selloId)
  if (!usuarioId || !Number.isInteger(sid) || sid <= 0) {
    return NextResponse.json({ error: "Datos incompletos." }, { status: 400 })
  }

  const perito = await obtenerPeritoSellos(sid)
  if (!perito) return NextResponse.json({ error: "El perito no existe en el sistema de sellos o no hay conexión." }, { status: 404 })

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { id: true, rol: true, selloUsuarioId: true } })
  if (!usuario || usuario.rol !== "PERITO") return NextResponse.json({ error: "La cuenta no es de un perito." }, { status: 400 })
  if (usuario.selloUsuarioId && usuario.selloUsuarioId !== sid) {
    return NextResponse.json({ error: "Esta cuenta ya está vinculada a otro perito de sellos." }, { status: 409 })
  }
  const ocupado = await prisma.usuario.findUnique({ where: { selloUsuarioId: sid }, select: { id: true, nombre: true } })
  if (ocupado && ocupado.id !== usuario.id) {
    return NextResponse.json({ error: `Ese perito de sellos ya está vinculado con ${ocupado.nombre}.` }, { status: 409 })
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { selloUsuarioId: sid, selloVinculadoAt: new Date() },
  })
  return NextResponse.json({ ok: true })
}

/** Quita la vinculación (no borra nada en ningún sistema). */
export async function DELETE(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { usuarioId } = await req.json().catch(() => ({}))
  if (!usuarioId) return NextResponse.json({ error: "Datos incompletos." }, { status: 400 })
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { selloUsuarioId: null, selloVinculadoAt: null },
  })
  return NextResponse.json({ ok: true })
}

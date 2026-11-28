import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { listarPeritosSellos, sugerir } from "@/lib/sellos"
import { requireAdmin } from "../_auth"

export const dynamic = "force-dynamic"

/** Vincula en bloque solo las coincidencias seguras (por correo o número de perito). */
export async function POST() {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const res = await listarPeritosSellos()
  if (!res.ok) return NextResponse.json({ error: res.message }, { status: 503 })

  const cuentas = await prisma.usuario.findMany({
    where: { rol: "PERITO" },
    select: { id: true, nombre: true, correo: true, numeroPerito: true, selloUsuarioId: true },
  })
  const vinculados = new Set(cuentas.map(c => c.selloUsuarioId).filter(Boolean))

  let n = 0
  for (const p of res.peritos) {
    if (vinculados.has(p.id)) continue
    const s = sugerir(p, cuentas)
    if (!s || s.por === "nombre") continue
    await prisma.usuario.update({ where: { id: s.cuenta.id }, data: { selloUsuarioId: p.id, selloVinculadoAt: new Date() } })
    s.cuenta.selloUsuarioId = p.id
    vinculados.add(p.id)
    n++
  }
  return NextResponse.json({ ok: true, vinculados: n })
}

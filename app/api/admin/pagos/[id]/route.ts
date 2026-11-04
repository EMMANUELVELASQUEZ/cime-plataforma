import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.estado      !== undefined) data.estado      = body.estado
  if (body.concepto    !== undefined) data.concepto    = body.concepto
  if (body.monto       !== undefined) data.monto       = parseFloat(body.monto)
  if (body.comprobante !== undefined) data.comprobante = body.comprobante
  if (body.folio       !== undefined) data.folio       = body.folio
  if (body.cursoId     !== undefined) data.cursoId     = body.cursoId

  try {
    const updated = await prisma.pago.update({ where: { id: params.id }, data })
    return NextResponse.json(updated)
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "El folio ya existe" }, { status: 400 })
    return NextResponse.json({ error: "Error al actualizar pago" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    await prisma.pago.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error al eliminar pago" }, { status: 500 })
  }
}

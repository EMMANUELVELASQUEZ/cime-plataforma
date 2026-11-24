import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireTesoreroOrAdmin() {
  const session = await auth()
  if (!session) return null
  const role = (session.user as any)?.role
  if (role !== "ADMIN" && role !== "CONTADOR_TESORERO") return null
  return session
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!await requireTesoreroOrAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const pagos = await prisma.pagoCursoPerito.findMany({
      where: { usuarioId: params.id },
      orderBy: [{ anio: "asc" }, { orden: "asc" }],
    })
    return NextResponse.json(pagos)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Error al obtener pagos" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!await requireTesoreroOrAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { anio, mes, concepto, monto = 0, pagado = 0, estado = "PENDIENTE", notas, orden = 0 } = body

    if (!anio || !concepto) {
      return NextResponse.json({ error: "Año y concepto son obligatorios" }, { status: 400 })
    }

    const saldo = monto - pagado

    const pago = await prisma.pagoCursoPerito.create({
      data: {
        usuarioId: params.id,
        anio: Number(anio),
        mes: mes ? Number(mes) : null,
        concepto,
        monto: Number(monto),
        pagado: Number(pagado),
        saldo,
        estado,
        notas: notas || null,
        orden: Number(orden),
      },
    })

    return NextResponse.json(pago, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Error al crear pago" }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!await requireTesoreroOrAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, anio, mes, concepto, monto, pagado, estado, notas, orden } = body

    if (!id) {
      return NextResponse.json({ error: "ID del registro es obligatorio" }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.pagoCursoPerito.findFirst({
      where: { id, usuarioId: params.id },
    })
    if (!existing) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 })
    }

    const newMonto = monto !== undefined ? Number(monto) : existing.monto
    const newPagado = pagado !== undefined ? Number(pagado) : existing.pagado
    const newSaldo = newMonto - newPagado

    const updated = await prisma.pagoCursoPerito.update({
      where: { id },
      data: {
        ...(anio !== undefined && { anio: Number(anio) }),
        ...(mes !== undefined && { mes: mes === null ? null : Number(mes) }),
        ...(concepto !== undefined && { concepto }),
        monto: newMonto,
        pagado: newPagado,
        saldo: newSaldo,
        ...(estado !== undefined && { estado }),
        ...(notas !== undefined && { notas: notas || null }),
        ...(orden !== undefined && { orden: Number(orden) }),
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Error al actualizar pago" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!await requireTesoreroOrAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "ID del registro es obligatorio" }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.pagoCursoPerito.findFirst({
      where: { id, usuarioId: params.id },
    })
    if (!existing) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 })
    }

    await prisma.pagoCursoPerito.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Error al eliminar pago" }, { status: 500 })
  }
}

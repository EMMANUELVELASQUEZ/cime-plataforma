import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { concepto, monto, estado, folio } = await req.json()
  if (!concepto || !monto || !folio)
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })

  try {
    const pago = await prisma.pago.create({
      data: { usuarioId: params.id, concepto, monto: parseFloat(monto), estado: estado ?? "PAGADO", folio },
    })
    return NextResponse.json(pago, { status: 201 })
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "El folio ya existe" }, { status: 400 })
    return NextResponse.json({ error: "Error al registrar el pago" }, { status: 500 })
  }
}

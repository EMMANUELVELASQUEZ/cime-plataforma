import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  return session && (session.user as any)?.role === "ADMIN" ? session : null
}

// GET  /api/admin/expedientes  — list all
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const expedientes = await prisma.expediente.findMany({
    include: {
      usuario: { select: { id: true, nombre: true, numeroColegiado: true, especialidad: true, estado: true } },
      entradas: { select: { id: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(expedientes)
}

// POST /api/admin/expedientes  — create
export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { usuarioId, nombre, instrucciones } = await req.json()
  if (!usuarioId || !nombre) return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })

  const existing = await prisma.expediente.findUnique({ where: { usuarioId } })
  if (existing) return NextResponse.json({ error: "Este colegiado ya tiene expediente" }, { status: 409 })

  const expediente = await prisma.expediente.create({
    data: { usuarioId, nombre: nombre.trim(), instrucciones: instrucciones?.trim() || null },
    include: { entradas: true, usuario: { select: { nombre: true, numeroColegiado: true, especialidad: true, estado: true } } },
  })

  return NextResponse.json(expediente, { status: 201 })
}

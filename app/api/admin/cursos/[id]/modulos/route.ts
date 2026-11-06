import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  return session && (session.user as any)?.role === "ADMIN" ? session : null
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { titulo } = await req.json()
  if (!titulo?.trim()) return NextResponse.json({ error: "Título requerido" }, { status: 400 })

  try {
    const count = await prisma.moduloCurso.count({ where: { cursoId: params.id } })
    const modulo = await prisma.moduloCurso.create({
      data: { cursoId: params.id, titulo: titulo.trim(), orden: count + 1 },
      include: {
        lecciones: {
          orderBy: { orden: "asc" },
          include: { recursos: { orderBy: { orden: "asc" } } },
        },
      },
    })
    return NextResponse.json(modulo, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al crear módulo" }, { status: 500 })
  }
}

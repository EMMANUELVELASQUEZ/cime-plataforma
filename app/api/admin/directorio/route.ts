import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  return session && (session.user as any)?.role === "ADMIN" ? session : null
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  try {
    const miembros = await prisma.directorioMiembro.findMany({
      orderBy: [{ area: "asc" }, { orden: "asc" }, { nombre: "asc" }],
    })
    return NextResponse.json(miembros)
  } catch {
    return NextResponse.json({ error: "Error al obtener directorio" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { nombre, cargo, area, foto, email, telefono, bio } = await req.json()
  if (!nombre?.trim() || !cargo?.trim()) {
    return NextResponse.json({ error: "Nombre y cargo son obligatorios" }, { status: 400 })
  }
  try {
    const miembro = await prisma.directorioMiembro.create({
      data: {
        nombre: nombre.trim(),
        cargo: cargo.trim(),
        area: area ?? "Mesa Directiva",
        foto: foto ?? null,
        email: email?.trim() || null,
        telefono: telefono?.trim() || null,
        bio: bio?.trim() || null,
      },
    })
    return NextResponse.json(miembro, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al crear miembro" }, { status: 500 })
  }
}

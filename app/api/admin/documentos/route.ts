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
    const docs = await prisma.documentoAdmin.findMany({ orderBy: [{ categoria: "asc" }, { createdAt: "desc" }] })
    return NextResponse.json(docs)
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { nombre, descripcion, categoria, url, nombreArchivo, tipoMime, bytes } = await req.json()
  if (!nombre?.trim() || !url) return NextResponse.json({ error: "Faltan campos" }, { status: 400 })
  try {
    const doc = await prisma.documentoAdmin.create({
      data: { nombre: nombre.trim(), descripcion: descripcion?.trim() || null, categoria: categoria || "General", url, nombreArchivo, tipoMime, bytes: parseInt(bytes) || 0 }
    })
    return NextResponse.json(doc, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al crear" }, { status: 500 })
  }
}

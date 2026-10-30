import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-zip",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Sin archivo" }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 })
  }

  if (file.size > 4.5 * 1024 * 1024) {
    return NextResponse.json({ error: "Archivo muy grande (máx 4.5 MB)" }, { status: 400 })
  }

  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-")
    const blob = await put(`cime/${Date.now()}-${safeName}`, file, { access: "public" })
    return NextResponse.json({ url: blob.url, tamano: file.size, nombre: file.name })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al subir archivo"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

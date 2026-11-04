import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf":    "pdf",
  "image/jpeg":         "jpg",
  "image/png":          "png",
  "image/webp":         "webp",
}

const MAX_BYTES = 2 * 1024 * 1024 // 2 MB

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Sin archivo" }, { status: 400 })

  if (!ALLOWED_TYPES[file.type])
    return NextResponse.json({ error: "Tipo no permitido (PDF, JPG, PNG, WEBP)" }, { status: 400 })

  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "Archivo muy grande (máx 2 MB)" }, { status: 400 })

  try {
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")
    // Store as JSON so we preserve the filename alongside the data URL
    const payload = JSON.stringify({
      url:    `data:${file.type};base64,${base64}`,
      nombre: file.name,
      tipo:   file.type,
      bytes:  file.size,
    })
    return NextResponse.json({ url: payload, tamano: file.size, nombre: file.name })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al procesar archivo"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

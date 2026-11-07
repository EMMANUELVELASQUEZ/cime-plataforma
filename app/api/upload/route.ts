import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const ALLOWED_TYPES: Record<string, string> = {
  // Documents
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  // Archives
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "application/x-zip": "zip",
  "application/x-rar-compressed": "rar",
  "application/vnd.rar": "rar",
  // Text
  "text/plain": "txt",
  // Images
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

// Vercel function body limit is 4.5 MB; base64 adds ~33% overhead, so cap at 3 MB raw
const MAX_BYTES = 3 * 1024 * 1024

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Sin archivo" }, { status: 400 })

  if (!ALLOWED_TYPES[file.type])
    return NextResponse.json({ error: "Tipo no permitido. Formatos aceptados: PDF, Word, Excel, PowerPoint, ZIP, RAR, TXT e imágenes." }, { status: 400 })

  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: `Archivo muy grande (máx 3 MB). Para archivos grandes usa un enlace externo.` }, { status: 400 })

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

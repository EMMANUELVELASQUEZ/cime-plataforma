import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { createHmac } from "crypto"
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const NAVY = rgb(13 / 255, 32 / 255, 96 / 255)
const GOLD = rgb(200 / 255, 155 / 255, 42 / 255)
const INK  = rgb(26 / 255, 36 / 255, 51 / 255)
const GRAY = rgb(90 / 255, 107 / 255, 125 / 255)

function codigoVerificacion(id: string) {
  return createHmac("sha256", process.env.NEXTAUTH_SECRET ?? "cime")
    .update(`constancia:${id}`).digest("hex").slice(0, 10).toUpperCase()
}

function centrado(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = INK) {
  const w = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: (page.getWidth() - w) / 2, y, size, font, color })
}

/** Ajusta el tamaño para que el texto quepa en maxW. */
function ajustar(text: string, font: PDFFont, size: number, maxW: number) {
  let s = size
  while (s > 10 && font.widthOfTextAtSize(text, s) > maxW) s -= 0.5
  return s
}

function lineas(text: string, font: PDFFont, size: number, maxW: number) {
  const out: string[] = []; let cur = ""
  for (const w of text.split(/\s+/)) {
    const t = cur ? `${cur} ${w}` : w
    if (font.widthOfTextAtSize(t, size) > maxW && cur) { out.push(cur); cur = w } else cur = t
  }
  if (cur) out.push(cur)
  return out
}

/** Constancia de curso en PDF (carta horizontal). Solo el titular o un administrador. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const uid = (session.user as any)?.id
  const role = (session.user as any)?.role

  const ins = await prisma.inscripcionCurso.findUnique({
    where: { id: params.id },
    include: { curso: true, usuario: { select: { nombre: true, numeroColegiado: true, numeroPerito: true } } },
  })
  if (!ins || (ins.usuarioId !== uid && role !== "ADMIN")) {
    return NextResponse.json({ error: "Constancia no encontrada" }, { status: 404 })
  }
  if (ins.estado !== "COMPLETADO") return NextResponse.json({ error: "El curso aún no está concluido." }, { status: 409 })
  if (!ins.folio) return NextResponse.json({ error: "La constancia aún no tiene folio asignado por el Colegio." }, { status: 409 })

  const pdf = await PDFDocument.create()
  pdf.setTitle(`Constancia ${ins.folio}`)
  pdf.setAuthor("Colegio de Ingenieros Mecánicos y Electricistas de Veracruz")
  pdf.setCreator("Plataforma CIME Veracruz")

  const page = pdf.addPage([792, 612]) // carta horizontal
  const W = page.getWidth(), H = page.getHeight()
  const serif  = await pdf.embedFont(StandardFonts.TimesRoman)
  const serifB = await pdf.embedFont(StandardFonts.TimesRomanBold)
  const serifI = await pdf.embedFont(StandardFonts.TimesRomanItalic)
  const sans   = await pdf.embedFont(StandardFonts.Helvetica)
  const sansB  = await pdf.embedFont(StandardFonts.HelveticaBold)

  // Marco
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) })
  page.drawRectangle({ x: 18, y: 18, width: W - 36, height: H - 36, borderColor: NAVY, borderWidth: 6 })
  page.drawRectangle({ x: 30, y: 30, width: W - 60, height: H - 60, borderColor: GOLD, borderWidth: 1.5 })
  page.drawRectangle({ x: 18, y: H - 24, width: W - 36, height: 6, color: NAVY })

  // Logo
  try {
    const png = await pdf.embedPng(await readFile(path.join(process.cwd(), "public/brand/cime-3d-emblem.png")))
    const h = 74, w = (png.width / png.height) * h
    page.drawImage(png, { x: (W - w) / 2, y: H - 58 - h, width: w, height: h })
  } catch { /* sin logo si no está disponible */ }

  centrado(page, "COLEGIO DE INGENIEROS MECÁNICOS Y ELECTRICISTAS DE VERACRUZ", H - 150, sansB, 10.5, NAVY)
  centrado(page, "CONSTANCIA", H - 196, serifB, 40, NAVY)
  page.drawRectangle({ x: W / 2 - 60, y: H - 208, width: 120, height: 1.5, color: GOLD })
  centrado(page, "Se otorga la presente a", H - 236, serifI, 15, GRAY)

  const nombre = ins.usuario.nombre
  centrado(page, nombre, H - 276, serifB, ajustar(nombre, serifB, 30, W - 160), INK)
  const id = ins.usuario.numeroColegiado ? `Colegiado CIME-VER-${ins.usuario.numeroColegiado}`
    : ins.usuario.numeroPerito ? `Perito No. ${ins.usuario.numeroPerito}` : ""
  if (id) centrado(page, id, H - 296, sans, 10, GRAY)

  centrado(page, "por haber acreditado satisfactoriamente el curso", H - 326, serifI, 14, GRAY)
  const tl = lineas(`«${ins.curso.titulo}»`, serifB, 19, W - 180).slice(0, 2)
  tl.forEach((l, i) => centrado(page, l, H - 356 - i * 23, serifB, 19, NAVY))

  const y0 = H - 356 - tl.length * 23 - 10
  const detalle = [
    `con duración de ${ins.curso.horas} horas`,
    ins.calificacion != null ? `y calificación de ${ins.calificacion.toFixed(1)}` : null,
    `· Modalidad ${ins.curso.modalidad}`,
  ].filter(Boolean).join(" ")
  centrado(page, detalle, y0, serif, 13, INK)
  const fecha = new Date(ins.curso.fechaFin).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Mexico_City" })
  centrado(page, `Veracruz, Ver., a ${fecha}`, y0 - 22, serif, 12, GRAY)

  // Firma
  const fy = 108
  page.drawLine({ start: { x: W / 2 - 120, y: fy }, end: { x: W / 2 + 120, y: fy }, thickness: 0.8, color: INK })
  centrado(page, "Consejo Directivo", fy - 15, sansB, 10, INK)
  centrado(page, "CIME Veracruz", fy - 28, sans, 9, GRAY)

  // Folio y verificación
  page.drawText(`Folio: ${ins.folio}`, { x: 52, y: 50, size: 9, font: sansB, color: NAVY })
  page.drawText(`Código de verificación: ${codigoVerificacion(ins.id)}`, { x: 52, y: 38, size: 8, font: sans, color: GRAY })
  const curso = `Curso ${ins.curso.codigo}`
  page.drawText(curso, { x: W - 52 - sans.widthOfTextAtSize(curso, 8), y: 38, size: 8, font: sans, color: GRAY })

  const bytes = await pdf.save()
  const archivo = `Constancia_${ins.folio}_${nombre}`.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "_")
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${archivo}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  })
}

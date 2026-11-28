import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/** Exporta pagos a CSV (Excel). Admin y tesorería. Filtros: q, estado, concepto. */
export async function GET(req: Request) {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (role !== "ADMIN" && role !== "CONTADOR_TESORERO") return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const sp = new URL(req.url).searchParams
  const q = sp.get("q") ?? "", estado = sp.get("estado") ?? "", concepto = sp.get("concepto") ?? ""
  const pagos = await prisma.pago.findMany({
    where: {
      ...(estado && { estado }),
      ...(concepto && { concepto: { contains: concepto, mode: "insensitive" as const } }),
      ...(q && { OR: [
        { folio: { contains: q, mode: "insensitive" as const } },
        { concepto: { contains: q, mode: "insensitive" as const } },
        { usuario: { nombre: { contains: q, mode: "insensitive" as const } } },
        { usuario: { numeroColegiado: { contains: q, mode: "insensitive" as const } } },
      ] }),
    },
    orderBy: { createdAt: "desc" },
    include: { usuario: { select: { nombre: true, correo: true, numeroColegiado: true, numeroPerito: true, rol: true } } },
  })

  const esc = (v: unknown) => { const s = v == null ? "" : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  const f = (d: Date | null) => d ? d.toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" }) : ""
  const filas = [
    ["Folio", "Miembro", "Tipo", "Número", "Correo", "Concepto", "Monto (MXN)", "Estado", "Vencimiento", "Fecha"],
    ...pagos.map(p => [p.folio, p.usuario.nombre, p.usuario.rol === "PERITO" ? "Perito" : "Colegiado",
      p.usuario.numeroColegiado ?? p.usuario.numeroPerito ?? "", p.usuario.correo, p.concepto,
      p.monto.toFixed(2), p.estado, f(p.vencimiento), f(p.createdAt)]),
  ]
  const csv = "﻿" + filas.map(r => r.map(esc).join(",")).join("\r\n")
  const fecha = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="Pagos_CIME_${fecha}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}

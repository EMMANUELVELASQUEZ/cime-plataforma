import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  return session && (session.user as any)?.role === "ADMIN" ? session : null
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { titulo, codigo, area, modalidad, horas, precio, cupo, fechaInicio, fechaFin, instructor, lugar } = await req.json()
  if (!titulo || !codigo || !fechaInicio) return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
  const curso = await prisma.curso.create({
    data: {
      titulo,
      codigo,
      area: area ?? "ELE",
      modalidad: modalidad ?? "Presencial",
      lugar: lugar ?? "",
      horas: Number(horas) || 8,
      precio: Number(precio) || 0,
      cupo: Number(cupo) || 20,
      fechaInicio: new Date(fechaInicio),
      fechaFin: fechaFin ? new Date(fechaFin) : new Date(fechaInicio),
      instructor: instructor ?? "",
      estado: "ABIERTO",
    },
  })
  return NextResponse.json(curso, { status: 201 })
}

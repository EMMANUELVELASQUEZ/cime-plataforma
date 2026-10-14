import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Rol, EstadoColegiado } from "@prisma/client"

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") return null
  return session
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const { nombre, correo, password, numeroColegiado, especialidad, ciudad, cedula, telefono, estado, alta, horasMeta } = body

  if (!nombre || !correo || !password) {
    return NextResponse.json({ error: "Nombre, correo y contraseña son obligatorios." }, { status: 400 })
  }

  const exists = await prisma.usuario.findFirst({
    where: {
      OR: [
        { correo: correo.toLowerCase() },
        ...(numeroColegiado ? [{ numeroColegiado }] : []),
      ],
    },
  })
  if (exists) {
    return NextResponse.json({ error: "Ya existe un colegiado con ese correo o número." }, { status: 409 })
  }

  const hash = await bcrypt.hash(password, 12)
  const usuario = await prisma.usuario.create({
    data: {
      nombre,
      correo: correo.toLowerCase(),
      password: hash,
      rol: Rol.COLEGIADO,
      numeroColegiado: numeroColegiado || null,
      especialidad: especialidad || null,
      ciudad: ciudad || null,
      cedula: cedula || null,
      telefono: telefono || null,
      estado: (estado as EstadoColegiado) ?? EstadoColegiado.VIGENTE,
      alta: alta ?? new Date().getFullYear(),
      horasMeta: horasMeta ?? 60,
    },
  })

  return NextResponse.json({ id: usuario.id, nombre: usuario.nombre }, { status: 201 })
}

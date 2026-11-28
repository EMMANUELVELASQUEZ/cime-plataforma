import { NextResponse } from "next/server"
import { randomInt } from "crypto"
import bcrypt from "bcryptjs"
import { Rol, EstadoColegiado } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { listarPeritosSellos, sugerir, correoDe } from "@/lib/sellos"
import { generarDocxCredenciales, type Credencial, type Omitido } from "@/lib/credencialesDocx"
import { requireAdmin } from "../_auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function passwordTemporal() {
  // 14 caracteres, sin ambiguos (0/O, 1/l/I), con mayúscula, minúscula, dígito y símbolo
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ", a = "abcdefghijkmnpqrstuvwxyz", d = "23456789", s = "#$%&*@"
  const pick = (set: string) => set[randomInt(set.length)]
  const chars = [pick(A), pick(a), pick(d), pick(s), ...Array.from({ length: 10 }, () => pick(A + a + d))]
  for (let i = chars.length - 1; i > 0; i--) { const j = randomInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]] }
  return chars.join("")
}

/**
 * Crea cuentas PERITO para los peritos del sistema de sellos que aún no tienen cuenta
 * y devuelve un .docx con las credenciales (única copia de las contraseñas).
 * Body opcional: { selloIds: number[] } para crear solo algunos.
 */
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const filtro: number[] | null = Array.isArray(body?.selloIds) ? body.selloIds.map(Number).filter(Number.isInteger) : null

  const res = await listarPeritosSellos()
  if (!res.ok) return NextResponse.json({ error: res.message }, { status: 503 })

  const cuentas = await prisma.usuario.findMany({
    where: { rol: "PERITO" },
    select: { id: true, nombre: true, correo: true, numeroPerito: true, selloUsuarioId: true },
  })
  const vinculados = new Set(cuentas.map(c => c.selloUsuarioId).filter((x): x is number => x != null))

  const credenciales: Credencial[] = []
  const omitidos: Omitido[] = []

  for (const p of res.peritos) {
    if (filtro && !filtro.includes(p.id)) continue
    if (vinculados.has(p.id)) continue
    if (!p.activo) { omitidos.push({ nombre: p.nombre, motivo: "Inactivo en el sistema de sellos." }); continue }

    if (sugerir(p, cuentas)) {
      omitidos.push({ nombre: p.nombre, motivo: "Ya existe una cuenta parecida en la plataforma; vincúlela en lugar de crear otra." })
      continue
    }
    const correo = correoDe(p)
    if (!correo) { omitidos.push({ nombre: p.nombre, motivo: "No tiene correo registrado en el sistema de sellos." }); continue }

    const numero = p.numeroPerito || null
    const choque = await prisma.usuario.findFirst({
      where: { OR: [{ correo }, ...(numero ? [{ numeroPerito: numero }] : [])] },
      select: { nombre: true, correo: true },
    })
    if (choque) {
      omitidos.push({ nombre: p.nombre, motivo: choque.correo === correo
        ? `El correo ${correo} ya pertenece a ${choque.nombre}.`
        : `El número de perito ${numero} ya pertenece a ${choque.nombre}.` })
      continue
    }

    const password = passwordTemporal()
    await prisma.usuario.create({
      data: {
        nombre: p.nombre, correo,
        password: await bcrypt.hash(password, 12),
        rol: Rol.PERITO, numeroPerito: numero, telefono: p.telefono,
        estado: EstadoColegiado.VIGENTE, alta: new Date().getFullYear(),
        selloUsuarioId: p.id, selloVinculadoAt: new Date(),
      },
    })
    vinculados.add(p.id)
    credenciales.push({ nombre: p.nombre, numeroPerito: numero, correo, password })
  }

  if (credenciales.length === 0) {
    return NextResponse.json({ ok: true, creadas: 0, omitidos }, { status: 200 })
  }

  const origin = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? new URL(req.url).origin
  const buf = await generarDocxCredenciales({
    credenciales, omitidos,
    urlAcceso: `${origin.replace(/\/$/, "")}/login`,
    generadoPor: session.user?.name ?? "Administración",
  })
  const fecha = new Date().toISOString().slice(0, 10)
  return new NextResponse(new Uint8Array(buf), {
    status: 201,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="Credenciales_Peritos_CIME_${fecha}.docx"`,
      "Cache-Control": "no-store",
      "X-Cuentas-Creadas": String(credenciales.length),
    },
  })
}

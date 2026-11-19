import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const userId = (session.user as any)?.id
  const userName: string = (session.user as any)?.name ?? "Colegiado/a"
  try {
    const plan = await prisma.planPago.findUnique({ where: { id: params.id } })
    if (!plan || !plan.activo)
      return NextResponse.json({ error: "Plan no disponible" }, { status: 404 })

    const solicitud = await prisma.solicitudPlan.upsert({
      where:  { planId_usuarioId: { planId: params.id, usuarioId: userId } },
      create: { planId: params.id, usuarioId: userId, estado: "PENDIENTE" },
      update: { estado: "PENDIENTE", notas: null },
    })

    // ── 3 notificaciones profesionales a la administración ──────────
    const fecha = new Date().toLocaleDateString("es-MX", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    })
    const hora = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })

    await prisma.mensaje.createMany({
      data: [
        {
          usuarioId: userId,
          deAdmin: false,
          leido: false,
          contenido:
            `📋 SOLICITUD DE INSCRIPCIÓN — ${plan.nombre}\n\n` +
            `${userName} ha enviado una solicitud formal de inscripción al plan "${plan.nombre}" ` +
            `desde la plataforma del CIME Veracruz.\n\n` +
            `Fecha: ${fecha} a las ${hora}.`,
        },
        {
          usuarioId: userId,
          deAdmin: false,
          leido: false,
          contenido:
            `📌 DETALLE DEL PLAN SOLICITADO\n\n` +
            `• Plan: ${plan.nombre}\n` +
            `• Tipo: ${plan.tipo}\n` +
            `• Inversión: $${plan.monto.toLocaleString("es-MX")} MXN${plan.iva ? " + IVA" : ""}\n` +
            (plan.descripcion ? `• Descripción: ${plan.descripcion}\n` : "") +
            `\nEstado actual: PENDIENTE de atención.`,
        },
        {
          usuarioId: userId,
          deAdmin: false,
          leido: false,
          contenido:
            `📞 SOLICITUD DE CONTACTO\n\n` +
            `${userName} solicita ser contactado/a para coordinar los detalles ` +
            `de su inscripción al plan "${plan.nombre}".\n\n` +
            `Por favor, comuníquese con el/la interesado/a a través de esta plataforma ` +
            `o por vía telefónica para confirmar el proceso. Gracias.`,
        },
      ],
    })
    // ────────────────────────────────────────────────────────────────

    return NextResponse.json(solicitud, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al procesar solicitud" }, { status: 500 })
  }
}

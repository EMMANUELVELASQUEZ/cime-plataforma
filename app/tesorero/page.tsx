import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  Landmark, TrendingUp, Wallet, Hourglass, Users, CalendarClock,
  CreditCard, PieChart, Receipt, MessageCircle,
} from "lucide-react"
import { TesHero, TesKpi, TesTile } from "@/components/tesoreria/TesUI"

export const dynamic = "force-dynamic"

export default async function TesoreronPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const hoy = new Date()
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

  const [
    totalColegiados, totalPeritos,
    pagosCount, pagosPendientes,
    ingresosMes, ingresoTotal,
    ultimosPagos,
    porVencer,
  ] = await Promise.all([
    prisma.usuario.count({ where: { rol: "COLEGIADO" } }),
    prisma.usuario.count({ where: { rol: "PERITO" } }),
    prisma.pago.count(),
    prisma.pago.count({ where: { estado: "PENDIENTE" } }),
    prisma.pago.aggregate({ where: { estado: "PAGADO", createdAt: { gte: inicioMes } }, _sum: { monto: true } }),
    prisma.pago.aggregate({ where: { estado: "PAGADO" }, _sum: { monto: true } }),
    prisma.pago.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, folio: true, concepto: true, monto: true, estado: true, createdAt: true,
        usuario: { select: { nombre: true, numeroColegiado: true, numeroPerito: true } },
      },
    }),
    prisma.usuario.count({
      where: {
        vigencia: { not: null },
        estado: "POR_RENOVAR",
      },
    }),
  ])

  const pagosPagados = pagosCount - pagosPendientes
  const pctPagados = pagosCount > 0 ? Math.round(pagosPagados / pagosCount * 100) : 0

  function fmt(n: number) {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n)
  }

  const ESTADO_COLOR: Record<string, string> = {
 PAGADO:    "ok",
 PENDIENTE: "warn",
 VENCIDO:   "bad",
 CANCELADO: "",
  }

  const hour   = Number(new Intl.DateTimeFormat("es-MX", { hour: "numeric", hourCycle: "h23", timeZone: "America/Mexico_City" }).format(hoy))
  const saludo = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches"
  const nombre = (session.user?.name ?? "").split(" ").slice(0, 2).join(" ")
  const ico = { size: 17, strokeWidth: 1.9 } as const

  return (
    <>
      <TesHero
        eyebrow="Tesorería · CIME Veracruz"
        title={`${saludo},`}
        highlight={nombre || "Tesorería"}
        sub={hoy.toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/Mexico_City" })}
        icon={<Landmark size={26} strokeWidth={1.6} />}
        figure={fmt(ingresosMes._sum.monto ?? 0)}
        figureLabel="Ingresos del mes"
      />

      <div className="tes-kpis">
        <TesKpi label="Ingresos del mes" value={fmt(ingresosMes._sum.monto ?? 0)} sub="Pagos confirmados" tone="ok" icon={<TrendingUp {...ico} />} />
        <TesKpi label="Total recaudado" value={fmt(ingresoTotal._sum.monto ?? 0)} sub="Histórico acumulado" tone="gold" icon={<Wallet {...ico} />} />
        <TesKpi label="Pagos pendientes" value={pagosPendientes} sub={`${pctPagados}% cobrado`} tone={pagosPendientes > 10 ? "bad" : "warn"} icon={<Hourglass {...ico} />} />
        <TesKpi label="Miembros" value={totalColegiados + totalPeritos} sub={`${totalColegiados} colegiados · ${totalPeritos} peritos`} tone="info" icon={<Users {...ico} />} />
        <TesKpi label="Por renovar" value={porVencer} sub="Vigencia próxima a vencer" tone={porVencer > 0 ? "warn" : "mute"} icon={<CalendarClock {...ico} />} />
      </div>

      <div className="tes-tiles">
        <TesTile href="/tesorero/pagos"            label="Registro de pagos"  desc="Tabla completa de pagos"          icon={<CreditCard {...ico} />} />
        <TesTile href="/tesorero/cobranza"         label="Cobranza pendiente" desc="Miembros con saldo abierto"       icon={<TrendingUp {...ico} />} />
        <TesTile href="/tesorero/cobranza-peritos" label="Cobranza peritos"   desc="Cursos y cuotas de peritos"       icon={<Wallet {...ico} />} />
        <TesTile href="/tesorero/reportes"         label="Reportes"           desc="Resumen financiero y análisis"    icon={<PieChart {...ico} />} />
        <TesTile href="/tesorero/facturas"         label="Facturas"           desc="Comprobantes y facturas emitidas" icon={<Receipt {...ico} />} />
        <TesTile href="/tesorero/mensajes"         label="Mensajes"           desc="Comunicación con miembros"        icon={<MessageCircle {...ico} />} />
      </div>

      {/* Recent payments */}
      <div className="card">
        <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 className="font-montserrat" style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--fg)" }}>Pagos recientes</h2>
          <Link href="/tesorero/pagos" className="btn sm">Ver todos →</Link>
        </div>
        <div className="table-wrap" style={{ marginTop: 8 }}>
          <table>
            <thead>
              <tr>
                <th>Folio</th>
                <th>Miembro</th>
                <th>Concepto</th>
                <th style={{ textAlign: "right" }}>Monto</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {ultimosPagos.map(p => (
                <tr key={p.id}>
                  <td className="mono" style={{ fontSize: ".78rem" }}>{p.folio}</td>
                  <td style={{ fontSize: ".87rem" }}>{p.usuario.nombre}</td>
                  <td style={{ fontSize: ".87rem", color: "var(--muted)" }}>{p.concepto}</td>
                  <td className="tes-money" style={{ textAlign: "right" }}>
                    {fmt(p.monto)}
                  </td>
                  <td><span className={`chip nodot ${ESTADO_COLOR[p.estado] ?? ""}`}>{p.estado}</span></td>
                  <td style={{ fontSize: ".8rem", color: "var(--muted)" }}>
                    {new Date(p.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
              {ultimosPagos.length === 0 && (
                <tr><td colSpan={6}><div className="empty">Sin pagos registrados aún.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

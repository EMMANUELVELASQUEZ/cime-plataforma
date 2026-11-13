import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

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

  return (
    <>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0D2060 0%, #1a3a8a 100%)",
        borderRadius: 14, padding: "28px 32px", marginBottom: 24, color: "#fff",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: 32, top: 0, bottom: 0, display: "flex", alignItems: "center", opacity: .07 }}>
          <svg style={{ width: 160, height: 160 }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/></svg>
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: ".8rem", opacity: .7, marginBottom: 4, letterSpacing: ".08em", textTransform: "uppercase" }}>Panel Financiero</div>
          <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700 }}>Tesorería CIME Veracruz</h1>
          <p style={{ margin: "6px 0 0", opacity: .75, fontSize: ".9rem" }}>
            {hoy.toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Ingresos del mes",    value: fmt(ingresosMes._sum.monto ?? 0),      sub: "Pagos confirmados",        icon: "📈", accent: "#10b981" },
          { label: "Total recaudado",     value: fmt(ingresoTotal._sum.monto ?? 0),     sub: "Histórico acumulado",      icon: "🏦", accent: "#0D2060" },
          { label: "Pagos pendientes",    value: String(pagosPendientes),               sub: `${pctPagados}% cobrado`,   icon: "⏳", accent: pagosPendientes > 10 ? "#ef4444" : "#f59e0b" },
          { label: "Miembros vigentes",   value: String(totalColegiados + totalPeritos), sub: `${totalColegiados} col. · ${totalPeritos} per.`, icon: "👥", accent: "#3b82f6" },
          { label: "Por renovar",         value: String(porVencer),                      sub: "Vigencia próxima a vencer", icon: "🔔", accent: porVencer > 0 ? "#f59e0b" : "#6b7280" },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: ".75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: k.accent }}>{k.value}</div>
                <div style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: 2 }}>{k.sub}</div>
              </div>
              <span style={{ fontSize: 24 }}>{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick access */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 28 }}>
        {[
          { href: "/tesorero/pagos",     label: "Registro de Pagos",    desc: "Tabla completa de pagos",          bg: "#0D2060", icon: "💳" },
          { href: "/tesorero/cobranza",  label: "Cobranza Pendiente",   desc: "Miembros con saldo abierto",       bg: "#b45309", icon: "📋" },
          { href: "/tesorero/reportes",  label: "Reportes",             desc: "Resumen financiero y análisis",    bg: "#059669", icon: "📊" },
          { href: "/tesorero/facturas",  label: "Facturas",             desc: "Comprobantes y facturas emitidas", bg: "#7c3aed", icon: "🧾" },
          { href: "/tesorero/mensajes",  label: "Mensajes",             desc: "Comunicación con miembros",        bg: "#0369a1", icon: "💬" },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
            <div className="card" style={{
              padding: "18px 20px", cursor: "pointer",
              borderLeft: `4px solid ${item.bg}`,
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: ".95rem", color: item.bg }}>{item.label}</div>
              <div style={{ fontSize: ".8rem", color: "var(--muted)", marginTop: 2 }}>{item.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent payments */}
      <div className="card">
        <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: "1rem" }}>Pagos recientes</h2>
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
                  <td style={{ textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
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

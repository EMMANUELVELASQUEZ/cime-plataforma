import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n)
}

export default async function ReportesTesoreronPage() {
  const hoy = new Date()
  const anio = hoy.getFullYear()

  // Monthly breakdown for current year
  const pagosPorMes = await Promise.all(
    Array.from({ length: 12 }, (_, i) => {
      const desde = new Date(anio, i, 1)
      const hasta = new Date(anio, i + 1, 0, 23, 59, 59)
      return prisma.pago.aggregate({
        where: { estado: "PAGADO", createdAt: { gte: desde, lte: hasta } },
        _sum: { monto: true },
        _count: { id: true },
      }).then(r => ({
        mes: desde.toLocaleDateString("es-MX", { month: "short" }),
        monto: r._sum.monto ?? 0,
        count: r._count.id,
      }))
    })
  )

  // Top concepts
  const topConceptos = await prisma.pago.groupBy({
    by: ["concepto"],
    where: { estado: "PAGADO" },
    _sum: { monto: true },
    _count: { id: true },
    orderBy: { _sum: { monto: "desc" } },
    take: 8,
  })

  // Overall totals
  const [pagado, pendiente, vencido] = await Promise.all([
    prisma.pago.aggregate({ where: { estado: "PAGADO" }, _sum: { monto: true }, _count: { id: true } }),
    prisma.pago.aggregate({ where: { estado: "PENDIENTE" }, _sum: { monto: true }, _count: { id: true } }),
    prisma.pago.aggregate({ where: { estado: "VENCIDO" }, _sum: { monto: true }, _count: { id: true } }),
  ])

  const totalGeneral = (pagado._sum.monto ?? 0) + (pendiente._sum.monto ?? 0) + (vencido._sum.monto ?? 0)
  const maxMes = Math.max(...pagosPorMes.map(m => m.monto), 1)
  const mesActual = pagosPorMes[hoy.getMonth()]

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reportes Financieros</h1>
          <p>Análisis y resumen del ejercicio {anio}.</p>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total recaudado",  value: fmt(pagado._sum.monto ?? 0),    count: pagado._count.id,    color: "#10b981", bg: "#10b98112" },
          { label: "Por cobrar",       value: fmt(pendiente._sum.monto ?? 0), count: pendiente._count.id, color: "#f59e0b", bg: "#f59e0b12" },
          { label: "Vencido",          value: fmt(vencido._sum.monto ?? 0),   count: vencido._count.id,   color: "#ef4444", bg: "#ef444412" },
          { label: "Recaudado este mes", value: fmt(mesActual.monto),         count: mesActual.count,     color: "#3b82f6", bg: "#3b82f612" },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: "16px 20px", background: k.bg, border: `1px solid ${k.color}20` }}>
            <div style={{ fontSize: ".75rem", color: k.color, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase" }}>{k.label}</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: k.color, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
            <div style={{ fontSize: ".78rem", color: k.color, opacity: .7, marginTop: 2 }}>{k.count} transacción{k.count !== 1 ? "es" : ""}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        {/* Monthly bar chart */}
        <div className="card">
          <div style={{ padding: "16px 24px 8px", borderBottom: "1px solid var(--line)" }}>
            <h2 style={{ margin: 0, fontSize: "1rem" }}>Ingresos mensuales {anio}</h2>
            <p style={{ margin: "4px 0 0", fontSize: ".82rem", color: "var(--muted)" }}>Solo pagos con estado PAGADO</p>
          </div>
          <div style={{ padding: "24px" }}>
            {/* Bar chart */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160 }}>
              {pagosPorMes.map((m, i) => {
                const h = maxMes > 0 ? Math.round(m.monto / maxMes * 150) : 0
                const isCurrent = i === hoy.getMonth()
                return (
                  <div key={m.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: ".7rem", color: "var(--muted)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", display: h > 20 ? "none" : undefined }}>
                      {m.monto > 0 ? fmt(m.monto).replace("$", "").trim() : ""}
                    </div>
                    <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
                      <div style={{
                        height: Math.max(h, m.monto > 0 ? 4 : 0),
                        width: "100%",
                        background: isCurrent ? "#0D2060" : m.monto > 0 ? "#0D206040" : "var(--line)",
                        borderRadius: "4px 4px 0 0",
                        transition: "height .3s",
                        cursor: "default",
                        minHeight: 2,
                      }} title={`${m.mes}: ${fmt(m.monto)}`} />
                    </div>
                    <div style={{ fontSize: ".7rem", color: isCurrent ? "#0D2060" : "var(--muted)", fontWeight: isCurrent ? 700 : 400 }}>
                      {m.mes}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Top concepts */}
        <div className="card">
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--line)" }}>
            <h2 style={{ margin: 0, fontSize: "1rem" }}>Top conceptos</h2>
          </div>
          <div style={{ padding: "12px 0" }}>
            {topConceptos.map((c, i) => {
              const pct = totalGeneral > 0 ? Math.round((c._sum.monto ?? 0) / totalGeneral * 100) : 0
              return (
                <div key={c.concepto} style={{ padding: "8px 20px", display: "grid", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".85rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#0D2060", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".65rem", fontWeight: 700, flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{c.concepto}</span>
                    </span>
                    <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", fontSize: ".8rem", color: "#0D2060" }}>
                      {fmt(c._sum.monto ?? 0)}
                    </span>
                  </div>
                  <div className="meter" style={{ height: 4 }}>
                    <i style={{ width: `${pct}%`, background: "#0D2060" }} />
                  </div>
                  <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>{c._count.id} pago{c._count.id !== 1 ? "s" : ""} · {pct}%</div>
                </div>
              )
            })}
            {topConceptos.length === 0 && (
              <div className="empty" style={{ padding: "32px 20px" }}>Sin datos aún.</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

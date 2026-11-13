import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n)
}

function initials(name: string) {
  return name.replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "")
    .split(/\s+/).slice(0, 2).map((w: string) => w[0] ?? "").join("").toUpperCase()
}

export default async function CobranzaTesoreronPage() {
  const miembrosConPendientes = await prisma.usuario.findMany({
    where: {
      rol: { in: ["COLEGIADO", "PERITO"] },
      pagos: { some: { estado: { in: ["PENDIENTE", "VENCIDO"] } } },
    },
    select: {
      id: true, nombre: true, correo: true, telefono: true,
      numeroColegiado: true, numeroPerito: true, rol: true, estado: true,
      pagos: {
        where: { estado: { in: ["PENDIENTE", "VENCIDO"] } },
        select: { id: true, folio: true, concepto: true, monto: true, estado: true, vencimiento: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { nombre: "asc" },
  })

  const totalDeuda = miembrosConPendientes.reduce((sum, m) =>
    sum + m.pagos.reduce((s, p) => s + p.monto, 0), 0
  )
  const vencidosCount = miembrosConPendientes.reduce((sum, m) =>
    sum + m.pagos.filter(p => p.estado === "VENCIDO").length, 0
  )

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Cobranza Pendiente</h1>
          <p>{miembrosConPendientes.length} miembro{miembrosConPendientes.length !== 1 ? "s" : ""} con saldo abierto.</p>
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Deuda total",        value: fmt(totalDeuda),                    color: "#ef4444", icon: "💰" },
          { label: "Miembros con deuda", value: String(miembrosConPendientes.length), color: "#f59e0b", icon: "👥" },
          { label: "Pagos vencidos",     value: String(vencidosCount),              color: "#ef4444", icon: "⚠️" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: ".75rem", color: "var(--muted)", letterSpacing: ".06em", textTransform: "uppercase" }}>{s.label}</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {miembrosConPendientes.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: "80px 24px" }}>
            <svg className="ico lg" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>
            <b>¡Sin deudas!</b>
            <span>Todos los miembros están al corriente.</span>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {miembrosConPendientes.map(m => {
            const totalMiembro = m.pagos.reduce((s, p) => s + p.monto, 0)
            const tieneVencidos = m.pagos.some(p => p.estado === "VENCIDO")

            return (
              <div key={m.id} className="card" style={{
                borderLeft: `4px solid ${tieneVencidos ? "#ef4444" : "#f59e0b"}`,
                padding: 0, overflow: "hidden",
              }}>
                {/* Member header */}
                <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="avatar" style={{ background: `hsl(${(m.nombre.charCodeAt(0) ?? 0) * 47 % 360} 38% 34%)`, width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: ".85rem", flexShrink: 0 }}>
                      {initials(m.nombre)}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700 }}>{m.nombre}</div>
                      <div style={{ fontSize: ".8rem", color: "var(--muted)" }}>
                        {m.numeroColegiado ? `CIME-VER-${m.numeroColegiado}` : m.numeroPerito ? `CIME-PER-${m.numeroPerito}` : m.correo}
                        {" · "}
                        <span style={{ textTransform: "capitalize" }}>{m.rol.toLowerCase().replace("_", " ")}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: tieneVencidos ? "#ef4444" : "#f59e0b" }}>
                      {fmt(totalMiembro)}
                    </div>
                    <div style={{ fontSize: ".75rem", color: "var(--muted)" }}>{m.pagos.length} pago{m.pagos.length !== 1 ? "s" : ""} pendiente{m.pagos.length !== 1 ? "s" : ""}</div>
                  </div>
                </div>

                {/* Payments detail */}
                <div style={{ borderTop: "1px solid var(--line)" }}>
                  {m.pagos.map((p, idx) => (
                    <div key={p.id} style={{
                      padding: "10px 20px",
                      borderBottom: idx < m.pagos.length - 1 ? "1px solid var(--line)" : "none",
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                      background: p.estado === "VENCIDO" ? "#ef444408" : "transparent",
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="mono" style={{ fontSize: ".75rem", color: "var(--muted)", marginRight: 8 }}>{p.folio}</span>
                        <span style={{ fontSize: ".87rem" }}>{p.concepto}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                        {p.vencimiento && (
                          <span style={{ fontSize: ".75rem", color: p.estado === "VENCIDO" ? "#ef4444" : "var(--muted)" }}>
                            Vence: {new Date(p.vencimiento).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                          </span>
                        )}
                        <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", fontSize: ".9rem" }}>
                          {fmt(p.monto)}
                        </span>
                        <span style={{
                          padding: "2px 8px", borderRadius: 10, fontSize: ".72rem", fontWeight: 700,
                          background: p.estado === "VENCIDO" ? "#ef444418" : "#f59e0b18",
                          color: p.estado === "VENCIDO" ? "#ef4444" : "#b45309",
                        }}>
                          {p.estado}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Contact action */}
                <div style={{ padding: "10px 20px", background: "var(--surface-raised)", display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: ".8rem", color: "var(--muted)", flex: 1 }}>
                    {m.correo}{m.telefono ? ` · ${m.telefono}` : ""}
                  </span>
                  <a href={`mailto:${m.correo}?subject=Recordatorio de pago pendiente - CIME Veracruz&body=Estimado/a ${m.nombre},%0D%0A%0D%0ALe recordamos que tiene pagos pendientes con el Colegio de Ingenieros Mecánicos y Eléctricos de Veracruz.%0D%0A%0D%0ATotal adeudado: ${fmt(totalMiembro)}%0D%0A%0D%0APor favor, regularice su situación a la brevedad.%0D%0A%0D%0AAtentamente,%0D%0ACIME Veracruz`}
                    className="btn sm"
                    style={{ background: "#0D2060", color: "#fff" }}>
                    <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" /><path d="M3 7l9 6l9 -6" /></svg>
                    Recordatorio
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

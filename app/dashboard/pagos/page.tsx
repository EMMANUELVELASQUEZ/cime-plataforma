import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const money = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })

export default async function PagosPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id

  const pagos = await prisma.pago.findMany({
    where: { usuarioId: userId },
    orderBy: { createdAt: "desc" },
  })

  const pendientes = pagos.filter(p => p.estado === "Pendiente")
  const totalPendiente = pendientes.reduce((s, p) => s + p.monto, 0)
  const pagados = pagos.filter(p => p.estado === "Pagado")
  const totalPagado = pagados.reduce((s, p) => s + p.monto, 0)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Pagos y cuotas</h1>
          <p>Cuota anual de colegiación, cursos y comprobantes de pago.</p>
        </div>
      </div>

      {totalPendiente > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 16, alignItems: "center", padding: 20, borderRadius: "var(--r)", border: "1px solid color-mix(in srgb, var(--warn) 35%, var(--line))", background: "var(--warn-bg)" }}>
          <div>
            <span className="eyebrow" style={{ color: "var(--warn)" }}>Saldo pendiente</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
              <b style={{ fontFamily: "var(--f-display)", fontSize: "1.9rem", fontWeight: 800, fontStretch: "80%", fontVariantNumeric: "tabular-nums" }}>{money(totalPendiente)}</b>
            </div>
            <div className="muted" style={{ fontSize: ".85rem", marginTop: 4 }}>Tienes {pendientes.length} pago{pendientes.length !== 1 ? "s" : ""} pendiente{pendientes.length !== 1 ? "s" : ""}</div>
          </div>
          <button className="btn primary">
            <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 5m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z" /><path d="M3 10l18 0" /><path d="M7 15l.01 0" /><path d="M11 15l2 0" /></svg>
            Generar referencia
          </button>
        </div>
      )}

      <div className="grid g-2">
        <div className="card card-b" style={{ display: "grid", gap: 12 }}>
          <span className="eyebrow">Resumen</span>
          <dl className="kv">
            <dt>Total pagado 2026</dt>
            <dd className="mono" style={{ color: "var(--ok)" }}>{money(totalPagado)}</dd>
            <dt>Pendiente</dt>
            <dd className="mono" style={{ color: totalPendiente > 0 ? "var(--warn)" : "var(--ok)" }}>{money(totalPendiente)}</dd>
            <dt>Movimientos</dt>
            <dd className="mono">{pagos.length}</dd>
          </dl>
        </div>
        <div className="card card-b" style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <span className="eyebrow">Cuota anual 2026</span>
          <dl className="kv">
            <dt>Importe</dt>
            <dd className="mono">{money(2400)}</dd>
            <dt>Vigencia</dt>
            <dd>1 ene – 31 dic 2026</dd>
            <dt>Estatus</dt>
            <dd><span className="chip ok nodot">Pagada</span></dd>
          </dl>
        </div>
      </div>

      <div className="card">
        <div className="card-h"><h2>Historial de pagos</h2></div>
        {pagos.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Concepto</th><th>Folio</th><th>Fecha</th><th>Monto</th><th>Estatus</th></tr></thead>
              <tbody>
                {pagos.map(p => (
                  <tr key={p.id}>
                    <td>{p.concepto}</td>
                    <td className="mono" style={{ fontSize: ".8rem" }}>{p.folio}</td>
                    <td className="num">{new Date(p.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="mono">{money(p.monto)}</td>
                    <td><span className={`chip nodot ${p.estado === "Pagado" ? "ok" : "warn"}`}>{p.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">Sin movimientos registrados</div>
        )}
      </div>
    </>
  )
}

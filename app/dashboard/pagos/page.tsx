import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ReferenciaPago from "./ReferenciaPago"

export const dynamic = "force-dynamic"

const money = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })

export default async function PagosPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id

  const anio = new Date().getFullYear()
  const inicioAnio = new Date(anio, 0, 1)
  const [pagos, usuario, planAnual] = await Promise.all([
    prisma.pago.findMany({ where: { usuarioId: userId }, orderBy: { createdAt: "desc" } }),
    prisma.usuario.findUnique({ where: { id: userId }, select: { nombre: true, numeroColegiado: true, numeroPerito: true } }),
    prisma.planPago.findFirst({ where: { activo: true, tipo: "ANUALIDAD" }, orderBy: { updatedAt: "desc" } }),
  ])

  const pendientes = pagos.filter(p => p.estado === "PENDIENTE" || p.estado === "VENCIDO")
  const totalPendiente = pendientes.reduce((s, p) => s + p.monto, 0)
  const totalPagado = pagos.filter(p => p.estado === "PAGADO" && p.createdAt >= inicioAnio).reduce((s, p) => s + p.monto, 0)

  // Cuota anual del año en curso, según los pagos reales del colegiado
  const cuota = pagos.find(p => /cuota|anual|anualidad|colegiaci/i.test(p.concepto) && p.createdAt >= inicioAnio && p.estado !== "CANCELADO")
  const cuotaImporte = cuota?.monto ?? planAnual?.monto ?? null
  const cuotaEstado = !cuota ? { label: "Sin registro", cls: "" }
    : cuota.estado === "PAGADO" ? { label: "Pagada", cls: "ok" }
    : cuota.estado === "VENCIDO" ? { label: "Vencida", cls: "bad" }
    : { label: "Pendiente", cls: "warn" }
  const chip = (e: string) => e === "PAGADO" ? "ok" : e === "PENDIENTE" ? "warn" : e === "VENCIDO" ? "bad" : ""

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
          <ReferenciaPago
            nombre={usuario?.nombre ?? ""}
            numero={usuario?.numeroColegiado ?? usuario?.numeroPerito ?? null}
            pendientes={pendientes.map(p => ({ folio: p.folio, concepto: p.concepto, monto: p.monto }))}
            total={totalPendiente}
          />
        </div>
      )}

      <div className="grid g-2">
        <div className="card card-b" style={{ display: "grid", gap: 12 }}>
          <span className="eyebrow">Resumen</span>
          <dl className="kv">
            <dt>Total pagado {anio}</dt>
            <dd className="mono" style={{ color: "var(--ok)" }}>{money(totalPagado)}</dd>
            <dt>Pendiente</dt>
            <dd className="mono" style={{ color: totalPendiente > 0 ? "var(--warn)" : "var(--ok)" }}>{money(totalPendiente)}</dd>
            <dt>Movimientos</dt>
            <dd className="mono">{pagos.length}</dd>
          </dl>
        </div>
        <div className="card card-b" style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <span className="eyebrow">Cuota anual {anio}</span>
          <dl className="kv">
            <dt>Importe</dt>
            <dd className="mono">{cuotaImporte != null ? money(cuotaImporte) : "—"}</dd>
            <dt>Vigencia</dt>
            <dd>1 ene – 31 dic {anio}</dd>
            <dt>Estatus</dt>
            <dd><span className={`chip nodot ${cuotaEstado.cls}`}>{cuotaEstado.label}</span></dd>
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
                    <td><span className={`chip nodot ${chip(p.estado)}`}>{p.estado}</span></td>
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

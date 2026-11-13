import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n)
}

export default async function FacturasTesoreronPage() {
  // Pagos pagados = comprobantes / facturas
  const comprobantes = await prisma.pago.findMany({
    where: { estado: "PAGADO", comprobante: { not: null } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, folio: true, concepto: true, monto: true, comprobante: true, createdAt: true,
      usuario: { select: { nombre: true, correo: true, numeroColegiado: true, numeroPerito: true } },
    },
  })

  const totalFacturado = comprobantes.reduce((s, c) => s + c.monto, 0)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Facturas y Comprobantes</h1>
          <p>{comprobantes.length} comprobante{comprobantes.length !== 1 ? "s" : ""} registrados.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Comprobantes", value: String(comprobantes.length), color: "#0D2060" },
          { label: "Total facturado", value: fmt(totalFacturado), color: "#10b981" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: ".75rem", color: "var(--muted)", letterSpacing: ".06em", textTransform: "uppercase" }}>{s.label}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {comprobantes.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: "80px 24px" }}>
            <svg className="ico lg" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 8v-3a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-9a2 2 0 0 1 -2 -2v-2" /><path d="M3 12l3 3l3 -3" /><path d="M6 15v-9" /></svg>
            <b>Sin comprobantes aún</b>
            <span>Los comprobantes se muestran cuando un pago incluye archivo adjunto.</span>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Miembro</th>
                  <th>Concepto</th>
                  <th style={{ textAlign: "right" }}>Monto</th>
                  <th>Fecha</th>
                  <th>Comprobante</th>
                </tr>
              </thead>
              <tbody>
                {comprobantes.map(c => (
                  <tr key={c.id}>
                    <td className="mono" style={{ fontSize: ".78rem" }}>{c.folio}</td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: ".9rem" }}>{c.usuario.nombre}</div>
                      <div style={{ fontSize: ".75rem", color: "var(--muted)" }}>
                        {c.usuario.numeroColegiado
                          ? `CIME-VER-${c.usuario.numeroColegiado}`
                          : c.usuario.numeroPerito
                          ? `CIME-PER-${c.usuario.numeroPerito}`
                          : c.usuario.correo}
                      </div>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: ".87rem" }}>{c.concepto}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(c.monto)}</td>
                    <td style={{ fontSize: ".8rem", color: "var(--muted)" }}>
                      {new Date(c.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td>
                      {c.comprobante ? (
                        <a href={c.comprobante} target="_blank" rel="noopener noreferrer" className="btn sm"
                          style={{ background: "#0D2060", color: "#fff" }}>
                          <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
                          Ver
                        </a>
                      ) : (
                        <span className="muted" style={{ fontSize: ".8rem" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

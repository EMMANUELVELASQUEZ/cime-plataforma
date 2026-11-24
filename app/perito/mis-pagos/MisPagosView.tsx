"use client"

interface PagoCursoPerito {
  id: string
  usuarioId: string
  anio: number
  mes: number | null
  concepto: string
  monto: number
  pagado: number
  saldo: number
  estado: string
  notas: string | null
  orden: number
  createdAt: string | Date
  updatedAt: string | Date
}

interface Props {
  pagos: PagoCursoPerito[]
  nombre: string
  numeroPerito: string | null
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  "PAGÓ":      { label: "PAGÓ",      color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
  "NO PAGÓ":   { label: "NO PAGÓ",   color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  "PARCIAL":   { label: "PARCIAL",   color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  "EXENTO":    { label: "EXENTO",    color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB" },
  "PENDIENTE": { label: "PENDIENTE", color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE" },
}

const MESES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function fmt(n: number) {
  return `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
}

export default function MisPagosView({ pagos, nombre, numeroPerito }: Props) {
  const totalMonto = pagos.reduce((s, p) => s + p.monto, 0)
  const totalPagado = pagos.reduce((s, p) => s + p.pagado, 0)
  const totalSaldo = pagos.reduce((s, p) => s + p.saldo, 0)

  const thStyle: React.CSSProperties = {
    padding: "9px 12px",
    textAlign: "left",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: ".07em",
    textTransform: "uppercase",
    color: "#E0E8FF",
    whiteSpace: "nowrap",
    borderBottom: "2px solid rgba(255,255,255,.12)",
  }

  return (
    <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 24,
        padding: "16px 20px",
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #E2E8F0",
        boxShadow: "0 1px 4px rgba(0,0,0,.05)",
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0D2060", lineHeight: 1.2 }}>
            Estado de Cuenta
          </div>
          <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
            {nombre}
            {numeroPerito && (
              <span style={{ fontFamily: "monospace", fontWeight: 600, marginLeft: 10, color: "#475569" }}>
                CIME-PER-{numeroPerito}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alert banner */}
      {totalSaldo > 0 ? (
        <div style={{
          padding: "14px 18px",
          background: "#FEF2F2",
          border: "1px solid #FECACA",
          borderLeft: "4px solid #DC2626",
          borderRadius: 8,
          marginBottom: 20,
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}>
          <div style={{ color: "#DC2626", fontSize: 18, lineHeight: 1, flexShrink: 0 }}>!</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#991B1B" }}>
              Tienes un saldo pendiente de {fmt(totalSaldo)}
            </div>
            <div style={{ fontSize: 13, color: "#7F1D1D", marginTop: 2 }}>
              Comunicate con la administracion para regularizar tu situacion.
            </div>
          </div>
        </div>
      ) : pagos.length > 0 ? (
        <div style={{
          padding: "14px 18px",
          background: "#ECFDF5",
          border: "1px solid #A7F3D0",
          borderLeft: "4px solid #059669",
          borderRadius: 8,
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <div style={{ color: "#059669", fontSize: 18, lineHeight: 1 }}>✓</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#065F46" }}>
            Tus pagos estan al dia.
          </div>
        </div>
      ) : null}

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Facturado",    value: fmt(totalMonto),         color: "#0D2060", accent: "#1E40AF" },
          { label: "Total Pagado",       value: fmt(totalPagado),        color: "#065F46", accent: "#059669" },
          { label: "Saldo Pendiente",    value: fmt(totalSaldo),         color: totalSaldo > 0 ? "#991B1B" : "#065F46", accent: totalSaldo > 0 ? "#DC2626" : "#059669" },
          { label: "Cursos Registrados", value: String(pagos.length),    color: "#1E3A5F", accent: "#2563EB" },
        ].map((card) => (
          <div key={card.label} style={{
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 8,
            padding: "14px 16px",
            borderLeft: `4px solid ${card.accent}`,
            boxShadow: "0 1px 3px rgba(0,0,0,.06)",
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: card.color, fontFamily: "monospace", letterSpacing: "-.01em" }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {pagos.length === 0 ? (
        <div style={{
          padding: "40px",
          textAlign: "center",
          background: "#fff",
          borderRadius: 10,
          border: "1px solid #E2E8F0",
          color: "#94A3B8",
          fontSize: 14,
        }}>
          No tienes registros de pago en el sistema.
          <br />
          <span style={{ fontSize: 12, marginTop: 8, display: "block" }}>Contacta a la administracion si crees que esto es un error.</span>
        </div>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#0D2060" }}>
                <th style={{ ...thStyle, width: 60 }}>Año</th>
                <th style={{ ...thStyle, width: 100 }}>Mes</th>
                <th style={{ ...thStyle }}>Concepto / Curso</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Monto</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Pagado</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Saldo</th>
                <th style={{ ...thStyle, width: 110 }}>Estado</th>
                <th style={{ ...thStyle }}>Notas</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((pago, idx) => {
                const ec = ESTADO_CONFIG[pago.estado] ?? ESTADO_CONFIG["PENDIENTE"]
                const bg = ec.bg

                return (
                  <tr key={pago.id} style={{ background: bg, borderBottom: `1px solid ${ec.border}` }}>
                    <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 600, color: "#0F172A" }}>
                      {pago.anio}
                    </td>
                    <td style={{ padding: "8px 12px", color: "#475569" }}>
                      {pago.mes ? MESES[pago.mes] : "—"}
                    </td>
                    <td style={{ padding: "8px 12px", fontWeight: 500, color: "#0F172A" }}>
                      {pago.concepto}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: "#1E3A5F" }}>
                      {fmt(pago.monto)}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: "#065F46" }}>
                      {fmt(pago.pagado)}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: pago.saldo > 0 ? "#DC2626" : "#059669" }}>
                      {fmt(pago.saldo)}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "3px 9px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        background: ec.bg,
                        color: ec.color,
                        border: `1px solid ${ec.border}`,
                        letterSpacing: ".04em",
                      }}>
                        {ec.label}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", color: "#64748B", fontSize: 12 }}>
                      {pago.notas || "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "#0D2060", borderTop: "2px solid rgba(255,255,255,.2)" }}>
                <td colSpan={3} style={{ padding: "9px 12px", color: "#E0E8FF", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  TOTALES
                </td>
                <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#E0E8FF" }}>{fmt(totalMonto)}</td>
                <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#6EE7B7" }}>{fmt(totalPagado)}</td>
                <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: totalSaldo > 0 ? "#FCA5A5" : "#6EE7B7" }}>{fmt(totalSaldo)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div style={{ marginTop: 20, padding: "12px 16px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
        <p style={{ fontSize: 11, color: "#94A3B8", margin: 0, lineHeight: 1.6 }}>
          Este estado de cuenta es de solo lectura. Si detectas algun error o discrepancia en tus registros,
          ponte en contacto con la tesoreria del Colegio de Ingenieros Mecanicos y Electricistas de Veracruz.
        </p>
      </div>
    </div>
  )
}

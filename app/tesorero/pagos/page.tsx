import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = "force-dynamic"

interface SearchParams {
  q?: string; estado?: string; concepto?: string; page?: string
}

const ESTADO_CHIP: Record<string, { label: string; cls: string; dot: string }> = {
  PAGADO:    { label: "Pagado",    cls: "ok",   dot: "#10b981" },
  PENDIENTE: { label: "Pendiente", cls: "warn", dot: "#f59e0b" },
  VENCIDO:   { label: "Vencido",  cls: "bad",  dot: "#ef4444" },
  CANCELADO: { label: "Cancelado", cls: "",     dot: "#9ca3af" },
}

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n)
}

export default async function PagosTesoreronPage({ searchParams }: { searchParams: SearchParams }) {
  const q        = searchParams.q ?? ""
  const estado   = searchParams.estado ?? ""
  const concepto = searchParams.concepto ?? ""
  const page     = Math.max(1, parseInt(searchParams.page ?? "1"))
  const PER      = 20

  const where = {
    ...(estado && { estado }),
    ...(q && {
      OR: [
        { folio: { contains: q, mode: "insensitive" as const } },
        { concepto: { contains: q, mode: "insensitive" as const } },
        { usuario: { nombre: { contains: q, mode: "insensitive" as const } } },
        { usuario: { numeroColegiado: { contains: q, mode: "insensitive" as const } } },
      ],
    }),
    ...(concepto && { concepto: { contains: concepto, mode: "insensitive" as const } }),
  }

  const [total, pagos, totalesPorEstado, sumTotal] = await Promise.all([
    prisma.pago.count({ where }),
    prisma.pago.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER,
      take: PER,
      select: {
        id: true, folio: true, concepto: true, monto: true, estado: true,
        vencimiento: true, createdAt: true,
        usuario: { select: { nombre: true, numeroColegiado: true, numeroPerito: true } },
      },
    }),
    prisma.pago.groupBy({ by: ["estado"], _count: { id: true }, _sum: { monto: true } }),
    prisma.pago.aggregate({ where, _sum: { monto: true } }),
  ])

  const pages = Math.max(1, Math.ceil(total / PER))
  const concepciones = await prisma.pago.findMany({ distinct: ["concepto"], select: { concepto: true } })

  function buildUrl(params: Record<string, string>) {
    const p = new URLSearchParams({ ...(q && { q }), ...(estado && { estado }), ...(concepto && { concepto }), page: String(page), ...params })
    return `/tesorero/pagos?${p.toString()}`
  }

  const estadosResumen = ["PAGADO", "PENDIENTE", "VENCIDO", "CANCELADO"].map(est => {
    const found = totalesPorEstado.find(e => e.estado === est)
    return { est, count: found?._count.id ?? 0, sum: found?._sum.monto ?? 0 }
  })

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Registro de Pagos</h1>
          <p>{total} pago{total !== 1 ? "s" : ""} en el sistema.</p>
        </div>
        <div className="actions">
          <a href={`/api/admin/pagos/export?${new URLSearchParams({ ...(q && { q }), ...(estado && { estado }) }).toString()}`}
            className="btn">
            <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
            Exportar CSV
          </a>
          <Link href="/admin/pagos/nuevo" className="btn primary">
            <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
            Nuevo pago
          </Link>
        </div>
      </div>

      {/* Estado summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {estadosResumen.map(({ est, count, sum }) => {
          const info = ESTADO_CHIP[est]
          return (
            <div key={est} className="card" style={{
              padding: "12px 16px", cursor: "pointer",
              borderTop: `3px solid ${info.dot}`,
              opacity: estado && estado !== est ? 0.5 : 1,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: ".72rem", fontWeight: 700, color: info.dot, letterSpacing: ".07em", textTransform: "uppercase" }}>
                  {info.label}
                </span>
                <span style={{ fontSize: "1.1rem", fontWeight: 800 }}>{count}</span>
              </div>
              <div style={{ fontSize: ".85rem", fontWeight: 600, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                {fmt(sum)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Excel-style table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{
          background: "#0D2060",
          padding: "12px 16px",
          display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
        }}>
          <form method="GET" action="/tesorero/pagos" style={{ display: "contents" }}>
            <div className="input-wrap" style={{ flex: "1 1 220px" }}>
              <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color: "#fff" }}><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
              <input
                className="input"
                name="q"
                placeholder="Buscar por folio, nombre o concepto…"
                defaultValue={q}
                style={{ height: 36, background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.2)", fontSize: ".85rem" }}
              />
            </div>
            <select
              className="input"
              name="estado"
              defaultValue={estado}
              style={{ height: 36, width: "auto", minWidth: 150, background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.2)", fontSize: ".85rem" }}
            >
              <option value="">Todos los estados</option>
              <option value="PAGADO">Pagado</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="VENCIDO">Vencido</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
            <select
              className="input"
              name="concepto"
              defaultValue={concepto}
              style={{ height: 36, width: "auto", minWidth: 180, background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.2)", fontSize: ".85rem" }}
            >
              <option value="">Todos los conceptos</option>
              {concepciones.map(c => <option key={c.concepto} value={c.concepto}>{c.concepto}</option>)}
            </select>
            <button className="btn sm" type="submit" style={{ background: "#E8C060", color: "#0D2060", border: "none", fontWeight: 700 }}>
              Filtrar
            </button>
            {(q || estado || concepto) && (
              <Link href="/tesorero/pagos" className="btn sm" style={{ background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.2)" }}>
                Limpiar
              </Link>
            )}
          </form>
          <div style={{ marginLeft: "auto", color: "rgba(255,255,255,.65)", fontSize: ".8rem" }}>
            {total} registros
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".87rem" }}>
            <thead>
              <tr style={{ background: "#0D206018", position: "sticky", top: 0, zIndex: 1 }}>
                {["#", "Folio", "Miembro", "Concepto", "Monto", "Estado", "Vencimiento", "Fecha"].map((h, i) => (
                  <th key={h} style={{
                    padding: "10px 14px", textAlign: i >= 4 ? (i === 4 ? "right" : "center") : "left",
                    fontSize: ".75rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
                    color: "#0D2060", borderBottom: "2px solid #0D206030", whiteSpace: "nowrap",
                    background: "#0D206010",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagos.map((p, idx) => {
                const isVencido   = p.estado === "VENCIDO"
                const isPendiente = p.estado === "PENDIENTE"
                const info = ESTADO_CHIP[p.estado] ?? ESTADO_CHIP.CANCELADO
                const rowN = (page - 1) * PER + idx + 1

                return (
                  <tr key={p.id} style={{
                    background: idx % 2 === 0 ? "transparent" : "var(--surface-raised)",
                    borderLeft: isVencido ? "3px solid #ef4444" : isPendiente ? "3px solid #f59e0b" : "3px solid transparent",
                  }}>
                    <td style={{ padding: "9px 14px", color: "var(--muted)", fontSize: ".75rem", textAlign: "center" }}>{rowN}</td>
                    <td style={{ padding: "9px 14px" }}>
                      <span className="mono" style={{ fontSize: ".78rem", color: "var(--muted)" }}>{p.folio}</span>
                    </td>
                    <td style={{ padding: "9px 14px" }}>
                      <div style={{ fontWeight: 500 }}>{p.usuario.nombre}</div>
                      <div style={{ fontSize: ".75rem", color: "var(--muted)" }}>
                        {p.usuario.numeroColegiado
                          ? `CIME-VER-${p.usuario.numeroColegiado}`
                          : p.usuario.numeroPerito
                          ? `CIME-PER-${p.usuario.numeroPerito}`
                          : "—"}
                      </div>
                    </td>
                    <td style={{ padding: "9px 14px", color: "var(--muted)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.concepto}
                    </td>
                    <td style={{ padding: "9px 14px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      {fmt(p.monto)}
                    </td>
                    <td style={{ padding: "9px 14px", textAlign: "center" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "3px 10px", borderRadius: 20, fontSize: ".75rem", fontWeight: 600,
                        background: `${info.dot}18`, color: info.dot,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: info.dot, flexShrink: 0 }} />
                        {info.label}
                      </span>
                    </td>
                    <td style={{ padding: "9px 14px", textAlign: "center", fontSize: ".8rem" }}>
                      {p.vencimiento
                        ? <span style={{ color: isVencido ? "#ef4444" : "inherit" }}>
                            {new Date(p.vencimiento).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" })}
                          </span>
                        : <span style={{ color: "var(--muted)" }}>—</span>}
                    </td>
                    <td style={{ padding: "9px 14px", fontSize: ".78rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {new Date(p.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                )
              })}

              {pagos.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty" style={{ padding: "48px 24px" }}>
                      <svg className="ico lg" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                      <b>Sin resultados</b>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Totals footer */}
            {pagos.length > 0 && (
              <tfoot>
                <tr style={{ background: "#0D206008", borderTop: "2px solid #0D206030" }}>
                  <td colSpan={4} style={{ padding: "10px 14px", fontSize: ".8rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    Total ({total} registros en filtro actual)
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, fontSize: "1rem", color: "#0D2060", fontVariantNumeric: "tabular-nums" }}>
                    {fmt(sumTotal._sum.monto ?? 0)}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Paginator */}
        <div className="pager" style={{ borderTop: "1px solid var(--line)" }}>
          <span>Mostrando {total > 0 ? (page - 1) * PER + 1 : 0}–{Math.min(page * PER, total)} de {total}</span>
          <div className="btns">
            {page > 1
              ? <Link href={buildUrl({ page: String(page - 1) })} className="btn sm">← Anterior</Link>
              : <button className="btn sm" disabled>← Anterior</button>}
            <span className="mono" style={{ alignSelf: "center", padding: "0 6px" }}>{page}/{pages}</span>
            {page < pages
              ? <Link href={buildUrl({ page: String(page + 1) })} className="btn sm">Siguiente →</Link>
              : <button className="btn sm" disabled>Siguiente →</button>}
          </div>
        </div>
      </div>
    </>
  )
}

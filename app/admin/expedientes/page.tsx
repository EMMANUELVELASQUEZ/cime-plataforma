import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  FolderOpen, FolderX, Archive, Users, Plus, ArrowRight,
  FileText, AlertCircle, CheckCircle2, BarChart3, Clock,
} from "lucide-react"

export const dynamic = "force-dynamic"

const TIPO_CFG: Record<string, { label: string; color: string; bg: string }> = {
  NOTA:        { label: "Nota",        color: "#2563eb", bg: "rgba(37,99,235,.1)"  },
  INSTRUCCION: { label: "Instrucción", color: "#7c3aed", bg: "rgba(124,58,237,.1)" },
  DOCUMENTO:   { label: "Documento",   color: "#0891b2", bg: "rgba(8,145,178,.1)"  },
  OBSERVACION: { label: "Observación", color: "#d97706", bg: "rgba(217,119,6,.1)"  },
  REPORTE:     { label: "Reporte",     color: "#059669", bg: "rgba(5,150,105,.1)"  },
}

function initials(name: string) {
  return name.replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "")
    .split(/\s+/).slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase()
}

const HUES = [211, 142, 262, 24, 199, 327, 38, 172]

export default async function ExpedientesPage() {
  const [colegiados, expedientes, entradasRecientes] = await Promise.all([
    prisma.usuario.findMany({
      where: { rol: "COLEGIADO" },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, numeroColegiado: true, especialidad: true, estado: true },
    }),
    prisma.expediente.findMany({
      include: { entradas: { select: { id: true, tipo: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.entradaExpediente.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { expediente: { include: { usuario: { select: { nombre: true } } } } },
    }),
  ])

  const expMap = new Map(expedientes.map(e => [e.usuarioId, e]))

  const total       = colegiados.length
  const conExp      = expedientes.filter(e => e.estado === "ACTIVO").length
  const sinExp      = total - expedientes.length
  const archivados  = expedientes.filter(e => e.estado === "ARCHIVADO").length

  // Breakdown by tipo de entradas
  const tipoCount: Record<string, number> = {}
  expedientes.forEach(e => e.entradas.forEach(en => {
    tipoCount[en.tipo] = (tipoCount[en.tipo] ?? 0) + 1
  }))

  const stats = [
    { label: "Total colegiados", val: total,     icon: <Users     size={18} strokeWidth={1.75} />, color: "#1B4F91", bg: "rgba(27,79,145,.1)"  },
    { label: "Con expediente",   val: conExp,     icon: <FolderOpen size={18} strokeWidth={1.75} />, color: "#059669", bg: "rgba(5,150,105,.1)"  },
    { label: "Sin expediente",   val: sinExp,     icon: <FolderX   size={18} strokeWidth={1.75} />, color: "#d97706", bg: "rgba(217,119,6,.1)"  },
    { label: "Archivados",       val: archivados, icon: <Archive   size={18} strokeWidth={1.75} />, color: "#6b7280", bg: "rgba(107,114,128,.1)"},
  ]

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="page-head">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(27,79,145,.12)", display: "grid", placeItems: "center", color: "var(--brand)" }}>
              <FolderOpen size={19} strokeWidth={1.75} />
            </span>
            Expedientes
          </h1>
          <p>Gestión de expedientes individuales del padrón de colegiados</p>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <div className="grid g-4">
        {stats.map(s => (
          <div key={s.label} className="card stat">
            <div className="ico-wrap" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="eyebrow">{s.label}</div>
            <b>{s.val}</b>
            <small>{s.val === 1 ? "registro" : "registros"}</small>
          </div>
        ))}
      </div>

      {/* ── Expedientes Table ───────────────────────────────────── */}
      <div className="card">
        <div className="card-h">
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FolderOpen size={16} strokeWidth={1.75} style={{ color: "var(--brand)" }} />
            Colegiados y expedientes
          </h2>
          <span className="chip nodot info">{total} total</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Colegiado</th>
                <th>Nombre del expediente</th>
                <th>Entradas</th>
                <th>Estado exp.</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {colegiados.map(col => {
                const exp  = expMap.get(col.id)
                const hue  = HUES[col.nombre.charCodeAt(0) % HUES.length]
                const EST: Record<string, string> = {
                  VIGENTE: "ok", POR_RENOVAR: "warn", SUSPENDIDO: "bad",
                }
                return (
                  <tr key={col.id}>
                    <td>
                      <div className="person">
                        <div className="avatar" style={{ background: `hsl(${hue} 45% 32%)` }}>
                          {initials(col.nombre)}
                        </div>
                        <div>
                          <b>{col.nombre}</b>
                          <small>{col.numeroColegiado ? `CIME-VER-${col.numeroColegiado}` : "Sin número"}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {exp
                        ? <span style={{ fontWeight: 600, color: "var(--fg)" }}>{exp.nombre}</span>
                        : <span style={{ color: "var(--muted)", fontStyle: "italic", fontSize: ".8rem" }}>Sin expediente</span>
                      }
                    </td>
                    <td>
                      {exp
                        ? <span className="chip nodot info">{exp.entradas.length} entrada{exp.entradas.length !== 1 ? "s" : ""}</span>
                        : <span style={{ color: "var(--muted-2)", fontSize: ".8rem" }}>—</span>
                      }
                    </td>
                    <td>
                      {exp
                        ? <span className={`chip nodot ${exp.estado === "ACTIVO" ? "ok" : ""}`}>
                            {exp.estado === "ACTIVO" ? "Activo" : "Archivado"}
                          </span>
                        : <span className="chip nodot warn">Sin expediente</span>
                      }
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {exp
                          ? (
                            <Link href={`/admin/expedientes/${col.id}`} className="btn sm primary" style={{ gap: 4 }}>
                              Ver <ArrowRight size={12} strokeWidth={2.5} />
                            </Link>
                          ) : (
                            <Link href={`/admin/expedientes/${col.id}`} className="btn sm">
                              <Plus size={13} strokeWidth={2} /> Crear
                            </Link>
                          )
                        }
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Reports Section ─────────────────────────────────────── */}
      <div className="grid g-dash">

        {/* Actividad reciente */}
        <div className="card">
          <div className="card-h">
            <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={16} strokeWidth={1.75} style={{ color: "var(--brand)" }} />
              Actividad reciente
            </h2>
            <span className="chip nodot">Últimas 8 entradas</span>
          </div>
          {entradasRecientes.length === 0 ? (
            <div className="empty">
              <FileText size={28} strokeWidth={1.25} />
              <span>Sin actividad registrada</span>
            </div>
          ) : (
            <div style={{ display: "grid" }}>
              {entradasRecientes.map(en => {
                const tc = TIPO_CFG[en.tipo] ?? TIPO_CFG.NOTA
                return (
                  <div key={en.id} style={{
                    display: "flex", gap: 12, alignItems: "flex-start",
                    padding: "12px 18px", borderBottom: "1px solid var(--line)",
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: tc.bg, color: tc.color,
                      display: "grid", placeItems: "center",
                    }}>
                      <FileText size={14} strokeWidth={1.75} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: ".84rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {en.titulo}
                      </div>
                      <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: 2, display: "flex", gap: 8 }}>
                        <span style={{ color: tc.color, fontWeight: 600 }}>{tc.label}</span>
                        <span>·</span>
                        <span>{en.expediente.usuario.nombre.split(" ").slice(0, 2).join(" ")}</span>
                        <span>·</span>
                        <span>{new Date(en.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Reporte por tipo */}
        <div className="stack">
          <div className="card card-b">
            <div style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: 14 }}>
              Entradas por tipo
            </div>
            {Object.keys(TIPO_CFG).length === 0 || Object.values(tipoCount).reduce((a, b) => a + b, 0) === 0 ? (
              <div className="empty" style={{ padding: "20px 0" }}>
                <BarChart3 size={24} strokeWidth={1.25} />
                <span style={{ fontSize: ".82rem" }}>Sin entradas aún</span>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {Object.entries(TIPO_CFG).map(([tipo, cfg]) => {
                  const count = tipoCount[tipo] ?? 0
                  const totalEntradas = Object.values(tipoCount).reduce((a, b) => a + b, 0)
                  const pct = totalEntradas > 0 ? Math.round(count / totalEntradas * 100) : 0
                  return (
                    <div key={tipo}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".8rem", marginBottom: 5 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
                          {cfg.label}
                        </span>
                        <span style={{ fontFamily: "var(--f-mono)", fontWeight: 700 }}>{count}</span>
                      </div>
                      <div className="meter" style={{ height: 6 }}>
                        <i style={{ width: `${pct}%`, background: cfg.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="card card-b">
            <div style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: 14 }}>
              Cobertura de expedientes
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {[
                { label: "Con expediente activo", val: conExp,     color: "var(--ok)",   icon: <CheckCircle2 size={15} strokeWidth={2} /> },
                { label: "Sin expediente",        val: sinExp,     color: "var(--warn)",  icon: <AlertCircle  size={15} strokeWidth={2} /> },
                { label: "Archivados",            val: archivados, color: "var(--muted)", icon: <Archive      size={15} strokeWidth={2} /> },
              ].map(r => (
                <div key={r.label} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 12px", borderRadius: 8, border: "1px solid var(--line)",
                  background: "var(--surface-2)",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".83rem", color: r.color }}>
                    {r.icon} {r.label}
                  </span>
                  <b style={{ fontFamily: "var(--f-mono)", fontSize: ".9rem" }}>{r.val}</b>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".72rem", color: "var(--muted)", marginBottom: 6 }}>
                <span>Cobertura total</span>
                <span style={{ fontFamily: "var(--f-mono)", fontWeight: 700 }}>
                  {total > 0 ? Math.round((expedientes.length / total) * 100) : 0}%
                </span>
              </div>
              <div className="meter">
                <i style={{ width: `${total > 0 ? Math.round((expedientes.length / total) * 100) : 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

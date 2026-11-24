"use client"

import { useState } from "react"

type Especialidad = { id: string; numero: number; nombre: string; claveRegistro: string; createdAt: string }
type Formacion = { id: string; anio: number; mes: string | null; nombre: string; estado: string; orden: number; createdAt: string }

interface Props {
  usuario: {
    nombre: string
    numeroPerito: string | null
    especialidad: string | null
    alta: number
    vigencia: string | null
    estado: string
  }
  especialidades: Especialidad[]
  formacion: Formacion[]
  observaciones: string | null
}

const ESTADO_CFG: Record<string, { label: string; color: string; bg: string }> = {
 REGISTRADO:    { label: "Registrado",    color: "#1D4ED8", bg: "#EFF6FF" },
 ACREDITADO:    { label: "Acreditado",    color: "#059669", bg: "#ECFDF5" },
 INSTRUCTOR:    { label: "Instructor",    color: "#0891B2", bg: "#CFFAFE" },
 POR_VERIFICAR: { label: "Por verificar", color: "#D97706", bg: "#FFFBEB" },
 NO_PARTICIPO:  { label: "No participó",  color: "#6B7280", bg: "#F9FAFB" },
}

export default function ExpedienteProView({ usuario, especialidades, formacion, observaciones }: Props) {
  const [tab, setTab] = useState<"expediente" | "participacion">("expediente")

  const f2025 = formacion.filter(f => f.anio === 2025)
  const f2026 = formacion.filter(f => f.anio === 2026)
  const participados2025 = f2025.filter(f => f.estado !== "NO_PARTICIPO").length
  const participados2026 = f2026.filter(f => f.estado !== "NO_PARTICIPO").length
  const pct = (p: number, t: number) => t > 0 ? Math.round((p / t) * 100) : 0

  function SectionHeader({ num, title }: { num: string; title: string }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 4, height: 22, background: "#C89B2A", borderRadius: 2, flexShrink: 0 }} />
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: "var(--f-mono)", fontSize: ".72rem", fontWeight: 700, color: "#C89B2A" }}>{num}</span>
          <h3 style={{ fontSize: ".88rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" as const, color: "var(--fg)", margin: 0 }}>{title}</h3>
        </div>
      </div>
    )
  }

  const TH_STYLE: React.CSSProperties = {
    padding: "10px 16px",
    fontSize: ".67rem",
    fontWeight: 700,
    letterSpacing: ".12em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,.75)",
    background: "#0D2060",
    textAlign: "left",
    whiteSpace: "nowrap",
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>

      {/* Tab switcher */}
      <div style={{
        display: "inline-flex",
        gap: 4,
        padding: 4,
        background: "var(--surface-2)",
        border: "1px solid var(--line)",
        borderRadius: 10,
        marginBottom: 24,
      }}>
        {[
          { key: "expediente",    label: "Expediente Individual" },
          { key: "participacion", label: "Informe de Participación" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            style={{
              padding: "8px 18px",
              borderRadius: 7,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: ".84rem",
              fontWeight: 600,
              transition: "all .15s",
              background: tab === t.key ? "#0D2060" : "transparent",
              color: tab === t.key ? "#fff" : "var(--muted)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: EXPEDIENTE INDIVIDUAL  */}
      {tab === "expediente" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Header card — dark navy */}
          <div style={{
            background: "linear-gradient(135deg, #071020 0%, #0D2060 50%, #142575 100%)",
            borderRadius: 14,
            overflow: "hidden",
            position: "relative",
            boxShadow: "0 8px 32px rgba(13,32,96,.35)",
          }}>
            {/* Grid pattern */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              backgroundImage: "linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)",
              backgroundSize: "28px 28px",
            }} />
            {/* Gold accent top line */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #DBAB3A, #F0D060, #DBAB3A)" }} />

            <div style={{ position: "relative", padding: "28px 32px 24px" }}>
              {/* Label */}
              <div style={{
                fontFamily: "var(--f-data)",
                fontSize: ".6rem", fontWeight: 700, letterSpacing: ".18em",
                textTransform: "uppercase", color: "#C89B2A",
                marginBottom: 14,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span>EXPEDIENTE INDIVIDUAL</span>
                <span style={{ color: "rgba(255,255,255,.2)" }}>·</span>
                <span style={{ color: "#E8C060" }}>PERITO {usuario.numeroPerito ?? "—"}</span>
                <span style={{ marginLeft: "auto", color: "rgba(255,255,255,.25)", fontSize: ".58rem" }}>2025–2026</span>
              </div>

              {/* Name */}
              <h2 className="font-montserrat" style={{
                fontSize: "clamp(1.3rem, 3vw, 1.75rem)",
                fontWeight: 800,
                color: "#FFFFFF",
                lineHeight: 1.1,
                margin: "0 0 8px",
                letterSpacing: "-.01em",
              }}>
                {usuario.nombre}
              </h2>

              {/* Subtitle */}
              <div style={{
                fontFamily: "var(--f-data)",
                fontSize: ".73rem", fontWeight: 600, letterSpacing: ".12em",
                textTransform: "uppercase", color: "rgba(255,255,255,.45)",
              }}>
 INGENIERO&nbsp;·&nbsp;REGISTRO PROFESIONAL{" "}
                <span style={{ color: "#E8C060" }}>{usuario.numeroPerito ?? "—"}</span>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
          }}>
            {[
              { num: String(especialidades.length), label: "Especialidades registradas" },
              { num: "2025", label: "Formación profesional" },
              { num: "2026", label: "Formación profesional" },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "18px 24px",
                borderLeft: i > 0 ? "1px solid var(--line)" : "none",
              }}>
                <div className="font-montserrat" style={{
                  fontSize: "2rem", fontWeight: 800,
                  color: i === 0 ? "#0D2060" : "var(--fg)",
                  lineHeight: 1,
                  marginBottom: 6,
                }}>
                  {s.num}
                </div>
                <div style={{
                  fontFamily: "var(--f-data)",
                  fontSize: ".6rem", fontWeight: 700,
                  letterSpacing: ".1em", textTransform: "uppercase" as const,
                  color: "var(--muted)",
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Section 01 — Formación 2025 */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "22px 24px", boxShadow: "var(--shadow-sm)" }}>
            <SectionHeader num="01" title="Formación y Actualización 2025" />
            {f2025.filter(f => f.estado !== "NO_PARTICIPO").length === 0 ? (
              <p style={{ fontSize: ".84rem", color: "var(--muted)", margin: 0, padding: "12px 0" }}>
 Sin cursos de formación registrados para 2025.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {f2025.filter(f => f.estado !== "NO_PARTICIPO").map((f, idx, arr) => {
                  const cfg = ESTADO_CFG[f.estado] ?? ESTADO_CFG.REGISTRADO
                  return (
                    <div key={f.id} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "11px 0",
                      borderBottom: idx < arr.length - 1 ? "1px solid var(--line)" : "none",
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: cfg.color, flexShrink: 0,
                      }} />
                      <span style={{ flex: 1, fontSize: ".86rem", color: "var(--fg)", lineHeight: 1.4 }}>
                        {f.nombre}
                      </span>
                      <span style={{
                        padding: "3px 10px", borderRadius: 20,
                        fontSize: ".68rem", fontWeight: 700,
                        color: cfg.color, background: cfg.bg,
                        border: `1px solid ${cfg.color}33`,
                        flexShrink: 0,
                      }}>
                        {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Section 02 — Formación 2026 */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "22px 24px", boxShadow: "var(--shadow-sm)" }}>
            <SectionHeader num="02" title="Formación y Actualización 2026" />
            {f2026.filter(f => f.estado !== "NO_PARTICIPO").length === 0 ? (
              <p style={{ fontSize: ".84rem", color: "var(--muted)", margin: 0, padding: "12px 0" }}>
 Sin cursos de formación registrados para 2026.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {f2026.filter(f => f.estado !== "NO_PARTICIPO").map((f, idx, arr) => {
                  const cfg = ESTADO_CFG[f.estado] ?? ESTADO_CFG.REGISTRADO
                  return (
                    <div key={f.id} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "11px 0",
                      borderBottom: idx < arr.length - 1 ? "1px solid var(--line)" : "none",
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: ".86rem", color: "var(--fg)", lineHeight: 1.4 }}>{f.nombre}</span>
                      <span style={{
                        padding: "3px 10px", borderRadius: 20,
                        fontSize: ".68rem", fontWeight: 700,
                        color: cfg.color, background: cfg.bg,
                        border: `1px solid ${cfg.color}33`, flexShrink: 0,
                      }}>{cfg.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Section 03 — Especialidades table */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ padding: "22px 24px 16px" }}>
              <SectionHeader num="03" title="Pericias y Especialidades Registradas" />
            </div>
            {especialidades.length === 0 ? (
              <div style={{ padding: "16px 24px 24px" }}>
                <p style={{ fontSize: ".84rem", color: "var(--muted)", margin: 0 }}>Sin especialidades registradas.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...TH_STYLE, width: 72 }}>NÚM.</th>
                    <th style={{ ...TH_STYLE }}>ESPECIALIDAD</th>
                    <th style={{ ...TH_STYLE, textAlign: "right" as const }}>CLAVE DE REGISTRO</th>
                  </tr>
                </thead>
                <tbody>
                  {especialidades.map((e, idx) => (
                    <tr key={e.id} style={{ background: idx % 2 === 0 ? "var(--surface)" : "var(--surface-2)" }}>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: ".78rem", fontWeight: 700, color: "#0D2060" }}>
                        {String(e.numero).padStart(2, "0")}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: ".86rem", color: "var(--fg)" }}>
                        {e.nombre}
                      </td>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: ".78rem", fontWeight: 700, color: "#1D4ED8", textAlign: "right" as const }}>
                        {e.claveRegistro}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Section 04 — Observaciones */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "22px 24px", boxShadow: "var(--shadow-sm)" }}>
            <SectionHeader num="04" title="Observaciones Institucionales" />
            <p style={{ fontSize: ".86rem", color: "var(--fg-2)", lineHeight: 1.7, margin: 0 }}>
              {observaciones ?? "Seguimiento de formación y especialidades conforme a los registros institucionales disponibles."}
            </p>
          </div>

          {/* Footer */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontFamily: "var(--f-data)", fontSize: ".66rem", fontWeight: 600,
            letterSpacing: ".08em", textTransform: "uppercase",
            color: "var(--muted)", padding: "8px 2px",
          }}>
            <span>ADMINISTRACIÓN CIME VERACRUZ</span>
            <span>1 / 2</span>
          </div>
        </div>
      )}

      {/* TAB 2: INFORME DE PARTICIPACIÓN  */}
      {tab === "participacion" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Header */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "24px 28px", boxShadow: "var(--shadow-sm)" }}>
            <div style={{
              fontFamily: "var(--f-data)", fontSize: ".6rem", fontWeight: 700,
              letterSpacing: ".15em", textTransform: "uppercase",
              color: "#C89B2A", marginBottom: 10,
            }}>
 ANEXO ESTADÍSTICO · CONTROL DE PARTICIPACIÓN
            </div>
            <h2 className="font-montserrat" style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--fg)", margin: "0 0 8px" }}>
 Informe de participación formativa
            </h2>
            <div style={{
              fontFamily: "var(--f-data)", fontSize: ".76rem", fontWeight: 600,
              letterSpacing: ".08em", color: "var(--muted)",
            }}>
 ING. {usuario.nombre.toUpperCase()} · PERIODO 2025–2026
            </div>
          </div>

          {/* Stat cards 2025 / 2026 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { year: 2025, data: f2025, participated: participados2025 },
              { year: 2026, data: f2026, participated: participados2026 },
            ].map(({ year, data, participated }) => {
              const total = data.length
              const p = pct(participated, total)
              return (
                <div key={year} style={{
                  background: "var(--surface)", border: "1px solid var(--line)",
                  borderRadius: 12, padding: "20px 24px",
                  boxShadow: "var(--shadow-sm)",
                }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
                    <span className="font-montserrat" style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--fg)" }}>{year}</span>
                    <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--fg)" }}>{participated} / {total}</span>
                    <span className="font-montserrat" style={{ fontSize: "1.75rem", fontWeight: 900, color: p >= 80 ? "#10B981" : p >= 60 ? "#D97706" : "#DC2626" }}>
                      {total > 0 ? `${p} %` : "—"}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: "var(--f-data)", fontSize: ".6rem", fontWeight: 700,
                    letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)",
                  }}>
 ACTIVIDADES CONTABILIZADAS
                  </div>
                </div>
              )
            })}
          </div>

          {/* Section 01 — Catálogo 2025 */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ padding: "22px 24px 16px" }}>
              <SectionHeader num="01" title="Catálogo de Cursos 2025" />
            </div>
            {f2025.length === 0 ? (
              <div style={{ padding: "0 24px 24px" }}>
                <p style={{ fontSize: ".84rem", color: "var(--muted)", margin: 0 }}>Sin registros para 2025.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...TH_STYLE, width: 100 }}>FECHA</th>
                    <th style={{ ...TH_STYLE }}>CURSO / ACTIVIDAD</th>
                    <th style={{ ...TH_STYLE, textAlign: "right" as const, width: 140 }}>REGISTRO</th>
                  </tr>
                </thead>
                <tbody>
                  {f2025.map((f, idx) => (
                    <tr key={f.id} style={{ background: idx % 2 === 0 ? "var(--surface)" : "var(--surface-2)" }}>
                      <td style={{ padding: "11px 16px", fontFamily: "var(--f-data)", fontSize: ".76rem", fontWeight: 700, color: "#1D4ED8" }}>
                        {f.mes ?? "—"}
                      </td>
                      <td style={{ padding: "11px 16px", fontSize: ".86rem", color: "var(--fg)" }}>{f.nombre}</td>
                      <td style={{ padding: "11px 16px", textAlign: "right" as const }}>
                        {f.estado !== "NO_PARTICIPO" ? (
                          <span style={{ fontSize: ".76rem", fontWeight: 700, color: "#1D4ED8" }}>Participó</span>
                        ) : (
                          <span style={{ fontSize: ".76rem", fontWeight: 700, color: "#9CA3AF" }}>No participó</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Section 02 — Catálogo 2026 */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ padding: "22px 24px 16px" }}>
              <SectionHeader num="02" title="Catálogo de Cursos 2026" />
            </div>
            {f2026.length === 0 ? (
              <div style={{ padding: "0 24px 24px" }}>
                <p style={{ fontSize: ".84rem", color: "var(--muted)", margin: 0 }}>Sin registros para 2026.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...TH_STYLE, width: 100 }}>FECHA</th>
                    <th style={{ ...TH_STYLE }}>CURSO / ACTIVIDAD</th>
                    <th style={{ ...TH_STYLE, textAlign: "right" as const, width: 140 }}>REGISTRO</th>
                  </tr>
                </thead>
                <tbody>
                  {f2026.map((f, idx) => (
                    <tr key={f.id} style={{ background: idx % 2 === 0 ? "var(--surface)" : "var(--surface-2)" }}>
                      <td style={{ padding: "11px 16px", fontFamily: "var(--f-data)", fontSize: ".76rem", fontWeight: 700, color: "#1D4ED8" }}>
                        {f.mes ?? "—"}
                      </td>
                      <td style={{ padding: "11px 16px", fontSize: ".86rem", color: "var(--fg)" }}>{f.nombre}</td>
                      <td style={{ padding: "11px 16px", textAlign: "right" as const }}>
                        {f.estado !== "NO_PARTICIPO" ? (
                          <span style={{ fontSize: ".76rem", fontWeight: 700, color: "#1D4ED8" }}>Participó</span>
                        ) : (
                          <span style={{ fontSize: ".76rem", fontWeight: 700, color: "#9CA3AF" }}>No participó</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Section 03 — Observaciones control */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "22px 24px", boxShadow: "var(--shadow-sm)" }}>
            <SectionHeader num="03" title="Observaciones de Control Institucional" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: ".86rem", color: "var(--fg-2)", lineHeight: 1.7, margin: 0 }}>
 El presente expediente concentra las actividades formativas y la participación profesional registrada durante 2025–2026.
              </p>
              {observaciones && (
                <p style={{ fontSize: ".86rem", color: "var(--fg-2)", lineHeight: 1.7, margin: 0 }}>
                  {observaciones}
                </p>
              )}
              <p style={{ fontSize: ".82rem", color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
 La contabilización de participación no sustituye la validación documental de acreditaciones pendientes.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontFamily: "var(--f-data)", fontSize: ".66rem", fontWeight: 600,
            letterSpacing: ".08em", textTransform: "uppercase",
            color: "var(--muted)", padding: "8px 2px",
          }}>
            <span>ADMINISTRACIÓN CIME VERACRUZ</span>
            <span>2 / 2</span>
          </div>
        </div>
      )}
    </div>
  )
}

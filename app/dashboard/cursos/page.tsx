import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import InscribirBtn from "./InscribirBtn"
import { GraduationCap, Check, Clock, User, CalendarDays, BookOpen, Award } from "lucide-react"

export const dynamic = "force-dynamic"

const AREA_LABEL: Record<string, string>  = { ELE: "Eléctrica", MEC: "Mecánica", SOL: "Solar" }
const AREA_COLOR: Record<string, string>  = { ELE: "#0ea5e9", MEC: "#10b981", SOL: "#f59e0b" }
const AREA_GRAD: Record<string, string>   = {
  ELE: "linear-gradient(140deg,#052233 0%,#0e4a6e 100%)",
  MEC: "linear-gradient(140deg,#05231a 0%,#0a5c3a 100%)",
  SOL: "linear-gradient(140deg,#231a05 0%,#7a5000 100%)",
}

const money = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })

export default async function CursosPage() {
  const session = await auth()
  const userId  = (session?.user as any)?.id

  const inscripciones = await prisma.inscripcionCurso.findMany({
    where: { usuarioId: userId },
    include: { curso: { include: { modulos: { orderBy: { orden: "asc" } } } } },
    orderBy: { createdAt: "desc" },
  })

  const cursosAbiertos = await prisma.curso.findMany({
    where: { estado: { in: ["ABIERTO", "LLENO"] } },
    include: { modulos: true, inscritos: true },
    orderBy: { fechaInicio: "asc" },
  })

  const inscritosIds = new Set(inscripciones.map(i => i.cursoId))
  const enCurso      = inscripciones.filter(i => i.estado !== "COMPLETADO")
  const completados  = inscripciones.filter(i => i.estado === "COMPLETADO")

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mis cursos</h1>
          <p>Formación continua con valor curricular · CIME Veracruz 2026</p>
        </div>
      </div>

      {/* ── Cursos en progreso ─────────────────────────────── */}
      {enCurso.length > 0 && (
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--fg)" }}>En progreso</h2>
            <span className="chip nodot info">{enCurso.length}</span>
          </div>
          <div className="lms-course-grid">
            {enCurso.map(i => {
              const c     = i.curso
              const color = AREA_COLOR[c.area] ?? "#6366f1"
              const grad  = AREA_GRAD[c.area] ?? "linear-gradient(140deg,#1a1a2e,#6366f1)"
              const p     = Math.round(i.progreso)
              return (
                <div key={i.id} className="lms-course">
                  <div className="lms-course-banner" style={{ background: grad }}>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="subject-tag" style={{ background: `${color}22`, color, borderColor: `${color}44`, display: "inline-block", marginBottom: 5 }}>
                          {AREA_LABEL[c.area]}
                        </span>
                        <div style={{ fontSize: ".9rem", fontWeight: 700, color: "#fff", lineHeight: 1.3, paddingRight: 8 }}>{c.titulo}</div>
                      </div>
                      <div style={{ width: 38, height: 38, borderRadius: 8, background: `${color}22`, border: `1px solid ${color}44`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <GraduationCap size={18} strokeWidth={1.75} color={color} />
                      </div>
                    </div>
                  </div>
                  <div className="lms-course-body">
                    <div style={{ fontSize: ".76rem", color: "var(--muted)", display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={12} strokeWidth={2} />{c.instructor}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} strokeWidth={2} />{c.horas} horas</span>
                    </div>
                    <div>
                      <div className="lms-progress-label">
                        <span>Módulo {i.moduloActual + 1} de {c.modulos.length}</span>
                        <b style={{ color, fontFamily: "var(--f-mono)" }}>{p}%</b>
                      </div>
                      <div className="lms-progress-track">
                        <div className="lms-progress-fill" style={{ width: `${p}%`, background: color }} />
                      </div>
                    </div>
                  </div>
                  <div className="lms-course-footer">
                    <span style={{ fontSize: ".72rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
                      <CalendarDays size={12} strokeWidth={2} />
                      Termina {new Date(c.fechaFin).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <button className="btn sm primary" style={{ fontSize: ".78rem", height: 30, padding: "0 12px" }}>
                      Continuar →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Catálogo ───────────────────────────────────────── */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--fg)" }}>Catálogo de cursos</h2>
            <span className="chip nodot" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
              {cursosAbiertos.length} disponibles
            </span>
          </div>
        </div>

        {cursosAbiertos.length === 0 ? (
          <div className="card" style={{ padding: "40px 24px", textAlign: "center" }}>
            <BookOpen size={36} strokeWidth={1.25} style={{ margin: "0 auto 12px", color: "var(--muted)" }} />
            <p style={{ color: "var(--muted)", fontSize: ".88rem" }}>Sin cursos disponibles en este momento</p>
          </div>
        ) : (
          <div className="lms-course-grid">
            {cursosAbiertos.map(c => {
              const yaInscrito = inscritosIds.has(c.id)
              const lleno      = c.estado === "LLENO" || c.inscritos.length >= c.cupo
              const color      = AREA_COLOR[c.area] ?? "#6366f1"
              const grad       = AREA_GRAD[c.area] ?? "linear-gradient(140deg,#1a1a2e,#6366f1)"
              const pctCupo    = Math.round(c.inscritos.length / c.cupo * 100)

              return (
                <div key={c.id} className="lms-course">
                  {/* Banner */}
                  <div className="lms-course-banner" style={{ background: grad, height: 110 }}>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 5, marginBottom: 6, flexWrap: "wrap" }}>
                          <span className="subject-tag" style={{ background: `${color}22`, color, borderColor: `${color}44` }}>
                            {AREA_LABEL[c.area]}
                          </span>
                          {yaInscrito && (
                            <span className="subject-tag" style={{ background: "#10b98122", color: "#10b981", borderColor: "#10b98144", display: "flex", alignItems: "center", gap: 3 }}>
                              <Check size={10} strokeWidth={3} /> Inscrito
                            </span>
                          )}
                          {lleno && !yaInscrito && (
                            <span className="subject-tag" style={{ background: "#ef444422", color: "#ef4444", borderColor: "#ef444444" }}>
                              Cupo lleno
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: ".7rem", color: "rgba(255,255,255,.4)", fontFamily: "var(--f-mono)", marginBottom: 3 }}>{c.codigo}</div>
                        <div style={{ fontSize: ".92rem", fontWeight: 700, color: "#fff", lineHeight: 1.3, paddingRight: 8 }}>{c.titulo}</div>
                      </div>
                      <div style={{ width: 40, height: 40, borderRadius: 9, background: `${color}22`, border: `1px solid ${color}44`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <GraduationCap size={20} strokeWidth={1.75} color={color} />
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="lms-course-body">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: ".62rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Instructor</div>
                        <div style={{ fontSize: ".82rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.instructor}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: ".62rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Modalidad</div>
                        <div style={{ fontSize: ".82rem", fontWeight: 500 }}>{c.modalidad}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: ".62rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Inicio</div>
                        <div style={{ fontSize: ".82rem", fontWeight: 500 }}>
                          {new Date(c.fechaInicio).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: ".62rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Duración</div>
                        <div style={{ fontSize: ".82rem", fontWeight: 700, color }}>{c.horas} horas</div>
                      </div>
                    </div>

                    {/* Capacity */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".7rem", color: "var(--muted)", marginBottom: 4 }}>
                        <span>Cupo disponible</span>
                        <span style={{ fontFamily: "var(--f-mono)" }}>{c.inscritos.length}/{c.cupo}</span>
                      </div>
                      <div className="lms-progress-track">
                        <div className="lms-progress-fill" style={{ width: `${pctCupo}%`, background: lleno ? "#ef4444" : color }} />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="lms-course-footer">
                    <div style={{ fontSize: ".88rem", fontWeight: 700 }}>{money(c.precio)}</div>
                    {yaInscrito
                      ? <button className="btn sm" disabled style={{ opacity: .5, cursor: "default", height: 30, fontSize: ".78rem" }}>Ya inscrito</button>
                      : lleno
                        ? <button className="btn sm" disabled style={{ opacity: .5, cursor: "default", height: 30, fontSize: ".78rem" }}>Sin cupo</button>
                        : <InscribirBtn cursoId={c.id} titulo={c.titulo} />
                    }
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Completados ────────────────────────────────────── */}
      {completados.length > 0 && (
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--fg)" }}>Completados</h2>
            <span className="chip nodot ok">{completados.length} acreditados</span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {completados.map(i => (
              <div key={i.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r)", padding: "14px 18px", display: "flex", gap: 14, alignItems: "center", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 9, background: "var(--ok-bg)", color: "var(--ok)", display: "grid", placeItems: "center", flexShrink: 0, border: "1px solid var(--ok-ring)" }}>
                  <Award size={18} strokeWidth={1.75} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: ".9rem", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.curso.titulo}</div>
                  <div style={{ fontSize: ".74rem", color: "var(--muted)", display: "flex", gap: 8 }}>
                    <span>{i.curso.horas} h</span>
                    {i.folio && <span>· Folio {i.folio}</span>}
                    {i.calificacion && <span>· {i.calificacion.toFixed(1)} pts</span>}
                  </div>
                </div>
                <button className="btn sm" style={{ flexShrink: 0 }}>
                  <Award size={13} strokeWidth={2} /> Constancia
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

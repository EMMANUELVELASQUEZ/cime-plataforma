import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import InscribirBtn from "./InscribirBtn"
import { GraduationCap, Check, Clock, MapPin, User, CalendarDays } from "lucide-react"

export const dynamic = "force-dynamic"

const AREA_LABEL: Record<string, string> = { ELE: "Eléctrica", MEC: "Mecánica", SOL: "Solar" }
const AREA_COLOR: Record<string, string> = { ELE: "#0ea5e9", MEC: "#10b981", SOL: "#f59e0b" }
const AREA_BG: Record<string, string> = { ELE: "#0c2a3a", MEC: "#0a2a1f", SOL: "#2a1f0a" }

const money = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })

export default async function CursosPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id

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
  const enCurso = inscripciones.filter(i => i.estado !== "COMPLETADO")
  const completados = inscripciones.filter(i => i.estado === "COMPLETADO")

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mis cursos</h1>
          <p>Cursos de actualización con valor curricular.</p>
        </div>
      </div>

      {/* En curso */}
      {enCurso.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--fg)" }}>En progreso</h2>
            <span className="chip nodot info">{enCurso.length}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {enCurso.map(i => {
              const c = i.curso
              const pct = Math.round(i.progreso)
              const color = AREA_COLOR[c.area] ?? "#6366f1"
              const bg = AREA_BG[c.area] ?? "#1a1a2e"
              return (
                <div key={i.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ background: bg, borderBottom: `2px solid ${color}`, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: color + "22", color, display: "grid", placeItems: "center", flexShrink: 0, border: `1px solid ${color}44` }}>
                      <GraduationCap size={22} strokeWidth={1.75} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: ".72rem", color, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 2 }}>{AREA_LABEL[c.area]}</div>
                      <div style={{ fontWeight: 700, fontSize: ".95rem", color: "var(--fg)", lineHeight: 1.3 }}>{c.titulo}</div>
                    </div>
                    <span style={{ background: color + "22", color, fontSize: ".75rem", fontWeight: 700, padding: "4px 10px", borderRadius: 20, border: `1px solid ${color}44`, whiteSpace: "nowrap" }}>{c.horas} h</span>
                  </div>
                  <div style={{ padding: "16px 20px" }}>
                    <div style={{ fontSize: ".82rem", color: "var(--muted)", marginBottom: 14 }}>
                      {c.instructor} · {c.modalidad} · {c.lugar}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: ".78rem", color: "var(--muted)" }}>Módulo {i.moduloActual + 1} de {c.modulos.length}</span>
                      <b style={{ fontSize: ".85rem", color, fontFamily: "monospace" }}>{pct}%</b>
                    </div>
                    <div style={{ height: 6, background: "var(--line)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width .4s" }} />
                    </div>
                    <div style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: 8 }}>
                      Termina {new Date(c.fechaFin).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Catálogo */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--fg)" }}>Catálogo de cursos</h2>
          <span className="chip nodot" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>{cursosAbiertos.length} disponibles</span>
        </div>

        {cursosAbiertos.length === 0 ? (
          <div className="empty">Sin cursos disponibles en este momento</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {cursosAbiertos.map(c => {
              const yaInscrito = inscritosIds.has(c.id)
              const lleno = c.estado === "LLENO" || c.inscritos.length >= c.cupo
              const color = AREA_COLOR[c.area] ?? "#6366f1"
              const bg = AREA_BG[c.area] ?? "#1a1a2e"
              const pctCupo = Math.round(c.inscritos.length / c.cupo * 100)

              return (
                <div key={c.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  {/* Header de color */}
                  <div style={{ background: bg, padding: "20px 20px 16px", borderBottom: `2px solid ${color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: color + "22", color, display: "grid", placeItems: "center", border: `1px solid ${color}44` }}>
                        <GraduationCap size={22} strokeWidth={1.75} />
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <span style={{ background: color + "22", color, fontSize: ".7rem", fontWeight: 700, padding: "3px 9px", borderRadius: 20, border: `1px solid ${color}44` }}>
                          {AREA_LABEL[c.area]}
                        </span>
                        {yaInscrito && (
                          <span style={{ background: "#10b98122", color: "#10b981", fontSize: ".7rem", fontWeight: 700, padding: "3px 9px", borderRadius: 20, display: "flex", alignItems: "center", gap: 3 }}>
                            <Check size={12} strokeWidth={2.5} /> Inscrito
                          </span>
                        )}
                        {lleno && !yaInscrito && (
                          <span style={{ background: "#ef444422", color: "#ef4444", fontSize: ".7rem", fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>
                            Cupo lleno
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: ".7rem", color: "var(--muted)", fontFamily: "monospace", marginBottom: 3 }}>{c.codigo}</div>
                      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--fg)", lineHeight: 1.35 }}>{c.titulo}</h3>
                    </div>
                  </div>

                  {/* Cuerpo */}
                  <div style={{ padding: "16px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: ".65rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>Instructor</div>
                        <div style={{ fontSize: ".82rem", fontWeight: 500 }}>{c.instructor}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: ".65rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>Modalidad</div>
                        <div style={{ fontSize: ".82rem", fontWeight: 500 }}>{c.modalidad}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: ".65rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>Inicio</div>
                        <div style={{ fontSize: ".82rem", fontWeight: 500 }}>{new Date(c.fechaInicio).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: ".65rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>Duración</div>
                        <div style={{ fontSize: ".82rem", fontWeight: 700, color }}>{c.horas} horas</div>
                      </div>
                    </div>

                    {/* Capacidad */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".72rem", color: "var(--muted)", marginBottom: 4 }}>
                        <span>Cupo</span>
                        <span>{c.inscritos.length}/{c.cupo} inscritos</span>
                      </div>
                      <div style={{ height: 5, background: "var(--line)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pctCupo}%`, background: lleno ? "#ef4444" : color, borderRadius: 99 }} />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ padding: "14px 20px", borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: ".85rem", fontWeight: 700, color: "var(--fg)" }}>{money(c.precio)}</div>
                    {yaInscrito
                      ? <button className="btn sm" style={{ opacity: .5, cursor: "default" }} disabled>Ya inscrito</button>
                      : lleno
                        ? <button className="btn sm" disabled style={{ opacity: .5, cursor: "default" }}>Sin cupo</button>
                        : <InscribirBtn cursoId={c.id} titulo={c.titulo} />
                    }
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Completados */}
      {completados.length > 0 && (
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--fg)" }}>Completados</h2>
            <span className="chip nodot ok">{completados.length} acreditados</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {completados.map(i => (
              <div key={i.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 9, background: "#10b98122", color: "#10b981", display: "grid", placeItems: "center", flexShrink: 0, border: "1px solid #10b98133" }}>
                  <Check size={16} strokeWidth={2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: ".9rem", marginBottom: 2 }}>{i.curso.titulo}</div>
                  <div style={{ fontSize: ".75rem", color: "var(--muted)" }}>{i.curso.horas} h · Folio {i.folio ?? "—"} {i.calificacion ? `· ${i.calificacion.toFixed(1)}` : ""}</div>
                </div>
                <button className="btn sm">Constancia</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

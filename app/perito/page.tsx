import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  Calendar, Megaphone, MessageCircle, FileUser, FolderOpen,
  BookMarked, ChevronRight, MapPin, Shield, ArrowRight, Bell,
} from "lucide-react"
import AvisosCarousel from "@/components/AvisosCarousel"

export const dynamic = "force-dynamic"

const ESTC: Record<string, { label: string; bg: string; text: string }> = {
  VIGENTE:     { label: "Vigente",     bg: "rgba(16,185,129,.15)", text: "#34D399" },
  POR_RENOVAR: { label: "Por renovar", bg: "rgba(245,158,11,.15)", text: "#FBBF24" },
  SUSPENDIDO:  { label: "Suspendido",  bg: "rgba(239,68,68,.15)",  text: "#F87171" },
}

const AVISO_DOT: Record<string, string> = {
  Urgente: "#EF4444", Importante: "#F59E0B", Informativo: "#3B82F6", Convocatoria: "#10B981",
}

function initials(name: string) {
  return name.replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "")
    .split(/\s+/).slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase()
}

export default async function PeritoInicio() {
  const session = await auth()
  const userId  = (session?.user as any)?.id

  const [usuario, eventos, avisos, mensajesNoLeidos, directorio, avisosCarousel] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        nombre: true, numeroPerito: true, especialidad: true,
        alta: true, cedula: true, vigencia: true, ciudad: true,
        estado: true,
      },
    }),
    prisma.evento.findMany({
      where: { fecha: { gte: new Date() } },
      orderBy: { fecha: "asc" },
      take: 4,
    }),
    prisma.aviso.findMany({
      orderBy: [{ fijado: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.mensaje.count({ where: { usuarioId: userId, deAdmin: true, leido: false } }),
    prisma.directorioMiembro.findMany({
      orderBy: [{ area: "asc" }, { orden: "asc" }],
    }),
    prisma.aviso.findMany({
      orderBy: [{ fijado: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
  ])

  if (!usuario) return null

  const est = ESTC[usuario.estado] ?? ESTC.VIGENTE
  const hour = new Date().getHours()
  const saludo = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches"

  const EV_COLOR: Record<string, { bg: string; text: string }> = {
    Asamblea:    { bg: "#EEF2FF", text: "#4F46E5" },
    Taller:      { bg: "#E0F2FE", text: "#0284C7" },
    Conferencia: { bg: "#F3E8FF", text: "#7C3AED" },
    Evaluación:  { bg: "#D1FAE5", text: "#059669" },
    Cuota:       { bg: "#FEF3C7", text: "#D97706" },
  }
  const evColor = (t: string) => EV_COLOR[t] ?? { bg: "#DBEAFE", text: "#1D4ED8" }

  return (
    <>
      {/* ── Banner ─────────────────────────────────────────── */}
      <div style={{
        position: "relative", borderRadius: 16, overflow: "hidden",
        background: "linear-gradient(120deg, #0D2060 0%, #1549B8 60%, #1A5ED4 100%)",
        display: "flex", boxShadow: "0 4px 24px rgba(0,0,0,.18)",
      }}>
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 5, zIndex: 2,
          background: "linear-gradient(180deg, #DBAB3A 0%, #F0D060 50%, #DBAB3A 100%)",
        }} />
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)",
          backgroundSize: "32px 32px",
        }} />

        <div style={{
          position: "relative", zIndex: 1, flex: 1, minWidth: 0,
          display: "flex", alignItems: "center", gap: 18,
          padding: "26px 24px 26px 32px",
        }}>
          <div style={{
            width: 72, height: 72, flexShrink: 0, borderRadius: "50%",
            border: "3px solid #E8C060",
            boxShadow: "0 0 0 4px rgba(232,192,96,.15), 0 4px 16px rgba(0,0,0,.3)",
            background: "linear-gradient(135deg, #1240A0 0%, #0D2060 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-montserrat), Montserrat, system-ui",
            fontSize: "1.5rem", fontWeight: 800, color: "#E8C060",
          }}>
            {initials(usuario.nombre)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 8 }}>
              {usuario.numeroPerito && (
                <span style={{
                  fontFamily: "var(--f-mono)", fontSize: ".63rem", color: "#E8C060",
                  letterSpacing: ".07em", background: "rgba(232,192,96,.12)",
                  border: "1px solid rgba(232,192,96,.28)", padding: "2px 8px", borderRadius: 4,
                }}>
                  CIME-PER-{usuario.numeroPerito}
                </span>
              )}
              <span style={{
                fontFamily: "var(--f-data)", fontSize: ".6rem", fontWeight: 700,
                letterSpacing: ".08em", textTransform: "uppercase",
                padding: "2px 8px", borderRadius: 4,
                background: "rgba(16,185,129,.18)", color: "#34D399",
              }}>
                PERITO
              </span>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontFamily: "var(--f-data)", fontSize: ".62rem", fontWeight: 700,
                letterSpacing: ".06em", textTransform: "uppercase",
                padding: "2px 8px", borderRadius: 99,
                background: est.bg, color: est.text,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: est.text, flexShrink: 0 }} />
                {est.label}
              </span>
            </div>
            <h1 style={{
              fontSize: "clamp(1.05rem,2vw,1.5rem)", fontWeight: 700,
              color: "#FFFFFF", lineHeight: 1.2, letterSpacing: "-.01em", margin: "0 0 7px",
              fontFamily: "var(--font-montserrat), Montserrat, system-ui",
            }}>
              {saludo},{" "}
              <span style={{ color: "#E8C060" }}>
                {usuario.nombre.split(" ").slice(0, 2).join(" ")}
              </span>
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "3px 14px" }}>
              {usuario.especialidad && (
                <span style={{ fontFamily: "var(--f-data)", fontSize: ".7rem", color: "rgba(255,255,255,.6)", display: "flex", alignItems: "center", gap: 5 }}>
                  <Shield size={10} strokeWidth={2} style={{ color: "rgba(232,192,96,.55)" }} />
                  {usuario.especialidad}
                </span>
              )}
              {usuario.ciudad && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "var(--f-data)", fontSize: ".68rem", color: "rgba(255,255,255,.4)" }}>
                  <MapPin size={10} strokeWidth={2} /> {usuario.ciudad}
                </span>
              )}
              {usuario.vigencia && (
                <span style={{ fontFamily: "var(--f-data)", fontSize: ".67rem", color: "rgba(255,255,255,.35)" }}>
                  Vigencia {usuario.vigencia}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{
          position: "relative", zIndex: 1, flexShrink: 0,
          display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center",
          gap: 10, padding: "20px 28px 20px 24px",
          borderLeft: "1px solid rgba(255,255,255,.1)", minWidth: 180,
        }}>
          <div style={{ userSelect: "none", textAlign: "right" }}>
            <div style={{
              fontFamily: "var(--font-montserrat), Montserrat, system-ui",
              fontWeight: 900, fontSize: "clamp(1.8rem,3.5vw,2.8rem)",
              letterSpacing: ".2em", lineHeight: 1, color: "#E8C060",
              textShadow: "0 2px 16px rgba(232,192,96,.3)",
            }}>CIME</div>
            <div style={{ fontFamily: "var(--f-data)", fontSize: ".48rem", letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(232,192,96,.5)", marginTop: 3 }}>
              Veracruz · México
            </div>
          </div>
          <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,.1)" }} />
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 6 }}>
            <div>
              <div style={{ fontFamily: "var(--f-data)", fontSize: ".58rem", color: "rgba(255,255,255,.35)", letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 3 }}>Estatus</div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontFamily: "var(--f-data)", fontSize: ".7rem", fontWeight: 800,
                letterSpacing: ".06em", textTransform: "uppercase",
                padding: "4px 10px", borderRadius: 99,
                background: est.bg, color: est.text,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: est.text }} />
                {est.label}
              </div>
            </div>
            {usuario.vigencia && (
              <div>
                <div style={{ fontFamily: "var(--f-data)", fontSize: ".58rem", color: "rgba(255,255,255,.35)", letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 3 }}>Vigencia</div>
                <div style={{ fontFamily: "var(--font-montserrat), Montserrat", fontSize: "1.1rem", fontWeight: 800, color: "#E8C060", lineHeight: 1 }}>
                  {usuario.vigencia}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Carousel de avisos ──────────────────────────────── */}
      <AvisosCarousel
        avisos={avisosCarousel.map(a => ({ ...a, createdAt: a.createdAt.toISOString() }))}
        titulo="Avisos del Colegio"
      />

      {/* ── Grid principal ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12" style={{ gap: 24, alignItems: "start" }}>

        {/* Columna izquierda */}
        <div className="lg:col-span-8" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Accesos rápidos */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { href: "/perito/calendario",  icon: <Calendar    size={22} strokeWidth={1.75} />, label: "Calendario",         sub: `${eventos.length} próximos`, iconBg: "#EDE9FE", iconColor: "#7C3AED", accent: "#7C3AED" },
              { href: "/perito/avisos",      icon: <Bell        size={22} strokeWidth={1.75} />, label: "Avisos",             sub: `${avisos.length} publicados`, iconBg: "#FEF3C7", iconColor: "#D97706", accent: "#D97706" },
              { href: "/perito/mensajes",    icon: <MessageCircle size={22} strokeWidth={1.75} />, label: "Mensajes",        sub: mensajesNoLeidos > 0 ? `${mensajesNoLeidos} sin leer` : "Sin pendientes", iconBg: mensajesNoLeidos > 0 ? "#FEE2E2" : "#DBEAFE", iconColor: mensajesNoLeidos > 0 ? "#DC2626" : "#1D4ED8", accent: mensajesNoLeidos > 0 ? "#DC2626" : "#1D4ED8" },
              { href: "/perito/informacion", icon: <FileUser    size={22} strokeWidth={1.75} />, label: "Mi Información",    sub: "Perfil profesional",          iconBg: "#D1FAE5", iconColor: "#059669", accent: "#059669" },
              { href: "/perito/expedientes", icon: <FolderOpen  size={22} strokeWidth={1.75} />, label: "Mis Expedientes",   sub: "Historial de trámites",       iconBg: "#E0F2FE", iconColor: "#0284C7", accent: "#0284C7" },
              { href: "/perito/documentos",  icon: <BookMarked  size={22} strokeWidth={1.75} />, label: "Documentos",        sub: "Documentos personales",       iconBg: "#F3E8FF", iconColor: "#7C3AED", accent: "#7C3AED" },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                textDecoration: "none", background: "var(--surface)", border: "1px solid var(--line)",
                borderLeft: `3px solid ${item.accent}`, borderRadius: 10, boxShadow: "var(--shadow-sm)",
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, display: "grid", placeItems: "center", background: item.iconBg, color: item.iconColor }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: ".9rem", color: "var(--fg)", marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontFamily: "var(--f-data)", fontSize: ".7rem", color: "var(--muted)" }}>{item.sub}</div>
                </div>
                <ChevronRight size={15} strokeWidth={2.5} style={{ color: "var(--muted-2)", flexShrink: 0 }} />
              </Link>
            ))}
          </div>

          {/* Próximos eventos */}
          {eventos.length > 0 && (
            <section>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h2 className="font-montserrat" style={{ fontSize: "1rem", fontWeight: 700, color: "var(--fg)", margin: 0 }}>Próximos eventos</h2>
                <Link href="/perito/calendario" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: ".8rem", fontWeight: 600, color: "var(--brand)", textDecoration: "none" }}>
                  Ver todos <ChevronRight size={13} strokeWidth={2.5} />
                </Link>
              </div>
              <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                {eventos.map((ev, idx) => {
                  const fecha = new Date(ev.fecha)
                  const d = fecha.getDate()
                  const mes = fecha.toLocaleDateString("es-MX", { month: "short" }).replace(".", "").toUpperCase()
                  const tc = evColor(ev.tipo)
                  return (
                    <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 18px", borderBottom: idx < eventos.length - 1 ? "1px solid var(--line)" : undefined }}>
                      <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: tc.bg }}>
                        <span style={{ fontFamily: "var(--font-montserrat), Montserrat", fontWeight: 700, fontSize: ".95rem", color: tc.text, lineHeight: 1 }}>{d}</span>
                        <span style={{ fontFamily: "var(--f-data)", fontWeight: 700, fontSize: ".5rem", letterSpacing: ".1em", color: tc.text }}>{mes}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: ".87rem", color: "var(--fg)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.titulo}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: "var(--f-data)", fontSize: ".58rem", fontWeight: 700, padding: "1px 6px", borderRadius: 3, background: tc.bg, color: tc.text, letterSpacing: ".07em", textTransform: "uppercase" }}>{ev.tipo}</span>
                          <span style={{ fontFamily: "var(--f-data)", fontSize: ".67rem", color: "var(--muted)" }}>{ev.hora} · {ev.lugar}</span>
                        </div>
                      </div>
                      <ChevronRight size={14} strokeWidth={1.75} style={{ color: "var(--muted-2)", flexShrink: 0 }} />
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar derecho */}
        <div className="lg:col-span-4" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Avisos recientes */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
              <h3 className="font-montserrat" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: ".9rem", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
                <Megaphone size={14} strokeWidth={2} style={{ color: "#F59E0B" }} /> Avisos del colegio
              </h3>
              <Link href="/perito/avisos" style={{ fontFamily: "var(--f-data)", fontSize: ".72rem", fontWeight: 600, color: "var(--brand)", textDecoration: "none" }}>
                Ver todos
              </Link>
            </div>
            {avisos.length === 0 ? (
              <div style={{ padding: "28px 20px", textAlign: "center", color: "var(--muted)", fontSize: ".84rem" }}>Sin avisos recientes</div>
            ) : (
              <div>
                {avisos.map((av, idx) => {
                  const dot = AVISO_DOT[av.tipo] ?? "#3B82F6"
                  return (
                    <Link key={av.id} href="/perito/avisos" style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 18px", borderBottom: idx < avisos.length - 1 ? "1px solid var(--line)" : undefined, textDecoration: "none" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: dot, marginTop: 7, boxShadow: `0 0 6px ${dot}66` }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: ".84rem", color: "var(--fg)", lineHeight: 1.35, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                          {av.titulo}
                        </div>
                        <span style={{ fontFamily: "var(--f-data)", fontSize: ".6rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: dot }}>{av.tipo}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Perfil rápido */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
              <h3 className="font-montserrat" style={{ fontSize: ".9rem", fontWeight: 700, color: "var(--fg)", margin: 0 }}>Mi perfil</h3>
              <Link href="/perito/informacion" style={{ fontFamily: "var(--f-data)", fontSize: ".72rem", fontWeight: 600, color: "var(--brand)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                Ver <ArrowRight size={12} strokeWidth={2.5} />
              </Link>
            </div>
            <div style={{ padding: "14px 18px", display: "grid", gap: 10 }}>
              {[
                { label: "No. Perito",   val: usuario.numeroPerito ? `CIME-PER-${usuario.numeroPerito}` : "Sin asignar" },
                { label: "Especialidad", val: usuario.especialidad ?? "—" },
                { label: "Ciudad",       val: usuario.ciudad ?? "—" },
                { label: "Vigencia",     val: usuario.vigencia ?? "—" },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                  <span style={{ fontFamily: "var(--f-data)", fontSize: ".67rem", fontWeight: 600, color: "var(--muted)", letterSpacing: ".04em", textTransform: "uppercase", flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: ".8rem", color: "var(--fg-2)", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Directorio Mesa Directiva ──────────────────────────────── */}
      {directorio.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Mesa Directiva</h2>
            <Link href="/perito/directorio" style={{ fontSize: ".8rem", color: "var(--brand)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
              Ver todos <ChevronRight size={13} strokeWidth={2.5} />
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
            {directorio.slice(0, 6).map(m => {
              const fotoUrl = (() => { try { return m.foto ? (JSON.parse(m.foto) as { url: string }).url : null } catch { return null } })()
              const hue = (m.nombre.charCodeAt(0) * 47) % 360
              return (
                <div key={m.id} style={{
                  background: "var(--surface)", border: "1px solid var(--line)",
                  borderRadius: 10, padding: "20px 14px 16px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  boxShadow: "var(--shadow-sm)", textAlign: "center",
                }}>
                  {fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fotoUrl} alt={m.nombre} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--line)", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: `hsl(${hue} 38% 34%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1.2rem", border: "3px solid #0D206030", flexShrink: 0 }}>
                      {m.nombre.replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "").split(/\s+/).slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: ".85rem", lineHeight: 1.3, color: "var(--fg)" }}>{m.nombre}</div>
                    <div style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: 3 }}>{m.cargo}</div>
                  </div>
                  <span style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 4, background: "#0D206012", color: "#0D2060", border: "1px solid #0D206025" }}>
                    {m.area}
                  </span>
                  {m.email && (
                    <a href={`mailto:${m.email}`} style={{ fontSize: ".72rem", color: "var(--brand)", textDecoration: "none" }}>{m.email}</a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

    </>
  )
}

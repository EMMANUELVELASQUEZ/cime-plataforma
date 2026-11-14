import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  MapPin, Phone, Mail, Award, Shield, Calendar,
  BookOpen, Edit, CheckCircle2, FileText,
} from "lucide-react"

export const dynamic = "force-dynamic"

const ESTC: Record<string, { label: string; bg: string; color: string; border: string }> = {
  VIGENTE:     { label: "Vigente",     bg: "#ECFDF5", color: "#065F46", border: "#6EE7B7" },
  POR_RENOVAR: { label: "Por renovar", bg: "#FFFBEB", color: "#92400E", border: "#FCD34D" },
  SUSPENDIDO:  { label: "Suspendido",  bg: "#FEF2F2", color: "#991B1B", border: "#FCA5A5" },
}

function initials(name: string) {
  return name.replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "")
    .split(/\s+/).slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase()
}

const HUES = [211, 142, 262, 24, 199, 327, 38, 172]
const avatarHue = (name: string) => HUES[name.charCodeAt(0) % HUES.length]

export default async function PeritoInformacionPage() {
  const session = await auth()
  const userId  = (session?.user as any)?.id

  const [usuario, expediente, pagos, avisos] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        nombre: true, correo: true, telefono: true, ciudad: true,
        especialidad: true, cedula: true, alta: true, vigencia: true,
        estado: true,
        numeroPerito: true, numeroColegiado: true,
      },
    }),
    prisma.expediente.findUnique({
      where: { usuarioId: userId },
      select: { id: true, nombre: true, estado: true,
        entradas: { orderBy: { createdAt: "desc" }, take: 3,
          select: { id: true, tipo: true, titulo: true, contenido: true, createdAt: true } },
      },
    }),
    prisma.pago.findMany({
      where: { usuarioId: userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, folio: true, concepto: true, monto: true, estado: true, createdAt: true },
    }),
    prisma.aviso.findMany({
      orderBy: [{ fijado: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
  ])

  if (!usuario) return null

  const hue  = avatarHue(usuario.nombre)
  const est  = ESTC[usuario.estado] ?? ESTC.VIGENTE

  const ENTRADA_CFG: Record<string, { color: string; bg: string }> = {
    NOTA:        { color: "#2563eb", bg: "#EFF6FF" },
    INSTRUCCION: { color: "#7C3AED", bg: "#F3E8FF" },
    DOCUMENTO:   { color: "#059669", bg: "#ECFDF5" },
    OBSERVACION: { color: "#D97706", bg: "#FFFBEB" },
    REPORTE:     { color: "#DC2626", bg: "#FEF2F2" },
  }
  const PAGO_CFG: Record<string, { color: string; bg: string; label: string }> = {
    PAGADO:    { color: "#059669", bg: "#ECFDF5", label: "Pagado"    },
    PENDIENTE: { color: "#D97706", bg: "#FFFBEB", label: "Pendiente" },
    VENCIDO:   { color: "#DC2626", bg: "#FEF2F2", label: "Vencido"   },
    CANCELADO: { color: "#6B7280", bg: "#F9FAFB", label: "Cancelado" },
  }

  const AVISO_DOT: Record<string, string> = {
    Urgente: "#EF4444", Importante: "#F59E0B", Informativo: "#3B82F6", Convocatoria: "#10B981",
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>

      {/* ── COVER + AVATAR ─────────────────────────────────── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-sm)", marginBottom: 24 }}>

        {/* Cover photo */}
        <div style={{
          height: 180, position: "relative",
          background: "linear-gradient(135deg, #0D2060 0%, #1549B8 40%, #1A5ED4 65%, #2066D4 100%)",
        }}>
          {/* Patrón grid */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
          {/* Círculos decorativos */}
          <div style={{ position: "absolute", right: -60, top: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(232,192,96,.08)" }} />
          <div style={{ position: "absolute", right: 40, top: 20, width: 120, height: 120, borderRadius: "50%", background: "rgba(232,192,96,.05)" }} />
          {/* Badge PERITO */}
          <div style={{
            position: "absolute", top: 20, left: 24,
            fontFamily: "var(--f-data)", fontSize: ".6rem", fontWeight: 700,
            letterSpacing: ".15em", textTransform: "uppercase",
            color: "#E8C060", background: "rgba(232,192,96,.12)",
            border: "1px solid rgba(232,192,96,.3)", padding: "4px 12px", borderRadius: 4,
          }}>CIME · PERITO CERTIFICADO</div>
          {/* Logo CIME */}
          <div style={{
            position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)",
            fontFamily: "var(--font-montserrat), Montserrat",
            fontWeight: 900, fontSize: "2.5rem", letterSpacing: ".2em", lineHeight: 1,
            color: "rgba(232,192,96,.25)",
          }}>CIME</div>
        </div>

        {/* Avatar + nombre */}
        <div style={{ padding: "0 28px 24px", position: "relative" }}>
          {/* Avatar */}
          <div style={{
            width: 100, height: 100, borderRadius: "50%", marginTop: -50,
            border: "4px solid var(--surface)", boxShadow: "0 4px 20px rgba(0,0,0,.18)",
            background: `hsl(${hue} 45% 32%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-montserrat), Montserrat",
            fontWeight: 800, fontSize: "2rem", color: "white",
          }}>
            {initials(usuario.nombre)}
          </div>

          {/* Acción editar */}
          <div style={{ position: "absolute", top: 12, right: 28 }}>
            <Link href="/perito/perfil" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8,
              border: "1px solid var(--line)", background: "var(--surface-2)",
              fontWeight: 600, fontSize: ".84rem", color: "var(--fg)",
              textDecoration: "none",
            }}>
              <Edit size={14} strokeWidth={2} /> Editar perfil
            </Link>
          </div>

          {/* Nombre + chips */}
          <div style={{ marginTop: 12 }}>
            <h1 className="font-montserrat" style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--fg)", margin: "0 0 6px" }}>
              {usuario.nombre}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {usuario.numeroPerito && (
                <span style={{
                  fontFamily: "var(--f-mono)", fontSize: ".75rem", fontWeight: 700,
                  color: "#1549B8", background: "#EFF6FF",
                  border: "1px solid #BFDBFE", padding: "3px 10px", borderRadius: 4,
                }}>
                  CIME-PER-{usuario.numeroPerito}
                </span>
              )}
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: ".74rem", fontWeight: 700,
                background: est.bg, color: est.color,
                border: `1px solid ${est.border}`, padding: "3px 10px", borderRadius: 20,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: est.color }} />
                {est.label}
              </span>
            </div>
            {usuario.especialidad && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fg-2)", fontSize: ".9rem", marginBottom: 8 }}>
                <Shield size={15} strokeWidth={1.75} style={{ color: "#1549B8" }} />
                {usuario.especialidad}
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
              {usuario.ciudad && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--f-data)", fontSize: ".8rem", color: "var(--muted)" }}>
                  <MapPin size={13} strokeWidth={1.75} /> {usuario.ciudad}
                </span>
              )}
              {usuario.vigencia && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--f-data)", fontSize: ".8rem", color: "var(--muted)" }}>
                  <Calendar size={13} strokeWidth={1.75} /> Vigencia {usuario.vigencia}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid de contenido ─────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, alignItems: "start" }}>

        {/* ── COLUMNA IZQUIERDA ───────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Información personal */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8 }}>
              <FileText size={15} strokeWidth={2} style={{ color: "var(--brand)" }} />
              <h2 className="font-montserrat" style={{ fontSize: ".92rem", fontWeight: 700, color: "var(--fg)", margin: 0 }}>Información</h2>
            </div>
            <div style={{ padding: "14px 18px", display: "grid", gap: 12 }}>
              {[
                { icon: <Shield size={14} strokeWidth={1.75} />, label: "Especialidad", val: usuario.especialidad ?? "—" },
                { icon: <MapPin size={14} strokeWidth={1.75} />, label: "Ciudad", val: usuario.ciudad ?? "—" },
                { icon: <Mail size={14} strokeWidth={1.75} />, label: "Correo", val: usuario.correo },
                { icon: <Phone size={14} strokeWidth={1.75} />, label: "Teléfono", val: usuario.telefono ?? "—" },
                { icon: <BookOpen size={14} strokeWidth={1.75} />, label: "Cédula prof.", val: usuario.cedula ?? "—" },
                { icon: <Calendar size={14} strokeWidth={1.75} />, label: "Alta", val: usuario.alta ? String(usuario.alta) : "—" },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: "var(--muted)", flexShrink: 0, marginTop: 2 }}>{row.icon}</span>
                  <div>
                    <div style={{ fontFamily: "var(--f-data)", fontSize: ".6rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 1 }}>{row.label}</div>
                    <div style={{ fontSize: ".84rem", color: "var(--fg)", wordBreak: "break-all" }}>{row.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Avisos recientes */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 className="font-montserrat" style={{ fontSize: ".92rem", fontWeight: 700, color: "var(--fg)", margin: 0 }}>Avisos recientes</h2>
              <Link href="/perito/avisos" style={{ fontFamily: "var(--f-data)", fontSize: ".72rem", fontWeight: 600, color: "var(--brand)", textDecoration: "none" }}>Ver todos</Link>
            </div>
            <div>
              {avisos.map((av, idx) => {
                const dot = AVISO_DOT[av.tipo] ?? "#3B82F6"
                return (
                  <Link key={av.id} href="/perito/avisos" style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 18px", borderBottom: idx < avisos.length - 1 ? "1px solid var(--line)" : undefined, textDecoration: "none" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: dot, marginTop: 7 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: ".82rem", color: "var(--fg)", lineHeight: 1.3, marginBottom: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                        {av.titulo}
                      </div>
                      <span style={{ fontFamily: "var(--f-data)", fontSize: ".6rem", fontWeight: 700, color: dot, textTransform: "uppercase", letterSpacing: ".07em" }}>{av.tipo}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── COLUMNA DERECHA ─────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Datos institucionales — tarjeta prominente */}
          <div style={{
            background: "linear-gradient(135deg, #0D2060 0%, #1549B8 100%)",
            borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(13,32,96,.3)",
            position: "relative",
          }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
            <div style={{ position: "relative", padding: "24px 24px 20px" }}>
              <div style={{ fontFamily: "var(--f-data)", fontSize: ".6rem", fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", marginBottom: 16 }}>
                Datos institucionales
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "No. de Perito", val: usuario.numeroPerito ? `CIME-PER-${usuario.numeroPerito}` : "Sin asignar", mono: true },
                  { label: "Vigencia",      val: usuario.vigencia ?? "—",  mono: false },
                  { label: "Año de alta",   val: usuario.alta ? String(usuario.alta) : "—", mono: false },
                  { label: "Estado",        val: est.label, mono: false },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontFamily: "var(--f-data)", fontSize: ".58rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.4)", marginBottom: 4 }}>
                      {item.label}
                    </div>
                    <div style={{ fontFamily: item.mono ? "monospace" : undefined, fontSize: item.mono ? ".82rem" : ".9rem", fontWeight: 700, color: "#E8C060" }}>
                      {item.val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Expediente reciente */}
          {expediente && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 className="font-montserrat" style={{ fontSize: ".92rem", fontWeight: 700, color: "var(--fg)", margin: 0 }}>Expediente reciente</h2>
                <Link href="/perito/expedientes" style={{ fontFamily: "var(--f-data)", fontSize: ".72rem", fontWeight: 600, color: "var(--brand)", textDecoration: "none" }}>Ver todo</Link>
              </div>
              {expediente.entradas.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--muted)", fontSize: ".84rem" }}>
                  Sin entradas recientes en el expediente
                </div>
              ) : (
                <div>
                  {expediente.entradas.map((entrada, idx) => {
                    const cfg = ENTRADA_CFG[entrada.tipo] ?? { color: "#2563eb", bg: "#EFF6FF" }
                    return (
                      <div key={entrada.id} style={{ display: "flex", gap: 12, padding: "12px 18px", borderBottom: idx < expediente.entradas.length - 1 ? "1px solid var(--line)" : undefined }}>
                        <span style={{ padding: "3px 8px", borderRadius: 4, background: cfg.bg, color: cfg.color, fontSize: ".62rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", flexShrink: 0, alignSelf: "flex-start", marginTop: 2 }}>
                          {entrada.tipo}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: ".86rem", color: "var(--fg)", marginBottom: 2 }}>{entrada.titulo}</div>
                          {entrada.contenido && (
                            <div style={{ fontSize: ".8rem", color: "var(--muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                              {entrada.contenido}
                            </div>
                          )}
                          <div style={{ fontFamily: "var(--f-data)", fontSize: ".66rem", color: "var(--muted-2)", marginTop: 4 }}>
                            {new Date(entrada.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Pagos recientes */}
          {pagos.length > 0 && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 className="font-montserrat" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: ".92rem", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
                  <Award size={14} strokeWidth={2} style={{ color: "#059669" }} /> Historial de pagos
                </h2>
              </div>
              <div>
                {pagos.map((pago, idx) => {
                  const pc = PAGO_CFG[pago.estado] ?? PAGO_CFG.PENDIENTE
                  return (
                    <div key={pago.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderBottom: idx < pagos.length - 1 ? "1px solid var(--line)" : undefined }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: pc.bg, border: `1px solid ${pc.color}22`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <CheckCircle2 size={16} strokeWidth={2} style={{ color: pc.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: ".84rem", color: "var(--fg)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pago.concepto}</div>
                        <div style={{ fontFamily: "var(--f-mono)", fontSize: ".7rem", color: "var(--muted)" }}>{pago.folio}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: ".88rem", color: "var(--fg)" }}>
                          {pago.monto.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                        </div>
                        <span style={{ padding: "2px 7px", borderRadius: 20, background: pc.bg, color: pc.color, fontSize: ".66rem", fontWeight: 700 }}>{pc.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

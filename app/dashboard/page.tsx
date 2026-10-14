import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id

  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      nombre: true, numeroColegiado: true, especialidad: true, alta: true,
      cedula: true, vigencia: true, horas: true, horasMeta: true, estado: true,
    },
  })

  if (!usuario) return <div className="empty">Sin datos de sesión.</div>

  const C = 2 * Math.PI * 54
  const off = C * (1 - usuario.horas / usuario.horasMeta)
  const pct = Math.round(usuario.horas / usuario.horasMeta * 100)

  const ESTC: Record<string, string> = { VIGENTE: "ok", POR_RENOVAR: "warn", SUSPENDIDO: "bad" }
  const ESTNOMBRE: Record<string, string> = { VIGENTE: "Vigente", POR_RENOVAR: "Por renovar", SUSPENDIDO: "Suspendido" }

  const now = new Date()
  const hour = now.getHours()
  const saludo = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches"
  const fecha = now.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })

  return (
    <>
      {/* Credencial */}
      <div style={{
        position: "relative", overflow: "hidden", background: "var(--ink)", color: "#E9F0F8",
        borderRadius: 14, padding: 24, display: "grid", gridTemplateColumns: "minmax(0,1fr) auto",
        gap: 20, border: "1px solid rgba(160,190,220,.16)"
      }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(140,180,220,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(140,180,220,.08) 1px,transparent 1px)", backgroundSize: "24px 24px", maskImage: "linear-gradient(100deg,transparent 30%,#000 100%)", WebkitMaskImage: "linear-gradient(100deg,transparent 30%,#000 100%)" }} />
        <div style={{ position: "relative" }}>
          <span className="eyebrow" style={{ color: "#9FB3C8" }}>{saludo} · {fecha}</span>
          <h1 style={{ color: "#fff", marginTop: 8, fontSize: "clamp(1.4rem,2.6vw,2rem)", fontFamily: "var(--f-display)" }}>{usuario.nombre}</h1>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 99, background: "rgba(76,195,138,.16)", color: "#7BE0AE", fontWeight: 600, fontSize: ".8rem", marginTop: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4CC38A", boxShadow: "0 0 0 4px rgba(76,195,138,.2)", display: "inline-block" }} />
            <span className={`chip ${ESTC[usuario.estado]} nodot`} style={{ background: "transparent", color: "inherit", height: "auto", padding: 0, fontWeight: 600 }}>
              Colegiado {ESTNOMBRE[usuario.estado]} {usuario.vigencia ? `hasta el ${usuario.vigencia}` : ""}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 28px", marginTop: 18 }}>
            {usuario.numeroColegiado && <div><span style={{ fontSize: ".72rem", color: "#9FB3C8", letterSpacing: ".06em", textTransform: "uppercase", display: "block" }}>No. de colegiado</span><b style={{ fontFamily: "var(--f-mono)", fontSize: ".95rem" }}>CIME-VER-{usuario.numeroColegiado}</b></div>}
            {usuario.especialidad && <div><span style={{ fontSize: ".72rem", color: "#9FB3C8", letterSpacing: ".06em", textTransform: "uppercase", display: "block" }}>Especialidad</span><b style={{ fontSize: ".95rem" }}>{usuario.especialidad}</b></div>}
            {usuario.alta && <div><span style={{ fontSize: ".72rem", color: "#9FB3C8", letterSpacing: ".06em", textTransform: "uppercase", display: "block" }}>Colegiado desde</span><b style={{ fontFamily: "var(--f-mono)", fontSize: ".95rem" }}>{usuario.alta}</b></div>}
            {usuario.cedula && <div><span style={{ fontSize: ".72rem", color: "#9FB3C8", letterSpacing: ".06em", textTransform: "uppercase", display: "block" }}>Cédula profesional</span><b style={{ fontFamily: "var(--f-mono)", fontSize: ".95rem" }}>{usuario.cedula}</b></div>}
          </div>
        </div>
        <div style={{ display: "grid", placeItems: "center", textAlign: "center", gap: 6, position: "relative" }}>
          <div style={{ position: "relative", width: 132, height: 132 }}>
            <svg width="132" height="132" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(160,190,220,.18)" strokeWidth="10" />
              <circle cx="60" cy="60" r="54" fill="none" stroke="#F0B429" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={C.toFixed(1)} strokeDashoffset={off.toFixed(1)} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "grid", placeContent: "center", textAlign: "center" }}>
              <b style={{ fontFamily: "var(--f-display)", fontSize: "2rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{usuario.horas}</b>
              <span style={{ fontSize: ".72rem", color: "#9FB3C8" }}>de {usuario.horasMeta} h</span>
            </div>
          </div>
          <span className="eyebrow" style={{ color: "#9FB3C8" }}>Actualización profesional 2026</span>
          <div style={{ fontSize: ".78rem", color: "#B9C8D8" }}>
            Faltan {usuario.horasMeta - usuario.horas} h · {pct}% completado
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid g-4">
        <div className="card stat">
          <span className="eyebrow">Cursos en curso</span>
          <b className="num">3</b>
          <small>Horas con valor curricular</small>
        </div>
        <div className="card stat">
          <span className="eyebrow">Constancias 2026</span>
          <b className="num">3</b>
          <small>{usuario.horas} horas acreditadas</small>
        </div>
        <div className="card stat">
          <span className="eyebrow">Próximo evento</span>
          <b className="num">2 días</b>
          <small>Asamblea ordinaria de oct.</small>
        </div>
        <div className="card stat">
          <span className="eyebrow">Saldo pendiente</span>
          <b className="num" style={{ color: "var(--warn)" }}>$750</b>
          <small>Vence el 15 oct 2026</small>
        </div>
      </div>

      {/* Info */}
      <div className="card card-b">
        <div style={{ display: "grid", gap: 12 }}>
          <span className="eyebrow">Accesos rápidos</span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/dashboard/cursos" className="btn">Ver mis cursos</Link>
            <Link href="/dashboard/calendario" className="btn">Calendario del Colegio</Link>
            <Link href="/dashboard/constancias" className="btn">Mis constancias</Link>
            <Link href="/dashboard/pagos" className="btn">Pagos y cuotas</Link>
          </div>
        </div>
      </div>
    </>
  )
}

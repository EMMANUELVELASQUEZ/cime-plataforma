import Link from "next/link"
import { Prisma } from "@prisma/client"
import { Users, Scale, Landmark, ChevronRight, Search, Link2, ShieldCheck, Clock } from "lucide-react"
import AccionesCuenta from "./AccionesCuenta"
import { prisma } from "@/lib/prisma"
import { TesHero } from "@/components/tesoreria/TesUI"

export const dynamic = "force-dynamic"

type Tab = "colegiados" | "peritos" | "tesoreria"
const ROL_LABEL: Record<Tab, string> = { colegiados: "Colegiado", peritos: "Perito", tesoreria: "Tesorería" }
const ROL: Record<Tab, "COLEGIADO" | "PERITO" | "CONTADOR_TESORERO"> = {
  colegiados: "COLEGIADO", peritos: "PERITO", tesoreria: "CONTADOR_TESORERO",
}
export default async function CuentasPage({ searchParams }: { searchParams: { tab?: string; q?: string } }) {
  const tab: Tab = (["colegiados", "peritos", "tesoreria"] as const).includes(searchParams.tab as Tab)
    ? searchParams.tab as Tab : "colegiados"
  const q = (searchParams.q ?? "").trim()

  const where: Prisma.UsuarioWhereInput = {
    rol: ROL[tab],
    ...(q && {
      OR: [
        { nombre:          { contains: q, mode: "insensitive" } },
        { correo:          { contains: q, mode: "insensitive" } },
        { numeroColegiado: { contains: q, mode: "insensitive" } },
        { numeroPerito:    { contains: q, mode: "insensitive" } },
      ],
    }),
  }

  const [conteos, usuarios] = await Promise.all([
    prisma.usuario.groupBy({ by: ["rol"], _count: { id: true } }),
    prisma.usuario.findMany({
      where,
      orderBy: { nombre: "asc" },
      select: {
        id: true, nombre: true, correo: true, cargo: true, estado: true, alta: true, vigencia: true,
        numeroColegiado: true, numeroPerito: true, horas: true, horasMeta: true,
        updatedAt: true,
      },
    }),
  ])

  const n = (r: string) => conteos.find(c => c.rol === r)?._count.id ?? 0

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "colegiados", label: "Colegiados", icon: <Users size={15} strokeWidth={2} />,    count: n("COLEGIADO") },
    { key: "peritos",    label: "Peritos",    icon: <Scale size={15} strokeWidth={2} />,    count: n("PERITO") },
    { key: "tesoreria",  label: "Tesorería",  icon: <Landmark size={15} strokeWidth={2} />, count: n("CONTADOR_TESORERO") },
  ]

  return (
    <>
      <TesHero
        eyebrow="Administración · Cuentas"
        title="Cuentas de la"
        highlight="plataforma"
        sub="Colegiados, peritos y tesorería, cada uno en su apartado"
        icon={<ShieldCheck size={26} strokeWidth={1.6} />}
        figure={n("COLEGIADO") + n("PERITO") + n("CONTADOR_TESORERO")}
        figureLabel="Cuentas registradas"
      />

      <div className="acc-bar">
        <nav className="acc-tabs" aria-label="Tipo de cuenta">
          {tabs.map(t => (
            <Link key={t.key} href={`/admin/cuentas?tab=${t.key}`} className="acc-tab" aria-current={tab === t.key ? "page" : undefined}>
              {t.icon}{t.label}<span className="acc-tab__n">{t.count}</span>
            </Link>
          ))}
        </nav>
        <form className="acc-search" method="GET">
          <input type="hidden" name="tab" value={tab} />
          <div className="input-wrap">
            <Search size={15} />
            <input className="input" name="q" defaultValue={q} placeholder="Buscar por nombre, correo o número…" />
          </div>
          <button className="btn navy" type="submit">Buscar</button>
        </form>
      </div>

      {tab === "peritos" && (
        <div className="acc-notice">
          <Link2 size={20} style={{ color: "var(--gold-ink)" }} />
          <p><b>Integración con el sistema de sellos:</b> próximamente aquí se mostrarán los folios, sellados y pendientes de cada perito.</p>
        </div>
      )}

      <p style={{ fontSize: ".8rem", color: "var(--muted)", margin: "0 0 12px" }}>
        {usuarios.length} {tab === "tesoreria" ? "cuenta" : tab === "peritos" ? "perito" : "colegiado"}{usuarios.length !== 1 ? "s" : ""}{q && ` para «${q}»`}
      </p>

      {usuarios.length === 0 ? (
        <div className="card"><div className="empty" style={{ padding: "64px 24px" }}>
          <b>Sin resultados</b>
          <span>{q ? "Pruebe con otro término de búsqueda." : "Aún no hay cuentas en este apartado."}</span>
        </div></div>
      ) : (
        <div className="acc-grid">
          {usuarios.map(u => {
            const activo = u.estado !== "SUSPENDIDO"
            const provisional = u.correo.endsWith("@cime-importado.mx")
            const href = tab === "colegiados" ? `/admin/colegiados/${u.id}` : tab === "peritos" ? `/admin/peritos/${u.id}` : null
            const num = tab === "colegiados" && u.numeroColegiado ? `CIME-VER-${u.numeroColegiado}`
              : tab === "peritos" && u.numeroPerito ? `No. ${u.numeroPerito}` : null
            const inicial = (u.nombre.replace(/^(Ing\.?|Lic\.?|Dr\.?|Mtro\.?|Mtra\.?)\s*/i, "")[0] ?? "?").toUpperCase()

            return (
              <article key={u.id} className={`acc-card${activo ? "" : " is-off"}`}>
                <div className="acc-card__head">
                  <div className="acc-avatar">{inicial}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="acc-name">{u.nombre}</div>
                    <div className="acc-mail" title={u.correo}>{u.correo}</div>
                  </div>
                </div>

                <div className="acc-sep" />

                <div className="acc-chips">
                  <span className="acc-chip rol">{ROL_LABEL[tab]}</span>
                  {activo
                    ? <span className={`acc-chip ${u.estado === "POR_RENOVAR" ? "warn" : "ok"}`}>{u.estado === "POR_RENOVAR" ? "Por renovar" : "Activo"}</span>
                    : <span className="acc-chip bad">Desactivado</span>}
                  {num && <span className="acc-chip num">{num}</span>}
                  {provisional && <span className="acc-chip warn" title="Correo provisional: esta cuenta aún no tiene acceso real">Correo provisional</span>}
                </div>

                <div className="acc-meta">
                  <span><Clock size={12} strokeWidth={2} /> Actualizado {u.updatedAt.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Mexico_City" })}</span>
                  {href && <Link href={href} className="acc-link">Expediente <ChevronRight size={13} strokeWidth={2.5} /></Link>}
                </div>

                <div className="acc-sep push" />

                <AccionesCuenta id={u.id} nombre={u.nombre} correo={u.correo} activo={activo} />
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}

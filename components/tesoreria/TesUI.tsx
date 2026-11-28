import Link from "next/link"
import { ArrowRight } from "lucide-react"

/* Banner institucional de Tesorería — misma identidad que el panel de colegiados
   (gradiente navy → azul, barra dorada lateral, retícula sutil). */
export function TesHero({
  eyebrow, title, highlight, sub, icon, figure, figureLabel, children,
}: {
  eyebrow: string
  title: string
  highlight?: string
  sub?: React.ReactNode
  icon?: React.ReactNode
  figure?: React.ReactNode
  figureLabel?: string
  children?: React.ReactNode
}) {
  return (
    <section className="tes-hero">
      <div className="tes-hero__main">
        {icon && <div className="tes-hero__icon">{icon}</div>}
        <div style={{ minWidth: 0 }}>
          <span className="tes-hero__eyebrow">{eyebrow}</span>
          <h1>
            {title}{highlight && <> <em>{highlight}</em></>}
          </h1>
          {sub && <p className="tes-hero__sub">{sub}</p>}
        </div>
      </div>
      {(figure !== undefined || children) && (
        <div className="tes-hero__aside">
          {figure !== undefined && <div className="tes-hero__figure">{figure}</div>}
          {figureLabel && <div className="tes-hero__label">{figureLabel}</div>}
          {children}
        </div>
      )}
    </section>
  )
}

export type Tone = "ok" | "warn" | "bad" | "info" | "gold" | "mute"

export function TesKpi({
  label, value, sub, icon, tone = "info",
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  icon?: React.ReactNode
  tone?: Tone
}) {
  return (
    <div className="tes-kpi" data-tone={tone}>
      <div className="tes-kpi__top">
        <span className="tes-kpi__label">{label}</span>
        {icon && <span className="tes-kpi__ico">{icon}</span>}
      </div>
      <div className="tes-kpi__value">{value}</div>
      {sub && <div className="tes-kpi__sub">{sub}</div>}
    </div>
  )
}

export function TesTile({
  href, label, desc, icon,
}: { href: string; label: string; desc: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="tes-tile">
      <span className="tes-tile__ico">{icon}</span>
      <span style={{ minWidth: 0 }}>
        <div className="tes-tile__t">{label}</div>
        <div className="tes-tile__d">{desc}</div>
      </span>
      <ArrowRight size={16} strokeWidth={2} className="tes-tile__arrow" />
    </Link>
  )
}

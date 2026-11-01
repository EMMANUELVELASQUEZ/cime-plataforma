import Link from "next/link"
import { GraduationCap, Clock, User, CheckCircle2, ArrowRight } from "lucide-react"

// ─── Area config ────────────────────────────────────────────────
const AREA: Record<string, { label: string; color: string; bg: string; grad: string }> = {
  ELE: {
    label: "Eléctrica",
    color: "#0ea5e9",
    bg:    "rgba(14,165,233,.14)",
    grad:  "linear-gradient(140deg,#052233 0%,#0e4a6e 100%)",
  },
  MEC: {
    label: "Mecánica",
    color: "#10b981",
    bg:    "rgba(16,185,129,.14)",
    grad:  "linear-gradient(140deg,#05231a 0%,#0a5c3a 100%)",
  },
  SOL: {
    label: "Solar/Renovable",
    color: "#f59e0b",
    bg:    "rgba(245,158,11,.14)",
    grad:  "linear-gradient(140deg,#231a05 0%,#7a5000 100%)",
  },
}

const ESTADO: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ACTIVO:     { label: "En progreso", color: "#2563eb", bg: "rgba(37,99,235,.1)",  border: "rgba(37,99,235,.25)"  },
  COMPLETADO: { label: "Completado",  color: "#10b981", bg: "rgba(16,185,129,.1)", border: "rgba(16,185,129,.25)" },
  INSCRITO:   { label: "Inscrito",    color: "#6b7280", bg: "rgba(107,114,128,.1)",border: "rgba(107,114,128,.2)" },
}

// ─── Props ──────────────────────────────────────────────────────
export interface CourseCardProps {
  id:            string
  titulo:        string
  instructor:    string
  area:          string
  horas:         number
  fechaFin:      Date | string
  progreso:      number
  estado:        string
  imagen?:       string | null
  totalModulos?: number
  href:          string
}

// ─── Component ──────────────────────────────────────────────────
export default function CourseCard({
  titulo, instructor, area, horas, fechaFin,
  progreso, estado, imagen, totalModulos, href,
}: CourseCardProps) {
  const a    = AREA[area]  ?? { label: area, color: "#6366f1", bg: "rgba(99,102,241,.14)", grad: "linear-gradient(140deg,#1a1a2e,#16213e)" }
  const e    = ESTADO[estado] ?? ESTADO.INSCRITO
  const p    = Math.round(progreso)
  const done = p >= 100 || estado === "COMPLETADO"

  const fechaStr = new Date(fechaFin).toLocaleDateString("es-MX", {
    day: "numeric", month: "short", year: "numeric",
  })

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-2xl border transition-all duration-150 hover:-translate-y-0.5"
      style={{
        background:   "var(--surface)",
        borderColor:  "var(--line)",
        boxShadow:    "var(--shadow-sm)",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)" }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)" }}
    >
      {/* ── Banner ──────────────────────────────────────────── */}
      <div className="relative h-[96px] flex items-end p-4 overflow-hidden"
        style={{ background: imagen ? undefined : a.grad }}>
        {imagen && (
          <img src={imagen} alt={titulo} className="absolute inset-0 w-full h-full object-cover" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,.65) 100%)" }}
        />
        <div className="relative z-10 flex items-end justify-between w-full gap-3">
          <span className="inline-flex items-center h-5 px-2 rounded text-[.62rem] font-bold uppercase tracking-wide border"
            style={{ background: a.bg, color: a.color, borderColor: `${a.color}40` }}>
            {a.label}
          </span>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border"
            style={{ background: a.bg, borderColor: `${a.color}40` }}>
            {done
              ? <CheckCircle2 size={16} strokeWidth={2}    color={a.color} />
              : <GraduationCap size={16} strokeWidth={1.75} color={a.color} />
            }
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col p-4 gap-3">
        <h3 className="font-semibold text-[.92rem] leading-snug line-clamp-2" style={{ color: "var(--fg)" }}>
          {titulo}
        </h3>

        {/* Meta row */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[.74rem]" style={{ color: "var(--muted)" }}>
          <span className="flex items-center gap-1">
            <User  size={11} strokeWidth={2} /> {instructor}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} strokeWidth={2} /> {horas}h
          </span>
          {totalModulos !== undefined && (
            <span>{totalModulos} módulo{totalModulos !== 1 ? "s" : ""}</span>
          )}
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-[.72rem] mb-1.5">
            <span style={{ color: "var(--muted)" }}>Progreso</span>
            <b style={{ color: a.color, fontFamily: "var(--f-mono)" }}>{p}%</b>
          </div>
          <div className="h-[6px] rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${p}%`,
                background: done ? "#10b981" : a.color,
                boxShadow:  p > 0 ? `0 0 8px ${a.color}55` : "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t"
        style={{ borderColor: "var(--line)", background: "var(--surface-2)" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center h-5 px-2 rounded text-[.63rem] font-semibold border"
            style={{ color: e.color, background: e.bg, borderColor: e.border }}>
            {e.label}
          </span>
          <span className="text-[.7rem]" style={{ color: "var(--muted)" }}>{fechaStr}</span>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 h-[30px] px-3 rounded-lg text-[.78rem] font-semibold text-white transition-opacity hover:opacity-90 flex-shrink-0"
          style={{ background: a.color }}
        >
          {done ? "Ver" : "Continuar"} <ArrowRight size={12} strokeWidth={2.5} />
        </Link>
      </div>
    </article>
  )
}

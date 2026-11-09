"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, GraduationCap, Calendar, FileCheck, Megaphone,
  Users, CreditCard, User, Moon, Sun, LogOut, Menu, X,
  ChevronRight, ChevronDown, BarChart3, Bell,
  PanelLeftClose, PanelLeftOpen, FolderOpen, FileText, Building2, BookMarked, MessageCircle,
} from "lucide-react"

// ─── Helpers ────────────────────────────────────────────────────
function cn(...c: (string | undefined | null | false)[]) {
  return c.filter(Boolean).join(" ")
}

function initials(name: string) {
  return name
    .replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "")
    .split(/\s+/).slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase()
}

const HUES = [211, 142, 262, 24, 199, 327, 38, 172]
const avatarHue = (name: string) => HUES[name.charCodeAt(0) % HUES.length]

// ─── Types ──────────────────────────────────────────────────────
interface NavItem  { href: string; icon: React.ReactNode; label: string; badge?: number }
interface NavGroup { group: string; items: NavItem[] }

export interface AppShellUser {
  name?:            string | null
  email?:           string | null
  role?:            string
  numeroColegiado?: string | null
  horas?:           number
  horasMeta?:       number
  vigencia?:        string | null
  estado?:          string
  especialidad?:    string | null
  cursosResumen?:   { titulo: string; horas: number; progreso: number; area: string; estado: string }[]
  avisosCount?:       number
  planesAlerta?:      number
  totalColegiados?:   number
  padronPct?:         number
  mensajesNoLeidos?:  number
}

interface AppShellProps {
  children:   React.ReactNode
  user:       AppShellUser
  pageTitle?: string
}

// ─── Static config ───────────────────────────────────────────────
const TITLES: Record<string, string> = {
  "/admin":                  "Panel del Colegio",
  "/admin/colegiados":       "Colegiados",
  "/admin/colegiados/nuevo": "Alta de colegiado",
  "/admin/cursos":           "Cursos",
  "/admin/eventos":          "Eventos",
  "/admin/avisos":           "Avisos",
  "/admin/mensajes":         "Mensajes",
  "/admin/directorio":       "Directorio Institucional",
  "/admin/expedientes":      "Expedientes",
  "/admin/pagos":            "Gestión de Pagos",
  "/admin/planes":           "Planes de Pago",
  "/admin/mis-documentos":   "Mis Documentos",
  "/dashboard":              "Inicio",
  "/dashboard/cursos":       "Mis cursos",
  "/dashboard/calendario":   "Calendario",
  "/dashboard/constancias":  "Constancias",
  "/dashboard/avisos":       "Avisos",
  "/dashboard/mensajes":     "Mensajes",
  "/dashboard/directorio":   "Directorio",
  "/dashboard/pagos":        "Pagos y cuotas",
  "/dashboard/planes":       "Planes de pago",
  "/dashboard/perfil":       "Mi perfil",
}

const STATUS: Record<string, { dot: string; text: string; label: string }> = {
  VIGENTE:     { dot: "bg-emerald-400", text: "text-emerald-400", label: "Vigente"     },
  POR_RENOVAR: { dot: "bg-amber-400",   text: "text-amber-400",   label: "Por renovar" },
  SUSPENDIDO:  { dot: "bg-red-400",     text: "text-red-400",     label: "Suspendido"  },
}

// ─── Component ───────────────────────────────────────────────────
export default function AppShell({ children, user, pageTitle }: AppShellProps) {
  const pathname    = usePathname()
  const [expanded,  setExpanded]  = useState(true)
  const [mobileOpen,setMobileOpen]= useState(false)
  const [userMenu,  setUserMenu]  = useState(false)
  const [theme,     setTheme]     = useState<string | null>(null)
  const [mounted,   setMounted]   = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isAdmin      = user.role === "ADMIN"
  const currentTitle = pageTitle
    ?? TITLES[pathname]
    ?? Object.entries(TITLES).find(([k]) => pathname.startsWith(k + "/"))?.[1]
    ?? "Portal CIME"

  useEffect(() => {
    const saved = localStorage.getItem("cime.theme")
    const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches
    const active = saved ?? (prefersDark ? "dark" : "light")
    setTheme(active)
    document.documentElement.setAttribute("data-theme", active)
    document.documentElement.classList.toggle("dark", active === "dark")
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 150)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    function h(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenu(false)
    }
    document.addEventListener("click", h)
    return () => document.removeEventListener("click", h)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  function toggleTheme() {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark"
    setTheme(next)
    document.documentElement.setAttribute("data-theme", next)
    document.documentElement.classList.toggle("dark", next === "dark")
    localStorage.setItem("cime.theme", next)
  }

  const isDark    = theme === "dark"
  const horas     = user.horas     ?? 0
  const horasMeta = user.horasMeta ?? 60
  const pct       = Math.min(100, Math.round((horas / horasMeta) * 100))
  const faltanH   = Math.max(0, horasMeta - horas)
  const status    = STATUS[user.estado ?? "VIGENTE"] ?? STATUS.VIGENTE
  const circ      = 2 * Math.PI * 20
  const hue       = avatarHue(user.name ?? "U")
  const cursosResumen = user.cursosResumen

  const AREA_COLOR: Record<string, string> = { ELE: "#4A90D9", MEC: "#9b6fe8", SOL: "#34d399" }

  const adminNav: NavGroup[] = [{
    group: "Administración",
    items: [
      { href: "/admin",            icon: <BarChart3     size={18} strokeWidth={1.75} />, label: "Panel del Colegio" },
      { href: "/admin/colegiados", icon: <Users         size={18} strokeWidth={1.75} />, label: "Colegiados" },
      { href: "/admin/cursos",     icon: <GraduationCap size={18} strokeWidth={1.75} />, label: "Cursos" },
      { href: "/admin/eventos",    icon: <Calendar      size={18} strokeWidth={1.75} />, label: "Eventos" },
      { href: "/admin/avisos",       icon: <Megaphone      size={18} strokeWidth={1.75} />, label: "Avisos" },
      { href: "/admin/mensajes",     icon: <MessageCircle  size={18} strokeWidth={1.75} />, label: "Mensajes", badge: user.mensajesNoLeidos || undefined },
      { href: "/admin/directorio",   icon: <Building2      size={18} strokeWidth={1.75} />, label: "Directorio" },
      { href: "/admin/expedientes",  icon: <FolderOpen  size={18} strokeWidth={1.75} />, label: "Expedientes" },
      { href: "/admin/pagos",        icon: <CreditCard  size={18} strokeWidth={1.75} />, label: "Pagos" },
      { href: "/admin/planes",         icon: <FileText    size={18} strokeWidth={1.75} />, label: "Planes", badge: user.planesAlerta || undefined },
      { href: "/admin/mis-documentos", icon: <BookMarked  size={18} strokeWidth={1.75} />, label: "Mis documentos" },
    ],
  }]

  const colegiadoNav: NavGroup[] = [
    {
      group: "Principal",
      items: [
        { href: "/dashboard",             icon: <LayoutDashboard size={18} strokeWidth={1.75} />, label: "Inicio" },
        { href: "/dashboard/cursos",      icon: <GraduationCap   size={18} strokeWidth={1.75} />, label: "Mis cursos" },
        { href: "/dashboard/calendario",  icon: <Calendar        size={18} strokeWidth={1.75} />, label: "Calendario" },
        { href: "/dashboard/constancias", icon: <FileCheck       size={18} strokeWidth={1.75} />, label: "Constancias" },
      ],
    },
    {
      group: "Colegio",
      items: [
        { href: "/dashboard/avisos",     icon: <Bell          size={18} strokeWidth={1.75} />, label: "Avisos", badge: user.avisosCount || undefined },
        { href: "/dashboard/mensajes",   icon: <MessageCircle size={18} strokeWidth={1.75} />, label: "Mensajes", badge: user.mensajesNoLeidos || undefined },
        { href: "/dashboard/pagos",      icon: <CreditCard    size={18} strokeWidth={1.75} />, label: "Pagos y cuotas" },
        { href: "/dashboard/planes",     icon: <FileText   size={18} strokeWidth={1.75} />, label: "Planes de pago" },
      ],
    },
    {
      group: "Cuenta",
      items: [{ href: "/dashboard/perfil", icon: <User size={18} strokeWidth={1.75} />, label: "Mi perfil" }],
    },
  ]

  const navGroups = isAdmin ? adminNav : colegiadoNav

  // Sidebar content factory — called with collapsed=true/false
  const sideInner = (collapsed: boolean) => (
    <div className="flex flex-col h-full">
      {/* Top ambient glow */}
      <div className="absolute top-0 left-0 right-0 h-36 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 130% 90% at 50% -15%, rgba(74,144,217,.18), transparent 70%)" }}
      />

      {/* Brand */}
      <div className={cn(
        "relative flex items-center gap-3 border-b border-white/[.06] flex-shrink-0",
        collapsed ? "justify-center px-3 py-[18px]" : "px-4 py-[18px]"
      )}>
        <img src="/logo.jpeg" alt="CIME" className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-white/10" />
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-white font-bold text-[.87rem] tracking-[.055em] leading-tight">CIME VERACRUZ</div>
            <div className="text-white/38 text-[.64rem] tracking-wide mt-[3px]">Portal del Colegiado</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="relative flex-1 overflow-y-auto py-3 px-2.5 flex flex-col gap-4">
        {navGroups.map(g => (
          <div key={g.group} className="flex flex-col gap-[2px]">
            {!collapsed && (
              <p className="text-white/24 text-[.62rem] font-bold tracking-[.13em] uppercase px-2.5 pb-[5px]">
                {g.group}
              </p>
            )}
            {g.items.map(item => {
              const active = pathname === item.href
                || (item.href !== "/" && item.href !== "/admin" && item.href !== "/dashboard"
                    && pathname.startsWith(item.href + "/"))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-lg text-[.84rem] font-medium transition-colors duration-100",
                    collapsed ? "justify-center p-[10px]" : "px-2.5 py-[7px]",
                    active
                      ? "bg-brand-500/20 text-white"
                      : "text-white/50 hover:bg-white/[.07] hover:text-white/85"
                  )}
                >
                  {active && <span className="absolute left-0 top-[6px] bottom-[6px] w-[3px] rounded-r bg-gold-600" />}
                  <span className={cn("flex-shrink-0", active ? "text-white" : "text-white/44 group-hover:text-white/72")}>
                    {item.icon}
                  </span>
                  {!collapsed && <span className="flex-1 min-w-0 truncate">{item.label}</span>}
                  {!collapsed && item.badge ? (
                    <span className="ml-auto min-w-[18px] h-[18px] px-[5px] rounded-full bg-gold-600 text-[#1a1200] text-[.61rem] font-bold leading-[18px] text-center">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── User / Stats card ─────────────────────────── */}
      {!isAdmin && !collapsed && (
        <div className="relative mx-2.5 mb-3 rounded-xl border border-brand-500/[.18] flex-shrink-0 overflow-hidden"
          style={{ background: "rgba(7,15,28,.85)" }}>

          {/* Ambient glow */}
          <div className="absolute top-0 inset-x-0 h-20 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 120% 120% at 50% -10%, rgba(200,155,42,.08), transparent 70%)" }} />

          <div className="relative p-3 flex flex-col gap-3">

            {/* Identity */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[.76rem] border-2 border-white/10"
                  style={{ background: `hsl(${hue} 45% 28%)` }}>
                  {initials(user.name ?? "U")}
                </div>
                <span className={cn("absolute -bottom-px -right-px w-[10px] h-[10px] rounded-full border-2 border-[#070F1C]", status.dot)} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white font-semibold text-[.8rem] truncate leading-tight">
                  {user.name?.split(" ").slice(0, 3).join(" ")}
                </div>
                <div className="text-white/34 font-mono text-[.62rem] tracking-[.04em] mt-[2px]">
                  {user.numeroColegiado ? `CIME-VER-${user.numeroColegiado}` : "Sin número"}
                </div>
              </div>
            </div>

            <div className="h-px bg-white/[.06]" />

            {/* Animated ring + hours summary */}
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 flex-shrink-0">
                <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="4.5" />
                  <circle cx="24" cy="24" r="20" fill="none"
                    stroke={pct >= 100 ? "#34d399" : "#C89B2A"} strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeDasharray={circ.toFixed(1)}
                    strokeDashoffset={mounted ? (circ * (1 - pct / 100)).toFixed(1) : circ.toFixed(1)}
                    style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,.2,1), stroke .4s" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[.58rem] font-mono font-bold leading-none"
                    style={{ color: pct >= 100 ? "#34d399" : "#E8B84B" }}>
                    {pct}%
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white/36 text-[.61rem] leading-tight">Actualización profesional</p>
                <div className="flex items-baseline gap-1 mt-[3px]">
                  <span className="font-mono font-bold text-white text-[.88rem]">{horas}</span>
                  <span className="text-white/28 text-[.6rem]">/ {horasMeta} h</span>
                </div>
                <p className="text-[.6rem] mt-[2px]"
                  style={{ color: faltanH > 0 ? "#C89B2A" : "#34d399" }}>
                  {faltanH > 0 ? `Faltan ${faltanH}h para tu meta` : "¡Meta alcanzada!"}
                </p>
              </div>
            </div>

            {/* Course list */}
            {cursosResumen !== undefined && (
              <>
                <div className="h-px bg-white/[.06]" />
                {cursosResumen.length === 0 ? (
                  <Link href="/dashboard/cursos"
                    className="flex items-center gap-2 text-[.68rem] text-white/28 hover:text-white/55 transition-colors py-0.5">
                    <GraduationCap size={13} strokeWidth={1.75} className="flex-shrink-0" />
                    <span>Explorar cursos disponibles</span>
                  </Link>
                ) : (
                  <div className="flex flex-col gap-[9px]">
                    <div className="flex items-center justify-between">
                      <p className="text-[.59rem] font-bold uppercase tracking-[.11em] text-white/22">Mis cursos</p>
                      {cursosResumen.length > 3 && (
                        <span className="text-[.59rem] text-white/22 font-mono">+{cursosResumen.length - 3} más</span>
                      )}
                    </div>
                    {cursosResumen.slice(0, 3).map((c, i) => {
                      const color = AREA_COLOR[c.area] ?? "#C89B2A"
                      const barDelay = `${0.25 + i * 0.12}s`
                      return (
                        <div key={i}>
                          <div className="flex justify-between items-baseline mb-[4px]">
                            <span className="text-[.63rem] text-white/50 truncate flex-1 pr-2" title={c.titulo}>
                              {c.titulo.length > 22 ? c.titulo.slice(0, 22) + "…" : c.titulo}
                            </span>
                            <span className="text-[.6rem] font-mono font-bold flex-shrink-0"
                              style={{ color: c.progreso === 0 ? "rgba(255,255,255,.2)" : color }}>
                              {c.progreso}%
                            </span>
                          </div>
                          <div className="h-[3px] rounded-full overflow-hidden"
                            style={{ background: "rgba(255,255,255,.07)" }}>
                            <div className="h-full rounded-full"
                              style={{
                                width: mounted ? `${Math.max(c.progreso, c.progreso === 0 ? 0 : 4)}%` : "0%",
                                background: c.progreso === 0 ? "rgba(255,255,255,.12)" : color,
                                boxShadow: c.progreso > 0 ? `0 0 6px ${color}55` : "none",
                                transition: `width 0.9s cubic-bezier(0.4,0,.2,1) ${barDelay}`,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {user.vigencia && (
              <>
                <div className="h-px bg-white/[.06]" />
                <div className="flex items-center justify-between">
                  <span className="text-white/30 text-[.62rem]">Vigencia</span>
                  <span className={cn("font-mono font-bold text-[.67rem]", status.text)}>{user.vigencia}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isAdmin && !collapsed && (
        <div className="relative mx-2.5 mb-3 p-3 rounded-xl border border-white/[.08] flex flex-col gap-2 flex-shrink-0"
          style={{ background: "rgba(255,255,255,.04)" }}>
          <div className="flex justify-between text-[.78rem] text-white/60">
            <span>Padrón al corriente</span>
            <b className="text-white font-bold">{user.padronPct ?? 0}%</b>
          </div>
          <div className="h-[5px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.1)" }}>
            <div className="h-full rounded-full" style={{ background: "#C89B2A", width: `${user.padronPct ?? 0}%` }} />
          </div>
          <span className="text-[.71rem] text-white/36">{user.totalColegiados ?? 0} colegiados registrados</span>
        </div>
      )}

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={() => setExpanded(v => !v)}
        className={cn(
          "hidden lg:flex items-center gap-2 h-8 mx-2.5 mb-3 px-2.5 rounded-lg flex-shrink-0",
          "text-white/30 hover:text-white/65 hover:bg-white/[.07] border border-white/[.06] transition-colors text-[.71rem] font-medium",
          collapsed ? "justify-center" : ""
        )}
      >
        {collapsed
          ? <PanelLeftOpen  size={14} strokeWidth={1.75} />
          : <><PanelLeftClose size={14} strokeWidth={1.75} /><span>Colapsar menú</span></>
        }
      </button>
    </div>
  )

  return (
    <div className="flex min-h-dvh" style={{ background: "var(--bg)" }}>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(4,10,20,.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile sidebar ─────────────────────────────────────── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 flex flex-col overflow-hidden lg:hidden",
        "border-r border-white/[.05] relative",
        "transition-transform duration-[240ms] ease-[cubic-bezier(.22,1,.36,1)]",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )} style={{ background: "#070F1C", boxShadow: mobileOpen ? "4px 0 40px rgba(0,0,0,.4)" : "none" }}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-lg text-white/35 hover:bg-white/10 hover:text-white/80 transition-colors"
        >
          <X size={16} strokeWidth={2} />
        </button>
        {sideInner(false)}
      </aside>

      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0 overflow-hidden relative border-r border-white/[.05] transition-[width] duration-300 ease-in-out"
        style={{ background: "#070F1C", width: expanded ? "256px" : "68px" }}
      >
        {sideInner(!expanded)}
      </aside>

      {/* ── Main column ─────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* ── Topbar ──────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 flex items-center gap-3 h-[60px] px-4 lg:px-6 flex-shrink-0 border-b"
          style={{
            background: "color-mix(in srgb, var(--bg) 88%, transparent)",
            backdropFilter: "saturate(1.6) blur(16px)",
            borderColor: "var(--line)",
          }}>

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border transition-colors"
            style={{ borderColor: "var(--line)", color: "var(--muted)" }}
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm min-w-0">
            <span className="hidden sm:block" style={{ color: "var(--muted)" }}>Portal</span>
            <ChevronRight size={13} strokeWidth={2} className="hidden sm:block flex-shrink-0" style={{ color: "var(--muted-2)" } as React.CSSProperties} />
            <b className="font-semibold truncate" style={{ color: "var(--fg)" }}>{currentTitle}</b>
          </nav>

          {/* Right */}
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={toggleTheme} aria-label="Cambiar tema"
              className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-[var(--surface-2)]"
              style={{ color: "var(--muted)" }}>
              {isDark ? <Sun size={17} strokeWidth={1.75} /> : <Moon size={17} strokeWidth={1.75} />}
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenu(v => !v)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-shadow hover:shadow-card-md"
                style={{ border: "1px solid var(--line)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[.7rem] font-bold flex-shrink-0"
                  style={{ background: `hsl(${hue} 38% 34%)` }}>
                  {initials(user.name ?? "U")}
                </div>
                <div className="hidden sm:grid text-left leading-[1.2]">
                  <b className="text-[.8rem] font-semibold" style={{ color: "var(--fg)" }}>
                    {user.name?.split(" ").slice(0, 2).join(" ") ?? "Usuario"}
                  </b>
                  <span className="text-[.68rem]" style={{ color: "var(--muted)" }}>
                    {isAdmin ? "Administración" : `Col. ${user.numeroColegiado ?? ""}`}
                  </span>
                </div>
                <ChevronDown size={13} strokeWidth={2} className="flex-shrink-0" style={{ color: "var(--muted)" }} />
              </button>

              {userMenu && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-64 rounded-xl overflow-hidden animate-fade-in z-[60] border"
                  style={{ background: "var(--surface)", borderColor: "var(--line)", boxShadow: "var(--shadow-lg)" }}>
                  <div className="px-4 py-3 border-b" style={{ background: "var(--surface-2)", borderColor: "var(--line)" }}>
                    <b className="text-[.88rem] block" style={{ color: "var(--fg)" }}>{user.name}</b>
                    <span className="text-[.76rem]" style={{ color: "var(--muted)" }}>{user.email}</span>
                  </div>
                  <div className="p-1.5 grid gap-0.5">
                    {!isAdmin && (
                      <Link href="/dashboard/perfil" onClick={() => setUserMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[.84rem] font-medium transition-colors hover:bg-[var(--surface-2)]"
                        style={{ color: "var(--fg)" }}>
                        <User size={15} strokeWidth={1.75} style={{ color: "var(--muted)" } as React.CSSProperties} />
                        Mi perfil
                      </Link>
                    )}
                    <button onClick={() => { toggleTheme(); setUserMenu(false) }}
                      className="flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[.84rem] font-medium transition-colors hover:bg-[var(--surface-2)] w-full text-left"
                      style={{ color: "var(--fg)" }}>
                      {isDark ? <Sun size={15} strokeWidth={1.75} style={{ color: "var(--muted)" } as React.CSSProperties} /> : <Moon size={15} strokeWidth={1.75} style={{ color: "var(--muted)" } as React.CSSProperties} />}
                      Cambiar tema
                    </button>
                    <div className="h-px my-0.5" style={{ background: "var(--line)" }} />
                    <button onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[.84rem] font-medium transition-colors w-full text-left"
                      style={{ color: "var(--bad)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bad-bg)" }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                    >
                      <LogOut size={15} strokeWidth={1.75} /> Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page content ────────────────────────────────────── */}
        <main className="view flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

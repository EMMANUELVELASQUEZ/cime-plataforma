"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"

interface NavItem { href: string; icon: React.ReactNode; label: string; badge?: number }
interface NavGroup { group: string; items: NavItem[] }

const IcoDash = () => (
  <svg className="ico" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M5 4h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1" />
    <path d="M5 16h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1" />
    <path d="M15 12h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1" />
    <path d="M15 4h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1" />
  </svg>
)
const IcoUsers = () => (
  <svg className="ico" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
  </svg>
)
const IcoCal = () => (
  <svg className="ico" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M4 5m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" /><path d="M16 3l0 4" /><path d="M8 3l0 4" /><path d="M4 11l16 0" /><path d="M8 15h2v2h-2z" />
  </svg>
)
const IcoChart = () => (
  <svg className="ico" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M15 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M9 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M4 20h14" />
  </svg>
)
const IcoSchool = () => (
  <svg className="ico" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" /><path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" />
  </svg>
)
const IcoSpeaker = () => (
  <svg className="ico" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M18 8a3 3 0 0 1 0 6" /><path d="M10 8v11a1 1 0 0 1 -1 1h-1a1 1 0 0 1 -1 -1v-5" /><path d="M12 8h0l4.524 -3.77a.9 .9 0 0 1 1.476 .692v12.156a.9 .9 0 0 1 -1.476 .692l-4.524 -3.77h-8a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h8" />
  </svg>
)
const IcoCert = () => (
  <svg className="ico" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 8v-3a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-5" /><path d="M6 14m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M4.5 17l-1.5 5l3 -1.5l3 1.5l-1.5 -5" />
  </svg>
)
const IcoCard = () => (
  <svg className="ico" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M3 5m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z" /><path d="M3 10l18 0" /><path d="M7 15l.01 0" /><path d="M11 15l2 0" />
  </svg>
)
const IcoUser = () => (
  <svg className="ico" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
  </svg>
)
const IcoBolt = () => (
  <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />
  </svg>
)
const IcoMoon = () => (
  <svg className="ico" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
  </svg>
)
const IcoSun = () => (
  <svg className="ico" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" />
  </svg>
)
const IcoLogout = () => (
  <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" /><path d="M9 12h12l-3 -3" /><path d="M18 15l3 -3" />
  </svg>
)
const IcoMenu = () => (
  <svg className="ico" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M4 6l16 0" /><path d="M4 12l16 0" /><path d="M4 18l16 0" />
  </svg>
)
const IcoChevronRight = () => (
  <svg className="ico sm muted" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M9 6l6 6l-6 6" />
  </svg>
)
const IcoChevronDown = () => (
  <svg className="ico sm muted" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M6 9l6 6l6 -6" />
  </svg>
)
const IcoPlus = () => (
  <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 5l0 14" /><path d="M5 12l14 0" />
  </svg>
)

function initials(name: string) {
  return name.replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "").split(/\s+/).slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase()
}

const TITLES: Record<string, string> = {
  "/admin": "Panel del Colegio",
  "/admin/colegiados": "Colegiados",
  "/admin/colegiados/nuevo": "Alta de colegiado",
  "/admin/cursos": "Cursos",
  "/admin/eventos": "Eventos",
  "/admin/avisos": "Avisos",
  "/dashboard": "Inicio",
  "/dashboard/cursos": "Mis cursos",
  "/dashboard/calendario": "Calendario",
  "/dashboard/constancias": "Constancias",
  "/dashboard/avisos": "Avisos",
  "/dashboard/directorio": "Directorio",
  "/dashboard/pagos": "Pagos y cuotas",
  "/dashboard/perfil": "Mi perfil",
}

interface AppShellProps {
  children: React.ReactNode
  user: { name?: string | null; email?: string | null; role?: string; numeroColegiado?: string | null }
  pageTitle?: string
}

export default function AppShell({ children, user, pageTitle }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sideOpen, setSideOpen] = useState(false)
  const [userPopOpen, setUserPopOpen] = useState(false)
  const [theme, setTheme] = useState<string | null>(null)
  const popRef = useRef<HTMLDivElement>(null)

  const isAdmin = user.role === "ADMIN"
  const currentTitle = pageTitle ?? TITLES[pathname] ?? (Object.entries(TITLES).find(([k]) => pathname.startsWith(k + "/"))?.[1]) ?? "Portal CIME"

  useEffect(() => {
    const saved = localStorage.getItem("cime.theme")
    if (saved) { setTheme(saved); document.documentElement.setAttribute("data-theme", saved) }
  }, [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setUserPopOpen(false)
    }
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [])

  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    const next = cur === "dark" ? "light" : "dark"
    setTheme(next)
    document.documentElement.setAttribute("data-theme", next)
    localStorage.setItem("cime.theme", next)
  }

  const isDark = theme === "dark" || (!theme && typeof window !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches)

  const adminNav: NavGroup[] = [
    {
      group: "Administración",
      items: [
        { href: "/admin", icon: <IcoChart />, label: "Panel del Colegio" },
        { href: "/admin/colegiados", icon: <IcoUsers />, label: "Colegiados" },
        { href: "/admin/cursos", icon: <IcoSchool />, label: "Cursos" },
        { href: "/admin/eventos", icon: <IcoCal />, label: "Eventos" },
        { href: "/admin/avisos", icon: <IcoSpeaker />, label: "Avisos" },
      ],
    },
  ]

  const colegiadoNav: NavGroup[] = [
    {
      group: "Principal",
      items: [
        { href: "/dashboard", icon: <IcoDash />, label: "Inicio" },
        { href: "/dashboard/cursos", icon: <IcoSchool />, label: "Mis cursos" },
        { href: "/dashboard/calendario", icon: <IcoCal />, label: "Calendario" },
        { href: "/dashboard/constancias", icon: <IcoCert />, label: "Constancias" },
      ],
    },
    {
      group: "Colegio",
      items: [
        { href: "/dashboard/avisos", icon: <IcoSpeaker />, label: "Avisos", badge: 5 },
        { href: "/dashboard/directorio", icon: <IcoUsers />, label: "Directorio" },
        { href: "/dashboard/pagos", icon: <IcoCard />, label: "Pagos y cuotas" },
      ],
    },
    {
      group: "Cuenta",
      items: [
        { href: "/dashboard/perfil", icon: <IcoUser />, label: "Mi perfil" },
      ],
    },
  ]

  const navGroups = isAdmin ? adminNav : colegiadoNav

  const pct = (h: number) => Math.min(100, Math.round(h / 60 * 100))

  return (
    <div className="app">
      {sideOpen && <div className="backdrop" onClick={() => setSideOpen(false)} />}

      <aside className={`sidebar ${sideOpen ? "open" : ""}`}>
        <div className="brand">
          <img src="/logo.jpeg" alt="CIME Veracruz" style={{ width: 48, height: 48, objectFit: "contain", flexShrink: 0 }} />
          <div>
            <div className="brand-name">CIME VERACRUZ</div>
            <div className="brand-sub">Portal del Colegiado</div>
          </div>
        </div>

        <nav className="nav">
          {navGroups.map(g => (
            <div key={g.group} className="nav-group">
              <div className="eyebrow">{g.group}</div>
              {g.items.map(item => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/") && item.href !== "/admin" && item.href !== "/dashboard")
                  || pathname === item.href
                return (
                  <Link key={item.href} href={item.href} className={active ? "active" : ""} onClick={() => setSideOpen(false)}>
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge ? <span className="badge">{item.badge}</span> : null}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {!isAdmin && (
          <div className="side-card">
            <div className="row-between" style={{ fontSize: ".8rem" }}>
              <span>Horas de actualización 2026</span>
            </div>
            <div className="row-between">
              <b>40 <span style={{ fontSize: ".8rem", color: "#9FB3C8", fontWeight: 500 }}>/ 60 h</span></b>
              <span style={{ fontSize: ".75rem" }}>67%</span>
            </div>
            <div className="meter"><i style={{ width: "67%" }} /></div>
            <span style={{ fontSize: ".75rem", color: "#8FA1B5" }}>Te faltan 20 h antes del 31 dic</span>
          </div>
        )}

        {isAdmin && (
          <div className="side-card">
            <div className="row-between" style={{ fontSize: ".8rem" }}>
              <span>Padrón al corriente</span>
              <b>83%</b>
            </div>
            <div className="meter"><i style={{ width: "83%" }} /></div>
            <span style={{ fontSize: ".75rem", color: "#8FA1B5" }}>150 colegiados registrados</span>
          </div>
        )}
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-toggle" onClick={() => setSideOpen(v => !v)} aria-label="Abrir menú">
            <IcoMenu />
          </button>
          <div className="crumb">
            <span className="muted">Portal</span>
            <IcoChevronRight />
            <b>{currentTitle}</b>
          </div>

          <button className="icon-btn" onClick={toggleTheme} aria-label="Cambiar tema" style={{ marginLeft: "auto" }}>
            {isDark ? <IcoSun /> : <IcoMoon />}
          </button>

          <div style={{ position: "relative" }} ref={popRef}>
            <button className="user-btn" onClick={() => setUserPopOpen(v => !v)}>
              <span className="avatar" style={{ background: `hsl(${(user.name?.charCodeAt(0) ?? 0) * 47 % 360} 38% 34%)` }}>
                {initials(user.name ?? "U")}
              </span>
              <span className="who">
                <b>{user.name?.split(" ").slice(0, 2).join(" ") ?? "Usuario"}</b>
                <span>{isAdmin ? "Administración" : `Colegiado ${user.numeroColegiado ?? ""}`}</span>
              </span>
              <IcoChevronDown />
            </button>

            {userPopOpen && (
              <div className="pop" style={{ width: 260 }}>
                <header>
                  <div>
                    <b style={{ fontSize: ".88rem", display: "block" }}>{user.name}</b>
                    <div className="muted" style={{ fontSize: ".78rem" }}>{user.email}</div>
                  </div>
                </header>
                <div className="menu-list">
                  {!isAdmin && (
                    <Link href="/dashboard/perfil" onClick={() => setUserPopOpen(false)}>
                      <IcoUser /> Mi perfil
                    </Link>
                  )}
                  <button onClick={() => { toggleTheme(); setUserPopOpen(false) }}>
                    {isDark ? <IcoSun /> : <IcoMoon />} Cambiar tema
                  </button>
                  <button className="danger" onClick={() => signOut({ callbackUrl: "/login" })}>
                    <IcoLogout /> Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="view">
          {children}
        </main>
      </div>
    </div>
  )
}

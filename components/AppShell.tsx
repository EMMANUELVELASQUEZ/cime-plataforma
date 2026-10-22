"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, GraduationCap, Calendar, FileCheck, Megaphone,
  Users, CreditCard, User, Moon, Sun, LogOut, Menu,
  ChevronRight, ChevronDown, BarChart3, Plus, Bell,
} from "lucide-react"

interface NavItem { href: string; icon: React.ReactNode; label: string; badge?: number }
interface NavGroup { group: string; items: NavItem[] }

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

  const ico = (size = 18) => ({ size, strokeWidth: 1.75 })

  const adminNav: NavGroup[] = [
    {
      group: "Administración",
      items: [
        { href: "/admin", icon: <BarChart3 {...ico()} />, label: "Panel del Colegio" },
        { href: "/admin/colegiados", icon: <Users {...ico()} />, label: "Colegiados" },
        { href: "/admin/cursos", icon: <GraduationCap {...ico()} />, label: "Cursos" },
        { href: "/admin/eventos", icon: <Calendar {...ico()} />, label: "Eventos" },
        { href: "/admin/avisos", icon: <Megaphone {...ico()} />, label: "Avisos" },
      ],
    },
  ]

  const colegiadoNav: NavGroup[] = [
    {
      group: "Principal",
      items: [
        { href: "/dashboard", icon: <LayoutDashboard {...ico()} />, label: "Inicio" },
        { href: "/dashboard/cursos", icon: <GraduationCap {...ico()} />, label: "Mis cursos" },
        { href: "/dashboard/calendario", icon: <Calendar {...ico()} />, label: "Calendario" },
        { href: "/dashboard/constancias", icon: <FileCheck {...ico()} />, label: "Constancias" },
      ],
    },
    {
      group: "Colegio",
      items: [
        { href: "/dashboard/avisos", icon: <Bell {...ico()} />, label: "Avisos", badge: 5 },
        { href: "/dashboard/directorio", icon: <Users {...ico()} />, label: "Directorio" },
        { href: "/dashboard/pagos", icon: <CreditCard {...ico()} />, label: "Pagos y cuotas" },
      ],
    },
    {
      group: "Cuenta",
      items: [
        { href: "/dashboard/perfil", icon: <User {...ico()} />, label: "Mi perfil" },
      ],
    },
  ]

  const navGroups = isAdmin ? adminNav : colegiadoNav

  return (
    <div className="app">
      {sideOpen && <div className="backdrop" onClick={() => setSideOpen(false)} />}

      <aside className={`sidebar ${sideOpen ? "open" : ""}`}>
        <div className="brand">
          <img src="/logo.jpeg" alt="CIME Veracruz" style={{ width: 48, height: 48, objectFit: "cover", flexShrink: 0, borderRadius: 10, border: "1px solid rgba(255,255,255,.12)" }} />
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
                const active = pathname === item.href ||
                  (item.href !== "/" && item.href !== "/admin" && item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))
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
          <div className="side-card" style={{ background: "rgba(74,144,217,.08)", borderColor: "rgba(74,144,217,.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="avatar" style={{ width: 38, height: 38, fontSize: ".8rem", background: `hsl(${(user.name?.charCodeAt(0) ?? 0) * 47 % 360} 38% 34%)`, flexShrink: 0 }}>
                {initials(user.name ?? "U")}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: ".8rem", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name?.split(" ").slice(0, 2).join(" ") ?? "Colegiado"}
                </div>
                <div style={{ fontSize: ".66rem", color: "rgba(255,255,255,.45)", marginTop: 1 }}>
                  {user.numeroColegiado ? `CIME-VER-${user.numeroColegiado}` : "Colegiado"}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 4 }}>
              <div className="row-between" style={{ fontSize: ".72rem", color: "rgba(255,255,255,.5)", marginBottom: 5 }}>
                <span>Actualización 2026</span>
                <span style={{ color: "#E8B84B", fontWeight: 700 }}>67%</span>
              </div>
              <div className="meter"><i style={{ width: "67%", background: "linear-gradient(90deg,#c89b2a,#f5c842)" }} /></div>
              <span style={{ fontSize: ".68rem", color: "#8FA1B5", marginTop: 4, display: "block" }}>40/60 h · vence 31 dic</span>
            </div>
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
            <Menu size={20} strokeWidth={1.75} />
          </button>
          <div className="crumb">
            <span className="muted">Portal</span>
            <ChevronRight size={14} strokeWidth={1.75} className="muted" />
            <b>{currentTitle}</b>
          </div>

          <button className="icon-btn" onClick={toggleTheme} aria-label="Cambiar tema" style={{ marginLeft: "auto" }}>
            {isDark ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
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
              <ChevronDown size={14} strokeWidth={1.75} className="muted" />
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
                      <User size={15} strokeWidth={1.75} /> Mi perfil
                    </Link>
                  )}
                  <button onClick={() => { toggleTheme(); setUserPopOpen(false) }}>
                    {isDark ? <Sun size={15} strokeWidth={1.75} /> : <Moon size={15} strokeWidth={1.75} />} Cambiar tema
                  </button>
                  <button className="danger" onClick={() => signOut({ callbackUrl: "/login" })}>
                    <LogOut size={15} strokeWidth={1.75} /> Cerrar sesión
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

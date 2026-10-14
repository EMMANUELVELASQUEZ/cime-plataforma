"use client"
import { useEffect, useRef, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

const NODOS: [string, number, number, number?, string?][] = [
  ["Pánuco", 22.05, -98.18],
  ["Tuxpan", 20.95, -97.40],
  ["Poza Rica", 20.53, -97.46],
  ["Xalapa", 19.54, -96.91, 0, "l"],
  ["Veracruz", 19.18, -96.14, 1, "u"],
  ["Boca del Río", 19.10, -96.10, 0, "d"],
  ["Córdoba", 18.88, -96.93, 0, "d"],
  ["Orizaba", 18.85, -97.10, 0, "l"],
  ["Alvarado", 18.77, -95.76],
  ["S.A. Tuxtla", 18.45, -95.21, 0, "u"],
  ["Coatzacoalcos", 18.13, -94.46, 0, "l"],
  ["Minatitlán", 17.99, -94.55, 0, "d"],
]
const ENL: [number, number][] = [[0,1],[1,2],[2,3],[3,4],[4,5],[3,6],[6,7],[6,4],[4,8],[8,9],[9,10],[10,11],[5,8]]

export default function LoginClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const router = useRouter()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"login" | "recover">("login")
  const [recoverEmail, setRecoverEmail] = useState("")
  const [recoverMsg, setRecoverMsg] = useState("")

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext("2d")!
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
    const pk = ENL.flatMap((e, i) => [
      { e: i, t: Math.random(), v: 0.0018 + Math.random() * 0.0025, dir: 1 },
      { e: i, t: Math.random(), v: 0.0015 + Math.random() * 0.002, dir: -1 },
    ])

    function layout(w: number, h: number) {
      const lats = NODOS.map(n => n[1]), lons = NODOS.map(n => n[2])
      const a = Math.min(...lons), b = Math.max(...lons), c = Math.min(...lats), d = Math.max(...lats)
      const narrow = w < 700
      const padX = narrow ? w * 0.16 : Math.max(w * 0.42, 380)
      const padR = narrow ? w * 0.2 : w * 0.05, padT = h * 0.1, padB = h * 0.12
      const s = Math.min((w - padX - padR) / (b - a), (h - padT - padB) / (d - c) * 1.25)
      const ox = padX + ((w - padX - padR) - (b - a) * s) / 2
      const oy = padT + ((h - padT - padB) - (d - c) * s / 1.25) / 2
      return NODOS.map(n => [ox + (n[2] - a) * s, oy + (d - n[1]) * s / 1.25] as [number, number])
    }

    function frame() {
      if (!cv) return
      const dpr = Math.min(devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight
      if (!w || !h) { rafRef.current = requestAnimationFrame(frame); return }
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h)
      const P = layout(w, h), small = w < 700; ctx.globalAlpha = small ? 0.4 : 1
      ctx.lineWidth = 1
      ENL.forEach(([i, j]) => {
        ctx.strokeStyle = "rgba(109,166,230,.38)"; ctx.beginPath()
        ctx.moveTo(...P[i]); ctx.lineTo(...P[j]); ctx.stroke()
      })
      pk.forEach(p => {
        if (!reduce) { p.t += p.v * p.dir; if (p.t > 1) p.t -= 1; if (p.t < 0) p.t += 1 }
        const [i, j] = ENL[p.e]
        const x = P[i][0] + (P[j][0] - P[i][0]) * p.t, y = P[i][1] + (P[j][1] - P[i][1]) * p.t
        ctx.fillStyle = p.dir > 0 ? "#F0B429" : "#E8EEF5"; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 7); ctx.fill()
      })
      ctx.font = "500 11px 'IBM Plex Mono',ui-monospace,monospace"; ctx.textBaseline = "middle"
      NODOS.forEach((n, k) => {
        const [x, y] = P[k], core = n[3], s = core ? 16 : 10
        ctx.fillStyle = "#0F2740"; ctx.strokeStyle = core ? "#F0B429" : "#9FB3C8"; ctx.lineWidth = core ? 2 : 1.2
        ctx.beginPath()
        if ((ctx as any).roundRect) (ctx as any).roundRect(x - s / 2, y - s / 2, s, s, 3)
        else ctx.rect(x - s / 2, y - s / 2, s, s)
        ctx.fill(); ctx.stroke()
        if (core) {
          ctx.fillStyle = "#F0B429"; ctx.fillRect(x - 3.5, y - 3.5, 7, 7)
          const r = 20 + (reduce ? 0 : (performance.now() / 55) % 18)
          ctx.strokeStyle = `rgba(240,180,41,${(0.45 * (1 - (r - 20) / 18)).toFixed(2)})`
          ctx.lineWidth = 1; ctx.strokeRect(x - r / 2, y - r / 2, r, r)
        }
        if (small) return
        ctx.fillStyle = core ? "#FFFFFF" : "#9FB3C8"
        const pos = n[4] || "r"
        ctx.textAlign = pos === "l" ? "right" : pos === "r" ? "left" : "center"
        ctx.fillText(n[0], pos === "l" ? x - s / 2 - 7 : pos === "r" ? x + s / 2 + 7 : x, pos === "u" ? y - s / 2 - 10 : pos === "d" ? y + s / 2 + 10 : y)
        ctx.textAlign = "left"
      })
      ctx.globalAlpha = 1
      if (!reduce) rafRef.current = requestAnimationFrame(frame)
    }

    cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!identifier || !password) { setError("Escribe tu número de colegiado y tu contraseña."); return }
    setLoading(true); setError("")
    const res = await signIn("credentials", { identifier: identifier.toLowerCase(), password, redirect: false })
    setLoading(false)
    if (res?.error) {
      setError("Número de colegiado o contraseña incorrectos.")
      return
    }
    router.refresh()
    router.push("/")
  }

  function fillAdmin() { setIdentifier("administracion@cime-veracruz.mx"); setPassword("Admin2026!") }
  function fillColegiado() { setIdentifier("0427"); setPassword("Cime2026!") }

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recoverEmail)) {
      setRecoverMsg("Escribe un correo válido.")
      return
    }
    setRecoverMsg("Si el correo está registrado, recibirás el enlace en unos minutos.")
  }

  return (
    <div className="login">
      {/* Panel izquierdo — mapa topológico */}
      <div className="login-art">
        <canvas id="topo-canvas" ref={canvasRef} aria-hidden="true" />
        <div className="brand">
          <div className="mark">
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />
            </svg>
          </div>
          <div>
            <div className="brand-name">CIME VERACRUZ</div>
            <div className="brand-sub">Colegio de Ingenieros Mecánicos y Electricistas</div>
          </div>
        </div>

        <div className="login-hero">
          <span className="eyebrow">Portal del Colegiado · 2026</span>
          <h1>Tu ejercicio profesional, <em>conectado.</em></h1>
          <p>Credencial, cursos con valor curricular, calendario del Colegio y constancias. Un solo acceso para todos los colegiados del estado.</p>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div className="topo-legend">
            <span><i style={{ background: "#F0B429" }} />Nodo central · <b>Veracruz</b></span>
            <span><b>{NODOS.length}</b> sedes y ciudades</span>
            <span><b>{ENL.length}</b> enlaces</span>
          </div>
          <div className="login-stats">
            <div><b>150+</b><span>Colegiados activos</span></div>
            <div><b>10</b><span>Cursos en 2026</span></div>
            <div><b>60 h</b><span>Actualización anual</span></div>
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="login-panel">
        <div className="login-card">
          <header>
            <span className="eyebrow">Acceso seguro</span>
            {mode === "login"
              ? <h2>Inicia <b>sesión</b></h2>
              : <h2>Recupera tu <b>acceso</b></h2>}
            <p className="muted" style={{ fontSize: ".9rem" }}>
              {mode === "login"
                ? "Entra con tu número de colegiado o correo registrado."
                : "Te enviaremos un enlace válido por 30 minutos al correo registrado."}
            </p>
          </header>

          {mode === "login" ? (
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }} noValidate>
              {error && (
                <div className="form-err" role="alert">
                  <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" /><path d="M12 16h.01" /></svg>
                  <span>{error}</span>
                </div>
              )}

              <div style={{ display: "grid", gap: 16 }}>
                <div className="field">
                  <label htmlFor="identifier">Número de colegiado o correo</label>
                  <div className="input-wrap">
                    <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 4m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v10a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z" /><path d="M9 10m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M15 8l2 0" /><path d="M15 12l2 0" /><path d="M7 16l10 0" /></svg>
                    <input
                      className="input" id="identifier" type="text"
                      autoComplete="username" placeholder="Ej. 0427 o nombre@correo.mx"
                      value={identifier} onChange={e => setIdentifier(e.target.value)} required
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="password">Contraseña</label>
                  <div className="input-wrap">
                    <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6z" /><path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" /><path d="M8 11v-4a4 4 0 1 1 8 0v4" /></svg>
                    <input
                      className="input" id="password"
                      type={showPass ? "text" : "password"}
                      autoComplete="current-password" placeholder="Tu contraseña"
                      style={{ paddingRight: 48 }}
                      value={password} onChange={e => setPassword(e.target.value)} required
                    />
                    <button type="button" className="icon-btn reveal" onClick={() => setShowPass(v => !v)} aria-label={showPass ? "Ocultar" : "Mostrar"}>
                      {showPass
                        ? <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.585 10.587a2 2 0 0 0 2.829 2.828" /><path d="M16.681 16.673a8.717 8.717 0 0 1 -4.681 1.327c-3.6 0 -6.6 -2 -9 -6c1.272 -2.12 2.712 -3.678 4.32 -4.674m2.86 -1.146a9.055 9.055 0 0 1 1.82 -.18c3.6 0 6.6 2 9 6c-.666 1.11 -1.379 2.067 -2.138 2.87" /><path d="M3 3l18 18" /></svg>
                        : <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" /></svg>
                      }
                    </button>
                  </div>
                </div>

                <div className="row-between">
                  <label className="check">
                    <input type="checkbox" defaultChecked /> Recordarme en este equipo
                  </label>
                  <button type="button" className="link-btn" onClick={() => { setMode("recover"); setError("") }}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button
                  className="btn primary block" type="submit"
                  style={{ height: 46 }} disabled={loading}
                >
                  {loading ? "Verificando…" : "Entrar al portal →"}
                </button>
              </div>

              {/* Demo box */}
              <div style={{ border: "1px dashed var(--line)", borderRadius: "var(--r)", padding: "12px 14px", display: "grid", gap: 8, background: "var(--surface-2)" }}>
                <div className="row-between">
                  <span className="eyebrow">Cuentas de demostración</span>
                  <span className="proto-tag">PROTOTIPO</span>
                </div>
                <div className="row-between" style={{ fontSize: ".82rem" }}>
                  <span><b>Colegiado</b> · <code style={{ fontFamily: "var(--f-mono)", fontSize: ".78rem" }}>0427</code></span>
                  <button type="button" className="btn sm" onClick={fillColegiado}>Usar</button>
                </div>
                <div className="row-between" style={{ fontSize: ".82rem" }}>
                  <span><b>Administración</b> · <code style={{ fontFamily: "var(--f-mono)", fontSize: ".78rem" }}>admin</code></span>
                  <button type="button" className="btn sm" onClick={fillAdmin}>Usar</button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRecover} style={{ display: "grid", gap: 16 }} noValidate>
              {recoverMsg && <div className={recoverMsg.startsWith("Si") ? "form-ok" : "form-err"}>{recoverMsg}</div>}
              <div className="field">
                <label htmlFor="rmail">Correo registrado</label>
                <div className="input-wrap">
                  <svg className="ico sm" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" /><path d="M3 7l9 6l9 -6" /></svg>
                  <input className="input" id="rmail" type="email" placeholder="nombre@correo.mx" value={recoverEmail} onChange={e => setRecoverEmail(e.target.value)} />
                </div>
              </div>
              <button className="btn primary block" type="submit" style={{ height: 46 }}>Enviar enlace de recuperación</button>
              <button className="btn ghost block" type="button" onClick={() => { setMode("login"); setRecoverMsg("") }}>
                ← Volver al inicio de sesión
              </button>
            </form>
          )}

          <p className="login-foot">
            Conexión cifrada · Sesión protegida<br />
            © 2026 CIME Veracruz
          </p>
        </div>
      </div>
    </div>
  )
}

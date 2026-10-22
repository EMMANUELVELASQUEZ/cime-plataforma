"use client"
import { useEffect, useRef, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

// World nodes: [name, lat, lon, isCore?]
const NODES: [string, number, number, boolean?][] = [
  ["Veracruz",     19.18,  -96.14, true],
  ["México",       19.43,  -99.13],
  ["Monterrey",    25.67, -100.31],
  ["Nueva York",   40.71,  -74.01],
  ["Los Ángeles",  34.05, -118.24],
  ["Toronto",      43.65,  -79.38],
  ["São Paulo",   -23.55,  -46.63],
  ["Londres",      51.51,   -0.13],
  ["Madrid",       40.42,   -3.70],
  ["París",        48.85,    2.35],
  ["Berlín",       52.52,   13.40],
  ["Moscú",        55.75,   37.62],
  ["Dubai",        25.20,   55.27],
  ["Mumbai",       19.08,   72.88],
  ["Singapur",      1.35,  103.82],
  ["Tokio",        35.69,  139.69],
  ["Shanghai",     31.23,  121.47],
  ["Sídney",      -33.87,  151.21],
  ["Lagos",         6.45,    3.39],
  ["El Cairo",     30.04,   31.24],
]

const CONN: [number, number][] = [
  [0,1],[0,2],[0,3],[1,2],[2,3],[3,4],[3,5],[3,7],[1,6],[6,5],
  [7,8],[7,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],
  [15,16],[14,17],[7,18],[18,19],[12,19],[0,7],[1,7],
]

// Simplified continent polygons [lon, lat]
const LAND: [number, number][][] = [
  // North America
  [[-168,72],[-140,60],[-130,54],[-124,49],[-117,32],[-110,22],[-90,16],[-83,10],[-75,9],[-62,12],[-65,18],[-80,24],[-90,30],[-97,26],[-105,20],[-115,32],[-120,39],[-124,46],[-132,54],[-140,61],[-165,62],[-168,72]],
  // Greenland
  [[-73,83],[-28,83],[-18,70],[-45,60],[-55,65],[-66,70],[-73,83]],
  // South America
  [[-75,11],[-62,11],[-50,0],[-35,-8],[-38,-23],[-50,-28],[-65,-38],[-67,-54],[-75,-50],[-80,-35],[-78,-8],[-75,11]],
  // Europe
  [[-10,36],[-5,38],[3,43],[8,44],[15,47],[30,43],[30,60],[25,65],[15,70],[0,62],[-8,58],[-10,52],[-5,44],[-10,36]],
  // UK
  [[-5,50],[-1,51],[0,53],[0,58],[-5,58],[-6,55],[-5,50]],
  // Africa
  [[-17,15],[-14,10],[-8,5],[2,5],[8,-2],[12,-16],[18,-30],[20,-35],[27,-35],[37,-22],[40,-10],[43,12],[43,18],[38,22],[32,31],[24,35],[10,37],[0,37],[-5,34],[-17,15]],
  // Asia
  [[28,41],[42,40],[50,25],[57,22],[65,22],[72,20],[78,8],[80,5],[100,3],[105,5],[110,1],[120,5],[128,2],[130,10],[132,35],[140,40],[140,50],[135,55],[120,50],[115,55],[100,55],[85,50],[80,44],[68,43],[58,44],[45,43],[35,38],[28,41]],
  // Borneo
  [[108,7],[118,7],[118,-4],[108,-4],[108,7]],
  // Australia
  [[114,-22],[120,-30],[126,-34],[132,-38],[140,-36],[149,-38],[152,-27],[152,-18],[140,-15],[130,-12],[122,-16],[114,-22]],
  // Japan
  [[130,31],[131,33],[130,36],[132,44],[136,44],[141,44],[144,42],[142,38],[136,35],[132,32],[130,31]],
  // Scandinavia
  [[5,58],[5,62],[8,63],[15,70],[20,70],[28,71],[30,65],[25,60],[20,56],[15,56],[5,58]],
  // Iceland
  [[-24,64],[-14,66],[-13,65],[-20,63],[-24,64]],
]

export default function LoginClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef(0)
  const router    = useRouter()

  const [identifier,    setIdentifier]   = useState("")
  const [password,      setPassword]     = useState("")
  const [showPass,      setShowPass]     = useState(false)
  const [error,         setError]        = useState("")
  const [loading,       setLoading]      = useState(false)
  const [mode,          setMode]         = useState<"login" | "recover">("login")
  const [recoverEmail,  setRecoverEmail] = useState("")
  const [recoverMsg,    setRecoverMsg]   = useState("")

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext("2d")!
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches

    const packets = CONN.flatMap((_, i) => [
      { e: i, t: Math.random(), v: 0.0005 + Math.random() * 0.0009, dir: 1 as const },
      { e: i, t: Math.random(), v: 0.0004 + Math.random() * 0.0007, dir: -1 as const },
    ])

    function proj(lon: number, lat: number, w: number, h: number): [number, number] {
      return [(lon + 180) / 360 * w, (90 - lat) / 180 * h]
    }

    function frame() {
      if (!cv) return
      const dpr = Math.min(devicePixelRatio || 1, 2)
      const w = cv.clientWidth, h = cv.clientHeight
      if (!w || !h) { rafRef.current = requestAnimationFrame(frame); return }
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width  = Math.round(w * dpr)
        cv.height = Math.round(h * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // ── Graticule ────────────────────────────────────
      ctx.lineWidth = 0.5
      for (let lat = -60; lat <= 60; lat += 30) {
        const [, y] = proj(0, lat, w, h)
        ctx.strokeStyle = lat === 0 ? "rgba(74,144,217,.2)" : "rgba(74,144,217,.08)"
        ctx.lineWidth   = lat === 0 ? 1 : 0.5
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }
      for (let lon = -180; lon <= 180; lon += 30) {
        const [x] = proj(lon, 0, w, h)
        ctx.strokeStyle = "rgba(74,144,217,.07)"
        ctx.lineWidth   = 0.5
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
      }

      // ── Continents ───────────────────────────────────
      LAND.forEach(poly => {
        ctx.beginPath()
        poly.forEach(([lon, lat], i) => {
          const [x, y] = proj(lon, lat, w, h)
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        })
        ctx.closePath()
        ctx.fillStyle   = "rgba(74,144,217,.09)"
        ctx.strokeStyle = "rgba(74,144,217,.28)"
        ctx.lineWidth   = 0.8
        ctx.fill()
        ctx.stroke()
      })

      // ── Connection arcs ───────────────────────────────
      ctx.setLineDash([3, 7])
      ctx.lineWidth = 0.8
      CONN.forEach(([i, j]) => {
        const [x1, y1] = proj(NODES[i][2], NODES[i][1], w, h)
        const [x2, y2] = proj(NODES[j][2], NODES[j][1], w, h)
        if (Math.abs(x1 - x2) > w * 0.55) return
        const mx = (x1 + x2) / 2
        const my = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.12
        ctx.strokeStyle = "rgba(109,166,230,.18)"
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.quadraticCurveTo(mx, my, x2, y2)
        ctx.stroke()
      })
      ctx.setLineDash([])

      // ── Animated packets ──────────────────────────────
      packets.forEach(p => {
        if (!reduce) {
          p.t += p.v * p.dir
          if (p.t > 1) p.t -= 1
          if (p.t < 0) p.t += 1
        }
        const [i, j] = CONN[p.e]
        const [x1, y1] = proj(NODES[i][2], NODES[i][1], w, h)
        const [x2, y2] = proj(NODES[j][2], NODES[j][1], w, h)
        if (Math.abs(x1 - x2) > w * 0.55) return
        const mx = (x1 + x2) / 2
        const my = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.12
        const t  = p.t
        const px = (1-t)*(1-t)*x1 + 2*(1-t)*t*mx + t*t*x2
        const py = (1-t)*(1-t)*y1 + 2*(1-t)*t*my + t*t*y2
        ctx.fillStyle = p.dir > 0 ? "#F0B429" : "#6DA6E6"
        ctx.beginPath(); ctx.arc(px, py, 1.8, 0, 7); ctx.fill()
      })

      // ── Nodes ─────────────────────────────────────────
      NODES.forEach(([, lat, lon, core]) => {
        const [x, y] = proj(lon, lat, w, h)
        const r = core ? 6 : 3.5

        if (core) {
          const now = performance.now()
          const p1 = 18 + (reduce ? 0 : (now / 55) % 20)
          const p2 = 10 + (reduce ? 0 : (now / 80) % 14)
          ctx.lineWidth = 1.5
          ctx.strokeStyle = `rgba(240,180,41,${(0.5*(1-(p1-18)/20)).toFixed(2)})`
          ctx.beginPath(); ctx.arc(x, y, p1, 0, Math.PI*2); ctx.stroke()
          ctx.strokeStyle = `rgba(240,180,41,${(0.35*(1-(p2-10)/14)).toFixed(2)})`
          ctx.beginPath(); ctx.arc(x, y, p2, 0, Math.PI*2); ctx.stroke()
        }

        ctx.fillStyle   = "#07101D"
        ctx.strokeStyle = core ? "#F0B429" : "rgba(109,166,230,.75)"
        ctx.lineWidth   = core ? 2 : 1
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill(); ctx.stroke()
        if (core) {
          ctx.fillStyle = "#F0B429"
          ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI*2); ctx.fill()
        }
      })

      // ── Veracruz label ────────────────────────────────
      const [vx, vy] = proj(NODES[0][2], NODES[0][1], w, h)
      ctx.font      = "600 11px 'Inter',system-ui,sans-serif"
      ctx.fillStyle = "#F0B429"
      ctx.textAlign = "left"
      ctx.fillText("Veracruz · CIME", vx + 12, vy + 4)

      if (!reduce) rafRef.current = requestAnimationFrame(frame)
    }

    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!identifier || !password) { setError("Escribe tu número de colegiado y tu contraseña."); return }
    setLoading(true); setError("")
    const res = await signIn("credentials", { identifier: identifier.toLowerCase(), password, redirect: false })
    setLoading(false)
    if (res?.error) { setError("Número de colegiado o contraseña incorrectos."); return }
    router.refresh()
    router.push("/")
  }

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
      {/* Panel izquierdo — mapa mundial */}
      <div className="login-art">
        <canvas id="topo-canvas" ref={canvasRef} aria-hidden="true" />
        <div className="brand">
          <img src="/logo.jpeg" alt="CIME Veracruz" style={{ width: 80, height: 80, objectFit: "contain", flexShrink: 0 }} />
          <div>
            <div className="brand-name">CIME VERACRUZ</div>
            <div className="brand-sub">Colegio de Ingenieros Mecánicos y Electricistas</div>
          </div>
        </div>

        <div className="login-hero">
          <h1>Tu ejercicio profesional, <em>conectado.</em></h1>
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

"use client"
import { useEffect, useRef, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

// ── Ciudades CIME en Veracruz [nombre, lat, lon, esCore?]
const NODES: [string, number, number, boolean?][] = [
  ["Veracruz",           19.19, -96.14, true],
  ["Xalapa",             19.54, -96.92],
  ["Boca del Río",       19.10, -96.11],
  ["Córdoba",            18.88, -96.93],
  ["Orizaba",            18.85, -97.10],
  ["Poza Rica",          20.53, -97.46],
  ["Tuxpan",             20.96, -97.39],
  ["Papantla",           20.44, -97.32],
  ["Coatzacoalcos",      18.14, -94.45],
  ["Minatitlán",         17.98, -94.56],
  ["Alvarado",           18.77, -95.76],
  ["San Andrés Tuxtla",  18.46, -95.21],
  ["Martínez de la Torre",20.07,-97.05],
]

const CONN: [number, number][] = [
  [0, 1], [0, 2], [0, 10], [0, 11],
  [1, 3], [1, 7], [1, 12],
  [3, 4], [5, 6], [5, 7], [5, 12],
  [7, 6], [8, 9], [8, 11],
  [10, 11], [11, 8], [2, 0],
]

// ── Polígono aproximado del estado de Veracruz [lon, lat]
const VER: [number, number][] = [
  [-98.9,21.8],[-98.6,21.9],[-98.2,21.8],[-97.9,21.6],
  [-97.6,22.0],[-97.4,22.3],[-97.2,22.2],
  [-97.0,21.7],[-97.1,21.1],[-97.3,20.8],
  [-97.4,20.3],[-97.1,19.8],[-96.8,19.5],
  [-96.5,19.3],[-96.2,19.1],[-96.1,18.9],
  [-95.9,18.8],[-95.6,18.5],[-95.2,18.3],
  [-94.8,18.1],[-94.4,18.0],[-94.1,18.2],
  [-93.7,17.9],[-93.5,17.5],
  [-93.9,17.4],[-94.5,17.3],[-95.0,17.5],
  [-95.5,17.9],[-96.1,18.4],[-96.6,18.8],
  [-97.0,19.1],[-97.3,19.5],[-97.6,20.0],
  [-97.9,20.5],[-98.2,21.0],[-98.5,21.4],
  [-98.9,21.8],
]

// ── Estados vecinos (muy tenues, para contexto geográfico)
const NEIGHBORS: [number,number][][] = [
  // Tamaulipas (norte)
  [[-98.9,22.0],[-97.4,22.5],[-97.0,23.5],[-99.5,23.0],[-99.5,22.0],[-98.9,22.0]],
  // San Luis Potosí (noroeste)
  [[-99.5,22.0],[-100.5,22.5],[-100.5,21.0],[-99.0,21.0],[-98.9,21.8],[-99.5,22.0]],
  // Hidalgo / Puebla (oeste)
  [[-99.5,21.0],[-100.0,20.5],[-100.0,18.5],[-98.0,18.0],[-97.3,19.5],[-98.9,21.8],[-99.5,21.0]],
  // Oaxaca (sur)
  [[-93.5,17.5],[-93.0,16.5],[-96.5,16.0],[-98.0,17.5],[-96.0,18.0],[-95.0,17.5],[-93.5,17.5]],
  // Tabasco (sureste)
  [[-93.5,17.5],[-93.0,17.0],[-91.5,17.5],[-91.5,18.5],[-93.5,18.5],[-93.5,17.5]],
]

// Bounding box del mapa (con margen)
const LON_MIN = -99.6, LON_MAX = -92.8
const LAT_MIN = 16.5,  LAT_MAX = 23.0

export default function LoginClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef(0)
  const router    = useRouter()

  const [identifier,   setIdentifier]  = useState("")
  const [password,     setPassword]    = useState("")
  const [showPass,     setShowPass]    = useState(false)
  const [error,        setError]       = useState("")
  const [loading,      setLoading]     = useState(false)
  const [mode,         setMode]        = useState<"login" | "recover">("login")
  const [recoverEmail, setRecoverEmail]= useState("")
  const [recoverMsg,   setRecoverMsg]  = useState("")

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext("2d")!
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches

    // Partículas en conexiones
    const packets = CONN.flatMap((_, i) => [
      { e: i, t: Math.random(), v: 0.0004 + Math.random() * 0.0007, dir:  1 as 1 | -1 },
      { e: i, t: Math.random(), v: 0.0003 + Math.random() * 0.0005, dir: -1 as 1 | -1 },
    ])

    // Estrellas de fondo fijas
    const stars = Array.from({ length: 60 }, () => ({
      rx: Math.random(), ry: Math.random(),
      r: 0.4 + Math.random() * 0.9,
      a: 0.1 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
    }))

    function proj(lon: number, lat: number, w: number, h: number): [number, number] {
      const px = 0.07, py = 0.06
      const uw = w * (1 - px * 2), uh = h * (1 - py * 2)
      return [
        px * w + (lon - LON_MIN) / (LON_MAX - LON_MIN) * uw,
        py * h + (LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * uh,
      ]
    }

    function drawGear(x: number, y: number, r: number, teeth: number, t: number) {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(t)
      ctx.beginPath()
      for (let i = 0; i < teeth * 2; i++) {
        const angle = (i / (teeth * 2)) * Math.PI * 2
        const rad = i % 2 === 0 ? r : r * 0.72
        i === 0 ? ctx.moveTo(Math.cos(angle) * rad, Math.sin(angle) * rad)
                : ctx.lineTo(Math.cos(angle) * rad, Math.sin(angle) * rad)
      }
      ctx.closePath()
      ctx.strokeStyle = "rgba(240,180,41,0.35)"
      ctx.lineWidth = 0.8
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2)
      ctx.strokeStyle = "rgba(240,180,41,0.25)"
      ctx.stroke()
      ctx.restore()
    }

    function drawBolt(x: number, y: number, s: number, alpha: number) {
      ctx.save()
      ctx.translate(x, y)
      ctx.strokeStyle = `rgba(109,166,230,${alpha})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(s * 0.3, -s * 0.5)
      ctx.lineTo(-s * 0.1, 0)
      ctx.lineTo(s * 0.2, 0)
      ctx.lineTo(-s * 0.3, s * 0.5)
      ctx.stroke()
      ctx.restore()
    }

    function quadPt(x1: number, y1: number, mx: number, my: number, x2: number, y2: number, t: number): [number, number] {
      return [
        (1-t)*(1-t)*x1 + 2*(1-t)*t*mx + t*t*x2,
        (1-t)*(1-t)*y1 + 2*(1-t)*t*my + t*t*y2,
      ]
    }

    function frame() {
      if (!cv) return
      const dpr = Math.min(devicePixelRatio || 1, 2)
      const w = cv.clientWidth, h = cv.clientHeight
      if (!w || !h) { rafRef.current = requestAnimationFrame(frame); return }
      if (cv.width  !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width  = Math.round(w * dpr)
        cv.height = Math.round(h * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const now = performance.now()

      // ── Estrellas de fondo ───────────────────────────────
      stars.forEach(s => {
        const alpha = s.a * (0.6 + 0.4 * Math.sin(now * 0.001 + s.phase))
        ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`
        ctx.beginPath()
        ctx.arc(s.rx * w, s.ry * h, s.r, 0, Math.PI * 2)
        ctx.fill()
      })

      // ── Grid sutil ───────────────────────────────────────
      ctx.lineWidth = 0.4
      for (let lon = -100; lon <= -92; lon += 1) {
        const [x] = proj(lon, 20, w, h)
        ctx.strokeStyle = "rgba(74,144,217,0.055)"
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
      }
      for (let lat = 17; lat <= 23; lat += 1) {
        const [, y] = proj(-96, lat, w, h)
        ctx.strokeStyle = "rgba(74,144,217,0.055)"
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }

      // ── Estados vecinos (contexto) ───────────────────────
      NEIGHBORS.forEach(poly => {
        ctx.beginPath()
        poly.forEach(([lon, lat], i) => {
          const [x, y] = proj(lon, lat, w, h)
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        })
        ctx.closePath()
        ctx.fillStyle   = "rgba(30,55,100,0.18)"
        ctx.strokeStyle = "rgba(74,144,217,0.1)"
        ctx.lineWidth   = 0.5
        ctx.fill(); ctx.stroke()
      })

      // ── Polígono de Veracruz ─────────────────────────────
      ctx.beginPath()
      VER.forEach(([lon, lat], i) => {
        const [x, y] = proj(lon, lat, w, h)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.closePath()

      // Relleno con gradiente radial desde Veracruz city
      const [vx, vy] = proj(-96.14, 19.19, w, h)
      const grad = ctx.createRadialGradient(vx, vy, 0, vx, vy, w * 0.6)
      grad.addColorStop(0, "rgba(13,32,96,0.82)")
      grad.addColorStop(1, "rgba(5,14,46,0.65)")
      ctx.fillStyle   = grad
      ctx.strokeStyle = "rgba(109,166,230,0.5)"
      ctx.lineWidth   = 1.2
      ctx.fill()
      ctx.stroke()

      // ── Golfo de México label ────────────────────────────
      const [gx, gy] = proj(-94.5, 20.5, w, h)
      ctx.save()
      ctx.font      = `italic 500 ${Math.round(h * 0.022)}px 'Inter',system-ui,sans-serif`
      ctx.fillStyle = "rgba(109,166,230,0.22)"
      ctx.textAlign = "center"
      ctx.fillText("GOLFO", gx, gy - 8)
      ctx.fillText("DE MÉXICO", gx, gy + 10)
      ctx.restore()

      // ── Montañas decorativas (Sierra Madre) ─────────────
      const mtPts: [number, number][] = [
        [-98.0,20.8],[-97.6,20.2],[-97.2,19.6],[-97.0,19.2],
        [-96.8,18.9],[-96.6,18.6],[-96.3,18.4],
      ]
      mtPts.forEach(([lon, lat]) => {
        const [mx, my] = proj(lon, lat, w, h)
        const ms = Math.round(h * 0.018)
        ctx.beginPath()
        ctx.moveTo(mx, my)
        ctx.lineTo(mx - ms, my + ms)
        ctx.lineTo(mx + ms, my + ms)
        ctx.closePath()
        ctx.strokeStyle = "rgba(74,144,217,0.15)"
        ctx.lineWidth = 0.6
        ctx.stroke()
      })

      // ── Conexiones arco ──────────────────────────────────
      ctx.setLineDash([3, 6])
      ctx.lineWidth = 0.9
      CONN.forEach(([i, j]) => {
        const [x1, y1] = proj(NODES[i][2], NODES[i][1], w, h)
        const [x2, y2] = proj(NODES[j][2], NODES[j][1], w, h)
        const mx = (x1 + x2) / 2
        const my = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.18
        ctx.strokeStyle = "rgba(109,166,230,0.2)"
        ctx.beginPath(); ctx.moveTo(x1, y1)
        ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke()

        // Rayo eléctrico decorativo en mitad de conexión
        const [bx, by] = quadPt(x1, y1, mx, my, x2, y2, 0.5)
        const pulse = 0.12 + 0.08 * Math.sin(now * 0.002 + i * 0.7)
        drawBolt(bx, by, h * 0.013, pulse)
      })
      ctx.setLineDash([])

      // ── Partículas animadas ───────────────────────────────
      packets.forEach(p => {
        if (!reduce) {
          p.t += p.v * p.dir
          if (p.t > 1) p.t -= 1
          if (p.t < 0) p.t += 1
        }
        const [i, j] = CONN[p.e]
        const [x1, y1] = proj(NODES[i][2], NODES[i][1], w, h)
        const [x2, y2] = proj(NODES[j][2], NODES[j][1], w, h)
        const mx = (x1 + x2) / 2
        const my = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.18
        const [px, py] = quadPt(x1, y1, mx, my, x2, y2, p.t)
        const isGold = p.dir > 0
        const col = isGold ? `rgba(240,180,41,0.9)` : `rgba(109,166,230,0.85)`
        const trail = isGold ? `rgba(240,180,41,0.0)` : `rgba(109,166,230,0.0)`
        const tr = p.t - p.dir * 0.06
        const [tx, ty] = quadPt(x1, y1, mx, my, x2, y2, Math.min(1, Math.max(0, tr)))
        const tg = ctx.createLinearGradient(tx, ty, px, py)
        tg.addColorStop(0, trail); tg.addColorStop(1, col)
        ctx.strokeStyle = tg; ctx.lineWidth = 1.6
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(px, py); ctx.stroke()
        ctx.fillStyle = col
        ctx.beginPath(); ctx.arc(px, py, 2.2, 0, Math.PI * 2); ctx.fill()
      })

      // ── Nodos ciudad ─────────────────────────────────────
      NODES.forEach(([name, lat, lon, core], idx) => {
        const [x, y] = proj(lon, lat, w, h)
        const r = core ? 7 : 3.8

        if (core) {
          // Anillo radar giratorio
          const angle = (now / 2800) % (Math.PI * 2)
          ctx.beginPath()
          ctx.arc(x, y, r + 14, angle, angle + Math.PI * 1.3)
          ctx.strokeStyle = "rgba(240,180,41,0.5)"
          ctx.lineWidth = 1.4; ctx.stroke()

          // Pulsos concéntricos
          ;[22, 32, 44].forEach((pr, pi) => {
            const phase = (now / (1000 + pi * 300)) % 1
            const alpha = (1 - phase) * 0.4
            ctx.beginPath()
            ctx.arc(x, y, pr * phase + r, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(240,180,41,${alpha.toFixed(2)})`
            ctx.lineWidth = 1; ctx.stroke()
          })

          // Gear giratorio
          drawGear(x, y, r + 10, 8, now * 0.0004)
        }

        // Círculo del nodo
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle   = "#07101D"
        ctx.strokeStyle = core ? "#F0B429" : "rgba(109,166,230,0.8)"
        ctx.lineWidth   = core ? 2 : 1
        ctx.fill(); ctx.stroke()

        // Punto interior
        if (core) {
          ctx.beginPath(); ctx.arc(x, y, 2.8, 0, Math.PI * 2)
          ctx.fillStyle = "#F0B429"; ctx.fill()
        } else {
          const pulse = 0.6 + 0.4 * Math.sin(now * 0.0015 + idx * 1.1)
          ctx.beginPath(); ctx.arc(x, y, 1.4, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(109,166,230,${pulse.toFixed(2)})`; ctx.fill()
        }

        // Etiqueta ciudad
        const show = core || [1, 5, 7, 8].includes(idx)
        if (show) {
          const fs = core ? Math.round(h * 0.018) : Math.round(h * 0.014)
          ctx.font      = `${core ? 700 : 500} ${fs}px 'Inter',system-ui,sans-serif`
          ctx.fillStyle = core ? "#F0B429" : "rgba(200,220,255,0.65)"
          ctx.textAlign = "left"
          const lx = x + r + 5
          const ly = y + 4
          if (core) {
            ctx.fillText(`Veracruz · CIME`, lx, ly)
          } else {
            ctx.fillText(name, lx, ly)
          }
        }
      })

      // ── VERACRUZ label en el estado ───────────────────────
      const [slx, sly] = proj(-96.8, 20.2, w, h)
      ctx.save()
      ctx.font      = `800 ${Math.round(h * 0.028)}px 'Inter',system-ui,sans-serif`
      ctx.fillStyle = "rgba(255,255,255,0.045)"
      ctx.textAlign = "center"
      ctx.letterSpacing = "0.15em"
      ctx.fillText("VERACRUZ", slx, sly)
      ctx.restore()

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
      {/* Panel izquierdo — mapa de Veracruz */}
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

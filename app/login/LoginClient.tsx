"use client"
import { useEffect, useRef, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

// Municipios CIME Veracruz [nombre, lat, lon, esCore?]
const NODES: [string, number, number, boolean?][] = [
  ["Veracruz",              19.19, -96.14, true],
  ["Xalapa",                19.54, -96.92],
  ["Boca del Río",          19.10, -96.11],
  ["Córdoba",               18.88, -96.93],
  ["Orizaba",               18.85, -97.10],
  ["Poza Rica",             20.53, -97.46],
  ["Tuxpan",                20.96, -97.39],
  ["Papantla",              20.44, -97.32],
  ["Coatzacoalcos",         18.14, -94.45],
  ["Minatitlán",            17.98, -94.56],
  ["Alvarado",              18.77, -95.76],
  ["San Andrés Tuxtla",     18.46, -95.21],
  ["Martínez de la Torre",  20.07, -97.05],
]

const CONN: [number, number][] = [
  [0,1],[0,2],[0,10],[0,11],[0,3],
  [1,3],[1,7],[1,12],[1,5],
  [3,4],[5,6],[5,7],[5,12],
  [7,6],[8,9],[8,11],[10,11],
]

// Polígono de Veracruz [lon, lat]
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

const NEIGHBORS: [number,number][][] = [
  [[-98.9,22.0],[-97.4,22.5],[-97.0,23.5],[-99.5,23.0],[-99.5,22.0],[-98.9,22.0]],
  [[-99.5,22.0],[-100.5,22.5],[-100.5,21.0],[-99.0,21.0],[-98.9,21.8],[-99.5,22.0]],
  [[-99.5,21.0],[-100.0,20.5],[-100.0,18.5],[-98.0,18.0],[-97.3,19.5],[-98.9,21.8],[-99.5,21.0]],
  [[-93.5,17.5],[-93.0,16.5],[-96.5,16.0],[-98.0,17.5],[-96.0,18.0],[-95.0,17.5],[-93.5,17.5]],
  [[-93.5,17.5],[-93.0,17.0],[-91.5,17.5],[-91.5,18.5],[-93.5,18.5],[-93.5,17.5]],
]

const LON_MIN = -99.6, LON_MAX = -92.8
const LAT_MIN = 16.5,  LAT_MAX = 23.0

// Colores de partículas
const PCOLS = [
  { dot: "rgba(0,224,255,1)",   glow: "rgba(0,224,255,0.9)",   trail: "rgba(0,224,255,0)" },
  { dot: "rgba(255,210,0,1)",   glow: "rgba(255,210,0,0.9)",   trail: "rgba(255,210,0,0)" },
  { dot: "rgba(180,255,180,1)", glow: "rgba(180,255,180,0.9)", trail: "rgba(180,255,180,0)" },
]

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

    // 4 partículas por conexión — velocidad alta
    const packets = CONN.flatMap((_, i) => [
      { e: i, t: Math.random(),           v: 0.0030 + Math.random()*0.0025, dir:  1 as 1|-1, ci: 0 },
      { e: i, t: (Math.random()+0.25)%1,  v: 0.0025 + Math.random()*0.0020, dir:  1 as 1|-1, ci: 1 },
      { e: i, t: (Math.random()+0.5)%1,   v: 0.0028 + Math.random()*0.0022, dir: -1 as 1|-1, ci: 0 },
      { e: i, t: (Math.random()+0.75)%1,  v: 0.0032 + Math.random()*0.0018, dir: -1 as 1|-1, ci: 2 },
    ])

    // Estrellas de fondo
    const stars = Array.from({ length: 90 }, () => ({
      rx: Math.random(), ry: Math.random(),
      r:  0.3 + Math.random() * 0.9,
      a:  0.05 + Math.random() * 0.18,
      ph: Math.random() * Math.PI * 2,
      sp: 0.0003 + Math.random() * 0.0007,
    }))

    function proj(lon: number, lat: number, w: number, h: number): [number, number] {
      const px = 0.06, py = 0.055
      return [
        px*w + (lon - LON_MIN)/(LON_MAX - LON_MIN) * w*(1-px*2),
        py*h + (LAT_MAX - lat)/(LAT_MAX - LAT_MIN) * h*(1-py*2),
      ]
    }

    function qpt(x1:number,y1:number,mx:number,my:number,x2:number,y2:number,t:number):[number,number]{
      const u=1-t
      return [u*u*x1+2*u*t*mx+t*t*x2, u*u*y1+2*u*t*my+t*t*y2]
    }

    function frame() {
      if (!cv) return
      const dpr = Math.min(devicePixelRatio||1, 2)
      const w = cv.clientWidth, h = cv.clientHeight
      if (!w||!h) { rafRef.current = requestAnimationFrame(frame); return }
      if (cv.width !== Math.round(w*dpr) || cv.height !== Math.round(h*dpr)) {
        cv.width = Math.round(w*dpr); cv.height = Math.round(h*dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const now = performance.now()

      // ── Fondo: profundidad oscura ────────────────────────
      const bg = ctx.createRadialGradient(w*0.38, h*0.48, 0, w*0.38, h*0.48, w*0.9)
      bg.addColorStop(0, "#071b3a")
      bg.addColorStop(0.5, "#040f24")
      bg.addColorStop(1,  "#010810")
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // ── Estrellas ────────────────────────────────────────
      stars.forEach(s => {
        const a = s.a * (0.5 + 0.5*Math.sin(now*s.sp + s.ph))
        ctx.beginPath()
        ctx.arc(s.rx*w, s.ry*h, s.r, 0, Math.PI*2)
        ctx.fillStyle = `rgba(190,215,255,${a.toFixed(3)})`
        ctx.fill()
      })

      // ── Estados vecinos (contexto tenue) ─────────────────
      NEIGHBORS.forEach(poly => {
        ctx.beginPath()
        poly.forEach(([ln,la],i) => {
          const[x,y]=proj(ln,la,w,h); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)
        })
        ctx.closePath()
        ctx.fillStyle   = "rgba(8,22,55,0.55)"
        ctx.strokeStyle = "rgba(20,60,140,0.15)"
        ctx.lineWidth   = 0.5
        ctx.fill(); ctx.stroke()
      })

      // ── Polígono Veracruz — relleno ───────────────────────
      ctx.beginPath()
      VER.forEach(([ln,la],i) => {
        const[x,y]=proj(ln,la,w,h); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)
      })
      ctx.closePath()

      const [vx,vy] = proj(-96.14, 19.19, w, h)
      const verFill = ctx.createRadialGradient(vx,vy,0,vx,vy,w*0.5)
      verFill.addColorStop(0, "rgba(0,50,130,0.65)")
      verFill.addColorStop(0.6,"rgba(0,25,70,0.5)")
      verFill.addColorStop(1,  "rgba(0,10,35,0.35)")
      ctx.fillStyle = verFill
      ctx.fill()

      // Contorno con glow eléctrico
      ctx.save()
      ctx.shadowColor = "rgba(0,180,255,0.75)"
      ctx.shadowBlur  = 14
      ctx.strokeStyle = "rgba(0,190,255,0.75)"
      ctx.lineWidth   = 1.8
      ctx.stroke()
      ctx.restore()

      // Segunda pasada más delgada y brillante
      ctx.save()
      ctx.shadowColor = "rgba(100,230,255,0.4)"
      ctx.shadowBlur  = 4
      ctx.strokeStyle = "rgba(140,230,255,0.4)"
      ctx.lineWidth   = 0.6
      ctx.stroke()
      ctx.restore()

      // ── Golfo de México ───────────────────────────────────
      const [gx,gy] = proj(-93.5, 21.0, w, h)
      ctx.save()
      ctx.font      = `italic 400 ${Math.round(h*0.019)}px 'Inter',system-ui,sans-serif`
      ctx.fillStyle = "rgba(0,170,230,0.17)"
      ctx.textAlign = "center"
      ctx.fillText("GOLFO DE MÉXICO", gx, gy)
      ctx.restore()

      // ── Conexiones base ───────────────────────────────────
      CONN.forEach(([i,j]) => {
        const [x1,y1]=proj(NODES[i][2],NODES[i][1],w,h)
        const [x2,y2]=proj(NODES[j][2],NODES[j][1],w,h)
        const mx=(x1+x2)/2, my=(y1+y2)/2 - Math.hypot(x2-x1,y2-y1)*0.14
        ctx.save()
        ctx.shadowColor = "rgba(0,100,200,0.25)"
        ctx.shadowBlur  = 6
        ctx.strokeStyle = "rgba(0,80,180,0.28)"
        ctx.lineWidth   = 1.1
        ctx.beginPath(); ctx.moveTo(x1,y1)
        ctx.quadraticCurveTo(mx,my,x2,y2); ctx.stroke()
        ctx.restore()
      })

      // ── Partículas animadas ───────────────────────────────
      packets.forEach(p => {
        if (!reduce) {
          p.t += p.v * p.dir
          if (p.t > 1) p.t -= 1
          if (p.t < 0) p.t += 1
        }
        const [i,j]=CONN[p.e]
        const [x1,y1]=proj(NODES[i][2],NODES[i][1],w,h)
        const [x2,y2]=proj(NODES[j][2],NODES[j][1],w,h)
        const mx=(x1+x2)/2, my=(y1+y2)/2 - Math.hypot(x2-x1,y2-y1)*0.14
        const [px,py]=qpt(x1,y1,mx,my,x2,y2,p.t)
        const col = PCOLS[p.ci]

        // Cola de estela
        const tr = Math.min(1,Math.max(0, p.t - p.dir*0.09))
        const [tx,ty]=qpt(x1,y1,mx,my,x2,y2,tr)
        const tg = ctx.createLinearGradient(tx,ty,px,py)
        tg.addColorStop(0, col.trail)
        tg.addColorStop(1, col.dot)

        ctx.save()
        ctx.shadowColor = col.glow
        ctx.shadowBlur  = 8
        ctx.strokeStyle = tg
        ctx.lineWidth   = 2.2
        ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(px,py); ctx.stroke()
        // Punto cabeza
        ctx.beginPath(); ctx.arc(px,py, 2.8, 0, Math.PI*2)
        ctx.fillStyle = col.dot; ctx.fill()
        ctx.restore()
      })

      // ── Nodos ciudad ──────────────────────────────────────
      NODES.forEach(([name,lat,lon,core],idx) => {
        const [x,y]=proj(lon,lat,w,h)
        const r = core ? 8 : 4.5

        if (core) {
          // Pulsos expansivos dorados
          for (let pi=0; pi<3; pi++) {
            const phase = ((now/1100) + pi*0.333) % 1
            const pr    = 10 + 36*phase
            const alpha = (1-phase) * 0.65
            ctx.beginPath(); ctx.arc(x,y,pr,0,Math.PI*2)
            ctx.strokeStyle = `rgba(255,205,0,${alpha.toFixed(3)})`
            ctx.lineWidth   = 1.8
            ctx.stroke()
          }
          // Barrido radar
          ctx.save()
          ctx.shadowColor = "rgba(255,210,0,0.9)"
          ctx.shadowBlur  = 16
          const angle = (now/2200) % (Math.PI*2)
          ctx.beginPath()
          ctx.arc(x,y, r+18, angle, angle + Math.PI*0.85)
          ctx.strokeStyle = "rgba(255,210,0,0.85)"
          ctx.lineWidth   = 2.2
          ctx.stroke()
          ctx.restore()
        } else {
          // Pulso sutil en nodos menores
          const ph  = ((now/1600) + idx*0.19) % 1
          const pr2 = 4 + 10*ph
          const a2  = (1-ph) * 0.45
          ctx.beginPath(); ctx.arc(x,y,pr2,0,Math.PI*2)
          ctx.strokeStyle = `rgba(0,200,255,${a2.toFixed(3)})`
          ctx.lineWidth   = 1
          ctx.stroke()
        }

        // Nodo principal
        ctx.save()
        ctx.shadowColor = core ? "rgba(255,210,0,1)" : "rgba(0,210,255,0.85)"
        ctx.shadowBlur  = core ? 20 : 12
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2)
        ctx.fillStyle   = core ? "#120500" : "#00111f"
        ctx.strokeStyle = core ? "#ffd200" : "rgba(0,210,255,0.95)"
        ctx.lineWidth   = core ? 2.5 : 1.8
        ctx.fill(); ctx.stroke()
        // Centro brillante
        ctx.beginPath(); ctx.arc(x,y, core?3.5:2, 0, Math.PI*2)
        ctx.fillStyle = core ? "#ffd200" : "rgba(0,220,255,1)"
        ctx.fill()
        ctx.restore()

        // ── Nombre del municipio (TODOS) ──────────────────
        const fs = core ? Math.round(h*0.017) : Math.round(h*0.0125)
        ctx.save()
        ctx.font      = `${core?700:500} ${fs}px 'Inter',system-ui,sans-serif`
        ctx.shadowColor = "rgba(0,0,0,1)"
        ctx.shadowBlur  = 5

        if (core) {
          ctx.textAlign = "center"
          ctx.fillStyle = "#ffd200"
          ctx.fillText("Veracruz · CIME", x, y - r - 10)
        } else {
          // Poner etiqueta en el lado menos congestionado
          const isEast = lon > -95.5
          const lx = isEast ? x - r - 5 : x + r + 5
          ctx.textAlign  = isEast ? "right" : "left"
          ctx.fillStyle  = "rgba(150,215,255,0.88)"
          ctx.fillText(name, lx, y + fs*0.35)
        }
        ctx.restore()
      })

      // ── Watermark VERACRUZ ────────────────────────────────
      const [slx,sly] = proj(-96.5, 20.3, w, h)
      ctx.save()
      ctx.font      = `800 ${Math.round(h*0.034)}px 'Inter',system-ui,sans-serif`
      ctx.fillStyle = "rgba(255,255,255,0.028)"
      ctx.textAlign = "center"
      ctx.letterSpacing = "0.18em"
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
      setRecoverMsg("Escribe un correo válido."); return
    }
    setRecoverMsg("Si el correo está registrado, recibirás el enlace en unos minutos.")
  }

  return (
    <div className="login">
      {/* Panel izquierdo — mapa animado */}
      <div className="login-art">
        <canvas id="topo-canvas" ref={canvasRef} aria-hidden="true" />

        {/* Marca — logo con contenedor oscuro que "elimina" el fondo blanco */}
        <div className="brand">
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "radial-gradient(circle, #0c2050 0%, #061030 100%)",
            border: "2.5px solid rgba(0,210,255,0.5)",
            overflow: "hidden", flexShrink: 0,
            boxShadow: "0 0 24px rgba(0,160,255,0.45), 0 0 8px rgba(0,160,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <img
              src="/logo.jpeg"
              alt="CIME"
              style={{
                width: "92%", height: "92%",
                objectFit: "contain",
                mixBlendMode: "screen",
                opacity: 0.95,
              }}
            />
          </div>
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
          {/* Logo CIME centrado — como EMINUS */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <img
              src="/cimelogo.jpeg"
              alt="CIME Veracruz"
              style={{
                width: 120, height: 120,
                objectFit: "contain",
                mixBlendMode: "multiply",
              }}
            />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", letterSpacing: ".04em", color: "var(--fg)" }}>
                CIME VERACRUZ
              </div>
              <div style={{ fontSize: ".8rem", color: "var(--muted)", marginTop: 2 }}>
                Colegio de Ingenieros Mecánicos y Electricistas
              </div>
            </div>
          </div>

          <header style={{ textAlign: "center" }}>
            <span className="eyebrow">Acceso seguro</span>
            {mode === "login"
              ? <h2>Inicio de <b>sesión</b></h2>
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

                <button
                  className="btn primary block" type="submit"
                  style={{ height: 46 }} disabled={loading}
                >
                  {loading ? "Verificando…" : "Entrar al portal →"}
                </button>

                <div style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    className="link-btn"
                    style={{ fontSize: ".85rem", color: "var(--muted)" }}
                    onClick={() => { setMode("recover"); setError("") }}
                  >
                    ¿Problemas para ingresar?
                  </button>
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

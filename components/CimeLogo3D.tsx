"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Logo 3D de CIME Veracruz (renderizado en Blender).
 *
 * - `spin`: muestra el giro lento en loop usando un sprite (120 cuadros, 10 s por vuelta).
 *   Se pausa solo cuando no está en pantalla o la pestaña está oculta, y respeta
 *   `prefers-reduced-motion` (en ese caso queda fijo de frente).
 * - `variant="emblem"`: solo la nube con C·I·M·E, sin la placa VERACRUZ (ideal para tamaños chicos).
 */

const SPRITE = {
  src: "/brand/cime-3d-spin.webp",
  frames: 120,
  cols: 12,
  cellW: 276,
  cellH: 320,
  fps: 12,
}

const ASPECT = { full: SPRITE.cellW / SPRITE.cellH, emblem: 1.0977 }

const STATIC_SRC = {
  full: "/brand/cime-3d.webp",
  emblem: "/brand/cime-3d-emblem.webp",
}

// Una sola descarga del sprite compartida por todas las instancias
let spritePromise: Promise<HTMLImageElement> | null = null
function loadSprite() {
  if (!spritePromise) {
    spritePromise = new Promise((resolve, reject) => {
      const img = new Image()
      img.decoding = "async"
      img.onload = () => resolve(img)
      img.onerror = () => { spritePromise = null; reject(new Error("sprite")) }
      img.src = SPRITE.src
    })
  }
  return spritePromise
}

type Props = {
  /** Alto en px CSS */
  size?: number
  spin?: boolean
  variant?: "full" | "emblem"
  /** Resplandor dorado detrás del logo */
  glow?: boolean
  /** Levitación suave (sube y baja) */
  float?: boolean
  /** Sombra de piso bajo el logo, sincronizada con la levitación */
  shadow?: boolean
  priority?: boolean
  alt?: string
  className?: string
  style?: React.CSSProperties
}

export default function CimeLogo3D({
  size = 120,
  spin = false,
  variant = "full",
  glow = false,
  float = false,
  shadow = false,
  priority = false,
  alt = "CIME Veracruz",
  className,
  style,
}: Props) {
  const canAnimate = spin && variant === "full"
  const width = Math.round(size * ASPECT[variant])
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!canAnimate) return
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reduce.matches) return

    let raf = 0
    let visible = true
    let sprite: HTMLImageElement | null = null
    let lastFrame = -1
    let cancelled = false
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(size * dpr)
    ctx.imageSmoothingQuality = "high"

    const draw = (t: number) => {
      raf = 0
      if (!sprite || !visible || document.hidden) return
      const f = Math.floor((t / 1000) * SPRITE.fps) % SPRITE.frames
      if (f !== lastFrame) {
        lastFrame = f
        const sx = (f % SPRITE.cols) * SPRITE.cellW
        const sy = Math.floor(f / SPRITE.cols) * SPRITE.cellH
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(sprite, sx, sy, SPRITE.cellW, SPRITE.cellH, 0, 0, canvas.width, canvas.height)
      }
      raf = requestAnimationFrame(draw)
    }
    const start = () => { if (!raf && sprite && visible && !document.hidden) raf = requestAnimationFrame(draw) }
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0 }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) start(); else stop()
    }, { rootMargin: "120px" })
    io.observe(wrap)
    const onVis = () => (document.hidden ? stop() : start())
    document.addEventListener("visibilitychange", onVis)

    loadSprite()
      .then(img => {
        if (cancelled) return
        sprite = img
        setReady(true)
        start()
      })
      .catch(() => { /* se queda la imagen fija */ })

    return () => {
      cancelled = true
      stop()
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [canAnimate, size, width])

  return (
    <div
      ref={wrapRef}
      className={className}
      role="img"
      aria-label={alt}
      style={{
        position: "relative",
        width,
        height: size,
        flexShrink: 0,
        userSelect: "none",
        pointerEvents: "none",
        ...style,
      }}
    >
      {glow && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: "-18%",
            background: "radial-gradient(closest-side, rgba(232,192,96,.28), rgba(232,192,96,.08) 55%, transparent 75%)",
            filter: "blur(4px)",
          }}
        />
      )}
      {shadow && <div aria-hidden="true" className={float ? "cime3d-shadow cime3d-shadow--anim" : "cime3d-shadow"} />}
      <div className={float ? "cime3d-float" : undefined} style={{ position: "absolute", inset: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={STATIC_SRC[variant]}
        alt=""
        aria-hidden="true"
        width={width}
        height={size}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "drop-shadow(0 6px 14px rgba(0,0,0,.35))",
          opacity: canAnimate && ready ? 0 : 1,
          transition: "opacity .4s ease",
        }}
      />
      {canAnimate && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            filter: "drop-shadow(0 6px 14px rgba(0,0,0,.35))",
            opacity: ready ? 1 : 0,
            transition: "opacity .4s ease",
          }}
        />
      )}
      </div>
    </div>
  )
}

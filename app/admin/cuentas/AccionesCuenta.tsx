"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, XCircle, CheckCircle2, Trash2, Wand2, Copy, Check, X } from "lucide-react"

function generar() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ", a = "abcdefghijkmnpqrstuvwxyz", d = "23456789", s = "#$%&*@"
  const r = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n
  const k = (x: string) => x[r(x.length)]
  const c = [k(A), k(a), k(d), k(s), ...Array.from({ length: 10 }, () => k(A + a + d))]
  for (let i = c.length - 1; i > 0; i--) { const j = r(i + 1); [c[i], c[j]] = [c[j], c[i]] }
  return c.join("")
}

export default function AccionesCuenta({ id, nombre, correo, activo }: {
  id: string; nombre: string; correo: string; activo: boolean
}) {
  const router = useRouter()
  const [modo, setModo] = useState<null | "clave" | "borrar">(null)
  const [pw, setPw] = useState("")
  const [hecho, setHecho] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function req(method: string, body?: unknown) {
    setBusy(true); setErr(null)
    try {
      const r = await fetch(`/api/admin/cuentas/${id}`, {
        method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined,
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error ?? "No se pudo completar la acción.")
      return true
    } catch (e: any) { setErr(e.message); return false } finally { setBusy(false) }
  }

  async function guardarClave() {
    if (await req("PATCH", { accion: "clave", password: pw })) { setHecho(pw); setModo(null) }
  }
  async function toggle() {
    if (activo && !confirm(`¿Desactivar la cuenta de ${nombre}? No podrá iniciar sesión hasta que se reactive.`)) return
    if (await req("PATCH", { accion: "estado", activo: !activo })) router.refresh()
  }
  async function borrar() {
    if (await req("DELETE")) router.refresh()
  }

  return (
    <div className="cta-wrap">
      {hecho && (
        <div className="cta-panel ok">
          <div className="cta-panel__t">Nueva contraseña de {nombre.replace(/^(Ing\.?|Lic\.?|Dr\.?|Mtro\.?|Mtra\.?)\s*/i, "").split(" ")[0]}</div>
          <div className="cta-pw">
            <code>{hecho}</code>
            <button className="cta-icon" title="Copiar usuario y contraseña" onClick={async () => {
              await navigator.clipboard.writeText(`Usuario: ${correo}\nContraseña: ${hecho}`); setCopiado(true); setTimeout(() => setCopiado(false), 1800)
            }}>{copiado ? <Check size={14} /> : <Copy size={14} />}</button>
          </div>
          <div className="cta-note">Cópiela ahora: no se volverá a mostrar.</div>
          <button className="cta-link" onClick={() => setHecho(null)}>Listo</button>
        </div>
      )}

      {modo === "clave" && (
        <div className="cta-panel">
          <div className="cta-panel__t">Cambiar contraseña</div>
          <div className="cta-pw">
            <input className="input" value={pw} onChange={e => setPw(e.target.value)} placeholder="Mínimo 10 caracteres" autoFocus
              style={{ height: 34, fontFamily: "var(--f-mono)", fontSize: ".82rem" }} />
            <button className="cta-icon" title="Generar contraseña segura" onClick={() => setPw(generar())}><Wand2 size={14} /></button>
          </div>
          <div className="cta-row">
            <button className="btn sm ghost" onClick={() => { setModo(null); setErr(null) }}><X size={13} /> Cancelar</button>
            <button className="btn sm navy" disabled={busy || pw.length < 10} onClick={guardarClave}>{busy ? "Guardando…" : "Guardar"}</button>
          </div>
        </div>
      )}

      {modo === "borrar" && (
        <div className="cta-panel bad">
          <div className="cta-panel__t">¿Eliminar a {nombre}?</div>
          <div className="cta-note">Solo se pueden eliminar cuentas sin pagos, cursos ni expediente. Esta acción no se puede deshacer.</div>
          <div className="cta-row">
            <button className="btn sm ghost" onClick={() => { setModo(null); setErr(null) }}>Cancelar</button>
            <button className="btn sm danger" disabled={busy} onClick={borrar}>{busy ? "Eliminando…" : "Eliminar"}</button>
          </div>
        </div>
      )}

      {err && <div className="cta-err" role="alert">{err}</div>}

      <div className="cta-bar">
        <button className="cta-btn dark" disabled={busy} onClick={() => { setModo("clave"); setPw(generar()); setHecho(null) }}>
          <Lock size={14} strokeWidth={2.2} /> Cambiar clave
        </button>
        {activo
          ? <button className="cta-btn red" disabled={busy} onClick={toggle}><XCircle size={14} strokeWidth={2.2} /> Desactivar</button>
          : <button className="cta-btn green" disabled={busy} onClick={toggle}><CheckCircle2 size={14} strokeWidth={2.2} /> Activar</button>}
        <button className="cta-btn red square" title="Eliminar cuenta" disabled={busy} onClick={() => setModo("borrar")}>
          <Trash2 size={14} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  )
}

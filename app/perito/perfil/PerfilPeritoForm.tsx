"use client"
import { useState } from "react"

interface Usuario {
  nombre: string
  correo: string
  telefono: string | null
  numeroPerito: string | null
}

export default function PerfilPeritoForm({ usuario }: { usuario: Usuario }) {
  const [telefono, setTelefono] = useState(usuario.telefono ?? "")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")
  const [err, setErr] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(""); setErr("")
    if (password && password !== passwordConfirm) { setErr("Las contraseñas no coinciden."); return }
    if (password && password.length < 8) { setErr("La contraseña debe tener al menos 8 caracteres."); return }
    setLoading(true)
    try {
      const body: Record<string, unknown> = { telefono }
      if (password) body.password = password
      const res = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) { setErr("Error al guardar los cambios."); return }
      setMsg("Cambios guardados correctamente.")
      setPassword(""); setPasswordConfirm("")
    } catch {
      setErr("Error de conexión.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid" style={{ gap: 20, maxWidth: 640 }}>

        {/* Datos de contacto */}
        <div className="card">
          <div className="card-h">
            <h2>Datos de contacto</h2>
          </div>
          <div className="card-b" style={{ display: "grid", gap: 16 }}>
            {err && <div className="form-err">{err}</div>}
            {msg && <div className="form-ok">{msg}</div>}

            <div className="field">
              <label>Nombre completo</label>
              <input className="input" type="text" value={usuario.nombre} disabled style={{ opacity: .6 }} />
              <span className="hint">El nombre solo puede ser modificado por el administrador.</span>
            </div>

            <div className="field">
              <label>Correo electrónico</label>
              <input className="input" type="email" value={usuario.correo} disabled style={{ opacity: .6 }} />
              <span className="hint">El correo solo puede ser modificado por el administrador.</span>
            </div>

            <div className="field">
              <label>Teléfono</label>
              <input
                className="input"
                type="tel"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                placeholder="229 000 0000"
              />
            </div>
          </div>
        </div>

        {/* Cambiar contraseña */}
        <div className="card">
          <div className="card-h">
            <h2>Cambiar contraseña</h2>
            <span className="chip nodot">Opcional</span>
          </div>
          <div className="card-b" style={{ display: "grid", gap: 16 }}>
            <div className="form-grid">
              <div className="field">
                <label>Nueva contraseña</label>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                />
              </div>
              <div className="field">
                <label>Confirmar contraseña</label>
                <input
                  className="input"
                  type="password"
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  placeholder="Repite la contraseña"
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="btn primary" type="submit" disabled={loading} style={{ minWidth: 160 }}>
            {loading ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </form>
  )
}

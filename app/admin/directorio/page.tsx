"use client"
import { useState, useEffect, useRef } from "react"

// ─── Types ───────────────────────────────────────────────────────────────────
interface Miembro {
  id: string
  nombre: string
  cargo: string
  area: string
  foto: string | null
  email: string | null
  telefono: string | null
  bio: string | null
  orden: number
  createdAt: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseFoto(raw: string | null): string | null {
  if (!raw) return null
  try { return (JSON.parse(raw) as { url: string }).url } catch { return null }
}

function getInitials(nombre: string) {
  return nombre
    .replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0] ?? "")
    .join("")
    .toUpperCase()
}

function avatarBg(nombre: string) {
  const hue = nombre.charCodeAt(0) % 360
  return `hsl(${(hue * 47) % 360} 38% 34%)`
}

const AREAS = ["Mesa Directiva", "Comité Técnico", "Comisión de Honor", "Secretaría"]

// ─── Miembro card ─────────────────────────────────────────────────────────────
function MiembroCard({ m, onDelete }: { m: Miembro; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false)
  const fotoUrl = parseFoto(m.foto)

  async function handleDelete() {
    if (!confirm(`¿Eliminar a ${m.nombre} del directorio?`)) return
    setDeleting(true)
    await fetch(`/api/admin/directorio/${m.id}`, { method: "DELETE" })
    onDelete(m.id)
  }

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--line)",
      borderRadius: "var(--r-lg)",
      padding: "24px 20px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
      boxShadow: "var(--shadow-sm)",
      position: "relative",
    }}>
      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        aria-label="Eliminar miembro"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "1px solid var(--line)",
          background: "var(--surface-2)",
          color: "var(--bad)",
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
          fontSize: ".8rem",
          transition: "background .15s",
          opacity: deleting ? .5 : 1,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bad-bg)" }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)" }}
      >
        ×
      </button>

      {/* Avatar */}
      {fotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fotoUrl}
          alt={m.nombre}
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            objectFit: "cover",
            border: "3px solid var(--line)",
          }}
        />
      ) : (
        <div style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: avatarBg(m.nombre),
          display: "grid",
          placeItems: "center",
          color: "#fff",
          fontWeight: 700,
          fontSize: "1.5rem",
          letterSpacing: ".05em",
          border: "3px solid var(--line)",
          flexShrink: 0,
        }}>
          {getInitials(m.nombre)}
        </div>
      )}

      {/* Name + cargo */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontWeight: 700,
          fontSize: ".95rem",
          color: "var(--fg)",
          lineHeight: 1.3,
        }}>
          {m.nombre}
        </div>
        <div style={{
          fontSize: ".82rem",
          color: "var(--muted)",
          marginTop: 3,
          lineHeight: 1.3,
        }}>
          {m.cargo}
        </div>
      </div>

      {/* Area chip */}
      <span style={{
        fontFamily: "var(--f-data)",
        fontSize: ".62rem",
        fontWeight: 700,
        letterSpacing: ".08em",
        textTransform: "uppercase",
        padding: "2px 10px",
        borderRadius: 4,
        background: "var(--info-bg)",
        color: "var(--info)",
        border: "1px solid var(--info-ring)",
      }}>
        {m.area}
      </span>

      {/* Contact */}
      {(m.email || m.telefono) && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          alignItems: "center",
          marginTop: 2,
        }}>
          {m.email && (
            <a href={`mailto:${m.email}`} style={{
              fontSize: ".78rem",
              color: "var(--brand)",
              textDecoration: "none",
            }}>
              {m.email}
            </a>
          )}
          {m.telefono && (
            <span style={{ fontSize: ".78rem", color: "var(--muted)" }}>
              {m.telefono}
            </span>
          )}
        </div>
      )}

      {/* Bio */}
      {m.bio && (
        <p style={{
          fontSize: ".8rem",
          color: "var(--fg-2)",
          lineHeight: 1.6,
          textAlign: "center",
          marginTop: 2,
        }}>
          {m.bio}
        </p>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DirectorioAdminPage() {
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")
  const [err, setErr] = useState("")

  const [form, setForm] = useState({
    nombre: "",
    cargo: "",
    area: "Mesa Directiva",
    email: "",
    telefono: "",
    bio: "",
  })
  const [foto, setFoto] = useState<string | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/admin/directorio")
      .then(r => r.json())
      .then(data => { setMiembros(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function setF(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) {
      alert("La foto no puede superar 3 MB.")
      e.target.value = ""
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      setFoto(JSON.stringify({ url, nombre: file.name, tipo: file.type, bytes: file.size }))
      setFotoPreview(url)
    }
    reader.readAsDataURL(file)
  }

  function clearFoto() {
    setFoto(null)
    setFotoPreview(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(""); setMsg("")
    setSaving(true)
    const res = await fetch("/api/admin/directorio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, foto }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setErr(data.error ?? "Error al guardar"); return }
    setMiembros(p => [...p, data])
    setMsg("Miembro agregado correctamente.")
    setForm({ nombre: "", cargo: "", area: "Mesa Directiva", email: "", telefono: "", bio: "" })
    clearFoto()
  }

  function handleDelete(id: string) {
    setMiembros(p => p.filter(m => m.id !== id))
  }

  // Group by area
  const grouped = miembros.reduce<Record<string, Miembro[]>>((acc, m) => {
    if (!acc[m.area]) acc[m.area] = []
    acc[m.area].push(m)
    return acc
  }, {})

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>

      {/* Page header */}
      <div className="page-head" style={{ marginBottom: 32 }}>
        <div>
          <p style={{
            fontFamily: "var(--f-data)",
            fontSize: ".68rem",
            fontWeight: 700,
            letterSpacing: ".15em",
            textTransform: "uppercase",
            color: "var(--muted-2)",
            marginBottom: 6,
          }}>
            Administración · Panel del Colegio
          </p>
          <h1 style={{ fontSize: "1.75rem" }}>Directorio Institucional</h1>
          <p style={{ color: "var(--muted)", fontSize: ".9rem", marginTop: 4 }}>
            Perfil del Consejo Directivo y Mesa Directiva
          </p>
        </div>
        <div style={{
          alignSelf: "flex-start",
          fontFamily: "var(--f-data)",
          fontSize: ".75rem",
          fontWeight: 700,
          letterSpacing: ".04em",
          padding: "5px 12px",
          borderRadius: 4,
          background: "var(--info-bg)",
          color: "var(--info)",
          border: "1px solid var(--info-ring)",
          whiteSpace: "nowrap",
        }}>
          {miembros.length} miembro{miembros.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Miembros grouped by area */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)" }}>Cargando directorio…</div>
      ) : miembros.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "48px 24px",
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r)",
          color: "var(--muted)",
          marginBottom: 32,
        }}>
          Aún no hay miembros en el directorio. Agrega el primero con el formulario de abajo.
        </div>
      ) : (
        <div style={{ marginBottom: 40 }}>
          {Object.entries(grouped).map(([area, items]) => (
            <div key={area} style={{ marginBottom: 32 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}>
                <span style={{
                  fontFamily: "var(--f-data)",
                  fontSize: ".65rem",
                  fontWeight: 700,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  color: "var(--brand)",
                }}>
                  {area}
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 16,
              }}>
                {items.map(m => (
                  <MiembroCard key={m.id} m={m} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add member form */}
      <div className="card">
        <div className="card-h">
          <h2>Agregar miembro al directorio</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card-b" style={{ display: "grid", gap: 16 }}>
            {msg && <div className="form-ok">{msg}</div>}
            {err && <div className="form-err">{err}</div>}

            <div className="form-grid">
              <div className="field">
                <label>Nombre completo *</label>
                <input
                  className="input"
                  value={form.nombre}
                  onChange={e => setF("nombre", e.target.value)}
                  placeholder="Ej. Ing. Juan García Pérez"
                  required
                />
              </div>
              <div className="field">
                <label>Cargo *</label>
                <input
                  className="input"
                  value={form.cargo}
                  onChange={e => setF("cargo", e.target.value)}
                  placeholder="Ej. Presidente"
                  required
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Área</label>
                <select className="input" value={form.area} onChange={e => setF("area", e.target.value)}>
                  {AREAS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Email (opcional)</label>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={e => setF("email", e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Teléfono (opcional)</label>
                <input
                  className="input"
                  value={form.telefono}
                  onChange={e => setF("telefono", e.target.value)}
                  placeholder="229 000 0000"
                />
              </div>
              <div className="field">
                <label>Foto (opcional, máx. 3 MB)</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="input"
                  onChange={handleFoto}
                  style={{ padding: "6px 10px", cursor: "pointer" }}
                />
              </div>
            </div>

            {/* Foto preview */}
            {fotoPreview && (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fotoPreview}
                  alt="Vista previa"
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid var(--line)",
                    flexShrink: 0,
                  }}
                />
                <button
                  type="button"
                  className="btn"
                  onClick={clearFoto}
                  style={{ fontSize: ".82rem" }}
                >
                  Quitar foto
                </button>
              </div>
            )}

            <div className="field">
              <label>Bio / descripción (opcional)</label>
              <textarea
                className="input"
                value={form.bio}
                onChange={e => setF("bio", e.target.value)}
                rows={3}
                placeholder="Breve semblanza profesional del miembro…"
              />
            </div>

            <button className="btn primary block" type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Agregar miembro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

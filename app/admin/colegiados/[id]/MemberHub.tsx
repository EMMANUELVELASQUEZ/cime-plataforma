"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Key, CreditCard, GraduationCap, FileText, User,
  X, ChevronRight, Plus, Award, BookOpen, Printer,
  ClipboardList, AlertTriangle, Info,
} from "lucide-react"
import EditarColegiadoForm from "./EditarColegiadoForm"

// ─── Types ─────────────────────────────────────────────────────────────────
interface CursoData {
  id: string; codigo: string; titulo: string; area: string
  horas: number; modalidad: string; instructor: string
  fechaInicio: string; fechaFin: string
}
interface InscripcionData {
  id: string; progreso: number; estado: string; folio: string | null
  calificacion: number | null; createdAt: string; curso: CursoData
}
interface PagoData {
  id: string; concepto: string; monto: number; estado: string; folio: string; createdAt: string
}
interface EntradaData {
  id: string; tipo: string; titulo: string
  contenido: string | null; autor: string | null; createdAt: string
}
interface ExpedienteData {
  id: string; nombre: string; instrucciones: string | null
  estado: string; entradas: EntradaData[]
}
export interface MemberData {
  id: string; nombre: string; correo: string; telefono: string | null
  numeroColegiado: string | null; especialidad: string | null; ciudad: string | null
  cedula: string | null; estado: string; alta: number; vigencia: string | null
  horas: number; horasMeta: number; createdAt: string
  inscripciones: InscripcionData[]
  pagos: PagoData[]
  expediente: ExpedienteData | null
}
type TabId = "perfil" | "cursos" | "constancias" | "pagos" | "expediente"

// ─── Constants ─────────────────────────────────────────────────────────────
const ESTADOS_COLEGIADO: Record<string, { color: string; bg: string; label: string }> = {
  VIGENTE:     { color: "var(--ok)",   bg: "var(--ok-bg)",   label: "Vigente"     },
  POR_RENOVAR: { color: "var(--warn)", bg: "var(--warn-bg)", label: "Por renovar" },
  SUSPENDIDO:  { color: "var(--bad)",  bg: "var(--bad-bg)",  label: "Suspendido"  },
}
const ESTADOS_INS: Record<string, { color: string; bg: string; label: string }> = {
  INSCRITO:   { color: "var(--info)", bg: "var(--info-bg)", label: "Inscrito"   },
  EN_CURSO:   { color: "var(--warn)", bg: "var(--warn-bg)", label: "En curso"   },
  COMPLETADO: { color: "var(--ok)",   bg: "var(--ok-bg)",   label: "Completado" },
}
const ESTADOS_PAGO: Record<string, { color: string; bg: string; label: string }> = {
  PAGADO:   { color: "var(--ok)",   bg: "var(--ok-bg)",   label: "Pagado"   },
  PENDIENTE:{ color: "var(--warn)", bg: "var(--warn-bg)", label: "Pendiente" },
  VENCIDO:  { color: "var(--bad)",  bg: "var(--bad-bg)",  label: "Vencido"  },
}
const TIPOS_ENTRADA: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  NOTA:        { color: "var(--info)", label: "Nota",        icon: <Info       size={13} /> },
  INSTRUCCION: { color: "var(--warn)", label: "Instrucción", icon: <ClipboardList size={13}/> },
  DOCUMENTO:   { color: "var(--teal)", label: "Documento",   icon: <FileText   size={13} /> },
  OBSERVACION: { color: "var(--muted)",label: "Observación", icon: <BookOpen   size={13} /> },
  REPORTE:     { color: "var(--bad)",  label: "Reporte",     icon: <AlertTriangle size={13}/> },
}
const PALETTE_COLORS = ["#4A90D9","#9b6fe8","#34d399","#f59e0b","#ec4899","#14b8a6","#f97316","#06b6d4"]
function areaHash(a: string) { let h = 0; for (let i = 0; i < a.length; i++) h = (h * 31 + a.charCodeAt(i)) & 0xffff; return h }
function areaColor(a: string) { return PALETTE_COLORS[areaHash(a) % PALETTE_COLORS.length] }

const HUES = [211, 142, 262, 24, 199, 327, 38, 172]
const avatarHue = (n: string) => HUES[(n.charCodeAt(0) ?? 0) % HUES.length]
function initials(name: string) {
  return name.replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "")
    .split(/\s+/).slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase()
}
function fmtCurrency(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
}

// ─── Shared chip ───────────────────────────────────────────────────────────
function Chip({ color, bg, label }: { color: string; bg: string; label: string }) {
  return (
    <span style={{
      fontFamily: "var(--f-data)", fontSize: ".64rem", fontWeight: 700,
      letterSpacing: ".07em", textTransform: "uppercase",
      padding: "2px 8px", borderRadius: 3,
      background: bg, color,
      border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  )
}

// ─── Modal overlay ─────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
      background: "rgba(4,10,20,.65)", backdropFilter: "blur(6px)",
    }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--line)",
        borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-lg)",
        width: "100%", maxWidth: wide ? 640 : 480,
        maxHeight: "90vh", overflow: "auto",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", borderBottom: "1px solid var(--line)",
          background: "var(--surface-2)",
        }}>
          <h2 style={{ fontFamily: "var(--f-display)", fontSize: "1.1rem", fontWeight: 800 }}>
            {title}
          </h2>
          <button onClick={onClose} style={{
            display: "grid", placeItems: "center", width: 32, height: 32,
            borderRadius: 8, color: "var(--muted)",
            transition: "background .15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-3)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}

// ─── Modal: Change Password ─────────────────────────────────────────────────
function PasswordModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [pwd, setPwd] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")
  const [ok, setOk] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr("")
    if (pwd.length < 8) { setErr("Mínimo 8 caracteres"); return }
    if (pwd !== confirm) { setErr("Las contraseñas no coinciden"); return }
    setLoading(true)
    const res = await fetch(`/api/admin/colegiados/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd }),
    })
    setLoading(false)
    if (!res.ok) { setErr("Error al cambiar la contraseña. Intenta de nuevo."); return }
    setOk("Contraseña actualizada correctamente.")
    setTimeout(onClose, 1200)
  }

  return (
    <Modal title="Cambiar contraseña" onClose={onClose}>
      <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
        {err && <div className="form-err">{err}</div>}
        {ok  && <div className="form-ok">{ok}</div>}
        <div className="field">
          <label>Nueva contraseña</label>
          <input className="input" type="password" value={pwd}
            onChange={e => setPwd(e.target.value)} placeholder="Mínimo 8 caracteres" required />
        </div>
        <div className="field">
          <label>Confirmar contraseña</label>
          <input className="input" type="password" value={confirm}
            onChange={e => setConfirm(e.target.value)} placeholder="Repite la contraseña" required />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? "Guardando…" : "Cambiar contraseña"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Modal: Register Payment ────────────────────────────────────────────────
function PaymentModal({ id, onClose }: { id: string; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({ concepto: "", monto: "", estado: "PAGADO", folio: "" })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("")
    if (!form.concepto || !form.monto || !form.folio) { setErr("Completa todos los campos requeridos"); return }
    setLoading(true)
    const res = await fetch(`/api/admin/colegiados/${id}/pago`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, monto: parseFloat(form.monto) }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setErr(data.error ?? "Error al registrar"); return }
    router.refresh(); onClose()
  }

  return (
    <Modal title="Registrar pago / cuota" onClose={onClose}>
      <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
        {err && <div className="form-err">{err}</div>}
        <div className="field">
          <label>Concepto <span style={{ color: "var(--bad)" }}>*</span></label>
          <input className="input" value={form.concepto} onChange={e => set("concepto", e.target.value)}
            placeholder="Ej. Cuota anual 2026" required />
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Monto (MXN) <span style={{ color: "var(--bad)" }}>*</span></label>
            <input className="input" type="number" min="0" step="0.01" value={form.monto}
              onChange={e => set("monto", e.target.value)} placeholder="0.00" required />
          </div>
          <div className="field">
            <label>Estado</label>
            <select className="input" value={form.estado} onChange={e => set("estado", e.target.value)}>
              <option value="PAGADO">Pagado</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="VENCIDO">Vencido</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Folio / Recibo <span style={{ color: "var(--bad)" }}>*</span></label>
          <input className="input" value={form.folio} onChange={e => set("folio", e.target.value)}
            placeholder="Ej. CIME-2026-0001" required />
          <span className="hint">Debe ser único. Puedes usar formato CIME-AÑO-CONSECUTIVO.</span>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? "Registrando…" : "Registrar pago"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Modal: Add Expediente Entry ────────────────────────────────────────────
function ExpedienteModal({ id, onClose }: { id: string; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({ tipo: "NOTA", titulo: "", contenido: "", autor: "Administración CIME" })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("")
    if (!form.titulo) { setErr("El título es requerido"); return }
    setLoading(true)
    const res = await fetch(`/api/admin/colegiados/${id}/expediente`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setErr(data.error ?? "Error al agregar"); return }
    router.refresh(); onClose()
  }

  return (
    <Modal title="Agregar al expediente" onClose={onClose} wide>
      <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
        {err && <div className="form-err">{err}</div>}
        <div className="form-grid">
          <div className="field">
            <label>Tipo de entrada</label>
            <select className="input" value={form.tipo} onChange={e => set("tipo", e.target.value)}>
              <option value="NOTA">Nota</option>
              <option value="INSTRUCCION">Instrucción</option>
              <option value="DOCUMENTO">Documento / Referencia</option>
              <option value="OBSERVACION">Observación</option>
              <option value="REPORTE">Reporte</option>
            </select>
          </div>
          <div className="field">
            <label>Autor</label>
            <input className="input" value={form.autor} onChange={e => set("autor", e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Título <span style={{ color: "var(--bad)" }}>*</span></label>
          <input className="input" value={form.titulo} onChange={e => set("titulo", e.target.value)}
            placeholder="Breve descripción de la entrada" required />
        </div>
        <div className="field">
          <label>Contenido / Detalle</label>
          <textarea className="input" rows={5} value={form.contenido}
            onChange={e => set("contenido", e.target.value)}
            placeholder="Notas, instrucciones, detalles del documento o referencia…"
            style={{ resize: "vertical", lineHeight: 1.6 }} />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? "Guardando…" : "Agregar al expediente"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Tab: Cursos ────────────────────────────────────────────────────────────
function TabCursos({ inscripciones }: { inscripciones: InscripcionData[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [progForm, setProgForm] = useState({ progreso: 0, estado: "EN_CURSO" })
  const [saving, setSaving] = useState(false)

  async function saveProgress(id: string) {
    setSaving(true)
    await fetch(`/api/admin/inscripciones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progreso: progForm.progreso, estado: progForm.estado }),
    })
    setSaving(false); setEditing(null); router.refresh()
  }

  if (inscripciones.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "56px 24px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r)" }}>
        <GraduationCap size={36} strokeWidth={1.5} style={{ color: "var(--muted-2)", margin: "0 auto 16px" }} />
        <p style={{ color: "var(--muted)" }}>Sin inscripciones en cursos</p>
      </div>
    )
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {inscripciones.map(i => {
        const st = ESTADOS_INS[i.estado] ?? ESTADOS_INS.INSCRITO
        const aColor = areaColor(i.curso.area ?? "General")
        const isEditing = editing === i.id
        return (
          <div key={i.id} style={{
            background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: "var(--r)", borderLeft: `3px solid ${aColor}`,
            overflow: "hidden",
          }}>
            <div style={{
              display: "grid", gridTemplateColumns: "minmax(0,1fr) auto",
              gap: 16, padding: "16px 20px", alignItems: "start",
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <Chip color={st.color} bg={st.bg} label={st.label} />
                  <span style={{
                    fontFamily: "var(--f-data)", fontSize: ".63rem", fontWeight: 600,
                    color: aColor, letterSpacing: ".05em",
                  }}>
                    {i.curso.area || "General"} · {i.curso.horas}h
                  </span>
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: ".63rem", color: "var(--muted-2)" }}>
                    {i.curso.codigo}
                  </span>
                </div>
                <h3 style={{
                  fontFamily: "var(--f-display)", fontSize: ".975rem", fontWeight: 800,
                  color: "var(--fg)", lineHeight: 1.3, marginBottom: 4,
                }}>
                  {i.curso.titulo}
                </h3>
                <p style={{ fontSize: ".8rem", color: "var(--muted)" }}>
                  {i.curso.instructor} · {i.curso.modalidad}
                </p>

                {/* Progress bar */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontFamily: "var(--f-data)", fontSize: ".65rem", color: "var(--muted)" }}>Progreso</span>
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: ".7rem", fontWeight: 700, color: i.progreso === 100 ? "var(--ok)" : aColor }}>
                      {i.progreso}%
                    </span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: "var(--surface-3)" }}>
                    <div style={{ height: "100%", borderRadius: 3, width: `${i.progreso}%`, background: aColor, transition: "width .6s ease" }} />
                  </div>
                </div>

                {/* Folio if exists */}
                {i.folio && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Award size={12} strokeWidth={2} style={{ color: "var(--ok)" }} />
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: ".68rem", color: "var(--ok)" }}>
                      Constancia: {i.folio}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                <time style={{ fontFamily: "var(--f-data)", fontSize: ".67rem", color: "var(--muted)", letterSpacing: ".03em" }}>
                  Inscrito {fmtDate(i.createdAt)}
                </time>
                <button
                  className="btn"
                  style={{ fontSize: ".75rem", padding: "5px 12px" }}
                  onClick={() => {
                    setEditing(isEditing ? null : i.id)
                    setProgForm({ progreso: i.progreso, estado: i.estado })
                  }}
                >
                  {isEditing ? "Cancelar" : "Editar"}
                </button>
              </div>
            </div>

            {/* Inline editor */}
            {isEditing && (
              <div style={{
                padding: "14px 20px", borderTop: "1px solid var(--line)",
                background: "var(--surface-2)",
                display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end",
              }}>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: ".75rem" }}>Progreso (%)</label>
                  <input className="input" type="number" min="0" max="100"
                    value={progForm.progreso}
                    onChange={e => setProgForm(p => ({ ...p, progreso: parseInt(e.target.value) || 0 }))}
                    style={{ padding: "7px 10px" }} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: ".75rem" }}>Estado</label>
                  <select className="input" value={progForm.estado}
                    onChange={e => setProgForm(p => ({ ...p, estado: e.target.value }))}
                    style={{ padding: "7px 10px" }}>
                    <option value="INSCRITO">Inscrito</option>
                    <option value="EN_CURSO">En curso</option>
                    <option value="COMPLETADO">Completado</option>
                  </select>
                </div>
                <button className="btn primary" onClick={() => saveProgress(i.id)} disabled={saving}
                  style={{ fontSize: ".8rem", padding: "8px 16px" }}>
                  {saving ? "…" : "Guardar"}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Tab: Constancias ───────────────────────────────────────────────────────
function TabConstancias({ inscripciones }: { inscripciones: InscripcionData[] }) {
  const router = useRouter()
  const completados = inscripciones.filter(i => i.estado === "COMPLETADO")
  const [folioEdit, setFolioEdit] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  async function assignFolio(id: string, folio: string) {
    if (!folio.trim()) return
    setSaving(id)
    await fetch(`/api/admin/inscripciones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folio }),
    })
    setSaving(null); router.refresh()
  }

  if (completados.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "56px 24px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r)" }}>
        <Award size={36} strokeWidth={1.5} style={{ color: "var(--muted-2)", margin: "0 auto 16px" }} />
        <p style={{ color: "var(--muted)" }}>Sin cursos completados — aún no hay constancias por emitir</p>
      </div>
    )
  }

  return (
    <div style={{ display: "grid", gap: 2, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r)", overflow: "hidden" }}>
      {completados.map((i, idx) => {
        const aColor = areaColor(i.curso.area ?? "General")
        const hasConstancia = !!i.folio
        return (
          <div key={i.id} style={{
            display: "grid", gridTemplateColumns: "auto minmax(0,1fr) auto",
            gap: 16, padding: "18px 24px", alignItems: "center",
            borderBottom: idx < completados.length - 1 ? "1px solid var(--line)" : undefined,
            borderLeft: `3px solid ${hasConstancia ? "var(--ok)" : aColor}`,
            background: hasConstancia ? "color-mix(in srgb, var(--surface) 94%, var(--ok-bg))" : "var(--surface)",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "var(--r-sm)", flexShrink: 0,
              display: "grid", placeItems: "center",
              background: hasConstancia ? "var(--ok-bg)" : "var(--surface-2)",
              color: hasConstancia ? "var(--ok)" : "var(--muted)",
            }}>
              <Award size={22} strokeWidth={1.75} />
            </div>

            <div>
              <h3 style={{ fontFamily: "var(--f-display)", fontSize: ".975rem", fontWeight: 800, color: "var(--fg)", marginBottom: 4 }}>
                {i.curso.titulo}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--f-data)", fontSize: ".65rem", color: aColor, fontWeight: 600 }}>
                  {i.curso.area || "General"} · {i.curso.horas}h
                </span>
                <span style={{ fontFamily: "var(--f-data)", fontSize: ".65rem", color: "var(--muted)" }}>
                  Completado {fmtDate(i.createdAt)}
                </span>
                {i.calificacion && (
                  <span style={{ fontFamily: "var(--f-data)", fontSize: ".65rem", fontWeight: 700, color: "var(--ok)" }}>
                    Calif. {i.calificacion.toFixed(1)}
                  </span>
                )}
              </div>

              {/* Folio row */}
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {hasConstancia ? (
                  <>
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: ".7rem", color: "var(--ok)", fontWeight: 700 }}>
                      Folio: {i.folio}
                    </span>
                    <button
                      style={{
                        fontFamily: "var(--f-data)", fontSize: ".62rem", color: "var(--muted)",
                        textDecoration: "underline", cursor: "pointer",
                      }}
                      onClick={() => setFolioEdit(p => ({ ...p, [i.id]: i.folio ?? "" }))}
                    >
                      Cambiar
                    </button>
                  </>
                ) : (
                  <span style={{ fontFamily: "var(--f-data)", fontSize: ".65rem", color: "var(--muted-2)" }}>
                    Sin folio asignado
                  </span>
                )}
              </div>

              {/* Folio editor */}
              {(folioEdit[i.id] !== undefined || (!hasConstancia)) && (
                <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                  <input
                    className="input"
                    style={{ padding: "5px 10px", fontSize: ".8rem", maxWidth: 220 }}
                    value={folioEdit[i.id] ?? ""}
                    onChange={e => setFolioEdit(p => ({ ...p, [i.id]: e.target.value }))}
                    placeholder={`CONSTANCIA-${new Date().getFullYear()}-001`}
                  />
                  <button
                    className="btn primary"
                    style={{ fontSize: ".75rem", padding: "5px 12px" }}
                    disabled={saving === i.id}
                    onClick={() => assignFolio(i.id, folioEdit[i.id] ?? "")}
                  >
                    {saving === i.id ? "…" : hasConstancia ? "Actualizar" : "Asignar"}
                  </button>
                </div>
              )}
            </div>

            {/* Print action */}
            {hasConstancia && (
              <button
                className="btn"
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".78rem" }}
                onClick={() => window.print()}
                title="Imprimir constancia"
              >
                <Printer size={14} strokeWidth={1.75} />
                Imprimir
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Tab: Pagos ─────────────────────────────────────────────────────────────
function TabPagos({ pagos, onAddPago }: { pagos: PagoData[]; onAddPago: () => void }) {
  const totalPagado = pagos.filter(p => p.estado === "PAGADO").reduce((s, p) => s + p.monto, 0)
  const totalPendiente = pagos.filter(p => p.estado !== "PAGADO").reduce((s, p) => s + p.monto, 0)

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "Total pagado", value: fmtCurrency(totalPagado), color: "var(--ok)" },
          { label: "Por cobrar", value: fmtCurrency(totalPendiente), color: "var(--warn)" },
          { label: "Registros", value: String(pagos.length), color: "var(--info)" },
        ].map(k => (
          <div key={k.label} style={{
            padding: "14px 18px", background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: "var(--r)", borderLeft: `3px solid ${k.color}`,
          }}>
            <p style={{ fontFamily: "var(--f-data)", fontSize: ".65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>
              {k.label}
            </p>
            <p style={{ fontFamily: "var(--f-data)", fontSize: "1.3rem", fontWeight: 700, color: k.color }}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r)", overflow: "hidden" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", borderBottom: "1px solid var(--line)", background: "var(--surface-2)",
        }}>
          <span style={{ fontFamily: "var(--f-data)", fontSize: ".7rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)" }}>
            Historial de pagos
          </span>
          <button className="btn primary" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".78rem" }} onClick={onAddPago}>
            <Plus size={14} strokeWidth={2.5} /> Registrar pago
          </button>
        </div>

        {pagos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 24px", color: "var(--muted)" }}>
            Sin pagos registrados
          </div>
        ) : (
          <>
            {/* Header row */}
            <div style={{
              display: "grid", gridTemplateColumns: "minmax(0,2fr) 1fr 1fr minmax(0,1fr)",
              padding: "9px 20px", borderBottom: "1px solid var(--line)", background: "var(--surface-3)",
            }}>
              {["Concepto", "Folio", "Monto", "Estado"].map(h => (
                <span key={h} style={{ fontFamily: "var(--f-data)", fontSize: ".62rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted-2)" }}>
                  {h}
                </span>
              ))}
            </div>
            {pagos.map((p, idx) => {
              const st = ESTADOS_PAGO[p.estado] ?? ESTADOS_PAGO.PENDIENTE
              return (
                <div key={p.id} style={{
                  display: "grid", gridTemplateColumns: "minmax(0,2fr) 1fr 1fr minmax(0,1fr)",
                  padding: "13px 20px", alignItems: "center",
                  borderBottom: idx < pagos.length - 1 ? "1px solid var(--line)" : undefined,
                }}>
                  <div>
                    <p style={{ fontSize: ".87rem", color: "var(--fg)", fontWeight: 500 }}>{p.concepto}</p>
                    <p style={{ fontFamily: "var(--f-data)", fontSize: ".66rem", color: "var(--muted)", marginTop: 2 }}>
                      {fmtDate(p.createdAt)}
                    </p>
                  </div>
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: ".75rem", color: "var(--muted)" }}>{p.folio}</span>
                  <span style={{ fontFamily: "var(--f-data)", fontSize: ".9rem", fontWeight: 700, color: "var(--fg)" }}>
                    {fmtCurrency(p.monto)}
                  </span>
                  <Chip color={st.color} bg={st.bg} label={st.label} />
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Expediente ────────────────────────────────────────────────────────
function TabExpediente({ expediente, onAdd }: { expediente: ExpedienteData | null; onAdd: () => void }) {
  const entradas = expediente?.entradas ?? []

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r)", overflow: "hidden" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", borderBottom: "1px solid var(--line)", background: "var(--surface-2)",
        }}>
          <div>
            <span style={{ fontFamily: "var(--f-data)", fontSize: ".7rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)" }}>
              Expediente administrativo
            </span>
            {expediente?.instrucciones && (
              <p style={{ fontSize: ".8rem", color: "var(--muted)", marginTop: 2 }}>{expediente.instrucciones}</p>
            )}
          </div>
          <button className="btn primary" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".78rem" }} onClick={onAdd}>
            <Plus size={14} strokeWidth={2.5} /> Agregar entrada
          </button>
        </div>

        {entradas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <FileText size={32} strokeWidth={1.5} style={{ color: "var(--muted-2)", margin: "0 auto 12px" }} />
            <p style={{ color: "var(--muted)", fontSize: ".88rem" }}>Sin entradas en el expediente</p>
            <p style={{ color: "var(--muted-2)", fontSize: ".8rem", marginTop: 4 }}>
              Agrega notas, instrucciones, documentos u observaciones internas.
            </p>
          </div>
        ) : (
          <div>
            {entradas.map((e, idx) => {
              const tipo = TIPOS_ENTRADA[e.tipo] ?? TIPOS_ENTRADA.NOTA
              return (
                <div key={e.id} style={{
                  display: "grid", gridTemplateColumns: "auto minmax(0,1fr)",
                  gap: 14, padding: "16px 20px", alignItems: "start",
                  borderBottom: idx < entradas.length - 1 ? "1px solid var(--line)" : undefined,
                  borderLeft: `3px solid ${tipo.color}`,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                    display: "grid", placeItems: "center",
                    background: `color-mix(in srgb, ${tipo.color} 15%, var(--surface-2))`,
                    color: tipo.color,
                  }}>
                    {tipo.icon}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <Chip color={tipo.color} bg={`color-mix(in srgb, ${tipo.color} 12%, var(--surface-2))`} label={tipo.label} />
                      {e.autor && (
                        <span style={{ fontFamily: "var(--f-data)", fontSize: ".63rem", color: "var(--muted)" }}>
                          por {e.autor}
                        </span>
                      )}
                      <time style={{ fontFamily: "var(--f-data)", fontSize: ".63rem", color: "var(--muted-2)", marginLeft: "auto" }}>
                        {fmtDate(e.createdAt)}
                      </time>
                    </div>
                    <p style={{ fontSize: ".88rem", fontWeight: 600, color: "var(--fg)", marginBottom: e.contenido ? 4 : 0 }}>
                      {e.titulo}
                    </p>
                    {e.contenido && (
                      <p style={{ fontSize: ".84rem", color: "var(--fg-2)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                        {e.contenido}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main: MemberHub ────────────────────────────────────────────────────────
export default function MemberHub({ member }: { member: MemberData }) {
  const [tab, setTab] = useState<TabId>("perfil")
  const [pwdModal, setPwdModal] = useState(false)
  const [pagoModal, setPagoModal] = useState(false)
  const [expModal, setExpModal] = useState(false)

  const hue = avatarHue(member.nombre)
  const estadoData = ESTADOS_COLEGIADO[member.estado] ?? ESTADOS_COLEGIADO.VIGENTE
  const pct = Math.min(100, Math.round((member.horas / member.horasMeta) * 100))
  const faltanH = Math.max(0, member.horasMeta - member.horas)
  const cursosActivos = member.inscripciones.filter(i => i.estado !== "COMPLETADO").length
  const cursosCompletados = member.inscripciones.filter(i => i.estado === "COMPLETADO").length
  const totalPagado = member.pagos.filter(p => p.estado === "PAGADO").reduce((s, p) => s + p.monto, 0)

  const TABS: { id: TabId; label: string; badge?: number; icon: React.ReactNode }[] = [
    { id: "perfil",      label: "Perfil",     icon: <User         size={14} /> },
    { id: "cursos",      label: "Cursos",     icon: <GraduationCap size={14} />, badge: member.inscripciones.length || undefined },
    { id: "constancias", label: "Constancias",icon: <Award         size={14} />, badge: cursosCompletados || undefined },
    { id: "pagos",       label: "Pagos",      icon: <CreditCard    size={14} />, badge: member.pagos.length || undefined },
    { id: "expediente",  label: "Expediente", icon: <FileText      size={14} />, badge: member.expediente?.entradas.length || undefined },
  ]

  // Datos para EditarColegiadoForm
  const colegiadoProps = {
    id: member.id, nombre: member.nombre, correo: member.correo,
    numeroColegiado: member.numeroColegiado, especialidad: member.especialidad,
    ciudad: member.ciudad, cedula: member.cedula, telefono: member.telefono,
    estado: member.estado, alta: member.alta, horas: member.horas,
    horasMeta: member.horasMeta, vigencia: member.vigencia,
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>

      {/* ── Back link ──────────────────────────────────────────── */}
      <div>
        <Link href="/admin/colegiados" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontFamily: "var(--f-data)", fontSize: ".78rem", fontWeight: 600,
          color: "var(--muted)", letterSpacing: ".04em", textDecoration: "none",
          transition: "color .15s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--fg)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--muted)" }}
        >
          <ArrowLeft size={14} strokeWidth={2} /> Colegiados
        </Link>
      </div>

      {/* ── Hero card ──────────────────────────────────────────── */}
      <div style={{
        borderRadius: "var(--r-lg)", overflow: "hidden",
        background: "linear-gradient(135deg, #070A24 0%, #0D1540 60%, #0A1230 100%)",
        border: "1px solid rgba(255,255,255,.07)",
        boxShadow: "0 8px 32px rgba(7,10,36,.35)",
      }}>
        {/* Top accent stripe */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #E5D330 0%, #C89B2A 100%)" }} />

        <div style={{
          padding: "28px 32px",
          display: "grid",
          gridTemplateColumns: "auto minmax(0,1fr) auto",
          gap: 24, alignItems: "center",
        }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
            display: "grid", placeItems: "center",
            fontFamily: "var(--f-display)", fontSize: "1.5rem", fontWeight: 700,
            color: "white", border: "2px solid rgba(255,255,255,.12)",
            background: `hsl(${hue} 42% 26%)`,
          }}>
            {initials(member.nombre)}
          </div>

          {/* Identity */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
              <span style={{
                fontFamily: "var(--f-data)", fontSize: ".65rem", fontWeight: 700,
                letterSpacing: ".13em", textTransform: "uppercase", color: "#E5D330",
              }}>
                {member.numeroColegiado ? `CIME-VER-${member.numeroColegiado}` : "Sin número"} · Alta {member.alta}
              </span>
              <span style={{
                fontFamily: "var(--f-data)", fontSize: ".65rem", fontWeight: 700, letterSpacing: ".07em",
                textTransform: "uppercase", padding: "2px 9px", borderRadius: 3,
                background: `color-mix(in srgb, ${estadoData.color} 18%, transparent)`,
                color: estadoData.color,
                border: `1px solid color-mix(in srgb, ${estadoData.color} 35%, transparent)`,
              }}>
                {estadoData.label}
              </span>
            </div>
            <h1 style={{
              fontFamily: "var(--f-display)", fontSize: "1.6rem", fontWeight: 900,
              color: "white", lineHeight: 1.2, marginBottom: 8,
            }}>
              {member.nombre}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
              {[
                member.correo,
                member.especialidad,
                member.ciudad,
                member.telefono,
                member.cedula ? `Céd. ${member.cedula}` : null,
              ].filter(Boolean).map((v, i) => (
                <span key={i} style={{ fontFamily: "var(--f-data)", fontSize: ".76rem", color: "rgba(255,255,255,.52)" }}>
                  {v}
                </span>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <button
              onClick={() => setPwdModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "8px 16px", borderRadius: 6,
                background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)",
                color: "rgba(255,255,255,.75)", fontSize: ".8rem", fontWeight: 500,
                cursor: "pointer", transition: "background .15s, color .15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.14)"; (e.currentTarget as HTMLElement).style.color = "white" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.08)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.75)" }}
            >
              <Key size={14} strokeWidth={1.75} /> Cambiar contraseña
            </button>
            <button
              onClick={() => setPagoModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "8px 16px", borderRadius: 6,
                background: "rgba(229,211,48,.12)", border: "1px solid rgba(229,211,48,.22)",
                color: "#E5D330", fontSize: ".8rem", fontWeight: 600,
                cursor: "pointer", transition: "background .15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(229,211,48,.2)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(229,211,48,.12)" }}
            >
              <CreditCard size={14} strokeWidth={1.75} /> Registrar pago
            </button>
            <button
              onClick={() => setExpModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "8px 16px", borderRadius: 6,
                background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)",
                color: "rgba(255,255,255,.5)", fontSize: ".8rem", fontWeight: 500,
                cursor: "pointer", transition: "background .15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.1)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.05)" }}
            >
              <FileText size={14} strokeWidth={1.75} /> Agregar al expediente
            </button>
          </div>
        </div>

        {/* KPI strip inside hero */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          borderTop: "1px solid rgba(255,255,255,.07)",
        }}>
          {[
            {
              label: "Horas acreditadas",
              value: `${member.horas}h`,
              sub: faltanH > 0 ? `Faltan ${faltanH}h para la meta` : "¡Meta alcanzada!",
              subColor: faltanH > 0 ? "#C89B2A" : "#34d399",
              extra: (
                <div style={{ marginTop: 6, height: 3, borderRadius: 2, background: "rgba(255,255,255,.08)" }}>
                  <div style={{ height: "100%", borderRadius: 2, width: `${pct}%`, background: pct >= 100 ? "#34d399" : "#E5D330" }} />
                </div>
              ),
            },
            {
              label: "Meta anual",
              value: `${member.horasMeta}h`,
              sub: `${pct}% completado`,
              subColor: "rgba(255,255,255,.35)",
            },
            {
              label: "Cursos activos",
              value: String(cursosActivos),
              sub: `${cursosCompletados} completados`,
              subColor: "rgba(255,255,255,.35)",
            },
            {
              label: "Total pagado",
              value: fmtCurrency(totalPagado),
              sub: `${member.pagos.length} registros`,
              subColor: "rgba(255,255,255,.35)",
            },
            {
              label: "Vigencia",
              value: member.vigencia ?? "—",
              sub: member.estado,
              subColor: estadoData.color,
            },
          ].map((k, i, arr) => (
            <div key={k.label} style={{
              padding: "14px 20px",
              borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,.07)" : undefined,
            }}>
              <p style={{ fontFamily: "var(--f-data)", fontSize: ".6rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.32)", marginBottom: 4 }}>
                {k.label}
              </p>
              <p style={{ fontFamily: "var(--f-data)", fontSize: "1.15rem", fontWeight: 700, color: "white", lineHeight: 1 }}>
                {k.value}
              </p>
              <p style={{ fontFamily: "var(--f-data)", fontSize: ".65rem", marginTop: 3, color: k.subColor }}>
                {k.sub}
              </p>
              {k.extra}
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab nav ────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--line)", paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 16px", cursor: "pointer", border: "none",
              fontSize: ".83rem", fontWeight: 600, letterSpacing: ".02em",
              borderRadius: "6px 6px 0 0", transition: "background .12s, color .12s",
              borderBottom: tab === t.id ? "2px solid var(--gold)" : "2px solid transparent",
              marginBottom: -1,
              background: tab === t.id ? "var(--surface)" : "transparent",
              color: tab === t.id ? "var(--fg)" : "var(--muted)",
            }}
          >
            <span style={{ color: tab === t.id ? "var(--brand)" : "var(--muted-2)" }}>{t.icon}</span>
            {t.label}
            {t.badge ? (
              <span style={{
                minWidth: 18, height: 18, padding: "0 5px",
                borderRadius: 10, background: "var(--info-bg)", color: "var(--info)",
                fontFamily: "var(--f-data)", fontSize: ".6rem", fontWeight: 700,
                display: "grid", placeItems: "center",
              }}>
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── Tab content ────────────────────────────────────────── */}
      {tab === "perfil" && (
        <EditarColegiadoForm colegiado={colegiadoProps} />
      )}
      {tab === "cursos" && (
        <TabCursos inscripciones={member.inscripciones} />
      )}
      {tab === "constancias" && (
        <TabConstancias inscripciones={member.inscripciones} />
      )}
      {tab === "pagos" && (
        <TabPagos pagos={member.pagos} onAddPago={() => setPagoModal(true)} />
      )}
      {tab === "expediente" && (
        <TabExpediente expediente={member.expediente} onAdd={() => setExpModal(true)} />
      )}

      {/* ── Modals ─────────────────────────────────────────────── */}
      {pwdModal && <PasswordModal id={member.id} onClose={() => setPwdModal(false)} />}
      {pagoModal && <PaymentModal id={member.id} onClose={() => setPagoModal(false)} />}
      {expModal  && <ExpedienteModal id={member.id} onClose={() => setExpModal(false)} />}
    </div>
  )
}

"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import {
  ChevronLeft, FolderOpen, Archive, ArchiveRestore, Plus,
  FileText, Lightbulb, FileCheck, Eye, Megaphone,
  Trash2, Save, User, Clock, BookOpen, Shield, X, Check,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────
interface Entrada {
  id: string; tipo: string; titulo: string
  contenido: string | null; autor: string | null; createdAt: string | Date
}

interface Expediente {
  id: string; nombre: string; instrucciones: string | null
  estado: string; createdAt: string | Date; entradas: Entrada[]
}

interface UsuarioMin {
  id: string; nombre: string; correo: string
  numeroColegiado: string | null; especialidad: string | null
  estado: string; horas: number; horasMeta: number
  vigencia: string | null; alta: number; ciudad: string | null
}

interface Props {
  usuario:     UsuarioMin
  expediente:  Expediente | null
  adminName:   string
}

// ─── Static config ───────────────────────────────────────────────
const TIPO_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  NOTA:        { label: "Nota",        color: "#2563eb", bg: "rgba(37,99,235,.1)",  border: "rgba(37,99,235,.25)",  icon: <FileText   size={14} strokeWidth={1.75} /> },
  INSTRUCCION: { label: "Instrucción", color: "#7c3aed", bg: "rgba(124,58,237,.1)", border: "rgba(124,58,237,.25)", icon: <Lightbulb  size={14} strokeWidth={1.75} /> },
  DOCUMENTO:   { label: "Documento",   color: "#0891b2", bg: "rgba(8,145,178,.1)",  border: "rgba(8,145,178,.25)",  icon: <FileCheck  size={14} strokeWidth={1.75} /> },
  OBSERVACION: { label: "Observación", color: "#d97706", bg: "rgba(217,119,6,.1)",  border: "rgba(217,119,6,.25)",  icon: <Eye        size={14} strokeWidth={1.75} /> },
  REPORTE:     { label: "Reporte",     color: "#059669", bg: "rgba(5,150,105,.1)",  border: "rgba(5,150,105,.25)",  icon: <Megaphone  size={14} strokeWidth={1.75} /> },
}

const HUES = [211, 142, 262, 24, 199, 327, 38, 172]
function initials(name: string) {
  return name.replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "")
    .split(/\s+/).slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase()
}

const EST_COL: Record<string, string> = {
  VIGENTE: "ok", POR_RENOVAR: "warn", SUSPENDIDO: "bad",
}
const EST_LABEL: Record<string, string> = {
  VIGENTE: "Vigente", POR_RENOVAR: "Por renovar", SUSPENDIDO: "Suspendido",
}

// ─── Component ───────────────────────────────────────────────────
export default function ExpedienteClient({ usuario, expediente: initExp, adminName }: Props) {
  const [exp,       setExp]       = useState<Expediente | null>(initExp)
  const [nombre,    setNombre]    = useState(initExp?.nombre       ?? `Expediente de ${usuario.nombre.split(" ").slice(0, 2).join(" ")}`)
  const [instruc,   setInstruc]   = useState(initExp?.instrucciones ?? "")
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)

  // Entry form
  const [showForm,  setShowForm]  = useState(false)
  const [tipo,      setTipo]      = useState("NOTA")
  const [titulo,    setTitulo]    = useState("")
  const [contenido, setContenido] = useState("")
  const [addingEnt, setAddingEnt] = useState(false)

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const hue = HUES[usuario.nombre.charCodeAt(0) % HUES.length]

  // ── Create expediente ────────────────────────────────────────
  async function handleCreate() {
    if (!nombre.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/expedientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId: usuario.id, nombre: nombre.trim(), instrucciones: instruc.trim() || null }),
      })
      if (res.ok) {
        const data = await res.json()
        setExp(data)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally { setSaving(false) }
  }

  // ── Save expediente changes ──────────────────────────────────
  async function handleSave() {
    if (!exp || !nombre.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/expedientes/${exp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), instrucciones: instruc.trim() || null }),
      })
      if (res.ok) {
        const data = await res.json()
        setExp(data)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally { setSaving(false) }
  }

  // ── Toggle archive ───────────────────────────────────────────
  async function handleToggleArchive() {
    if (!exp) return
    const next = exp.estado === "ACTIVO" ? "ARCHIVADO" : "ACTIVO"
    const res = await fetch(`/api/admin/expedientes/${exp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: next }),
    })
    if (res.ok) setExp(await res.json())
  }

  // ── Add entry ────────────────────────────────────────────────
  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault()
    if (!exp || !titulo.trim()) return
    setAddingEnt(true)
    try {
      const res = await fetch(`/api/admin/expedientes/${exp.id}/entradas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, titulo: titulo.trim(), contenido: contenido.trim() || null }),
      })
      if (res.ok) {
        const entrada = await res.json()
        setExp(prev => prev ? { ...prev, entradas: [entrada, ...prev.entradas] } : prev)
        setTitulo("")
        setContenido("")
        setShowForm(false)
      }
    } finally { setAddingEnt(false) }
  }

  // ── Delete entry ─────────────────────────────────────────────
  async function handleDeleteEntry(entradaId: string) {
    if (!exp) return
    setDeletingId(entradaId)
    try {
      const res = await fetch(`/api/admin/expedientes/${exp.id}/entradas/${entradaId}`, { method: "DELETE" })
      if (res.ok) {
        setExp(prev => prev ? { ...prev, entradas: prev.entradas.filter(en => en.id !== entradaId) } : prev)
      }
    } finally { setDeletingId(null) }
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Back + Header ──────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Link href="/admin/expedientes" className="btn sm ghost" style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <ChevronLeft size={14} strokeWidth={2} /> Expedientes
        </Link>
        <span style={{ color: "var(--muted-2)" }}>/</span>
        <b style={{ fontSize: ".9rem" }}>{usuario.nombre}</b>
      </div>

      {/* ── Colegiado hero card ─────────────────────────────────── */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{
          background: "linear-gradient(135deg, #071526 0%, #0d2647 60%, #071526 100%)",
          padding: "24px 28px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Grid BG */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(100,160,220,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(100,160,220,.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div style={{
              width: 58, height: 58, borderRadius: 15, flexShrink: 0,
              background: `hsl(${hue} 45% 28%)`,
              display: "grid", placeItems: "center",
              border: "2px solid rgba(255,255,255,.12)",
              fontSize: "1.2rem", fontWeight: 800, color: "#fff",
            }}>
              {initials(usuario.nombre)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "rgba(255,255,255,.4)", fontSize: ".65rem", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 4 }}>
                Colegiado — expediente
              </div>
              <h2 style={{ color: "#fff", fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-.02em", margin: 0 }}>
                {usuario.nombre}
              </h2>
              <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
                {[
                  { icon: <Shield size={11} strokeWidth={2.5} />, val: usuario.numeroColegiado ? `CIME-VER-${usuario.numeroColegiado}` : "Sin número" },
                  { icon: <BookOpen size={11} strokeWidth={2.5} />, val: usuario.especialidad ?? "Sin especialidad" },
                  { icon: <User size={11} strokeWidth={2.5} />, val: usuario.ciudad ?? "Sin ciudad" },
                  { icon: <Clock size={11} strokeWidth={2.5} />, val: `Alta ${usuario.alta}` },
                ].map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: ".71rem", color: "rgba(255,255,255,.55)" }}>
                    {p.icon} {p.val}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className={`chip nodot ${EST_COL[usuario.estado] ?? "info"}`}>
                {EST_LABEL[usuario.estado] ?? usuario.estado}
              </span>
              {exp && (
                <button
                  onClick={handleToggleArchive}
                  className="btn sm"
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  {exp.estado === "ACTIVO"
                    ? <><Archive size={13} strokeWidth={1.75} /> Archivar</>
                    : <><ArchiveRestore size={13} strokeWidth={1.75} /> Reactivar</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main two-column layout ──────────────────────────────── */}
      <div className="grid g-dash" style={{ alignItems: "start" }}>

        {/* LEFT: Expediente form ─────────────────────────────── */}
        <div className="stack">
          <div className="card">
            <div className="card-h">
              <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".95rem" }}>
                <FolderOpen size={16} strokeWidth={1.75} style={{ color: "var(--brand)" }} />
                {exp ? "Datos del expediente" : "Crear expediente"}
              </h2>
              {exp && (
                <span className={`chip nodot ${exp.estado === "ACTIVO" ? "ok" : ""}`}>
                  {exp.estado === "ACTIVO" ? "Activo" : "Archivado"}
                </span>
              )}
            </div>
            <div className="card-b" style={{ display: "grid", gap: 16 }}>
              {!exp && (
                <div className="form-ok" style={{ fontSize: ".82rem" }}>
                  Este colegiado aún no tiene expediente. Completa los datos y haz clic en "Crear expediente".
                </div>
              )}

              <div className="field">
                <label>Nombre del expediente <span style={{ color: "var(--bad)" }}>*</span></label>
                <input
                  className="input"
                  placeholder="Ej: Expediente académico 2026"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                />
                <span className="hint">Identificador interno del expediente para este colegiado.</span>
              </div>

              <div className="field">
                <label>Instrucciones / notas generales</label>
                <textarea
                  className="input"
                  rows={5}
                  placeholder="Instrucciones, observaciones generales, notas del expediente..."
                  value={instruc}
                  onChange={e => setInstruc(e.target.value)}
                  style={{ minHeight: 120 }}
                />
                <span className="hint">Visible solo para administradores.</span>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                {saved && (
                  <span className="chip nodot ok" style={{ alignSelf: "center" }}>
                    <Check size={11} /> Guardado
                  </span>
                )}
                <button
                  className="btn primary"
                  disabled={saving || !nombre.trim()}
                  onClick={exp ? handleSave : handleCreate}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  {saving
                    ? "Guardando..."
                    : exp
                      ? <><Save size={14} strokeWidth={2} /> Guardar cambios</>
                      : <><Plus size={14} strokeWidth={2} /> Crear expediente</>
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Metadata card (only when exp exists) */}
          {exp && (
            <div className="card card-b">
              <div style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: 12 }}>
                Información del expediente
              </div>
              <dl className="kv">
                <dt>Creado</dt>
                <dd>{new Date(exp.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</dd>
                <dt>Entradas</dt>
                <dd>{exp.entradas.length}</dd>
                <dt>Estado</dt>
                <dd><span className={`chip nodot ${exp.estado === "ACTIVO" ? "ok" : ""}`}>{exp.estado === "ACTIVO" ? "Activo" : "Archivado"}</span></dd>
                <dt>Horas acreditadas</dt>
                <dd style={{ fontFamily: "var(--f-mono)", fontWeight: 700 }}>{usuario.horas} / {usuario.horasMeta} h</dd>
                {usuario.vigencia && <><dt>Vigencia</dt><dd style={{ fontFamily: "var(--f-mono)" }}>{usuario.vigencia}</dd></>}
              </dl>
            </div>
          )}
        </div>

        {/* RIGHT: Timeline de entradas ──────────────────────────── */}
        <div className="card" style={{ display: exp ? undefined : "none" }}>
          <div className="card-h">
            <h2 style={{ fontSize: ".95rem" }}>Entradas del expediente</h2>
            {exp && (
              <button
                onClick={() => setShowForm(v => !v)}
                className="btn sm primary"
                style={{ display: "flex", alignItems: "center", gap: 5 }}
              >
                {showForm ? <><X size={13} strokeWidth={2} /> Cancelar</> : <><Plus size={13} strokeWidth={2} /> Nueva entrada</>}
              </button>
            )}
          </div>

          {/* Add entry form */}
          {showForm && exp && (
            <form onSubmit={handleAddEntry}
              style={{
                padding: "16px 18px", borderBottom: "1px solid var(--line)",
                background: "var(--surface-2)", display: "grid", gap: 12,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field">
                  <label>Tipo de entrada</label>
                  <select className="input" value={tipo} onChange={e => setTipo(e.target.value)}>
                    {Object.entries(TIPO_CFG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Título <span style={{ color: "var(--bad)" }}>*</span></label>
                  <input className="input" placeholder="Título de la entrada" value={titulo} onChange={e => setTitulo(e.target.value)} required />
                </div>
              </div>
              <div className="field">
                <label>Contenido / descripción</label>
                <textarea className="input" rows={3} placeholder="Detalle, instrucciones o información adicional..." value={contenido} onChange={e => setContenido(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" className="btn sm" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn sm primary" disabled={addingEnt || !titulo.trim()}
                  style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  {addingEnt ? "Agregando..." : <><Plus size={12} strokeWidth={2} /> Agregar entrada</>}
                </button>
              </div>
            </form>
          )}

          {/* Entries list */}
          {exp && (
            exp.entradas.length === 0 ? (
              <div className="empty">
                <FileText size={32} strokeWidth={1.25} />
                <span>Sin entradas aún</span>
                <p style={{ fontSize: ".8rem", marginTop: 4 }}>
                  Agrega la primera entrada usando el botón "Nueva entrada".
                </p>
              </div>
            ) : (
              <div style={{ display: "grid" }}>
                {exp.entradas.map((en, idx) => {
                  const tc = TIPO_CFG[en.tipo] ?? TIPO_CFG.NOTA
                  const isLast = idx === exp.entradas.length - 1
                  return (
                    <div key={en.id} style={{
                      display: "flex", gap: 14, padding: "16px 18px",
                      borderBottom: isLast ? "none" : "1px solid var(--line)",
                      position: "relative",
                    }}>
                      {/* Icon */}
                      <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        background: tc.bg, color: tc.color,
                        border: `1px solid ${tc.border}`,
                        display: "grid", placeItems: "center",
                      }}>
                        {tc.icon}
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", height: 20, padding: "0 8px",
                            borderRadius: 5, fontSize: ".62rem", fontWeight: 700, textTransform: "uppercase",
                            letterSpacing: ".05em", color: tc.color, background: tc.bg, border: `1px solid ${tc.border}`,
                          }}>
                            {tc.label}
                          </span>
                          <span style={{ fontSize: ".7rem", color: "var(--muted)" }}>
                            {new Date(en.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                            {" "}&bull;{" "}
                            {en.autor ?? "Admin"}
                          </span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: ".9rem", marginBottom: en.contenido ? 6 : 0 }}>
                          {en.titulo}
                        </div>
                        {en.contenido && (
                          <div style={{ fontSize: ".83rem", color: "var(--fg-2)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                            {en.contenido}
                          </div>
                        )}
                      </div>
                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteEntry(en.id)}
                        disabled={deletingId === en.id}
                        style={{
                          flexShrink: 0, width: 28, height: 28, borderRadius: 7, display: "grid",
                          placeItems: "center", color: "var(--muted)", background: "none",
                          border: "1px solid transparent", cursor: "pointer", transition: "all .12s",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bad-bg)"; (e.currentTarget as HTMLElement).style.color = "var(--bad)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--bad-ring)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}
                        title="Eliminar entrada"
                      >
                        <Trash2 size={13} strokeWidth={1.75} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          )}
        </div>
      </div>
    </>
  )
}

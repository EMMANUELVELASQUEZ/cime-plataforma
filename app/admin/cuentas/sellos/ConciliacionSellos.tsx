"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Link2, Unlink, UserPlus, FileDown, CheckCheck, Search } from "lucide-react"
import { TesKpi } from "@/components/tesoreria/TesUI"

type Estado = "vinculado" | "sugerido" | "sin-cuenta" | "sin-correo" | "inactivo"

export interface FilaConciliacion {
  selloId: number
  nombre: string
  correo: string | null
  numeroPerito: string | null
  folios: number
  sellados: number
  pendientes: number
  activo: boolean
  estado: Estado
  por?: "correo" | "numero" | "nombre"
  cuenta?: { id: string; nombre: string; correo: string }
}
export interface CuentaLibre { id: string; nombre: string; correo: string; numeroPerito: string | null }

const TAG: Record<Estado, { label: string; cls: string }> = {
  "vinculado":  { label: "Vinculado",         cls: "ok" },
  "sugerido":   { label: "Coincidencia",      cls: "info" },
  "sin-cuenta": { label: "Sin cuenta",        cls: "warn" },
  "sin-correo": { label: "Sin correo",        cls: "bad" },
  "inactivo":   { label: "Inactivo en sellos", cls: "mute" },
}
const POR = { correo: "por correo", numero: "por número de perito", nombre: "por nombre (verificar)" }

const FILTROS: { key: "todos" | Estado; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "vinculado", label: "Vinculados" },
  { key: "sugerido", label: "Coincidencias" },
  { key: "sin-cuenta", label: "Sin cuenta" },
]

export default function ConciliacionSellos({ filas, libres }: { filas: FilaConciliacion[]; libres: CuentaLibre[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ tipo: "ok" | "bad"; texto: string } | null>(null)
  const [filtro, setFiltro] = useState<"todos" | Estado>("todos")
  const [q, setQ] = useState("")
  const [manual, setManual] = useState<Record<number, string>>({})
  const [confirmar, setConfirmar] = useState(false)

  const c = useMemo(() => ({
    vinculado: filas.filter(f => f.estado === "vinculado").length,
    sugerido: filas.filter(f => f.estado === "sugerido").length,
    seguras: filas.filter(f => f.estado === "sugerido" && f.por !== "nombre").length,
    sinCuenta: filas.filter(f => f.estado === "sin-cuenta").length,
    revisar: filas.filter(f => f.estado === "sin-correo" || f.estado === "inactivo").length,
  }), [filas])

  const visibles = filas.filter(f =>
    (filtro === "todos" || f.estado === filtro) &&
    (!q || `${f.nombre} ${f.correo ?? ""} ${f.numeroPerito ?? ""}`.toLowerCase().includes(q.toLowerCase())),
  )

  async function call(key: string, url: string, method: string, body?: unknown) {
    setBusy(key); setMsg(null)
    try {
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error ?? "No se pudo completar la acción.")
      return j
    } catch (e: any) {
      setMsg({ tipo: "bad", texto: e.message }); return null
    } finally { setBusy(null) }
  }

  async function vincular(f: FilaConciliacion, usuarioId: string) {
    if (await call(`v${f.selloId}`, "/api/admin/sellos/vincular", "POST", { usuarioId, selloId: f.selloId })) {
      setMsg({ tipo: "ok", texto: `${f.nombre} quedó vinculado.` }); router.refresh()
    }
  }
  async function desvincular(f: FilaConciliacion) {
    if (!f.cuenta || !confirm(`¿Quitar la vinculación de ${f.nombre}? No se borra ningún dato.`)) return
    if (await call(`d${f.selloId}`, "/api/admin/sellos/vincular", "DELETE", { usuarioId: f.cuenta.id })) {
      setMsg({ tipo: "ok", texto: `Se quitó la vinculación de ${f.nombre}.` }); router.refresh()
    }
  }
  async function vincularSeguras() {
    const j = await call("bulk", "/api/admin/sellos/vincular-sugeridas", "POST")
    if (j) { setMsg({ tipo: "ok", texto: `${j.vinculados} perito${j.vinculados !== 1 ? "s" : ""} vinculado${j.vinculados !== 1 ? "s" : ""} por correo o número.` }); router.refresh() }
  }

  async function crearCuentas(selloIds?: number[]) {
    setConfirmar(false); setBusy("crear"); setMsg(null)
    try {
      const r = await fetch("/api/admin/sellos/crear-cuentas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selloIds ? { selloIds } : {}),
      })
      const tipo = r.headers.get("Content-Type") ?? ""
      if (r.status === 201 && tipo.includes("wordprocessingml")) {
        const blob = await r.blob()
        const nombre = /filename="([^"]+)"/.exec(r.headers.get("Content-Disposition") ?? "")?.[1] ?? "Credenciales_Peritos_CIME.docx"
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob); a.download = nombre; a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 4000)
        const n = r.headers.get("X-Cuentas-Creadas") ?? "?"
        setMsg({ tipo: "ok", texto: `Se crearon ${n} cuenta(s). Se descargó «${nombre}» con los correos y contraseñas; es la única copia, guárdelo en un lugar seguro.` })
        router.refresh()
      } else {
        const j = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(j.error ?? "No se pudieron crear las cuentas.")
        setMsg({ tipo: "bad", texto: `No se creó ninguna cuenta. ${(j.omitidos ?? []).map((o: any) => `${o.nombre}: ${o.motivo}`).join(" · ")}` })
      }
    } catch (e: any) {
      setMsg({ tipo: "bad", texto: e.message })
    } finally { setBusy(null) }
  }

  return (
    <>
      <div className="tes-kpis">
        <TesKpi label="Vinculados"    value={`${c.vinculado} / ${filas.length}`} sub="Cuenta unida con sellos"        tone="ok"   icon={<Link2 size={17} strokeWidth={1.9} />} />
        <TesKpi label="Coincidencias" value={c.sugerido}  sub={`${c.seguras} seguras (correo o número)`}           tone="info" icon={<CheckCheck size={17} strokeWidth={1.9} />} />
        <TesKpi label="Sin cuenta"    value={c.sinCuenta} sub="Se pueden crear con un clic"                         tone={c.sinCuenta ? "warn" : "mute"} icon={<UserPlus size={17} strokeWidth={1.9} />} />
        <TesKpi label="Por revisar"   value={c.revisar}   sub="Sin correo o inactivos en sellos"                    tone={c.revisar ? "bad" : "mute"} icon={<Unlink size={17} strokeWidth={1.9} />} />
      </div>

      {/* Acciones principales */}
      <div className="card" style={{ padding: "16px 18px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <div style={{ flex: "1 1 320px", fontSize: ".84rem", color: "var(--fg-2)" }}>
          <b style={{ color: "var(--fg)" }}>Orden recomendado:</b> 1) vincular las coincidencias seguras, 2) revisar las coincidencias por nombre, 3) crear las cuentas que falten.
        </div>
        <button className="btn navy" disabled={!!busy || c.seguras === 0} onClick={vincularSeguras}>
          <CheckCheck size={15} /> {busy === "bulk" ? "Vinculando…" : `Vincular ${c.seguras} coincidencias seguras`}
        </button>
        <button className="btn gold" disabled={!!busy || c.sinCuenta === 0} onClick={() => setConfirmar(true)}>
          <FileDown size={15} /> {busy === "crear" ? "Creando cuentas…" : `Crear ${c.sinCuenta} cuentas y descargar Word`}
        </button>
      </div>

      {confirmar && (
        <div className="acc-notice" role="alertdialog" aria-label="Confirmar creación de cuentas">
          <UserPlus size={20} style={{ color: "var(--gold-ink)" }} />
          <p>
            Se crearán <b>{c.sinCuenta} cuentas de perito</b> con contraseña temporal y se descargará un Word con los correos y contraseñas.
            Las contraseñas <b>no se pueden volver a consultar</b>: el documento es la única copia.
          </p>
          <button className="btn sm ghost" onClick={() => setConfirmar(false)}>Cancelar</button>
          <button className="btn sm gold" onClick={() => crearCuentas()}>Sí, crear y descargar</button>
        </div>
      )}

      {msg && (
        <div className={`acc-notice ${msg.tipo === "bad" ? "bad" : ""}`} role="status">
          <p style={{ color: msg.tipo === "bad" ? "var(--bad)" : "var(--ok)", fontWeight: 600 }}>{msg.texto}</p>
          <button className="btn sm ghost" onClick={() => setMsg(null)}>Cerrar</button>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="tes-toolbar" style={{ padding: "12px 16px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {FILTROS.map(f => (
              <button key={f.key} onClick={() => setFiltro(f.key)} className="btn sm"
                style={filtro === f.key
                  ? { background: "#E8C060", color: "#0D2060", borderColor: "#E8C060", fontWeight: 700 }
                  : { background: "rgba(255,255,255,.1)", color: "#fff", borderColor: "rgba(255,255,255,.2)" }}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="input-wrap" style={{ marginLeft: "auto", flex: "0 1 280px" }}>
            <Search size={15} style={{ color: "#fff" }} />
            <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar perito…"
              style={{ height: 34, background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.2)" }} />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr className="tes-th">
                <th>Perito en sistema de sellos</th>
                <th style={{ textAlign: "center" }}>Folios</th>
                <th>Estado</th>
                <th>Cuenta en la plataforma</th>
                <th style={{ textAlign: "right" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map(f => (
                <tr key={f.selloId} className="conc-row">
                  <td>
                    <div style={{ fontWeight: 700, color: "var(--fg)" }}>{f.nombre}</div>
                    <div style={{ fontSize: ".75rem", color: "var(--muted)" }}>
                      {f.correo ?? "sin correo"}{f.numeroPerito && <> · <span style={{ color: "var(--gold-ink)", fontWeight: 700 }}>No. {f.numeroPerito}</span></>}
                    </div>
                  </td>
                  <td style={{ textAlign: "center", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    <b>{f.folios}</b>
                    <span style={{ color: "var(--muted)", fontSize: ".72rem" }}> · {f.sellados} sell.{f.pendientes > 0 && <span style={{ color: "var(--bad)" }}> · {f.pendientes} pend.</span>}</span>
                  </td>
                  <td>
                    <span className={`conc-tag ${f.estado === "sugerido" && f.por === "nombre" ? "warn" : TAG[f.estado].cls}`}>{TAG[f.estado].label}</span>
                    {f.por && <div style={{ fontSize: ".68rem", color: "var(--muted)", marginTop: 3 }}>{POR[f.por]}</div>}
                  </td>
                  <td>
                    {f.cuenta ? (
                      <>
                        <div style={{ fontWeight: 600, fontSize: ".85rem" }}>{f.cuenta.nombre}</div>
                        <div style={{ fontSize: ".74rem", color: "var(--muted)" }}>{f.cuenta.correo}</div>
                      </>
                    ) : f.estado === "sin-cuenta" || f.estado === "sin-correo" ? (
                      <select className="input" style={{ height: 32, fontSize: ".8rem", maxWidth: 260 }}
                        value={manual[f.selloId] ?? ""} onChange={e => setManual(m => ({ ...m, [f.selloId]: e.target.value }))}>
                        <option value="">Elegir cuenta existente…</option>
                        {libres.map(l => <option key={l.id} value={l.id}>{l.nombre} — {l.correo}</option>)}
                      </select>
                    ) : <span style={{ color: "var(--muted)", fontSize: ".8rem" }}>—</span>}
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {f.estado === "vinculado" && (
                      <button className="btn sm ghost" disabled={!!busy} onClick={() => desvincular(f)}><Unlink size={13} /> Desvincular</button>
                    )}
                    {f.estado === "sugerido" && f.cuenta && (
                      <button className="btn sm navy" disabled={!!busy} onClick={() => vincular(f, f.cuenta!.id)}><Link2 size={13} /> Vincular</button>
                    )}
                    {(f.estado === "sin-cuenta" || f.estado === "sin-correo") && manual[f.selloId] && (
                      <button className="btn sm navy" disabled={!!busy} onClick={() => vincular(f, manual[f.selloId])}><Link2 size={13} /> Vincular</button>
                    )}
                    {f.estado === "sin-cuenta" && !manual[f.selloId] && (
                      <button className="btn sm gold" disabled={!!busy}
                        onClick={() => confirm(`¿Crear la cuenta de ${f.nombre} (${f.correo})? Se descargará un Word con su contraseña.`) && crearCuentas([f.selloId])}>
                        <UserPlus size={13} /> Crear cuenta
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {visibles.length === 0 && (
                <tr><td colSpan={5}><div className="empty">Ningún perito coincide con el filtro.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

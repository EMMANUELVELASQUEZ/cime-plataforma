import "server-only"
import mysql from "mysql2/promise"

/**
 * Conector de SOLO LECTURA al sistema de sellos (PHP + MySQL en Railway).
 * Variable: SELLOS_DATABASE_URL = mysql://usuario:pass@host:puerto/base
 * Recomendado: un usuario MySQL con permiso SELECT únicamente.
 */

export interface PeritoSellos {
  id: number
  nombre: string
  username: string
  email: string | null
  numeroPerito: string | null
  telefono: string | null
  activo: boolean
  totalFolios: number
  sellados: number
  pagados: number
  pendientes: number
  ultimoRegistro: string | null
}

export type SellosResult =
  | { ok: true; peritos: PeritoSellos[] }
  | { ok: false; reason: "no-config" | "error"; message: string }

const g = globalThis as unknown as { sellosPool?: mysql.Pool }

function pool(): mysql.Pool | null {
  const url = process.env.SELLOS_DATABASE_URL
  if (!url) return null
  if (!g.sellosPool) {
    g.sellosPool = mysql.createPool({
      uri: url,
      connectionLimit: 3,
      connectTimeout: 8000,
      dateStrings: true,
      timezone: "-06:00",
    })
  }
  return g.sellosPool
}

export function sellosConfigurado() {
  return !!process.env.SELLOS_DATABASE_URL
}

export async function listarPeritosSellos(): Promise<SellosResult> {
  const p = pool()
  if (!p) return { ok: false, reason: "no-config", message: "Falta la variable SELLOS_DATABASE_URL." }
  try {
    const [rows] = await p.query<mysql.RowDataPacket[]>(`
      SELECT u.id, u.nombre, u.username, u.email, u.numero_perito, u.telefono, u.activo,
             COUNT(r.id)                                                     AS total_folios,
             COALESCE(SUM(r.sellado), 0)                                     AS sellados,
             COALESCE(SUM(CASE WHEN r.status_pago = 'pagado'    THEN 1 ELSE 0 END), 0) AS pagados,
             COALESCE(SUM(CASE WHEN r.status_pago = 'pendiente' THEN 1 ELSE 0 END), 0) AS pendientes,
             MAX(r.fecha_registro)                                           AS ultimo_registro
      FROM usuarios u
      LEFT JOIN registros r ON r.usuario_id = u.id
      WHERE u.rol_id <> 1
      GROUP BY u.id
      ORDER BY u.nombre
    `)
    return {
      ok: true,
      peritos: rows.map(r => ({
        id:             Number(r.id),
        nombre:         String(r.nombre ?? "").trim(),
        username:       String(r.username ?? ""),
        email:          r.email ? String(r.email).trim().toLowerCase() : null,
        numeroPerito:   r.numero_perito ? String(r.numero_perito).trim() : null,
        telefono:       r.telefono ? String(r.telefono) : null,
        activo:         Number(r.activo) === 1,
        totalFolios:    Number(r.total_folios),
        sellados:       Number(r.sellados),
        pagados:        Number(r.pagados),
        pendientes:     Number(r.pendientes),
        ultimoRegistro: r.ultimo_registro ? String(r.ultimo_registro).slice(0, 10) : null,
      })),
    }
  } catch (e: any) {
    console.error("[sellos] error de conexión:", e?.code ?? e?.message)
    return { ok: false, reason: "error", message: "No se pudo conectar con el sistema de sellos." }
  }
}

export async function obtenerPeritoSellos(id: number): Promise<PeritoSellos | null> {
  const res = await listarPeritosSellos()
  if (!res.ok) return null
  return res.peritos.find(p => p.id === id) ?? null
}

/* ── Conciliación ───────────────────────────────────────────── */

export function normNombre(s: string) {
  return s
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\b(ing|lic|dr|mtro|mtra|arq)\.?\s+/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function normNumero(s: string | null | undefined) {
  if (!s) return ""
  const d = s.replace(/\D/g, "").replace(/^0+/, "")
  return d
}

/** Correo utilizable: el email o, si el username parece correo, el username. */
export function correoDe(p: PeritoSellos): string | null {
  if (p.email && p.email.includes("@")) return p.email
  if (p.username.includes("@")) return p.username.trim().toLowerCase()
  return null
}

export type Coincidencia = "correo" | "numero" | "nombre"

export interface CuentaPlataforma {
  id: string
  nombre: string
  correo: string
  numeroPerito: string | null
  selloUsuarioId: number | null
}

/** Sugiere la cuenta de plataforma que corresponde a un perito de sellos. */
export function sugerir(
  p: PeritoSellos,
  cuentas: CuentaPlataforma[],
): { cuenta: CuentaPlataforma; por: Coincidencia } | null {
  const libres = cuentas.filter(c => c.selloUsuarioId == null)
  const correo = correoDe(p)
  if (correo) {
    const c = libres.find(c => c.correo.toLowerCase() === correo)
    if (c) return { cuenta: c, por: "correo" }
  }
  const num = normNumero(p.numeroPerito)
  if (num) {
    const c = libres.find(c => normNumero(c.numeroPerito) === num)
    if (c) return { cuenta: c, por: "numero" }
  }
  const n = normNombre(p.nombre)
  if (n) {
    const c = libres.find(c => normNombre(c.nombre) === n)
    if (c) return { cuenta: c, por: "nombre" }
  }
  return null
}

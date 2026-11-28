"use client"

import { useState } from "react"
import Link from "next/link"
import { Receipt, Copy, Check, MessageCircle, X } from "lucide-react"

const WA_NUMBER = "522292654241"

export default function ReferenciaPago({ nombre, numero, pendientes, total }: {
  nombre: string
  numero: string | null
  pendientes: { folio: string; concepto: string; monto: number }[]
  total: number
}) {
  const [abierto, setAbierto] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const money = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 })

  const referencia = `CIME-${numero ?? "S/N"}-${pendientes.map(p => p.folio).join("-")}`.slice(0, 60)
  const texto =
    `Referencia de pago CIME Veracruz\n` +
    `Nombre: ${nombre}${numero ? ` (No. ${numero})` : ""}\n` +
    `Referencia: ${referencia}\n` +
    pendientes.map(p => `• ${p.folio} — ${p.concepto}: ${money(p.monto)}`).join("\n") +
    `\nTotal: ${money(total)}`

  return (
    <>
      <button className="btn primary" onClick={() => setAbierto(true)}>
        <Receipt size={15} /> Generar referencia
      </button>

      {abierto && (
        <div role="dialog" aria-modal="true" aria-label="Referencia de pago"
          onClick={e => { if (e.target === e.currentTarget) setAbierto(false) }}
          style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(7,10,36,.55)", display: "grid", placeItems: "center", padding: 16 }}>
          <div className="card" style={{ width: "min(520px, 100%)", padding: 0, overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ background: "linear-gradient(120deg, #0D2060, #1549B8)", color: "#fff", padding: "18px 22px", display: "flex", alignItems: "center", gap: 12 }}>
              <Receipt size={22} style={{ color: "#E8C060" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: ".7rem", letterSpacing: ".08em", textTransform: "uppercase", color: "#E8C060" }}>Referencia de pago</div>
                <div className="mono" style={{ fontWeight: 700, fontSize: ".95rem", wordBreak: "break-all" }}>{referencia}</div>
              </div>
              <button className="btn sm ghost" style={{ color: "#fff" }} onClick={() => setAbierto(false)} aria-label="Cerrar"><X size={16} /></button>
            </div>
            <div style={{ padding: 22, display: "grid", gap: 14 }}>
              <table>
                <tbody>
                  {pendientes.map(p => (
                    <tr key={p.folio}>
                      <td className="mono" style={{ fontSize: ".78rem" }}>{p.folio}</td>
                      <td>{p.concepto}</td>
                      <td className="mono" style={{ textAlign: "right" }}>{money(p.monto)}</td>
                    </tr>
                  ))}
                  <tr><td colSpan={2}><b>Total a pagar</b></td><td className="mono" style={{ textAlign: "right" }}><b>{money(total)}</b></td></tr>
                </tbody>
              </table>
              <p style={{ margin: 0, fontSize: ".82rem", color: "var(--fg-2)" }}>
                Indique esta referencia al realizar su pago y envíe su comprobante a Tesorería por <b>Mensajes</b> o por WhatsApp al <b>229 265 4241</b>.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button className="btn" onClick={async () => { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 1800) }}>
                  {copiado ? <Check size={15} /> : <Copy size={15} />} {copiado ? "Copiado" : "Copiar"}
                </button>
                <a className="btn" href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                <Link className="btn primary" href="/dashboard/mensajes"><MessageCircle size={15} /> Enviar comprobante</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DeleteAvisoButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  async function del() {
    if (!confirm("¿Eliminar este aviso?")) return
    setLoading(true)
    await fetch(`/api/admin/avisos/${id}`, { method: "DELETE" })
    setLoading(false); router.refresh()
  }
  return <button className="btn sm ghost" style={{ color: "var(--bad)" }} onClick={del} disabled={loading}>{loading ? "…" : "Eliminar"}</button>
}

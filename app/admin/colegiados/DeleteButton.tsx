"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DeleteButton({ id, nombre }: { id: string; nombre: string }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    await fetch(`/api/admin/colegiados/${id}`, { method: "DELETE" })
    setLoading(false)
    setConfirm(false)
    router.refresh()
  }

  if (confirm) {
    return (
      <div style={{ display: "flex", gap: 6 }}>
        <button className="btn sm danger" onClick={handleDelete} disabled={loading}>
          {loading ? "…" : "Confirmar"}
        </button>
        <button className="btn sm ghost" onClick={() => setConfirm(false)}>Cancelar</button>
      </div>
    )
  }

  return (
    <button className="btn sm ghost" style={{ color: "var(--bad)" }} onClick={() => setConfirm(true)}>
      Eliminar
    </button>
  )
}

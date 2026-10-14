"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DeleteCursoButton({ id, titulo }: { id: string; titulo: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  async function del() {
    if (!confirm(`¿Eliminar el curso "${titulo}"? Se perderán todas las inscripciones.`)) return
    setLoading(true)
    await fetch(`/api/admin/cursos/${id}`, { method: "DELETE" })
    setLoading(false)
    router.refresh()
  }
  return <button className="btn sm ghost" style={{ color: "var(--bad)" }} onClick={del} disabled={loading}>{loading ? "…" : "Eliminar"}</button>
}

"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function InscribirBtn({ cursoId, titulo }: { cursoId: string; titulo: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function inscribir() {
    if (!confirm(`¿Inscribirte al curso "${titulo}"?`)) return
    setLoading(true)
    const res = await fetch(`/api/cursos/${cursoId}/inscribir`, { method: "POST" })
    setLoading(false)
    if (res.ok) { setDone(true); router.refresh() }
    else alert((await res.json()).error ?? "No se pudo inscribir")
  }

  if (done) return <span className="chip ok nodot">Inscrito</span>
  return (
    <button className="btn sm volt" onClick={inscribir} disabled={loading}>
      {loading ? "…" : "Inscribirme"}
    </button>
  )
}

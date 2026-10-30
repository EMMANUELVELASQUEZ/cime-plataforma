import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import CursoEditorClient from "./CursoEditorClient"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminCursoEditorPage({ params }: { params: { id: string } }) {
  const curso = await prisma.curso.findUnique({
    where: { id: params.id },
    include: {
      modulos: {
        orderBy: { orden: "asc" },
        include: {
          lecciones: {
            orderBy: { orden: "asc" },
            include: { recursos: { orderBy: { orden: "asc" } } },
          },
        },
      },
      inscritos: true,
    },
  })

  if (!curso) notFound()

  return (
    <>
      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Link href="/admin/cursos" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: ".8rem", color: "var(--muted)" }}>
              <ChevronLeft size={14} strokeWidth={2} /> Cursos
            </Link>
          </div>
          <h1>{curso.titulo}</h1>
          <p style={{ marginTop: 4 }}>Editor de contenido · {curso.inscritos.length} inscritos</p>
        </div>
        <span className={`chip nodot ${curso.estado === "ABIERTO" ? "ok" : curso.estado === "EN_CURSO" ? "info" : "teal"}`}>
          {curso.estado.replace("_", " ")}
        </span>
      </div>

      <CursoEditorClient curso={curso as any} cursoId={params.id} />
    </>
  )
}

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import LeccionViewer from "./LeccionViewer"

export const dynamic = "force-dynamic"

export default async function CursoViewerPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { l?: string }
}) {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) redirect("/login")

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
    },
  })

  if (!curso) notFound()

  const inscripcion = await prisma.inscripcionCurso.findUnique({
    where: { usuarioId_cursoId: { usuarioId: userId, cursoId: params.id } },
    include: { leccionesCompletadas: true },
  })

  if (!inscripcion) redirect("/dashboard/cursos")

  const todasLecciones = curso.modulos.flatMap(m => m.lecciones)

  // Determine initial lesson: URL param, first incomplete, or first
  const completadasIds = new Set(inscripcion.leccionesCompletadas.map(lc => lc.leccionId))
  const primeraIncompleta = todasLecciones.find(l => !completadasIds.has(l.id))
  const leccionInicial = searchParams.l
    ? todasLecciones.find(l => l.id === searchParams.l) ?? primeraIncompleta ?? todasLecciones[0]
    : primeraIncompleta ?? todasLecciones[0]

  return (
    <LeccionViewer
      curso={curso as any}
      inscripcionId={inscripcion.id}
      completadasIds={Array.from(completadasIds)}
      leccionInicialId={leccionInicial?.id ?? null}
    />
  )
}

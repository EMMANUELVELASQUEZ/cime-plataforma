import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { messages } = await req.json()
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: "Asistente no configurado" }, { status: 503 })

  const systemPrompt = `Eres el asistente de administración del Portal CIME Veracruz. CIME significa Colegio de Ingenieros Mecánicos y Eléctricos de Veracruz, México.

La plataforma que administras incluye:
- **Colegiados**: ingenieros registrados con estado Vigente, Por Renovar o Suspendido. Pueden subir a cursos y obtener horas de capacitación.
- **Cursos**: cursos de desarrollo profesional con módulos, lecciones y recursos (video, PDF, Word, Excel, imágenes, enlaces).
- **Expedientes**: expediente digital por colegiado con entradas tipo Nota, Instrucción, Documento, Observación y Reporte.
- **Pagos**: cuotas anuales, pagos de cursos y comprobantes.
- **Planes de pago**: planes flexibles que los colegiados pueden solicitar.
- **Avisos**: comunicados oficiales del Consejo Directivo con soporte de imagen.
- **Eventos**: calendario de actividades del colegio.
- **Directorio Institucional**: perfiles del Consejo Directivo y Mesa Directiva.
- **Mis Documentos**: almacén privado de certificados y documentos de la administradora.

Tu función es ayudar a la administradora a:
1. Navegar y usar las funciones de la plataforma
2. Redactar avisos, comunicados y notas profesionales
3. Resolver dudas sobre gestión de ingenieros colegiados
4. Dar recomendaciones de buenas prácticas para colegios de ingenieros
5. Ayudar con cualquier tarea administrativa

Responde siempre en español. Sé profesional, breve y útil. Si la administradora pide redactar algo, hazlo directamente. Usa formato markdown cuando sea útil (listas, negritas).`

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.slice(-20),
        stream: true,
      }),
    })

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.json().catch(() => ({})) as any
      const msg = errBody?.error?.message ?? "Error al contactar Anthropic"
      const status = anthropicRes.status
      let userMsg = msg
      if (msg.includes("credit balance") || msg.includes("too low")) {
        userMsg = "La cuenta de Anthropic no tiene créditos. Ve a console.anthropic.com/settings/billing para recargar."
      } else if (status === 401) {
        userMsg = "La clave de API de Anthropic no es válida."
      } else if (msg.includes("model")) {
        userMsg = "El modelo solicitado no está disponible en esta cuenta."
      }
      return NextResponse.json({ error: userMsg }, { status })
    }

    return new Response(anthropicRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (e) {
    return NextResponse.json({ error: "Error al contactar el asistente" }, { status: 500 })
  }
}

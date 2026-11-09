import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { messages } = await req.json()
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return NextResponse.json({ error: "Asistente no configurado (falta GROQ_API_KEY)" }, { status: 503 })

  const systemPrompt = `Eres el asistente de administración del Portal CIME Veracruz. CIME significa Colegio de Ingenieros Mecánicos y Eléctricos de Veracruz, México.

La plataforma que administras incluye:
- Colegiados: ingenieros registrados con estado Vigente, Por Renovar o Suspendido.
- Cursos: cursos de desarrollo profesional con módulos, lecciones y recursos.
- Expedientes: expediente digital por colegiado.
- Pagos: cuotas anuales, pagos de cursos y comprobantes.
- Planes de pago: planes flexibles que los colegiados pueden solicitar.
- Avisos: comunicados oficiales del Consejo Directivo con soporte de imagen.
- Directorio Institucional: perfiles del Consejo Directivo y Mesa Directiva.
- Mis Documentos: almacén privado de certificados y documentos de la administradora.

Tu función es ayudar a la administradora a:
1. Navegar y usar las funciones de la plataforma
2. Redactar avisos, comunicados y notas profesionales
3. Resolver dudas sobre gestión de ingenieros colegiados
4. Dar recomendaciones de buenas prácticas para colegios de ingenieros
5. Ayudar con cualquier tarea administrativa

Responde siempre en español. Sé profesional, breve y útil. Si la administradora pide redactar algo, hazlo directamente.`

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 1024,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-20),
        ],
      }),
    })

    if (!groqRes.ok) {
      const errBody = await groqRes.json().catch(() => ({})) as any
      const msg = errBody?.error?.message ?? "Error al contactar el asistente"
      return NextResponse.json({ error: msg }, { status: groqRes.status })
    }

    const data = await groqRes.json()
    const content = data.choices?.[0]?.message?.content ?? "Sin respuesta."
    return NextResponse.json({ content })
  } catch {
    return NextResponse.json({ error: "Error de red al contactar el asistente" }, { status: 500 })
  }
}

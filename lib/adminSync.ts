import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

/**
 * Administrador principal del Colegio.
 * El nombre y el cargo son datos públicos de la institución.
 * El correo y la contraseña se leen SOLO de variables de entorno (Railway → Variables):
 *   ADMIN_CORREO, ADMIN_PASSWORD
 */
export const ADMIN_PRINCIPAL = {
  nombre: "Lic. Cristina Araceli Salas Mora",
  cargo:  "Administradora del Colegio · CIME Veracruz",
}

// Cuenta creada por versiones anteriores; se migra a los datos nuevos
const CORREO_ANTERIOR = "administracion@cime-veracruz.mx"

export async function syncAdminPrincipal() {
  // Limpia comillas o saltos de línea que a veces se cuelan al pegar en Railway
  const limpiar = (v?: string) => v?.replace(/^\s+|\s+$/g, "").replace(/^["']|["']$/g, "")
  const correo   = limpiar(process.env.ADMIN_CORREO)?.toLowerCase()
  const password = limpiar(process.env.ADMIN_PASSWORD)
  console.log(`[admin] Revisando administrador principal (ADMIN_CORREO ${correo ? "definido" : "FALTA"}, ADMIN_PASSWORD ${password ? "definido" : "FALTA"})`)

  if (!correo || !password) {
    console.warn("[admin] ADMIN_CORREO / ADMIN_PASSWORD no definidos: no se modifica la cuenta de administración")
    return
  }
  if (password.length < 8) {
    console.error("[admin] ADMIN_PASSWORD debe tener al menos 8 caracteres; no se aplicó el cambio")
    return
  }

  const actual =
    (await prisma.usuario.findUnique({ where: { correo } })) ??
    (await prisma.usuario.findFirst({ where: { correo: CORREO_ANTERIOR, rol: "ADMIN" } })) ??
    (await prisma.usuario.findFirst({ where: { rol: "ADMIN" }, orderBy: { createdAt: "asc" } }))

  if (actual && actual.rol !== "ADMIN") {
    console.error(`[admin] El correo ${correo} ya pertenece a una cuenta que no es de administración; no se aplicó el cambio`)
    return
  }

  if (!actual) {
    await prisma.usuario.create({
      data: {
        nombre: ADMIN_PRINCIPAL.nombre,
        cargo: ADMIN_PRINCIPAL.cargo,
        correo,
        password: await bcrypt.hash(password, 12),
        rol: "ADMIN",
        estado: "VIGENTE",
        numeroColegiado: null,
        ciudad: "Xalapa",
      },
    })
    console.log("[admin] ✓ Administrador principal creado")
    return
  }

  const mismaPassword = await bcrypt.compare(password, actual.password)
  const cambios = {
    ...(actual.nombre !== ADMIN_PRINCIPAL.nombre ? { nombre: ADMIN_PRINCIPAL.nombre } : {}),
    ...(actual.cargo  !== ADMIN_PRINCIPAL.cargo  ? { cargo:  ADMIN_PRINCIPAL.cargo }  : {}),
    ...(actual.correo !== correo ? { correo } : {}),
    ...(!mismaPassword ? { password: await bcrypt.hash(password, 12) } : {}),
  }

  if (Object.keys(cambios).length === 0) {
    console.log("[admin] ✓ Administrador principal al día")
    return
  }
  await prisma.usuario.update({ where: { id: actual.id }, data: cambios })
  console.log(`[admin] ✓ Administrador principal actualizado (${Object.keys(cambios).filter(k => k !== "password").concat(mismaPassword ? [] : ["contraseña"]).join(", ")})`)
}

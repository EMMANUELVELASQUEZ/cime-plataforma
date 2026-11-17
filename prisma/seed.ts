import { PrismaClient, Rol, EstadoColegiado } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const colHash   = await bcrypt.hash("Colegiado@2026", 12)

  // Administrador principal del Colegio (correo y contraseña desde ADMIN_CORREO / ADMIN_PASSWORD)
  const { syncAdminPrincipal } = await import("../lib/adminSync")
  await syncAdminPrincipal()

  // Colegiado de ejemplo para validación interna
  await prisma.usuario.upsert({
    where: { correo: "ing.dominguez@cime-veracruz.mx" },
    update: {},
    create: {
      numeroColegiado: "0001",
      nombre: "Ing. Ricardo Domínguez Lara",
      correo: "ing.dominguez@cime-veracruz.mx",
      password: colHash,
      rol: Rol.COLEGIADO,
      especialidad: "Ingeniería Mecánica Eléctrica",
      ciudad: "Xalapa",
      cedula: "1234567",
      telefono: "229 100 0001",
      estado: EstadoColegiado.VIGENTE,
      alta: 2015,
      vigencia: "31 dic 2026",
      horas: 40,
      horasMeta: 60,
    },
  })

  console.log("✓ Seed completado")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

import { PrismaClient, Rol, EstadoColegiado } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const adminHash = await bcrypt.hash("Admin2026!", 12)
  const colHash = await bcrypt.hash("Cime2026!", 12)

  await prisma.usuario.upsert({
    where: { correo: "administracion@cime-veracruz.mx" },
    update: {},
    create: {
      numeroColegiado: null,
      nombre: "Lic. Andrea Villalobos Cruz",
      correo: "administracion@cime-veracruz.mx",
      password: adminHash,
      rol: Rol.ADMIN,
      estado: EstadoColegiado.VIGENTE,
    },
  })

  await prisma.usuario.upsert({
    where: { correo: "ricardo.dominguez@ejemplo.mx" },
    update: {},
    create: {
      numeroColegiado: "0427",
      nombre: "Ing. Ricardo Domínguez Lara",
      correo: "ricardo.dominguez@ejemplo.mx",
      password: colHash,
      rol: Rol.COLEGIADO,
      especialidad: "Ingeniería Mecánica Eléctrica",
      ciudad: "Boca del Río",
      cedula: "1234567",
      telefono: "229 000 0000",
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

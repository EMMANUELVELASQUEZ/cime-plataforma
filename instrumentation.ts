export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  // Run DB setup in background so the server starts immediately
  setTimeout(async () => {
    try {
      const { execSync } = await import("child_process")

      // Give Railway's internal network 8 seconds to be fully ready
      await new Promise(r => setTimeout(r, 8000))

      // Apply schema to DB
      try {
        execSync("npx prisma migrate deploy", { stdio: "pipe" })
        console.log("[setup] ✓ Migrations applied")
      } catch {
        try {
          execSync("npx prisma db push --accept-data-loss", { stdio: "pipe" })
          console.log("[setup] ✓ Schema pushed")
        } catch (e2) {
          console.error("[setup] Schema sync failed:", e2)
          return
        }
      }

      // Create admin user if no admin exists
      const { prisma } = await import("./lib/prisma")
      const bcrypt = (await import("bcryptjs")).default

      const adminCount = await prisma.usuario.count({ where: { rol: "ADMIN" } })
      if (adminCount === 0) {
        const hash = await bcrypt.hash("CimeVer@2026!", 12)
        await prisma.usuario.create({
          data: {
            nombre: "Administración CIME Veracruz",
            correo: "administracion@cime-veracruz.mx",
            password: hash,
            rol: "ADMIN",
            estado: "VIGENTE",
            numeroColegiado: null,
            telefono: "229 100 0000",
            ciudad: "Xalapa",
          },
        })
        console.log("[setup] ✓ Admin creado: administracion@cime-veracruz.mx")
      } else {
        console.log("[setup] ✓ Admin ya existe")
      }
    } catch (e) {
      console.error("[setup] Error:", e)
    }
  }, 0)
}

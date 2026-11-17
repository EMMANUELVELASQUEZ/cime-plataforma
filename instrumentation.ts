export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  // Run DB setup in background so the server starts immediately
  setTimeout(async () => {
    try {
      const { execSync } = await import(/* webpackIgnore: true */ "child_process")

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

      // Administrador principal: datos desde variables de entorno (nunca en el código)
      const { syncAdminPrincipal } = await import("./lib/adminSync")
      await syncAdminPrincipal()
    } catch (e) {
      console.error("[setup] Error:", e)
    }
  }, 0)
}

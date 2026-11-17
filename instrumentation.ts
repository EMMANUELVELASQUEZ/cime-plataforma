export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  // Tareas de arranque en segundo plano: el servidor responde de inmediato
  setTimeout(async () => {
    // Esperar a que la red interna de Railway esté lista
    await new Promise(r => setTimeout(r, 5000))

    // 1) Administrador principal (independiente del paso de esquema)
    for (let intento = 1; intento <= 5; intento++) {
      try {
        const { syncAdminPrincipal } = await import("./lib/adminSync")
        await syncAdminPrincipal()
        break
      } catch (e) {
        console.error(`[admin] Intento ${intento}/5 falló:`, e instanceof Error ? e.message : e)
        await new Promise(r => setTimeout(r, 5000 * intento))
      }
    }

    // 2) Esquema de la base (el build ya ejecuta `prisma db push`; esto es respaldo)
    try {
      const { execSync } = await import(/* webpackIgnore: true */ "child_process")
      try {
        execSync("npx prisma migrate deploy", { stdio: "pipe" })
        console.log("[setup] ✓ Migrations applied")
      } catch {
        execSync("npx prisma db push --skip-generate", { stdio: "pipe" })
        console.log("[setup] ✓ Schema pushed")
      }
    } catch (e) {
      console.warn("[setup] Sincronización de esquema omitida:", e instanceof Error ? e.message.split("\n")[0] : e)
    }
  }, 0)
}

import Link from "next/link"
import { Link2, ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { listarPeritosSellos, sellosConfigurado, sugerir, correoDe } from "@/lib/sellos"
import { TesHero } from "@/components/tesoreria/TesUI"
import ConciliacionSellos, { type FilaConciliacion, type CuentaLibre } from "./ConciliacionSellos"

export const dynamic = "force-dynamic"

export default async function ConciliacionSellosPage() {
  const res = sellosConfigurado() ? await listarPeritosSellos() : null

  const hero = (
    <TesHero
      eyebrow="Administración · Sistema de sellos"
      title="Conciliación de"
      highlight="peritos"
      sub="Une cada perito del sistema de sellos con su cuenta en la plataforma"
      icon={<Link2 size={26} strokeWidth={1.6} />}
      figure={res?.ok ? res.peritos.length : "—"}
      figureLabel="Peritos en sellos"
    />
  )
  const back = (
    <Link href="/admin/cuentas?tab=peritos" className="btn sm ghost" style={{ marginBottom: 12 }}>
      <ArrowLeft size={14} /> Volver a cuentas
    </Link>
  )

  if (!res || !res.ok) {
    return (
      <>
        {back}{hero}
        <div className="acc-notice bad">
          <Link2 size={20} style={{ color: "var(--bad)" }} />
          <p>
            <b>{!res ? "Sistema de sellos sin conectar." : "No se pudo leer el sistema de sellos."}</b>{" "}
            {!res ? <>Agregue la variable <code>SELLOS_DATABASE_URL</code> en el servicio de Railway de esta plataforma.</> : res.message}
          </p>
        </div>
      </>
    )
  }

  const cuentas = await prisma.usuario.findMany({
    where: { rol: "PERITO" },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, correo: true, numeroPerito: true, selloUsuarioId: true },
  })
  const porSello = new Map(cuentas.filter(c => c.selloUsuarioId != null).map(c => [c.selloUsuarioId!, c]))

  const filas: FilaConciliacion[] = res.peritos.map(p => {
    const base = {
      selloId: p.id, nombre: p.nombre, correo: correoDe(p), numeroPerito: p.numeroPerito,
      folios: p.totalFolios, sellados: p.sellados, pendientes: p.pendientes, activo: p.activo,
    }
    const vinc = porSello.get(p.id)
    if (vinc) return { ...base, estado: "vinculado", cuenta: { id: vinc.id, nombre: vinc.nombre, correo: vinc.correo } }
    const s = sugerir(p, cuentas)
    if (s) return { ...base, estado: "sugerido", por: s.por, cuenta: { id: s.cuenta.id, nombre: s.cuenta.nombre, correo: s.cuenta.correo } }
    if (!p.activo) return { ...base, estado: "inactivo" }
    if (!base.correo) return { ...base, estado: "sin-correo" }
    return { ...base, estado: "sin-cuenta" }
  })

  const libres: CuentaLibre[] = cuentas
    .filter(c => c.selloUsuarioId == null)
    .map(c => ({ id: c.id, nombre: c.nombre, correo: c.correo, numeroPerito: c.numeroPerito }))

  return (
    <>
      {back}{hero}
      <ConciliacionSellos filas={filas} libres={libres} />
    </>
  )
}

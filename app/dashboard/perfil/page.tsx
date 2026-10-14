import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import PerfilForm from "./PerfilForm"

export const dynamic = "force-dynamic"

export default async function PerfilPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id

  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      id: true, nombre: true, correo: true, numeroColegiado: true,
      especialidad: true, ciudad: true, cedula: true, telefono: true,
      estado: true, alta: true, horas: true, horasMeta: true, vigencia: true,
    },
  })

  if (!usuario) return <div className="empty">Sin datos</div>

  function initials(name: string) {
    return name.replace(/^(Ing\.|Lic\.|Dr\.|Mtro\.|Mtra\.)\s*/i, "").split(/\s+/).slice(0, 2).map((w: string) => w[0] ?? "").join("").toUpperCase()
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mi perfil</h1>
          <p>Datos personales y de colegiación registrados en el padrón.</p>
        </div>
      </div>

      <div className="card card-b">
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap", marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--line)" }}>
          <span className="avatar" style={{ width: 72, height: 72, fontSize: "1.3rem", background: `hsl(${(usuario.nombre.charCodeAt(0) ?? 0) * 47 % 360} 38% 34%)` }}>
            {initials(usuario.nombre)}
          </span>
          <div>
            <h2 style={{ fontSize: "1.3rem" }}>{usuario.nombre}</h2>
            <p className="muted">{usuario.correo}</p>
            {usuario.numeroColegiado && <p className="mono muted" style={{ fontSize: ".8rem", marginTop: 4 }}>CIME-VER-{usuario.numeroColegiado}</p>}
          </div>
        </div>
        <dl className="kv" style={{ gridTemplateColumns: "180px minmax(0,1fr)" }}>
          <dt>Especialidad</dt><dd>{usuario.especialidad ?? "—"}</dd>
          <dt>Ciudad</dt><dd>{usuario.ciudad ?? "—"}</dd>
          <dt>Cédula profesional</dt><dd>{usuario.cedula ?? "—"}</dd>
          <dt>Teléfono</dt><dd>{usuario.telefono ?? "—"}</dd>
          <dt>Colegiado desde</dt><dd>{usuario.alta}</dd>
          <dt>Vigencia</dt><dd>{usuario.vigencia ?? "—"}</dd>
          <dt>Horas acreditadas</dt><dd>{usuario.horas} / {usuario.horasMeta} h</dd>
        </dl>
      </div>

      <PerfilForm usuario={usuario} />
    </>
  )
}

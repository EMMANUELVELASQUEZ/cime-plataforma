import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const TIPO_ICON: Record<string, string> = {
  "application/pdf":    "📄",
  "image/jpeg":         "🖼️",
  "image/png":          "🖼️",
  "application/msword": "📝",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📝",
  "application/vnd.ms-excel": "📊",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "📊",
}

const CAT_COLOR: Record<string, string> = {
  "General":        "#6b7280",
  "Reglamentos":    "#0D2060",
  "Avisos":         "#f59e0b",
  "Formatos":       "#10b981",
  "Certificados":   "#8b5cf6",
  "Cursos":         "#3b82f6",
  "Convocatorias":  "#ec4899",
}

function fmtBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function fmtFecha(d: Date) {
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return "Hace un momento"
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} días`
  return d.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" })
}

export default async function DocumentosPeritoPage() {
  const documentos = await prisma.documentoAdmin.findMany({
    orderBy: { createdAt: "desc" },
  })

  const categorias = Array.from(new Set(documentos.map(d => d.categoria))).sort()

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Documentos</h1>
          <p>{documentos.length} documento{documentos.length !== 1 ? "s" : ""} disponibles para peritos.</p>
        </div>
      </div>

      {documentos.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: "80px 24px" }}>
            <svg className="ico lg" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>
            <b>Sin documentos disponibles</b>
            <span>El administrador publicará documentos aquí cuando estén listos.</span>
          </div>
        </div>
      ) : (
        <>
          {/* Category filter tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            {["Todos", ...categorias].map(cat => (
              <span key={cat} style={{
                padding: "6px 14px", borderRadius: 20, fontSize: ".8rem", fontWeight: 500,
                background: cat === "Todos" ? "#0D2060" : "var(--surface-raised)",
                color: cat === "Todos" ? "#fff" : "var(--fg)",
                cursor: "default",
              }}>
                {cat}
                {cat !== "Todos" && (
                  <span style={{ marginLeft: 6, opacity: .6, fontSize: ".75rem" }}>
                    {documentos.filter(d => d.categoria === cat).length}
                  </span>
                )}
              </span>
            ))}
          </div>

          {/* Feed / grid */}
          {categorias.map(cat => {
            const docs = documentos.filter(d => d.categoria === cat)
            if (docs.length === 0) return null
            return (
              <section key={cat} style={{ marginBottom: 32 }}>
                {/* Section header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: CAT_COLOR[cat] ?? "#6b7280" }} />
                  <h2 style={{ margin: 0, fontSize: ".9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>{cat}</h2>
                  <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
                  <span style={{ fontSize: ".8rem", color: "var(--muted)" }}>{docs.length}</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                  {docs.map(doc => {
                    const icon = TIPO_ICON[doc.tipoMime] ?? "📎"
                    const isPdf = doc.tipoMime === "application/pdf"
                    const isImg = doc.tipoMime.startsWith("image/")

                    return (
                      <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <div className="card" style={{
                          padding: 0, overflow: "hidden", cursor: "pointer",
                        }}>
                          {/* Card thumbnail */}
                          <div style={{
                            height: 100, background: isImg ? `url(${doc.url}) center/cover` : `${CAT_COLOR[doc.categoria] ?? "#0D2060"}12`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            position: "relative",
                          }}>
                            {!isImg && (
                              <span style={{ fontSize: 40 }}>{icon}</span>
                            )}
                            <div style={{
                              position: "absolute", top: 8, right: 8,
                              padding: "2px 8px", borderRadius: 4, fontSize: ".7rem", fontWeight: 600,
                              background: CAT_COLOR[doc.categoria] ?? "#0D2060",
                              color: "#fff",
                            }}>
                              {isPdf ? "PDF" : isImg ? "IMG" : doc.tipoMime.split("/")[1]?.toUpperCase() ?? "FILE"}
                            </div>
                          </div>

                          {/* Card body */}
                          <div style={{ padding: "14px 16px 16px" }}>
                            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: ".95rem", lineHeight: 1.3 }}>
                              {doc.nombre}
                            </div>
                            {doc.descripcion && (
                              <p style={{ fontSize: ".82rem", color: "var(--muted)", margin: "0 0 10px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {doc.descripcion}
                              </p>
                            )}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span style={{ fontSize: ".75rem", color: "var(--muted)" }}>
                                {fmtBytes(doc.bytes)}
                              </span>
                              <span style={{ fontSize: ".75rem", color: "var(--muted)" }}>
                                {fmtFecha(new Date(doc.createdAt))}
                              </span>
                            </div>

                            {/* Download hint */}
                            <div style={{
                              marginTop: 12, display: "flex", alignItems: "center", gap: 6,
                              padding: "7px 12px", borderRadius: 6, background: "#0D206010",
                              fontSize: ".8rem", color: "#0D2060", fontWeight: 500,
                            }}>
                              <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
                              Ver / Descargar
                            </div>
                          </div>
                        </div>
                      </a>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </>
      )}
    </>
  )
}

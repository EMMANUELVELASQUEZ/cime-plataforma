import "server-only"
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType, HeadingLevel, Footer, PageNumber,
} from "docx"

export interface Credencial {
  nombre: string
  numeroPerito: string | null
  correo: string
  password: string
}

export interface Omitido {
  nombre: string
  motivo: string
}

const NAVY = "0D2060"
const GOLD = "C89B2A"
const GRAY = "5A6B7D"
const FONT = "Calibri"

const t = (text: string, o: Partial<{ bold: boolean; color: string; size: number; font: string; italics: boolean }> = {}) =>
  new TextRun({ text, font: o.font ?? FONT, size: o.size ?? 20, bold: o.bold, color: o.color, italics: o.italics })

const borde = { style: BorderStyle.SINGLE, size: 4, color: "D0D6DF" }
const bordes = { top: borde, bottom: borde, left: borde, right: borde }

function celda(text: string, o: { header?: boolean; mono?: boolean; width: number; zebra?: boolean }) {
  return new TableCell({
    width: { size: o.width, type: WidthType.DXA },
    borders: bordes,
    shading: o.header
      ? { type: ShadingType.CLEAR, color: "auto", fill: NAVY }
      : o.zebra ? { type: ShadingType.CLEAR, color: "auto", fill: "F3F5F9" } : undefined,
    margins: { top: 90, bottom: 90, left: 110, right: 110 },
    children: [new Paragraph({
      children: [t(text, {
        bold: o.header || o.mono,
        color: o.header ? "FFFFFF" : o.mono ? NAVY : "1A2433",
        size: o.header ? 18 : 19,
        font: o.mono ? "Consolas" : FONT,
      })],
    })],
  })
}

export async function generarDocxCredenciales(opts: {
  credenciales: Credencial[]
  omitidos: Omitido[]
  urlAcceso: string
  generadoPor: string
}): Promise<Buffer> {
  const fecha = new Date().toLocaleString("es-MX", {
    timeZone: "America/Mexico_City", dateStyle: "long", timeStyle: "short",
  })
  const W = [2900, 1150, 3450, 2400] // DXA, total 9900 (A4 con márgenes)

  const tabla = new Table({
    width: { size: 9900, type: WidthType.DXA },
    columnWidths: W,
    rows: [
      new TableRow({
        tableHeader: true,
        children: ["Perito", "No. perito", "Correo (usuario)", "Contraseña temporal"]
          .map((h, i) => celda(h, { header: true, width: W[i] })),
      }),
      ...opts.credenciales.map((c, idx) => new TableRow({
        cantSplit: true,
        children: [
          celda(c.nombre, { width: W[0], zebra: idx % 2 === 1 }),
          celda(c.numeroPerito ?? "—", { width: W[1], zebra: idx % 2 === 1 }),
          celda(c.correo, { width: W[2], zebra: idx % 2 === 1 }),
          celda(c.password, { width: W[3], zebra: idx % 2 === 1, mono: true }),
        ],
      })),
    ],
  })

  const children: (Paragraph | Table)[] = [
    new Paragraph({ children: [t("COLEGIO DE INGENIEROS MECÁNICOS Y ELECTRICISTAS DE VERACRUZ", { bold: true, color: GOLD, size: 17 })] }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 80, after: 60 },
      children: [t("Credenciales de acceso — Peritos", { bold: true, color: NAVY, size: 36 })],
    }),
    new Paragraph({
      spacing: { after: 240 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 6 } },
      children: [t(`Plataforma CIME · Generado el ${fecha} · por ${opts.generadoPor}`, { color: GRAY, size: 18 })],
    }),
    new Paragraph({
      shading: { type: ShadingType.CLEAR, color: "auto", fill: "FDF3DC" },
      border: { left: { style: BorderStyle.SINGLE, size: 24, color: GOLD, space: 8 } },
      spacing: { after: 240 },
      children: [
        t("DOCUMENTO CONFIDENCIAL. ", { bold: true, color: "7A5410" }),
        t("Las contraseñas de este documento son la única copia: la plataforma las guarda cifradas y no puede volver a mostrarlas. Entregue a cada perito únicamente sus propios datos y destruya o resguarde este archivo después de la entrega.", { color: "5C4210", size: 19 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        t(`Cuentas creadas: `, { bold: true, color: NAVY }),
        t(String(opts.credenciales.length), { bold: true }),
        t("     Acceso: ", { bold: true, color: NAVY }),
        t(opts.urlAcceso),
      ],
    }),
    tabla,
    new Paragraph({ spacing: { before: 300, after: 80 }, children: [t("Instrucciones para el perito", { bold: true, color: NAVY, size: 24 })] }),
    ...[
      `Entre a ${opts.urlAcceso}`,
      "Escriba su correo y la contraseña temporal exactamente como aparecen (respetando mayúsculas y símbolos).",
      "Al ingresar, cambie su contraseña desde «Mi perfil».",
      "Sus folios y sellos del sistema de sellos ya están vinculados a esta cuenta.",
    ].map((s, i) => new Paragraph({ spacing: { after: 60 }, children: [t(`${i + 1}.  `, { bold: true, color: GOLD }), t(s)] })),
  ]

  if (opts.omitidos.length) {
    children.push(
      new Paragraph({ spacing: { before: 300, after: 80 }, children: [t("Peritos no procesados (requieren revisión)", { bold: true, color: "B03030", size: 24 })] }),
      ...opts.omitidos.map(o => new Paragraph({
        spacing: { after: 50 },
        children: [t("•  "), t(o.nombre, { bold: true }), t(` — ${o.motivo}`, { color: GRAY })],
      })),
    )
  }

  const doc = new Document({
    creator: "Plataforma CIME Veracruz",
    title: "Credenciales de acceso — Peritos",
    styles: { default: { document: { run: { font: FONT, size: 20 } } } },
    sections: [{
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              t("CIME Veracruz · Confidencial · Página ", { color: GRAY, size: 16 }),
              new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: GRAY }),
            ],
          })],
        }),
      },
      children,
    }],
  })
  return Packer.toBuffer(doc)
}

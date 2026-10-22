import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Portal del Colegiado · CIME Veracruz",
  description: "Plataforma oficial del Colegio de Ingenieros Mecánicos y Electricistas de Veracruz",
  icons: { icon: "/logo.jpeg", apple: "/logo.jpeg" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}

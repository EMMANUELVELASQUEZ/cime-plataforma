import type { Metadata } from "next"
import { Inter, JetBrains_Mono, Playfair_Display, Barlow_Condensed, Montserrat } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "700"],
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["700", "800", "900"],
})

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-barlow",
  display: "swap",
  weight: ["400", "600", "700"],
})

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "Portal del Colegiado · CIME Veracruz",
  description: "Plataforma oficial del Colegio de Ingenieros Mecánicos y Electricistas de Veracruz",
  icons: { icon: "/logo.jpeg", apple: "/logo.jpeg" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrains.variable} ${playfair.variable} ${barlow.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  )
}

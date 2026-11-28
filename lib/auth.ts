import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Colegiado o correo", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier as string
        const password = credentials?.password as string

        if (!identifier || !password) return null

        const usuario = await prisma.usuario.findFirst({
          where: {
            OR: [
              { correo: identifier.toLowerCase() },
              { numeroColegiado: identifier },
            ],
          },
        })

        if (!usuario) return null
        // Cuenta desactivada desde Administración → Cuentas
        if (usuario.estado === "SUSPENDIDO") return null

        const valid = await bcrypt.compare(password, usuario.password)
        if (!valid) return null

        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.correo,
          role: usuario.rol,
          numeroColegiado: usuario.numeroColegiado,
        }
      },
    }),
  ],
})

import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
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
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.numeroColegiado = (user as any).numeroColegiado
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).numeroColegiado = token.numeroColegiado
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
})

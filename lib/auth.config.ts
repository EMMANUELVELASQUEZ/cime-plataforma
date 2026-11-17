import type { NextAuthConfig } from "next-auth"

/**
 * Configuración de Auth.js compatible con Edge (sin Prisma ni bcrypt).
 * La usa el middleware, que solo necesita validar la cookie JWT en cada petición.
 * lib/auth.ts la extiende con el proveedor de credenciales.
 */
export const authConfig = {
  providers: [],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
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
        ;(session.user as any).role = token.role
        ;(session.user as any).numeroColegiado = token.numeroColegiado
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
} satisfies NextAuthConfig

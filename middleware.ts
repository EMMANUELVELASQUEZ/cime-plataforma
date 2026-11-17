import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

// Middleware ligero: solo valida la cookie JWT (sin Prisma ni bcrypt en cada petición)
const { auth } = NextAuth(authConfig)
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith("/login")
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth")

  if (isApiAuth) return NextResponse.next()
  if (isAuthPage) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/", req.nextUrl))
    return NextResponse.next()
  }
  if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.nextUrl))
  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.jpeg$|.*\\.jpg$|.*\\.png$|.*\\.svg$|.*\\.webp$|.*\\.ico$).*)"],
}

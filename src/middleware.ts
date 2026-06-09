import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthRoute = req.nextUrl.pathname.startsWith('/sign-in')
  const isApiRoute = req.nextUrl.pathname.startsWith('/api')

  if (isApiRoute) return NextResponse.next()

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/sign-in', req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

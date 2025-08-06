import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/auth', '/auth/callback'] // rutas que no requieren login

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')?.value // o el nombre que uses

  const isPublic = PUBLIC_PATHS.some((publicPath) => pathname.startsWith(publicPath))

  if (!token) {
    if (!isPublic) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api|static).*)'], // protege todas excepto las públicas
}

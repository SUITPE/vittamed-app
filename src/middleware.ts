import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { isAppRoute, isMarketingRoute, DOMAINS } from '@/lib/config'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'vittasami-dev-secret-key-2024'
)
const COOKIE_NAME = 'vittasami-auth-token'

export async function middleware(request: NextRequest) {
  try {
    const hostname = request.headers.get('host') || ''
    const { pathname } = request.nextUrl

    // ========================================
    // 1. MANEJO DE SUBDOMINIOS (PRODUCCIÓN)
    // ========================================

    // Si viene de app.vittasami.lat
    if (hostname.includes('app.vittasami.lat')) {
      // Redirigir raíz a dashboard
      if (pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // Bloquear acceso a rutas de marketing desde app subdomain
      if (isMarketingRoute(pathname) && pathname !== '/') {
        return NextResponse.redirect(new URL(pathname, DOMAINS.main))
      }
    }

    // Si viene de vittasami.com
    if (hostname.includes('vittasami.com') && !hostname.includes('app.')) {
      // Redirigir rutas de app a subdominio app
      if (isAppRoute(pathname)) {
        return NextResponse.redirect(new URL(pathname, DOMAINS.app))
      }
    }

    // ========================================
    // 2. AUTENTICACIÓN (LÓGICA EXISTENTE)
    // ========================================

    // Get the token from cookies
    const token = request.cookies.get(COOKIE_NAME)?.value

    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/agenda', '/patients', '/appointments', '/my-appointments', '/admin', '/receptionist', '/member']
    const isProtectedRoute = protectedRoutes.some(route =>
      request.nextUrl.pathname.startsWith(route)
    )

    // If accessing protected route without token, redirect to login
    if (isProtectedRoute && !token) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Verify token if present
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET)

        // If authenticated user tries to access auth pages, redirect based on role
        if (request.nextUrl.pathname.startsWith('/auth/')) {
          const role = payload.role as string
          const tenantId = payload.tenantId as string | undefined

          // Redirect based on user role
          if (role === 'super_admin') {
            return NextResponse.redirect(new URL('/admin/global', request.url))
          } else if (role === 'admin_tenant' || role === 'staff' || role === 'receptionist') {
            if (tenantId) {
              return NextResponse.redirect(new URL(`/dashboard/${tenantId}`, request.url))
            } else {
              return NextResponse.redirect(new URL('/dashboard', request.url))
            }
          } else if (role === 'doctor' || role === 'member') {
            return NextResponse.redirect(new URL('/agenda', request.url))
          } else if (role === 'patient') {
            return NextResponse.redirect(new URL('/my-appointments', request.url))
          } else {
            return NextResponse.redirect(new URL('/dashboard', request.url))
          }
        }
      } catch (error) {
        // Token verification failed - clear cookie and redirect if on protected route
        if (isProtectedRoute) {
          const response = NextResponse.redirect(new URL('/auth/login', request.url))
          response.cookies.delete(COOKIE_NAME)
          return response
        }
      }
    }

    // ========================================
    // 3. SECURITY HEADERS (PRODUCCIÓN)
    // ========================================

    const response = NextResponse.next()

    // Security headers para todas las respuestas
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    )

    // Content Security Policy (básico)
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.clarity.ms; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.stripe.com;"
    )

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // Return next response without authentication checks if middleware fails
    const response = NextResponse.next()

    // Incluso en caso de error, agregar security headers básicos
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')

    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
}

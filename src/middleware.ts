import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'vittamed-dev-secret-key-2024'
const COOKIE_NAME = 'vittamed-auth-token'

export async function middleware(request: NextRequest) {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Check if user is authenticated using custom JWT auth
    let user = null
    try {
      // Get custom auth token from cookie
      const token = request.cookies.get(COOKIE_NAME)?.value

      if (token) {
        // Verify JWT token using jose (Edge Runtime compatible)
        const secret = new TextEncoder().encode(JWT_SECRET)
        const { payload } = await jwtVerify(token, secret)
        user = payload ? { id: payload.userId as string, role: payload.role as string, tenantId: payload.tenantId as string | undefined } : null
      }
    } catch (authError) {
      console.error('Error verifying token in middleware:', authError)
      // Continue without authentication check if there's an error
    }

    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/agenda', '/patients', '/appointments', '/my-appointments']
    const isProtectedRoute = protectedRoutes.some(route =>
      request.nextUrl.pathname.startsWith(route)
    )

    // If accessing protected route without authentication, redirect to login
    if (isProtectedRoute && !user) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If authenticated user tries to access auth pages, redirect based on role
    if (user && (request.nextUrl.pathname.startsWith('/auth/'))) {
      // Redirect based on user role from JWT payload
      if (user.role === 'super_admin') {
        return NextResponse.redirect(new URL('/admin/global', request.url))
      } else if (user.role === 'admin_tenant' || user.role === 'staff' || user.role === 'receptionist') {
        if (user.tenantId) {
          return NextResponse.redirect(new URL(`/dashboard/${user.tenantId}`, request.url))
        } else {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } else if (user.role === 'doctor') {
        return NextResponse.redirect(new URL('/agenda', request.url))
      } else if (user.role === 'patient') {
        return NextResponse.redirect(new URL('/my-appointments', request.url))
      } else {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // Return next response without authentication checks if middleware fails
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
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
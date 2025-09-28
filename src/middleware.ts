import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Check if environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase environment variables not available in middleware')
      return response
    }

    // Temporary bypass for auth-bypass sessions in Vercel
    const hasAuthBypassCookie = request.cookies.has('sb-mvvxeqhsatkqtsrulcil-auth-token')
    if (hasAuthBypassCookie && (request.nextUrl.hostname.includes('vercel.app') || process.env.VERCEL)) {
      console.log('🚀 Middleware: Bypassing auth check for auth-bypass session')

      // For authenticated users trying to access auth pages, redirect appropriately
      if (request.nextUrl.pathname.startsWith('/auth/')) {
        const redirectTo = request.nextUrl.searchParams.get('redirectTo')
        if (redirectTo) {
          return NextResponse.redirect(new URL(redirectTo, request.url))
        }
        return NextResponse.redirect(new URL('/dashboard/f47ac10b-58cc-4372-a567-0e02b2c3d479', request.url))
      }

      return response
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Check if user is authenticated for protected routes
    let user = null
    try {
      const { data } = await supabase.auth.getUser()
      user = data.user
    } catch (authError) {
      console.error('Error getting user in middleware:', authError)
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
      try {
        // Get user profile to determine redirect
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role, tenant_id')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'admin_tenant' && profile.tenant_id) {
          return NextResponse.redirect(new URL(`/dashboard/${profile.tenant_id}`, request.url))
        } else if (profile?.role === 'doctor') {
          return NextResponse.redirect(new URL('/agenda', request.url))
        } else if (profile?.role === 'patient') {
          return NextResponse.redirect(new URL('/my-appointments', request.url))
        } else {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } catch (profileError) {
        console.error('Error fetching user profile in middleware:', profileError)
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
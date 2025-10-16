import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type NextRequest, type NextResponse } from 'next/server'

// Validate URL format
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export async function createClient() {
  const defaultUrl = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
  const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzk2NzcsImV4cCI6MjA3Mzc1NTY3N30.-LxDF04CO66mJrg4rVpHHJLmNnTgNu_lFyfL-qZKsdw'

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || defaultUrl
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || defaultKey

  // Validate URL format
  if (!isValidUrl(supabaseUrl)) {
    console.warn('Server: Invalid Supabase URL detected, using default')
    supabaseUrl = defaultUrl
  }

  // Validate key format
  if (!supabaseAnonKey || supabaseAnonKey.length < 100 || !supabaseAnonKey.includes('.')) {
    console.warn('Server: Invalid Supabase key detected, using default')
    supabaseAnonKey = defaultKey
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        async getAll() {
          const cookieStore = await cookies()
          return cookieStore.getAll()
        },
        async setAll(cookiesToSet) {
          try {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// For middleware
export async function createMiddlewareClient(
  request: NextRequest,
  response: NextResponse
) {
  const defaultUrl = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
  const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzk2NzcsImV4cCI6MjA3Mzc1NTY3N30.-LxDF04CO66mJrg4rVpHHJLmNnTgNu_lFyfL-qZKsdw'

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || defaultUrl
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || defaultKey

  // Validate in middleware
  if (!isValidUrl(supabaseUrl)) {
    supabaseUrl = defaultUrl
  }
  if (!supabaseAnonKey || supabaseAnonKey.length < 100) {
    supabaseAnonKey = defaultKey
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
}

// Create admin client with service role (bypasses RLS)
export async function createAdminClient() {
  const defaultUrl = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || defaultUrl

  // Create client with service role key (bypasses RLS)
  return createServerClient(
    supabaseUrl,
    serviceRoleKey,
    {
      cookies: {
        async getAll() {
          const cookieStore = await cookies()
          return cookieStore.getAll()
        },
        async setAll(cookiesToSet) {
          try {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Ignore if called from Server Component
          }
        },
      },
    }
  )
}

// Export alias for API routes
export const getSupabaseServerClient = createClient
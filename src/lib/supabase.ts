import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import './fetch-wrapper' // Import fetch wrapper for debugging

// Validate URL format
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Get environment variables with validation
function getSupabaseConfig() {
  const defaultUrl = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
  const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzk2NzcsImV4cCI6MjA3Mzc1NTY3N30.-LxDF04CO66mJrg4rVpHHJLmNnTgNu_lFyfL-qZKsdw'

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || defaultUrl
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || defaultKey

  // Validate URL format
  if (!isValidUrl(supabaseUrl)) {
    console.warn('Invalid Supabase URL detected, using default')
    supabaseUrl = defaultUrl
  }

  // Validate key format (should be a JWT-like string)
  if (!supabaseAnonKey || supabaseAnonKey.length < 100 || !supabaseAnonKey.includes('.')) {
    console.warn('Invalid Supabase key detected, using default')
    supabaseAnonKey = defaultKey
  }

  return { supabaseUrl, supabaseAnonKey }
}

const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()

// Log configuration in development for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('Supabase Config:', {
    url: supabaseUrl,
    keyPrefix: supabaseAnonKey.substring(0, 20) + '...',
    keyLength: supabaseAnonKey.length
  })
}

// Log final configuration for debugging
console.log('🔧 Supabase Client Initialization:', {
  url: supabaseUrl,
  keyPrefix: supabaseAnonKey.substring(0, 20) + '...',
  urlValid: isValidUrl(supabaseUrl),
  keyValid: supabaseAnonKey.length > 100,
  timestamp: new Date().toISOString()
})

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-client-info': 'vittamed@1.0.0'
    }
  }
})

export function createClient() {
  // Enhanced client creation with better error handling
  try {
    console.log('🚀 Creating Supabase browser client with:', {
      url: supabaseUrl,
      keyLength: supabaseAnonKey.length,
      isProduction: typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    })

    const client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'x-client-info': 'vittamed-browser@1.0.0'
        }
      }
    })

    console.log('✅ Supabase browser client created successfully')
    return client

  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error)
    throw new Error(`Supabase client creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
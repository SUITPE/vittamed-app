import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import './fetch-wrapper' // Import fetch wrapper for debugging
import { debugSupabaseAuth } from './supabase-auth-debug' // Import auth debugging

// Enable auth debugging in browser
if (typeof window !== 'undefined') {
  debugSupabaseAuth()
}

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

  // Enhanced URL validation and cleaning
  if (!isValidUrl(supabaseUrl)) {
    console.warn('Invalid Supabase URL detected, using default')
    supabaseUrl = defaultUrl
  }

  // Remove trailing slash if present (this can cause issues)
  supabaseUrl = supabaseUrl.replace(/\/$/, '')

  // Ensure URL ends with supabase.co (validate it's a real Supabase URL)
  if (!supabaseUrl.includes('supabase.co')) {
    console.warn('URL does not appear to be a valid Supabase URL, using default')
    supabaseUrl = defaultUrl
  }

  // Validate key format (should be a JWT-like string)
  if (!supabaseAnonKey || supabaseAnonKey.length < 100 || !supabaseAnonKey.includes('.')) {
    console.warn('Invalid Supabase key detected, using default')
    supabaseAnonKey = defaultKey
  }

  // Additional debugging for production
  console.log('🔧 Final Supabase configuration:', {
    url: supabaseUrl,
    urlLength: supabaseUrl.length,
    hasProtocol: supabaseUrl.startsWith('https://'),
    endsWithSupabase: supabaseUrl.includes('supabase.co'),
    keyLength: supabaseAnonKey.length,
    keyIsJWT: supabaseAnonKey.includes('.') && supabaseAnonKey.split('.').length === 3
  })

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
      'x-client-info': 'vittasami@1.0.0'
    }
  }
})

export function createClient() {
  // Enhanced client creation with better error handling
  try {
    // Force explicit values to prevent undefined issues
    const cleanUrl = supabaseUrl || 'https://mvvxeqhsatkqtsrulcil.supabase.co'
    const cleanKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzk2NzcsImV4cCI6MjA3Mzc1NTY3N30.-LxDF04CO66mJrg4rVpHHJLmNnTgNu_lFyfL-qZKsdw'

    console.log('🚀 Creating Supabase browser client with:', {
      url: cleanUrl,
      keyLength: cleanKey.length,
      isProduction: typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    })

    // Create with minimal configuration to avoid undefined values
    const client = createBrowserClient(cleanUrl, cleanKey, {
      auth: {
        autoRefreshToken: false, // Disable to prevent additional requests that might fail
        persistSession: false,   // Disable to avoid localStorage issues
        detectSessionInUrl: false, // Disable URL detection that might cause issues
        flowType: 'implicit'     // Use implicit flow which is simpler
      },
      global: {
        headers: {
          'x-client-info': 'vittasami-browser@1.0.0',
          'apikey': cleanKey  // Explicitly set the API key header
        },
        fetch: globalThis.fetch // Use our wrapped fetch explicitly
      }
    })

    console.log('✅ Supabase browser client created successfully')
    return client

  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error)
    throw new Error(`Supabase client creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
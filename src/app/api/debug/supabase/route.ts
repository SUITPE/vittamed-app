import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check environment variables
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'NOT_SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
      VERCEL: process.env.VERCEL || 'NOT_SET',
    }

    // Check URL validity
    const defaultUrl = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
    const url = envVars.NEXT_PUBLIC_SUPABASE_URL === 'NOT_SET' ? defaultUrl : envVars.NEXT_PUBLIC_SUPABASE_URL

    let urlValid = false
    try {
      new URL(url)
      urlValid = true
    } catch {
      urlValid = false
    }

    // Check key validity
    const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzk2NzcsImV4cCI6MjA3Mzc1NTY3N30.-LxDF04CO66mJrg4rVpHHJLmNnTgNu_lFyfL-qZKsdw'
    const key = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'NOT_SET' ? defaultKey : envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const keyValid = key && key.length > 100 && key.includes('.')

    // Test actual Supabase connection
    let connectionTest = 'FAILED'
    let connectionError = ''

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(url, key)

      // Try a simple operation
      const { error } = await supabase.from('tenants').select('count').limit(1)
      if (error) {
        connectionError = error.message
      } else {
        connectionTest = 'SUCCESS'
      }
    } catch (error) {
      connectionError = error instanceof Error ? error.message : 'Unknown error'
    }

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        ...envVars,
        // Mask sensitive data for security
        NEXT_PUBLIC_SUPABASE_ANON_KEY: envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'NOT_SET'
          ? 'NOT_SET'
          : envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...'
      },
      validation: {
        urlProvided: envVars.NEXT_PUBLIC_SUPABASE_URL !== 'NOT_SET',
        keyProvided: envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'NOT_SET',
        urlValid,
        keyValid,
        urlUsed: url,
        keyLength: key.length
      },
      connection: {
        status: connectionTest,
        error: connectionError
      }
    }

    return NextResponse.json(diagnostics, { status: 200 })

  } catch (error) {
    return NextResponse.json({
      error: 'Diagnostic failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
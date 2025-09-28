import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Simple health check with environment debugging
    const diagnostics = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: '1.0.0',
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'undefined',
        VERCEL: process.env.VERCEL || 'undefined',
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'undefined',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'undefined',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?
          process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...' : 'undefined'
      },
      validation: {
        url_valid: !!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://'),
        anon_key_valid: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 100,
        service_key_valid: !!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.length > 100
      }
    }

    return NextResponse.json(diagnostics)
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'undefined',
      VERCEL: process.env.VERCEL || 'undefined',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'undefined',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'undefined'
    },
    status: 'running'
  }

  return NextResponse.json(diagnostics)
}
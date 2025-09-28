// Bypass wrapper for Supabase authentication to avoid fetch issues

export async function signInWithPasswordBypass(email: string, password: string) {
  try {
    const supabaseUrl = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzk2NzcsImV4cCI6MjA3Mzc1NTY3N30.-LxDF04CO66mJrg4rVpHHJLmNnTgNu_lFyfL-qZKsdw'

    console.log('🚀 Direct auth bypass - making manual request')

    // Construct URL manually to ensure it's valid
    const authUrl = `${supabaseUrl}/auth/v1/token?grant_type=password`

    console.log('📡 Auth URL:', authUrl)
    console.log('📊 Request data:', { email, password: '***' })

    // Make direct request to avoid Supabase client issues
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        email,
        password
      })
    })

    console.log('📥 Response status:', response.status)

    const data = await response.json()
    console.log('📥 Response data:', data)

    if (!response.ok) {
      throw new Error(`Authentication failed: ${data.error_description || data.message || 'Unknown error'}`)
    }

    return {
      data: {
        user: data.user,
        session: data
      },
      error: null
    }

  } catch (error) {
    console.error('❌ Bypass auth error:', error)
    return {
      data: { user: null, session: null },
      error: error instanceof Error ? error : new Error('Authentication failed')
    }
  }
}
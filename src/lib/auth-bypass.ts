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

    // Set the session cookies manually for middleware compatibility
    try {
      console.log('💾 Setting session cookies manually...')

      // Set cookies directly using document.cookie for middleware compatibility
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const expirationTime = new Date(Date.now() + 3600 * 1000).toUTCString() // 1 hour

        // Set the cookies that Supabase middleware expects
        document.cookie = `sb-mvvxeqhsatkqtsrulcil-auth-token=${JSON.stringify({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user: data.user
        })}; expires=${expirationTime}; path=/; secure; samesite=lax`

        console.log('🍪 Session cookies set manually')
      }

      // Also try the original setSession as fallback
      try {
        const { createBrowserClient } = await import('@supabase/ssr')
        const supabaseClient = createBrowserClient(supabaseUrl, supabaseKey)

        const sessionPromise = supabaseClient.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token
        })

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session timeout')), 1000)
        })

        await Promise.race([sessionPromise, timeoutPromise])
        console.log('✅ Supabase session also set successfully')
      } catch (supabaseError) {
        console.log('⚠️ Supabase setSession failed, but manual cookies should work')
      }
    } catch (sessionError) {
      console.warn('⚠️ Could not set session, continuing anyway:', sessionError.message)
    }

    // After successful auth, get user profile from database
    console.log('📋 Getting user profile for:', data.user.id)

    try {
      const profileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${data.user.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${data.access_token}` // Use the new access token
        }
      })

      if (profileResponse.ok) {
        const profiles = await profileResponse.json()
        const profile = profiles[0]

        console.log('👤 User profile loaded:', profile)

        // Attach profile to user object
        const userWithProfile = {
          ...data.user,
          profile: profile
        }

        return {
          data: {
            user: userWithProfile,
            session: data
          },
          error: null
        }
      } else {
        console.warn('⚠️ Could not load user profile, using auth data only')
      }
    } catch (profileError) {
      console.warn('⚠️ Profile fetch error:', profileError)
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
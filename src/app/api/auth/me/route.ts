import { NextRequest, NextResponse } from 'next/server'
import { customAuth } from '@/lib/custom-auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 /api/auth/me called')
    const user = await customAuth.getCurrentUser()

    console.log('📋 getCurrentUser result:', user ? { id: user.id, email: user.email, role: user.profile?.role } : 'null')

    if (!user) {
      console.log('❌ No authenticated user found')
      return NextResponse.json(
        { error: 'No authenticated user' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated successfully')
    // getCurrentUser() already returns AuthUser with safe profile (no password_hash)
    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Error in /api/auth/me:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { customAuth } from '@/lib/custom-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No authenticated user' },
        { status: 401 }
      )
    }

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

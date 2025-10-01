import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { error } = await authService.signOut()

    if (error) {
      return NextResponse.json(
        { error: 'Logout failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in /api/auth/logout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

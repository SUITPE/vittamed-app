import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await authService.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No authenticated user' },
        { status: 401 }
      )
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Error in /api/auth/me:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

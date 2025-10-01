import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json({ success: true })

    // Clear authentication cookie
    response.cookies.delete('vittamed-auth-token')

    return response
  } catch (error) {
    console.error('Error in /api/auth/logout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

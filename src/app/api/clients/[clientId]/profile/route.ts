import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-api'

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { clientId } = params

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Verify user authentication and that they are requesting their own data
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // For clients, they can only access their own profile
    if (user.id !== clientId) {
      return NextResponse.json(
        { error: 'Forbidden - can only access own profile' },
        { status: 403 }
      )
    }

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', clientId)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    return NextResponse.json(profile)

  } catch (error) {
    console.error('Error in client profile API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { clientId } = params

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Verify user authentication and that they are updating their own data
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // For clients, they can only update their own profile
    if (user.id !== clientId) {
      return NextResponse.json(
        { error: 'Forbidden - can only update own profile' },
        { status: 403 }
      )
    }

    const updates = await request.json()

    // Remove fields that shouldn't be updated via this endpoint
    const { id, email, created_at, ...allowedUpdates } = updates

    // Update the profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        ...allowedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedProfile)

  } catch (error) {
    console.error('Error in client profile update API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'
import { CreateUnitMeasureData, UpdateUnitMeasureData } from '@/types/catalog'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type')

    // Verify user authentication
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Build query for unit measures
    let query = supabase
      .from('unit_measures')
      .select('*')
      .order('name', { ascending: true })

    // Apply type filter if provided
    if (type) {
      query = query.eq('type', type)
    }

    const { data: unitMeasures, error } = await query

    if (error) {
      console.error('Error fetching unit measures:', error)
      return NextResponse.json(
        { error: 'Failed to fetch unit measures' },
        { status: 500 }
      )
    }

    return NextResponse.json(unitMeasures)

  } catch (error) {
    console.error('Error in unit measures API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()

    // Verify user authentication and admin role
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('custom_users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin_tenant') {
      return NextResponse.json(
        { error: 'Forbidden - admin access required' },
        { status: 403 }
      )
    }

    const data: CreateUnitMeasureData = await request.json()

    // Validate required fields
    if (!data.name || !data.abbreviation || !data.type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, abbreviation, type' },
        { status: 400 }
      )
    }

    // Check for duplicate name or abbreviation
    const { data: existing } = await supabase
      .from('unit_measures')
      .select('id')
      .or(`name.eq.${data.name},abbreviation.eq.${data.abbreviation}`)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Unit measure with this name or abbreviation already exists' },
        { status: 409 }
      )
    }

    // Create unit measure
    const { data: unitMeasure, error } = await supabase
      .from('unit_measures')
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('Error creating unit measure:', error)
      return NextResponse.json(
        { error: 'Failed to create unit measure' },
        { status: 500 }
      )
    }

    return NextResponse.json(unitMeasure, { status: 201 })

  } catch (error) {
    console.error('Error in create unit measure API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
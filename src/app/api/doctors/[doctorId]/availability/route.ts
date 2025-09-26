import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await params
  const supabase = await createClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.id !== doctorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: availability, error } = await supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('day_of_week', { ascending: true })

    if (error) {
      console.error('Error fetching availability:', error)
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
    }

    return NextResponse.json(availability || [])

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await params
  const supabase = await createClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.id !== doctorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { day_of_week, start_time, end_time, lunch_start, lunch_end } = await request.json()

    if (day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'day_of_week, start_time, and end_time are required' },
        { status: 400 }
      )
    }

    const { data: existing } = await supabase
      .from('doctor_availability')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('day_of_week', day_of_week)
      .single()

    let result

    if (existing) {
      result = await supabase
        .from('doctor_availability')
        .update({
          start_time,
          end_time,
          lunch_start,
          lunch_end,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from('doctor_availability')
        .insert({
          doctor_id: doctorId,
          day_of_week,
          start_time,
          end_time,
          lunch_start,
          lunch_end,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error updating availability:', result.error)
      return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 })
    }

    return NextResponse.json(result.data)

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await params
  const supabase = await createClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.id !== doctorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const dayOfWeek = searchParams.get('day_of_week')

    if (!dayOfWeek) {
      return NextResponse.json(
        { error: 'day_of_week parameter is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('doctor_availability')
      .delete()
      .eq('doctor_id', doctorId)
      .eq('day_of_week', parseInt(dayOfWeek))

    if (error) {
      console.error('Error deleting availability:', error)
      return NextResponse.json({ error: 'Failed to delete availability' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
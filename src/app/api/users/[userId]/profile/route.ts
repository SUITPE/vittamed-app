import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'vittamed-dev-secret-key-2024'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    console.log('[Profile API GET] Fetching profile for userId:', userId)

    // Get auth token from cookies
    const cookieStore = await cookies()
    const token = cookieStore.get('vittamed-auth-token')?.value

    if (!token) {
      console.error('[Profile API GET] No auth token found')
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verify token
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
      console.log('[Profile API GET] Decoded token:', decoded.userId, decoded.email)
    } catch (err) {
      console.error('[Profile API GET] Invalid token:', err)
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verify user is requesting their own profile
    if (decoded.userId !== userId) {
      console.error('[Profile API GET] User mismatch:', decoded.userId, 'vs', userId)
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const supabase = await getSupabaseServerClient()

    // Get user profile from custom_users
    const { data: profile, error } = await supabase
      .from('custom_users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[Profile API GET] Supabase error:', error)
      return NextResponse.json({ error: 'Error al obtener el perfil' }, { status: 500 })
    }

    console.log('[Profile API GET] Success, returning profile')
    return NextResponse.json(profile)
  } catch (error) {
    console.error('[Profile API GET] Unexpected error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    console.log('[Profile API PATCH] Updating profile for userId:', userId)

    // Get auth token from cookies
    const cookieStore = await cookies()
    const token = cookieStore.get('vittamed-auth-token')?.value

    if (!token) {
      console.error('[Profile API PATCH] No auth token found')
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verify token
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
      console.log('[Profile API PATCH] Decoded token:', decoded.userId, decoded.email)
    } catch (err) {
      console.error('[Profile API PATCH] Invalid token:', err)
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verify user is updating their own profile
    if (decoded.userId !== userId) {
      console.error('[Profile API PATCH] User mismatch:', decoded.userId, 'vs', userId)
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { first_name, last_name, phone, date_of_birth, address } = body

    // Validate required fields
    if (!first_name || !last_name) {
      return NextResponse.json(
        { error: 'Nombre y apellido son requeridos' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()

    // Update user profile in custom_users
    // Extended profile fields: phone, date_of_birth, address
    const { data: updatedProfile, error } = await supabase
      .from('custom_users')
      .update({
        first_name,
        last_name,
        phone: phone || null,
        date_of_birth: date_of_birth || null,
        address: address || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      return NextResponse.json({ error: 'Error al actualizar el perfil' }, { status: 500 })
    }

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { customAuth } from '@/lib/custom-auth'
import { createClient } from '@supabase/supabase-js'

// Supabase client with service role for storage operations
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvvxeqhsatkqtsrulcil.supabase.co'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for storage operations')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

const BUCKET_NAME = 'avatars'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * POST /api/user/avatar - Upload user avatar
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await customAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = user.id

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('avatar') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: 'Tipo de archivo no permitido. Use JPG, PNG, WebP o GIF'
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: 'El archivo es muy grande. Máximo 5MB'
      }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `${userId}/avatar-${Date.now()}.${fileExtension}`

    // Delete existing avatar if any
    const { data: currentUser } = await supabase
      .from('custom_users')
      .select('avatar_url')
      .eq('id', userId)
      .single()

    if (currentUser?.avatar_url) {
      // Extract file path from URL and delete old file
      try {
        const oldPath = currentUser.avatar_url.split(`${BUCKET_NAME}/`)[1]
        if (oldPath) {
          await supabase.storage.from(BUCKET_NAME).remove([oldPath])
        }
      } catch (deleteError) {
        console.warn('Could not delete old avatar:', deleteError)
      }
    }

    // Upload new avatar
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({
        error: 'Error al subir el archivo'
      }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadData.path)

    const avatarUrl = urlData.publicUrl

    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from('custom_users')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({
        error: 'Error al actualizar perfil'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      avatar_url: avatarUrl,
      message: 'Avatar actualizado correctamente'
    })

  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/user/avatar - Remove user avatar
 */
export async function DELETE() {
  try {
    // Get current user
    const user = await customAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = user.id
    const supabase = getSupabaseAdmin()

    // Get current avatar URL
    const { data: currentUser, error: fetchError } = await supabase
      .from('custom_users')
      .select('avatar_url')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json({
        error: 'Error al obtener perfil'
      }, { status: 500 })
    }

    if (currentUser?.avatar_url) {
      // Extract file path from URL and delete
      try {
        const filePath = currentUser.avatar_url.split(`${BUCKET_NAME}/`)[1]
        if (filePath) {
          await supabase.storage.from(BUCKET_NAME).remove([filePath])
        }
      } catch (deleteError) {
        console.warn('Could not delete avatar file:', deleteError)
      }
    }

    // Update user profile to remove avatar URL
    const { error: updateError } = await supabase
      .from('custom_users')
      .update({ avatar_url: null })
      .eq('id', userId)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({
        error: 'Error al actualizar perfil'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar eliminado correctamente'
    })

  } catch (error) {
    console.error('Avatar delete error:', error)
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

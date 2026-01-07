import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient() as any

    // Enforce a maximum file size to avoid excessive memory usage on the server.
    // Increased limit to 10 MB to allow larger category images.
    const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
    if ((file as any).size && (file as any).size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'حجم الملف كبير جداً. الحد الأقصى المسموح به هو 10 ميغابايت.' }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `category-${Date.now()}.${fileExt}`
    const filePath = fileName

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('categories')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('[API upload category image] Storage upload error:', uploadError)
      return NextResponse.json({ 
        error: `فشل رفع الصورة: ${uploadError.message}` 
      }, { status: 400 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('categories')
      .getPublicUrl(filePath)

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      filename: fileName 
    })

  } catch (error: any) {
    console.error('[API upload category image] Error:', error)
    return NextResponse.json({ 
      error: error?.message || 'حدث خطأ أثناء رفع الصورة' 
    }, { status: 500 })
  }
}

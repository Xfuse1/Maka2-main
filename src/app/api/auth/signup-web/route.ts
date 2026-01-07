import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '').trim()
    const name = String(formData.get('name') || '')
    const phone_number = String(formData.get('phone') || '')
    const imageFile = formData.get('image') as File | null

    // Basic required validation
    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 })
    }

    // Basic email validation (allow any TLD)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneIsEgyptian = /^(?:\+20|0)1[0125][0-9]{8}$/.test(phone_number.trim())
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: 'الرجاء إدخال بريد إلكتروني صحيح' }, { status: 400 })
    }
    if (phone_number && !phoneIsEgyptian) {
      return NextResponse.json({ success: false, message: 'الرجاء إدخال رقم هاتف مصري صالح (مثال: 01012345678 أو +201012345678)' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone_number, role: 'user' },
    })

    if (error) {
      return NextResponse.json({ success: false, message: String(error.message || 'خطأ أثناء إنشاء الحساب') }, { status: 400 })
    }

    let image_url = null
    if (data.user && imageFile && imageFile.size > 0) {
      try {
        const fileExt = String(imageFile.name || '').split('.').pop()
        const fileName = `${data.user.id}/avatar.${fileExt}`
        const arrayBuffer = await imageFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('profile-images')
          .upload(fileName, buffer, {
            contentType: imageFile.type,
            upsert: true,
          })

        if (uploadError) {
          console.error('Image upload error:', uploadError)
        } else {
          const { data: urlData } = supabaseAdmin.storage
            .from('profile-images')
            .getPublicUrl(fileName)
          image_url = urlData.publicUrl
        }
      } catch (err) {
        console.error('Error processing image:', err)
      }
    }

    if (data.user) {
      await supabaseAdmin.from('profiles').upsert({
        id: data.user.id,
        name,
        phone_number,
        image_url,
        role: 'user',
      })
    }

    return NextResponse.json({ success: true, message: 'تم إنشاء الحساب بنجاح. الرجاء تسجيل الدخول.' })
  } catch (err: any) {
    console.error('[api/auth/signup-web] error:', err)
    return NextResponse.json({ success: false, message: err?.message || 'Server error' }, { status: 500 })
  }
}

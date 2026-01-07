"use server"

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signUpWithAdmin(formData: FormData) {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '').trim()
  const name = String(formData.get('name') || '')
  const phone_number = String(formData.get('phone') || '')
  const imageFile = formData.get('image') as File | null
  const role = 'user'
  if (!email || !password) {
    const msg = encodeURIComponent('البريد الإلكتروني وكلمة المرور مطلوبان')
    try { redirect(`/auth?message=${msg}&status=error`) } catch (e) { return { error: 'Email and password are required' } }
  }

  // Basic email validation (allow any top-level domain)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneIsEgyptian = /^(?:\+20|0)1[0125][0-9]{8}$/.test(phone_number.trim())
  if (!emailRegex.test(email)) {
    const msg = encodeURIComponent('الرجاء إدخال بريد إلكتروني صحيح')
    try { redirect(`/auth?message=${msg}&status=error`) } catch (e) { return { error: 'Invalid email' } }
  }
  if (phone_number && !phoneIsEgyptian) {
    const msg = encodeURIComponent('الرجاء إدخال رقم هاتف مصري صالح (مثال: 01012345678 أو +201012345678)')
    try { redirect(`/auth?message=${msg}&status=error`) } catch (e) { return { error: 'Invalid Egyptian phone number' } }
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

  // Create user first
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, phone_number, role },
  })

  if (error) {
    const msg = encodeURIComponent(String(error.message || 'خطأ أثناء إنشاء الحساب'))
    try { redirect(`/auth?message=${msg}&status=error`) } catch (e) { return { error: error.message } }
  }

  let image_url = null

  // Upload profile image if provided
  if (data.user && imageFile && imageFile.size > 0) {
    try {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${data.user.id}/avatar.${fileExt}`
      
      // Convert File to ArrayBuffer
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
        // show upload error to user
        const msg = encodeURIComponent('فشل رفع الصورة. يمكنك المحاولة لاحقًا.')
        try { redirect(`/auth?message=${msg}&status=error`) } catch (e) { /* fallback continue */ }
      } else {
        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('profile-images')
          .getPublicUrl(fileName)
        
        image_url = urlData.publicUrl
      }
    } catch (err) {
      console.error('Error processing image:', err)
    }
  }

  // Create profile with image URL
  if (data.user) {
    await supabaseAdmin.from('profiles').upsert({
      id: data.user.id,
      name,
      phone_number,
      image_url,
      role,
    })
  }
  revalidatePath('/auth', 'page')
  // Redirect user to the login page after successful signup so mobile lands on login
  try {
    const msg = encodeURIComponent('تم إنشاء الحساب بنجاح. الرجاء تسجيل الدخول.')
    redirect(`/auth?message=${msg}&status=success`)
  } catch (e) {
    // If redirect isn't usable in this environment, return the data so caller can handle it
    return { data }
  }
}

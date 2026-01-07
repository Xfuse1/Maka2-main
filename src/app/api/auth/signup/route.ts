import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()
    const email = String(formData.get('email') || '')
    const password = String(formData.get('password') || '')

    // Server-side email validation: basic format and enforce ending with `.eg` (e.g. example.eg or example.co.eg)
    const emailTrim = email.trim()
    const emailRe = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:\.[A-Za-z]{2,})*$/
    if (!emailRe.test(emailTrim)) {
      return NextResponse.json({ error: "البريد الإلكتروني غير صالح — تأكد أنه في الشكل user@domain.tld." }, { status: 400 })
    }

    // Allow any top-level domain; ensure basic email format already validated above
    // Log received form keys/values (development only) to aid debugging
    try {
      if (process.env.NODE_ENV !== 'production') {
        const entries = Array.from(formData.entries()).map(([k, v]) => {
          if (v instanceof File) {
            return { key: k, type: 'File', name: v.name, size: v.size }
          }
          return { key: k, value: String(v) }
        })
        //console.log('Signup route received form fields:', JSON.stringify(entries))
      }
    } catch (e) {
      console.warn('Could not stringify formData for debug logging', e)
    }
    const name = (formData.get('name') as string) || null
    const phone_number = (formData.get('phone') as string) || null
    let image_url = (formData.get('image') as string) || null
    const image_file = formData.get('image') as File | null
    const role = (formData.get('role') as string) || 'user'

    if (!email || !password) {
      const missing = []
      if (!email) missing.push('email')
      if (!password) missing.push('password')
      return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 })
    }

    // NOTE: Skip server-side avatar upload for now to avoid runtime issues in dev
    // If an `image` field is provided as a URL or already-hosted path, it will be used.
    // We intentionally do not attempt to read and upload File objects here to keep
    // the signup route simple and avoid platform-specific File/Blob conversion errors.

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone_number, image_url, role },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        // Skip email confirmation in development if SUPABASE_SKIP_EMAIL_CONFIRM is set
        ...(process.env.SUPABASE_SKIP_EMAIL_CONFIRM === 'true' ? { 
          emailRedirectTo: undefined 
        } : {})
      },
    })

    if (error) {
      console.error('Sign up error:', error)
      // Provide more context about the Supabase error
      let userMessage = error.message || 'Could not create user'
      if (error.message?.includes('Database error')) {
        userMessage = 'User registration failed. The email may already be registered or there is a database configuration issue. Please contact support if this persists.'
      }
      return NextResponse.json({ 
        error: userMessage,
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined 
      }, { status: 400 })
    }

    return NextResponse.json({ ok: true, message: 'Check email to continue sign in process' })
  } catch (err) {
    console.error('Signup route exception:', err)
    const payload: any = { error: (err as any)?.message || 'Server error' }
    if (process.env.NODE_ENV !== 'production') {
      payload.stack = (err as any)?.stack
    }
    return NextResponse.json(payload, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '').trim()
    const name = (formData.get('name') as string) || null
    const phone_number = (formData.get('phone') as string) || null
    const role = (formData.get('role') as string) || 'user'

    if (!email || !password) {
      const missing = []
      if (!email) missing.push('email')
      if (!password) missing.push('password')
      return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 })
    }

    // Use service role key to bypass email confirmation
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Try to delete existing user with this email first (in case of leftover data)
    try {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find((u: any) => u.email === email)
      if (existingUser) {
        await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
      }
    } catch (deleteErr) {
      console.warn('Could not check/delete existing user:', deleteErr)
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { name, phone_number, role }
    })

    if (error) {
      console.error('Admin signup error:', error)
      return NextResponse.json({ 
        error: error.message || 'Could not create user',
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined 
      }, { status: 400 })
    }

    // Create profile row manually (in case trigger doesn't exist or fails)
    if (data.user?.id) {
      try {
        await supabaseAdmin
          .from('profiles')
          .upsert({
            id: data.user.id,
            name,
            phone_number,
            role
          })
      } catch (profileErr) {
        console.warn('Could not create profile (non-fatal):', profileErr)
        // Don't fail the signup if profile creation fails
      }
    }

    revalidatePath('/auth', 'page')
    return NextResponse.json({ 
      ok: true, 
      message: 'Account created successfully! You can now log in.',
      userId: data.user?.id
    })
  } catch (err) {
    console.error('Admin signup route exception:', err)
    const payload: any = { error: (err as any)?.message || 'Server error' }
    if (process.env.NODE_ENV !== 'production') {
      payload.stack = (err as any)?.stack
    }
    return NextResponse.json(payload, { status: 500 })
  }
}

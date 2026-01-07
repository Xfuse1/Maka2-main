import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    // Use a one-off service role client to sign in the user
    // This is necessary because the user was created with the admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    
    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
    const formData = await request.formData()
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '').trim()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      console.error('Auth login error:', error)
      return NextResponse.json({ error: error.message || 'Invalid credentials' }, { status: 400 })
    }

    // If sign-in is successful, the response will include the session
    // The client-side will handle the session and cookies
    return NextResponse.json({ data })
  } catch (err) {
    console.error('Login route exception:', err)
    return NextResponse.json({ error: (err as any)?.message || 'Server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email, password, storeId } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('[AdminLogin API] Missing Supabase environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Use service role client for admin operations
    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // 1. Sign in the user
    console.log('[AdminLogin API] Attempting to sign in user:', email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (authError || !authData?.user) {
      console.error('[AdminLogin API] Auth error:', authError)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const userId = authData.user.id
    console.log('[AdminLogin API] User authenticated:', userId)

    // 2. Check if user has admin access
    let hasAccess = false
    let userStoreId: string | null = null

    // Check profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, store_id')
      .eq('id', userId)
      .maybeSingle()

    if (!profileError && profile) {
      const isAdminRole = profile.role && ['admin', 'store_owner', 'owner', 'super_admin'].includes(profile.role.toLowerCase())
      const isStoreOwner = !!profile.store_id

      if (isAdminRole || isStoreOwner) {
        hasAccess = true
        userStoreId = profile.store_id
        console.log('[AdminLogin API] User has access via profiles')
      }
    } else if (profileError) {
      console.log('[AdminLogin API] Profile check error (this is expected if RLS is enabled):', profileError.code)
    }

    // Check store_admins table
    if (!hasAccess) {
      const { data: storeAdmin, error: storeAdminError } = await supabaseAdmin
        .from('store_admins')
        .select('role, store_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle()

      if (!storeAdminError && storeAdmin) {
        hasAccess = true
        userStoreId = storeAdmin.store_id
        console.log('[AdminLogin API] User has access via store_admins')
      } else if (storeAdminError) {
        console.log('[AdminLogin API] Store admin check error:', storeAdminError.code)
      }
    }

    // 3. If still no access, check if this is the first admin
    if (!hasAccess && storeId) {
      try {
        const { count, error: countError } = await supabaseAdmin
          .from('store_admins')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeId)

        if (!countError && count === 0) {
          console.log('[AdminLogin API] First admin login - creating store_admins entry')
          
          // Create the admin entry
          const { error: insertError } = await supabaseAdmin
            .from('store_admins')
            .insert({
              store_id: storeId,
              user_id: userId,
              role: 'owner',
              is_active: true,
            })

          if (!insertError) {
            hasAccess = true
            userStoreId = storeId
            console.log('[AdminLogin API] Successfully created store_admins entry')
          } else {
            console.error('[AdminLogin API] Error creating store_admins entry:', insertError)
          }
        } else if (countError) {
          console.error('[AdminLogin API] Error checking admin count:', countError)
        }
      } catch (err) {
        console.error('[AdminLogin API] Exception checking first admin:', err)
      }
    }

    if (!hasAccess) {
      console.warn('[AdminLogin API] User has no admin access:', userId)
      return NextResponse.json({ error: 'You do not have access to the admin panel' }, { status: 403 })
    }

    // 4. Success - return the auth data
    console.log('[AdminLogin API] Login successful for user:', userId)
    return NextResponse.json({
      success: true,
      user: authData.user,
      session: authData.session,
      storeId: userStoreId,
    })
  } catch (err) {
    console.error('[AdminLogin API] Exception:', err)
    return NextResponse.json({ error: (err as any)?.message || 'Server error' }, { status: 500 })
  }
}

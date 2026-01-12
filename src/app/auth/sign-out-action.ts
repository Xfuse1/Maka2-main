
'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { clearCacheOnLogout } from '@/lib/cache'

export async function signOut() {
  // createClient is async and manages cookies internally in the server helper.
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  // Clear ALL server-side cache on logout for security/privacy
  try {
    clearCacheOnLogout();
  } catch (e) {
    // Best effort cache clear
  }

  if (error) {
    return redirect('/?message=Could not sign out')
  }
  // Revalidate frontpage and redirect to cache-busted path to force hard reload
  revalidatePath('/', 'layout')
  redirect(`/?_cb=${Date.now()}`)
}

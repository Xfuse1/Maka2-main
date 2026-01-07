import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"

export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. " +
      "Please set these in your Vercel project settings or .env.local file."
    )
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export const getAdminClient = getSupabaseAdminClient

export const createAdminClient = getSupabaseAdminClient

// Backwards-compatible aliases used across the codebase
export const createSupabaseAdmin = getSupabaseAdminClient
export const createSupabaseAdminClient = getSupabaseAdminClient
export const getSupabaseAdmin = getSupabaseAdminClient

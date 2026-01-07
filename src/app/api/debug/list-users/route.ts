import { NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"

// DEBUG ENDPOINT - Disabled in production for security
export async function GET() {
  // Block access in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const admin = getAdminClient()

    // Get all users from auth.users
    const { data: authUsers, error: authError } = await admin.auth.admin.listUsers()

    // Get all profiles
    const { data: profiles, error: profilesError } = await (admin.from("profiles") as any).select("*")

    return NextResponse.json({
      ok: true,
      authUsers: authUsers?.users || [],
      authUsersCount: authUsers?.users?.length || 0,
      profiles: profiles || [],
      profilesCount: profiles?.length || 0,
      errors: {
        authError: authError ? authError.message : null,
        profilesError: profilesError ? profilesError.message : null,
      },
    })
  } catch (err: any) {
    console.error("/api/debug/list-users error:", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

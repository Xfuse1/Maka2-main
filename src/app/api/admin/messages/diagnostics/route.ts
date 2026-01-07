import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

const json = (data: any, status = 200) =>
  new NextResponse(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  })

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || null
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null

    const supabase = getSupabaseAdminClient()

    // Check table count
    const listResult: any = await (supabase.from("contact_messages") as any).select("id, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(5)

    const tableCount = listResult?.count ?? null
    const rows = listResult?.data ?? null
    const error = listResult?.error ?? null

    return json({
      success: true,
      env: { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey },
      table: { count: tableCount, recent: rows },
      error: error ? { message: error.message, code: error.code } : null,
    })
  } catch (err: any) {
    console.error('[Admin Messages Diagnostics] uncaught', err)
    return json({ success: false, error: err?.message || String(err) }, 500)
  }
}

import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAdminClient, getStoreIdFromRequest } from "@/lib/supabase/admin"

const json = (data: any, status = 200) =>
  new NextResponse(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  })

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient()
    const storeId = await getStoreIdFromRequest()
    
    const { data, error } = await (supabase.from("contact_messages") as any)
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Admin Messages API] error:", error)
      return json({ success: false, error: error.message || error }, 500)
    }

    return json({ success: true, messages: data })
  } catch (err: any) {
    console.error("[Admin Messages API] uncaught:", err)
    return json({ success: false, error: err?.message || String(err) }, 500)
  }
}

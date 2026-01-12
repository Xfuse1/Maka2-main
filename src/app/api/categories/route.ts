import { NextResponse } from "next/server"
import { createAdminClient, getStoreIdFromRequest } from "@/lib/supabase/admin"

// GET - Fetch all active categories for public display (filtered by store)
export async function GET() {
  try {
    const supabase = createAdminClient()
    const storeId = await getStoreIdFromRequest()

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("store_id", storeId) // Filter by store for multi-tenant
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name_ar", { ascending: true })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

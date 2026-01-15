import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStoreIdFromRequest } from "@/lib/supabase/admin"

// GET: Retrieve enabled payment methods for current store
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const storeId = await getStoreIdFromRequest()

    if (!storeId) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 400 }
      )
    }

    // Get store payment settings
    const { data, error } = await supabase
      .from("store_settings")
      .select("kashier_enabled")
      .eq("store_id", storeId)
      .single()

    if (error) {
      console.error("Error fetching payment methods status:", error)
      return NextResponse.json(
        { kashier_enabled: false },
        { status: 200 }
      )
    }

    return NextResponse.json({
      kashier_enabled: data?.kashier_enabled ?? false,
    })
  } catch (error) {
    console.error("Error in GET /api/payment-methods-status:", error)
    return NextResponse.json(
      { kashier_enabled: false },
      { status: 200 }
    )
  }
}

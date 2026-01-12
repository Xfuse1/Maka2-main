import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient, getStoreIdFromRequest } from "@/lib/supabase/admin"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { productVariantId, quantity, size, color } = await request.json()

    if (!productVariantId || !quantity) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await getSupabaseAdminClient()
    const storeId = await getStoreIdFromRequest()
    const cookieStore = await cookies()

    // Get or create session ID for anonymous users
    let sessionId = cookieStore.get("cart_session_id")?.value
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await cookieStore.set("cart_session_id", sessionId, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
    }

    const { data: existingItem, error: selectError } = await supabase
      .from("cart_items")
      .select("*")
      .eq("product_variant_id", productVariantId)
      .eq("session_id", sessionId)
      .eq("store_id", storeId) // Filter by store for multi-tenant
      .eq("size", size || "")
      .eq("color", color || "")
      .maybeSingle()
    if (selectError && selectError.code !== "PGRST116" && selectError.code !== "PGRST123") { // PGRST116: No rows found, PGRST123: Multiple rows found
      console.error("[Cart API] Error selecting cart item:", selectError)
      return NextResponse.json({ success: false, error: selectError.message }, { status: 500 })
    }

    if (existingItem) {
      // Update quantity if item exists
      const updateData = {
        quantity: (existingItem as any).quantity + quantity,
        updated_at: new Date().toISOString(),
      }
      const { error: updateError } = await (supabase as any)
        .from("cart_items")
        .update([updateData])
        .eq("id", (existingItem as any).id)
        .eq("store_id", storeId) // Verify store ownership
      if (updateError) {
        console.error("[Cart API] Error updating cart item:", updateError)
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
      }
    } else {
      const insertData = {
        store_id: storeId, // Add store_id for multi-tenant
        product_variant_id: productVariantId,
        quantity,
        session_id: sessionId,
        size: size || null,
        color: color || null,
      }
      const { error: insertError } = await (supabase as any).from("cart_items").insert([insertData])
      if (insertError) {
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

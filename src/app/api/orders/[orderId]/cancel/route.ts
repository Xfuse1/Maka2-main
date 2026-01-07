import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    const supabase = await createClient()

    // 1) Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[CANCEL API] Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2) Fetch order and ensure it belongs to user and status is pending/under_creation
    // We use the user's client to ensure they can at least SEE the order (RLS check)
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, status")
      .eq("id", orderId)
      .single()

    const order = orderData as any

    if (orderError) {
      console.error("[CANCEL API] Order fetch error:", orderError)
      return NextResponse.json({ error: "Order not found or error fetching" }, { status: 404 })
    }

    if (!order) {
       console.error("[CANCEL API] Order is null")
       return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.user_id !== user.id) {
      console.error(`[CANCEL API] Forbidden. Order user: ${order.user_id}, Request user: ${user.id}`)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check allowed statuses for cancellation
    const allowedStatuses = ["pending", "under_creation"]
    
    if (!allowedStatuses.includes(order.status)) {
      console.error(`[CANCEL API] Invalid status: ${order.status}. Allowed: ${allowedStatuses.join(", ")}`)
      return NextResponse.json(
        { error: "Cannot cancel this order status" },
        { status: 400 }
      )
    }

    // 3) Fetch items to restore stock
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("product_id, variant_id, quantity")
      .eq("order_id", orderId)

    if (itemsError) {
      console.error("[CANCEL API] Error fetching items:", itemsError)
    }

    // 4) Update status to cancelled using Admin Client (Bypass RLS for Update)
    const adminSupabase = getSupabaseAdminClient() as any
    const { error: updateError, data: updatedData } = await adminSupabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId)
      .select()

    if (updateError) {
      console.error("[CANCEL API] Update error:", updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    // 5) Restore stock
    if (orderItems && orderItems.length > 0) {
      for (const item of (orderItems as any[])) {
        try {
          if (item.variant_id && item.quantity > 0) {
            // Restore variant stock
            const { data: variant } = await adminSupabase
              .from("product_variants")
              .select("inventory_quantity")
              .eq("id", item.variant_id)
              .single()

            if (variant) {
              await adminSupabase
                .from("product_variants")
                .update({ inventory_quantity: variant.inventory_quantity + item.quantity })
                .eq("id", item.variant_id)
            }

            // Restore product stock (aggregate)
            if (item.product_id) {
              const { data: product } = await adminSupabase
                .from("products")
                .select("inventory_quantity")
                .eq("id", item.product_id)
                .single()

              if (product) {
                await adminSupabase
                  .from("products")
                  .update({ inventory_quantity: product.inventory_quantity + item.quantity })
                  .eq("id", item.product_id)
              }
            }
          }
        } catch (err) {
          console.error("[CANCEL API] Failed to restore stock for item:", item, err)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[CANCEL API] Unhandled error:", err)
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown error" },
      { status: 500 }
    )
  }
}

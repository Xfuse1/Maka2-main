import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

const STOCK_HOLDING_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'completed', 'confirmed']
const STOCK_RELEASING_STATUSES = ['cancelled', 'returned', 'failed']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { status: newStatus } = await request.json()
  const supabase = getSupabaseAdminClient() as any // service-role client

  // 1. Fetch current order status and items
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single()

  if (fetchError || !order) {
    return NextResponse.json({ error: fetchError?.message || "Order not found" }, { status: 404 })
  }

  const oldStatus = order.status
  const items = order.order_items || []

  // 2. Check for stock adjustments
  const isHolding = STOCK_HOLDING_STATUSES.includes(oldStatus)
  const willRelease = STOCK_RELEASING_STATUSES.includes(newStatus)
  
  const isReleasing = STOCK_RELEASING_STATUSES.includes(oldStatus)
  const willHold = STOCK_HOLDING_STATUSES.includes(newStatus)

  let stockAdjustment = "none" // "increase", "decrease", "none"
  
  if (isHolding && willRelease) {
    stockAdjustment = "increase"
  } else if (isReleasing && willHold) {
    stockAdjustment = "decrease"
  }

  // 3. Perform stock adjustment if needed
  if (stockAdjustment === "decrease") {
    // We are reactivating an order, need to check/reserve stock
    for (const item of items) {
      if (item.variant_id && item.quantity > 0) {
        // Try RPC first
        const { data: success, error: rpcError } = await supabase.rpc('decrease_inventory', {
          variant_id: item.variant_id,
          qty: item.quantity
        })
        
        if (rpcError || !success) {
           // Fallback or failure
           if (rpcError) {
             // Try manual
             const { data: v } = await supabase.from("product_variants").select("inventory_quantity").eq("id", item.variant_id).single()
             if (v && v.inventory_quantity >= item.quantity) {
               await supabase.from("product_variants").update({ inventory_quantity: v.inventory_quantity - item.quantity }).eq("id", item.variant_id)
             } else {
               return NextResponse.json({ error: `Insufficient stock to reactivate order. Variant: ${item.variant_id}` }, { status: 400 })
             }
           } else {
             return NextResponse.json({ error: `Insufficient stock to reactivate order. Variant: ${item.variant_id}` }, { status: 400 })
           }
        }
        // Also update product aggregate (best effort)
        if (item.product_id) {
           const { data: p } = await supabase.from("products").select("inventory_quantity").eq("id", item.product_id).single()
           if (p) {
             await supabase.from("products").update({ inventory_quantity: Math.max(0, p.inventory_quantity - item.quantity) }).eq("id", item.product_id)
           }
        }
      }
    }
  } else if (stockAdjustment === "increase") {
    // We are cancelling/returning, restore stock
    for (const item of items) {
      if (item.variant_id && item.quantity > 0) {
        // Try RPC
        const { error: rpcError } = await supabase.rpc('increase_inventory', {
          variant_id: item.variant_id,
          qty: item.quantity
        })
        
        if (rpcError) {
          // Fallback
          const { data: v } = await supabase.from("product_variants").select("inventory_quantity").eq("id", item.variant_id).single()
          if (v) {
             await supabase.from("product_variants").update({ inventory_quantity: v.inventory_quantity + item.quantity }).eq("id", item.variant_id)
          }
        }
        
        // Restore product aggregate
        if (item.product_id) {
           const { data: p } = await supabase.from("products").select("inventory_quantity").eq("id", item.product_id).single()
           if (p) {
             await supabase.from("products").update({ inventory_quantity: p.inventory_quantity + item.quantity }).eq("id", item.product_id)
           }
        }
      }
    }
  }

  // 4. Update order status
  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", id)
    .select()
    .single()

  if (updateError) {
    // If update fails, we technically should rollback stock changes... 
    // But realistically if we reached here, DB is reachable.
    // For now, logging error.
    console.error("Failed to update order status", updateError)
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, order: updatedOrder })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getSupabaseAdminClient() as any

  // fetch order row
  const { data: order, error: orderError } = await supabase.from('orders').select('*').eq('id', id).maybeSingle()
  if (orderError) {
    return NextResponse.json({ error: orderError.message ?? JSON.stringify(orderError) }, { status: 500 })
  }
  if (!order) {
    return NextResponse.json({ error: `Order not found for id=${id}` }, { status: 404 })
  }

  // fetch order items separately
  const { data: items, error: itemsError } = await supabase.from('order_items').select('*').eq('order_id', id)
  if (itemsError) {
    // return order even if items fetch fails
    return NextResponse.json({ order, items: [], error: itemsError.message ?? JSON.stringify(itemsError) }, { status: 200 })
  }

  return NextResponse.json({ order: { ...order, items } })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getSupabaseAdminClient() as any

  try {
    // delete order items first
    const { error: itemsError } = await supabase.from('order_items').delete().eq('order_id', id)
    if (itemsError) {
      return NextResponse.json({ error: itemsError.message ?? JSON.stringify(itemsError) }, { status: 500 })
    }

    // delete the order row
    const { data, error } = await supabase.from('orders').delete().eq('id', id).select().maybeSingle()
    if (error) {
      return NextResponse.json({ error: error.message ?? JSON.stringify(error) }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: `Order not found for id=${id}` }, { status: 404 })
    }

    return NextResponse.json({ success: true, deleted: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete order'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

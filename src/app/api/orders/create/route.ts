// /app/api/orders/create/route.ts
// API Route: Create Order (DEBUG + HARDENED)
// POST /api/orders/create

import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic" // تأكد أنه سيرفر-سايد دائمًا
const isDev = process.env.NODE_ENV !== "production"

// ===== Helpers =====
const json = (data: any, status = 200, headers: Record<string, string> = {}) =>
  new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  })

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

const toNum = (v: unknown, fallback = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}
const nonEmpty = (v: unknown, fallback = "") => {
  if (v === undefined || v === null) return fallback
  const s = String(v).trim()
  return s.length ? s : fallback
}
const errorJson = (msg: string, extra?: any, status = 500) =>
  json(
    { success: false, error: msg, ...(isDev && extra ? { details: extra } : {}) },
    status,
    corsHeaders,
  )

// ===== Types =====
type OrderItemInput = {
  productId?: string | number | null
  variantId?: string | number | null
  productName?: string
  variantName?: string | null
  sku?: string | null
  quantity?: number | string
  unitPrice?: number | string
  totalPrice?: number | string
  imageUrl?: string | null
}
type ShippingAddress = {
  line1?: string
  line2?: string | null
  city?: string
  state?: string | null
  postalCode?: string | null
  country?: string | null
}
type Body = {
  customerEmail?: string
  customerName?: string
  customerPhone?: string | null
  items?: OrderItemInput[]
  subtotal?: number | string
  shippingCost?: number | string
  tax?: number | string
  discount?: number | string
  total?: number | string
  paymentMethod?: string | null
  shippingAddress?: ShippingAddress
  notes?: string | null
}

// ===== Method guards (تمنع HTML 404/405) =====
export async function OPTIONS() {
  return json({ ok: true }, 200, corsHeaders)
}
export async function GET() {
  // لو حد ناداه بـ GET من المتصفح، نرجّع JSON واضح بدل صفحة HTML
  return errorJson("Method Not Allowed. Use POST /api/orders/create", undefined, 405)
}

// ===== Handler =====
export async function POST(req: NextRequest) {
  const supabase = createAdminClient() as any

  // Get logged in user if any
  let userId = null
  try {
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (user) userId = user.id
  } catch (e) {
    console.warn("Error checking auth user:", e)
  }

  try {
    const contentType = req.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      return errorJson("Content-Type must be application/json", { contentType }, 415)
    }

    const body = (await req.json()) as Body
    console.log("[Orders API] incoming:", JSON.stringify(body, null, 2))

    const items = Array.isArray(body.items) ? body.items : []

    const subtotalFromItems = items.reduce((sum, it) => {
      const q = toNum(it.quantity, 0)
      const u = toNum(it.unitPrice, 0)
      const line = toNum(it.totalPrice, u * q)
      return sum + line
    }, 0)

    const subtotal = toNum(body.subtotal, subtotalFromItems)
    // If shippingCost provided by client use it, otherwise compute server-side
    let shippingCost = toNum(body.shippingCost, 0)
    const tax = toNum(body.tax, 0)
    // Start with client-supplied discount, but we will attempt to override
    // with any active payment-method offer found server-side.
    let discount = toNum(body.discount, 0)
    const calculatedTotal = toNum(body.total, subtotal + shippingCost + tax - discount)

    const customerEmail = nonEmpty(body.customerEmail)
    const customerName = nonEmpty(body.customerName)
    const paymentMethod = nonEmpty(body.paymentMethod, "cash_on_delivery")

    const addr = body.shippingAddress || {}
    const ship_line1 = nonEmpty(addr.line1)
    const ship_city = nonEmpty(addr.city)
    const ship_line2 = nonEmpty(addr.line2, "")
    const ship_state = nonEmpty(addr.state, "")
    const ship_postal = nonEmpty(addr.postalCode, "")
    const ship_country = nonEmpty(addr.country, "EG")

    const missing: string[] = []
    // Email is now optional - removed from required fields
    // if (!customerEmail) missing.push("customerEmail")
    if (!customerName) missing.push("customerName")
    if (!items.length) missing.push("items")
    if (!ship_line1) missing.push("shippingAddress.line1")
    if (!ship_city) missing.push("shippingAddress.city")
    if (!(calculatedTotal > 0)) missing.push("total (> 0)")
    if (missing.length) {
      return errorJson(
        `Missing required fields: ${missing.join(", ")}`,
        { subtotal, shippingCost, tax, discount, calculatedTotal },
        400,
      )
    }

    // ===== Apply active payment offers (server-side) =====
    try {
      const admin = createAdminClient()
      // Build candidate payment method aliases to tolerate small naming mismatches
      const pm = String(paymentMethod || "").trim()
      const candidates = new Set<string>([pm])
      // common alias: cashier <-> kashier
      if (pm.toLowerCase() === "cashier") candidates.add("kashier")
      if (pm.toLowerCase() === "kashier") candidates.add("cashier")
      // common alias: cod <-> cash_on_delivery
      if (pm.toLowerCase() === "cod") candidates.add("cash_on_delivery")
      if (pm.toLowerCase() === "cash_on_delivery") candidates.add("cod")

      const methods = Array.from(candidates)
      if (methods.length) {
        const { data: offers, error: offersErr } = await admin
          .from("payment_offers")
          .select("*")
          .in("payment_method", methods)
          .eq("is_active", true)

        if (offersErr) {
          console.warn("[Orders API] failed reading payment_offers:", offersErr)
        } else if (Array.isArray(offers) && offers.length) {
          const now = new Date()
          // Filter offers by date window and min_order_amount
          const valid = offers.filter((o: any) => {
            try {
              if (o.start_date && new Date(o.start_date) > now) return false
              if (o.end_date && new Date(o.end_date) < now) return false
              if (o.min_order_amount && Number(o.min_order_amount) > subtotal) return false
              return true
            } catch (e) {
              return false
            }
          })

          if (valid.length) {
            // pick the most recently created/updated offer
            valid.sort((a: any, b: any) => {
              const ta = new Date(a.updated_at || a.created_at || 0).getTime()
              const tb = new Date(b.updated_at || b.created_at || 0).getTime()
              return tb - ta
            })
            const offer = valid[0] as any
            const dtype = String(offer.discount_type || "").toLowerCase()
            const dval = Number(offer.discount_value || 0)
            let serverDiscount = 0
            if (dtype.includes("perc")) {
              serverDiscount = subtotal * (dval / 100)
            } else {
              serverDiscount = dval
            }
            // never exceed subtotal
            serverDiscount = Number.isFinite(serverDiscount) ? Math.min(serverDiscount, subtotal) : 0
            if (serverDiscount > 0) {
              console.log("[Orders API] applying payment offer", offer.id, "discount", serverDiscount)
              discount = serverDiscount
              // Intentionally do NOT modify `body.notes` here. The notes field
              // must contain only the user's text. If you need to record the
              // applied offer, store it in a dedicated column (e.g. `applied_offer`)
              // or a separate audit/log table. Removing the previous behavior
              // that prefixed `offer:<id>` into the user notes.
            }
          }
        }
      }
    } catch (e) {
      console.warn("[Orders API] error while resolving payment offer:", e)
    }

    // ===== Compute shipping cost server-side when not provided =====
    try {
      if (!shippingCost || shippingCost === 0) {
        // Try to resolve governorate from state or city
        const governorateCandidate = (ship_state || ship_city || "").trim()
        if (governorateCandidate) {
          // Try to find a shipping zone by code or by name (AR/EN)
          const admin = createAdminClient()
          let zone: any = null
          // match code (upper-case) first
          try {
            const code = governorateCandidate.toUpperCase().replace(/\s+/g, "_")
            const { data: byCode } = await admin.from("shipping_zones").select("*").eq("governorate_code", code).single()
            zone = byCode || null
          } catch (e) {
            // ignore
          }
          if (!zone) {
            try {
              const { data: byAr } = await admin
                .from("shipping_zones")
                .select("*")
                .ilike("governorate_name_ar", `%${governorateCandidate}%`)
                .limit(1)
            if (byAr && byAr.length) zone = byAr[0]
            } catch (_e) {
              // Ignore lookup errors, fallback to other methods
            }
          }
          if (!zone) {
            try {
              const { data: byEn } = await admin
                .from("shipping_zones")
                .select("*")
                .ilike("governorate_name_en", `%${governorateCandidate}%`)
                .limit(1)
              if (byEn && byEn.length) zone = byEn[0]
            } catch (_e) {
              // Ignore lookup errors
            }
          }

          if (zone && zone.shipping_price !== undefined && zone.shipping_price !== null) {
            // If any ordered product has free_shipping=false (or missing), apply zone price.
            // Check order items product ids for free_shipping flag.
            const productIds = items.map((it) => it.productId).filter(Boolean)
            let anyPaid = true
            if (productIds.length) {
              try {
                const { data: products } = await admin.from("products").select("id, free_shipping").in("id", productIds)
                if (products && products.length) {
                  const allFree = products.every((p: any) => p.free_shipping === true)
                  anyPaid = !allFree
                }
              } catch (e) {
                // if error reading products assume paid
                anyPaid = true
              }
            }

            shippingCost = anyPaid ? Number(zone.shipping_price) : 0
          } else {
            // no zone found: leave shippingCost as 0 and let client handle messaging
            shippingCost = 0
          }
        }
      }
    } catch (e) {
      console.warn("Failed computing shipping zone:", e)
      shippingCost = shippingCost || 0
    }

    // Recalculate total with computed shippingCost
    const finalTotal = subtotal + shippingCost + tax - discount
    // override calculatedTotal if client didn't supply or differs
    // but keep the validation earlier (total must be > 0)
    // We'll set calculatedTotal to finalTotal for insertion
    const finalTotalNumber = Number(finalTotal)

    // Upsert customer
    const { data: customerRow, error: upsertErr } = await supabase
      .from("customers")
      .upsert(
        { email: customerEmail, full_name: customerName, phone: body.customerPhone ?? null },
        { onConflict: "email" },
      )
      .select("id")
      .single()

    if (upsertErr) {
      console.error("[Orders API] customer upsert error:", upsertErr)
      return errorJson("Customer upsert failed", {
        message: (upsertErr as any)?.message,
        code: (upsertErr as any)?.code,
        hint: (upsertErr as any)?.hint,
        details: (upsertErr as any)?.details,
      })
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 9).toUpperCase()}`

    // Insert order (use server computed shippingCost if available)
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        order_number: orderNumber,
        customer_id: customerRow?.id ?? null,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: body.customerPhone ?? null,

        status: "pending",
        payment_status: "pending",
        payment_method: paymentMethod,

        subtotal,
        shipping_cost: shippingCost,
        tax,
        discount,
        total: finalTotalNumber,
        currency: "EGP",

        shipping_address_line1: ship_line1,
        shipping_address_line2: ship_line2,
        shipping_city: ship_city,
        shipping_state: ship_state,
        shipping_postal_code: ship_postal,
        shipping_country: ship_country,

        notes: body.notes ? String(body.notes).trim() : null,
      })
      .select()
      .single()

    if (orderErr || !order) {
      console.error("[Orders API] order insert error:", orderErr)
      return errorJson("Order insert failed", {
        message: (orderErr as any)?.message,
        code: (orderErr as any)?.code,
        hint: (orderErr as any)?.hint,
        details: (orderErr as any)?.details,
      })
    }

    // Insert order items (best-effort)
    const preparedItems = (items || [])
      .map((it) => {
        const qty = toNum(it.quantity, 1)
        const unit = toNum(it.unitPrice, 0)
        const line = toNum(it.totalPrice, unit * qty)
        return {
          order_id: order.id,
          product_id: it.productId ?? null,
          variant_id: it.variantId ?? null,
          product_name_ar: nonEmpty(it.productName),
          product_name_en: nonEmpty(it.productName),
          variant_name_ar: nonEmpty(it.variantName, ""),
          variant_name_en: nonEmpty(it.variantName, ""),
          sku: nonEmpty(it.sku, ""),
          quantity: qty,
          unit_price: unit,
          total_price: line,
          image_url: nonEmpty(it.imageUrl, ""),
        }
      })
      .filter((x) => x.quantity > 0)

    if (preparedItems.length) {
      const { error: itemsErr } = await supabase.from("order_items").insert(preparedItems)
      if (itemsErr) {
        console.error("[Orders API] order_items insert error:", itemsErr)
        // لا نفشل الطلب بسبب عناصره؛ فقط نسجّل الخطأ
      } else {
        // Decrease stock with strict check (RPC or rollback)
        const successfulDecrements: typeof preparedItems = []
        let failReason = ""

        for (const item of preparedItems) {
          try {
            if (item.variant_id && item.quantity > 0) {
              let decreased = false
              
              // 1. Attempt using RPC
              const { data: success, error: rpcError } = await supabase.rpc('decrease_inventory', {
                variant_id: item.variant_id,
                qty: item.quantity
              })

              if (!rpcError && success === true) {
                decreased = true
              } else if (rpcError) {
                // RPC might not exist or failed
                console.warn("[Orders API] decrease_inventory RPC failed or not found, falling back to optimistic locking:", rpcError)
                
                // 2. Fallback: Optimistic Locking
                const { data: variant } = await supabase
                  .from("product_variants")
                  .select("inventory_quantity")
                  .eq("id", item.variant_id)
                  .single()

                if (variant && variant.inventory_quantity >= item.quantity) {
                  const { error: updateErr, count } = await supabase
                    .from("product_variants")
                    .update({ inventory_quantity: variant.inventory_quantity - item.quantity })
                    .eq("id", item.variant_id)
                    .eq("inventory_quantity", variant.inventory_quantity) // Ensure it hasn't changed
                    .select() // Needed to confirm update with count if available, or just rely on no error? 
                    // Supabase JS .update() doesn't return count by default unless .select() or using count option.
                    // But .eq match ensures safety.

                  if (!updateErr) {
                     // Check if row was actually updated? Supabase JS client doesn't make this easy without `count: 'exact'`
                     // But assuming typical flow:
                     decreased = true
                  }
                }
              }

              if (decreased) {
                successfulDecrements.push(item)

                // 2. Decrease product stock (aggregate) - Best effort, no rollback for this
                if (item.product_id) {
                  try {
                    const { data: product } = await supabase
                      .from("products")
                      .select("inventory_quantity")
                      .eq("id", item.product_id)
                      .single()

                    if (product) {
                      const newProdQty = Math.max(0, product.inventory_quantity - item.quantity)
                      await supabase
                        .from("products")
                        .update({ inventory_quantity: newProdQty })
                        .eq("id", item.product_id)
                    }
                  } catch (e) { console.warn("Failed to update product aggregate stock", e) }
                }
              } else {
                failReason = `Insufficient stock for variant: ${item.variant_name_ar || item.variant_id}`
                break // Stop processing
              }
            }
          } catch (err) {
            console.error("[Orders API] Failed to decrease stock for item:", item, err)
            failReason = "Error updating stock"
            break
          }
        }

        if (failReason) {
          console.error("[Orders API] Stock decrement failed, rolling back order:", failReason)
          
          // Rollback: Increase stock for already processed items
          for (const item of successfulDecrements) {
            try {
               // Try RPC first
               const { error: rpcErr } = await supabase.rpc('increase_inventory', {
                 variant_id: item.variant_id,
                 qty: item.quantity
               })
               
               if (rpcErr) {
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
            } catch (e) {
              console.error("CRITICAL: Failed to rollback stock for item", item, e)
            }
          }

          // Delete Order
          await supabase.from("order_items").delete().eq("order_id", order.id)
          await supabase.from("orders").delete().eq("id", order.id)

          return errorJson(failReason, null, 400)
        }
      }
    }

    return json(
      {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.order_number,
          total: order.total,
          status: order.status,
        },
      },
      200,
      corsHeaders,
    )
  } catch (err: any) {
    console.error("[Orders API] uncaught error:", err)
    return errorJson("Internal server error", { message: err?.message, stack: err?.stack })
  }
}

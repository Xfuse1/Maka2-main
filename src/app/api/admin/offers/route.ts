import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient, getStoreIdFromRequest } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient()
    const storeId = await getStoreIdFromRequest()
    
    const { data, error } = await supabase
      .from('payment_offers')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ offers: data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payment_method, discount_value, discount_type = 'percentage', is_active = false, start_date, end_date, min_order_amount } = body
    const supabase = getSupabaseAdminClient()
    const storeId = await getStoreIdFromRequest()

    // Basic validation
    if (!payment_method) return NextResponse.json({ error: 'payment_method required' }, { status: 400 })
    if (typeof discount_value !== 'number') return NextResponse.json({ error: 'discount_value must be number' }, { status: 400 })

    // If setting active true, deactivate other active offers for same payment method in this store
    if (is_active) {
      await (supabase.from('payment_offers').update as any)({ is_active: false })
        .eq('payment_method', payment_method)
        .eq('store_id', storeId)
    }

    const payload: any = {
      store_id: storeId,
      payment_method: String(payment_method),
      discount_value: Number(discount_value) || 0,
      discount_type: String(discount_type || 'percentage'),
      is_active: !!is_active,
      start_date: start_date ? new Date(start_date).toISOString() : null,
      end_date: end_date ? new Date(end_date).toISOString() : null,
      min_order_amount: min_order_amount != null ? Number(min_order_amount) : null,
    }

    // Remove null values
    Object.keys(payload).forEach((k) => {
      if (payload[k] === null) delete payload[k]
    })
    // Keep store_id even if null check passed
    payload.store_id = storeId

    const { data, error } = await (supabase.from('payment_offers').insert as any)([payload]).select().single()
    if (error) {
      console.error('[Offers API] insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ offer: data })
  } catch (err: any) {
    console.error('[Offers API] uncaught error:', err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

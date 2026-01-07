import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase.from('payment_offers').select('*').order('created_at', { ascending: false })
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

    // Basic validation
    if (!payment_method) return NextResponse.json({ error: 'payment_method required' }, { status: 400 })
    if (typeof discount_value !== 'number') return NextResponse.json({ error: 'discount_value must be number' }, { status: 400 })

    // If setting active true, deactivate other active offers for same payment method
    // Ensure admin client has real credentials (avoid silent placeholder client)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Offers API] missing SUPABASE env vars')
      return NextResponse.json({ error: 'Server misconfiguration: missing Supabase admin credentials' }, { status: 500 })
    }

    if (is_active) {
      await (supabase.from('payment_offers').update as any)({ is_active: false }).eq('payment_method', payment_method).neq('id', null)
    }

    // Sanitize payload fields
    const payload: any = {
      payment_method: String(payment_method),
      discount_value: Number(discount_value) || 0,
      discount_type: String(discount_type || 'percentage'),
      is_active: !!is_active,
      start_date: start_date ? new Date(start_date).toISOString() : null,
      end_date: end_date ? new Date(end_date).toISOString() : null,
      min_order_amount: min_order_amount != null ? Number(min_order_amount) : null,
    }

    // Remove keys that are null/undefined to avoid inserting columns that may not exist
    Object.keys(payload).forEach((k) => {
      if (payload[k] === null || payload[k] === undefined) delete payload[k]
    })

    const insertPayload: any[] = [payload]
    const { data, error } = await (supabase.from('payment_offers').insert as any)(insertPayload).select().single()
    if (error) {
      console.error('[Offers API] insert error code:', (error as any)?.code, 'message:', (error as any)?.message)
      return NextResponse.json({ error: error.message || error }, { status: 500 })
    }
    if (error) {
      console.error('[Offers API] insert error:', error)
      return NextResponse.json({ error: error.message || error }, { status: 500 })
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ offer: data })
  } catch (err: any) {
    console.error('[Offers API] uncaught error:', err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

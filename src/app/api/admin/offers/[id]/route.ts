import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = getSupabaseAdminClient()

    if (body.is_active) {
      // deactivate other offers for same payment method
      if (body.payment_method) {
        await (supabase.from('payment_offers').update as any)({ is_active: false }).eq('payment_method', body.payment_method).neq('id', id)
      }
    }

    const updatePayload: any = body
    Object.keys(updatePayload).forEach((k) => {
      if (updatePayload[k] === null || updatePayload[k] === undefined) delete updatePayload[k]
    })
    const { data, error } = await (supabase.from('payment_offers').update as any)(updatePayload).eq('id', id).select().single()
    if (error) {
      console.error('[Offers API PATCH] update error:', error)
      return NextResponse.json({ error: error.message || error }, { status: 500 })
    }
    return NextResponse.json({ offer: data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.from('payment_offers').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

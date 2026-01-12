import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient, getStoreIdFromRequest } from "@/lib/supabase/admin"

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = getSupabaseAdminClient()
    const storeId = await getStoreIdFromRequest()

    // Prevent changing store_id
    delete body.store_id

    if (body.is_active && body.payment_method) {
      // Deactivate other offers for same payment method in this store
      await (supabase.from('payment_offers').update as any)({ is_active: false })
        .eq('payment_method', body.payment_method)
        .eq('store_id', storeId)
        .neq('id', id)
    }

    const { data, error } = await (supabase.from('payment_offers').update as any)(body)
      .eq('id', id)
      .eq('store_id', storeId)
      .select()
      .single()
      
    if (error) {
      console.error('[Offers API PATCH] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
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
    const storeId = await getStoreIdFromRequest()
    
    const { error } = await supabase
      .from('payment_offers')
      .delete()
      .eq('id', id)
      .eq('store_id', storeId)
      
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

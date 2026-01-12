import { NextResponse } from 'next/server'
import { createAdminClient, getStoreIdFromRequest } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient() as any
    const storeId = await getStoreIdFromRequest()
    
    const { data, error } = await supabase
      .from('payment_offers')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      
    if (error) {
      console.error('[payment-offers] GET error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('[payment-offers] GET exception:', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}

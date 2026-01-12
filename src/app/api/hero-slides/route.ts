import { NextResponse } from 'next/server'
import { createAdminClient, getStoreIdFromRequest } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient() as any
    const storeId = await getStoreIdFromRequest()
    
    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      
    if (error) {
      console.error('[hero-slides] GET error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('[hero-slides] GET exception:', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}

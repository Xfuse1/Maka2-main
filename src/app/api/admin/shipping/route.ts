import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient() as any
    const { data, error } = await supabase.from('shipping_zones').select('*').order('governorate_name_en')
    if (error) {
      console.error('[admin/shipping] GET error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('[admin/shipping] GET exception:', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createAdminClient() as any
    const { data, error } = await supabase.from('shipping_zones').insert([body]).select().single()
    if (error) {
      console.error('[admin/shipping] POST error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('[admin/shipping] POST exception:', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const supabase = createAdminClient() as any
    const { data, error } = await supabase.from('shipping_zones').update(updates).eq('id', id).select().single()
    if (error) {
      console.error('[admin/shipping] PATCH error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('[admin/shipping] PATCH exception:', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const supabase = createAdminClient() as any
    const { error } = await supabase.from('shipping_zones').delete().eq('id', id)
    if (error) {
      console.error('[admin/shipping] DELETE error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[admin/shipping] DELETE exception:', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}

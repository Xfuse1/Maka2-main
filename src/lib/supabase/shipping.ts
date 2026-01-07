import { getSupabaseBrowserClient } from "./client"
import { getAdminClient } from "./admin"

export type ShippingZone = {
  id: string
  governorate_code: string
  governorate_name_ar: string
  governorate_name_en: string
  shipping_price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getAllShippingZones(): Promise<ShippingZone[]> {
  try {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.from("shipping_zones").select("*").order("governorate_name_en")
    if (error) {
      console.error("[shipping] getAllShippingZones error:", error)
      return []
    }
    return (data || []) as any
  } catch (err) {
    console.error("[shipping] getAllShippingZones exception:", err)
    return []
  }
}

export async function getShippingZoneByCode(code: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("shipping_zones").select("*").eq("governorate_code", code).single()
  if (error) {
    return null
  }
  return data as ShippingZone
}

export async function createShippingZone(zone: Partial<ShippingZone>) {
  const res = await fetch('/api/admin/shipping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(zone),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `HTTP ${res.status}`)
  }
  const json = await res.json()
  return json.data as ShippingZone
}

export async function updateShippingZone(id: string, updates: Partial<ShippingZone>) {
  const res = await fetch('/api/admin/shipping', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `HTTP ${res.status}`)
  }
  const json = await res.json()
  return json.data as ShippingZone
}

export async function deleteShippingZone(id: string) {
  const res = await fetch(`/api/admin/shipping?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `HTTP ${res.status}`)
  }
  return true
}

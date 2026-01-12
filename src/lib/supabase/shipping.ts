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
    // Use API route that filters by store_id automatically
    const res = await fetch('/api/admin/shipping')
    if (!res.ok) {
      console.error("[shipping] getAllShippingZones error: HTTP", res.status)
      return []
    }
    const json = await res.json()
    return (json.data || []) as ShippingZone[]
  } catch (err) {
    console.error("[shipping] getAllShippingZones exception:", err)
    return []
  }
}

export async function getShippingZoneByCode(code: string) {
  try {
    // Use API route that filters by store_id
    const res = await fetch('/api/admin/shipping')
    if (!res.ok) return null
    const json = await res.json()
    const zones = json.data || []
    return zones.find((z: ShippingZone) => z.governorate_code === code) || null
  } catch {
    return null
  }
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

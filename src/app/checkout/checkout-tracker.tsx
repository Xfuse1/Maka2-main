"use client"

export function CheckoutTracker({
  items,
  total,
  currency = "EGP",
  user,
}: {
  items: Array<{
    id: string
    name?: string
    price?: number
    quantity?: number
    category?: string
    slug?: string
    product?: {
      id: string
      name?: string
      price?: number
      category?: { name_ar: string }
    }
    color?: { name: string }
    size?: string
  }>
  total: number
  currency?: string
  user?: { id?: string; name?: string | null; email?: string | null }
}) {
  // Tracking removed
  return null
}

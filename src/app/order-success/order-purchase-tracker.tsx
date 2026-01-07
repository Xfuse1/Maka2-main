"use client"

interface PurchaseTrackerProps {
  orderId: string
  totalValue: number
  currency?: string
  userName?: string | null
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
}

export function PurchaseTracker(props: PurchaseTrackerProps) {
  // Tracking removed
  return null
}

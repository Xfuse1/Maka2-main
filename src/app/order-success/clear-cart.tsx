"use client"

import { useEffect } from "react"
import { useCartStore } from "@/store/cart-store"

/**
 * This component clears the cart when rendered on the order success page.
 * It handles the case where Kashier redirects back after payment.
 */
export function ClearCartOnSuccess() {
  const clearCart = useCartStore((state) => state.clearCart)
  const items = useCartStore((state) => state.items)

  useEffect(() => {
    // Only clear if there are items in the cart
    if (items.length > 0) {
      clearCart()
    }
  }, [clearCart, items.length])

  return null
}

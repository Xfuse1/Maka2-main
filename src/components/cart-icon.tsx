'use client'

import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { useCartStore } from "@/store/cart-store"

export function CartIcon() {
  const items = useCartStore((state) => state.items)
  const cartCount = items.reduce((total, item) => total + item.quantity, 0)

  return (
    <Link
      href="/cart"
      className="relative p-2 hover:bg-secondary/50 rounded-md transition-colors flex-shrink-0"
      aria-label="Shopping cart"
    >
      <ShoppingBag className="h-6 w-6 text-foreground" />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </Link>
  )
}

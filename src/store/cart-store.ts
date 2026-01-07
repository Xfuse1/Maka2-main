import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Product {
  id: string
  name: string
  price: number
  image?: string
  product_images?: Array<{ image_url: string }>
  free_shipping?: boolean
}

export interface Color {
  name: string
  hex: string
}

export interface CartItem {
  product: Product
  color: Color
  size: string
  quantity: number
  variantId?: string // Add variantId to store
}

const toNum = (v: unknown, fallback = 0): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, color: Color, size: string, quantity: number, variantId?: string) => void
  removeItem: (productId: string, colorName: string, size: string) => void
  updateQuantity: (productId: string, colorName: string, size: string, quantity: number) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product, color: Color, size: string, quantity: number, variantId?: string) => {
        const safeQuantity = Math.max(1, Math.floor(toNum(quantity, 1)))
        const safePrice = toNum(product.price, 0)

        set((state: CartStore) => {
          const idx = state.items.findIndex(
            (it: CartItem) => it.product.id === product.id && it.color.name === color.name && it.size === size
          )

          if (idx > -1) {
            const items = [...state.items]
            const currentQty = toNum(items[idx].quantity, 1)
            items[idx] = {
              ...items[idx],
              // اجمع الكمية بأمان
              quantity: Math.max(1, Math.floor(currentQty + safeQuantity)),
              // لو السعر كان غلط سابقًا—صحّحه
              product: { ...items[idx].product, price: safePrice } as Product,
              variantId: variantId || items[idx].variantId // Update variantId if provided
            }
            return { items }
          }

          // عنصر جديد
          return {
            items: [
              ...state.items,
              {
                product: { ...product, price: safePrice } as Product,
                color,
                size,
                quantity: safeQuantity,
                variantId
              },
            ],
          }
        })
      },

      removeItem: (productId: string, colorName: string, size: string) => {
        set((state: CartStore) => ({
          items: state.items.filter(
            (it: CartItem) => !(it.product.id === productId && it.color.name === colorName && it.size === size)
          ),
        }))
      },

      updateQuantity: (productId: string, colorName: string, size: string, quantity: number) => {
        const safeQuantity = Math.max(1, Math.floor(toNum(quantity, 1)))
        set((state: CartStore) => ({
          items: state.items.map((it: CartItem) =>
            it.product.id === productId && it.color.name === colorName && it.size === size
              ? { ...it, quantity: safeQuantity }
              : it
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      getTotalPrice: () => {
        return get().items.reduce((total: number, it: CartItem) => {
          const price = toNum(it.product.price, 0)
          const qty = Math.max(0, Math.floor(toNum(it.quantity, 0)))
          return total + price * qty
        }, 0)
      },

      getTotalItems: () => {
        return get().items.reduce((total: number, it: CartItem) => total + Math.max(0, Math.floor(toNum(it.quantity, 0))), 0)
      },
    }),
    {
      name: "mecca-cart-storage",
    }
  )
)

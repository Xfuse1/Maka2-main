"use client"

import { useEffect, useState } from "react"
import { useCartStore } from "@/store/cart-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getAllShippingZones, type ShippingZone } from "@/lib/supabase/shipping"

export default function CartPage() {
  const router = useRouter()
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice())
  const clearCart = useCartStore((state) => state.clearCart)
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([])
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [shippingCost, setShippingCost] = useState<number>(0)
  const handleCheckout = () => {
    // Navigate to checkout page (to be implemented)
    router.push("/checkout")
  }

  // Effects: load shipping zones and compute shipping cost.
  // Placed here (before any early returns) to keep Hooks order stable.
  useEffect(() => {
    // Load shipping zones for governorate-based shipping costs
    let mounted = true
    ;(async () => {
      try {
        const zones = await getAllShippingZones()
        if (!mounted) return
        setShippingZones(zones)
        if (zones && zones.length) {
          // default to first zone if not set
          setSelectedZone((prev) => prev ?? zones[0].governorate_code)
        }
      } catch (e) {
        console.error("[cart] failed to load shipping zones:", e)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Recompute shipping cost when items or selected zone change
  useEffect(() => {
    // Determine if any item requires paid shipping.
    const hasPaidShipping = items.some((it) => {
      const p = it.product as any
      // prefer explicit shipping_type/shipping_cost fields, fall back to free_shipping flag
      if (p?.shipping_type === "paid") return true
      if (Number(p?.shipping_cost || 0) > 0) return true
      if (p?.free_shipping === false) return true
      return false
    })

    // If no item requires paid shipping -> free
    if (!hasPaidShipping) {
      setShippingCost(0)
      return
    }

    // Otherwise use governorate zone price (if selected)
    if (selectedZone) {
      const zone = shippingZones.find((z) => z.governorate_code === selectedZone)
      const cost = zone ? Number(zone.shipping_price || 0) : 0
      setShippingCost(cost)
      return
    }

    // fallback: if no zone selected, shipping cost unknown -> 0
    setShippingCost(0)
  }, [items, selectedZone, shippingZones])

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">سلة التسوق فارغة</h2>
            <p className="text-muted-foreground text-lg">لم تقومي بإضافة أي منتجات بعد</p>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link href="/">
                <ShoppingBag className="h-5 w-5 ml-2" />
                ابدئي التسوق الآن
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-foreground">سلة التسوق</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={clearCart}
                className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                إفراغ السلة
              </Button>
            </div>

            {items.map((item) => (
              <Card key={`${item.product.id}-${item.color.name}-${item.size}`} className="border-2 border-border">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Product Image */}
                    <div className="relative w-24 h-32 sm:w-32 sm:h-40 flex-shrink-0 rounded-lg overflow-hidden bg-muted border-2 border-border">
                      <Image
                        src={item.product.image || item.product.product_images?.[0]?.image_url || "/placeholder.svg"}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-foreground mb-2">{item.product.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span>اللون:</span>
                              <div
                                className="w-5 h-5 rounded-full border-2 border-border"
                                style={{ backgroundColor: item.color.hex || "#000" }}
                                title={item.color.name}
                              />
                              <span>{item.color.name}</span>
                            </div>
                            <div>
                              <span>المقاس: </span>
                              <span className="font-medium text-foreground">{item.size}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.product.id, item.color.name, item.size)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.color.name,
                                item.size,
                                Math.max(1, item.quantity - 1),
                              )
                            }
                            disabled={item.quantity <= 1}
                            className="h-10 w-10 border-2 border-border"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-lg font-bold text-foreground w-12 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              updateQuantity(item.product.id, item.color.name, item.size, item.quantity + 1)
                            }
                            className="h-10 w-10 border-2 border-border"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Price */}
                        <div className="text-left">
                          <p className="text-2xl font-bold text-primary">{item.product.price * item.quantity} ج.م</p>
                          {item.quantity > 1 && (
                            <p className="text-sm text-muted-foreground">{item.product.price} ج.م للقطعة</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-border sticky top-24">
              <CardContent className="p-6 space-y-6">
                <h3 className="text-2xl font-bold text-foreground">ملخص الطلب</h3>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-lg">
                    <span className="text-muted-foreground">المجموع الفرعي</span>
                    <span className="font-bold text-foreground">{getTotalPrice} ج.م</span>
                  </div>
                   
                </div>

                <Separator />

                <div className="flex items-center justify-between text-2xl">
                  <span className="font-bold text-foreground">الإجمالي</span>
                  <span className="font-bold text-primary">{getTotalPrice} ج.م</span>
                </div>

                <Button
                  onClick={handleCheckout}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-lg py-6 relative"
                >
                  <ShoppingBag className="h-5 w-5 ml-2" />
                  إتمام الطلب
                  {items.length > 0 && <span className="absolute -top-2 -left-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{items.length}</span>}
                </Button>
                {/* زر متابعة طلباتي */}
                <Button
                  asChild
                  size="lg"
                  className="w-full mt-4 bg-secondary hover:bg-secondary/90 text-lg py-6"
                >
                  <Link href="/orders">
                    متابعة طلباتي
                  </Link>
                </Button>

                <div className="bg-primary/5 rounded-lg p-4 border-2 border-primary/20">
                  <p className="text-sm text-center text-muted-foreground">
                    ✨ شحن مجاني لجميع الطلبات
                    <br />🔒 الدفع آمن ومضمون
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}

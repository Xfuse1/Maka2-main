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
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <SiteHeader />

        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center space-y-8">
            <div className="relative">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center">
                <ShoppingBag className="h-16 w-16 text-primary/60" />
              </div>
              <div className="absolute -top-2 -right-2 w-full h-full">
                <div className="w-32 h-32 mx-auto border-2 border-dashed border-primary/20 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-foreground">سلة التسوق فارغة</h2>
              <p className="text-muted-foreground text-lg">لم تقومي بإضافة أي منتجات بعد</p>
            </div>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all px-8">
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-background border-b">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="container mx-auto px-4 py-8 relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">سلة التسوق</h1>
              <p className="text-muted-foreground mt-1">{items.length} منتج في السلة</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCart}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 bg-white/80 backdrop-blur-sm"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              إفراغ السلة
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <Card 
                key={`${item.product.id}-${item.color.name}-${item.size}`} 
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
              >
                <CardContent className="p-0">
                  <div className="flex gap-4 md:gap-6 p-4 md:p-6">
                    {/* Product Image */}
                    <div className="relative w-24 h-32 sm:w-32 sm:h-40 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 group">
                      <Image
                        src={item.product.image || item.product.product_images?.[0]?.image_url || "/placeholder.svg"}
                        alt={item.product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
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
            <Card className="border-0 shadow-xl sticky top-24 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
              <CardContent className="p-6 space-y-6">
                <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  ملخص الطلب
                </h3>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-lg">
                    <span className="text-muted-foreground">المجموع الفرعي</span>
                    <span className="font-bold text-foreground">{getTotalPrice.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                   
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between text-2xl bg-gradient-to-r from-primary/5 to-primary/10 -mx-6 px-6 py-4">
                  <span className="font-bold text-foreground">الإجمالي</span>
                  <span className="font-bold text-primary">{getTotalPrice.toLocaleString('ar-EG')} ج.م</span>
                </div>

                <Button
                  onClick={handleCheckout}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-lg py-6 shadow-lg hover:shadow-xl transition-all relative group"
                >
                  <ShoppingBag className="h-5 w-5 ml-2 group-hover:scale-110 transition-transform" />
                  إتمام الطلب
                  {items.length > 0 && <span className="absolute -top-2 -left-2 bg-white text-primary text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">{items.length}</span>}
                </Button>
                {/* زر متابعة طلباتي */}
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full text-lg py-6 border-2 hover:bg-primary/5"
                >
                  <Link href="/orders">
                    <ArrowRight className="h-5 w-5 ml-2" />
                    متابعة طلباتي
                  </Link>
                </Button>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex flex-col gap-2 text-sm text-center">
                    <span className="flex items-center justify-center gap-2 text-green-700">
                      <span>✨</span> شحن مجاني لجميع الطلبات
                    </span>
                    <span className="flex items-center justify-center gap-2 text-green-700">
                      <span>🔒</span> الدفع آمن ومضمون
                    </span>
                  </div>
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

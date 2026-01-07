"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CreditCard, Wallet, Truck } from "lucide-react"

import { useCartStore } from "@/store/cart-store"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { CheckoutTracker } from "./checkout-tracker"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

// تحويل مضمون للأرقام
const toNum = (v: unknown, fallback = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [uiError, setUiError] = useState<string | null>(null)

  const paymentMethods = [
    { id: "cod", name: "الدفع عند الاستلام", description: "ادفع نقداً عند استلام طلبك", icon: Wallet },
    { id: "cashier", name: "الدفع الإلكتروني - كاشير", description: "الدفع الآمن عبر البطاقات الإلكترونية", icon: CreditCard },
  ]

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    paymentMethod: "cod",
    notes: "",
  })

  const [shippingZones, setShippingZones] = useState<any[]>([])
  const [selectedZoneCode, setSelectedZoneCode] = useState<string | null>(null)
  const [zoneQuery, setZoneQuery] = useState<string>("")
  const [showZoneDropdown, setShowZoneDropdown] = useState<boolean>(false)
  const [paymentOffers, setPaymentOffers] = useState<any[]>([])

  const subtotal = useMemo(() => {
    const fromStore = toNum(getTotalPrice(), NaN)
    if (!Number.isNaN(fromStore)) return fromStore
    return items.reduce((sum, it: any) => sum + toNum(it?.product?.price, 0) * toNum(it?.quantity, 0), 0)
  }, [getTotalPrice, items])

  // Fetch active payment offers
  useEffect(() => {
    const fetchOffers = async () => {
      const { data } = await supabase.from('payment_offers').select('*').eq('is_active', true)
      if (data) setPaymentOffers(data)
    }
    fetchOffers()
  }, [])

  // Derived state for active offer
  const activeOffer = useMemo(() => {
    if (!formData.paymentMethod) return null
    const pm = formData.paymentMethod.toLowerCase()
    return paymentOffers.find(o => {
      const opm = o.payment_method.toLowerCase()
      if (opm === pm) return true
      if ((pm === 'cashier' && opm === 'kashier') || (pm === 'kashier' && opm === 'cashier')) return true
      if ((pm === 'cod' && opm === 'cash_on_delivery') || (pm === 'cash_on_delivery' && opm === 'cod')) return true
      return false
    })
  }, [paymentOffers, formData.paymentMethod])

  const discountInfo = useMemo(() => {
    if (!activeOffer) return { amount: 0, percentage: 0 }
    const type = activeOffer.discount_type || 'percentage'
    const value = Number(activeOffer.discount_value) || 0
    let amount = 0
    if (type === 'percentage') {
      amount = subtotal * (value / 100)
    } else {
      amount = value
    }
    return { amount, percentage: value }
  }, [activeOffer, subtotal])

  // Fetch shipping zones for governorate-based shipping
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/admin/shipping')
        if (!res.ok) return
        const json = await res.json()
        // API returns array of zones or { data: [...] }
        const zones = Array.isArray(json) ? json : json?.data ?? json?.zones ?? []
        if (!mounted) return
        setShippingZones(zones)
        if (zones.length && !selectedZoneCode) {
          // try to match existing form state by governorate name (arabic/en), otherwise pick first
          const matched = zones.find((z: any) => {
            const nameAr = String(z.governorate_name_ar ?? z.name ?? "").trim()
            const nameEn = String(z.governorate_name_en ?? "").trim()
            return nameAr === String(formData.state).trim() || nameEn === String(formData.state).trim()
          })
          const pick = matched ? matched : zones[0]
          const pickCode = pick.governorate_code ?? pick.code ?? pick.id
          setSelectedZoneCode(pickCode)
          // set initial query to the selected zone's Arabic name if available
          setZoneQuery(String(pick.governorate_name_ar ?? pick.governorate_name_en ?? pick.name ?? ""))
        }
      } catch (e) {
        // silent
        console.error('Failed to load shipping zones', e)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Calculate shipping cost based on selected governorate and free_shipping flag
  const shippingCost = useMemo(() => {
    // If cart is empty, no shipping
    if (!items || items.length === 0) return 0

    // If every product in the cart has free_shipping true -> shipping 0
    const allFree = items.every((it: any) => Boolean(it?.product?.free_shipping))
    if (allFree) return 0

    // Otherwise, find selected zone and use its shipping_price (fixed per order)
    const zone = shippingZones.find((z) => String(z.governorate_code ?? z.code ?? z.id) === String(selectedZoneCode))
    if (!zone) return 0
    return toNum(zone.shipping_price, 0)
  }, [items, shippingZones, selectedZoneCode])

  const selectedZone = shippingZones.find((z) => String(z.governorate_code ?? z.code ?? z.id) === String(selectedZoneCode))

  const total = Math.max(0, toNum(subtotal) + toNum(shippingCost) - discountInfo.amount)

  // helper to resolve various possible image shapes (string or object)
  const resolveImageSrc = (img: any) => {
    if (!img) return null
    if (typeof img === "string") return img
    if (typeof img === "object") {
      if (typeof img.image_url === "string") return img.image_url
      if (typeof img.url === "string") return img.url
      if (typeof img.src === "string") return img.src
    }
    return null
  }

  const getItemImage = (item: any) => {
    // Try product.image (string), product.product_images[0] (object), color.images[0], then fallback
    return (
      resolveImageSrc(item?.product?.image) ||
      resolveImageSrc(item?.product?.product_images?.[0]) ||
      resolveImageSrc(item?.color?.images?.[0]) ||
      "/placeholder.svg?height=400&width=400"
    )
  }

  const validateBeforeSubmit = () => {
    if (!items.length) return "السلة فارغة."
    if (!formData.customerName.trim()) return "من فضلك أدخِل الاسم الكامل."
    // Email is optional now
    // Phone is required and must be an Egyptian number
    if (!formData.customerPhone.trim()) return "من فضلك أدخِل رقم الهاتف."
    const isEgyptianPhone = (phone: string) => {
      if (!phone) return false
      const digitsOnly = phone.replace(/[^0-9+]/g, "")
      // remove leading + if present for checking
      const cleaned = digitsOnly.startsWith("+") ? digitsOnly.slice(1) : digitsOnly
      // Accept formats:
      // - Local: 01XXXXXXXXX  (11 digits, starts with 01)
      // - International: 20XXXXXXXXXX (12 digits, starts with 20) or 0020XXXXXXXXXX (13 digits)
      if (/^01\d{9}$/.test(cleaned)) return true
      if (/^20\d{10}$/.test(cleaned)) return true
      if (/^0020\d{10}$/.test(cleaned)) return true
      return false
    }

    if (!isEgyptianPhone(String(formData.customerPhone).trim()))
      return "من فضلك أدخِل رقم هاتف مصري صالح (مثال: 01012345678 أو +201012345678)."
    if (!formData.addressLine1.trim()) return "من فضلك أدخِل العنوان (السطر الأول)."
    if (!formData.city.trim()) return "من فضلك أدخِل المدينة."
    if (!formData.state.trim()) return "من فضلك أدخِل المحافظة."
    if (!(total > 0)) return "الإجمالي غير صالح. تأكد من الأسعار والكمية."
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUiError(null)

    const validationMsg = validateBeforeSubmit()
    if (validationMsg) {
      setUiError(validationMsg)
      return
    }

    setIsProcessing(true)
    try {
      // جهّز عناصر الطلب
      const orderItems = items.map((item: any) => {
        const price = toNum(item?.product?.price, 0)
        const qty = toNum(item?.quantity, 0)
        const productName = String(item?.product?.name ?? "")
        const colorName = String(item?.color?.name ?? "")
        const sizeName = String(item?.size ?? "")
        return {
          productId: item?.product?.id ?? null,
          variantId: item.variantId ?? item.variantId ?? null,
          productName,
          variantName: `${colorName}${sizeName ? ` - ${sizeName}` : ""}`,
          sku: `${item?.product?.id ?? "SKU"}-${colorName}-${sizeName}`,
          quantity: qty,
          unitPrice: price,
          totalPrice: price * qty,
          imageUrl: getItemImage(item),
        }
      })

      const orderPayload = {
        customerEmail: formData.customerEmail.trim(),
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        items: orderItems,
        subtotal: toNum(subtotal, 0),
        shippingCost: toNum(shippingCost, 0),
        tax: 0,
        discount: toNum(discountInfo.amount, 0),
        total: toNum(total, 0),
        paymentMethod: formData.paymentMethod,
        shippingAddress: {
          line1: formData.addressLine1.trim(),
          line2: formData.addressLine2.trim(),
          city: formData.city.trim(),
          // prefer sending zone code, fallback to free-text state name
          state: (selectedZoneCode ?? formData.state.trim()),
          postalCode: formData.postalCode.trim(),
          country: "EG",
        },
        notes: formData.notes.trim(),
        // send active offer id as a separate field (do NOT tuck it into notes)
        offerId: activeOffer?.id ?? null,
      }

      // 1. إنشاء الطلب
      const orderResponse = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      })

      const orderText = await orderResponse.text()

      let orderResult: any
      try {
        orderResult = JSON.parse(orderText)
      } catch (e) {
        console.error("[Checkout] Failed to parse order response:", e)
        throw new Error(`Server returned invalid response: ${orderText.slice(0, 200)}`)
      }

      if (!orderResponse.ok || !orderResult?.success) {
        throw new Error(orderResult?.error || `Order creation failed (${orderResponse.status})`)
      }

      // 2. الدفع الإلكتروني (إذا تم اختياره)
      if (formData.paymentMethod === "cashier") {
        const paymentPayload = {
          orderId: orderResult.order.id,
          amount: toNum(total, 0),
          currency: "EGP",
          paymentMethod: "cashier",
          customerEmail: formData.customerEmail.trim(),
          customerName: formData.customerName.trim(),
          customerPhone: formData.customerPhone.trim(),
        }

        // Payment API call
        const paymentResponse = await fetch("/api/payment/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentPayload),
        })

        const paymentText = await paymentResponse.text()

        let paymentResult: any
        try {
          paymentResult = JSON.parse(paymentText)
        } catch (e) {
          console.error("[Checkout] Failed to parse payment response:", e)
          throw new Error(`Payment API returned invalid response: ${paymentText.slice(0, 200)}`)
        }

        if (!paymentResponse.ok) {
          throw new Error(paymentResult?.error || `Payment creation failed (${paymentResponse.status})`)
        }

        if (!paymentResult?.success) {
          throw new Error(paymentResult?.error || "Payment creation failed")
        }

        if (paymentResult?.paymentUrl) {
          // Don't set isProcessing to false - we're redirecting
          window.location.href = paymentResult.paymentUrl
          return
        } else {
          throw new Error("Payment URL not found in response")
        }
      }

      // 3. الدفع عند الاستلام - نجاح مباشر
      clearCart()
      router.push(`/order-success?orderNumber=${orderResult.order.orderNumber}`)
      
    } catch (err: any) {
      console.error("[Checkout] Error:", err)
      const errorMessage = err?.message || "حدث خطأ أثناء معالجة طلبك"
      setUiError(errorMessage)
      alert(errorMessage)
      setIsProcessing(false)
    }
    // Note: No finally block - isProcessing stays true during redirect
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />

        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">السلة فارغة</h2>
          <p className="text-muted-foreground mb-8">لا توجد منتجات في سلة التسوق</p>
          <Button asChild>
            <Link href="/">العودة للتسوق</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <CheckoutTracker
        items={items.map((item: any) => ({
          id: item.product?.id || "unknown",
          name: item.product?.name,
          price: item.product?.price,
          quantity: item.quantity,
          product: item.product,
          color: item.color,
          size: item.size,
        }))}
        total={total}
        currency="EGP"
        user={undefined} // No user auth available in this scope yet
      />
      <SiteHeader />

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">إتمام الطلب</h1>

        {uiError ? (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            {uiError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>معلومات العميل</CardTitle>
                  <CardDescription>أدخل بياناتك الشخصية</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">الاسم الكامل *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="أدخل اسمك الكامل"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">البريد الإلكتروني *</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        placeholder="example@email.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customerPhone">رقم الهاتف *</Label>
                      <Input
                        id="customerPhone"
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        placeholder="01234567890"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    عنوان الشحن
                  </CardTitle>
                  <CardDescription>أدخل عنوان التوصيل</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="addressLine1">العنوان (السطر الأول) *</Label>
                    <Input
                      id="addressLine1"
                      value={formData.addressLine1}
                      onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                      placeholder="رقم المبنى، اسم الشارع"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressLine2">العنوان (السطر الثاني)</Label>
                    <Input
                      id="addressLine2"
                      value={formData.addressLine2}
                      onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                      placeholder="الحي، المنطقة"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">المدينة *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="القاهرة"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">المحافظة *</Label>
                      {shippingZones && shippingZones.length > 0 ? (
                        <div className="relative">
                          <input
                            id="state"
                            autoComplete="off"
                            className="w-full rounded-md border bg-input px-3 py-2"
                            placeholder="ابحث عن المحافظة"
                            value={zoneQuery}
                            onChange={(e) => {
                              const v = e.target.value
                              setZoneQuery(v)
                              setShowZoneDropdown(true)
                              // if user cleared the input, clear the selected zone as well
                              if (String(v).trim() === "") {
                                setSelectedZoneCode(null)
                                setFormData({ ...formData, state: "" })
                              }
                            }}
                            onFocus={() => setShowZoneDropdown(true)}
                            required
                          />

                          {showZoneDropdown && (
                            <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-auto rounded-md border bg-white shadow">
                              {shippingZones
                                .filter((z: any) => {
                                  const q = String(zoneQuery || "").trim().toLowerCase()
                                  const name = String(z.governorate_name_ar ?? z.governorate_name_en ?? z.name ?? "").toLowerCase()
                                  return !q || name.includes(q)
                                })
                                .map((z: any) => (
                                  <div
                                    key={z.id ?? z.governorate_code ?? z.code ?? z.governorate_name_ar}
                                    onMouseDown={(ev) => ev.preventDefault()}
                                    onClick={() => {
                                      const code = z.governorate_code ?? z.code ?? z.id
                                      setSelectedZoneCode(String(code))
                                      setFormData({ ...formData, state: String(z.governorate_name_ar ?? z.governorate_name_en ?? z.name) })
                                      setZoneQuery(String(z.governorate_name_ar ?? z.governorate_name_en ?? z.name))
                                      setShowZoneDropdown(false)
                                    }}
                                    className="px-3 py-2 hover:bg-accent/30 cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>{z.governorate_name_ar ?? z.governorate_name_en ?? z.name}</span>
                                      <span className="text-sm text-muted-foreground">{toNum(z.shipping_price, 0)} ج</span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          placeholder="القاهرة"
                          required
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postalCode">الرمز البريدي</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        placeholder="12345"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">ملاحظات إضافية</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="أي ملاحظات خاصة بالطلب"
                    />
                  </div>
                </CardContent>
              </Card>

             <Card>
  <CardHeader>
    <CardTitle>طريقة الدفع</CardTitle>
    <CardDescription>اختر طريقة الدفع المفضلة</CardDescription>
  </CardHeader>

  <CardContent>
    <RadioGroup
      value={formData.paymentMethod}
      onValueChange={(value) =>
        setFormData(prev => ({ ...prev, paymentMethod: value }))
      }
    >
      {paymentMethods.map((method) => {
        const Icon = method.icon

        return (
          <Label
            key={method.id}
            htmlFor={method.id}
            className="block border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value={method.id} id={method.id} />

              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1">
                <div className="font-semibold">{method.name}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {method.description}
                </p>

                {activeOffer && method.id === formData.paymentMethod && (
                  <p className="mt-2 text-sm text-green-600 font-medium">
                    وفر {activeOffer.discount_value}% عند الدفع باستخدام {method.name}
                  </p>
                )}
              </div>
            </div>
          </Label>
        )
      })}
    </RadioGroup>
  </CardContent>
</Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>ملخص الطلب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map((item: any, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                          <Image
                                src={getItemImage(item)}
                            alt={item?.product?.name || "product"}
                            fill
                            className="object-cover"
                            sizes="64px"
                            loading={index < 3 ? "eager" : "lazy"}
                            quality={75}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item?.product?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item?.color?.name} - {item?.size}
                          </p>
                          <p className="text-sm">
                            {toNum(item?.quantity, 0)} × {toNum(item?.product?.price, 0)} جنيه
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">المجموع الفرعي</span>
                      <span>{toNum(subtotal, 0)} جنيه</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">الشحن</span>
                      <span>
                        {selectedZone ? (
                          <span>
                            {(selectedZone.governorate_name_ar ?? selectedZone.governorate_name_en ?? selectedZone.name)} — {toNum(shippingCost, 0)} جنيه
                          </span>
                        ) : (
                          <span>{toNum(shippingCost, 0)} جنيه</span>
                        )}
                      </span>
                    </div>
                    
                    {discountInfo.amount > 0 && (
                      <div className="flex justify-between text-sm text-green-600 font-medium">
                        <span>
                          خصم {activeOffer?.payment_method === 'kashier' || activeOffer?.payment_method === 'cashier' ? 'الدفع الإلكتروني' : 'عرض الدفع'}
                          {' '}({activeOffer?.discount_value}%)
                        </span>
                        <span>-{toNum(discountInfo.amount, 0).toFixed(2)} جنيه</span>
                      </div>
                    )}

                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>الإجمالي</span>
                      <span>{toNum(total, 0)} جنيه</span>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
                    {isProcessing ? "جاري المعالجة..." : <>إتمام الطلب <ArrowRight className="mr-2 h-4 w-4" /></>}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    بالضغط على "إتمام الطلب"، أنت توافق على شروط الاستخدام وسياسة الخصوصية
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
      <SiteFooter />
    </div>
  )
}

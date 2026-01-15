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

  const allPaymentMethods = [
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
  const [kashierEnabled, setKashierEnabled] = useState(false)

  const subtotal = useMemo(() => {
    const fromStore = toNum(getTotalPrice(), NaN)
    if (!Number.isNaN(fromStore)) return fromStore
    return items.reduce((sum, it: any) => sum + toNum(it?.product?.price, 0) * toNum(it?.quantity, 0), 0)
  }, [getTotalPrice, items])

  // Fetch payment methods status (kashier enabled)
  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        const res = await fetch('/api/payment-methods-status')
        if (!res.ok) return
        const json = await res.json()
        setKashierEnabled(json.kashier_enabled ?? false)
      } catch (e) {
        console.error('Failed to load payment methods status:', e)
      }
    }
    fetchPaymentStatus()
  }, [])

  // Filtered payment methods based on settings
  const paymentMethods = useMemo(() => {
    return allPaymentMethods.filter(method => {
      if (method.id === "cashier") {
        return kashierEnabled
      }
      return true
    })
  }, [kashierEnabled])

  // Fetch active payment offers (via API for store isolation)
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch('/api/payment-offers')
        if (!res.ok) return
        const json = await res.json()
        if (json.data) setPaymentOffers(json.data)
      } catch (e) {
        console.error('Failed to load payment offers:', e)
      }
    }
    fetchOffers()
  }, [])

  // Reset payment method if cashier is disabled but was selected
  useEffect(() => {
    if (!kashierEnabled && formData.paymentMethod === "cashier") {
      setFormData(prev => ({ ...prev, paymentMethod: "cod" }))
    }
  }, [kashierEnabled, formData.paymentMethod])

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
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
        <SiteHeader />

        <div className="container mx-auto px-4 py-20 text-center">
          <Card className="max-w-md mx-auto p-12 border-0 shadow-2xl rounded-3xl bg-white/80 backdrop-blur-sm">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Wallet className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-bold mb-4">السلة فارغة</h2>
            <p className="text-muted-foreground mb-8">لا توجد منتجات في سلة التسوق</p>
            <Button asChild className="rounded-xl px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all">
              <Link href="/">العودة للتسوق</Link>
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
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

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-background py-12 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 right-20 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-40 h-40 bg-primary/15 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">إتمام الطلب</h1>
            <p className="text-muted-foreground text-lg">أكملي بياناتك لإتمام عملية الشراء</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {uiError ? (
          <div className="mb-8 rounded-2xl border-0 bg-red-50 p-6 text-red-600 shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <p className="font-bold text-lg">حدث خطأ</p>
              <p>{uiError}</p>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-6">
                  <CardTitle className="text-xl">معلومات العميل</CardTitle>
                  <CardDescription>أدخل بياناتك الشخصية</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="customerName" className="font-medium">الاسم الكامل *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="أدخل اسمك الكامل"
                      required
                      className="border-0 bg-muted/50 rounded-xl h-12 focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail" className="font-medium">البريد الإلكتروني *</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        placeholder="example@email.com"
                        required
                        className="border-0 bg-muted/50 rounded-xl h-12 focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customerPhone" className="font-medium">رقم الهاتف *</Label>
                      <Input
                        id="customerPhone"
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        placeholder="01234567890"
                        required
                        className="border-0 bg-muted/50 rounded-xl h-12 focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    عنوان الشحن
                  </CardTitle>
                  <CardDescription>أدخل عنوان التوصيل</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="addressLine1" className="font-medium">العنوان (السطر الأول) *</Label>
                    <Input
                      id="addressLine1"
                      value={formData.addressLine1}
                      onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                      placeholder="رقم المبنى، اسم الشارع"
                      required
                      className="border-0 bg-muted/50 rounded-xl h-12 focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressLine2" className="font-medium">العنوان (السطر الثاني)</Label>
                    <Input
                      id="addressLine2"
                      value={formData.addressLine2}
                      onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                      placeholder="الحي، المنطقة"
                      className="border-0 bg-muted/50 rounded-xl h-12 focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="font-medium">المدينة *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="القاهرة"
                        required
                        className="border-0 bg-muted/50 rounded-xl h-12 focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state" className="font-medium">المحافظة *</Label>
                      {shippingZones && shippingZones.length > 0 ? (
                        <div className="relative">
                          <input
                            id="state"
                            autoComplete="off"
                            className="w-full rounded-xl border-0 bg-muted/50 px-4 py-3 h-12 focus:ring-2 focus:ring-primary outline-none"
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
                            <div className="absolute left-0 right-0 z-50 mt-2 max-h-56 overflow-auto rounded-2xl border-0 bg-white shadow-2xl">
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
                                    className="px-4 py-3 hover:bg-primary/10 cursor-pointer transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">{z.governorate_name_ar ?? z.governorate_name_en ?? z.name}</span>
                                      <span className="text-sm text-primary font-bold">{toNum(z.shipping_price, 0)} ج</span>
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
                          className="border-0 bg-muted/50 rounded-xl h-12 focus:ring-2 focus:ring-primary"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postalCode" className="font-medium">الرمز البريدي</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        placeholder="12345"
                        className="border-0 bg-muted/50 rounded-xl h-12 focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="font-medium">ملاحظات إضافية</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="أي ملاحظات خاصة بالطلب"
                      className="border-0 bg-muted/50 rounded-xl h-12 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </CardContent>
              </Card>

             <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-white">
  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-6">
    <CardTitle className="text-xl">طريقة الدفع</CardTitle>
    <CardDescription>اختر طريقة الدفع المفضلة</CardDescription>
  </CardHeader>

  <CardContent className="p-6">
    <RadioGroup
      value={formData.paymentMethod}
      onValueChange={(value) =>
        setFormData(prev => ({ ...prev, paymentMethod: value }))
      }
      className="space-y-4"
    >
      {paymentMethods.map((method) => {
        const Icon = method.icon
        const isSelected = formData.paymentMethod === method.id

        return (
          <Label
            key={method.id}
            htmlFor={method.id}
            className={`block border-2 rounded-2xl p-5 transition-all duration-300 cursor-pointer ${
              isSelected 
                ? 'border-primary bg-primary/5 shadow-lg' 
                : 'border-border/50 hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            <div className="flex items-start gap-4">
              <RadioGroupItem value={method.id} id={method.id} className="mt-1" />

              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                isSelected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
              }`}>
                <Icon className="w-6 h-6" />
              </div>

              <div className="flex-1">
                <div className="font-bold text-lg">{method.name}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {method.description}
                </p>

                {activeOffer && method.id === formData.paymentMethod && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
                    <span>🎉</span>
                    وفر {activeOffer.discount_value}% عند الدفع باستخدام {method.name}
                  </div>
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
              <Card className="sticky top-24 border-0 shadow-2xl rounded-3xl overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-6">
                  <CardTitle className="text-xl">ملخص الطلب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
                  <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                    {items.map((item: any, index) => (
                      <div key={index} className="flex gap-4 p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                          <Image
                                src={getItemImage(item)}
                            alt={item?.product?.name || "product"}
                            fill
                            className="object-cover"
                            sizes="80px"
                            loading={index < 3 ? "eager" : "lazy"}
                            quality={75}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{item?.product?.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item?.color?.name} - {item?.size}
                          </p>
                          <p className="text-sm mt-2 text-primary font-bold">
                            {toNum(item?.quantity, 0)} × {toNum(item?.product?.price, 0)} جنيه
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-border/30" />

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">المجموع الفرعي</span>
                      <span className="font-medium">{toNum(subtotal, 0)} جنيه</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">الشحن</span>
                      <span className="font-medium">
                        {selectedZone ? (
                          <span className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">({selectedZone.governorate_name_ar ?? selectedZone.governorate_name_en ?? selectedZone.name})</span>
                            {toNum(shippingCost, 0)} جنيه
                          </span>
                        ) : (
                          <span>{toNum(shippingCost, 0)} جنيه</span>
                        )}
                      </span>
                    </div>
                    
                    {discountInfo.amount > 0 && (
                      <div className="flex justify-between text-sm bg-green-50 text-green-700 p-3 rounded-xl font-medium">
                        <span className="flex items-center gap-2">
                          <span>🎉</span>
                          خصم {activeOffer?.payment_method === 'kashier' || activeOffer?.payment_method === 'cashier' ? 'الدفع الإلكتروني' : 'عرض الدفع'}
                          {' '}({activeOffer?.discount_value}%)
                        </span>
                        <span>-{toNum(discountInfo.amount, 0).toFixed(2)} جنيه</span>
                      </div>
                    )}

                    <Separator className="bg-border/30" />
                    <div className="flex justify-between font-bold text-xl pt-2">
                      <span>الإجمالي</span>
                      <span className="text-primary">{toNum(total, 0)} جنيه</span>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full rounded-2xl py-7 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]" 
                    size="lg" 
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        جاري المعالجة...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        إتمام الطلب
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
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

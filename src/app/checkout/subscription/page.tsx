"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Loader2, 
  Check, 
  CreditCard,
  Shield,
  Store,
  AlertCircle,
  ArrowRight
} from "lucide-react"
import Link from "next/link"

interface PlanDetails {
  id: string
  name: string
  name_en: string
  price: number
  duration_days: number
  features: string[]
}

interface StoreDetails {
  id: string
  store_name: string
  subdomain: string
}

function SubscriptionCheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const storeId = searchParams.get("store_id")
  const planId = searchParams.get("plan_id")
  
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<PlanDetails | null>(null)
  const [store, setStore] = useState<StoreDetails | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (!storeId || !planId) {
      setError("معلومات غير مكتملة. يرجى العودة وإعادة المحاولة.")
      setIsLoading(false)
      return
    }
    loadData()
  }, [storeId, planId])

  const loadData = async () => {
    try {
      // Load plan details
      const { data: planData, error: planError } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", planId)
        .single()

      if (planError || !planData) {
        setError("الباقة غير موجودة")
        setIsLoading(false)
        return
      }
      setPlan(planData)

      // Try to get store from sessionStorage
      const pendingStore = sessionStorage.getItem("pending_store")
      if (pendingStore) {
        const storeData = JSON.parse(pendingStore)
        if (storeData.store_id === storeId) {
          setStore({
            id: storeData.store_id,
            store_name: storeData.store_name,
            subdomain: storeData.subdomain,
          })
        }
      }

      // If not in sessionStorage, try to fetch from database
      if (!store) {
        const { data: storeData } = await supabase
          .from("stores")
          .select("id, store_name, subdomain")
          .eq("id", storeId)
          .single()

        if (storeData) {
          setStore(storeData)
        }
      }
    } catch (err) {
      console.error("Error loading data:", err)
      setError("حدث خطأ في تحميل البيانات")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch("/api/payment/subscription/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: storeId,
          plan_id: planId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "فشل في بدء عملية الدفع")
        setIsProcessing(false)
        return
      }

      // Redirect to Kashier payment page
      window.location.href = result.payment_url
    } catch (err) {
      console.error("Payment error:", err)
      setError("حدث خطأ في عملية الدفع")
      setIsProcessing(false)
    }
  }

  const formatDuration = (days: number) => {
    if (days === 14) return "14 يوم"
    if (days === 30) return "شهر واحد"
    if (days === 90) return "3 أشهر"
    if (days === 180) return "6 أشهر"
    if (days === 365) return "سنة كاملة"
    return `${days} يوم`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (error && !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">حدث خطأ</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button asChild variant="outline">
              <Link href="/create-store">العودة لإنشاء متجر</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💳 إتمام الاشتراك
          </h1>
          <p className="text-lg text-gray-600">
            أنت على بعد خطوة واحدة من إطلاق متجرك!
          </p>
        </div>

        <div className="grid gap-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-purple-600" />
                ملخص الطلب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {store && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{store.store_name}</p>
                    <p className="text-sm text-gray-500">
                      {store.subdomain}.{process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "xfuse.online"}
                    </p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                    في انتظار الدفع
                  </Badge>
                </div>
              )}

              {plan && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <p className="text-sm text-gray-500">
                        صالحة لمدة {formatDuration(plan.duration_days)}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-purple-600">
                        {plan.price.toLocaleString()} EGP
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-2">تشمل الباقة:</p>
                    <ul className="space-y-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <span className="font-semibold text-lg">الإجمالي</span>
                <span className="text-2xl font-bold text-purple-600">
                  {plan?.price.toLocaleString()} EGP
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                طرق الدفع المتاحة
              </CardTitle>
              <CardDescription>
                سيتم توجيهك لبوابة الدفع الآمنة Kashier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    VISA
                  </div>
                  <div className="w-12 h-8 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                    MC
                  </div>
                  <div className="w-12 h-8 bg-green-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    Meeza
                  </div>
                </div>
                <span className="text-sm text-gray-600">و محافظ إلكترونية</span>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              {error && (
                <div className="w-full bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                size="lg"
                className="w-full text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    جاري التوجيه للدفع...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 ml-2" />
                    ادفع {plan?.price.toLocaleString()} EGP
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                دفع آمن ومشفر 100%
              </div>
            </CardFooter>
          </Card>

          {/* Back Link */}
          <div className="text-center">
            <Link
              href="/create-store"
              className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-2 transition"
            >
              <ArrowRight className="w-4 h-4" />
              العودة لإنشاء متجر جديد
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    }>
      <SubscriptionCheckoutContent />
    </Suspense>
  )
}

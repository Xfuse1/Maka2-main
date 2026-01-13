"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Loader2, ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface SubscriptionPlan {
  id: string
  name: string
  name_en: string
  price: number
  duration_days: number
  features: string[]
  is_active: boolean
  is_default: boolean
}

function PlansContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const storeId = searchParams.get("store_id")

  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectingPlan, setSelectingPlan] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const loadData = async () => {
      if (!storeId) {
        setError("معرف المتجر مفقود")
        setLoading(false)
        return
      }

      try {
        // Load plans
        const plansResponse = await fetch("/api/subscription-plans")
        const plansData = await plansResponse.json()

        if (!plansResponse.ok || plansData.error) {
          setError("فشل تحميل الباقات")
          setLoading(false)
          return
        }

        setPlans(plansData.plans || [])

        // Load store info
        const { data: storeData, error: storeError } = await supabase
          .from("stores")
          .select("id, store_name, subdomain, status, subscription_status")
          .eq("id", storeId)
          .single()

        if (storeError) {
          setError("فشل تحميل بيانات المتجر")
        } else {
          setStore(storeData)
        }
      } catch (err) {
        console.error("Error loading data:", err)
        setError("حدث خطأ في تحميل البيانات")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [storeId])

  const handleSelectPlan = async (planId: string) => {
    setSelectingPlan(planId)

    try {
      // Initiate payment
      const paymentResponse = await fetch("/api/payment/subscription/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: storeId,
          plan_id: planId,
        }),
      })

      const paymentResult = await paymentResponse.json()

      if (!paymentResponse.ok) {
        setError(paymentResult.error || "فشل في إنشاء طلب الدفع")
        setSelectingPlan(null)
        return
      }

      // Redirect to payment
      if (paymentResult.payment_url) {
        window.location.href = paymentResult.payment_url
      } else {
        setError("لم نتمكن من الحصول على رابط الدفع")
        setSelectingPlan(null)
      }
    } catch (err) {
      console.error("Error initiating payment:", err)
      setError("حدث خطأ في بدء عملية الدفع")
      setSelectingPlan(null)
    }
  }

  const handleSkip = () => {
    // Redirect to admin dashboard with free plan status
    if (store?.subdomain) {
      const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "xfuse.online"
      const isLocalhost = platformDomain === "localhost" || window.location.hostname === "localhost"
      const protocol = isLocalhost ? "http" : "https"
      const port = isLocalhost ? ":3000" : ""
      const storeUrl = `${protocol}://${store.subdomain}.${platformDomain}${port}`
      window.location.href = `${storeUrl}/admin`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل الباقات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <Button variant="ghost" asChild>
            <Link href="/account" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              العودة
            </Link>
          </Button>
        </div>

        {/* Warning Alert */}
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">متجرك غير نشط حالياً</h3>
            <p className="text-sm text-yellow-800">
              متجرك <strong>{store?.store_name}</strong> تم إنشاؤه بنجاح، لكنه لا يزال غير نشر على الإنترنت. اختر باقة واشترك الآن لتفعيل متجرك والبدء في البيع.
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎯 اختر باقة الاشتراك
          </h1>
          <p className="text-lg text-gray-600">
            ادفع الآن لتفعيل متجرك والبدء في البيع
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        {plans.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  plan.is_default ? "ring-2 ring-purple-600 shadow-lg" : ""
                }`}
              >
                {plan.is_default && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-purple-600">الباقة الموصى بها</Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {plan.name_en}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.price === 0 ? "مجاني" : `${plan.price}ج.م`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-600">
                          / {plan.duration_days} يوم
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={selectingPlan !== null}
                    className={`w-full h-12 font-semibold ${
                      plan.is_default
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                    }`}
                  >
                    {selectingPlan === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        جاري المتابعة...
                      </>
                    ) : plan.price === 0 ? (
                      "تفعيل الباقة المجانية"
                    ) : (
                      "ادفع الآن"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">لا توجد باقات متاحة حالياً</p>
          </div>
        )}

        {/* Skip Button */}
        <div className="text-center">
          <Button variant="outline" onClick={handleSkip}>
            تخطي والذهاب للوحة التحكم
          </Button>
        </div>

        {/* Store Info */}
        {store && (
          <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">متجرك جاهز!</h3>
                <p className="text-sm text-blue-800 mb-2">
                  <strong>اسم المتجر:</strong> {store.store_name}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>الرابط:</strong> {store.subdomain}.xfuse.online
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PlansPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">جاري التحميل...</p>
          </div>
        </div>
      }
    >
      <PlansContent />
    </Suspense>
  )
}

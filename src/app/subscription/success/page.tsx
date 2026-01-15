"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  CheckCircle,
  Loader2,
  ExternalLink,
  Store,
  PartyPopper
} from "lucide-react"
import Link from "next/link"
import confetti from "canvas-confetti"

function SubscriptionSuccessContent() {
  const searchParams = useSearchParams()
  const storeId = searchParams.get("store_id")
  // Kashier sends our orderId in merchantOrderId, and their own orderId as orderId
  // So we need to check merchantOrderId first, then fall back to orderId
  const merchantOrderId = searchParams.get("merchantOrderId")
  const kashierOrderId = searchParams.get("orderId") // This might be Kashier's internal ID
  // Extract our orderId from merchantOrderId if available
  let orderId = merchantOrderId
  if (merchantOrderId && merchantOrderId.startsWith("P-")) {
    // Remove the P- prefix to get original orderId
    orderId = merchantOrderId.slice(2)
  } else if (!merchantOrderId && kashierOrderId && kashierOrderId.startsWith("SUB-")) {
    // Fallback to orderId if it looks like our format
    orderId = kashierOrderId
  }

  // Kashier sends paymentStatus in URL redirect
  const urlPaymentStatus = searchParams.get("paymentStatus")
  const transactionId = searchParams.get("transactionId")

  const [isLoading, setIsLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "success" | "failed" | "unknown">("unknown")
  const [store, setStore] = useState<{ store_name: string; subdomain: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("[SubscriptionSuccess] Page loaded, checking payment status...")
    console.log("[SubscriptionSuccess] Params:", {
      storeId,
      orderId,
      merchantOrderId,
      kashierOrderId,
      urlPaymentStatus,
      transactionId
    })
    checkPaymentStatus()
  }, [storeId, orderId])

  const checkPaymentStatus = async () => {
    console.log("[SubscriptionSuccess] Checking payment status...")

    if (!storeId || !orderId) {
      console.error("[SubscriptionSuccess] Missing params:", { storeId, orderId })
      setError("معلومات الدفع غير كاملة")
      setPaymentStatus("unknown")
      setIsLoading(false)
      return
    }

    try {
      // If Kashier says SUCCESS in URL, try to activate subscription directly
      if (urlPaymentStatus === "SUCCESS") {
        console.log("[SubscriptionSuccess] paymentStatus=SUCCESS in URL, activating subscription...")

        // Call API to activate subscription
        const activateResponse = await fetch("/api/payment/subscription/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store_id: storeId,
            orderId: orderId,
            transactionId: transactionId
          })
        })
        const activateResult = await activateResponse.json()
        console.log("[SubscriptionSuccess] Activate response:", activateResult)

        if (activateResponse.ok && activateResult.success) {
          setPaymentStatus("success")
          if (activateResult.store) setStore(activateResult.store)
          setIsLoading(false)
          // Trigger confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          })
          return
        }
        // If activation failed, fall through to regular status check
        console.log("[SubscriptionSuccess] Direct activation failed, checking status...")
      }

      // Regular status check via API
      console.log("[SubscriptionSuccess] Calling status API...")
      const response = await fetch(
        `/api/payment/subscription/status?store_id=${storeId}&orderId=${orderId}`
      )
      const result = await response.json()
      console.log("[SubscriptionSuccess] Status API response:", result)

      if (!response.ok) {
        console.error("Error checking subscription:", result.error)
        setError("لم نتمكن من التحقق من حالة الدفع")
        setPaymentStatus("unknown")
        setIsLoading(false)
        return
      }

      const { subscription, isPaymentConfirmed, store: storeData } = result

      if (!subscription) {
        console.error("Subscription not found:", { storeId, orderId })
        setError("لم نجد بيانات الدفع. قد لم يتم الدفع بعد.")
        setPaymentStatus("unknown")
        setIsLoading(false)
        return
      }

      if (isPaymentConfirmed) {
        setPaymentStatus("success")
        if (storeData) setStore(storeData)
        // Trigger confetti only on actual success
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })
      } else if (subscription.status === "pending" || subscription.status === "active") {
        // لم يتم التأكيد بعد - ننتظر webhook
        setPaymentStatus("pending")
        setError("جاري معالجة الدفع... قد يستغرق بضع ثوانٍ. يرجى عدم مغادرة الصفحة.")

        // Poll for status change
        const pollInterval = setInterval(async () => {
          const pollResponse = await fetch(
            `/api/payment/subscription/status?store_id=${storeId}&orderId=${orderId}`
          )
          const pollResult = await pollResponse.json()

          if (pollResult.isPaymentConfirmed) {
            clearInterval(pollInterval)
            setPaymentStatus("success")
            setError(null)
            if (pollResult.store) setStore(pollResult.store)
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            })
          }
        }, 3000)

        // Stop polling after 2 minutes
        setTimeout(() => clearInterval(pollInterval), 120000)
        setIsLoading(false)
        return
      } else if (subscription.status === "failed") {
        setPaymentStatus("failed")
        setError("فشل الدفع. يرجى المحاولة مرة أخرى.")
      } else {
        setPaymentStatus("unknown")
        setError(`حالة غير متوقعة: ${subscription.status}`)
      }

      setIsLoading(false)
    } catch (err) {
      console.error("Error checking payment status:", err)
      setError("حدث خطأ في التحقق من الدفع")
      setPaymentStatus("unknown")
      setIsLoading(false)
    }
  }

  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "xfuse.online"
  const storeUrl = store ? `https://${store.subdomain}.${platformDomain}` : null
  const adminUrl = storeUrl ? `${storeUrl}/admin` : null

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <Loader2 className="w-12 h-12 animate-spin text-green-600" />
      </div>
    )
  }

  // Show error/pending state if payment not confirmed
  if (paymentStatus !== "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white py-20 px-4" dir="rtl">
        <div className="max-w-xl mx-auto text-center">
          {paymentStatus === "pending" && (
            <>
              <div className="mb-8">
                <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="w-14 h-14 text-yellow-600 animate-spin" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                جاري معالجة الدفع... ⏳
              </h1>
            </>
          )}

          {paymentStatus === "failed" && (
            <>
              <div className="mb-8">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">❌</span>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-red-900 mb-4">
                فشل الدفع
              </h1>
            </>
          )}

          {paymentStatus === "unknown" && (
            <>
              <div className="mb-8">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">❓</span>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                تعذر التحقق من الدفع
              </h1>
            </>
          )}

          <p className="text-xl text-gray-600 mb-8">
            {error || "يرجى الانتظار..."}
          </p>

          <div className="flex flex-col gap-4">
            <Button onClick={checkPaymentStatus} className="bg-purple-600 hover:bg-purple-700">
              <Loader2 className="w-4 h-4 ml-2" />
              تحديث الحالة
            </Button>
            <Button asChild variant="outline">
              <Link href="/create-store">العودة لإنشاء متجر جديد</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Success state - payment confirmed
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-20 px-4" dir="rtl">
      <div className="max-w-xl mx-auto text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-14 h-14 text-green-600" />
          </div>
          <PartyPopper className="w-12 h-12 text-yellow-500 mx-auto animate-bounce" />
        </div>

        {/* Success Message */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          تم الدفع بنجاح! 🎉
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          تهانينا! تم تفعيل متجرك وأنت الآن جاهز للبدء
        </p>

        {/* Store Card */}
        {store && (
          <Card className="mb-8 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Store className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold">{store.store_name}</h2>
              </div>
              <p className="text-gray-500 mb-4">
                {store.subdomain}.{platformDomain}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <a href={adminUrl || "#"} target="_blank" rel="noopener noreferrer">
                    افتح لوحة التحكم
                    <ExternalLink className="w-4 h-4 mr-2" />
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={storeUrl || "#"} target="_blank" rel="noopener noreferrer">
                    معاينة المتجر
                    <ExternalLink className="w-4 h-4 mr-2" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Reference */}
        {orderId && (
          <p className="text-sm text-gray-500 mb-8">
            رقم العملية: <code className="bg-gray-100 px-2 py-1 rounded">{orderId}</code>
          </p>
        )}

        {/* Next Steps */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">الخطوات التالية:</h3>
            <ul className="text-right space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">1</span>
                <span>أضف منتجاتك الأولى من لوحة التحكم</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">2</span>
                <span>خصص تصميم متجرك (الألوان والشعار)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">3</span>
                <span>اضبط إعدادات الشحن وطرق الدفع</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">4</span>
                <span>شارك رابط متجرك وابدأ البيع!</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Help Link */}
        <p className="mt-8 text-sm text-gray-500">
          تحتاج مساعدة؟{" "}
          <Link href="/contact" className="text-purple-600 hover:underline">
            تواصل معنا
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  )
}

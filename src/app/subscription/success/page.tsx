"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
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
  const orderId = searchParams.get("orderId")
  
  const [isLoading, setIsLoading] = useState(true)
  const [store, setStore] = useState<{ store_name: string; subdomain: string } | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Trigger confetti on mount
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })

    loadStore()
  }, [])

  const loadStore = async () => {
    if (!storeId) {
      setIsLoading(false)
      return
    }

    try {
      const { data } = await supabase
        .from("stores")
        .select("store_name, subdomain")
        .eq("id", storeId)
        .single()

      if (data) {
        setStore(data)
      }
    } catch (err) {
      console.error("Error loading store:", err)
    } finally {
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

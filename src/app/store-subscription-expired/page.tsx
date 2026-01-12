"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  XCircle, 
  RefreshCw,
  ArrowRight
} from "lucide-react"

export default function StoreSubscriptionExpiredPage() {
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "xfuse.online"

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-20 px-4" dir="rtl">
      <div className="max-w-xl mx-auto text-center">
        {/* Warning Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-14 h-14 text-red-600" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          انتهى الاشتراك
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          انتهى اشتراك هذا المتجر. يرجى تجديد الاشتراك للاستمرار
        </p>

        {/* Action Card */}
        <Card className="mb-8 shadow-lg border-red-200">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">جدد اشتراكك الآن!</h2>
            <p className="text-gray-600 mb-6">
              متجرك وجميع بياناتك في أمان. قم بالتجديد للعودة للعمل فوراً
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <a href={`https://${platformDomain}/create-store`}>
                  <RefreshCw className="w-4 h-4 ml-2" />
                  تجديد الاشتراك
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={`https://${platformDomain}`}>
                  <ArrowRight className="w-4 h-4 ml-2" />
                  العودة للرئيسية
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">ماذا يحدث لبياناتي؟</h3>
            <ul className="text-right space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>جميع منتجاتك محفوظة بأمان</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>طلباتك السابقة وبيانات العملاء متاحة</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>نطاق متجرك محجوز لك</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">ℹ</span>
                <span>التجديد يعيد كل شيء فوراً</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact */}
        <p className="mt-8 text-sm text-gray-500">
          لديك استفسار؟{" "}
          <a href={`https://${platformDomain}/contact`} className="text-purple-600 hover:underline">
            تواصل معنا
          </a>
        </p>
      </div>
    </div>
  )
}

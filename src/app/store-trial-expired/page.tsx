"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  AlertTriangle, 
  CreditCard,
  ArrowRight
} from "lucide-react"

export default function StoreTrialExpiredPage() {
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "xfuse.online"

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-20 px-4" dir="rtl">
      <div className="max-w-xl mx-auto text-center">
        {/* Warning Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-14 h-14 text-orange-600" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          انتهت الفترة التجريبية
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          انتهت فترة التجربة المجانية لهذا المتجر
        </p>

        {/* Action Card */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">استمر في رحلتك!</h2>
            <p className="text-gray-600 mb-6">
              لا تفقد كل ما بنيته! قم بترقية اشتراكك الآن للاستمرار في البيع
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <a href={`https://${platformDomain}/create-store`}>
                  <CreditCard className="w-4 h-4 ml-2" />
                  ترقية الاشتراك
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

        {/* Benefits */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">لماذا الترقية؟</h3>
            <ul className="text-right space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>الحفاظ على جميع منتجاتك وبياناتك</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>دعم فني مميز على مدار الساعة</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>ميزات متقدمة للبيع والتسويق</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>تكامل مع بوابات الدفع</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact */}
        <p className="mt-8 text-sm text-gray-500">
          تحتاج مساعدة؟{" "}
          <a href={`https://${platformDomain}/contact`} className="text-purple-600 hover:underline">
            تواصل معنا
          </a>
        </p>
      </div>
    </div>
  )
}

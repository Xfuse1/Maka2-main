"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  XCircle, 
  Loader2, 
  RefreshCw,
  ArrowRight
} from "lucide-react"
import Link from "next/link"

function SubscriptionCancelContent() {
  const searchParams = useSearchParams()
  const storeId = searchParams.get("store_id")
  const orderId = searchParams.get("orderId")

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-20 px-4" dir="rtl">
      <div className="max-w-xl mx-auto text-center">
        {/* Cancel Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-14 h-14 text-red-600" />
          </div>
        </div>

        {/* Cancel Message */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          تم إلغاء عملية الدفع
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          لم يتم خصم أي مبلغ من حسابك
        </p>

        {/* Actions */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-gray-600 mb-6">
              لا تقلق! يمكنك إعادة محاولة الدفع في أي وقت لتفعيل متجرك
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {storeId && (
                <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Link href={`/checkout/subscription?store_id=${storeId}`}>
                    <RefreshCw className="w-4 h-4 ml-2" />
                    إعادة المحاولة
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href="/landing">
                  <ArrowRight className="w-4 h-4 ml-2" />
                  العودة للرئيسية
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Order Reference */}
        {orderId && (
          <p className="text-sm text-gray-500 mb-8">
            رقم العملية: <code className="bg-gray-100 px-2 py-1 rounded">{orderId}</code>
          </p>
        )}

        {/* Help */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">تواجه مشكلة في الدفع؟</h3>
            <p className="text-gray-600 text-sm mb-4">
              إذا كنت تواجه أي مشكلة في عملية الدفع، يمكنك:
            </p>
            <ul className="text-right space-y-1 text-sm text-gray-600">
              <li>• التأكد من بيانات البطاقة صحيحة</li>
              <li>• التأكد من توفر رصيد كافٍ</li>
              <li>• تجربة طريقة دفع أخرى</li>
              <li>• التواصل مع فريق الدعم</li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact Link */}
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

export default function SubscriptionCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    }>
      <SubscriptionCancelContent />
    </Suspense>
  )
}

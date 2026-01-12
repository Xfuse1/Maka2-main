"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  CreditCard, 
  Clock,
  ArrowRight,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

export default function StorePendingPaymentPage() {
  const [storeInfo, setStoreInfo] = useState<{
    subdomain: string;
    store_id: string;
  } | null>(null)

  useEffect(() => {
    // Try to extract info from URL
    const hostname = window.location.hostname
    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "xfuse.online"
    const subdomain = hostname.replace(`.${platformDomain}`, "").replace(".localhost", "")
    
    if (subdomain && subdomain !== hostname) {
      setStoreInfo({ subdomain, store_id: "" })
    }
  }, [])

  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "xfuse.online"

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white py-20 px-4" dir="rtl">
      <div className="max-w-xl mx-auto text-center">
        {/* Pending Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-14 h-14 text-yellow-600" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          المتجر في انتظار الدفع
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          يجب إتمام عملية الدفع لتفعيل هذا المتجر
        </p>

        {/* Action Card */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <CreditCard className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold">إتمام الاشتراك</h2>
            </div>
            <p className="text-gray-600 mb-6">
              لتفعيل متجرك والبدء في البيع، يرجى إتمام عملية الدفع
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <a href={`https://${platformDomain}/create-store`}>
                  <CreditCard className="w-4 h-4 ml-2" />
                  إتمام الدفع
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
            <h3 className="font-semibold text-gray-900 mb-2">هل أنت صاحب هذا المتجر؟</h3>
            <p className="text-gray-600 text-sm mb-4">
              إذا كنت قد أنشأت هذا المتجر ولم تكمل عملية الدفع، يمكنك:
            </p>
            <ul className="text-right space-y-1 text-sm text-gray-600">
              <li>• تسجيل الدخول لحسابك</li>
              <li>• إتمام عملية الدفع من لوحة التحكم</li>
              <li>• أو إنشاء متجر جديد بباقة مجانية</li>
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

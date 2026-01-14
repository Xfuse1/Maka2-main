"use client"

import { AlertCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function StorePendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4" dir="rtl">
      <div className="max-w-md w-full text-center">
        <div className="bg-yellow-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <Clock className="w-10 h-10 text-yellow-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          المتجر غير نشط حالياً
        </h1>

        <p className="text-gray-600 mb-6">
          هذا المتجر معطّل مؤقتاً. يرجى التواصل مع إدارة المتجر للمزيد من المعلومات.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800 text-right">
              إذا كنت صاحب المتجر، يرجى تسجيل الدخول للوحة التحكم أو التواصل مع الدعم الفني.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/admin/login">
              تسجيل دخول الإدارة
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/landing">
              العودة للرئيسية
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

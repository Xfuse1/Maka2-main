"use client"

import { Ban, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function StoreSuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4" dir="rtl">
      <div className="max-w-md w-full text-center">
        <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <Ban className="w-10 h-10 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          المتجر معلّق
        </h1>

        <p className="text-gray-600 mb-6">
          تم تعليق هذا المتجر بسبب مخالفة الشروط والأحكام. يرجى التواصل مع الدعم الفني للمزيد من المعلومات.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 text-right">
              إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع فريق الدعم لمراجعة حالة متجرك.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
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

"use client"

import { XCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function StoreCancelledPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4" dir="rtl">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-gray-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          المتجر ملغى
        </h1>

        <p className="text-gray-600 mb-6">
          تم إلغاء هذا المتجر من قبل صاحبه. إذا كنت صاحب المتجر وتريد إعادة تفعيله، يرجى التواصل مع الدعم الفني.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 text-right">
              هل تريد إنشاء متجر جديد؟ يمكنك البدء الآن مجاناً!
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Link href="/create-store">
              إنشاء متجر جديد
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

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

export default function CreateStorePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)

  const [formData, setFormData] = useState({
    storeName: "",
    subdomain: "",
    email: "",
    phone: "",
    description: "",
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // دالة للتحقق من صلاحية subdomain (أحرف وأرقام فقط، بدون مسافات أو رموز)
  const isValidSubdomain = (subdomain: string): boolean => {
    const regex = /^[a-z0-9-]+$/
    return regex.test(subdomain) && subdomain.length >= 3 && subdomain.length <= 30
  }

  // دالة للتحقق من توفر subdomain
  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!isValidSubdomain(subdomain)) {
      setSubdomainAvailable(false)
      return
    }

    setCheckingSubdomain(true)
    
    try {
      // استخدام الدالة المساعدة من قاعدة البيانات
      const { data, error } = await supabase.rpc("is_subdomain_available", {
        subdomain_input: subdomain,
      })

      if (error) {
        console.error("Error checking subdomain:", error)
        setSubdomainAvailable(null)
        return
      }

      setSubdomainAvailable(data as boolean)
    } catch (err) {
      console.error("Unexpected error:", err)
      setSubdomainAvailable(null)
    } finally {
      setCheckingSubdomain(false)
    }
  }

  // معالجة تغيير subdomain
  const handleSubdomainChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, "")
    setFormData({ ...formData, subdomain: cleaned })
    
    // التحقق من توفر subdomain بعد 500ms من التوقف عن الكتابة
    if (cleaned.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkSubdomainAvailability(cleaned)
      }, 500)
      
      return () => clearTimeout(timeoutId)
    } else {
      setSubdomainAvailable(null)
    }
  }

  // معالجة إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // التحقق من تسجيل الدخول
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("يجب تسجيل الدخول أولاً")
        router.push("/auth?redirect=/create-store")
        return
      }

      // التحقق من صحة البيانات
      if (!formData.storeName || !formData.subdomain || !formData.email) {
        setError("يرجى ملء جميع الحقول المطلوبة")
        setIsLoading(false)
        return
      }

      if (!isValidSubdomain(formData.subdomain)) {
        setError("اسم النطاق غير صالح. استخدم أحرف صغيرة وأرقام وشرطات فقط")
        setIsLoading(false)
        return
      }

      if (subdomainAvailable === false) {
        setError("اسم النطاق محجوز بالفعل")
        setIsLoading(false)
        return
      }

      // إنشاء المتجر
      const response = await fetch("/api/stores/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          store_name: formData.storeName,
          subdomain: formData.subdomain,
          slug: formData.subdomain, // نفس subdomain كـ slug
          email: formData.email,
          phone: formData.phone || null,
          description: formData.description || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "فشل في إنشاء المتجر")
        setIsLoading(false)
        return
      }

      // تحديث role للمستخدم ليصبح store_owner
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role: "store_owner" })
        .eq("id", user.id)

      if (profileError) {
        console.error("Error updating profile role:", profileError)
      }

      // النجاح - إعادة توجيه لصفحة المتجر الجديد
      const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "makastore.com"
      const isLocalhost = platformDomain === "localhost" || window.location.hostname === "localhost"
      
      // بناء رابط المتجر (مع port للـ localhost)
      const protocol = isLocalhost ? "http" : "https"
      const port = isLocalhost ? ":3000" : ""
      const storeUrl = `${protocol}://${formData.subdomain}.${platformDomain}${port}`
      
      // إظهار رسالة نجاح
      alert(`تم إنشاء متجرك بنجاح!\n\nيمكنك الوصول إليه عبر:\n${storeUrl}\n\nسيتم إعادة توجيهك الآن...`)
      
      // إعادة توجيه للـ dashboard
      window.location.href = `${storeUrl}/dashboard`

    } catch (err) {
      console.error("Error creating store:", err)
      setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🚀 إنشاء متجر جديد
          </h1>
          <p className="text-lg text-gray-600">
            ابدأ متجرك الإلكتروني في دقائق وابدأ البيع فوراً
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white shadow-2xl rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* اسم المتجر */}
            <div>
              <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-2">
                اسم المتجر <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="storeName"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                placeholder="مثال: متجر الإلكترونيات"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>

            {/* Subdomain */}
            <div>
              <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-2">
                عنوان المتجر (Subdomain) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-reverse space-x-2">
                <input
                  type="text"
                  id="subdomain"
                  value={formData.subdomain}
                  onChange={(e) => handleSubdomainChange(e.target.value)}
                  placeholder="electronics"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[a-z0-9-]+"
                />
                <span className="text-gray-600 font-medium whitespace-nowrap">
                  .{process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "makastore.com"}
                </span>
              </div>
              
              {/* حالة التحقق من subdomain */}
              {checkingSubdomain && (
                <p className="mt-2 text-sm text-blue-600">⏳ جاري التحقق من توفر العنوان...</p>
              )}
              {!checkingSubdomain && subdomainAvailable === true && (
                <p className="mt-2 text-sm text-green-600">✅ العنوان متاح!</p>
              )}
              {!checkingSubdomain && subdomainAvailable === false && (
                <p className="mt-2 text-sm text-red-600">❌ العنوان محجوز بالفعل</p>
              )}
              
              <p className="mt-2 text-xs text-gray-500">
                استخدم أحرف إنجليزية صغيرة وأرقام وشرطات فقط (مثال: my-store-123)
              </p>
            </div>

            {/* البريد الإلكتروني */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="store@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>

            {/* رقم الهاتف */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف (اختياري)
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+20 123 456 7890"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* الوصف */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                وصف المتجر (اختياري)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="اكتب نبذة عن متجرك..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              />
            </div>

            {/* رسالة خطأ */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* زر الإرسال */}
            <button
              type="submit"
              disabled={isLoading || !subdomainAvailable || checkingSubdomain}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "⏳ جاري إنشاء المتجر..." : "🚀 إنشاء المتجر الآن"}
            </button>
          </form>

          {/* معلومات إضافية */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">✨ ماذا ستحصل عليه؟</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-center space-x-reverse space-x-2">
                <span>✅</span>
                <span>متجر إلكتروني كامل بعنوان خاص بك</span>
              </li>
              <li className="flex items-center space-x-reverse space-x-2">
                <span>✅</span>
                <span>لوحة تحكم متكاملة لإدارة المنتجات والطلبات</span>
              </li>
              <li className="flex items-center space-x-reverse space-x-2">
                <span>✅</span>
                <span>تخصيص كامل للألوان والشعار</span>
              </li>
              <li className="flex items-center space-x-reverse space-x-2">
                <span>✅</span>
                <span>باقة مجانية للبدء (10 منتجات، 50 طلب شهرياً)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

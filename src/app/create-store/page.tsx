"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Loader2,
  Check,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  Mail
} from "lucide-react"
import Link from "next/link"

function CreateStoreContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [formData, setFormData] = useState({
    storeName: "",
    subdomain: "",
    phone: "",
    description: "",
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          // User not authenticated, redirect to login with next parameter
          const nextParam = encodeURIComponent("/create-store")
          router.push(`/auth?next=${nextParam}`)
          return
        }

        // User is authenticated
        setUserEmail(user.email || "")
        setCheckingAuth(false)
      } catch (err) {
        console.error("Auth check error:", err)
        router.push("/auth")
      }
    }

    checkAuth()
  }, [router, supabase.auth])

  const isValidSubdomain = (subdomain: string): boolean => {
    const regex = /^[a-z0-9-]+$/
    return regex.test(subdomain) && subdomain.length >= 3 && subdomain.length <= 30
  }

  const checkSubdomainAvailability = useCallback(async (subdomain: string) => {
    if (!isValidSubdomain(subdomain)) {
      setSubdomainAvailable(false)
      return
    }

    setCheckingSubdomain(true)
    
    try {
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
  }, [supabase])

  const handleSubdomainChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, "")
    setFormData({ ...formData, subdomain: cleaned })
    setSubdomainAvailable(null)
  }

  // Check subdomain with debounce
  useEffect(() => {
    if (formData.subdomain.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkSubdomainAvailability(formData.subdomain)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [formData.subdomain, checkSubdomainAvailability])

  // معالجة إرسال النموذج وإنشاء المتجر مباشرة
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // التحقق من صحة البيانات
    if (!formData.storeName || !formData.subdomain) {
      setError("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    if (!isValidSubdomain(formData.subdomain)) {
      setError("اسم النطاق غير صالح. استخدم أحرف صغيرة وأرقام وشرطات فقط")
      return
    }

    if (subdomainAvailable === false) {
      setError("اسم النطاق محجوز بالفعل")
      return
    }

    setIsLoading(true)

    try {
      // إنشاء المتجر - لا نرسل كلمة مرور (المستخدم مسجل دخول بالفعل)
      // لا نرسل plan_id - سيتم اختيار الباقة في صفحة /subscription/plans
      const response = await fetch("/api/stores/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name: formData.storeName,
          subdomain: formData.subdomain,
          slug: formData.subdomain,
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

      console.log("[Create Store] Store created successfully, redirecting to plans page")

      // حفظ معلومات المتجر في sessionStorage
      sessionStorage.setItem("pending_store", JSON.stringify({
        store_id: result.store.id,
        store_name: formData.storeName,
        subdomain: formData.subdomain,
      }))

      // إعادة التوجيه لصفحة اختيار الخطة
      window.location.href = `/subscription/plans?store_id=${result.store.id}`

    } catch (err) {
      console.error("Error creating store:", err)
      setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى")
      setIsLoading(false)
    }
  }

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري التحقق من حسابك...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/landing" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition">
            <ArrowRight className="w-4 h-4" />
            العودة للرئيسية
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🚀 إنشاء متجر جديد
          </h1>
          <p className="text-lg text-gray-600">
            أدخل بيانات متجرك للبدء
          </p>
        </div>

        {/* Store Details Form */}
        <Card className="shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>بيانات المتجر</CardTitle>
                  <CardDescription>أدخل معلومات متجرك الجديد</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* اسم المتجر */}
                <div className="space-y-2">
                  <Label htmlFor="storeName">
                    اسم المتجر <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="storeName"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    placeholder="مثال: متجر الإلكترونيات"
                    required
                  />
                </div>

                {/* Subdomain */}
                <div className="space-y-2">
                  <Label htmlFor="subdomain">
                    عنوان المتجر (Subdomain) <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="subdomain"
                      value={formData.subdomain}
                      onChange={(e) => handleSubdomainChange(e.target.value)}
                      placeholder="my-store"
                      className="flex-1"
                      required
                      minLength={3}
                      maxLength={30}
                    />
                    <span className="text-gray-600 font-medium whitespace-nowrap">
                      .{process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "xfuse.online"}
                    </span>
                  </div>
                  
                  {/* حالة التحقق */}
                  {checkingSubdomain && (
                    <p className="text-sm text-blue-600 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري التحقق...
                    </p>
                  )}
                  {!checkingSubdomain && subdomainAvailable === true && (
                    <p className="text-sm text-green-600 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      العنوان متاح!
                    </p>
                  )}
                  {!checkingSubdomain && subdomainAvailable === false && (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      العنوان محجوز
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    استخدم أحرف إنجليزية صغيرة وأرقام وشرطات فقط
                  </p>
                </div>

                {/* البريد الإلكتروني - Read-Only */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    البريد الإلكتروني (مدير المتجر)
                  </Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      id="email"
                      value={userEmail || ""}
                      readOnly
                      className="pr-10 bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    هذا البريد الإلكتروني مرتبط بحسابك ولا يمكن تغييره هنا
                  </p>
                </div>

                {/* رقم الهاتف */}
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
                  <Input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+20 123 456 7890"
                  />
                </div>

                {/* الوصف */}
                <div className="space-y-2">
                  <Label htmlFor="description">وصف المتجر (اختياري)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="اكتب نبذة عن متجرك..."
                    rows={3}
                  />
                </div>

                {/* رسالة خطأ */}
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex items-center justify-between pt-4">
                  <Link href="/landing">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      إلغاء
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={!subdomainAvailable || checkingSubdomain || isLoading}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري الإنشاء...
                      </>
                    ) : (
                      <>
                        إنشاء المتجر
                        <ArrowLeft className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

        {/* معلومات إضافية */}
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-3">✨ ماذا ستحصل عليه؟</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              متجر إلكتروني كامل بعنوان خاص بك
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              لوحة تحكم متكاملة لإدارة المنتجات
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              تخصيص كامل للألوان والشعار
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              تكامل مع بوابات الدفع
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function CreateStorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    }>
      <CreateStoreContent />
    </Suspense>
  )
}

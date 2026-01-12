"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Store, 
  Loader2, 
  Check, 
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail
} from "lucide-react"
import Link from "next/link"

interface SubscriptionPlan {
  id: string
  name: string
  name_en: string
  price: number
  duration_days: number
  features: string[]
  is_active: boolean
  is_default: boolean
}

function CreateStoreContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedPlanId = searchParams.get("plan")
  
  const [step, setStep] = useState(1) // 1: اختيار الباقة, 2: بيانات المتجر
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(preselectedPlanId)
  
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    storeName: "",
    subdomain: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    description: "",
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Load plans on mount
  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      // Use API endpoint instead of direct Supabase query (bypasses RLS)
      const response = await fetch("/api/subscription-plans")
      const data = await response.json()

      if (!response.ok || data.error) {
        console.error("Error loading plans:", data.error)
        setError("فشل تحميل الباقات. يرجى التأكد من إعداد قاعدة البيانات بشكل صحيح.")
      } else if (data.plans) {
        setPlans(data.plans)
        // If no plan selected, select the default one
        if (!selectedPlanId) {
          const defaultPlan = data.plans.find((p: SubscriptionPlan) => p.is_default)
          if (defaultPlan) {
            setSelectedPlanId(defaultPlan.id)
          } else if (data.plans.length > 0) {
            setSelectedPlanId(data.plans[0].id)
          }
        }
      }
    } catch (error) {
      console.error("Error loading plans:", error)
      setError("حدث خطأ في تحميل الباقات")
    } finally {
      setLoadingPlans(false)
    }
  }

  // دالة للتحقق من صلاحية subdomain
  const isValidSubdomain = (subdomain: string): boolean => {
    const regex = /^[a-z0-9-]+$/
    return regex.test(subdomain) && subdomain.length >= 3 && subdomain.length <= 30
  }

  // دالة للتحقق من توفر subdomain
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

  // معالجة تغيير subdomain
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

  // معالجة إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // التحقق من صحة البيانات
      if (!formData.storeName || !formData.subdomain || !formData.email || !formData.password) {
        setError("يرجى ملء جميع الحقول المطلوبة")
        setIsLoading(false)
        return
      }

      if (formData.password.length < 6) {
        setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل")
        setIsLoading(false)
        return
      }

      if (formData.password !== formData.confirmPassword) {
        setError("كلمات المرور غير متطابقة")
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

      // إنشاء المتجر مع حساب المدير
      const response = await fetch("/api/stores/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name: formData.storeName,
          subdomain: formData.subdomain,
          slug: formData.subdomain,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || null,
          description: formData.description || null,
          plan_id: selectedPlanId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "فشل في إنشاء المتجر")
        setIsLoading(false)
        return
      }

      // إذا كان يحتاج لدفع، توجيه لصفحة الدفع
      if (result.requires_payment) {
        // حفظ معلومات المتجر في sessionStorage للاستخدام في صفحة الدفع
        sessionStorage.setItem("pending_store", JSON.stringify({
          store_id: result.store.id,
          store_name: formData.storeName,
          subdomain: formData.subdomain,
          plan: result.plan,
        }))
        
        router.push(`/checkout/subscription?store_id=${result.store.id}&plan_id=${result.plan.id}`)
        return
      }

      // المتجر مجاني - توجيه مباشر
      const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "xfuse.online"
      const isLocalhost = platformDomain === "localhost" || window.location.hostname === "localhost"
      const protocol = isLocalhost ? "http" : "https"
      const port = isLocalhost ? ":3000" : ""
      const storeUrl = `${protocol}://${formData.subdomain}.${platformDomain}${port}`
      
      alert(`تم إنشاء متجرك بنجاح!\n\nيمكنك الوصول إليه عبر:\n${storeUrl}\n\nسيتم إعادة توجيهك الآن...`)
      
      window.location.href = `${storeUrl}/admin`

    } catch (err) {
      console.error("Error creating store:", err)
      setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى")
      setIsLoading(false)
    }
  }

  const formatDuration = (days: number) => {
    if (days === 14) return "14 يوم تجربة"
    if (days === 30) return "شهري"
    if (days === 90) return "3 أشهر"
    if (days === 180) return "6 أشهر"
    if (days === 365) return "سنوي"
    return `${days} يوم`
  }

  const selectedPlan = plans.find(p => p.id === selectedPlanId)

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
            {step === 1 ? "اختر الباقة المناسبة لك" : "أدخل بيانات متجرك"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
              step >= 1 ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {step > 1 ? <Check className="w-5 h-5" /> : "1"}
            </div>
            <span className={step >= 1 ? "text-gray-900" : "text-gray-500"}>اختر الباقة</span>
          </div>
          <div className={`w-16 h-1 mx-2 ${step > 1 ? "bg-purple-600" : "bg-gray-200"}`} />
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
              step >= 2 ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              2
            </div>
            <span className={step >= 2 ? "text-gray-900" : "text-gray-500"}>بيانات المتجر</span>
          </div>
        </div>

        {/* Step 1: Plan Selection */}
        {step === 1 && (
          <div className="space-y-6">
            {loadingPlans ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : error ? (
              <Card className="text-center py-12 border-red-200 bg-red-50">
                <CardContent>
                  <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-900 mb-2">خطأ في تحميل الباقات</h3>
                  <p className="text-red-700 mb-4">{error}</p>
                  <div className="bg-white border border-red-200 rounded-lg p-4 mt-4 text-right">
                    <h4 className="font-semibold text-gray-900 mb-2">الحل:</h4>
                    <ol className="text-sm text-gray-700 space-y-1">
                      <li>1. افتح Supabase Dashboard</li>
                      <li>2. اذهب إلى SQL Editor</li>
                      <li>3. شغّل السكريبت: <code className="bg-gray-100 px-2 py-1 rounded text-xs">scripts/subscription/01-subscription-schema.sql</code></li>
                    </ol>
                  </div>
                  <Button onClick={loadPlans} className="mt-4">
                    <Loader2 className="w-4 h-4 ml-2" />
                    إعادة المحاولة
                  </Button>
                </CardContent>
              </Card>
            ) : plans.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد باقات متاحة حالياً</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedPlanId === plan.id
                        ? "border-2 border-purple-500 shadow-lg"
                        : "border hover:border-purple-200"
                    } ${plan.is_default ? "relative overflow-hidden" : ""}`}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    {plan.is_default && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-1 text-sm font-medium">
                        الأكثر شيوعاً
                      </div>
                    )}
                    <CardHeader className={plan.is_default ? "pt-10" : ""}>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        {selectedPlanId === plan.id && (
                          <CheckCircle className="w-6 h-6 text-purple-600" />
                        )}
                      </div>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-bold text-gray-900">
                          {plan.price === 0 ? "مجاني" : plan.price.toLocaleString()}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-gray-500">EGP / {formatDuration(plan.duration_days)}</span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex justify-center pt-6">
              <Button
                size="lg"
                onClick={() => setStep(2)}
                disabled={!selectedPlanId}
                className="text-lg px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                التالي
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Store Details */}
        {step === 2 && (
          <Card className="shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>بيانات المتجر</CardTitle>
                  <CardDescription>أدخل معلومات متجرك الجديد</CardDescription>
                </div>
                {selectedPlan && (
                  <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                    {selectedPlan.name} - {selectedPlan.price === 0 ? "مجاني" : `${selectedPlan.price} EGP`}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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

                {/* البريد الإلكتروني */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    البريد الإلكتروني (للدخول للوحة التحكم) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="admin@example.com"
                      className="pr-10"
                      required
                    />
                  </div>
                </div>

                {/* كلمة المرور */}
                <div className="space-y-2">
                  <Label htmlFor="password">
                    كلمة المرور <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="pr-10 pl-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">على الأقل 6 أحرف</p>
                </div>

                {/* تأكيد كلمة المرور */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    تأكيد كلمة المرور <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="pr-10"
                      required
                    />
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      كلمات المرور غير متطابقة
                    </p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="text-xs text-green-500 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      كلمات المرور متطابقة
                    </p>
                  )}
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    السابق
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !subdomainAvailable || checkingSubdomain}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري الإنشاء...
                      </>
                    ) : selectedPlan?.price === 0 ? (
                      <>
                        إنشاء المتجر
                        <ArrowLeft className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        المتابعة للدفع
                        <ArrowLeft className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

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

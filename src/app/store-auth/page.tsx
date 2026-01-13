"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Lock, User, Phone, LogIn, UserPlus, Store, AlertCircle, Loader2 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface StoreData {
  id: string
  store_name: string
  subdomain: string
  logo_url?: string
  primary_color: string
  secondary_color?: string
  status: string
}

export default function StoreAuthPage() {
  const [store, setStore] = useState<StoreData | null>(null)
  const [storeLoading, setStoreLoading] = useState(true)
  const [isLoginView, setIsLoginView] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  // تحميل بيانات المتجر من الـ subdomain
  useEffect(() => {
    async function loadStore() {
      try {
        const hostname = window.location.hostname
        const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "makastore.com"
        
        let subdomain: string | null = null
        
        // استخراج subdomain
        if (platformDomain === "localhost" || hostname.endsWith(".localhost")) {
          if (hostname.endsWith(".localhost")) {
            subdomain = hostname.replace(".localhost", "")
          }
        } else if (hostname.endsWith(platformDomain)) {
          subdomain = hostname.replace(`.${platformDomain}`, "")
        }
        
        if (!subdomain || subdomain === "www") {
          setStoreLoading(false)
          return
        }
        
        // جلب بيانات المتجر
        const { data, error } = await supabase
          .from("stores")
          .select("id, store_name, subdomain, logo_url, primary_color, secondary_color, status")
          .eq("subdomain", subdomain)
          .single()
        
        if (error || !data) {
          console.error("Store not found:", error)
          setStoreLoading(false)
          return
        }
        
        setStore(data)
      } catch (err) {
        console.error("Error loading store:", err)
      } finally {
        setStoreLoading(false)
      }
    }
    
    loadStore()
  }, [])

  // التحقق من أن المستخدم ينتمي للمتجر
  const checkUserBelongsToStore = async (userId: string): Promise<boolean> => {
    if (!store?.id) return false
    
    const { data, error } = await supabase
      .from("store_users")
      .select("id")
      .eq("store_id", store.id)
      .eq("user_id", userId)
      .eq("status", "active")
      .single()
    
    return !error && !!data
  }

  // تسجيل الدخول
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!store?.id) {
      setMessage({ type: "error", text: "لم يتم تحديد المتجر" })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const email = String(formData.get("email") || "").trim()
    const password = String(formData.get("password") || "").trim()

    if (!email || !password) {
      setMessage({ type: "error", text: "الرجاء إدخال البريد الإلكتروني وكلمة المرور" })
      setIsSubmitting(false)
      return
    }

    try {
      // محاولة تسجيل الدخول
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setMessage({ type: "error", text: "البريد الإلكتروني أو كلمة المرور غير صحيحة" })
        } else if (error.message.includes("Email not confirmed")) {
          setMessage({ type: "error", text: "الرجاء تأكيد بريدك الإلكتروني أولاً" })
        } else {
          setMessage({ type: "error", text: error.message })
        }
        setIsSubmitting(false)
        return
      }

      if (!data.user) {
        setMessage({ type: "error", text: "حدث خطأ في تسجيل الدخول" })
        setIsSubmitting(false)
        return
      }

      // ✅ التحقق من أن المستخدم مسجل في هذا المتجر
      const belongsToStore = await checkUserBelongsToStore(data.user.id)
      
      if (!belongsToStore) {
        // المستخدم غير مسجل في هذا المتجر - تسجيل خروج
        await supabase.auth.signOut()
        setMessage({ 
          type: "error", 
          text: "هذا الحساب غير مسجل في هذا المتجر. يرجى إنشاء حساب جديد." 
        })
        setIsSubmitting(false)
        return
      }

      // نجاح - توجيه للصفحة الرئيسية
      router.push("/")
      router.refresh()

    } catch (err) {
      console.error("[StoreAuth] Login error:", err)
      setMessage({ type: "error", text: "حدث خطأ غير متوقع" })
      setIsSubmitting(false)
    }
  }

  // إنشاء حساب جديد
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!store?.id) {
      setMessage({ type: "error", text: "لم يتم تحديد المتجر" })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const fullName = String(formData.get("fullName") || "").trim()
    const email = String(formData.get("email") || "").trim()
    const phone = String(formData.get("phone") || "").trim()
    const password = String(formData.get("password") || "").trim()
    const confirmPassword = String(formData.get("confirmPassword") || "").trim()

    // Validations
    if (!fullName || !email || !password) {
      setMessage({ type: "error", text: "الرجاء ملء جميع الحقول المطلوبة" })
      setIsSubmitting(false)
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "كلمة المرور غير متطابقة" })
      setIsSubmitting(false)
      return
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" })
      setIsSubmitting(false)
      return
    }

    try {
      // التحقق من أن البريد غير مستخدم في هذا المتجر
      const { data: existingUser } = await supabase
        .from("store_users")
        .select(`
          id,
          user_id,
          profiles:user_id(email)
        `)
        .eq("store_id", store.id)
        .single()

      // بناء redirect URL بشكل صريح باستخدام subdomain المتجر
      const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "makastore.com"
      const isProduction = process.env.NODE_ENV === "production"
      const redirectUrl = isProduction
        ? `https://${store.subdomain}.${platformDomain}/auth/callback`
        : `http://${store.subdomain}.localhost:3000/auth/callback`

      // إنشاء المستخدم مع metadata تحتوي على store_id
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            store_id: store.id,
            store_subdomain: store.subdomain,
            role: "customer",
          },
          emailRedirectTo: redirectUrl,
        },
      })

      if (error) {
        if (error.message.includes("already registered")) {
          setMessage({ 
            type: "error", 
            text: "هذا البريد مسجل بالفعل. جرب تسجيل الدخول أو استخدم بريد مختلف." 
          })
        } else {
          setMessage({ type: "error", text: error.message })
        }
        setIsSubmitting(false)
        return
      }

      if (!data.user) {
        setMessage({ type: "error", text: "حدث خطأ في إنشاء الحساب" })
        setIsSubmitting(false)
        return
      }

      // إضافة المستخدم لجدول store_users يدوياً (في حالة فشل الـ trigger)
      const { error: storeUserError } = await supabase
        .from("store_users")
        .insert({
          store_id: store.id,
          user_id: data.user.id,
          role: "customer",
        } as any)

      if (storeUserError && !storeUserError.message.includes("duplicate")) {
        console.error("[StoreAuth] Error adding user to store:", storeUserError)
      }

      // تحديث الـ profile مع store_id
      await supabase
        .from("profiles")
        .upsert({
          id: data.user.id,
          email,
          full_name: fullName,
          phone,
          store_id: store.id,
          role: "customer",
        } as any)

      // التحقق من نوع التأكيد
      if (data.user.identities?.length === 0) {
        setMessage({ 
          type: "error", 
          text: "هذا البريد مسجل بالفعل في متجر آخر. يرجى استخدام بريد مختلف." 
        })
      } else if (data.session) {
        // تسجيل دخول مباشر (التأكيد معطل)
        setMessage({ type: "success", text: "تم إنشاء الحساب بنجاح!" })
        setTimeout(() => {
          router.push("/")
          router.refresh()
        }, 1500)
      } else {
        // يحتاج تأكيد البريد
        setMessage({ 
          type: "success", 
          text: "تم إنشاء الحساب! يرجى تأكيد بريدك الإلكتروني للمتابعة." 
        })
      }

    } catch (err) {
      console.error("[StoreAuth] Signup error:", err)
      setMessage({ type: "error", text: "حدث خطأ غير متوقع" })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // No store found
  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">المتجر غير موجود</h2>
            <p className="text-gray-600">لم نتمكن من العثور على هذا المتجر</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4" dir="rtl">
      {/* Store Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b p-4 z-10">
        <div className="max-w-md mx-auto flex items-center gap-3">
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.store_name} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: store.primary_color || "#3b82f6" }}
            >
              <Store className="w-6 h-6 text-white" />
            </div>
          )}
          <span className="font-bold text-gray-900">{store.store_name}</span>
        </div>
      </div>

      <div className="w-full max-w-md pt-20">
        {/* Message */}
        {message && (
          <div className={`mb-4 p-4 rounded-xl flex items-start gap-3 ${
            message.type === "error" 
              ? "bg-red-50 border border-red-200 text-red-700" 
              : "bg-green-50 border border-green-200 text-green-700"
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{message.text}</p>
          </div>
        )}

        {isSubmitting ? (
          <Card className="shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
              <h2 className="text-xl font-bold">جاري المعالجة...</h2>
              <p className="text-gray-500 mt-2">يرجى الانتظار</p>
            </CardContent>
          </Card>
        ) : isLoginView ? (
          /* Login Form */
          <Card className="shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div 
                className="p-6 text-center"
                style={{ backgroundColor: `${store.primary_color}15` || "#3b82f615" }}
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `${store.primary_color}25` || "#3b82f625" }}
                >
                  <LogIn className="h-7 w-7" style={{ color: store.primary_color || "#3b82f6" }} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">تسجيل الدخول</h2>
                <p className="text-gray-600 text-sm mt-1">سجل دخولك في {store.store_name}</p>
              </div>

              <form onSubmit={handleLogin} className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="example@email.com"
                    required
                    className="rounded-xl h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-gray-400" />
                    كلمة المرور
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="rounded-xl h-11"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full rounded-xl h-12 text-base"
                  style={{ backgroundColor: store.primary_color || "#3b82f6" }}
                >
                  <LogIn className="h-5 w-5 ml-2" />
                  تسجيل الدخول
                </Button>

                <p className="text-center text-sm text-gray-600 pt-2">
                  ليس لديك حساب؟{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginView(false)
                      setMessage(null)
                    }}
                    className="font-bold hover:underline"
                    style={{ color: store.primary_color || "#3b82f6" }}
                  >
                    إنشاء حساب جديد
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Signup Form */
          <Card className="shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div 
                className="p-6 text-center"
                style={{ backgroundColor: `${store.primary_color}15` || "#3b82f615" }}
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `${store.primary_color}25` || "#3b82f625" }}
                >
                  <UserPlus className="h-7 w-7" style={{ color: store.primary_color || "#3b82f6" }} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">إنشاء حساب جديد</h2>
                <p className="text-gray-600 text-sm mt-1">انضم إلى {store.store_name}</p>
              </div>

              <form onSubmit={handleSignup} className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    الاسم الكامل *
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="محمد أحمد"
                    required
                    className="rounded-xl h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    البريد الإلكتروني *
                  </Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="example@email.com"
                    required
                    className="rounded-xl h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    رقم الهاتف
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="01xxxxxxxxx"
                    className="rounded-xl h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-gray-400" />
                    كلمة المرور *
                  </Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="rounded-xl h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-gray-400" />
                    تأكيد كلمة المرور *
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    className="rounded-xl h-11"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full rounded-xl h-12 text-base"
                  style={{ backgroundColor: store.primary_color || "#3b82f6" }}
                >
                  <UserPlus className="h-5 w-5 ml-2" />
                  إنشاء الحساب
                </Button>

                <p className="text-center text-sm text-gray-600 pt-2">
                  لديك حساب بالفعل؟{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginView(true)
                      setMessage(null)
                    }}
                    className="font-bold hover:underline"
                    style={{ color: store.primary_color || "#3b82f6" }}
                  >
                    تسجيل الدخول
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

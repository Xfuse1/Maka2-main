"use client"
import { useState, useEffect } from "react"
import { useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { signUpWithAdmin } from "./actions"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Lock, User, Phone, Upload, LogIn, UserPlus } from "lucide-react"

export default function AuthPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [isLoginView, setIsLoginView] = useState(true)
  const searchParams = useSearchParams()
  const message = searchParams.get("message")
  const router = useRouter()
  const [serverMessage, setServerMessage] = useState<string | null>(message)
  const lastShownRef = useRef<{ msg?: string; ts?: number }>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

  const showMessage = (msg: string | null) => {
    setServerMessage((prev) => {
      const a = typeof prev === 'string' ? prev.trim() : prev
      const b = typeof msg === 'string' ? msg.trim() : msg
      if (!b) return null
      // If message identical to current, skip
      if (a === b) return prev
      // If we showed the same message very recently, skip (avoid duplicates)
      if (lastShownRef.current.msg === b && Date.now() - (lastShownRef.current.ts || 0) < 2000) {
        return prev
      }
      lastShownRef.current = { msg: b as string, ts: Date.now() }
      return b
    })
  }
  // On mobile, if signup redirected with status=success, reload to ensure page refreshes
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const params = new URLSearchParams(window.location.search)
      const status = params.get('status')
      if (status === 'success') {
        const ua = navigator.userAgent || ''
        const isMobile = /Mobi|Android|iPhone|iPad|iPod|Mobile/.test(ua)
        if (isMobile) {
          // replace location to /auth (clean URL) and force reload
          window.location.replace('/auth')
        }
      }
    } catch (e) {
      // ignore
    }
  }, [])

  // If a message was present from search params at mount, mark it as recently shown
  useEffect(() => {
    if (message) {
      lastShownRef.current = { msg: String(message).trim(), ts: Date.now() }
    }
  }, [message])

  if (!mounted) {
    // avoid SSR/CSR markup mismatch by rendering nothing on the server
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex flex-col">
      <SiteHeader />
      
      <div className="flex-grow flex items-center justify-center p-4 py-12">
        {/* Decorative Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>
        
        <div className="w-full max-w-md space-y-6 relative">
        {isSubmitting ? (
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
            <CardContent className="p-10 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">جاري المعالجة…</h2>
              <p className="text-muted-foreground mt-3">يرجى الانتظار أثناء إعداد حسابك...</p>
            </CardContent>
          </Card>
        ) : isLoginView ? (
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
            <CardContent className="p-0">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <LogIn className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">تسجيل الدخول</h2>
                <p className="text-muted-foreground mt-2">أهلاً بك! قم بتسجيل الدخول للمتابعة</p>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault()
                const form = e.currentTarget as HTMLFormElement
                const fd = new FormData(form)
                const email = String(fd.get('email') || '').trim()
                const password = String(fd.get('password') || '').trim()
                if (!email || !password) {
                  showMessage('الرجاء إدخال البريد الإلكتروني وكلمة المرور')
                  return
                }
                // Email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                if (!emailRegex.test(email)) {
                  showMessage('الرجاء إدخال بريد إلكتروني صحيح')
                  return
                }
                try {
                  const supabase = getSupabaseBrowserClient()
                  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
                  if (error) {
                    console.error('[Auth] Login error:', error)
                    // Show user-friendly error messages
                    if (error.message.includes('Invalid login credentials')) {
                      showMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة')
                    } else if (error.message.includes('Email not confirmed')) {
                      showMessage('الرجاء تأكيد بريدك الإلكتروني أولاً')
                    } else {
                      showMessage(`خطأ في تسجيل الدخول: ${error.message}`)
                    }
                    return
                  }
                  // Clear user-specific cache on successful login
                  try {
                    const { clearUserCacheOnLogin } = await import("@/lib/client/clearClientData")
                    await clearUserCacheOnLogin()
                  } catch (e) {
                    // Best effort - ignore errors
                  }
                  // success -> navigate home
                  router.push('/')
                } catch (err) {
                  console.error('[Auth] Login exception:', err)
                  showMessage((err as any)?.message || 'حدث خطأ غير متوقع')
                }
              }} className="p-8 space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="login-email" className="flex items-center gap-2 font-medium">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    البريد الإلكتروني
                  </Label>
                  <Input 
                    id="login-email" 
                    name="email" 
                    type="email" 
                    placeholder="m@example.com" 
                    required 
                    className="border-0 bg-muted/50 rounded-xl h-12 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="login-password" className="flex items-center gap-2 font-medium">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    كلمة المرور
                  </Label>
                  <Input 
                    id="login-password" 
                    name="password" 
                    type="password" 
                    required 
                    className="border-0 bg-muted/50 rounded-xl h-12 focus:ring-2 focus:ring-primary"
                  />
                  <div className="text-sm text-left mt-2">
                    <a
                      href="/auth/forgot-password"
                      className="text-primary hover:underline font-medium"
                    >
                      نسيت كلمة المرور؟
                    </a>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 rounded-xl py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <LogIn className="h-5 w-5 ml-2" />
                  تسجيل الدخول
                </Button>
                <p className="text-center text-sm text-muted-foreground pt-4">
                  ليس لديك حساب؟{" "}
                  <button
                    type="button"
                    onClick={() => setIsLoginView(false)}
                    className="underline font-bold text-primary hover:text-primary/90"
                  >
                    إنشاء حساب
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        ) : (
          // Use server action form submission so browsers send files reliably (works better on mobile)
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
            <CardContent className="p-0">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">إنشاء حساب جديد</h2>
                <p className="text-muted-foreground mt-2">انضمي إلينا واستمتعي بتجربة تسوق مميزة</p>
              </div>
              
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const form = e.currentTarget as HTMLFormElement
                  const fd = new FormData(form)
                  const email = String(fd.get('email') || '').trim()
                  const phone = String(fd.get('phone') || '').trim()
                  // Basic client-side email validation (allow any TLD)
                  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                  const phoneIsEgyptian = phone === '' ? true : /^(?:\+20|0)1[0125][0-9]{8}$/.test(phone)
                  if (!emailIsValid) {
                    showMessage('الرجاء إدخال بريد إلكتروني صحيح')
                    return
                  }
                  if (!phoneIsEgyptian) {
                    showMessage('الرجاء إدخال رقم هاتف مصري صالح (مثال: 01012345678 أو +201012345678)')
                    return
                  }
                  // Clear message before server call and show loading UI
                  showMessage(null)
                  setIsSubmitting(true)
                  try {
                    const res = await fetch('/api/auth/signup-web', { method: 'POST', body: fd })
                    const json = await res.json()
                    if (!res.ok || !json?.success) {
                      setIsSubmitting(false)
                      showMessage(json?.message || 'حدث خطأ أثناء التسجيل')
                      return
                    }
                    // success -> try automatic sign-in
                    const email = String(fd.get('email') || '').trim()
                    const password = String(fd.get('password') || '').trim()
                    try {
                      const supabase = getSupabaseBrowserClient()
                      const { data: signData, error: signError } = await supabase.auth.signInWithPassword({ email, password })
                      if (signError) {
                        // sign-in failed, redirect to login with success message about account creation
                        const msg = encodeURIComponent((json.message || 'تم إنشاء الحساب بنجاح. الرجاء تسجيل الدخول.') + ' (تسجيل الدخول التلقائي فشل)')
                        router.replace(`/auth?message=${msg}&status=success`)
                        return
                      }

                      // Clear user-specific cache on successful login
                      try {
                        const { clearUserCacheOnLogin } = await import("@/lib/client/clearClientData")
                        await clearUserCacheOnLogin()
                      } catch (e) {
                        // Best effort - ignore errors
                      }

                      // signed in successfully
                      showMessage('تم تسجيل الدخول بنجاح')
                      // small delay so user sees the message then navigate home
                      setTimeout(() => {
                    router.push('/')
                  }, 900)
                } catch (err) {
                  const msg = encodeURIComponent(json.message || 'تم إنشاء الحساب بنجاح. الرجاء تسجيل الدخول.')
                  router.replace(`/auth?message=${msg}&status=success`)
                }
              } catch (err) {
                console.error('[Signup] exception', err)
                setIsSubmitting(false)
                showMessage((err as any)?.message || 'حدث خطأ أثناء التسجيل')
              }
            }}
            encType="multipart/form-data"
            className="p-8 space-y-5"
          >
            <div className="space-y-3">
              <Label htmlFor="signup-email" className="flex items-center gap-2 font-medium">
                <Mail className="h-4 w-4 text-muted-foreground" />
                البريد الإلكتروني
              </Label>
              <Input 
                id="signup-email" 
                name="email" 
                type="email" 
                placeholder="m@example.com" 
                required 
                className="border-0 bg-muted/50 rounded-xl h-12 focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="signup-name" className="flex items-center gap-2 font-medium">
                <User className="h-4 w-4 text-muted-foreground" />
                الاسم
              </Label>
              <Input 
                id="signup-name" 
                name="name" 
                type="text" 
                required 
                className="border-0 bg-muted/50 rounded-xl h-12 focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="signup-phone" className="flex items-center gap-2 font-medium">
                <Phone className="h-4 w-4 text-muted-foreground" />
                رقم الهاتف
              </Label>
              <Input 
                id="signup-phone" 
                name="phone" 
                type="tel" 
                className="border-0 bg-muted/50 rounded-xl h-12 focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="signup-image" className="flex items-center gap-2 font-medium">
                <Upload className="h-4 w-4 text-muted-foreground" />
                صورة الملف الشخصي
              </Label>
              <input
                id="signup-image"
                name="image"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => setSelectedImage(e.target.files ? e.target.files[0] : null)} 
              />
              <label 
                htmlFor="signup-image" 
                className="flex items-center gap-3 cursor-pointer bg-muted/50 hover:bg-muted/70 rounded-xl px-4 py-3 h-12 text-sm transition-colors"
              >
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {selectedImage ? selectedImage.name : "اختر صورة (اختياري)"}
                </span>
              </label>
            </div>
            <input name="role" type="hidden" value="user" />
            <div className="space-y-3">
              <Label htmlFor="signup-password" className="flex items-center gap-2 font-medium">
                <Lock className="h-4 w-4 text-muted-foreground" />
                كلمة المرور
              </Label>
              <Input 
                id="signup-password" 
                name="password" 
                type="password" 
                required 
                className="border-0 bg-muted/50 rounded-xl h-12 focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 rounded-xl py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <UserPlus className="h-5 w-5 ml-2" />
              إنشاء حساب
            </Button>
            <p className="text-center text-sm text-muted-foreground pt-4">
              لديك حساب بالفعل؟{" "}
              <button
                type="button"
                onClick={() => setIsLoginView(true)}
                className="underline font-bold text-primary hover:text-primary/90"
              >
                تسجيل الدخول
              </button>
            </p>
          </form>
            </CardContent>
          </Card>
        )}
        {serverMessage && (
          <Card className="border-0 shadow-xl rounded-2xl bg-primary/10 overflow-hidden">
            <CardContent className="p-5 text-center">
              <p className="text-foreground font-medium">{serverMessage}</p>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
      <SiteFooter />
    </div>
  )
}

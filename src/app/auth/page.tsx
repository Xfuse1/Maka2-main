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
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
        {isSubmitting ? (
          <div className="p-6 border rounded-lg shadow-sm bg-card text-center">
            <h2 className="text-2xl font-semibold text-foreground">جاري المعالجة…</h2>
            <p className="text-sm text-muted-foreground mt-2">يرجى الانتظار أثناء إعداد حسابك...</p>
          </div>
        ) : isLoginView ? (
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
              // success -> navigate home
              router.push('/')
            } catch (err) {
              console.error('[Auth] Login exception:', err)
              showMessage((err as any)?.message || 'حدث خطأ غير متوقع')
            }
          }} className="space-y-4 p-6 border rounded-lg shadow-sm bg-card">
            <h2 className="text-2xl font-bold text-center text-foreground">تسجيل الدخول</h2>
            <div className="space-y-2">
              <Label htmlFor="login-email">البريد الإلكتروني</Label>
              <Input id="login-email" name="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">كلمة المرور</Label>
              <Input id="login-password" name="password" type="password" required />
              <div className="text-sm text-left mt-2">
                <a
                  href="/auth/forgot-password"
                  className="text-primary hover:underline"
                >
                  نسيت كلمة المرور؟
                </a>
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              تسجيل الدخول
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ليس لديك حساب؟{" "}
              <button
                type="button"
                onClick={() => setIsLoginView(false)}
                className="underline font-semibold text-primary hover:text-primary/90"
              >
                إنشاء حساب
              </button>
            </p>
          </form>
        ) : (
          // Use server action form submission so browsers send files reliably (works better on mobile)
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
            className="space-y-4 p-6 border rounded-lg shadow-sm bg-card"
          >
            <h2 className="text-2xl font-bold text-center text-foreground">إنشاء حساب جديد</h2>
            <div className="space-y-2">
              <Label htmlFor="signup-email">البريد الإلكتروني</Label>
              <Input id="signup-email" name="email" type="email" placeholder="m@example.com" required />
            </div>
 <div className="space-y-2">
 <Label htmlFor="signup-name">الاسم</Label>
 <Input id="signup-name" name="name" type="text" required />
 </div>
 <div className="space-y-2">
 <Label htmlFor="signup-phone">رقم الهاتف</Label>
 <Input id="signup-phone" name="phone" type="tel" />
 </div> {/* Changed 'رابط الصورة' to 'Upload Image' and added file input styling */}
          <div className="space-y-2">
 <Label htmlFor="signup-image">Upload Image</Label>
 <input
 id="signup-image"
 name="image"
 type="file"
 className="hidden" // Hide the default file input
 accept="image/*"
 onChange={(e) => setSelectedImage(e.target.files ? e.target.files[0] : null)} />
 <label htmlFor="signup-image" className="flex items-center gap-2 cursor-pointer border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
 {selectedImage ? selectedImage.name : "Choose File"}
 </label>
 </div>
            <input name="role" type="hidden" value="user" />
            <div className="space-y-2">
              <Label htmlFor="signup-password">كلمة المرور</Label>
              <Input id="signup-password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              إنشاء حساب
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              لديك حساب بالفعل؟{" "}
              <button
                type="button"
                onClick={() => setIsLoginView(true)}
                className="underline font-semibold text-primary hover:text-primary/90"
              >
                تسجيل الدخول
              </button>
            </p>
          </form>
        )}
        {serverMessage && (
          <p className="mt-4 p-4 bg-muted text-foreground text-center rounded-lg border border-border">
            {serverMessage}
          </p>
        )}
      </div>
      </div>
      <SiteFooter />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Shield, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2,
  AlertTriangle,
  KeyRound
} from "lucide-react"
import Link from "next/link"

export default function SuperAdminLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockTime, setBlockTime] = useState(0)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    secretCode: "", // رمز أمان إضافي
  })

  // التحقق من الحظر عند التحميل
  useEffect(() => {
    const blockedUntil = localStorage.getItem("super_admin_blocked_until")
    if (blockedUntil) {
      const remaining = parseInt(blockedUntil) - Date.now()
      if (remaining > 0) {
        setIsBlocked(true)
        setBlockTime(Math.ceil(remaining / 1000))
      } else {
        localStorage.removeItem("super_admin_blocked_until")
        localStorage.removeItem("super_admin_attempts")
      }
    }
    
    const savedAttempts = localStorage.getItem("super_admin_attempts")
    if (savedAttempts) {
      setAttempts(parseInt(savedAttempts))
    }
  }, [])

  // عداد تنازلي للحظر
  useEffect(() => {
    if (isBlocked && blockTime > 0) {
      const timer = setInterval(() => {
        setBlockTime(prev => {
          if (prev <= 1) {
            setIsBlocked(false)
            localStorage.removeItem("super_admin_blocked_until")
            localStorage.removeItem("super_admin_attempts")
            setAttempts(0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isBlocked, blockTime])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isBlocked) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/super-admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        // زيادة عدد المحاولات الفاشلة
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        localStorage.setItem("super_admin_attempts", newAttempts.toString())

        // حظر بعد 5 محاولات فاشلة
        if (newAttempts >= 5) {
          const blockDuration = 5 * 60 * 1000 // 5 دقائق
          const blockedUntil = Date.now() + blockDuration
          localStorage.setItem("super_admin_blocked_until", blockedUntil.toString())
          setIsBlocked(true)
          setBlockTime(Math.ceil(blockDuration / 1000))
          setError("تم حظر تسجيل الدخول لمدة 5 دقائق بسبب كثرة المحاولات الفاشلة")
        } else {
          setError(data.error || "فشل تسجيل الدخول")
        }
        
        setIsLoading(false)
        return
      }

      // نجاح - إعادة تعيين المحاولات
      localStorage.removeItem("super_admin_attempts")
      localStorage.removeItem("super_admin_blocked_until")
      
      // استخدام window.location لضمان حفظ الـ cookies
      window.location.href = "/super-admin"
      
    } catch (err) {
      console.error("Login error:", err)
      setError("حدث خطأ غير متوقع")
      setIsLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4" dir="rtl">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      
      <Card className="w-full max-w-md relative z-10 bg-slate-900/80 border-purple-500/30 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Super Admin
          </CardTitle>
          <CardDescription className="text-gray-400">
            لوحة التحكم الرئيسية - دخول مؤمن
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {isBlocked ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-red-400 mb-2">تم حظر الدخول مؤقتاً</h3>
              <p className="text-gray-400 mb-4">بسبب كثرة المحاولات الفاشلة</p>
              <div className="text-3xl font-mono text-white bg-slate-800 rounded-lg py-3 px-6 inline-block">
                {formatTime(blockTime)}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@xfuse.online"
                    className="pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-gray-500 focus:border-purple-500"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="pr-10 pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-gray-500 focus:border-purple-500"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Secret Code */}
              <div className="space-y-2">
                <Label htmlFor="secretCode" className="text-gray-300">رمز الأمان</Label>
                <div className="relative">
                  <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="password"
                    id="secretCode"
                    value={formData.secretCode}
                    onChange={(e) => setFormData({ ...formData, secretCode: e.target.value })}
                    placeholder="أدخل رمز الأمان"
                    className="pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-gray-500 focus:border-purple-500"
                    required
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-gray-500">رمز الأمان المقدم من مدير النظام</p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Attempts warning */}
              {attempts > 0 && attempts < 5 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-yellow-400 text-sm text-center">
                    محاولات فاشلة: {attempts}/5
                  </p>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 ml-2" />
                    دخول آمن
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <Link href="/landing" className="text-gray-500 hover:text-gray-400 text-sm">
              العودة للرئيسية
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Security note */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
        <p className="text-gray-600 text-xs">
          🔒 جميع محاولات الدخول مراقبة ومسجلة
        </p>
      </div>
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // User is already logged in, redirect to admin
          router.replace("/admin")
          return
        }
      } catch (error) {
        console.error("Session check error:", error)
      } finally {
        setCheckingSession(false)
      }
    }
    
    checkSession()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      
      // Sign in with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password 
      })

      if (authError) {
        throw new Error(authError.message === "Invalid login credentials" 
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" 
          : authError.message)
      }

      if (!authData.user) {
        throw new Error("فشل تسجيل الدخول")
      }

      // Verify user has admin role (profiles or store_admins)
      let hasAccess = false

      // Check profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, store_id")
        .eq("id", authData.user.id)
        .maybeSingle()

      if (profile && ["admin", "store_owner", "owner", "super_admin"].includes(profile.role)) {
        hasAccess = true
      }

      // If not in profiles, check store_admins
      if (!hasAccess) {
        const { data: storeAdmin } = await supabase
          .from("store_admins")
          .select("role, store_id")
          .eq("user_id", authData.user.id)
          .eq("is_active", true)
          .maybeSingle()

        if (storeAdmin) {
          hasAccess = true
        }
      }

      if (!hasAccess) {
        await supabase.auth.signOut()
        throw new Error("ليس لديك صلاحيات الوصول للوحة التحكم")
      }

      toast({ 
        title: "تم تسجيل الدخول بنجاح", 
        description: "مرحباً بك في لوحة التحكم" 
      })

      // Use window.location for a full page reload to ensure cookies are set
      window.location.href = "/admin"
      
    } catch (error: any) {
      console.error("Login error:", error)
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <Button 
        variant="outline" 
        className="absolute top-4 right-4 rounded-full shadow-sm"
        onClick={() => router.back()}
      >
        <ArrowRight className="h-4 w-4 ml-2" />
        العودة للخلف
      </Button>
      
      <Card className="w-full max-w-md shadow-lg rounded-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6">
            <Image
              src="https://i.postimg.cc/nh7DrN8b/online-shopping-hijabi-illustration-white-bg.png"
              alt="Illustration"
              width={150}
              height={150}
              className="object-contain rounded-xl"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold">تسجيل دخول المسؤول</CardTitle>
          <CardDescription>أدخل بيانات الدخول للوصول إلى لوحة التحكم</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={loading}
                className="rounded-lg"
                autoComplete="email"
              />
            </div>
            
            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="rounded-lg pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <Button type="submit" className="w-full rounded-lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تسجيل الدخول"}
            </Button>
            
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">ليس لديك حساب؟ </span>
              <a href="/admin/signup" className="text-primary hover:underline">
                إنشاء حساب مسؤول
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

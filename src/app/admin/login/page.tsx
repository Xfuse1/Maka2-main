
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

// Helper to extract subdomain from hostname
function getSubdomain(): string | null {
  if (typeof window === "undefined") return null

  const hostname = window.location.hostname
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "makastore.com"

  // Handle localhost with subdomain (e.g., store1.localhost)
  if (hostname.endsWith(".localhost")) {
    const subdomain = hostname.replace(".localhost", "")
    if (subdomain && subdomain !== "www") {
      return subdomain
    }
    return null
  }

  // Handle localhost without subdomain
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return null
  }

  const cleanHost = hostname.replace(/^www\./, "")

  if (!cleanHost.endsWith(platformDomain)) {
    return null
  }

  const subdomain = cleanHost.replace(`.${platformDomain}`, "")

  if (!subdomain || subdomain === platformDomain) {
    return null
  }

  return subdomain
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [storeName, setStoreName] = useState<string | null>(null)
  const [storeId, setStoreId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const subdomain = getSubdomain()

  // Load store info if on subdomain
  useEffect(() => {
    const loadStore = async () => {
      if (!subdomain) {
        setCheckingSession(false)
        return
      }

      try {
        // Use API endpoint instead of direct DB query (safer)
        const storeResponse = await fetch(`/api/stores/check?subdomain=${encodeURIComponent(subdomain)}`, {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        
        if (!storeResponse.ok) {
          console.warn("[LoadStore] Store not found for subdomain:", subdomain)
          toast({
            title: "⚠ تنبيه",
            description: "المتجر غير موجود. تأكد من عنوان URL الصحيح",
            variant: "destructive",
          })
          setCheckingSession(false)
          return
        }

        const { store } = await storeResponse.json()
        if (!store?.id) {
          throw new Error("بيانات المتجر غير صحيحة")
        }
        
        setStoreId(store.id)
        setStoreName(store.store_name)

        // Check if user is already logged in with correct store
        const supabase = getSupabaseBrowserClient()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("[LoadStore] Session check error:", sessionError)
          setCheckingSession(false)
          return
        }

        if (session?.user) {
          // Verify user can access this store - check both store_admins and profiles
          let canAccessStore = false

          try {
            // Primary check: store_admins table (supports multiple stores)
            const { data: storeAdmin, error: storeAdminError } = await supabase
              .from("store_admins")
              .select("store_id")
              .eq("user_id", session.user.id)
              .eq("store_id", store.id)
              .eq("is_active", true)
              .maybeSingle() as { data: { store_id: string } | null; error: any }

            if (!storeAdminError || storeAdminError.code === "PGRST116") {
              if (storeAdmin) {
                canAccessStore = true
                console.log("[LoadStore] User has store_admins access for:", store.id)
              } else {
                // Fallback: Check profiles table (legacy single-store)
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("store_id")
                  .eq("id", session.user.id)
                  .maybeSingle() as { data: { store_id: string | null } | null; error: any }

                if (profile?.store_id === store.id) {
                  canAccessStore = true
                  console.log("[LoadStore] User has profile access for:", store.id)
                }
              }
            }
          } catch (accessCheckError) {
            console.error("[LoadStore] Access check error:", accessCheckError)
          }

          // If user owns this store, redirect to admin
          if (canAccessStore) {
            console.log("[LoadStore] Auto-redirecting user to admin dashboard")
            router.replace("/admin")
            return
          } else if (session.user) {
            // User doesn't have access to this store - sign out
            console.log("[LoadStore] User logged in but no access to store, signing out")
            await supabase.auth.signOut()
          }
        }
      } catch (error) {
        console.error("[LoadStore] Error:", error)
        if (error instanceof Error && error.name === "AbortError") {
          toast({
            title: "خطأ",
            description: "انتهت مهلة الاتصال. تحقق من الإنترنت",
            variant: "destructive",
          })
        }
      } finally {
        setCheckingSession(false)
      }
    }

    loadStore()
  }, [subdomain, router, toast])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate input
    if (!email.trim() || !password) {
      toast({
        title: "خطأ في الإدخال",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Use API endpoint instead of direct Supabase auth
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          storeId: storeId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMessage = result.error || "فشل تسجيل الدخول"
        
        if (errorMessage.includes("Invalid credentials")) {
          throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة")
        }
        if (errorMessage.includes("not have access")) {
          throw new Error("ليس لديك صلاحيات الوصول للوحة التحكم")
        }
        
        throw new Error(errorMessage)
      }

      // If successful, sign in the user on the client side to set the session
      const supabase = getSupabaseBrowserClient()
      
      // The server already authenticated the user, now we just need to set up the client session
      // We can do this by signing in again with the credentials (already verified on server)
      const { error: clientAuthError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (clientAuthError) {
        console.error("[Login] Client auth error:", clientAuthError)
        throw new Error("فشل في إعداد الجلسة")
      }

      toast({
        title: "✓ تم تسجيل الدخول بنجاح",
        description: storeName ? `مرحباً بك في ${storeName}` : "مرحباً بك",
      })

      // Use setTimeout to ensure toast is shown before redirect
      setTimeout(() => {
        router.push("/admin")
      }, 300)
    } catch (error: any) {
      console.error("[Login] Error:", error)
      
      const errorMessage = error?.message || "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى"
      
      toast({
        title: "✗ خطأ في تسجيل الدخول",
        description: errorMessage,
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
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full rounded-lg font-semibold" 
              disabled={loading || !email || !password}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
            
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">ليس لديك حساب؟ </span>
              <a href="/admin/signup" className="text-primary hover:underline font-medium">
                إنشاء حساب
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

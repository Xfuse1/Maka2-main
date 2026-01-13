
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
        const storeResponse = await fetch(`/api/stores/check?subdomain=${encodeURIComponent(subdomain)}`)
        
        if (!storeResponse.ok) {
          toast({
            title: "خطأ",
            description: "المتجر غير موجود",
            variant: "destructive",
          })
          setCheckingSession(false)
          return
        }

        const { store } = await storeResponse.json()
        setStoreId(store.id)
        setStoreName(store.store_name)

        // Check if user is already logged in with correct store
        const supabase = getSupabaseBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          // Verify user belongs to this store - check both tables
          let userStoreId: string | null = null

          // Check profiles table first
          const { data: profile } = await supabase
            .from("profiles")
            .select("store_id")
            .eq("id", session.user.id)
            .maybeSingle() as { data: { store_id: string | null } | null; error: any }

          if (profile?.store_id) {
            userStoreId = profile.store_id
          } else {
            // Fallback to store_admins
            const { data: storeAdmin } = await supabase
              .from("store_admins")
              .select("store_id")
              .eq("user_id", session.user.id)
              .eq("is_active", true)
              .maybeSingle() as { data: { store_id: string } | null; error: any }

            if (storeAdmin?.store_id) {
              userStoreId = storeAdmin.store_id
            }
          }

          // If user owns this store, redirect to admin
          if (userStoreId === store.id) {
            router.replace("/admin")
            return
          } else if (userStoreId) {
            // User owns a different store - sign out
            await supabase.auth.signOut()
          }
        }
      } catch (error) {
        console.error("Session check error:", error)
      } finally {
        setCheckingSession(false)
      }
    }

    loadStore()
  }, [subdomain, router, toast])

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

      console.log("[Login] User authenticated:", authData.user.id)

      // Verify user has admin role (profiles or store_admins)
      let hasAccess = false
      let userStoreId: string | null = null

      // Check profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, store_id")
        .eq("id", authData.user.id)
        .maybeSingle() as { data: { role: string; store_id: string | null } | null; error: any }

      console.log("[Login] Profile check:", { profile, storeId, subdomain })

      if (profile && ["admin", "store_owner", "owner", "super_admin"].includes(profile.role)) {
        hasAccess = true
        userStoreId = profile.store_id
        console.log("[Login] Access granted via profiles table:", { userStoreId })
      }

      // If not in profiles, check store_admins
      if (!hasAccess) {
        const { data: storeAdmin } = await supabase
          .from("store_admins")
          .select("role, store_id")
          .eq("user_id", authData.user.id)
          .eq("is_active", true)
          .maybeSingle() as { data: { role: string; store_id: string } | null; error: any }

        console.log("[Login] Store_admins check:", { storeAdmin })

        if (storeAdmin) {
          hasAccess = true
          userStoreId = storeAdmin.store_id
          console.log("[Login] Access granted via store_admins table:", { userStoreId })
        }
      }

      if (!hasAccess) {
        console.error("[Login] No access - user has no admin role")
        await supabase.auth.signOut()
        throw new Error("ليس لديك صلاحيات الوصول للوحة التحكم")
      }

      // CRITICAL: If on a subdomain, verify user owns THIS store
      // Check if userStoreId is set and matches current store
      if (storeId) {
        console.log("[Login] Verifying store ownership:", { storeId, userStoreId, subdomain })
        if (!userStoreId || userStoreId !== storeId) {
          console.error("[Login] Store ownership verification failed", { storeId, userStoreId })
          await supabase.auth.signOut()
          throw new Error("هذا الحساب لا يملك صلاحية الوصول لهذا المتجر")
        }
        console.log("[Login] Store ownership verified!")
      }

      console.log("[Login] All checks passed, redirecting to /admin")

      // Helper to log to both console and localStorage for debugging
      const debugLog = (msg: string) => {
        console.log(msg)
        if (typeof window !== "undefined") {
          const logs = JSON.parse(localStorage.getItem("login-debug-logs") || "[]") as string[]
          logs.push(`${new Date().toISOString()}: ${msg}`)
          localStorage.setItem("login-debug-logs", JSON.stringify(logs.slice(-20))) // Keep last 20 logs
        }
      }

      // Wait a bit to ensure session is saved to cookies
      debugLog("[Login] Checking session before redirect...")
      const { data: { session } } = await supabase.auth.getSession()
      debugLog(`[Login] Current session after auth: ${session?.user?.email}`)
      
      // Also check cookies directly
      if (typeof window !== "undefined") {
        debugLog(`[Login] Current cookies: ${document.cookie}`)
      }

      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: storeName ? `مرحباً بك في لوحة تحكم ${storeName}` : "مرحباً بك في لوحة التحكم"
      })

      debugLog("[Login] Redirecting to /admin...")
      
      // Use router.push instead of window.location for client-side navigation (no full page reload)
      router.push("/admin")

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

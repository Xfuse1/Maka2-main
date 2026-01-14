
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
      const supabase = getSupabaseBrowserClient()

      // Sign in with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      })

      if (authError) {
        // Handle specific auth errors
        if (authError.message.includes("Invalid login credentials")) {
          throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة")
        }
        if (authError.message.includes("Email not confirmed")) {
          throw new Error("يرجى تأكيد بريدك الإلكتروني أولاً")
        }
        if (authError.message.includes("too many requests")) {
          throw new Error("محاولات تسجيل دخول كثيرة. حاول مرة أخرى لاحقاً")
        }
        throw new Error(authError.message)
      }

      if (!authData?.user?.id) {
        throw new Error("فشل تسجيل الدخول. يرجى المحاولة مرة أخرى")
      }

      // Verify user has admin role (profiles or store_admins)
      let hasAccess = false
      let userStoreId: string | null = null

      // Check profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, store_id")
        .eq("id", authData.user.id)
        .maybeSingle() as { data: { role: string; store_id: string | null } | null; error: any }

      if (profileError && profileError.code !== "PGRST116") {
        console.error("[Login] Profile check error:", profileError)
        throw new Error("فشل التحقق من البيانات. يرجى المحاولة مرة أخرى")
      }

      console.log("[Login] Profile found:", { profile, hasProfile: !!profile, role: profile?.role, store_id: profile?.store_id })

      // السماح بالدخول إذا:
      // 1. لديه role admin/store_owner/owner/super_admin
      // 2. أو لديه store_id (صاحب متجر)
      if (profile) {
        const isAdminRole = profile.role && ["admin", "store_owner", "owner", "super_admin"].includes(profile.role.toLowerCase())
        const isStoreOwner = !!profile.store_id

        if (isAdminRole || isStoreOwner) {
          hasAccess = true
          userStoreId = profile.store_id
          console.log("[Login] ✓ User has admin access via profile", { isAdminRole, isStoreOwner })
        }
      }

      // If not in profiles, check store_admins
      if (!hasAccess) {
        const { data: storeAdmin, error: storeAdminError } = await supabase
          .from("store_admins")
          .select("role, store_id")
          .eq("user_id", authData.user.id)
          .eq("is_active", true)
          .maybeSingle() as { data: { role: string; store_id: string } | null; error: any }

        if (storeAdminError && storeAdminError.code !== "PGRST116") {
          console.error("[Login] Store admin check error:", storeAdminError)
          throw new Error("فشل التحقق من الصلاحيات. يرجى المحاولة مرة أخرى")
        }

        console.log("[Login] Store admin found:", { storeAdmin, hasAccess: !!storeAdmin })

        if (storeAdmin) {
          hasAccess = true
          userStoreId = storeAdmin.store_id
          console.log("[Login] ✓ User has admin access via store_admins")
        }
      }

      if (!hasAccess) {
        console.warn("[Login] ✗ User has NO admin access", {
          userId: authData.user.id,
          profileRole: profile?.role,
          profileStoreId: profile?.store_id,
          storeId: storeId
        })
        await supabase.auth.signOut()
        throw new Error("ليس لديك صلاحيات الوصول للوحة التحكم. يرجى التواصل مع الدعم الفني")
      }

      // If on a subdomain, verify user can access THIS store
      if (storeId) {
        let canAccessStore = false
        
        // Check if user is admin for this specific store in store_admins
        const { data: storeAdmin, error: storeAdminCheckError } = await supabase
          .from("store_admins")
          .select("id")
          .eq("user_id", authData.user.id)
          .eq("store_id", storeId)
          .eq("is_active", true)
          .maybeSingle() as { data: { id: string } | null; error: any }

        if (storeAdminCheckError && storeAdminCheckError.code !== "PGRST116") {
          console.error("[Login] Store access check error:", storeAdminCheckError)
          throw new Error("فشل التحقق من صلاحيات المتجر")
        }

        if (storeAdmin) {
          canAccessStore = true
          console.log("[Login] ✓ User has access via store_admins for store:", storeId)
        } else if (userStoreId === storeId) {
          // Fallback to profiles.store_id for legacy single-store support
          canAccessStore = true
          console.log("[Login] ✓ User has access via profiles.store_id for store:", storeId)
        }

        if (!canAccessStore) {
          console.warn("[Login] Access denied - user not in store:", { 
            userId: authData.user.id, 
            attemptedStoreId: storeId,
            userProfileStoreId: userStoreId
          })
          await supabase.auth.signOut()
          throw new Error("هذا الحساب لا يملك صلاحية الوصول لهذا المتجر")
        }
      } else {
        // Not on a subdomain, but user has access - redirect to main admin
        console.log("[Login] ✓ User logged in (no subdomain), using first store:", userStoreId)
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


"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowRight } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      
      console.log("🔐 [LOGIN] Starting authentication...")
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        console.error("❌ [LOGIN] Auth error:", authError)
        throw authError
      }
      if (!authData.user) {
        console.error("❌ [LOGIN] No user data returned")
        throw new Error("فشل تسجيل الدخول")
      }

      console.log("✅ [LOGIN] Auth successful, user ID:", authData.user.id)
      console.log("🔍 [LOGIN] Fetching profile/store_admin for user:", authData.user.id)

      // أولاً: نحاول جلب الـ profile
      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, store_id")
        .eq("id", authData.user.id)
        .maybeSingle() as { data: { role: string, store_id: string | null } | null, error: any }

      console.log("📊 [LOGIN] Profile query result:", { profile, profileError })

      // إذا مفيش profile، نحاول نجيب من store_admins
      if (!profile) {
        console.log("🔍 [LOGIN] No profile found, checking store_admins...")
        const { data: storeAdmin, error: storeAdminError } = await supabase
          .from("store_admins")
          .select("role, store_id, email")
          .eq("user_id", authData.user.id)
          .eq("is_active", true)
          .maybeSingle()

        console.log("📊 [LOGIN] Store admin query result:", { storeAdmin, storeAdminError })

        if (storeAdmin) {
          // المستخدم موجود كـ store admin
          profile = {
            role: storeAdmin.role === "owner" ? "admin" : storeAdmin.role,
            store_id: storeAdmin.store_id
          }
          console.log("✅ [LOGIN] Found store admin, mapped role:", profile.role)
        }
      }

      if (!profile) {
        console.error("❌ [LOGIN] No profile or store_admin found for user")
        throw new Error("لم يتم العثور على بيانات المستخدم. تأكد من إنشاء متجر أولاً.")
      }

      console.log("✅ [LOGIN] Profile/Admin found, role:", profile.role)

      // السماح لـ admin, store_owner, owner
      const allowedRoles = ["admin", "store_owner", "owner", "super_admin"]
      if (!allowedRoles.includes(profile.role)) {
        console.warn("⚠️ [LOGIN] User is not admin, role:", profile.role)
        await supabase.auth.signOut()
        throw new Error("ليس لديك صلاحيات الوصول للوحة التحكم")
      }

      // Clear user-specific cache on successful login
      try {
        const { clearUserCacheOnLogin } = await import("@/lib/client/clearClientData")
        await clearUserCacheOnLogin()
      } catch (e) {
        // Best effort - ignore errors
      }

      console.log("🎉 [LOGIN] Admin login successful!")
      toast({ title: "تم تسجيل الدخول", description: "مرحباً بك في لوحة التحكم" })
      router.push("/admin")
      router.refresh()
    } catch (error: any) {
      console.error("💥 [LOGIN] Final error:", error)
      toast({
        title: "خطأ",
        description: error.message || "فشل تسجيل الدخول",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
              />
            </div>
            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="rounded-lg"
              />
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

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, UserPlus } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

// كود سري لإنشاء حساب admin - غيّره في production!
const ADMIN_SECRET_CODE = "mecca-admin-2024"

export default function AdminSignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [secretCode, setSecretCode] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // التحقق من الكود السري
      if (secretCode !== ADMIN_SECRET_CODE) {
        throw new Error("الكود السري غير صحيح")
      }

      // استدعاء API لإنشاء admin
      const response = await fetch('/api/admin/users/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
        })
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || "فشل إنشاء الحساب")
      }

      toast({
        title: "تم إنشاء الحساب",
        description: "تم إنشاء حساب المسؤول بنجاح. يمكنك تسجيل الدخول الآن.",
      })

      // الانتقال لصفحة تسجيل الدخول
      router.push("/admin/login")
    } catch (error: any) {
      console.error("Signup error:", error)
      toast({
        title: "خطأ",
        description: error.message || "فشل إنشاء الحساب",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">إنشاء حساب مسؤول</CardTitle>
          <CardDescription>أدخل بيانات الحساب والكود السري</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أحمد محمد"
                required
                disabled={loading}
              />
            </div>
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
                minLength={6}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="secretCode">الكود السري</Label>
              <Input
                id="secretCode"
                type="password"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                placeholder="أدخل الكود السري"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                الكود السري مطلوب لإنشاء حساب مسؤول
              </p>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الإنشاء...
                </>
              ) : (
                "إنشاء الحساب"
              )}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">لديك حساب بالفعل؟ </span>
              <a href="/admin/login" className="text-primary hover:underline">
                تسجيل الدخول
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

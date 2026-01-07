"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { User, Settings, LogOut, Mail, Phone, Save } from "lucide-react"

interface AccountClientProps {
  user: any
  profile: any
  orders: any[]
}

export function AccountClient({ user, profile }: AccountClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    name: profile?.name || "",
    phone: profile?.phone_number || "",
  })

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          name: profileData.name,
          phone_number: profileData.phone,
          updated_at: new Date().toISOString(),
        } as any)
      if (error) throw error
      router.refresh()
      alert("تم تحديث الملف الشخصي بنجاح")
    } catch (error: any) {
      console.error("Error updating profile:", error)
      alert("حدث خطأ أثناء تحديث الملف الشخصي")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    const target = `/auth?_cb=${Date.now()}`
    if (typeof window !== "undefined") {
      window.location.replace(target)
    } else {
      router.push("/auth")
      router.refresh()
    }
  }

  return (
    <Tabs defaultValue="profile" className="w-full max-w-3xl mx-auto">
      <TabsList className="grid w-full grid-cols-2 gap-2 mb-8 bg-white/80 backdrop-blur-sm p-2 rounded-2xl shadow-lg border-0">
        <TabsTrigger 
          value="profile" 
          className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-3 transition-all duration-300"
        >
          <User className="h-4 w-4" />
          الملف الشخصي
        </TabsTrigger>
        <TabsTrigger 
          value="settings"
          className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-3 transition-all duration-300"
        >
          <Settings className="h-4 w-4" />
          الإعدادات
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="animate-in fade-in-50 duration-300">
        <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">الملف الشخصي</CardTitle>
                <CardDescription>قم بتحديث معلوماتك الشخصية هنا</CardDescription>
              </div>
            </div>
          </CardHeader>
          <form onSubmit={handleProfileUpdate}>
            <CardContent className="space-y-6 p-8">
              <div className="space-y-3">
                <Label htmlFor="email" className="flex items-center gap-2 font-medium">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  البريد الإلكتروني
                </Label>
                <Input 
                  id="email" 
                  value={user.email} 
                  disabled 
                  className="bg-muted/50 border-0 rounded-xl h-12 text-muted-foreground" 
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="name" className="flex items-center gap-2 font-medium">
                  <User className="h-4 w-4 text-muted-foreground" />
                  الاسم
                </Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="أدخل اسمك"
                  className="border-0 bg-muted/50 rounded-xl h-12 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="phone" className="flex items-center gap-2 font-medium">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  رقم الهاتف
                </Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="أدخل رقم هاتفك"
                  className="border-0 bg-muted/50 rounded-xl h-12 focus:ring-2 focus:ring-primary"
                />
              </div>
            </CardContent>
            <CardFooter className="p-8 pt-0">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full rounded-xl py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جاري الحفظ...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-5 w-5" />
                    حفظ التغييرات
                  </span>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>

      <TabsContent value="settings" className="animate-in fade-in-50 duration-300">
        <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                <Settings className="h-7 w-7 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-xl">إعدادات الحساب</CardTitle>
                <CardDescription>إدارة أمان حسابك وتسجيل الخروج</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="bg-red-50/50 rounded-2xl p-6 border border-red-100">
              <h3 className="font-bold text-foreground mb-2">تسجيل الخروج</h3>
              <p className="text-sm text-muted-foreground mb-4">
                سيتم تسجيل خروجك من حسابك على هذا الجهاز
              </p>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="rounded-xl px-6 py-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                <LogOut className="h-5 w-5 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { User, Settings, LogOut, Mail, Phone, Save, Store, CreditCard, ExternalLink } from "lucide-react"

interface AccountClientProps {
  user: any
  profile: any
  orders: any[]
}

interface Store {
  id: string
  store_name: string
  subdomain: string
  status?: string
  subscription_status?: string
}

interface Subscription {
  id: string
  store_id: string
  plan_id: string
  status: string
  start_date: string
  end_date: string
  amount_paid: number
}

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  duration_days: number
}

export function AccountClient({ user, profile }: AccountClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [stores, setStores] = useState<Store[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [profileData, setProfileData] = useState({
    name: profile?.name || "",
    phone: profile?.phone_number || "",
  })

  const supabase = getSupabaseBrowserClient()

  // Load stores, subscriptions, and plans
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user's stores
        const { data: storesData } = await supabase
          .from("stores")
          .select("*")
          .eq("owner_id", user.id)

        if (storesData) setStores(storesData)

        // Load subscriptions
        if (storesData && storesData.length > 0) {
          const storeIds = storesData.map(s => s.id)
          const { data: subsData } = await supabase
            .from("subscriptions")
            .select("*")
            .in("store_id", storeIds)

          if (subsData) setSubscriptions(subsData)
        }

        // Load plans
        const { data: plansData } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true)

        if (plansData) setPlans(plansData)
      } catch (err) {
        console.error("Error loading data:", err)
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [user.id])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
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
    await supabase.auth.signOut()
    const target = `/auth?_cb=${Date.now()}`
    if (typeof window !== "undefined") {
      window.location.replace(target)
    } else {
      router.push("/auth")
      router.refresh()
    }
  }

  const getPlanName = (planId: string) => {
    const plan = plans.find(p => p.id === planId)
    return plan?.name || "خطة غير معروفة"
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-500">نشط</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">قيد الانتظار</Badge>
      case "failed":
        return <Badge className="bg-red-500">فشل</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white py-8 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 gap-2 mb-8 bg-white/80 backdrop-blur-sm p-2 rounded-2xl shadow-lg border-0">
            <TabsTrigger
              value="profile"
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2 text-sm transition-all duration-300"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">الملف</span>
            </TabsTrigger>
            <TabsTrigger
              value="stores"
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2 text-sm transition-all duration-300"
            >
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">المتاجر</span>
            </TabsTrigger>
            <TabsTrigger
              value="subscriptions"
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2 text-sm transition-all duration-300"
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">الاشتراكات</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2 text-sm transition-all duration-300"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">الإعدادات</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
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

          {/* Stores Tab */}
          <TabsContent value="stores" className="animate-in fade-in-50 duration-300">
            <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <Store className="h-7 w-7 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">متاجري</CardTitle>
                    <CardDescription>قائمة جميع متاجرك</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {loadingData ? (
                  <div className="text-center py-8">
                    <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
                  </div>
                ) : stores.length === 0 ? (
                  <div className="text-center py-12">
                    <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-4">لم تنشئ أي متاجر بعد</p>
                    <Button asChild>
                      <a href="/create-store">إنشاء متجر جديد</a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stores.map(store => (
                      <div key={store.id} className="p-4 border border-border rounded-2xl hover:bg-primary/5 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-lg">{store.store_name}</h3>
                            <p className="text-sm text-muted-foreground">{store.subdomain}.xfuse.online</p>
                          </div>
                          <div className="flex gap-2">
                            {getStatusBadge(store.subscription_status || "unknown")}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-lg" asChild>
                          <a href={`https://${store.subdomain}.xfuse.online/admin`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 ml-2" />
                            الدخول للمتجر
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="animate-in fade-in-50 duration-300">
            <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center">
                    <CreditCard className="h-7 w-7 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">اشتراكاتي</CardTitle>
                    <CardDescription>الخطط المشترك فيها</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {loadingData ? (
                  <div className="text-center py-8">
                    <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
                  </div>
                ) : subscriptions.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-4">لا توجد اشتراكات نشطة</p>
                    <Button asChild>
                      <a href="/subscription/plans">اختر خطة</a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subscriptions.map(sub => {
                      const store = stores.find(s => s.id === sub.store_id)
                      return (
                        <div key={sub.id} className="p-4 border border-border rounded-2xl hover:bg-purple-50/50 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              {/* اسم المتجر والرابط */}
                              {store && (
                                <div className="mb-3 pb-3 border-b border-border/50">
                                  <h4 className="font-semibold text-base text-foreground">{store.store_name}</h4>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {store.subdomain}.xfuse.online
                                  </p>
                                </div>
                              )}
                              {/* اسم الخطة */}
                              <h3 className="font-bold text-lg">{getPlanName(sub.plan_id)}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                الفترة: {new Date(sub.start_date).toLocaleDateString('ar-EG')} - {new Date(sub.end_date).toLocaleDateString('ar-EG')}
                              </p>
                            </div>
                            {getStatusBadge(sub.status)}
                          </div>
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-sm text-muted-foreground">المبلغ: {sub.amount_paid} ج.م</span>
                            <div className="flex gap-2">
                              {store && (
                                <Button variant="outline" size="sm" className="rounded-lg" asChild>
                                  <a href={`https://${store.subdomain}.xfuse.online/admin`} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 ml-2" />
                                    لوحة التحكم
                                  </a>
                                </Button>
                              )}
                              <Button variant="outline" size="sm" className="rounded-lg" asChild>
                                <a href={`/subscription/plans?store_id=${sub.store_id}`}>
                                  تجديد الاشتراك
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
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
      </div>
    </div>
  )
}

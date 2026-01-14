"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { humanizeOrderStatus, getStatusBadgeClass } from "@/lib/status"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Package, TrendingUp, Users, Eye, ExternalLink, AlertTriangle, CheckCircle } from "lucide-react"
import Image from "next/image"
import { getAllProducts } from "@/lib/products-data"
import Link from "next/link"
import { useSettingsStore } from "@/store/settings-store"
import { createBrowserClient } from "@supabase/ssr"

export default function AdminDashboard() {
  const { settings, loadSettings } = useSettingsStore()
  const [subscriptionStatus, setSubscriptionStatus] = useState<"active" | "pending" | "failed" | "unknown">("unknown")
  const [storeId, setStoreId] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Check subscription status
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Try to get store from store_admins (supports multiple stores)
        const { data: storeAdmin } = await supabase
          .from("store_admins")
          .select("store_id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle()

        let storeRecord = storeAdmin?.store_id

        // Fallback: check profiles table
        if (!storeRecord) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("store_id")
            .eq("id", user.id)
            .maybeSingle()
          storeRecord = profile?.store_id
        }

        // Fallback: check stores by owner_id (legacy)
        if (!storeRecord) {
          const { data: store } = await supabase
            .from("stores")
            .select("id, subscription_status")
            .eq("owner_id", user.id)
            .maybeSingle()
          storeRecord = store?.id
        }

        if (storeRecord) {
          setStoreId(storeRecord)
          
          // Check subscription status
          const { data: subscription } = await supabase
            .from("subscriptions")
            .select("status")
            .eq("store_id", storeRecord)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()

          if (subscription) {
            setSubscriptionStatus(subscription.status)
          }
        }
      } catch (err) {
        console.error("Error checking subscription:", err)
      }
    }

    checkSubscriptionStatus()
  }, [])

  const products = getAllProducts()
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    weeklyNewCustomers: 0,
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [topViewedProducts, setTopViewedProducts] = useState<any[]>([])
  const [loadingTopProducts, setLoadingTopProducts] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard")
        const result = await res.json()
        if (result.stats) setStats(result.stats)
        if (result.recentOrders) setRecentOrders(result.recentOrders)
      } catch (err) {
        // fallback to products count if API fails
        setStats((prev) => ({ ...prev, totalProducts: products.length }))
      }
    }

    async function fetchTopViewed() {
      try {
        setLoadingTopProducts(true)
        const res = await fetch("/api/admin/analytics/top-viewed-products")
        if (res.ok) {
          const data = await res.json()
          setTopViewedProducts(data.products || [])
        }
      } catch (error) {
        console.error("Failed to fetch top viewed products", error)
      } finally {
        setLoadingTopProducts(false)
      }
    }

    fetchDashboard()
    fetchTopViewed()
  }, [products.length])

  // status colors are provided via `getStatusBadgeClass`

  const revenueChange = Number((stats as any).revenueMoM ?? 0)
  const revenueSign = revenueChange > 0 ? "+" : ""
  const revenueClass = revenueChange >= 0 ? "text-green-600" : "text-red-600"

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">مرحباً بك في لوحة التحكم</h1>
          <p className="text-muted-foreground text-base">نظرة عامة على أداء {settings.siteName}</p>
        </div>
        <Button asChild variant="outline" className="gap-2 bg-transparent">
          <Link href="/" target="_blank">
            <ExternalLink className="h-4 w-4" />
            عرض الموقع
          </Link>
        </Button>
      </div>

      {/* Subscription Status Alert */}
      {subscriptionStatus !== "active" && (
        <div className={`mb-8 p-4 rounded-lg flex gap-4 border-2 ${
          subscriptionStatus === "pending" 
            ? "bg-yellow-50 border-yellow-200" 
            : "bg-orange-50 border-orange-200"
        }`}>
          {subscriptionStatus === "pending" ? (
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h3 className={`font-bold mb-1 ${
              subscriptionStatus === "pending" 
                ? "text-yellow-900" 
                : "text-orange-900"
            }`}>
              {subscriptionStatus === "pending" 
                ? "🔄 اشتراكك قيد المعالجة" 
                : "⚠️ متجرك غير نشط حالياً"}
            </h3>
            <p className={`text-sm mb-3 ${
              subscriptionStatus === "pending" 
                ? "text-yellow-800" 
                : "text-orange-800"
            }`}>
              {subscriptionStatus === "pending"
                ? "يتم معالجة طلب الدفع الخاص بك. قد يستغرق بضع دقائق. سيتم تفعيل متجرك تلقائياً عند تأكيد الدفع."
                : "متجرك لم يتم تفعيله بعد. اختر باقة واشترك الآن لتفعيل متجرك والبدء في البيع على الإنترنت."}
            </p>
            <Button asChild className="gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
              <Link href={`/subscription/plans${storeId ? `?store_id=${storeId}` : ""}`}>
                ادفع الآن لتفعيل المتجر
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Active Subscription Badge */}
      {subscriptionStatus === "active" && (
        <div className="mb-8 p-4 rounded-lg bg-green-50 border-2 border-green-200 flex gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-green-900">✅ متجرك نشط ومفعل</h3>
            <p className="text-sm text-green-800">اشتراكك نشط وجاهز. متجرك الآن متاح على الإنترنت.</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-2 border-border hover:border-primary/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المبيعات</CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{Number(stats.totalRevenue || 0).toLocaleString('en-US')} ج.م</div>
            <p className={`text-xs ${revenueClass} mt-1 font-medium`}>{revenueSign}{revenueChange.toFixed(1)}% عن الشهر الماضي</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-border hover:border-primary/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">الطلبات</CardTitle>
            <ShoppingBag className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{Number(stats.totalOrders || 0).toLocaleString('en-US')}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{stats.pendingOrders} طلب قيد المعالجة</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-border hover:border-primary/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">المنتجات</CardTitle>
            <Package className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{Number(stats.totalProducts || 0).toLocaleString('en-US')}</div>
            <p className="text-xs text-orange-600 mt-1 font-medium">{stats.lowStockProducts} منتج مخزون منخفض</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-border hover:border-primary/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">العملاء</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{Number(stats.totalCustomers || 0).toLocaleString('en-US')}</div>
            <p className="text-xs text-green-600 mt-1 font-medium">+{stats.weeklyNewCustomers ?? 0} عميل جديد هذا الأسبوع</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card className="border-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold text-foreground">الطلبات الأخيرة</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/orders">عرض الكل</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-foreground">{order.id}</span>
                      <span className={getStatusBadgeClass(order.status)}>{humanizeOrderStatus(order.status)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">{order.customer}</p>
                    <p className="text-xs text-muted-foreground">{order.date}</p>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-primary">{Number(order.total || 0).toLocaleString('en-US')} ج.م</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold text-foreground">المنتجات الأكثر مشاهدة</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/products">إدارة المنتجات</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loadingTopProducts ? (
                <p className="text-center text-muted-foreground py-8">جارِ التحميل...</p>
              ) : topViewedProducts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات مشاهدة بعد</p>
              ) : (
                topViewedProducts.slice(0, 5).map((product) => (
                  <Link
                    key={product.productId}
                    href={`/product/${product.productId}`}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-all"
                  >
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-muted-foreground opacity-50" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">{product.name || "منتج غير معروف"}</h3>
                      {/* Category is not in event payload yet, could be fetched if needed */}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm font-medium">{product.views}</span>
                      </div>
                      {product.price && (
                        <div className="font-bold text-primary">
                          {Number(product.price).toLocaleString("en-US")} {product.currency || "ج.م"}
                        </div>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

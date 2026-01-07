"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, DollarSign, ShoppingBag, Users, Package, Eye, CreditCard, ArrowRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Types matches API responses
type AnalyticsData = {
  revenue: { total: number; previousTotal: number; changePercent: number; daily: any[] }
  orders: { total: number; previousTotal: number; changePercent: number }
  customers: { total: number }
  products: { total: number }
}

type EventsSummaryData = {
  summary: Record<string, number>
  funnel: {
    views: number
    addToCart: number
    checkout: number
    purchases: number
    viewToCartRate: number
    cartToCheckoutRate: number
    checkoutToPurchaseRate: number
    viewToPurchaseRate: number
  }
  daily: any[]
}

type ProductFunnelData = {
  products: Array<{
    productId: string
    productName: string | null
    views: number
    addToCart: number
    checkout: number
    purchases: number
    viewToPurchaseRate: number
  }>
}

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState("30d")
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [events, setEvents] = useState<EventsSummaryData | null>(null)
  const [productFunnel, setProductFunnel] = useState<ProductFunnelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const to = new Date()
      const from = new Date()
      if (dateRange === "7d") from.setDate(to.getDate() - 7)
      else if (dateRange === "90d") from.setDate(to.getDate() - 90)
      else from.setDate(to.getDate() - 30)

      const query = `?from=${from.toISOString()}&to=${to.toISOString()}`

      const [analyticsRes, eventsRes, productsRes] = await Promise.all([
        fetch(`/api/admin/analytics${query}`),
        fetch(`/api/admin/analytics/events-summary${query}`),
        fetch(`/api/admin/analytics/products-funnel${query}`),
      ])

      if (!analyticsRes.ok || !eventsRes.ok || !productsRes.ok) {
        throw new Error("Failed to fetch analytics data")
      }

      setAnalytics(await analyticsRes.json())
      setEvents(await eventsRes.json())
      setProductFunnel(await productsRes.json())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading && !analytics) {
    return <div className="p-8 text-center text-muted-foreground">جاري تحميل التحليلات...</div>
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">خطأ: {error}</div>
        <Button onClick={fetchData} className="mt-4">إعادة المحاولة</Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-8" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">التحليلات والإحصائيات</h1>
          <p className="text-muted-foreground text-sm md:text-base">تقارير الأداء والمبيعات</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="اختر الفترة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">آخر 7 أيام</SelectItem>
            <SelectItem value="30d">آخر 30 يوم</SelectItem>
            <SelectItem value="90d">آخر 90 يوم</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-2">
              {Number(analytics?.revenue.total || 0).toLocaleString("en-US")} ج.م
            </div>
            <p className={`text-xs font-medium ${analytics?.revenue.changePercent && analytics.revenue.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
              {analytics?.revenue.changePercent ? (analytics.revenue.changePercent > 0 ? "+" : "") + analytics.revenue.changePercent.toFixed(1) + "%" : "0%"} مقارنة بالفترة السابقة
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">عدد الطلبات</CardTitle>
            <ShoppingBag className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-2">
              {Number(analytics?.orders.total || 0).toLocaleString("en-US")}
            </div>
            <p className={`text-xs font-medium ${analytics?.orders.changePercent && analytics.orders.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
              {analytics?.orders.changePercent ? (analytics.orders.changePercent > 0 ? "+" : "") + analytics.orders.changePercent.toFixed(1) + "%" : "0%"} مقارنة بالفترة السابقة
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">معدل التحويل (View → Purchase)</CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-2">
              {events?.funnel.viewToPurchaseRate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">نسبة الشراء من المشاهدات</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">العملاء</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-2">
              {analytics?.customers.total}
            </div>
            <p className="text-xs text-muted-foreground">إجمالي المسجلين</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle>مسار التحويل (Sales Funnel)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[
              { label: "مشاهدات المنتج", count: events?.funnel.views, rate: null, icon: Eye },
              { label: "إضافة للسلة", count: events?.funnel.addToCart, rate: events?.funnel.viewToCartRate, icon: ShoppingBag },
              { label: "بدء الدفع", count: events?.funnel.checkout, rate: events?.funnel.cartToCheckoutRate, icon: CreditCard },
              { label: "عمليات الشراء", count: events?.funnel.purchases, rate: events?.funnel.checkoutToPurchaseRate, icon: Package },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="flex items-center justify-between text-sm mb-2">
                  <div className="flex items-center gap-2">
                    <step.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{step.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold">{step.count || 0}</span>
                    {step.rate !== null && step.rate !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {/* @ts-ignore */}
                        ({(step.rate * 100).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-3 bg-primary/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{
                      width: `${events?.funnel.views ? ((step.count || 0) / events.funnel.views) * 100 : 0}%`,
                    }}
                  />
                </div>
                {i < 3 && (
                  <div className="absolute left-1/2 -bottom-4 transform -translate-x-1/2 text-muted-foreground/30">
                    <ArrowRight className="w-4 h-4 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts (Simple CSS Bar Chart for Daily Revenue) */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle>الإيرادات اليومية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-2">
            {analytics?.revenue.daily.map((day: any, i: number) => {
              const maxRevenue = Math.max(...(analytics?.revenue.daily.map((d: any) => d.total) || [1]))
              const height = (day.total / maxRevenue) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                  <div
                    className="w-full bg-primary/80 hover:bg-primary rounded-t transition-all relative"
                    style={{ height: `${height || 1}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {new Date(day.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}: {day.total}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Product Performance Table */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle>أداء المنتجات (Product Funnel)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm text-right">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 font-medium">المنتج</th>
                <th className="py-3 px-4 font-medium">مشاهدات</th>
                <th className="py-3 px-4 font-medium">إضافة للسلة</th>
                <th className="py-3 px-4 font-medium">بدء الدفع</th>
                <th className="py-3 px-4 font-medium">شراء</th>
                <th className="py-3 px-4 font-medium">معدل التحويل</th>
              </tr>
            </thead>
            <tbody>
              {productFunnel?.products.map((product) => (
                <tr key={product.productId} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4">{product.productName || "Unknown"}</td>
                  <td className="py-3 px-4">{product.views}</td>
                  <td className="py-3 px-4">{product.addToCart}</td>
                  <td className="py-3 px-4">{product.checkout}</td>
                  <td className="py-3 px-4 font-bold">{product.purchases}</td>
                  <td className="py-3 px-4">{product.viewToPurchaseRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

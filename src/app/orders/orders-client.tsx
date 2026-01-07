"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Search, ShoppingBag, ArrowRight, Loader2, Package } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { SiteLogo } from "@/components/site-logo"
import { getOrdersByEmail, type OrderSummary } from "@/lib/supabase/orders"
import { humanizeOrderStatus, getStatusBadgeClass } from "@/lib/status"
import { useSettingsStore } from "@/store/settings-store"
import { CancelOrderButton } from "./cancel-order-button"

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

interface OrdersClientProps {
  initialOrders?: OrderSummary[]
  user?: any // Supabase user object
}

export default function OrdersClient({ initialOrders = [], user }: OrdersClientProps) {
  const { settings, loadSettings } = useSettingsStore()

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [orders, setOrders] = useState<any[]>(initialOrders)
  const [error, setError] = useState<string | null>(null)
  // If we have a user, we effectively "searched" already
  const [searched, setSearched] = useState(!!user)

  useEffect(() => {
    if (!user) {
      // Only try to load email if not logged in
      const savedEmail = localStorage.getItem("orderCustomerEmail")
      if (savedEmail) {
        setEmail(savedEmail)
      }
    }
  }, [user])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError("من فضلك أدخل البريد الإلكتروني أو رقم الهاتف.")
      return
    }

    setIsLoading(true)
    setError(null)
    setSearched(true)

    try {
      const q = email.trim()

      const isEmail = q.includes("@")

      const normalizeEgyptPhone = (input: string) => {
        const digits = String(input).replace(/\D/g, "")
        if (!digits) return null

        let d = digits
        // remove leading international prefixes if present
        if (d.startsWith("0020")) d = d.slice(4)
        else if (d.startsWith("20") && d.length > 10) d = d.slice(2)

        // now d should be like 10xxxxxxxx or 1xxxxxxxxx or 01xxxxxxxxx
        if (d.length === 10 && d.startsWith("1")) return "0" + d
        if (d.length === 11 && d.startsWith("01")) return d

        return null
      }

      let identifier = q
      if (!isEmail) {
        const normalized = normalizeEgyptPhone(q)
        if (!normalized) {
          setError("من فضلك أدخِل بريدًا إلكترونيًا صالحًا أو رقم هاتف مصري صحيح.")
          setIsLoading(false)
          return
        }
        identifier = normalized
      }

      // This helper returns raw DB rows (snake_case) not OrderSummary (camelCase)
      // We might need to adapt the type or just handle both in the render
      const data = await getOrdersByEmail(identifier)
      setOrders(data || [])
      localStorage.setItem("orderCustomerEmail", identifier)
    } catch (err: any) {
      console.error("Error fetching orders:", err)
      setError("لم يتم العثور على طلبات بهذا البريد أو رقم الهاتف.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20" dir="rtl">
      <header className="border-b border-border bg-background/80 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <SiteLogo width={80} height={80} className="group-hover:scale-105 transition-transform" />
              <h1 className="text-2xl font-bold text-primary">{settings.siteName}</h1>
            </Link>
            <Button asChild variant="outline" size="sm" className="border-border hover:bg-primary/10 bg-white/80 backdrop-blur-sm">
              <Link href="/">
                <ArrowRight className="h-4 w-4 ml-2" />
                متابعة التسوق
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-background border-b">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-2xl translate-y-1/2 translate-x-1/2" />
        
        <div className="container mx-auto px-4 py-12 relative">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Package className="w-4 h-4" />
              تتبع طلباتك
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">طلباتي</h1>
            <p className="text-muted-foreground">تابعي حالة طلباتك السابقة بسهولة</p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {!user && (
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
              <CardContent className="p-6">
                <div className="mb-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">من فضلك سجّل الدخول لمشاهدة طلباتك مباشرة</p>
                  <Button asChild variant="link" className="text-primary font-medium">
                    <Link href="/auth">تسجيل الدخول</Link>
                  </Button>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">أو ابحث بالبريد / الهاتف</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="w-full space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      البريد الإلكتروني أو رقم الهاتف المستخدم في الطلب
                    </label>
                    <Input
                      id="email"
                      type="text"
                      placeholder="example@email.com أو 01012345678"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 border-2 transition-all focus:border-primary"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="h-12 px-8 bg-primary hover:bg-primary/90 w-full sm:w-auto shadow-lg hover:shadow-xl transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <><Loader2 className="h-4 w-4 ml-2 animate-spin" /> جاري البحث...</>
                    ) : (
                      <><Search className="h-4 w-4 ml-2" /> عرض الطلبات</>
                    )}
                  </Button>
                </form>
                {error && (
                  <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Orders List */}
          {(searched || user) && !isLoading && (
            <div className="space-y-4 animate-in fade-in-50">
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order, index) => {
                    // Handle both snake_case (from browser helper) and camelCase (from server helper)
                    const orderId = order.id
                    const orderNumber = order.orderNumber || order.order_number
                    const status = order.status
                    const total = order.total
                    const currency = order.currency || "EGP"
                    const createdAt = order.createdAt || order.created_at
                    const itemsCount = order.itemsCount // might be undefined in browser helper
                    
                    return (
                      <Card 
                        key={orderId} 
                        className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom-4"
                        style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
                      >
                        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-muted/50 to-transparent pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Package className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">رقم الطلب</p>
                              <p className="font-bold text-lg">#{orderNumber}</p>
                            </div>
                          </div>
                          <span className={`${getStatusBadgeClass(status)} px-4 py-2 rounded-full text-sm font-medium`}>
                            {humanizeOrderStatus(status)}
                          </span>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between pt-4">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <span>📅</span> {formatDate(createdAt)}
                            </p>
                            {itemsCount !== undefined && itemsCount !== null && (
                               <p className="text-sm text-muted-foreground flex items-center gap-2">
                                 <span>📦</span> {itemsCount} منتج
                               </p>
                            )}
                          </div>
                          <div className="text-right space-y-2">
                            <p className="font-bold text-2xl text-primary">
                              {Number(total).toLocaleString('ar-EG')} {currency}
                            </p>
                            {user && (
                              <CancelOrderButton 
                                orderId={orderId} 
                                status={status} 
                                onOrderCancelled={() => {
                                  // Re-fetch orders or reload
                                  if (user) {
                                    window.location.reload()
                                  } else {
                                    handleSearch(new Event('submit') as any)
                                  }
                                }}
                              />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-full h-full">
                      <div className="w-24 h-24 border-2 border-dashed border-muted-foreground/20 rounded-full animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">لا توجد طلبات</h3>
                  <p className="text-muted-foreground mb-6">
                    {user 
                      ? "لا توجد طلبات مسجلة على هذا الحساب بعد." 
                      : "لم نتمكن من العثور على أي طلبات مرتبطة بهذا البريد الإلكتروني أو رقم الهاتف."}
                  </p>
                  <Button asChild>
                    <Link href="/">ابدئي التسوق الآن</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

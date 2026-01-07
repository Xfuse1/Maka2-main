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
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b border-border bg-background sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <SiteLogo width={80} height={80} />
              <h1 className="text-2xl font-bold text-primary">{settings.siteName}</h1>
            </Link>
            <Button asChild variant="outline" size="sm" className="border-border hover:bg-primary/10 bg-transparent">
              <Link href="/">
                <ArrowRight className="h-4 w-4 ml-2" />
                متابعة التسوق
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">طلباتي</h1>
            <p className="text-muted-foreground">تابعي حالة طلباتك السابقة بسهولة</p>
          </div>

          {!user && (
            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <div className="mb-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">من فضلك سجّل الدخول لمشاهدة طلباتك مباشرة</p>
                  <Button asChild variant="link" className="text-primary">
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
                      className="h-12"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="h-12 px-8 bg-primary hover:bg-primary/90 w-full sm:w-auto"
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
                  <p className="text-destructive text-sm mt-2">{error}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Orders List */}
          {(searched || user) && !isLoading && (
            <div className="space-y-4 animate-in fade-in-50">
              {orders.length > 0 ? (
                <div className="mt-10 space-y-4">
                  {orders.map((order) => {
                    // Handle both snake_case (from browser helper) and camelCase (from server helper)
                    const orderId = order.id
                    const orderNumber = order.orderNumber || order.order_number
                    const status = order.status
                    const total = order.total
                    const currency = order.currency || "EGP"
                    const createdAt = order.createdAt || order.created_at
                    const itemsCount = order.itemsCount // might be undefined in browser helper
                    
                    return (
                      <Card key={orderId} className="border border-border">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">رقم الطلب</p>
                            <p className="font-semibold">#{orderNumber}</p>
                          </div>
                          <span className={getStatusBadgeClass(status)}>
                            {humanizeOrderStatus(status)}
                          </span>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between text-sm">
                          <div>
                            <p>التاريخ: {formatDate(createdAt)}</p>
                            {itemsCount !== undefined && itemsCount !== null && (
                               <p>عدد المنتجات: {itemsCount}</p>
                            )}
                          </div>
                          <div className="text-right space-y-2">
                            <p className="font-bold text-primary">
                              {Number(total).toFixed(2)} {currency}
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
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">لا توجد طلبات</h3>
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

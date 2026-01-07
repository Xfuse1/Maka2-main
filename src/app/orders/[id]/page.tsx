"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getOrderById } from "@/lib/supabase/orders"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, ShoppingBag, Eye } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { SiteLogo } from "@/components/site-logo"
import { useRouter } from "next/navigation"
import { useSettingsStore } from "@/store/settings-store"

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString("ar-EG", { dateStyle: "long", timeStyle: "short" })
  } catch { return value }
}

function formatItemAttributes(item: any) {
  if (!item) return ""
  const parts: string[] = []
  if (item.color) parts.push(`اللون: ${item.color}`)
  if (item.size) parts.push(`المقاس: ${item.size}`)
  // fallback checks
  if (!parts.length) {
    if (item.variant_name_ar || item.variant_name_en) parts.push(item.variant_name_ar || item.variant_name_en)
    if (item.attributes && typeof item.attributes === 'object') {
      Object.entries(item.attributes).forEach(([k, v]) => parts.push(`${k}: ${v}`))
    }
  }
  return parts.join(' • ')
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { settings, loadSettings } = useSettingsStore()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    const orderId = params.id as string
    if (!orderId || orderId === 'undefined' || orderId === 'null') {
      router.replace('/orders')
      return
    }

    getOrderById(orderId)
      .then((data) => {
        if (!data) setError('الطلب غير موجود')
        else setOrder(data)
      })
      .catch((err) => {
        console.error('Error loading order:', err)
        setError(err?.message || 'حدث خطأ في تحميل الطلب')
      })
      .finally(() => setLoading(false))
  }, [params.id, router])

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    </div>
  )

  if (error || !order) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl text-foreground mb-4">{error || 'الطلب غير موجود'}</p>
        <Button asChild>
          <Link href="/">العودة للرئيسية</Link>
        </Button>
      </div>
    </div>
  )

  const items = Array.isArray(order.items) ? order.items : []

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <SiteLogo width={80} height={80} />
              <h1 className="text-2xl font-bold text-primary">{settings.siteName}</h1>
            </Link>
            <Button asChild variant="outline" size="sm" className="border-border hover:bg-primary/10 bg-transparent">
              <Link href="/orders">
                <ArrowRight className="h-4 w-4 ml-2" />
                رجوع للطلبات
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">تفاصيل الطلب</h2>
              <p className="text-sm text-muted-foreground">رقم الطلب: <span className="font-mono">{order.id}</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">الحالة</p>
              <p className="font-semibold text-primary">{order.status}</p>
              <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded">
            <div>
              <p className="text-xs text-muted-foreground">بيانات المستلم</p>
              <p className="font-medium">{order.customer_name || order.customer || ''}</p>
              {order.customer_phone && <p className="text-sm">{order.customer_phone}</p>}
              {order.customer_email && <p className="text-sm">{order.customer_email}</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">العنوان</p>
              <p className="font-medium">{order.shipping_address || order.address || ''}</p>
              {order.shipping_city && <p className="text-sm">{order.shipping_city}</p>}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-2">المنتجات</h3>
            <div className="space-y-3">
              {items.map((it: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-card rounded">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-24 relative rounded overflow-hidden bg-muted">
                      <Image
                        src={it.image || it.product_image || it.product?.image || "/placeholder.svg"}
                        alt={it.name || it.title || 'منتج'}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div>
                      <p className="font-medium">{it.name || it.title || it.product_name || it.product?.name || 'منتج'}</p>
                      <p className="text-sm text-muted-foreground">{formatItemAttributes(it)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{(it.quantity ?? it.qty ?? 1)} × {(it.price ?? it.unit_price ?? it.total ?? 0)} ج.م</p>
                    <p className="text-sm text-muted-foreground">المجموع: {((it.quantity ?? it.qty ?? 1) * (it.price ?? it.unit_price ?? it.total ?? 0))} ج.م</p>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-sm text-muted-foreground">لا توجد تفاصيل منتجات في هذا الطلب.</div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/10 rounded">
            <div>
              <p className="text-sm text-muted-foreground">طريقة الدفع</p>
              <p className="font-medium">{order.payment_method || order.payment || 'غير محدد'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">الإجمالي</p>
              <p className="text-2xl font-bold text-primary">{order.total ?? order.total_price ?? 0} ج.م</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button asChild>
              <Link href="/">العودة للمتجر</Link>
            </Button>
          </div>
        </div>
      </div>

      <footer className="border-t border-border bg-background py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© 2025 {settings.siteName}. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  )
}

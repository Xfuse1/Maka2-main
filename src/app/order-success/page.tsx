// app/order-success/page.tsx
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PurchaseTracker } from "./order-purchase-tracker"
import { ClearCartOnSuccess } from "./clear-cart"

// Server Component (يدعم القراءة المباشرة من searchParams)
export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  // ننتظر searchParams حسب متطلبات Next.js 15
  const params = await searchParams
  
  // ندعم أكتر من اسم للبارام عشان ما يحصلش لخبطة
  // merchantOrderId هو الـ order ID الحقيقي اللي بنبعته لـ Kashier
  const raw =
    (params?.merchantOrderId ??
      params?.orderNumber ??
      params?.orderId ??
      params?.orderNum ??
      params?.order ??
      params?.id) || ""

  const orderNumber = Array.isArray(raw) ? raw[0] : raw
  
  // استخرج معلومات الدفع من Kashier
  const paymentStatus = params?.paymentStatus
  const transactionId = params?.transactionId
  const amount = params?.amount

  let orderDetails = null
  let user = null

  if (orderNumber) {
    const supabase = await createClient()
    
    // Payment state is updated only via secure webhooks; client callbacks are read-only.
    
    // Fetch order details
    const { data: orderData } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderNumber)
      .single()
      
    const order = orderData as any

    if (order) {
      // Fetch user if available
      const { data: userData } = await supabase.auth.getUser()
      user = userData.user

      // Map items to the format expected by PurchaseTracker
      const items = Array.isArray(order.items) 
        ? order.items.map((item: any) => ({
            id: item.product?.id || item.id || "unknown",
            name: item.product?.name_ar || item.name || "Product",
            price: item.price || item.product?.price || 0,
            quantity: item.quantity || 1
          }))
        : []

      orderDetails = {
        orderId: order.id,
        totalValue: order.total_price,
        items: items,
        userName: user?.email || "guest"
      }
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-green-50/30 px-4">
      {/* Clear cart after successful order (handles Kashier redirect) */}
      <ClearCartOnSuccess />
      {orderDetails && <PurchaseTracker {...orderDetails} />}
      
      <div className="max-w-xl w-full relative">
        {/* Decorative elements */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
        
        <div className="relative rounded-3xl border-0 bg-white/80 backdrop-blur-sm p-8 md:p-10 text-center shadow-2xl overflow-hidden">
          {/* Success indicator */}
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-green-400/30 rounded-full animate-ping" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">تم إرسال طلبك بنجاح! 🎉</h1>
          <p className="text-muted-foreground text-lg mb-8">
            شكراً لك! سنقوم بالتواصل معك لتأكيد تفاصيل الشحن والدفع.
          </p>

          {orderNumber ? (
            <div className="mb-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6">
              <p className="font-medium text-green-700 text-sm uppercase tracking-wide">رقم الطلب</p>
              <p className="text-2xl font-bold mt-2 text-foreground">{orderNumber}</p>
              {paymentStatus === 'SUCCESS' && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  تم الدفع بنجاح
                </div>
              )}
              {transactionId && (
                <p className="text-xs text-muted-foreground mt-3">
                  رقم المعاملة: {transactionId}
                </p>
              )}
            </div>
          ) : (
            <div className="mb-8 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-6">
              <p className="font-medium text-amber-700">رقم الطلب غير متوفر في الرابط.</p>
              <p className="text-sm text-muted-foreground mt-2">
                تأكد أن إعادة التوجيه تحتوي على ?orderNumber=123…
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border-2 border-border px-6 py-3 text-sm font-medium hover:bg-muted transition-colors"
            >
              العودة للرئيسية
            </Link>
            <Link
              href="/orders/"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-medium shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all"
            >
              متابعة طلباتي
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

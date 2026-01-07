"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Eye, Package, Truck, CheckCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateOrderStatus, getOrderById } from "@/lib/supabase/orders"

// Simple CalendarGrid component (top-level) to avoid runtime hoisting issues
function CalendarGrid(props: any) {
  const { monthDate, orders, formatDateKey, selectedDate, onSelectDate } = props
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const startDay = start.getDay()
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()

  const counts: any = {}
  ;(orders || []).forEach((o: any) => {
    const k = formatDateKey(o.created_at)
    if (!k) return
    counts[k] = (counts[k] || 0) + 1
  })

  const cells: any[] = []
  for (let i = 0; i < startDay; i++) cells.push({ date: null })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(monthDate.getFullYear(), monthDate.getMonth(), d) })
  while (cells.length % 7 !== 0) cells.push({ date: null })

  return (
    <div className="mt-2">
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, idx) => {
          if (!c.date) return <div key={idx} className="h-16 p-1" />
          const k = formatDateKey(c.date)
          const count = counts[k] || 0
          const isSelected = selectedDate === k
          return (
            <button
              key={idx}
              onClick={() => onSelectDate(k)}
              className={`h-16 p-2 text-sm rounded border ${isSelected ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted/50'}`}>
              <div className="text-right">{c.date.getDate()}</div>
              {count > 0 && <div className="text-xs text-muted-foreground mt-1">{count} طلب</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface Order {
  id: string
  customer_email: string
  customer_name: string
  customer_phone: string
  status: string
  created_at: string
  total: number
  items: any
  address: string
  payment_method: string
  shipping_address: string
  notes?: string | null
}

const orderStatuses = [
  { value: "pending", label: "تحت الإنشاء" },
  { value: "confirmed", label: "مؤكد" },
  { value: "processing", label: "جاري التجهيز" },
  { value: "shipped", label: "خرج للشحن" },
  { value: "delivered", label: "تم التوصيل" },
  { value: "cancelled", label: "ملغي" },
  { value: "refunded", label: "مسترجع" },
]

export default function AdminOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(25)
  const [loading, setLoading] = useState<boolean>(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [searchFocused, setSearchFocused] = useState<boolean>(false)
  const [calendarVisible, setCalendarVisible] = useState<boolean>(false)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null) // YYYY-MM-DD

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true)
        const res = await fetch(`/api/admin/orders?limit=${perPage}&page=${page}`)
        const result = await res.json()
        if (result.error) {
          console.error("Error fetching orders:", result.error)
          setLoading(false)
          return
        }
        const mapped = (result.orders || []).map((o: any) => {
          // prefer an existing single-field shipping_address
          const singleAddress = (o.shipping_address || o.address || o.shipping_address_full || "").trim()

          const parts = [
            o.shipping_address_line1,
            o.shipping_address_line2,
            o.shipping_city,
            o.shipping_state,
            o.shipping_postal_code,
            o.shipping_country,
          ].filter(Boolean)

          // fallback to billing address fields if shipping not present
          const billingParts = [
            o.billing_address_line1,
            o.billing_address_line2,
            o.billing_city,
            o.billing_state,
            o.billing_postal_code,
            o.billing_country,
          ].filter(Boolean)

          const composed = singleAddress || (parts.length ? parts.join(", ") : (billingParts.length ? billingParts.join(", ") : ""))

          const normalizedItems = Array.isArray(o.items)
            ? o.items
            : typeof o.items === "string"
            ? (() => {
                try {
                  return JSON.parse(o.items)
                } catch {
                  return o.items
                }
              })()
            : o.items

          return {
            ...o,
            shipping_address: composed,
            items: normalizedItems,
          }
        })

        // helpful debug — remove or comment out in production
        try {
          // eslint-disable-next-line no-console
          console.debug("mapped orders sample:", mapped[0])
        } catch (_) {
          // Debug logging is optional - silently ignore failures
        }

        setOrders(mapped)
        setLoading(false)
      } catch (err) {
        setLoading(false)
        console.error("Error fetching orders:", err)
      }
    }
    fetchOrders()
  }, [page, perPage])

  // load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_orders_search_history")
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setSearchHistory(parsed)
      }
    } catch (e) {
      // ignore
    }
  }, [])

  const saveSearchHistory = (q: string) => {
    try {
      const trimmed = q.trim()
      if (!trimmed) return
      const next = [trimmed, ...searchHistory.filter((s) => s !== trimmed)].slice(0, 8)
      setSearchHistory(next)
      localStorage.setItem("admin_orders_search_history", JSON.stringify(next))
    } catch (e) {
      // ignore
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveSearchHistory(searchQuery)
    }
  }

  const useOrderAsText = (order: any) => {
    const parts: string[] = []
    const push = (v: any) => { if (v !== undefined && v !== null) parts.push(String(v)) }
    push(order.id)
    push(order.customer_name)
    push(order.customer_email)
    push(order.status)
    push(order.created_at)
    push(order.shipping_address)
    push(order.payment_method)
    push(order.total)

    // items
    try {
      if (Array.isArray(order.items)) push(JSON.stringify(order.items))
      else if (typeof order.items === 'object') push(JSON.stringify(order.items))
      else if (order.items) push(String(order.items))
    } catch (_) {}

    // common history/meta fields to include
    const historyKeys = [
      'history', 'order_history', 'events', 'activities', 'timeline', 'notes', 'comments', 'status_history'
    ]
    historyKeys.forEach((k) => {
      const v = order[k]
      if (!v) return
      try {
        if (Array.isArray(v)) push(JSON.stringify(v))
        else if (typeof v === 'object') push(JSON.stringify(v))
        else push(String(v))
      } catch (_) {}
    })

    return parts.join(' | ').toLowerCase()
  }

  const orderMatchesSearch = (order: any, q: string) => {
    const term = (q || '').trim().toLowerCase()
    if (!term) return true
    const hay = useOrderAsText(order)
    return hay.includes(term)
  }

  const formatDateKey = (dateLike: any) => {
    try {
      const d = new Date(dateLike)
      if (isNaN(d.getTime())) return ''
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    } catch { return '' }
  }

  const formatDate = (dateLike: any) => {
    try {
      const d = new Date(dateLike)
      if (isNaN(d.getTime())) return '-'
      // localized Arabic short date + time
      return new Intl.DateTimeFormat('ar-EG', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d)
    } catch (e) {
      try {
        return new Date(String(dateLike)).toLocaleString('ar-EG')
      } catch { return '-'}
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (selectedDate) {
      const key = formatDateKey(order.created_at)
      if (key !== selectedDate) return false
    }
    return orderMatchesSearch(order, searchQuery)
  })


// CalendarGrid previously inline; removed to avoid nested function hoisting issues.

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-500"
      case "confirmed":
        return "bg-cyan-500"
      case "processing":
        return "bg-yellow-500"
      case "shipped":
        return "bg-purple-500"
      case "delivered":
        return "bg-green-500"
      case "cancelled":
        return "bg-red-500"
      case "refunded":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusLabel = (status: string) => {
    const statusObj = orderStatuses.find((s) => s.value === status)
    return statusObj ? statusObj.label : status
  }

  const getProductPath = (item: any) => {
    if (!item) return null
    // common keys that may hold product id or slug
    const id = item.product_id ?? item.productId ?? item.product?.id ?? item.id ?? item.product?.uuid ?? item.sku ?? item.slug ?? item.product_slug ?? null
    if (!id) return null
    return `/product/${id}`
  }

  const openProduct = (item: any) => {
    const path = getProductPath(item)
    if (!path) {
      alert("لا يوجد رابط منتج متاح لهذا البند")
      return
    }
    try {
      window.open(path, "_blank", "noopener")
    } catch (e) {
      // fallback
      window.location.href = path
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return Package
      case "confirmed":
        return Package
      case "processing":
        return Package
      case "shipped":
        return Truck
      case "delivered":
        return CheckCircle
      case "cancelled":
        return Package
      case "refunded":
        return Package
      default:
        return Package
    }
  }

  const formatItemAttributes = (item: any) => {
    if (!item) return ""

    const parts: string[] = []
    const push = (s?: any) => { if (s) parts.push(String(s)) }

    // direct common fields (case-insensitive keys)
    const tryKeys = (keys: string[]) => {
      for (const k of keys) {
        for (const keyCandidate of [k, k.toLowerCase(), k.toUpperCase()]) {
          if (item[keyCandidate]) return item[keyCandidate]
        }
      }
      return null
    }

    const colorVal = item.color ?? item.colour ?? item.Color ?? item.Colour ?? tryKeys(["color"])
    const sizeVal = item.size ?? item.Size ?? tryKeys(["size"])
    if (colorVal) push(`اللون: ${colorVal}`)
    if (sizeVal) push(`المقاس: ${sizeVal}`)

    // scan keys for color/size (e.g. color_name, selected_color)
    Object.entries(item).forEach(([k, v]) => {
      if (!v) return
      if (/color|colour/i.test(k) && typeof v === 'string' && !String(v).includes('اللون')) push(`اللون: ${v}`)
      if (/size/i.test(k) && typeof v === 'string' && !String(v).includes('المقاس')) push(`المقاس: ${v}`)
    })

    // variant object patterns
    if (item.variant) {
      if (item.variant.title) push(item.variant.title)
      if (item.variant.options && typeof item.variant.options === "object") {
        Object.entries(item.variant.options).forEach(([k, v]) => push(`${k}: ${v}`))
      }
    }

    // variant_name fields (common in order_items): e.g. "وردي - L" or "Pink - L"
    const variantName = (item.variant_name_ar || item.variant_name_en || "").toString().trim()
    if (variantName) {
      const cleaned = variantName.replace(/\n/g, " ").trim()
      const parts = cleaned.split(/[-–—|/,•]\s*/).map((s: string) => s.trim()).filter(Boolean)
      if (parts.length === 1) push(parts[0])
      else if (parts.length >= 2) {
        // heuristic: first = color, last = size
        push(`اللون: ${parts[0]}`)
        push(`المقاس: ${parts[parts.length - 1]}`)
      }
    }

    // parse SKU patterns: sku may end with "-color-size" like "...-وردي-L"
    if (item.sku && typeof item.sku === 'string') {
      const skuParts = item.sku.split('-').map((s: string) => s.trim()).filter(Boolean)
      if (skuParts.length >= 2) {
        const maybeSize = skuParts[skuParts.length - 1]
        const maybeColor = skuParts[skuParts.length - 2]
        // basic validation to avoid interpreting UUIDs
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(maybeSize)) push(`المقاس: ${maybeSize}`)
        if (!uuidRegex.test(maybeColor)) push(`اللون: ${maybeColor}`)
      }
    }

    // arrays of option-like objects
    const arrayKeys = [
      'selected_options', 'selectedOptions', 'options', 'properties', 'choices', 'attributes'
    ]
    arrayKeys.forEach((arrKey) => {
      const arr = item[arrKey]
      if (Array.isArray(arr)) {
        arr.forEach((opt: any) => {
          if (!opt) return
          if (typeof opt === 'string') push(opt)
          else if (opt.name && (opt.value || opt.option || opt.title)) push(`${opt.name}: ${opt.value ?? opt.option ?? opt.title}`)
          else if (opt.title && opt.value) push(`${opt.title}: ${opt.value}`)
        })
      }
    })

    // attributes / options object
    if (item.attributes && typeof item.attributes === "object" && !Array.isArray(item.attributes)) {
      Object.entries(item.attributes).forEach(([k, v]) => push(`${k}: ${v}`))
    }

    // metadata / options as JSON string or object
    const metaCandidates = [item.metadata, item.meta, item.options]
    for (const c of metaCandidates) {
      if (!c) continue
      try {
        if (typeof c === "string") {
          const parsed = JSON.parse(c)
          if (parsed && typeof parsed === "object") Object.entries(parsed).forEach(([k, v]) => push(`${k}: ${v}`))
        } else if (typeof c === "object") Object.entries(c).forEach(([k, v]) => push(`${k}: ${v}`))
      } catch (_e) {
        // ignore parse errors
      }
    }

    // fallback: show any small JSON-like object that contains color/size
    try {
      const flat = JSON.stringify(item)
      if (/color|size/i.test(flat)) {
        // try to extract simple key/value pairs
        const matches: string[] = []
        const regex = /"?(color|colour|size)["']?\s*[:=]\s*"?([^"{},]+)"?/gi
        let m: RegExpExecArray | null
        while ((m = regex.exec(flat))) {
          matches.push(`${m[1]}: ${m[2]}`)
        }
        matches.forEach((m) => push(m))
      }
    } catch (_e) {}

    // dedupe and return
    const filtered = Array.from(new Set(parts.filter(Boolean)))
    return filtered.length ? filtered.join(" • ") : ""
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus)
      setOrders(orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
      alert('تم تحديث حالة الطلب')
    } catch (err: any) {
      console.error("[v0] Error updating order status (client):", err)
      const message = err?.message || (typeof err === "string" ? err : JSON.stringify(err))
      alert(`فشل تحديث حالة الطلب: ${message}`)
    }
  }

  const handleViewDetails = async (order: Order) => {

    // If items are missing or not an array, attempt to fetch full order from server
    if (!order?.items || !Array.isArray(order.items)) {
      try {
        const full = await getOrderById(order.id)
        if (full) {
          // normalize items similar to initial load
          let normalizedItems: any = Array.isArray(full.items)
            ? full.items
            : typeof full.items === "string"
            ? (() => {
                try {
                  return JSON.parse(full.items)
                } catch {
                  return full.items
                }
              })()
            : full.items

          // if still not an array, try fetching from order_items table
          if (!Array.isArray(normalizedItems) || normalizedItems.length === 0) {
            try {
              // lazy import to avoid circulars; using the exported helper
              const { getOrderItems } = await import('@/lib/supabase/orders')
              const itemsFromTable = await getOrderItems(order.id)
              if (Array.isArray(itemsFromTable) && itemsFromTable.length) {
                normalizedItems = itemsFromTable
              }
            } catch (e) {
              console.warn('[admin] could not fetch order_items fallback:', e)
            }
          }

          
          setSelectedOrder({ ...order, ...full, items: normalizedItems } as any)
          setShowOrderDetails(true)
          return
        }
      } catch (err) {
        console.error('[admin] error fetching order by id:', err)
      }
    }

    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('هل أنت متأكد أنك تريد حذف هذا الطلب؟ هذه العملية لا يمكن التراجع عنها.')) return
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = body?.error ?? `HTTP ${res.status}`
        alert(`فشل حذف الطلب: ${msg}`)
        return
      }

      // Optimistically update UI by removing the order from state
      setOrders((prev) => prev.filter((o) => o.id !== orderId))
      // Close details dialog if open for the same order
      if (selectedOrder?.id === orderId) {
        setShowOrderDetails(false)
        setSelectedOrder(null)
      }
      alert('تم حذف الطلب بنجاح')
    } catch (err) {
      console.error('[admin] Error deleting order:', err)
      alert('حدث خطأ أثناء حذف الطلب. تحقق من السجل أو حاول مرة أخرى.')
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">إدارة الطلبات</h1>
        <p className="text-muted-foreground text-sm md:text-base">عرض ومتابعة جميع الطلبات</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-6">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <Button size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            السابق
          </Button>
          <div className="text-sm text-muted-foreground">صفحة {page}</div>
          <Button
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={orders.length < perPage}
          >
            التالي
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">عرض {perPage} طلبات لكل صفحة</div>
      </div>

      <Card className="border-2 border-border mb-6">
        <CardContent className="p-4 md:p-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث عن طلب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              className="pr-10 text-base"
            />
            {searchFocused && searchHistory.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-popover border rounded-md shadow z-20 p-2">
                <div className="text-xs text-muted-foreground px-2">بحث سابق</div>
                {searchHistory.map((h) => (
                  <button
                    key={h}
                    className="w-full text-left px-2 py-1 hover:bg-muted/50 rounded text-sm"
                    onMouseDown={(e) => { e.preventDefault(); setSearchQuery(h); }}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

        {/* Calendar toggle + calendar UI */}
        <div className="mb-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Button size="sm" variant={calendarVisible ? "default" : "outline"} onClick={() => setCalendarVisible((v) => !v)}>
                {calendarVisible ? 'إخفاء التقويم' : 'عرض التقويم'}
              </Button>
              {selectedDate && (
                <Button size="sm" variant="outline" onClick={() => setSelectedDate(null)}>
                  مسح التصفية بالتاريخ
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">{selectedDate ? `مفلتر على: ${selectedDate}` : 'لا يوجد فلتر تاريخي'}</div>
          </div>

          {calendarVisible && (
            <div className="w-full max-w-xl bg-card border rounded-md p-3 overflow-x-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                  <Button size="sm" variant="outline" onClick={() => {
                    const d = new Date(calendarMonth)
                    d.setMonth(d.getMonth() - 1)
                    setCalendarMonth(d)
                  }}>السابق</Button>
                  <div className="font-medium">{calendarMonth.toLocaleString('ar-EG', { month: 'long', year: 'numeric' })}</div>
                  <Button size="sm" variant="outline" onClick={() => {
                    const d = new Date(calendarMonth)
                    d.setMonth(d.getMonth() + 1)
                    setCalendarMonth(d)
                  }}>التالي</Button>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-xs sm:text-sm text-muted-foreground">انقر على يوم للتصفية</div>
                  <Button size="sm" variant="outline" onClick={() => setCalendarVisible(false)}>
                    إغلاق
                  </Button>
                </div>
              </div>

              {/* build calendar grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'].map((d) => (
                  <div key={d} className="font-semibold py-1">{d}</div>
                ))}
              </div>

              <CalendarGrid
                monthDate={calendarMonth}
                orders={orders}
                formatDateKey={formatDateKey}
                selectedDate={selectedDate}
                onSelectDate={(d: string) => setSelectedDate(d)}
              />
            </div>
          )}
        </div>

      <div className="grid gap-6">
        {loading ? (
          // simple skeleton placeholders
          Array.from({ length: Math.min(perPage, 6) }).map((_, i) => (
            <Card key={`skeleton-${i}`} className="border-2 border-border animate-pulse opacity-60">
              <CardContent className="p-6">
                <div className="h-6 bg-muted/40 rounded w-1/3 mb-3" />
                <div className="h-4 bg-muted/30 rounded w-1/4 mb-2" />
                <div className="h-3 bg-muted/20 rounded w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredOrders.map((order) => {
          const StatusIcon = getStatusIcon(order.status)
          return (
            <Card key={order.id} className="border-2 border-border hover:border-primary/50 transition-all">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
                  <div className="flex items-center gap-3 w-full">
                    <div className={`p-3 rounded-lg ${getStatusColor(order.status)}/10 flex-shrink-0`}>
                      <StatusIcon className={`h-6 w-6 ${getStatusColor(order.status).replace("bg-", "text-")}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge className={`${getStatusColor(order.status)} text-primary-foreground`}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                      <div className="mt-1 truncate">
                        <p className="text-sm text-muted-foreground truncate">معرّف الطلب: <span className="font-mono">{order.id}</span></p>
                      </div>
                      <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right sm:text-left mt-0 min-w-[90px] w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end">
                    <p className="text-xl sm:text-2xl font-bold text-primary">{order.total} ج.م</p>
                    <p className="text-sm text-muted-foreground">{order.items ? order.items.length : 0} منتج</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">اسم العميل</p>
                    <p className="font-medium text-foreground">{order.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">البريد الإلكتروني</p>
                    <p className="font-medium text-foreground">{order.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">رقم الهاتف</p>
                    <p className="font-medium text-foreground">{order.customer_phone}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent w-full sm:w-auto"
                    onClick={() => handleViewDetails(order)}
                  >
                    <Eye className="h-4 w-4" />
                    عرض التفاصيل
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2 w-full sm:w-auto"
                    onClick={() => handleDeleteOrder(order.id)}
                  >
                    حذف
                  </Button>
                  {order.status !== "delivered" && (
                    <Select value={order.status} onValueChange={(value) => handleUpdateStatus(order.id, value)}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="تحديث الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        {orderStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        }) }
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-20">
          <Search className="h-24 w-24 mx-auto mb-6 text-muted-foreground" />
          <h3 className="text-2xl font-bold mb-4 text-foreground">لا توجد نتائج</h3>
          <p className="text-muted-foreground">لم يتم العثور على طلبات تطابق بحثك</p>
        </div>
      )}

      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-full sm:max-w-2xl w-[95%] md:w-full p-4 md:p-6 overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold">تفاصيل الطلب</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">معلومات كاملة عن الطلب</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">اسم العميل</p>
                  <p className="font-bold text-foreground">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">رقم الهاتف</p>
                  <p className="font-bold text-foreground">{selectedOrder.customer_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">البريد الإلكتروني</p>
                  <p className="font-bold text-foreground">{selectedOrder.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">حالة الطلب</p>
                  <p className="font-bold text-foreground">{getStatusLabel(selectedOrder.status)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">تاريخ الطلب</p>
                  <p className="font-bold text-foreground">{formatDate(selectedOrder.created_at)}</p><br></br>
                  <div className="text-sm text-muted-foreground mb-1">
                    <p className="font-bold text-foreground">معرّف الطلب: <span className="font-mono">{selectedOrder.id}</span></p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">العنوان</p>
                <p className="font-bold text-foreground">{selectedOrder.shipping_address}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">طريقة الدفع</p>
                <p className="font-bold text-foreground">{selectedOrder.payment_method}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">ملاحظات إضافية</p>
                <p className="font-bold text-foreground whitespace-pre-wrap">{selectedOrder.notes ?? '-'}</p>
              </div>

              <div className="border-t-2 border-border pt-4">
                <p className="text-sm text-muted-foreground mb-2">المنتجات</p>
                <div className="space-y-3">
                  {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map((it: any, idx: number) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-start justify-between gap-4 p-3 bg-muted/10 rounded-md">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{it.name || it.title || it.product_name || it.product_title || 'منتج'}</p>
                        <p className="text-sm text-muted-foreground mt-1">{formatItemAttributes(it)}</p>
                      </div>
                      <div className="text-right w-full sm:w-32 mt-3 sm:mt-0">
                        <p className="font-medium">{(it.quantity ?? it.qty ?? 1)} × {(it.price ?? it.unit_price ?? it.total ?? 0)} ج.م</p>
                        <p className="text-sm text-muted-foreground">{((it.quantity ?? it.qty ?? 1) * (it.price ?? it.unit_price ?? it.total ?? 0))} ج.م</p>
                      </div>
                      <div className="w-full sm:w-auto mt-2 sm:mt-0 flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openProduct(it)}>
                          عرض المنتج
                        </Button>
                      </div>
                    </div>
                  ))}

                  {(Array.isArray(selectedOrder.items) && selectedOrder.items.length === 0) && (
                    <div className="text-muted-foreground text-sm">لا توجد منتجات مفصلة في هذا الطلب.</div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-4">
                  <p className="text-lg font-bold text-foreground">الإجمالي</p>
                  <p className="text-2xl font-bold text-primary">{selectedOrder.total} ج.م</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value) => {
                    handleUpdateStatus(selectedOrder.id, value)
                    setSelectedOrder({ ...selectedOrder, status: value })
                  }}
                >
                  <SelectTrigger className="w-full sm:flex-1">
                    <SelectValue placeholder="تحديث الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setShowOrderDetails(false)} className="w-full sm:w-auto">
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

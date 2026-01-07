import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export type AnalyticsEventName =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase"
  | "Search"

export interface BaseAnalyticsPayload {
  userId?: string | null
  userName?: string | null
  pageUrl?: string | null
  referrer?: string | null
  sessionId?: string | null
}

export interface ProductAnalyticsPayload {
  productId?: string | null
  productName?: string | null
  productPrice?: number | null
  productCurrency?: string | null
}

export interface OrderAnalyticsPayload {
  orderId?: string | null
  orderTotal?: number | null
  orderCurrency?: string | null
}

export type AnalyticsEventPayload =
  BaseAnalyticsPayload &
  ProductAnalyticsPayload &
  OrderAnalyticsPayload & {
    rawPayload?: any
  }

export async function trackServerEvent(
  eventName: AnalyticsEventName,
  payload: AnalyticsEventPayload
) {
  // Use 'any' cast for supabase client to avoid strict type checks on insert if types are not fully propagated yet
  const supabase: any = getSupabaseAdminClient()

  const { error } = await supabase
    .from("analytics_events")
    .insert([
      {
        event_name: eventName,
        user_id: payload.userId ?? null,
        user_name: payload.userName ?? null,
        page_url: payload.pageUrl ?? null,
        referrer: payload.referrer ?? null,
        session_id: payload.sessionId ?? null,
        product_id: payload.productId ?? null,
        product_name: payload.productName ?? null,
        product_price: payload.productPrice ?? null,
        product_currency: payload.productCurrency ?? null,
        order_id: payload.orderId ?? null,
        order_total: payload.orderTotal ?? null,
        order_currency: payload.orderCurrency ?? null,
        raw_payload: payload.rawPayload ?? null,
      },
    ])

  if (error) {
    console.error("[trackServerEvent] Error inserting analytics event:", error)
  }
}

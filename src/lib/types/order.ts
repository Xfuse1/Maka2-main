export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled"

export interface Order {
  id: string
  user_id: string
  items: any
  total_price: number
  status: OrderStatus
  created_at: string
}

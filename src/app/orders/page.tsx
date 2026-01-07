import { createClient } from "@/lib/supabase/server"
import { getOrdersForUserId } from "@/lib/supabase/orders"
import OrdersClient from "./orders-client"

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initialOrders: any[] = []
  
  if (user) {
    try {
      initialOrders = await getOrdersForUserId(user.id)
    } catch (error) {
      console.error("Error fetching initial orders:", error)
    }
  }

  return (
    <OrdersClient initialOrders={initialOrders} user={user} />
  )
}

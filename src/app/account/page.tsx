import { createClient } from "@/lib/supabase/server"
import { AccountClient } from "./account-client"

async function getUserOrders(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching orders:", error)
    return []
  }
  return data
}

async function getUserProfile(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (error) {
    console.error("Error fetching profile:", error)
    return null
  }
  return data
}

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const profile = await getUserProfile(user.id)
  const orders = await getUserOrders(user.id)

  return <AccountClient user={user} profile={profile} orders={orders} />
}

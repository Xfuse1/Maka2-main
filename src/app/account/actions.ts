"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function fetchOrderDetails(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Fetch order and verify ownership
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single()

  if (error || !order) {
    throw new Error("Order not found")
  }

  // Fetch items if stored separately (depending on schema, sometimes items are in JSON column 'items')
  let items = (order as any).items
  
  // If items is null or empty array, try order_items table
  if (!items || (Array.isArray(items) && items.length === 0)) {
     const { data: orderItems } = await supabase
       .from("order_items")
       .select("*")
       .eq("order_id", orderId)
     
     if (orderItems && orderItems.length > 0) {
       items = orderItems
     }
  }

  return { ...(order as any), items }
}

export async function fetchAddresses() {
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false }) // Default first
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching addresses:", error)
    return []
  }
  return data
}

export async function addAddress(data: any) {
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // If this is the first address, make it default
  const { count } = await supabase
    .from("addresses")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", user.id)
  
  const isDefault = count === 0 ? true : (data.is_default || false)

  if (isDefault) {
    // Unset other defaults
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id)
  }

  const { error } = await supabase
    .from("addresses")
    .insert({
      ...data,
      user_id: user.id,
      is_default: isDefault
    })

  if (error) throw error
  revalidatePath("/account")
}

export async function updateAddress(id: string, data: any) {
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  if (data.is_default) {
     await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id)
  }

  const { error } = await supabase
    .from("addresses")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw error
  revalidatePath("/account")
}

export async function deleteAddress(id: string) {
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw error
  revalidatePath("/account")
}

export async function setDefaultAddress(id: string) {
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // 1. Unset all
  await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", user.id)

  // 2. Set new default
  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw error
  revalidatePath("/account")
}

import { createAdminClient, getStoreIdFromRequest, DEFAULT_STORE_ID } from "@/lib/supabase/admin"

export interface StoreSettings {
  id: string
  store_id: string
  store_name: string
  store_description: string
  updated_at?: string
  updated_by?: string
}

export async function getStoreSettingsServer(): Promise<StoreSettings | null> {
  const supabase = createAdminClient()
  
  let storeId: string
  try {
    storeId = await getStoreIdFromRequest()
  } catch {
    storeId = DEFAULT_STORE_ID
  }

  const { data, error } = await (supabase
    .from("store_settings") as any)
    .select("id, store_id, store_name, store_description, updated_at")
    .eq("store_id", storeId)
    .maybeSingle()

  if (error) {
    return null
  }

  if (!data || !data.store_name) return null

  return data as StoreSettings
}

export async function upsertStoreSettingsServer(
  storeName: string,
  storeDescription: string
) {
  const supabase = createAdminClient()
  
  let storeId: string
  try {
    storeId = await getStoreIdFromRequest()
  } catch {
    storeId = DEFAULT_STORE_ID
  }

  const { data, error } = await (supabase
    .from("store_settings") as any)
    .upsert(
      {
        store_id: storeId,
        store_name: storeName,
        store_description: storeDescription,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "store_id" }
    )
    .select()
    .maybeSingle()

  if (error) {
    console.error("[Server] upsertStoreSettings error", error.message, error)
    throw error
  }

  return data as StoreSettings
}

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Use a fixed UUID to be compatible with uuid column type if migration to text hasn't run
const SETTINGS_ID = "00000000-0000-0000-0000-000000000001"

export interface StoreSettings {
  id: string
  store_name: string
  store_description: string
  updated_at?: string
  updated_by?: string
}

export async function getStoreSettingsServer(): Promise<StoreSettings | null> {
  // Use admin client to avoid RLS/permission issues when reading global settings
  const supabase = createAdminClient()

  // Robust fetch: get the latest updated row regardless of ID
  const { data, error } = await (supabase
    .from("store_settings") as any)
    .select("id, store_name, store_description, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
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
  // Use admin client to bypass RLS for settings updates (assuming auth check is done in layout/middleware)
  const supabase = createAdminClient()
  const { data, error } = await (supabase
    .from("store_settings") as any)
    .upsert(
      {
        id: SETTINGS_ID,
        store_name: storeName,
        store_description: storeDescription,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .maybeSingle()

  if (error) {
    console.error("[Server] upsertStoreSettings error", error.message, error)
    throw error
  }

  return data as StoreSettings
}

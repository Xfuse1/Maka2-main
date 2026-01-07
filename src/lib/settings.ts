export interface StoreSettings {
  id: string
  store_name: string
  store_description: string
  updated_at?: string
  updated_by?: string
}

export async function getStoreSettingsClient(): Promise<StoreSettings | null> {
  try {
    const res = await fetch("/api/store-settings")
    if (!res.ok) {
      console.error("Error fetching store settings from API", res.status)
      return null
    }
    const json = await res.json()
    return json.settings ?? null
  } catch (error) {
    console.error("Error in getStoreSettingsClient:", error)
    return null
  }
}

// Deprecated export for backward compatibility if needed, but we should update usages.
// export const getStoreSettings = getStoreSettingsClient

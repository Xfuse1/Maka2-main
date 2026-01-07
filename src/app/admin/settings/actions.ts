"use server"

import { revalidatePath } from "next/cache"
import { getStoreSettingsServer, upsertStoreSettingsServer } from "@/lib/store-settings"

export async function getSettingsAction() {
  return await getStoreSettingsServer()
}

export async function updateStoreSettingsAction(data: { store_name: string; store_description: string }) {
  try {
    const result = await upsertStoreSettingsServer(data.store_name, data.store_description)

    revalidatePath("/")
    revalidatePath("/admin/settings")
    return { success: true, data: result }
  } catch (error: any) {
    console.error("Error updating store settings:", error)
    return { success: false, error: error?.message || "Failed to update settings" }
  }
}

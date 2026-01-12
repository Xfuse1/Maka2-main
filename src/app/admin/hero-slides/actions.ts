"use server"

import { revalidatePath } from "next/cache"
import {
  getAllHeroSlidesAdmin,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
} from "@/lib/supabase/homepage-admin"
import type { HeroSlide } from "@/lib/supabase/homepage"
import { invalidateHeroSlidesCache } from "@/lib/cache/homepage-cache"
import { DEFAULT_STORE_ID, getStoreIdFromRequest } from "@/lib/supabase/admin"

async function getStoreId(): Promise<string> {
  try {
    return await getStoreIdFromRequest()
  } catch {
    return DEFAULT_STORE_ID
  }
}

export async function getHeroSlidesAction() {
  try {
    const slides = await getAllHeroSlidesAdmin()
    return { success: true, data: slides }
  } catch (error) {
    console.error("Error in getHeroSlidesAction:", error)
    return { success: false, error: "Failed to load hero slides" }
  }
}

export async function createHeroSlideAction(slide: Omit<HeroSlide, "id" | "created_at" | "updated_at">) {
  try {
    const data = await createHeroSlide(slide)
    const storeId = await getStoreId()
    invalidateHeroSlidesCache(storeId)
    revalidatePath("/")
    revalidatePath("/admin/hero-slides")
    return { success: true, data }
  } catch (error) {
    console.error("Error in createHeroSlideAction:", error)
    return { success: false, error: "Failed to create hero slide" }
  }
}

export async function updateHeroSlideAction(id: string, updates: Partial<HeroSlide>) {
  try {
    const data = await updateHeroSlide(id, updates)
    const storeId = await getStoreId()
    invalidateHeroSlidesCache(storeId)
    revalidatePath("/")
    revalidatePath("/admin/hero-slides")
    return { success: true, data }
  } catch (error) {
    console.error("Error in updateHeroSlideAction:", error)
    return { success: false, error: "Failed to update hero slide" }
  }
}

export async function deleteHeroSlideAction(id: string) {
  try {
    await deleteHeroSlide(id)
    const storeId = await getStoreId()
    invalidateHeroSlidesCache(storeId)
    revalidatePath("/")
    revalidatePath("/admin/hero-slides")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteHeroSlideAction:", error)
    return { success: false, error: "Failed to delete hero slide" }
  }
}

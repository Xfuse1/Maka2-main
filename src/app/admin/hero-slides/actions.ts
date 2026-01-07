"use server"

import { revalidatePath } from "next/cache"
import {
  getAllHeroSlidesAdmin,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  type HeroSlide,
} from "@/lib/supabase/homepage"

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
    revalidatePath("/")
    revalidatePath("/admin/hero-slides")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteHeroSlideAction:", error)
    return { success: false, error: "Failed to delete hero slide" }
  }
}

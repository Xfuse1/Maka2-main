"use server"

import { revalidatePath } from "next/cache"
import {
  getAllSections,
  createSection,
  updateSection,
  deleteSection,
  type HomepageSection,
} from "../homepage-sections/actions"

export async function getHomepageSectionsAction() {
  try {
    const res = await getAllSections()
    if (!res || !res.success) {
      throw new Error(('error' in res ? res.error : undefined) || "Failed to load homepage sections")
    }
    return { success: true, data: 'data' in res ? res.data : [] }
  } catch (error) {
    console.error("[v0] Error in getHomepageSectionsAction:", error)
    return { success: false, error: "Failed to load homepage sections" }
  }
}

export async function createHomepageSectionAction(section: Omit<HomepageSection, "id" | "created_at" | "updated_at">) {
  try {
    const res = await createSection(section)
    if (!res || !res.success) {
      throw new Error(('error' in res ? res.error : undefined) || "Failed to create homepage section")
    }
    revalidatePath("/")
    revalidatePath("/admin/homepage")
    return { success: true, data: 'data' in res ? res.data : undefined }
  } catch (error) {
    console.error("[v0] Error in createHomepageSectionAction:", error)
    return { success: false, error: "Failed to create homepage section" }
  }
}

export async function updateHomepageSectionAction(id: string, updates: Partial<HomepageSection>) {
  try {
    const res = await updateSection(id, updates)
    if (!res || !res.success) {
      throw new Error(('error' in res ? res.error : undefined) || "Failed to update homepage section")
    }
    revalidatePath("/")
    revalidatePath("/admin/homepage")
    return { success: true, data: 'data' in res ? res.data : undefined }
  } catch (error) {
    console.error("[v0] Error in updateHomepageSectionAction:", error)
    return { success: false, error: "Failed to update homepage section" }
  }
}

export async function deleteHomepageSectionAction(id: string) {
  try {
    const res = await deleteSection(id)
    if (!res || !res.success) {
      throw new Error(('error' in res ? res.error : undefined) || "Failed to delete homepage section")
    }
    revalidatePath("/")
    revalidatePath("/admin/homepage")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error in deleteHomepageSectionAction:", error)
    return { success: false, error: "Failed to delete homepage section" }
  }
}

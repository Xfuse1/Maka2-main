"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export interface HomepageSection {
  id: string
  name_ar: string
  name_en: string | null
  description: string | null
  section_type: string
  display_order: number
  is_active: boolean
  max_items: number
  product_ids: string[]
  category_ids: string[]
  layout_type: string
  show_title: boolean
  show_description: boolean
  background_color: string
  custom_content: Record<string, any>
  created_at: string
  updated_at: string
}

async function handleSupabaseError(error: any, errorMessage: string) {
  console.error(errorMessage, error)
  if (error instanceof Error) {
    return { success: false, error: error.message }
  }
  return { success: false, error: "An unknown error occurred." }
}

export async function getAllSections() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("homepage_sections")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) throw error

    return { success: true, data: data as HomepageSection[] }
  } catch (error) {
    return handleSupabaseError(error, "Error fetching sections:")
  }
}

export async function createSection(section: Partial<HomepageSection>) {
  try {
    const supabase = createAdminClient()
    // Prevent creating duplicate unique section types
    const UNIQUE_TYPES = ["reviews", "hero", "featured"]
    if (section.section_type && UNIQUE_TYPES.includes(section.section_type)) {
      const { data: existing, error: checkErr } = await supabase
        .from("homepage_sections")
        .select("id")
        .eq("section_type", section.section_type)
        .limit(1)

      if (checkErr) throw checkErr
      if (existing && existing.length > 0) {
        return { success: false, error: `لا يمكن إنشاء أكثر من قسم من النوع ${section.section_type}` }
      }
    }
    const { data, error } = await (supabase.from("homepage_sections") as any).insert([section]).select().single()
    if (error) throw error
    revalidatePath("/")
    revalidatePath("/admin/homepage-sections")
    return { success: true, data }
  } catch (error) {
    return handleSupabaseError(error, "Error creating section:")
  }
}

export async function updateSection(id: string, updates: Partial<HomepageSection>) {
  try {
    const supabase = createAdminClient()
    // Prevent updating to a duplicate unique section type
    const UNIQUE_TYPES = ["reviews", "hero", "featured"]
    if (updates.section_type && UNIQUE_TYPES.includes(updates.section_type)) {
      const { data: existing, error: checkErr } = await supabase
        .from("homepage_sections")
        .select("id")
        .eq("section_type", updates.section_type)
        .neq("id", id)
        .limit(1)

      if (checkErr) throw checkErr
      if (existing && existing.length > 0) {
        return { success: false, error: `لا يمكن وجود أكثر من قسم من النوع ${updates.section_type}` }
      }
    }
    const { data, error } = await (supabase.from("homepage_sections") as any).update(updates).eq("id", id).select().single()
    if (error) throw error
    revalidatePath("/")
    revalidatePath("/admin/homepage-sections")
    return { success: true, data }
  } catch (error) {
    return handleSupabaseError(error, "Error updating section:")
  }
}

export async function deleteSection(id: string) {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("homepage_sections").delete().eq("id", id)
    if (error) throw error
    revalidatePath("/")
    revalidatePath("/admin/homepage-sections")
    return { success: true }
  } catch (error) {
    return handleSupabaseError(error, "Error deleting section:")
  }
}

export async function toggleSectionVisibility(id: string, isActive: boolean) {
  try {
    const supabase = createAdminClient()
    const { data, error } = await (supabase
      .from("homepage_sections") as any)
      .update({ is_active: isActive })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    revalidatePath("/")
    revalidatePath("/admin/homepage-sections")
    return { success: true, data }
  } catch (error) {
    return handleSupabaseError(error, "Error toggling visibility:")
  }
}

export async function reorderSections(sectionIds: string[]) {
  try {
    const supabase = createAdminClient()
    const updates = sectionIds.map((id, index) =>
      (supabase.from("homepage_sections") as any).update({ display_order: index }).eq("id", id),
    )
    await Promise.all(updates)
    revalidatePath("/")
    revalidatePath("/admin/homepage-sections")
    return { success: true }
  } catch (error) {
    return handleSupabaseError(error, "Error reordering sections:")
  }
}

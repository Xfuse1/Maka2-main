import { getSupabaseBrowserClient } from "./client"

export type Category = {
  id: string
  name_ar: string
  name_en: string
  slug: string
  description_ar?: string
  description_en?: string
  image_url?: string
  parent_id?: string
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export type CreateCategoryData = {
  name_ar: string
  name_en: string
  slug: string
  description_ar?: string
  description_en?: string
  image_url?: string
  parent_id?: string
  is_active?: boolean
  display_order?: number
}

// Get all categories
export async function getAllCategories() {
  const response = await fetch("/api/admin/categories")
  if (!response.ok) throw new Error("Failed to fetch categories")
  const { data } = await response.json()
  return data as Category[]
}

// Get category by ID
export async function getCategoryById(id: string) {
  const response = await fetch(`/api/admin/categories/${id}`)
  if (!response.ok) throw new Error("Failed to fetch category")
  const { data } = await response.json()
  return data as Category
}

// Create category
export async function createCategory(categoryData: CreateCategoryData) {
  const response = await fetch("/api/admin/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(categoryData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create category")
  }

  const { data } = await response.json()
  return data as Category
}

// Update category
export async function updateCategory(id: string, categoryData: Partial<CreateCategoryData>) {
  const response = await fetch(`/api/admin/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(categoryData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to update category")
  }

  const { data } = await response.json()
  return data as Category
}

// Delete category
export async function deleteCategory(id: string) {
  const response = await fetch(`/api/admin/categories/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to delete category")
  }
}

// Get products count by category
export async function getCategoryProductsCount(categoryId: string) {
  const supabase = getSupabaseBrowserClient()

  const { count, error } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", categoryId)

  if (error) {
    console.error("[v0] Error counting products:", error)
    throw error
  }

  return count || 0
}

// Get all active categories (for public display)
export async function getActiveCategories() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })

  if (error) {
    // If this is a network-level failure (e.g. browser couldn't reach Supabase),
    // log a helpful hint so you can check env / network quickly.
    const msg = (() => {
      try {
        return error?.message ?? JSON.stringify(error)
      } catch (e) {
        return String(error)
      }
    })()

    // Return empty array so pages using categories can render safely
    return []
  }

  return data as Category[]
}

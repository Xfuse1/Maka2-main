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

// Get products count by category (via API for store isolation)
export async function getCategoryProductsCount(categoryId: string) {
  try {
    const res = await fetch('/api/admin/products')
    if (!res.ok) return 0
    const json = await res.json()
    const products = json.data || []
    return products.filter((p: any) => p.category_id === categoryId).length
  } catch {
    return 0
  }
}

// Get all active categories (via API for store isolation)
export async function getActiveCategories() {
  try {
    const res = await fetch('/api/admin/categories')
    if (!res.ok) return []
    const json = await res.json()
    const categories = json.data || []
    return categories.filter((c: Category) => c.is_active) as Category[]
  } catch (err) {
    console.error("[v0] Error fetching categories:", err)
    return []
  }
}

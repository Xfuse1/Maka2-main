import { createClient } from "@/lib/supabase/client"

export interface PageContent {
  id: string
  page_path: string
  page_title_ar: string
  page_title_en: string
  meta_title_ar: string
  meta_title_en: string
  meta_description_ar: string
  meta_description_en: string
  sections: Record<string, any>
  sections_images?: Record<string, string>
  url_image?: string
  is_published: boolean
  created_at: string
  updated_at: string
}

// Static pages that should appear in page management
const STATIC_PAGE_PATHS = ["/about", "/contact", "/terms", "/privacy", "/return-policy", "/faq"]

// Get all static pages (client-side)
export async function getAllStaticPages(): Promise<PageContent[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("page_content")
    .select("*")
    .in("page_path", STATIC_PAGE_PATHS)
    .order("page_path")

  if (error) {
    console.error("[v0] Error fetching pages:", error)
    return []
  }

  return data || []
}

// Get page by path (client-side)
export async function getPageByPath(path: string): Promise<PageContent | null> {
  const supabase = createClient()

  const { data, error } = await supabase.from("page_content").select("*").eq("page_path", path).single()

  if (error) {
    console.error("[v0] Error fetching page:", error)
    return null
  }

  return data
}

// Get published pages for storefront (client-side)
export async function getPublishedPages(): Promise<Pick<PageContent, "id" | "page_path" | "page_title_ar">[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("page_content")
    .select("id, page_path, page_title_ar")
    .eq("is_published", true)
    .order("page_path")

  if (error) {
    console.error("[v0] Error fetching published pages:", error)
    return []
  }

  return data || []
}

// Admin functions (server-side via API routes)
export async function createPage(page: Omit<PageContent, "id" | "created_at" | "updated_at">) {
  const response = await fetch("/api/admin/pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(page),
  })

  if (!response.ok) {
    throw new Error("Failed to create page")
  }

  return response.json()
}

export async function updatePage(id: string, updates: Partial<PageContent>) {
  const response = await fetch(`/api/admin/pages/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    throw new Error("Failed to update page")
  }

  return response.json()
}

export async function deletePage(id: string) {
  const response = await fetch(`/api/admin/pages/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Failed to delete page")
  }

  return response.json()
}

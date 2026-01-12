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

// Get all static pages (via API for store isolation)
export async function getAllStaticPages(): Promise<PageContent[]> {
  try {
    const res = await fetch('/api/admin/pages')
    if (!res.ok) {
      console.error("[v0] Error fetching pages: HTTP", res.status)
      return []
    }
    const pages = await res.json()
    // API returns array directly
    const pagesArray = Array.isArray(pages) ? pages : pages.data || []
    return pagesArray.filter((p: PageContent) => STATIC_PAGE_PATHS.includes(p.page_path))
  } catch (err) {
    console.error("[v0] Error fetching pages:", err)
    return []
  }
}

// Get page by path (via API for store isolation)
export async function getPageByPath(path: string): Promise<PageContent | null> {
  try {
    const res = await fetch('/api/admin/pages')
    if (!res.ok) return null
    const pages = await res.json()
    const pagesArray = Array.isArray(pages) ? pages : pages.data || []
    return pagesArray.find((p: PageContent) => p.page_path === path) || null
  } catch (err) {
    console.error("[v0] Error fetching page:", err)
    return null
  }
}

// Get published pages for storefront (via API for store isolation)
export async function getPublishedPages(): Promise<Pick<PageContent, "id" | "page_path" | "page_title_ar">[]> {
  try {
    const res = await fetch('/api/admin/pages')
    if (!res.ok) return []
    const pages = await res.json()
    const pagesArray = Array.isArray(pages) ? pages : pages.data || []
    return pagesArray
      .filter((p: PageContent) => p.is_published)
      .map((p: PageContent) => ({ id: p.id, page_path: p.page_path, page_title_ar: p.page_title_ar }))
  } catch (err) {
    console.error("[v0] Error fetching published pages:", err)
    return []
  }
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

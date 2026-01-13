import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, getStoreIdFromRequest } from "@/lib/supabase/admin"
import { invalidateCategoryCache } from "@/lib/cache/categories-cache"
import { revalidatePath } from "next/cache"

// GET - Fetch all categories (filtered by store_id)
export async function GET() {
  const supabase = createAdminClient()
  const storeId = await getStoreIdFromRequest()
  
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("store_id", storeId) // Filter by store
    .order("name_ar")
    
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  
  return NextResponse.json({ data }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  })
}

// POST - Create a new category (with store_id)
export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  const body = await request.json()
  const storeId = await getStoreIdFromRequest()
  
  // Ensure a slug exists and is safe
  const slugify = (input: any) => {
    if (!input) return ""
    return String(input)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\u0600-\u06FFa-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  }

  if (!body.slug || String(body.slug).trim() === "") {
    body.slug = slugify(body.name_en || body.name_ar || `category-${Date.now()}`)
  } else {
    body.slug = slugify(body.slug)
  }

  // Try the insert; if slug unique constraint fails, retry once with timestamp suffix
  const tryInsert = async (candidateSlug: string) => {
    body.slug = candidateSlug
    return await (supabase.from("categories") as any).insert([{
      ...body,
      store_id: storeId // Add store_id for multi-tenant
    }]).select().single()
  }

  let candidate = body.slug
  let result = await tryInsert(candidate)

  if (result.error && /duplicate key value|unique constraint/.test(String(result.error.message || ""))) {
    candidate = `${body.slug}-${Date.now()}`
    result = await tryInsert(candidate)
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 })
  
  // Invalidate category cache after creation
  invalidateCategoryCache(storeId)
  revalidatePath('/admin/categories')
  revalidatePath('/')
  
  return NextResponse.json({ data: result.data }, { status: 201 })
}

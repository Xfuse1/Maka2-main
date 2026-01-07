import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET - Fetch all categories
export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("categories").select("*").order("name_ar")
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

// POST - Create a new category
export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  const body = await request.json()
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
    return await (supabase.from("categories") as any).insert([body]).select().single()
  }

  let candidate = body.slug
  let result = await tryInsert(candidate)

  if (result.error && /duplicate key value|unique constraint/.test(String(result.error.message || ""))) {
    candidate = `${body.slug}-${Date.now()}`
    result = await tryInsert(candidate)
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 })
  return NextResponse.json({ data: result.data }, { status: 201 })
}

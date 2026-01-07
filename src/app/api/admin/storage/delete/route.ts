import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

const BUCKET_NAME = "products"

export async function DELETE(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 })
    }

    // Extract path from URL
    const urlParts = imageUrl.split(`${BUCKET_NAME}/`)
    if (urlParts.length < 2) {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 })
    }

    const filePath = urlParts[1]
    const supabase = getSupabaseAdminClient()

    // Delete using admin client (bypasses RLS)
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath])

    if (error) {
      console.error("[v0] Storage delete error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete API error:", error)
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
  }
}

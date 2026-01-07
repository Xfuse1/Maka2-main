import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

const BUCKET_NAME = "products"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const file = formData.get("file")
    const productId = formData.get("productId")

    //console.log("[v0] File type:", typeof file, "Product ID type:", typeof productId)

    if (!file || !(file instanceof File)) {
      console.error("[v0] Invalid file:", file)
      return NextResponse.json({ error: "Invalid or missing file" }, { status: 400 })
    }

    if (!productId || typeof productId !== "string") {
      console.error("[v0] Invalid productId:", productId)
      return NextResponse.json({ error: "Invalid or missing productId" }, { status: 400 })
    }

    // SECURITY: Validate file type - only allow safe image formats
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif", "image/gif"]
    const fileExt = file.name.split(".").pop()?.toLowerCase()
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "avif", "gif"]

    // ⚠️ SVG WARNING: SVG files can contain JavaScript and are a XSS vector
    // If you need to allow SVG uploads:
    // 1. Sanitize SVGs using DOMPurify or svg-sanitizer
    // 2. Strip all <script> tags and event handlers
    // 3. Consider converting to PNG/WebP server-side
    const isSvg = file.type === "image/svg+xml" || fileExt === "svg"

    if (isSvg) {
      console.error("[v0] SVG upload blocked for security")
      return NextResponse.json(
        { error: "SVG uploads are not allowed for security reasons. Please convert to PNG, JPEG, or WebP." },
        { status: 400 }
      )
    }

    if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExt || "")) {
      console.error("[v0] Invalid file type:", file.type, fileExt)
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, WebP, AVIF, and GIF are allowed." },
        { status: 400 }
      )
    }

   // console.log("[v0] File name:", file.name, "Size:", file.size, "Type:", file.type)

    const supabase = getSupabaseAdminClient()

    // Generate unique filename
    const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()

    // Upload using admin client (bypasses RLS)
    const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, arrayBuffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("[v0] Supabase storage error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error("[v0] Upload API error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

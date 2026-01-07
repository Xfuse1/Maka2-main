import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "لا يوجد ملف مرفوع" },
        { status: 400 }
      )
    }

    // SECURITY: Validate file type
    const fileExt = file.name.split(".").pop()?.toLowerCase()
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "avif", "gif", "svg"]
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif", "image/gif", "image/svg+xml"]

    if (!fileExt || !allowedExtensions.includes(fileExt) || !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "نوع الملف غير مدعوم. الرجاء استخدام JPG, PNG, WebP, أو SVG فقط." },
        { status: 400 }
      )
    }

    // ⚠️ SECURITY WARNING for SVG logos:
    // SVG files can contain JavaScript. For logos uploaded by admins only, this is
    // lower risk but still a concern if admin credentials are compromised.
    // Consider sanitizing SVGs or converting to PNG/WebP for better security.
    const isSvg = file.type === "image/svg+xml" || fileExt === "svg"
    if (isSvg) {
      console.warn("[uploadLogo] SVG upload detected - ensure admin credentials are secure")
      // TODO: Add SVG sanitization using DOMPurify or svg-sanitizer
    }

    const supabase = getSupabaseAdminClient() as any

    // Generate unique file name
    const fileName = `${randomUUID()}.${fileExt}`

    // 1) Upload to Supabase Storage bucket "site-logo"
    const { error: uploadError } = await supabase.storage
      .from("site-logo")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      })

    if (uploadError) {
      console.error("[uploadLogo] Storage error:", uploadError)
      return NextResponse.json(
        { error: "فشل رفع الشعار" },
        { status: 400 }
      )
    }

    // 2) Upsert row in design_settings (single row site_key='default')
    const { error: dbError } = await supabase
      .from("design_settings")
      .upsert(
        {
          site_key: "default",
          logo_bucket: "site-logo",
          logo_path: fileName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "site_key" }
      )

    if (dbError) {
      console.error("[uploadLogo] DB error:", dbError)
      return NextResponse.json(
        { error: "فشل حفظ رابط الشعار" },
        { status: 400 }
      )
    }

    // 3) Build public URL for the logo
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!baseUrl) {
      console.error("[uploadLogo] Missing NEXT_PUBLIC_SUPABASE_URL")
    }
    const logoUrl = `${baseUrl}/storage/v1/object/public/site-logo/${fileName}`

    return NextResponse.json({ success: true, url: logoUrl })
  } catch (error) {
    console.error("[uploadLogo] Unexpected error:", error)
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient() as any

    const { data, error } = await supabase
      .from("design_settings")
      .select("logo_bucket, logo_path")
      .eq("site_key", "default")
      .maybeSingle()

    if (error) {
      console.error("[API getLogoUrl] Error:", error)
      return NextResponse.json({ url: "/placeholder-logo.svg" })
    }

    if (!data || !data.logo_path) {
      return NextResponse.json({ url: "/placeholder-logo.svg" })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const bucket = data.logo_bucket || "site-logo"
    const logoUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${data.logo_path}`

    return NextResponse.json({ url: logoUrl })
  } catch (error) {
    console.error("[API getLogoUrl] Error:", error)
    return NextResponse.json({ url: "/placeholder-logo.svg" })
  }
}

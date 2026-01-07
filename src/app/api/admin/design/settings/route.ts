import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

// GET: يرجّع settings بشكل موحّد للفرونت
export async function GET() {
  try {
    const supabase = getSupabaseAdminClient() as any

    const { data, error } = await supabase
      .from("design_settings")
      .select(
        "primary_color, secondary_color, background_color, text_color, heading_font, body_font, site_key"
      )
      .eq("site_key", "default")
      .maybeSingle()

    if (error) {
      console.error("[API getDesignSettings] Supabase error:", error)
      return NextResponse.json({ settings: {} })
    }

    if (!data) {
      console.warn("[API getDesignSettings] No design_settings row found")
      return NextResponse.json({ settings: {} })
    }

    const settings = {
      colors: {
        primary: data.primary_color,
        secondary: data.secondary_color,
        background: data.background_color,
        foreground: data.text_color,
      },
      fonts: {
        heading: data.heading_font,
        body: data.body_font,
      },
      layout: {}, // مفيش أعمدة ليه حالياً
      // تقدر تضيف logoUrl بعدين باستخدام logo_bucket + logo_path
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("[API getDesignSettings] Error:", error)
    return NextResponse.json({ settings: {} })
  }
}

// POST: يحفظ جزء من الإعدادات (colors | fonts | layout)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || typeof value === "undefined") {
      console.error("[design_settings POST] Missing key or value")
      return NextResponse.json(
        { error: "Missing key or value" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdminClient() as any

    const updateData: any = {
      site_key: "default",
      updated_at: new Date().toISOString(),
    }

    switch (key) {
      case "colors":
        if (value?.primary) updateData.primary_color = value.primary
        if (value?.secondary) updateData.secondary_color = value.secondary
        if (value?.background) updateData.background_color = value.background
        if (value?.foreground) updateData.text_color = value.foreground
        break

      case "fonts":
        if (value?.heading) updateData.heading_font = value.heading
        if (value?.body) updateData.body_font = value.body
        break

      case "layout":
        // لسه مفيش أعمدة layout في الجدول، سيبه فاضي دلوقتي
        break

      default:
        console.error("[design_settings POST] Unsupported key:", key)
        return NextResponse.json(
          { error: "نوع إعداد غير مدعوم" },
          { status: 400 }
        )
    }

    const { data, error } = await supabase
      .from("design_settings")
      .upsert(updateData, { onConflict: "site_key" })
      .select()
      .maybeSingle()

    if (error) {
      console.error("[design_settings POST] Supabase error:", error)
      return NextResponse.json(
        { error: "فشل حفظ إعدادات التصميم" },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[design_settings POST] Unexpected error:", error)
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع" },
      { status: 500 }
    )
  }
}

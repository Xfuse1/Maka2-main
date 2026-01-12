import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient, getStoreIdFromRequest } from "@/lib/supabase/admin"

// GET: returns settings for current store
export async function GET() {
  try {
    const supabase = getSupabaseAdminClient() as any
    const storeId = await getStoreIdFromRequest()

    const { data, error } = await supabase
      .from("design_settings")
      .select(
        "primary_color, secondary_color, background_color, text_color, heading_font, body_font, site_key"
      )
      .eq("store_id", storeId)
      .maybeSingle()

    if (error) {
      console.error("[API getDesignSettings] Supabase error:", error)
      return NextResponse.json({ settings: {} })
    }

    if (!data) {
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
      layout: {},
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("[API getDesignSettings] Error:", error)
    return NextResponse.json({ settings: {} })
  }
}

// POST: saves settings for current store
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || typeof value === "undefined") {
      return NextResponse.json(
        { error: "Missing key or value" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdminClient() as any
    const storeId = await getStoreIdFromRequest()

    const updateData: any = {
      store_id: storeId,
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
        break

      default:
        return NextResponse.json(
          { error: "Unsupported setting type" },
          { status: 400 }
        )
    }

    const { error } = await supabase
      .from("design_settings")
      .upsert(updateData, { onConflict: "store_id" })
      .select()
      .maybeSingle()

    if (error) {
      console.error("[design_settings POST] Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to save design settings" },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[design_settings POST] Unexpected error:", error)
    return NextResponse.json(
      { error: "Unexpected error occurred" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()
    
    // Force cast table name if needed, but 'hero_slides' should be in types now.
    // If types are still acting up, we use string literal.
    const { data, error } = await supabase
      .from("hero_slides")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) {
      console.error("[hero-slides GET] Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to load hero slides" },
        { status: 500 }
      )
    }

    return NextResponse.json({ slides: data ?? [] })
  } catch (error) {
    console.error("[hero-slides GET] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = getSupabaseAdminClient() as any

    // Validate body fields if necessary
    if (!body.title_ar || !body.image_url) {
      return NextResponse.json(
        { error: "Missing required fields (title_ar, image_url)" },
        { status: 400 }
      )
    }

    const { data, error } = await (supabase
      .from("hero_slides") as any)
      .insert([body])
      .select()
      .single()

    if (error) {
      console.error("[hero-slides POST] Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to create hero slide" },
        { status: 500 }
      )
    }

    return NextResponse.json({ slide: data })
  } catch (error) {
    console.error("[hero-slides POST] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

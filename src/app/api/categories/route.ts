import { NextResponse } from "next/server"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

// GET - Fetch all active categories for public display
export async function GET() {
  try {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name_ar", { ascending: true })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

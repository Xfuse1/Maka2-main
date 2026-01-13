import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

/**
 * GET /api/stores/check?subdomain=xxx
 * 
 * Public endpoint to check if a store exists by subdomain.
 * Only returns basic public info (id, store_name)
 * 
 * Used by admin login page to verify store exists
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get("subdomain")

    if (!subdomain) {
      return NextResponse.json(
        { error: "Missing subdomain parameter" },
        { status: 400 }
      )
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]+$/
    if (!subdomainRegex.test(subdomain)) {
      return NextResponse.json(
        { error: "Invalid subdomain format" },
        { status: 400 }
      )
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {},
        },
      }
    )

    // Only return public info: id and store_name
    // Don't return status, subscription info, etc.
    const { data: store, error } = await supabase
      .from("stores")
      .select("id, store_name")
      .eq("subdomain", subdomain)
      .single()

    if (error || !store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ store })
  } catch (error) {
    console.error("[API] Error checking store:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

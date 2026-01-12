import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// API endpoint to get active subscription plans (uses service role key)
export async function GET() {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    // Debug: Log key prefix (not full key for security)
    console.log("🔍 Debug - SUPABASE_URL:", supabaseUrl)
    console.log("🔍 Debug - SERVICE_ROLE_KEY exists:", !!serviceRoleKey)
    console.log("🔍 Debug - SERVICE_ROLE_KEY prefix:", serviceRoleKey?.substring(0, 20) + "...")
    
    // Check if service role key exists
    if (!serviceRoleKey) {
      console.error("❌ SUPABASE_SERVICE_ROLE_KEY is not set in environment variables")
      return NextResponse.json(
        { 
          error: "Server configuration error",
          message: "SUPABASE_SERVICE_ROLE_KEY is missing. Please add it to your .env file."
        },
        { status: 500 }
      )
    }

    const supabase = createClient(
      supabaseUrl!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("Error fetching plans:", error)
      return NextResponse.json(
        { error: "Failed to fetch plans", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ plans: data })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

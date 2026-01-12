import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient, getStoreIdFromRequest } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const adminClient = getAdminClient()
    const storeId = await getStoreIdFromRequest()

    const { data, error } = await adminClient
      .from("page_content")
      .select("*")
      .eq("store_id", storeId)
      .order("page_path")

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("[v0] Error fetching pages:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminClient = getAdminClient()
    const storeId = await getStoreIdFromRequest()
    const body = await request.json()

    const { data, error } = await (adminClient.from("page_content") as any)
      .insert([{ ...body, store_id: storeId }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error creating page:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

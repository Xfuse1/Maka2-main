import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, getStoreIdFromRequest } from "@/lib/supabase/admin"

type RouteParams = { params: Promise<{ id: string }> }

// GET - Fetch category by ID (with store verification)
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const storeId = await getStoreIdFromRequest()
    
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .eq("store_id", storeId)
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Error fetching category:", error)
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 })
  }
}

// PATCH - Update category (with store verification)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const storeId = await getStoreIdFromRequest()
    const body = await request.json()
    
    // Prevent changing store_id
    delete body.store_id
    
    const { data, error } = await (supabase.from("categories") as any)
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("store_id", storeId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Error updating category:", error)
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

// DELETE - Delete category (with store verification)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = createAdminClient()
  const storeId = await getStoreIdFromRequest()
  
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("store_id", storeId)
    
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

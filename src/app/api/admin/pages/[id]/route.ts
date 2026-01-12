import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient, getStoreIdFromRequest } from "@/lib/supabase/admin"

export async function PATCH(request: NextRequest, { params }: { params: any }) {
  try {
    const adminClient = getAdminClient()
    const storeId = await getStoreIdFromRequest()
    const body = await request.json() as Record<string, unknown>
    
    // Prevent changing store_id
    delete body.store_id

    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) return NextResponse.json({ error: "Missing id parameter" }, { status: 400 })

    const { data, error } = await (adminClient.from("page_content") as any)
      .update(body)
      .eq("id", id)
      .eq("store_id", storeId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error updating page:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: any }) {
  try {
    const adminClient = getAdminClient()
    const storeId = await getStoreIdFromRequest()

    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) return NextResponse.json({ error: "Missing id parameter" }, { status: 400 })

    const { error } = await (adminClient.from("page_content") as any)
      .delete()
      .eq("id", id)
      .eq("store_id", storeId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting page:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

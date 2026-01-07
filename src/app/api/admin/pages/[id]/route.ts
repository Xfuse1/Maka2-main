import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"

export async function PATCH(request: NextRequest, { params }: { params: any }) {
  try {
    const adminClient = getAdminClient()
    const body = await request.json()
    // normalize/claim a safe payload type so TS doesn't infer `never` for the update arg
    const payload = body as Record<string, unknown>

    // `params` may be a Promise in some Next.js runtime configurations — await it first.
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) return NextResponse.json({ error: "Missing id parameter" }, { status: 400 })

    const tableAny = adminClient.from("page_content") as any
    const { data, error } = await tableAny.update(payload).eq("id", id).select().single()

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

    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) return NextResponse.json({ error: "Missing id parameter" }, { status: 400 })

    const tableAny = adminClient.from("page_content") as any
    const { error } = await tableAny.delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting page:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

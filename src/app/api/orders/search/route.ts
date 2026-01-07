import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

const json = (data: any, status = 200) =>
  new NextResponse(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  })

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const q = (url.searchParams.get("q") || "").trim()
    if (!q) return json({ error: "missing query param q" }, 400)

    const admin = createAdminClient()
    // Exact match on email or phone
    const { data, error } = await admin
      .from("orders")
      .select("*")
      .or(`customer_email.eq.${q},customer_phone.eq.${q}`)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[orders/search] supabase error:", error)
      return json({ error: error.message || String(error) }, 500)
    }

    return json({ orders: data || [] })
  } catch (err: any) {
    console.error("[orders/search] unexpected error:", err)
    return json({ error: err?.message || String(err) }, 500)
  }
}

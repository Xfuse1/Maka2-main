import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient, getStoreIdFromRequest } from "@/lib/supabase/admin"

const json = (data: any, status = 200) =>
  new NextResponse(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = String((body.full_name || body.name) ?? "").trim()
    const email = String(body.email ?? "").trim()
    const phone = String(body.phone ?? "").trim()
    const message = String(body.message ?? "").trim()

    if (!message || (!email && !phone && !name)) {
      return json({ success: false, error: "Missing required fields" }, 400)
    }

    const supabase = createAdminClient()
    const storeId = await getStoreIdFromRequest()

    const payload: any = {
      store_id: storeId,
      full_name: name || null,
      email: email || null,
      phone: phone || null,
      message,
    }

    // Remove nulls except store_id
    Object.keys(payload).forEach((k) => {
      if (k !== 'store_id' && (payload[k] === null || payload[k] === undefined)) delete payload[k]
    })

    const insertResult: any = await (supabase.from("contact_messages") as any).insert([payload])

    if (insertResult?.error) {
      console.error('[Contact API] insert error:', insertResult.error)
      return json({ success: false, error: insertResult.error.message || String(insertResult.error) }, 500)
    }

    return json({ success: true }, 200)
  } catch (err: any) {
    console.error("[Contact API] uncaught:", err)
    return json({ success: false, error: err?.message || String(err) }, 500)
  }
}

export async function GET() {
  return json({ success: true, message: "Use POST to submit contact messages" }, 200)
}

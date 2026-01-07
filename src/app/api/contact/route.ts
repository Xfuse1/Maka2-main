import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Contact API] missing Supabase service role key - cannot insert')
      return json({ success: false, error: 'Server misconfiguration: missing Supabase service role key' }, 500)
    }

    const payload: any = {
      full_name: name || null,
      email: email || null,
      phone: phone || null,
      message,
    }

    // remove nulls so we don't attempt to set absent columns
    Object.keys(payload).forEach((k) => {
      if (payload[k] === null || payload[k] === undefined) delete payload[k]
    })

    // Perform a simple insert. Avoid relying on .select() which may be blocked by RLS for the role.
    const insertResult: any = await (supabase.from("contact_messages") as any).insert([payload])

    const insertError = insertResult?.error
    if (insertError) {
      console.error('[Contact API] insert error:', insertError)
      return json({ success: false, error: insertError.message || String(insertError) }, 500)
    }

    // If no error, assume insert succeeded. We may not have returned row data due to RLS/select restrictions.
    return json({ success: true }, 200)
  } catch (err: any) {
    console.error("[Contact API] uncaught:", err)
    return json({ success: false, error: err?.message || String(err) }, 500)
  }
}

export async function GET() {
  return json({ success: true, message: "Use POST to submit contact messages" }, 200)
}

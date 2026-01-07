import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("store_settings").select("store_name").limit(1).maybeSingle()
    if (error) {
      console.error("Error fetching store name:", error)
      return new Response(JSON.stringify({ store_name: "مكة" }), { status: 200, headers: { "content-type": "application/json" } })
    }
    const store_name = (data && (data as any).store_name) || "مكة"
    return new Response(JSON.stringify({ store_name }), { status: 200, headers: { "content-type": "application/json" } })
  } catch (e) {
    console.error("Unexpected error fetching store name:", e)
    return new Response(JSON.stringify({ store_name: "مكة" }), { status: 200, headers: { "content-type": "application/json" } })
  }
}

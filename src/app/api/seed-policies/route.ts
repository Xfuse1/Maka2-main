import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStoreIdFromRequest, DEFAULT_STORE_ID } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    
    let storeId: string
    try {
      storeId = await getStoreIdFromRequest()
    } catch {
      storeId = DEFAULT_STORE_ID
    }
    
    // Check if policies page exists for this store
    const { data: existing } = await (supabase as any)
      .from("page_content")
      .select("id")
      .eq("store_id", storeId)
      .or("page_path.eq./policies,page_path.eq.policies/")
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: "Policies page already exists" });
    }

    // Insert if not exists
    const { error } = await (supabase as any).from("page_content").insert({
      store_id: storeId,
      page_path: "/policies",
      page_title_ar: "سياسات الموقع",
      page_title_en: "Site Policies",
      is_published: true,
      sections: {
        privacy_policy: "هنا يتم كتابة سياسة الخصوصية الخاصة بالموقع...\nنحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية.",
        return_policy: "هنا يتم كتابة سياسة الاسترجاع والاستبدال الخاصة بالموقع...\nيمكنك استرجاع المنتج خلال 14 يوم من تاريخ الشراء."
      }
    });

    if (error) {
      console.error("Error seeding policies page:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Policies page seeded successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

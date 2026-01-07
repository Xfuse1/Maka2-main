import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    // Use service role to bypass RLS
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
    
    // Optional: Check auth if needed, but useInitializePages might be called by anyone?
    // Usually seeding is protected or run once.
    // For now, I'll skip strict admin check to allow auto-seeding on app load if that's the pattern, 
    // OR better, check if page exists and only insert if missing.
    
    // Check if policies page exists
    const { data: existing } = await (supabase as any)
      .from("page_content")
      .select("id")
      .or("page_path.eq./policies,page_path.eq.policies/")
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: "Policies page already exists" });
    }

    // Insert if not exists
    const { error } = await (supabase as any).from("page_content").insert({
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

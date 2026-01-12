import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, storeId, storeSubdomain, role = "customer" } = body

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // إنشاء Supabase client مع service role
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {},
        },
      }
    )

    // الحصول على store_id من الـ subdomain إذا لم يتم تمريره
    let targetStoreId = storeId
    if (!targetStoreId && storeSubdomain) {
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("subdomain", storeSubdomain)
        .single()
      
      targetStoreId = store?.id
    }

    if (!targetStoreId) {
      return NextResponse.json({ 
        success: false, 
        error: "Store not found" 
      }, { status: 404 })
    }

    // التحقق من أن المستخدم ليس مسجلاً بالفعل
    const { data: existing } = await supabase
      .from("store_users")
      .select("id")
      .eq("store_id", targetStoreId)
      .eq("user_id", userId)
      .single()

    if (existing) {
      return NextResponse.json({ 
        success: true, 
        message: "User already registered in this store",
        alreadyExists: true
      })
    }

    // إضافة المستخدم للمتجر
    const { data, error } = await supabase
      .from("store_users")
      .insert({
        store_id: targetStoreId,
        user_id: userId,
        role: role,
        status: "active",
      })
      .select()
      .single()

    if (error) {
      console.error("[API] Error adding user to store:", error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    // تحديث profile مع store_id
    await supabase
      .from("profiles")
      .update({ store_id: targetStoreId })
      .eq("id", userId)

    return NextResponse.json({ 
      success: true, 
      storeUser: data 
    })

  } catch (error) {
    console.error("[API] Error in add-to-store:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

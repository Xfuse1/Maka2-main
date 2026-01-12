import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, storeId, storeSubdomain } = body

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // إنشاء Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // استخدام service role للوصول الكامل
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
        belongs: false, 
        message: "Store not found" 
      })
    }

    // التحقق من أن المستخدم ينتمي للمتجر
    const { data: storeUser, error } = await supabase
      .from("store_users")
      .select("id, role, status")
      .eq("store_id", targetStoreId)
      .eq("user_id", userId)
      .single()

    if (error || !storeUser) {
      return NextResponse.json({ 
        belongs: false, 
        message: "User is not registered in this store" 
      })
    }

    if (storeUser.status !== "active") {
      return NextResponse.json({ 
        belongs: false, 
        message: "User account is not active in this store",
        status: storeUser.status
      })
    }

    return NextResponse.json({ 
      belongs: true, 
      role: storeUser.role,
      storeId: targetStoreId
    })

  } catch (error) {
    console.error("[API] Error checking store membership:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

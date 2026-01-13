import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create admin client for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
)

/**
 * Verify Super Admin session from cookie
 */
async function verifySuperAdminSession(request: NextRequest): Promise<boolean> {
  const sessionToken = request.cookies.get("super_admin_session")?.value
  return !!sessionToken
}

/**
 * GET /api/super-admin/stores
 * Fetch all stores with statistics for super admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Verify super admin session
    const isAuthorized = await verifySuperAdminSession(request)
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Fetch all stores using admin client
    const { data: stores, error: storesError } = await supabaseAdmin
      .from("stores")
      .select("*")
      .order("created_at", { ascending: false })

    if (storesError) {
      console.error("Error fetching stores:", storesError)
      return NextResponse.json(
        { error: "Failed to fetch stores" },
        { status: 500 }
      )
    }

    // Fetch statistics for each store
    const storesWithStats = await Promise.all(
      (stores || []).map(async (store) => {
        try {
          const [productsRes, ordersRes, revenueRes] = await Promise.all([
            supabaseAdmin
              .from("products")
              .select("id", { count: "exact", head: true })
              .eq("store_id", store.id),
            supabaseAdmin
              .from("orders")
              .select("id", { count: "exact", head: true })
              .eq("store_id", store.id),
            supabaseAdmin
              .from("orders")
              .select("total")
              .eq("store_id", store.id)
              .eq("status", "completed"),
          ])

          const revenue =
            revenueRes.data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0

          return {
            ...store,
            products_count: productsRes.count || 0,
            orders_count: ordersRes.count || 0,
            revenue: revenue,
          }
        } catch (error) {
          console.error(`Error fetching stats for store ${store.id}:`, error)
          return {
            ...store,
            products_count: 0,
            orders_count: 0,
            revenue: 0,
          }
        }
      })
    )

    // Calculate overall statistics
    const stats = {
      total_stores: storesWithStats.length,
      active_stores: storesWithStats.filter((s) => s.status === "active").length,
      inactive_stores: storesWithStats.filter((s) => s.status !== "active").length,
      total_orders: storesWithStats.reduce((sum, s) => sum + (s.orders_count || 0), 0),
      total_revenue: storesWithStats.reduce((sum, s) => sum + (s.revenue || 0), 0),
      total_products: storesWithStats.reduce((sum, s) => sum + (s.products_count || 0), 0),
    }

    return NextResponse.json({
      success: true,
      stores: storesWithStats,
      stats,
    })
  } catch (error) {
    console.error("Unexpected error in super-admin/stores:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/super-admin/stores
 * Update store status (activate/deactivate)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify super admin session
    const isAuthorized = await verifySuperAdminSession(request)
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { store_id, status } = body

    if (!store_id || !status) {
      return NextResponse.json(
        { error: "Missing store_id or status" },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ["active", "inactive", "suspended", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be: active, inactive, suspended, or cancelled" },
        { status: 400 }
      )
    }

    // Update store status
    const { data, error } = await supabaseAdmin
      .from("stores")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", store_id)
      .select()
      .single()

    if (error) {
      console.error("Error updating store status:", error)
      return NextResponse.json(
        { error: "Failed to update store status" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      store: data,
      message: `Store status updated to ${status}`,
    })
  } catch (error) {
    console.error("Unexpected error in PATCH super-admin/stores:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/super-admin/stores
 * Delete a store and all its associated data (super admin only)
 * 
 * This function performs a comprehensive deletion:
 * 1. Deletes all related files from storage buckets
 * 2. Deletes related database records via cascade
 * 3. Finally deletes the store record
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify super admin session
    const isAuthorized = await verifySuperAdminSession(request)
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get store_id from query params
    const { searchParams } = new URL(request.url)
    const store_id = searchParams.get("store_id")

    if (!store_id) {
      return NextResponse.json(
        { error: "Missing store_id parameter" },
        { status: 400 }
      )
    }

    // Get store data first (to get folder paths for storage cleanup)
    const { data: store, error: storeError } = await supabaseAdmin
      .from("stores")
      .select("id, subdomain, slug")
      .eq("id", store_id)
      .single()

    if (storeError || !store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      )
    }

    // List of storage buckets and their folder patterns
    const storageBuckets = [
      { name: "products", folderPattern: store_id },
      { name: "product-images", folderPattern: store_id },
      { name: "categories", folderPattern: store_id },
      { name: "hero-slides", folderPattern: store_id },
      { name: "page-images", folderPattern: store_id },
      { name: "logo-storage", folderPattern: store_id },
      { name: "profile-images", folderPattern: store_id },
    ]

    // Delete files from all storage buckets
    for (const bucket of storageBuckets) {
      try {
        const { data: files, error: listError } = await supabaseAdmin.storage
          .from(bucket.name)
          .list(bucket.folderPattern, {
            limit: 100,
            offset: 0,
            sortBy: { column: "name", order: "asc" },
          })

        if (!listError && files && files.length > 0) {
          const filePaths = files.map((f) => `${bucket.folderPattern}/${f.name}`)
          
          const { error: deleteError } = await supabaseAdmin.storage
            .from(bucket.name)
            .remove(filePaths)

          if (deleteError) {
            console.warn(`Warning deleting files from ${bucket.name}:`, deleteError)
          } else {
            console.log(`✅ Deleted ${filePaths.length} files from ${bucket.name}`)
          }
        }
      } catch (error) {
        console.warn(`Warning processing bucket ${bucket.name}:`, error)
        // Continue with other buckets even if one fails
      }
    }

    // Delete store_admins table entries
    const { error: adminsError } = await supabaseAdmin
      .from("store_admins")
      .delete()
      .eq("store_id", store_id)

    if (adminsError) {
      console.warn("Warning deleting store_admins:", adminsError)
    }

    // Delete all user profiles for this store
    const { data: profiles, error: profilesListError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("store_id", store_id)

    if (!profilesListError && profiles && profiles.length > 0) {
      const userIds = profiles.map((p) => p.id)
      
      const { error: profilesDeleteError } = await supabaseAdmin
        .from("profiles")
        .delete()
        .in("id", userIds)

      if (profilesDeleteError) {
        console.warn("Warning deleting profiles:", profilesDeleteError)
      }
    }

    // Delete the store - this should cascade delete all related data
    // due to ON DELETE CASCADE foreign keys:
    // - products
    // - product_variants
    // - product_images
    // - product_reviews
    // - categories
    // - orders
    // - order_items
    // - customers
    // - design_settings
    // - store_settings
    // - hero_slides
    // - homepage_sections
    // - page_content
    // - discount_coupons
    // - shipping_zones
    // - payment_offers
    // - contact_messages
    // - addresses
    // - etc.
    const { error: storeDeleteError } = await supabaseAdmin
      .from("stores")
      .delete()
      .eq("id", store_id)

    if (storeDeleteError) {
      console.error("Error deleting store:", storeDeleteError)
      return NextResponse.json(
        { error: "Failed to delete store. Please check the database logs." },
        { status: 500 }
      )
    }

    console.log(`✅ Store ${store_id} (${store.subdomain}) deleted successfully with all its data`)

    return NextResponse.json({
      success: true,
      message: `Store "${store.subdomain}" and all associated data deleted successfully`,
      deletedStore: {
        id: store_id,
        subdomain: store.subdomain,
        slug: store.slug,
      }
    })
  } catch (error) {
    console.error("Unexpected error in DELETE super-admin/stores:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

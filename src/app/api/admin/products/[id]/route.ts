import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient, getStoreIdFromRequest } from "@/lib/supabase/admin"
import { invalidateSingleProductCache, invalidateProductCache } from "@/lib/cache/products-cache"
import { revalidatePath } from "next/cache"

// GET - Fetch single product (with store_id verification)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdminClient()
    const storeId = await getStoreIdFromRequest()

    // Fetch product with category
    const { data: product, error } = await supabase
      .from("products")
      .select("*, category:categories(name_ar, name_en)")
      .eq("id", id)
      .eq("store_id", storeId)
      .single()

    if (error) throw error

    // Fetch images and variants separately (workaround for partitioned tables)
    const [imagesResult, variantsResult] = await Promise.all([
      supabase.from("product_images").select("*").eq("product_id", id),
      supabase.from("product_variants").select("*").eq("product_id", id)
    ])

    const data = {
      ...product,
      product_images: imagesResult.data || [],
      product_variants: variantsResult.data || []
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Error fetching product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

// PATCH - Update product (with store_id verification)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = getSupabaseAdminClient() as any
    const storeId = await getStoreIdFromRequest()

    // فقط الحقول المسموحة للتحديث (لا يمكن تغيير store_id)
    const allowedFields = [
      "name_ar",
      "name_en",
      "slug",
      "description_ar",
      "description_en",
      "category_id",
      "base_price",
      "is_featured",
      "is_active",
      "sku",
      "inventory_quantity",
      "shipping_type",
      "shipping_cost"
    ]
    const updateData: Record<string, any> = {}
    for (const key of allowedFields) {
      if (key in body) updateData[key] = body[key]
    }

    const { data, error } = await supabase
      .from("products")
      .update({ ...updateData })
      .eq("id", id)
      .eq("store_id", storeId) // Verify product belongs to current store
      .select()
      .single()

    if (error) throw error

    // Invalidate product cache after update
    invalidateSingleProductCache(storeId, id)
    revalidatePath('/admin/products')
    revalidatePath(`/products/${id}`)
    revalidatePath('/')

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

// DELETE - Delete product (cascade delete all related data, with store_id verification)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdminClient()
    const storeId = await getStoreIdFromRequest()

    // First verify the product belongs to this store
    const { data: product, error: verifyError } = await supabase
      .from("products")
      .select("id")
      .eq("id", id)
      .eq("store_id", storeId)
      .single()

    if (verifyError || !product) {
      return NextResponse.json(
        { error: "المنتج غير موجود أو لا يمكنك حذفه" },
        { status: 404 }
      )
    }

    // Step 1: Get all product variants
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", id)

    // Step 2: Delete order_items that reference these variants
    if (variants && variants.length > 0) {
      const variantIds = variants.map((v: any) => v.id)
      const { error: orderItemsError } = await supabase
        .from("order_items")
        .delete()
        .in("variant_id", variantIds)

      if (orderItemsError) {
        console.error("[v0] Error deleting order items:", orderItemsError)
      }
    }

    // Step 3: Delete product variants
    const { error: variantsError } = await supabase
      .from("product_variants")
      .delete()
      .eq("product_id", id)

    if (variantsError) {
      console.error("[v0] Error deleting variants:", variantsError)
    }

    // Step 4: Delete product images
    const { error: imagesError } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", id)

    if (imagesError) {
      console.error("[v0] Error deleting images:", imagesError)
    }

    // Step 5: Delete the product itself
    const { error: productError } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("store_id", storeId) // Extra safety check

    if (productError) {
      console.error("[v0] Error deleting product:", productError)
      return NextResponse.json(
        { error: "فشل حذف المنتج: " + productError.message },
        { status: 500 }
      )
    }

    // Invalidate product caches after deletion
    invalidateProductCache(storeId)
    revalidatePath('/admin/products')
    revalidatePath('/')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting product:", error)
    return NextResponse.json(
      { error: error?.message || "فشل حذف المنتج" },
      { status: 500 }
    )
  }
}

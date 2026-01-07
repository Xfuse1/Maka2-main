import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

// GET - Fetch single product
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(name_ar, name_en),
        product_images(*),
        product_variants(*)
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Error fetching product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

// PATCH - Update product
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = getSupabaseAdminClient() as any // <-- fix type error

    // فقط الحقول المسموحة للتحديث
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
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

// DELETE - Delete product (cascade delete all related data)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdminClient()

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
        // Continue anyway - we want to delete the product
      }
    }

    // Step 3: Delete product variants
    const { error: variantsError } = await supabase
      .from("product_variants")
      .delete()
      .eq("product_id", id)

    if (variantsError) {
      console.error("[v0] Error deleting variants:", variantsError)
      // Continue anyway
    }

    // Step 4: Delete product images
    const { error: imagesError } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", id)

    if (imagesError) {
      console.error("[v0] Error deleting images:", imagesError)
      // Continue anyway
    }

    // Step 5: Delete the product itself
    const { error: productError } = await supabase
      .from("products")
      .delete()
      .eq("id", id)

    if (productError) {
      console.error("[v0] Error deleting product:", productError)
      return NextResponse.json(
        { error: "فشل حذف المنتج: " + productError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting product:", error)
    return NextResponse.json(
      { error: error?.message || "فشل حذف المنتج" },
      { status: 500 }
    )
  }
}

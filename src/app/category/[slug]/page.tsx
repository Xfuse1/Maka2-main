"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useStore } from "@/lib/store-context"

export default function CategoryPage() {
  const params = useParams()
  const slug = decodeURIComponent(params.slug as string)
  const { store, isLoading: storeLoading } = useStore()
  const [searchQuery] = useState("")
  const [products, setProducts] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [categoryNotFound, setCategoryNotFound] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<any[]>([])

  useEffect(() => {
    async function fetchProducts() {
      // Wait for store to be loaded
      if (storeLoading || !store?.id) {
        return
      }

      const storeId = store.id

      try {
        setLoading(true)
        setCategoryNotFound(false)

        const { data: allCategories, error: allCategoriesError } = await supabase
          .from("categories")
          .select("*")
          .eq("is_active", true)
          .eq("store_id", storeId)

        if (allCategories) {
          setAvailableCategories(allCategories)
        }

        if (allCategoriesError) {
          console.error("[v0] ❌ خطأ في جلب الفئات:", allCategoriesError)
        }

        let foundCategory = null

        const slugResult = await supabase.from("categories").select("*").eq("slug", slug).eq("is_active", true).eq("store_id", storeId).single()

        if (!slugResult.error && slugResult.data) {
          foundCategory = slugResult.data
        }

        if (!foundCategory) {
          const nameResult = await supabase
            .from("categories")
            .select("*")
            .eq("name_ar", slug)
            .eq("is_active", true)
            .eq("store_id", storeId)
            .single()

          if (!nameResult.error && nameResult.data) {
            foundCategory = nameResult.data
          }
        }

        if (!foundCategory) {
          const enNameResult = await supabase
            .from("categories")
            .select("*")
            .eq("name_en", slug)
            .eq("is_active", true)
            .eq("store_id", storeId)
            .single()

          if (!enNameResult.error && enNameResult.data) {
            foundCategory = enNameResult.data
          }
        }

        if (!foundCategory) {
          const result = await supabase.from("categories").select("*").eq("is_active", true).eq("store_id", storeId)

          if (result.data && result.data.length > 0) {
            const searchTerm = slug.toLowerCase()
            foundCategory = result.data.find((cat) => {
              const nameAr = cat.name_ar?.toLowerCase() || ""
              const nameEn = cat.name_en?.toLowerCase() || ""
              const catSlug = cat.slug?.toLowerCase() || ""
              return nameAr.includes(searchTerm) || nameEn.includes(searchTerm) || catSlug.includes(searchTerm)
            })
          }
        }

        if (!foundCategory) {
          console.error("[v0] ❌ لم يتم العثور على الفئة:", slug)
          setCategoryNotFound(true)
          setProducts([])
          setCategoryData(null)
          setLoading(false)
          return
        }

        setCategoryData(foundCategory)

        // Fetch products without nested relations
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*")
          .eq("category_id", foundCategory.id)
          .eq("is_active", true)
          .eq("store_id", storeId)
          .order("created_at", { ascending: false })

        if (productsError) {
          console.error("[v0] ❌ خطأ في جلب المنتجات:", productsError)
          setProducts([])
          setCategoryNotFound(true)
        } else if (productsData && productsData.length > 0) {
          // Fetch images separately (workaround for partitioned tables)
          const productIds = productsData.map((p: any) => p.id)
          const { data: images } = await supabase
            .from("product_images")
            .select("product_id, image_url, alt_text_ar, alt_text_en, is_primary, display_order")
            .in("product_id", productIds)
            .order("display_order", { ascending: true })

          // Attach images to products and sort them
          const processedProducts = productsData.map((product: any) => {
            const productImages = (images || [])
              .filter((img: any) => img.product_id === product.id)
              .sort((a: any, b: any) => {
                if (a.is_primary && !b.is_primary) return -1
                if (!a.is_primary && b.is_primary) return 1
                return (a.display_order || 0) - (b.display_order || 0)
              })
            return {
              ...product,
              product_images: productImages,
            }
          })

          setProducts(processedProducts)
        } else {
          setProducts([])
        }
      } catch (error) {
        console.error("[v0] ❌ خطأ غير متوقع:", error)
        setProducts([])
        setCategoryData(null)
        setCategoryNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [slug, store?.id, storeLoading])

  const filteredProducts = searchQuery
    ? products.filter(
        (product) =>
          product.name_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.name_en?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : products

  const categoryName = categoryData?.name_ar || "المنتجات"

  if (loading || storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-foreground">جاري تحميل المنتجات...</p>
        </div>
      </div>
    )
  }

  if (categoryNotFound) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />

        <main className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center py-20">
              <AlertCircle className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
              <h1 className="text-4xl font-bold mb-4 text-foreground">الفئة غير موجودة</h1>
              <p className="text-xl text-muted-foreground mb-8">عذراً، لم نتمكن من العثور على الفئة "{slug}"</p>

              {availableCategories.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-6 text-foreground">الفئات المتاحة:</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {availableCategories.map((category) => (
                      <Link key={category.id} href={`/category/${category.slug}`}>
                        <Card className="hover:border-primary transition-all hover:shadow-lg cursor-pointer">
                          <CardContent className="p-6">
                            <h3 className="font-bold text-lg text-foreground">{category.name_ar}</h3>
                            <p className="text-sm text-muted-foreground">{category.name_en}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/">العودة للرئيسية</Link>
              </Button>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8 text-foreground text-right">{categoryName}</h1>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">لا توجد منتجات في هذه الفئة حالياً</p>
              {products.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  تم جلب {products.length} منتج ولكن لا يتطابق مع البحث
                </p>
              )}
              <Button asChild className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/">العودة للرئيسية</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group"
                >
                  <Card className="overflow-hidden border-2 border-border hover:border-primary transition-all hover:shadow-xl">
                    <CardContent className="p-0">
                      <div className="relative aspect-[3/4] bg-muted">
                        <Image
                          src={product.product_images?.[0]?.image_url || "/placeholder.svg"}
                          alt={product.name_ar || product.name_en || "صورة المنتج"}
                          width={300}
                          height={400}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {product.is_featured && (
                          <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">مميز</Badge>
                        )}
                       
                      </div>
                      <div className="p-6 bg-background">
                        <h4 className="text-xl font-bold mb-2 text-foreground text-right">
                          {product.name_ar || product.name_en}
                        </h4>
                        <div className="flex items-center gap-2 mb-3 justify-end">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(product.rating || 0)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-muted text-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">({product.reviews || 0})</span>
                        </div>
                        <p className="text-2xl font-bold text-primary text-right">{product.base_price} ج.م</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

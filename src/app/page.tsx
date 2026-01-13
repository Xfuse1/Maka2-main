import { Suspense } from "react"
import { createAdminClient, getStoreIdFromRequest } from "@/lib/supabase/admin"
import { getActiveCategories, type Category } from "@/lib/supabase/categories"
import { getStoreSettingsServer } from "@/lib/store-settings"
import { unstable_cache } from "next/cache"
import { Loader2 } from "lucide-react"

// Components
import { SiteFooter } from "@/components/site-footer"
import { HomepageClientWrapper } from "@/components/homepage/homepage-wrapper"

// =============================================================================
// CACHED DATA FETCHING (Server-side with ISR)
// =============================================================================

type ProductWithImages = {
  id: string
  name_ar: string
  base_price: number
  is_featured: boolean
  created_at: string
  category_id: string | null
  product_images: { product_id: string; image_url: string; display_order: number }[]
}

const getProducts = async (storeId: string): Promise<ProductWithImages[]> => {
  const supabase = createAdminClient()

  // Fetch products first
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name_ar, base_price, is_featured, created_at, category_id")
    .eq("is_active", true)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(50) as { data: any[] | null; error: any }

  if (error) {
    console.error("[Homepage] Error fetching products:", error)
    return []
  }

  if (!products || products.length === 0) return []

  // Fetch images separately (workaround for partitioned tables)
  const productIds = products.map((p: any) => p.id)
  const { data: images } = await supabase
    .from("product_images")
    .select("product_id, image_url, display_order")
    .in("product_id", productIds)
    .order("display_order", { ascending: true }) as { data: any[] | null }

  // Attach images to products
  return products.map((p: any) => ({
    ...p,
    product_images: (images || []).filter((img: any) => img.product_id === p.id)
  }))
}

const getHomepageSections = async (storeId: string) => {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("homepage_sections")
    .select("*")
    .eq("is_active", true)
    .eq("store_id", storeId)
    .order("display_order", { ascending: true })
  
  if (error) return []
  return data || []
}

const getHeroSlides = async (storeId: string) => {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("is_active", true)
    .eq("store_id", storeId)
    .order("display_order", { ascending: true })

  if (error) return []
  return data || []
}

const getCategoriesCached = async (storeId: string) => {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .eq("store_id", storeId)
    .order("display_order", { ascending: true })
  
  if (error) {
    console.error("[Homepage] Error fetching categories:", error)
    return []
  }
  return data || []
}

// =============================================================================
// LOADING (Shows instantly before data loads)
// =============================================================================

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    </div>
  )
}

// =============================================================================
// PAGE (Server Component - fetches data before rendering)
// =============================================================================

export default async function HomePage() {
  // Get store_id from request headers (set by middleware based on subdomain)
  const storeId = await getStoreIdFromRequest()
  
  // Parallel fetch - all queries run at the same time on the server
  const [products, sections, categories, heroSlides, storeSettings] = await Promise.all([
    getProducts(storeId),
    getHomepageSections(storeId),
    getCategoriesCached(storeId),
    getHeroSlides(storeId),
    getStoreSettingsServer(storeId),
  ])

  const storeName = storeSettings?.store_name || "متجرك"

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<LoadingSkeleton />}>
        <HomepageClientWrapper
          products={products}
          categories={categories}
          heroSlides={heroSlides}
          storeName={storeName}
        />
      </Suspense>
      <SiteFooter />
    </div>
  )
}

// ISR: Revalidate every 60 seconds
export const revalidate = 60

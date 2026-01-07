"use client"

import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ShoppingBag, Search, Loader2, User as UserIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useCartStore } from "@/lib/cart-store"
import ProfileDropdown from "@/components/profile-dropdown.client"
import { HeroSlider } from "@/components/hero-slider"
import { MainNavigation } from "@/components/main-navigation"
import { MobileNavigation } from "@/components/mobile-navigation"
import { SiteLogo } from "@/components/site-logo"
import { createClient } from "@/lib/supabase/client" 
import { getActiveCategories, type Category } from "@/lib/supabase/categories"
import { DynamicHomepageSection } from "@/components/dynamic-homepage-section"
import { BestsellerSection } from "@/components/bestseller-section"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedSection } from "@/components/animated-section"
import { useSettingsStore } from "@/store/settings-store"
import { SiteFooter } from "@/components/site-footer"

// Create a Supabase client instance
const supabase = createClient();

interface Product {
  id: string
  name_ar: string
  base_price: number
  is_featured?: boolean
  category: Array<{
    name_ar: string
  }> | null
  product_images: Array<{
    image_url: string
    display_order: number
  }>
}

interface HomepageSection {
  id: string
  name_ar: string
  section_type: string
  display_order: number
  is_active: boolean
  max_items: number
  layout_type: string
  background_color: string
  show_title: boolean
  description?: string
  product_ids?: string[]
}

// Fallback mock data
const FALLBACK_CATEGORIES: Category[] = [
  { id: "fallback-cat-1", name_ar: "عبايات", name_en: "Abayas", slug: "abayas", is_active: true, display_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "fallback-prod-1",
    name_ar: "فستان تجريبي",
    base_price: 199.0,
    is_featured: true,
    category: [{ name_ar: "عبايات" }],
    product_images: [{ image_url: "/placeholder.svg", display_order: 1 }],
  },
]

const FALLBACK_SECTIONS: HomepageSection[] = [
  {
    id: "fallback-sec-1",
    name_ar: "الهيرو الافتراضي",
    section_type: "hero",
    display_order: 1,
    is_active: true,
    max_items: 5,
    layout_type: "full",
    background_color: "#000",
    show_title: true,
  },
]

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const totalItems = useCartStore((state) => state.getTotalItems())
  const { settings, loadSettings } = useSettingsStore()

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)

        const [productsResponse, categoriesResponse, sectionsResponse] = await Promise.all([
          supabase.from("products").select(`id,name_ar,base_price,is_featured,created_at,category:categories(name_ar),product_images(image_url,display_order)`).eq("is_active", true).order("created_at", { ascending: false }),
          getActiveCategories(),
          supabase.from("homepage_sections").select("*").eq("is_active", true).order("display_order", { ascending: true }),
        ])

        if (productsResponse.error) {
          console.error("Error fetching products:", productsResponse.error)
          setProducts(FALLBACK_PRODUCTS)
        } else {
          setProducts(productsResponse.data || FALLBACK_PRODUCTS)
        }

        setCategories((categoriesResponse && categoriesResponse.length > 0) ? categoriesResponse : FALLBACK_CATEGORIES)

        if (sectionsResponse.error) {
          console.error("Error fetching sections:", sectionsResponse.error)
          setSections(FALLBACK_SECTIONS)
        } else {
          setSections(sectionsResponse.data || FALLBACK_SECTIONS)
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    });

    const channel = supabase.channel("homepage_sections_changes").on("postgres_changes", { event: "*", schema: "public", table: "homepage_sections" }, async (payload) => {
      const { data, error } = await supabase.from("homepage_sections").select("*").eq("is_active", true).order("display_order", { ascending: true })
      if (!error && data) {
        setSections(data)
      }
    }).subscribe()

    return () => {
      authListener?.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return false
    const query = searchQuery.toLowerCase()
    return product.name_ar.toLowerCase().includes(query) || product.category?.[0]?.name_ar.toLowerCase().includes(query)
  })

  const filteredCategories = categories.filter((category) => {
    if (!searchQuery) return false;
    const query = searchQuery.toLowerCase();
    return category.name_ar.toLowerCase().includes(query);
  });

  const getFirstImage = (product: Product) => {
    const sortedImages = [...(product.product_images || [])].sort((a, b) => a.display_order - b.display_order)
    return sortedImages[0]?.image_url || "/placeholder.svg"
  }
  
  const bestsellerProduct = products.find(p => p.is_featured) || products[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 sm:gap-4">
              <SiteLogo width={60} height={60} className="w-10 h-10 sm:w-[80px] sm:h-[80px]" />
              <h1 className="text-lg sm:text-3xl font-bold text-primary block">{settings.siteName}</h1>
            </Link>

            <div className="hidden md:flex flex-1 max-w-3xl mx-4 lg:mx-8">
              <div className="relative w-full">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input type="text" placeholder="ابحثي عن المنتجات..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-12 h-14 text-lg border-2 border-border focus:border-primary" />
              </div>
            </div>

              <MainNavigation />

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden md:block">
                  {user ? (
                    <ProfileDropdown user={user} profile={null} />
                  ) : (
                    <Button variant="outline" asChild>
                      <Link href="/auth">تسجيل الدخول</Link>
                    </Button>
                  )}
                </div>
              <MobileNavigation user={user} />

              <Button asChild variant="default" className="bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground relative shadow-md hover:shadow-lg transition-all">
                <Link href="/cart">
                  <ShoppingBag className="h-5 w-5 ml-2" />
                  <span className="hidden sm:inline">السلة</span>
                  {totalItems > 0 && (
                    <Badge className="absolute -top-2 -left-2 bg-accent text-accent-foreground px-2 py-0.5 text-xs">
                      {totalItems}
                    </Badge>
                  )}
                </Link>
              </Button>
            </div>
          </div>

          <div className="md:hidden mt-4">
            <div className="relative w-full">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input type="text" placeholder="ابحثي عن المنتجات..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 border-2 border-border focus:border-primary" />
            </div>
          </div>
        </div>
      </header>

      <div className="overflow-hidden">
        <HeroSlider />
      </div>

      {searchQuery && (
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold mb-8 text-foreground">نتائج البحث عن "{searchQuery}"</h3>
            {filteredProducts.length === 0 && filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground">لا توجد منتجات او فئات تطابق بحثك</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((product) => (
                  <Link key={product.id} href={`/product/${product.id}`} className="group">
                    <Card className="overflow-hidden border-2 border-border hover:border-primary transition-all hover:shadow-xl">
                      <CardContent className="p-0">
                        <div className="relative aspect-[3/4] bg-muted">
                          <Image src={getFirstImage(product) || "/placeholder.svg"} alt={product.name_ar} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                        </div>
                        <div className="p-6 bg-background">
                          <h4 className="text-xl font-bold mb-2 text-foreground">{product.name_ar}</h4>
                          <p className="text-2xl font-bold text-primary">{product.base_price} د.م</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {!searchQuery && (
        <>
          {(() => {
            // Prevent rendering duplicate unique sections (e.g. reviews, hero, featured)
            const uniqueTypes = new Set(["reviews", "hero", "featured"])
            const seen = new Set<string>()
            const filtered = sections.filter((s) => {
              if (uniqueTypes.has(s.section_type)) {
                if (seen.has(s.section_type)) return false
                seen.add(s.section_type)
                return true
              }
              return true
            })

            return filtered.map((section) => (
              <AnimatedSection key={section.id}>
                <DynamicHomepageSection section={section} products={products} categories={categories} />
              </AnimatedSection>
            ))
          })()}
        </>
      )}

      <SiteFooter />
    </div>
  )
}

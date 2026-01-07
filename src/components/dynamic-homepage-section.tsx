"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {  TrendingUp, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { CustomerReviews } from "@/components/customer-reviews"
import { useDesignStore } from "@/store/design-store"
import { useSettingsStore } from "@/store/settings-store"

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

interface Category {
  id: string
  name_ar: string
  slug: string
  description_ar?: string
  image_url?: string
}

interface HomepageSection {
  id: string
  name_ar: string
  section_type: string
  is_active: boolean
  max_items: number
  layout_type: string
  background_color: string
  show_title: boolean
  description?: string
  product_ids?: string[]
}

interface DynamicHomepageSectionProps {
  section: HomepageSection
  products: Product[]
  categories: Category[]
}

export function DynamicHomepageSection({ section, products, categories }: DynamicHomepageSectionProps) {
  if (!section.is_active) return null

  const { colors } = useDesignStore()
  const { settings, loadSettings } = useSettingsStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadSettings()
  }, [loadSettings])

  // CSS Variables for dynamic colors
  const cssVars = mounted ? {
    '--section-bg': colors.background,
    '--section-fg': colors.foreground,
    '--section-fg-muted': colors.foreground + 'CC',
    '--section-border': colors.foreground + '20',
    '--section-primary': colors.primary,
  } as React.CSSProperties : {}

  const getFirstImage = (product: Product) => {
    const sortedImages = [...(product.product_images || [])].sort((a, b) => a.display_order - b.display_order)
    return sortedImages[0]?.image_url || "/placeholder.svg"
  }

  const getSectionProducts = () => {
    switch (section.section_type) {
      case "best_sellers":
        return products.slice(0, section.max_items)
      case "new_arrivals":
        return products.slice(0, section.max_items)
      case "featured":
        return products.filter((p) => p.is_featured).slice(0, section.max_items)
      default:
        if (section.product_ids && section.product_ids.length > 0) {
          return products
            .filter((p) => section.product_ids?.includes(p.id))
            .slice(0, section.max_items)
        }
        return products.slice(0, section.max_items)
    }
  }

  const getSectionIcon = () => {
    switch (section.section_type) {
      case "best_sellers":
        return <TrendingUp className="w-8 h-8 text-[--section-primary]" />
      case "new_arrivals":
        return <Sparkles className="w-8 h-8 text-[--section-primary]" />
      default:
        return null
    }
  }

  const getBadgeText = () => {
    switch (section.section_type) {
      case "best_sellers":
        return "الأكثر مبيعاً"
      case "new_arrivals":
        return "جديد"
      case "featured":
        return "مميز"
      default:
        return null
    }
  }

  const getBadgeClasses = () => {
    switch (section.section_type) {
      case "best_sellers":
        return "bg-red-500 text-white"
      case "new_arrivals":
      case "featured":
      default:
        return "bg-[--section-primary] text-[--section-fg]"
    }
  }

  if (section.section_type === "about_us") {
    return (
      <section 
        className="py-20 transition-colors duration-300 bg-[--section-bg]"
        style={cssVars}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row-reverse items-center gap-12">
            {/* Image Column */}
            <div className="w-full md:w-1/2">
              <Image
                src="https://i.postimg.cc/T1WhHHXm/unnamed.jpg"
                alt="قصتنا"
                width={500}
                height={500}
                className="rounded-xl shadow-lg object-cover w-full h-full"
              />
            </div>
            {/* Text Column */}
            <div className="w-full md:w-1/2 text-right">
              <h3 className="text-4xl font-bold mb-6 relative inline-block pr-6 text-[--section-fg]">
                {section.name_ar}
                <span className="absolute right-0 top-0 bottom-0 w-1.5 bg-[--section-primary]"></span>
              </h3>
              <p className="text-lg leading-relaxed text-[--section-fg-muted]">
                {settings.siteDescription || `بدأت رحلة ${settings.siteName} من حلم بسيط: توفير أزياء نسائية راقية تجمع بين الأناقة العصرية والاحتشام الأصيل.`}
              </p>
            </div>
          </div>
        </div>
      </section>
    )
}


  // Reviews Section
  if (section.section_type === "reviews") {
    return <CustomerReviews />
  }

  // Categories Section
  if (section.section_type === "categories") {
    return (
      <section 
        id="categories" 
        className="py-20 transition-colors duration-300 bg-[--section-bg]"
        style={cssVars}
      >
        <div className="container mx-auto px-4">
            {section.show_title && (
            <h3 className="text-4xl font-bold text-center mb-16 transition-colors duration-300 text-[--section-fg]">
              {section.name_ar}
            </h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.slice(0, section.max_items).map((category) => (
              <Link key={category.id} href={`/category/${category.slug}`} className="group">
                <Card className="overflow-hidden border-2 transition-all hover:shadow-xl border-[--section-border] hover:border-[--section-primary]">
                  <CardContent className="p-0">
                    <div className="relative aspect-[3/4] bg-muted">
                      <Image
                        src={category.image_url || "/placeholder.svg?height=400&width=300"}
                        alt={category.name_ar}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    </div>
                    <div className="p-6 text-center transition-colors duration-300 bg-[--section-bg]">
                      <h4 className="text-2xl font-bold transition-colors duration-300 text-[--section-fg]">
                        {category.name_ar}
                      </h4>
                      {category.description_ar && (
                        <p className="text-sm mt-2 line-clamp-2 transition-colors duration-300 text-[--section-fg-muted]">
                          {category.description_ar}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Products Section
  const sectionProducts = getSectionProducts()
  const badgeText = getBadgeText()
  const badgeClasses = getBadgeClasses()
  const icon = getSectionIcon()

  return (
    <section 
      className="py-20 transition-colors duration-300 bg-[--section-bg]"
      style={cssVars}
    >
      <div className="container mx-auto px-4">
        {section.show_title && (
          <>
            <div className="flex items-center justify-center gap-3 mb-4">
              {icon}
              <h3 className="text-4xl font-bold text-center transition-colors duration-300 text-[--section-fg]">
                {section.name_ar}
              </h3>
            </div>
            {section.section_type === "custom" && section.description && (
              <p className="homepage-section-description text-center text-lg mb-16 transition-colors duration-300 text-[--section-fg-muted]">
                {section.description}
              </p>
            )}
              {section.section_type === "best_sellers" && (
              <p className="text-center text-lg mb-16 transition-colors duration-300 text-[--section-fg-muted]">
                المنتجات الأكثر طلباً من عملائنا
              </p>
            )}
            {section.section_type === "new_arrivals" && (
              <p className="text-center text-lg mb-16 transition-colors duration-300 text-[--section-fg-muted]">
                أحدث إضافاتنا من التصاميم العصرية
              </p>
            )}
            {section.section_type === "featured" && (
              <p className="text-center text-lg mb-16 transition-colors duration-300 text-[--section-fg-muted]">
                تشكيلة مختارة بعناية من أفضل منتجاتنا
              </p>
            )}
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sectionProducts.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group"
            >
                <Card className="overflow-hidden border-2 transition-all hover:shadow-xl border-[--section-border] hover:border-[--section-primary]">
                <CardContent className="p-0">
                  <div className="relative aspect-[3/4] bg-muted">
                    <Image
                      src={getFirstImage(product) || "/placeholder.svg"}
                      alt={product.name_ar}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    {badgeText && (
                      <Badge className={`absolute top-4 right-4 border-0 transition-all duration-300 ${badgeClasses}`}>
                        {badgeText}
                      </Badge>
                    )}
                    
                  </div>
                  <div className="p-6 transition-colors duration-300 bg-[--section-bg]">
                    <h4 className="text-xl font-bold mb-2 transition-colors duration-300 text-[--section-fg]">
                      {product.name_ar}
                    </h4>
                    <p className="text-2xl font-bold transition-colors duration-300 text-[--section-primary]">
                      {product.base_price} ج.م
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

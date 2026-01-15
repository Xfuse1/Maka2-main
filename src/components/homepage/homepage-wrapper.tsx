"use client"

import { HeroSliderOptimized } from "./hero-slider-optimized"
import { ProductCard } from "@/components/product-card"
import { SiteHeader } from "@/components/site-header"

type Product = {
  id: string
  name_ar: string
  base_price: number
  is_featured: boolean
  product_images: Array<{
    image_url: string
    display_order: number
  }>
}

type Category = {
  id: string
  slug: string
  name_ar: string
  name_en: string
}

type HomepageClientWrapperProps = {
  products?: Product[]
  categories?: Category[]
  heroSlides?: any[]
  storeName?: string
}

export function HomepageClientWrapper({
  products = [],
  categories = [],
  heroSlides = [],
  storeName = "متجرنا"
}: HomepageClientWrapperProps) {
  return (
    <div className="min-h-screen">
      {/* Site Header */}
      <SiteHeader />
      
      {/* Hero Section */}
      {heroSlides && heroSlides.length > 0 && (
        <section className="mb-12">
          <HeroSliderOptimized initialSlides={heroSlides} />
        </section>
      )}

      {/* Featured Products */}
      {products && products.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            المنتجات المميزة
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name_ar}
                price={product.base_price}
                image={
                  product.product_images?.[0]?.image_url ||
                  "/placeholder.png"
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* Categories Section */}
      {categories && categories.length > 0 && (
        <section className="container mx-auto px-4 py-12 bg-gray-50">
          <h2 className="text-3xl font-bold text-center mb-8">
            تصفح الأقسام
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <a
                key={category.id}
                href={`/category/${category.slug}`}
                className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-center"
              >
                <h3 className="text-lg font-semibold">{category.name_ar}</h3>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

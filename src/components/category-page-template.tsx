"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Star, 
  Grid3X3, 
  LayoutGrid, 
  SlidersHorizontal,
  ChevronDown,
  Heart,
  ShoppingBag,
  Sparkles,
  ArrowUpDown
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getProductsByCategory } from "@/lib/products-data"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface CategoryPageTemplateProps {
  categoryName: string
  categoryTitle: string
  categoryDescription: string
}

type SortOption = "newest" | "price-low" | "price-high" | "rating" | "popular"
type GridView = "small" | "large"

export function CategoryPageTemplate({
  categoryName,
  categoryTitle,
  categoryDescription,
}: CategoryPageTemplateProps) {
  const products = getProductsByCategory(categoryName)
  const [gridView, setGridView] = useState<GridView>("large")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "الأحدث" },
    { value: "popular", label: "الأكثر مبيعاً" },
    { value: "rating", label: "الأعلى تقييماً" },
    { value: "price-low", label: "السعر: من الأقل للأعلى" },
    { value: "price-high", label: "السعر: من الأعلى للأقل" },
  ]

  const sortedProducts = useMemo(() => {
    const sorted = [...products]
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => a.price - b.price)
      case "price-high":
        return sorted.sort((a, b) => b.price - a.price)
      case "rating":
        return sorted.sort((a, b) => b.rating - a.rating)
      case "popular":
        return sorted.sort((a, b) => b.reviews - a.reviews)
      default:
        return sorted
    }
  }, [products, sortBy])

  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId)
      } else {
        newFavorites.add(productId)
      }
      return newFavorites
    })
  }

  const gridClasses = {
    small: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4",
    large: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-background border-b">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              تشكيلة مميزة
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground bg-clip-text">
              {categoryTitle}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {categoryDescription}
            </p>
            <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
              <ShoppingBag className="w-4 h-4" />
              <span>{products.length} منتج متوفر</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Controls */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  <span>ترتيب حسب: {sortOptions.find(o => o.value === sortBy)?.label}</span>
                  <ChevronDown className="w-4 h-4 mr-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={cn(
                      "cursor-pointer",
                      sortBy === option.value && "bg-primary/10 text-primary"
                    )}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Toggle & Filter */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setGridView("large")}
                className={cn(
                  "transition-colors",
                  gridView === "large" && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setGridView("small")}
                className={cn(
                  "transition-colors",
                  gridView === "small" && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-border mx-2" />
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">فلترة</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className={cn("grid", gridClasses[gridView])}>
          {sortedProducts.map((product, index) => (
            <Link 
              key={product.id} 
              href={`/product/${product.id}`} 
              className="group animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
            >
              <Card className={cn(
                "overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-500",
                "bg-card/50 backdrop-blur-sm",
                "hover:-translate-y-2 hover:border-primary/20"
              )}>
                <CardContent className="p-0">
                  {/* Image Container */}
                  <div className={cn(
                    "relative bg-gradient-to-br from-muted to-muted/50 overflow-hidden",
                    gridView === "large" ? "aspect-[3/4]" : "aspect-square"
                  )}>
                    <Image
                      src={product.colors[0].images[0] || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Favorite Button */}
                    <button
                      onClick={(e) => toggleFavorite(product.id, e)}
                      className={cn(
                        "absolute top-3 right-3 p-2.5 rounded-full transition-all duration-300",
                        "bg-white/90 backdrop-blur-sm shadow-lg",
                        "hover:scale-110 active:scale-95",
                        favorites.has(product.id) 
                          ? "text-red-500" 
                          : "text-gray-400 hover:text-red-500"
                      )}
                    >
                      <Heart 
                        className={cn(
                          "w-5 h-5 transition-all",
                          favorites.has(product.id) && "fill-current"
                        )} 
                      />
                    </button>

                    {/* Quick Add Button - Shows on Hover */}
                    <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <Button 
                        className="w-full bg-white/95 text-foreground hover:bg-white shadow-lg backdrop-blur-sm"
                        size={gridView === "small" ? "sm" : "default"}
                      >
                        <ShoppingBag className="w-4 h-4 ml-2" />
                        أضف للسلة
                      </Button>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.customSizesAvailable && (
                        <Badge className="bg-primary text-primary-foreground shadow-lg">
                          <Sparkles className="w-3 h-3 ml-1" />
                          مقاسات خاصة
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className={cn(
                    "bg-card",
                    gridView === "large" ? "p-5" : "p-3"
                  )}>
                    <h4 className={cn(
                      "font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors",
                      gridView === "large" ? "text-lg mb-2" : "text-sm mb-1.5"
                    )}>
                      {product.name}
                    </h4>
                    
                    {/* Rating */}
                    <div className={cn(
                      "flex items-center gap-1.5",
                      gridView === "large" ? "mb-3" : "mb-2"
                    )}>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              gridView === "large" ? "h-4 w-4" : "h-3 w-3",
                              i < Math.floor(product.rating)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-muted text-muted"
                            )}
                          />
                        ))}
                      </div>
                      <span className={cn(
                        "text-muted-foreground",
                        gridView === "large" ? "text-sm" : "text-xs"
                      )}>
                        ({product.reviews})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <p className={cn(
                        "font-bold text-primary",
                        gridView === "large" ? "text-xl" : "text-base"
                      )}>
                        {product.price.toLocaleString('ar-EG')} ج.م
                      </p>
                      {/* Color Options Preview */}
                      {product.colors.length > 1 && (
                        <div className="flex items-center gap-1">
                          {product.colors.slice(0, 3).map((color, idx) => (
                            <div
                              key={idx}
                              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: color.hex || '#ccc' }}
                            />
                          ))}
                          {product.colors.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{product.colors.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {sortedProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">لا توجد منتجات</h3>
            <p className="text-muted-foreground">لم نتمكن من العثور على منتجات في هذه الفئة</p>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  )
}

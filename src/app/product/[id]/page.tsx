"use client"

import { CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Star,
  Heart,
  ShoppingBag,
  Check,
  Shield,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  User,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Input } from "@/components/ui/input"

interface ProductImage {
  id: string
  image_url: string
  alt_text_ar: string
  display_order: number
}
interface ProductVariant {
  id: string
  name_ar: string
  color: string
  color_hex: string
  size: string
  price: number
  inventory_quantity: number
}

interface Product {
  id: string
  name_ar: string
  name_en: string
  description_ar: string
  base_price: number
  category: {
    name_ar: string
  }
  product_images: ProductImage[]
  product_variants: ProductVariant[]
  category_id: string
  store_id?: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [, setRelatedProducts] = useState<Product[]>([])
  const [aiRecommendations, setAiRecommendations] = useState<Product[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [loading, setLoading] = useState(true)
  const addItem = useCartStore((state) => state.addItem)

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const [userRating, setUserRating] = useState(0)
  const [userReview, setUserReview] = useState("")
  const [reviewerName, setReviewerName] = useState("")
  const [reviewerEmail, setReviewerEmail] = useState("")
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewsList, setReviewsList] = useState<Array<{ id: string; customer_name?: string; review_text?: string; rating: number; created_at?: string }>>([])

  useEffect(() => {
    async function fetchProduct() {
      try {
        console.log('[Product Debug] Fetching product:', params.id)

        // Fetch product with category (this relationship works)
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("*, category:categories(name_ar, name_en)")
          .eq("id", params.id)
          .eq("is_active", true)
          .single()

        if (productError) {
          console.error('[Product Debug] Error:', productError)
          console.error("[v0] ❌ Error fetching product:", productError)
          setProduct(null)
          return
        }

        // Fetch images and variants separately (workaround for partitioned tables)
        const [imagesResult, variantsResult] = await Promise.all([
          supabase
            .from("product_images")
            .select("id, image_url, alt_text_ar, display_order")
            .eq("product_id", params.id)
            .order("display_order", { ascending: true }),
          supabase
            .from("product_variants")
            .select("id, name_ar, color, color_hex, size, price, inventory_quantity")
            .eq("product_id", params.id)
        ])

        // Combine the data
        const data = {
          ...productData,
          product_images: imagesResult.data || [],
          product_variants: variantsResult.data || []
        }

        console.log('[Product Debug] Query result:', { data })
        console.log('[Product Debug] product_variants:', data.product_variants)
        console.log('[Product Debug] product_images:', data.product_images)

        setProduct(data)

        // Fetch related products
        if (productData.category_id) {
          const { data: relatedProducts } = await supabase
            .from("products")
            .select("*")
            .eq("category_id", productData.category_id)
            .eq("is_active", true)
            .neq("id", params.id)
            .limit(3)

          if (relatedProducts && relatedProducts.length > 0) {
            // Fetch images for related products
            const relatedIds = relatedProducts.map(p => p.id)
            const { data: relatedImages } = await supabase
              .from("product_images")
              .select("product_id, image_url, display_order")
              .in("product_id", relatedIds)
              .order("display_order", { ascending: true })

            // Attach images to related products
            const relatedWithImages = relatedProducts.map(p => ({
              ...p,
              product_images: (relatedImages || []).filter(img => img.product_id === p.id)
            }))

            setRelatedProducts(relatedWithImages)
          }
        }
      } catch (err) {
        console.error("[v0] ❌ Error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  useEffect(() => {
    async function fetchReviews() {
      if (!product) return

      try {
        const { data, error } = await supabase
          .from('product_reviews')
          .select('id, customer_name, review_text, rating, created_at, is_approved')
          .eq('product_id', product.id)
          .eq('is_approved', true)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching product reviews:', error)
          setReviewsList([])
          return
        }

        setReviewsList((data || []) as any)
      } catch (err) {
        console.error('Unexpected error fetching reviews:', err)
        setReviewsList([])
      }
    }

    fetchReviews()
  }, [product])

  useEffect(() => {
    async function fetchAIRecommendations() {
      if (!product) return

      try {
        setLoadingRecommendations(true)
        const response = await fetch(`/api/products/${product.id}/recommendations`)

        if (!response.ok) {
          console.error('Failed to fetch AI recommendations')
          return
        }

        const data = await response.json()
        setAiRecommendations(data.items || [])
      } catch (err) {
        console.error('Error fetching AI recommendations:', err)
      } finally {
        setLoadingRecommendations(false)
      }
    }

    fetchAIRecommendations()
  }, [product])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-primary/5">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary relative" />
          </div>
          <p className="text-muted-foreground text-lg">جاري تحميل المنتج...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-red-50/30">
        <Card className="text-center p-12 border-0 shadow-2xl rounded-3xl bg-white/80 backdrop-blur-sm max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">المنتج غير موجود</h2>
          <p className="text-muted-foreground mb-6">عذراً، لم نتمكن من العثور على هذا المنتج</p>
          <Button asChild className="bg-primary hover:bg-primary/90 rounded-xl px-8">
            <Link href="/">العودة للرئيسية</Link>
          </Button>
        </Card>
      </div>
    )
  }

  // Ensure product has variants before proceeding
  if (!product.product_variants || product.product_variants.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-orange-50/30">
        <Card className="text-center p-12 border-0 shadow-2xl rounded-3xl bg-white/80 backdrop-blur-sm max-w-md">
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6">
            <RefreshCw className="h-10 w-10 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">لا توجد متغيرات متاحة</h2>
          <p className="text-muted-foreground mb-6">هذا المنتج غير متوفر حالياً</p>
          <Button asChild className="bg-primary hover:bg-primary/90 rounded-xl px-8">
            <Link href="/">العودة للرئيسية</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const selectedVariant = product.product_variants[selectedVariantIndex]
  const sortedImages = [...(product.product_images || [])].sort((a, b) => a.display_order - b.display_order)
  const uniqueColors = Array.from(new Map(product.product_variants.map((v) => [v.color_hex, v])).values())
  const uniqueSizes = Array.from(new Set(product.product_variants.map((v) => v.size)))

  const getFirstImage = (prod: Product) => {
    const sorted = [...(prod.product_images || [])].sort((a, b) => a.display_order - b.display_order)
    return sorted[0]?.image_url || "/placeholder.svg"
  }

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      alert("الرجاء اختيار المقاس واللون")
      return
    }

    setIsAdding(true)
    try {
      addItem(
        {
          id: product!.id,
          name: product!.name_ar,
          price: selectedVariant.price,
          image: sortedImages[0]?.image_url || "/placeholder.svg",
        },
        {
          name: selectedVariant.color,
          hex: selectedVariant.color_hex,
        },
        selectedVariant.size,
        quantity,
        selectedVariant.id
      )

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error("Error adding to cart:", error)
      alert("حدث خطأ أثناء إضافة المنتج إلى السلة")
    } finally {
      setIsAdding(false)
    }
  }

  const handleColorChange = (colorHex: string) => {
    const variantIndex = product.product_variants.findIndex((v) => v.color_hex === colorHex)
    if (variantIndex !== -1) {
      setSelectedVariantIndex(variantIndex)
      setSelectedImageIndex(0)
    }
  }

  const handleSizeChange = (size: string) => {
    const variantIndex = product.product_variants.findIndex(
      (v) => v.size === size && v.color_hex === selectedVariant.color_hex
    )
    if (variantIndex !== -1) {
      setSelectedVariantIndex(variantIndex)
    }
  }

  const handleSubmitReview = async () => {
    if (userRating === 0) {
      alert("الرجاء اختيار تقييم")
      return
    }
    if (!reviewerName.trim()) {
      alert("الرجاء كتابة اسمك")
      return
    }
    if (!userReview.trim()) {
      alert("الرجاء كتابة تعليق")
      return
    }

    setIsSubmittingReview(true)

    try {
      const { error } = await supabase.from("product_reviews").insert([
        {
          product_id: product!.id,
          store_id: product!.store_id,
          rating: userRating,
          review_text: userReview,
          customer_name: reviewerName,
          customer_email: reviewerEmail,
          // reviews are moderated via `is_approved` in the DB; leave unset (null) or false
        },
      ])

      if (error) {
        throw error
      }

      setShowReviewForm(false)
      setUserRating(0)
      setUserReview("")
      setReviewerName("")
      setReviewerEmail("")
      alert("شكراً لتقييمك! سيتم نشره بعد المراجعة.")
    } catch (error) {
      console.error("Error submitting review:", error)
      alert("عفواً، حدث خطأ أثناء إرسال التقييم. الرجاء المحاولة مرة أخرى.")
    } finally {
      setIsSubmittingReview(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {showSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-top">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 shadow-2xl rounded-2xl">
            <div className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="font-bold text-green-900 text-lg">تم إضافة المنتج إلى السلة!</p>
                <Button asChild variant="link" size="sm" className="text-green-700 hover:text-green-900 p-0 h-auto font-medium">
                  <Link href="/cart">عرض السلة ←</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <SiteHeader />

      <div className="container mx-auto px-4 py-6">
        <Button asChild variant="ghost" size="sm" className="hover:bg-primary/10 -mr-4 rounded-xl group">
          <Link href="/" className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            <span>العودة للرئيسية</span>
          </Link>
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Product Images */}
          <div className="space-y-6">
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 border border-border/50 shadow-2xl group">
              <Image
                src={sortedImages[selectedImageIndex]?.image_url || "/placeholder.svg"}
                alt={sortedImages[selectedImageIndex]?.alt_text_ar || product.name_ar}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {/* Favorite Button on Image */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`absolute top-4 left-4 h-12 w-12 rounded-full backdrop-blur-md transition-all duration-300 ${
                  isFavorite 
                    ? "text-red-500 border-red-500 bg-red-50/90 shadow-lg" 
                    : "border-white/50 bg-white/80 hover:bg-white hover:shadow-lg"
                }`}
              >
                <Heart className={`h-6 w-6 ${isFavorite ? "fill-red-500" : ""}`} />
              </Button>
            </div>

            {sortedImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {sortedImages.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted transition-all duration-300 ${
                      selectedImageIndex === index 
                        ? "ring-4 ring-primary ring-offset-2 scale-95 shadow-xl" 
                        : "border border-border/50 hover:ring-2 hover:ring-primary/50 hover:shadow-lg"
                    }`}
                  >
                    <Image
                      src={image.image_url || "/placeholder.svg"}
                      alt={image.alt_text_ar || `صورة ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 25vw, 12vw"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-8">
            <div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  {product.category && (
                    <Badge variant="secondary" className="mb-3 rounded-full px-4 py-1 bg-primary/10 text-primary border-0">
                      {product.category.name_ar}
                    </Badge>
                  )}
                  <h1 className="text-4xl font-bold mb-4 text-foreground leading-tight">{product.name_ar}</h1>
                </div>
              </div>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{product.description_ar}</p>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold text-primary">{selectedVariant.price}</span>
                <span className="text-2xl text-muted-foreground">ج.م</span>
              </div>
            </div>

            <Separator className="bg-border/50" />

            {uniqueColors.length > 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  اللون: 
                  <span className="text-primary font-medium">{selectedVariant.color}</span>
                </h3>
                <div className="flex items-center gap-4 flex-wrap">
                  {uniqueColors.map((variant) => (
                    <button
                      key={variant.color_hex}
                      onClick={() => handleColorChange(variant.color_hex)}
                      className={`relative w-14 h-14 rounded-2xl transition-all duration-300 ${
                        selectedVariant.color_hex === variant.color_hex
                          ? "scale-110 shadow-xl ring-4 ring-primary/50 ring-offset-2"
                          : "hover:scale-105 hover:shadow-lg border-2 border-border/50"
                      }`}
                      style={{ backgroundColor: variant.color_hex }}
                      title={variant.color}
                    >
                      {selectedVariant.color_hex === variant.color_hex && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/20">
                          <Check className="h-6 w-6 text-white drop-shadow-lg" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {uniqueSizes.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">المقاس</h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {uniqueSizes.map((size) => {
                    const variant = product.product_variants.find(
                      (v) => v.size === size && v.color_hex === selectedVariant.color_hex
                    )
                    const isAvailable = variant && variant.inventory_quantity > 0
                    const stock = variant ? variant.inventory_quantity : 0

                    return (
                      <button
                        key={size}
                        onClick={() => isAvailable && handleSizeChange(size)}
                        disabled={!isAvailable}
                        className={`py-4 px-4 rounded-2xl font-medium transition-all duration-300 ${
                          selectedVariant.size === size
                            ? "bg-primary text-primary-foreground shadow-xl scale-105 ring-4 ring-primary/30"
                            : isAvailable
                              ? "bg-muted hover:bg-primary/10 hover:shadow-lg border border-border/50"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-lg">{size}</span>
                          {isAvailable ? (
                            <span className="text-[10px] opacity-70">المتاح: {stock}</span>
                          ) : (
                            <span className="text-[10px] text-red-400">نفذ</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <Separator className="bg-border/50" />

            <div className="space-y-6">
              <Button
                onClick={handleAddToCart}
                size="lg"
                disabled={isAdding || selectedVariant.inventory_quantity === 0}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xl py-7 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
              >
                <ShoppingBag className="h-6 w-6 ml-3" />
                {selectedVariant.inventory_quantity === 0
                  ? "غير متوفر"
                  : isAdding
                    ? "جاري الإضافة..."
                    : "إضافة إلى السلة"}
              </Button>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-5 text-center border-0 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <Shield className="h-8 w-8 mx-auto mb-3 text-green-600" />
                  <p className="text-sm font-medium text-green-700">ضمان الجودة</p>
                </Card>
                <Card className="p-5 text-center border-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <RefreshCw className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                  <p className="text-sm font-medium text-blue-700">إرجاع سهل</p>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations Section */}
        {aiRecommendations.length > 0 && (
          <div className="mt-20">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-4 py-1 rounded-full">
                مدعوم بالذكاء الاصطناعي ✨
              </Badge>
              <h2 className="text-4xl font-bold text-foreground mb-3">منتجات قد تعجبك</h2>
              <p className="text-muted-foreground text-lg">توصيات مخصصة لذوقك</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {aiRecommendations.map((recommendedProduct, index) => (
                <Link
                  key={recommendedProduct.id}
                  href={`/product/${recommendedProduct.id}`}
                  className="group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-3xl bg-white group-hover:-translate-y-2">
                    <CardContent className="p-0">
                      <div className="relative aspect-[3/4] bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                        <Image
                          src={getFirstImage(recommendedProduct)}
                          alt={recommendedProduct.name_ar}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="p-6 bg-white">
                        <h4 className="text-xl font-bold mb-3 text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                          {recommendedProduct.name_ar}
                        </h4>
                        {recommendedProduct.category && (
                          <Badge variant="secondary" className="mb-3 rounded-full px-3 py-1 bg-primary/10 text-primary border-0">
                            {(recommendedProduct.category as any).name_ar}
                          </Badge>
                        )}
                        <p className="text-2xl font-bold text-primary">{recommendedProduct.base_price} ج.م</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {loadingRecommendations && (
              <div className="text-center py-12">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary relative" />
                </div>
                <p className="text-muted-foreground mt-4">جاري تحميل التوصيات...</p>
              </div>
            )}
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-20">
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-3xl font-bold text-foreground mb-2">تقييمات العملاء</h3>
                  <p className="text-muted-foreground">شاركينا رأيك في المنتج</p>
                </div>
                <Button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className={`rounded-xl px-6 py-3 transition-all duration-300 ${
                    showReviewForm 
                      ? "bg-muted text-foreground hover:bg-muted/80" 
                      : "bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl"
                  }`}
                >
                  {showReviewForm ? "إلغاء" : "✨ أضيفي تقييمك"}
                </Button>
              </div>

              {showReviewForm && (
                <Card className="mb-8 bg-gradient-to-br from-primary/5 to-primary/10 border-0 rounded-2xl overflow-hidden">
                  <CardContent className="p-8">
                    <h4 className="font-bold text-xl mb-6 text-foreground">تقييمك للمنتج</h4>
                    <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium mb-3 text-foreground">اسمك</label>
                          <Input
                              value={reviewerName}
                              onChange={(e) => setReviewerName(e.target.value)}
                              placeholder="مثال: فاطمة أحمد"
                              className="border-0 bg-white shadow-sm focus:ring-2 focus:ring-primary rounded-xl h-12"
                          />
                        </div>
                         <div>
                          <label className="block text-sm font-medium mb-3 text-foreground">بريدك الإلكتروني (اختياري)</label>
                          <Input
                              value={reviewerEmail}
                              onChange={(e) => setReviewerEmail(e.target.value)}
                              placeholder="...بريدك الإلكتروني"
                              className="border-0 bg-white shadow-sm focus:ring-2 focus:ring-primary rounded-xl h-12"
                          />
                        </div>
                      <div>
                        <label className="block text-sm font-medium mb-3 text-foreground">التقييم</label>
                        <div className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => setUserRating(rating)}
                              className="transition-all duration-300 hover:scale-125"
                            >
                              <Star
                                className={`h-10 w-10 ${
                                  rating <= userRating
                                    ? "fill-yellow-400 text-yellow-400 drop-shadow-lg"
                                    : "fill-gray-200 text-gray-200"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-3 text-foreground">تعليقك</label>
                        <Textarea
                          value={userReview}
                          onChange={(e) => setUserReview(e.target.value)}
                          placeholder="شاركينا رأيك في المنتج..."
                          className="min-h-[140px] border-0 bg-white shadow-sm focus:ring-2 focus:ring-primary rounded-xl resize-none"
                        />
                      </div>
                      <Button
                        onClick={handleSubmitReview}
                        disabled={isSubmittingReview}
                        className="w-full bg-primary hover:bg-primary/90 rounded-xl py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isSubmittingReview ? "جاري الإرسال..." : "إرسال التقييم ✨"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-6">
                {reviewsList.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                      <Star className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-lg">لا توجد تقييمات بعد</p>
                    <p className="text-sm text-muted-foreground mt-2">كوني أول من يقيم هذا المنتج!</p>
                  </div>
                ) : (
                  reviewsList.map((r, index) => (
                    <Card 
                      key={r.id} 
                      className="border-0 bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="h-7 w-7 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-bold text-lg text-foreground">{r.customer_name || 'مستخدم'}</h5>
                              <span className="text-sm text-muted-foreground bg-white/50 px-3 py-1 rounded-full">
                                {r.created_at ? new Date(r.created_at).toLocaleDateString('ar-EG') : ''}
                              </span>
                            </div>
                            <div className="flex items-center mb-4">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`h-5 w-5 ${i < (r.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
                              ))}
                            </div>
                            <p className="text-muted-foreground leading-relaxed text-base">{r.review_text}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star  } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Product } from "@/lib/types"

interface CrossSellingProductsProps {
  currentProduct: Product
  allProducts: Product[]
}

export function CrossSellingProducts({ currentProduct, allProducts }: CrossSellingProductsProps) {
  // Get similar products from the same category, excluding the current product
  const similarProducts = allProducts
    .filter((p) => p.category === currentProduct.category && p.id !== currentProduct.id)
    .slice(0, 3)

  if (similarProducts.length === 0) {
    return null
  }

  return (
    <section className="mt-16">
      <div className="mb-8">
        <h3 className="text-3xl font-bold mb-2 text-foreground">منتجات قد تعجبك</h3>
        <p className="text-muted-foreground text-lg">منتجات مشابهة من نفس الفئة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {similarProducts.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group"
          >
            <Card className="overflow-hidden border-2 border-border hover:border-primary transition-all hover:shadow-xl">
              <CardContent className="p-0">
                <div className="relative aspect-[3/4] bg-muted">
                  <Image
                    src={product.colors[0].images[0] || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {product.featured && <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">مميز</Badge>}
                 
                </div>
                <div className="p-6 bg-background">
                  <h4 className="text-xl font-bold mb-2 text-foreground">{product.name}</h4>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(product.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-muted text-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">({product.reviews})</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{product.price} ج.م</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}

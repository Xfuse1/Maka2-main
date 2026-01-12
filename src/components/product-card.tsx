"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

type ProductCardProps = {
  id: string
  name: string
  price: number
  image: string
  currency?: string
}

export function ProductCard({
  id,
  name,
  price,
  image,
  currency = "ج.م"
}: ProductCardProps) {
  return (
    <Link href={`/product/${id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative aspect-square">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2 mb-2">{name}</h3>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <p className="text-xl font-bold text-primary">
            {price.toFixed(2)} {currency}
          </p>
        </CardFooter>
      </Card>
    </Link>
  )
}

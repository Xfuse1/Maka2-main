"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"
import Image from "next/image"

const reviews = [
  {
    id: 1,
    name: "فاطمة أح��د",
    rating: 5,
    comment: "منتجات رائعة وجودة عالية جداً. العباية التي اشتريتها أنيقة ومريحة. أنصح بالشراء من هذا المتجر!",
    date: "منذ أسبوع",
    image: "/diverse-woman-profile.png",
  },
  {
    id: 2,
    name: "مريم خالد",
    rating: 5,
    comment: "خدمة ممتازة وتوصيل سريع. الكارديجان الوردي أجمل من الصور! شكراً لكم",
    date: "منذ أسبوعين",
    image: "/woman-profile-picture-2.png",
  },
  {
    id: 3,
    name: "نورة محمد",
    rating: 5,
    comment: "أفضل متجر للأزياء النسائية! التصاميم عصرية والأسعار مناسبة. سأشتري مرة أخرى بالتأكيد",
    date: "منذ 3 أسابيع",
    image: "/woman-profile-picture-3.png",
  },
]

export function CustomerReviews() {
  return (
    <section className="py-20 bg-background/20">
      <div className="container mx-auto px-4">
        <h3 className="text-4xl font-bold text-center mb-4 text-foreground">آراء عملائنا</h3>
        <p className="text-center text-muted-foreground text-lg mb-16">ماذا يقول عملاؤنا عن تجربتهم معنا</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review) => (
            <Card key={review.id} className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted">
                    <Image
                      src={review.image || "/placeholder.svg"}
                      alt={review.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{review.name}</h4>
                    <p className="text-sm text-muted-foreground">{review.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>

                <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

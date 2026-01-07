
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name_ar: string;
  base_price: number;
  product_images: Array<{
    image_url: string;
    display_order: number;
  }> | null;
}

interface BestsellerSectionProps {
  product: Product | undefined;
}

const getFirstImage = (product: Product) => {
  const sortedImages = [...(product.product_images || [])].sort((a, b) => a.display_order - b.display_order);
  return sortedImages[0]?.image_url || "https://i.imgur.com/Q3m5N4y.png";
};

export function BestsellerSection({ product }: BestsellerSectionProps) {
  if (!product) {
    return null;
  }

  return (
    <section className="py-12 md:py-24 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="text-center p-8 md:p-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">الأكثر مبيعًا</h2>
            <p className="text-lg text-muted-foreground mb-6">نقدم لكم المنتج الأكثر طلبًا هذا الموسم</p>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6">
              <Link href={`/product/${product.id}`}>
                تسوق الآن
              </Link>
            </Button>
          </div>

          <motion.div
            className="relative h-[600px] w-full"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            whileHover={{
              rotateY: 180,
              transition: { duration: 0.8, ease: 'easeInOut' }
            }}
            style={{ perspective: 1000 }} // This enables the 3D effect
          >
            <Image
              src={getFirstImage(product)}
              alt={product.name_ar}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

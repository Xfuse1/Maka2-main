"use client"

import { useState, useMemo, useCallback, memo } from "react" // أزلت useRef و useEffect
import Image from "next/image"
import { type ProductWithDetails } from "@/lib/supabase/products"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProductSelectorProps {
  allProducts: ProductWithDetails[]
  selectedProductIds: string[]
  onSelectionChange: (newSelectedIds: string[]) => void
}

const ProductRow = memo(({ 
  product, 
  isSelected, 
  onToggle 
}: { 
  product: ProductWithDetails
  isSelected: boolean
  onToggle: (id: string) => void 
}) => {
  const handleToggle = useCallback(() => {
    onToggle(product.id)
  }, [onToggle, product.id])

  // ✅ **السر: ثبت الـ ID**
  const labelId = useMemo(() => `product-label-${product.id}`, [product.id])

  return (
    <div
      onClick={handleToggle}
      className="flex cursor-pointer items-center space-x-3 space-x-reverse rounded-md border-2 p-3 transition-colors hover:border-primary/50 data-[selected=true]:border-primary"
      data-selected={isSelected}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={handleToggle}
        aria-labelledby={labelId} // ✅ **مستقر**
      />
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
        {product.product_images?.[0]?.image_url ? (
          <Image
            src={product.product_images[0].image_url}
            alt={product.name_ar}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            لا توجد صورة
          </div>
        )}
      </div>
      <div className="flex-grow">
        <span id={labelId} className="font-medium"> {/* ✅ **نفس الـ ID المستقر** */}
          {product.name_ar}
        </span>
        <p className="text-xs text-muted-foreground">{product.category?.name_ar || "غير مصنف"}</p>
      </div>
    </div>
  )
})
ProductRow.displayName = "ProductRow"

export function ProductSelector({ allProducts, selectedProductIds, onSelectionChange }: ProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProducts = useMemo(() => allProducts.filter(
    (p) =>
      p.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toString().includes(searchQuery.toLowerCase()),
  ), [allProducts, searchQuery])

  const handleProductToggle = useCallback((productId: string) => {
    const isSelected = selectedProductIds.includes(productId)
    const newSelectedIds = isSelected
      ? selectedProductIds.filter((id) => id !== productId)
      : [...selectedProductIds, productId]
    onSelectionChange(newSelectedIds)
  }, [selectedProductIds, onSelectionChange])

  return (
    <div className="space-y-4 rounded-lg border-2 border-border p-4">
      <div>
        <Label htmlFor="product-search" className="text-base font-semibold">
          اختر المنتجات لعرضها في هذا القسم
        </Label>
        <p className="text-sm text-muted-foreground mb-3">
          يمكنك تحديد المنتجات التي ستظهر في هذا القسم. ({selectedProductIds.length} منتج محدد)
        </p>
        <Input
          id="product-search"
          placeholder="ابحث عن منتج بالاسم أو الرقم التعريفي..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="h-72 w-full overflow-y-auto rounded-md border p-2 pr-3">
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <ProductRow
              key={product.id}// ✅ **مفتاح مميز ومستقر**
              product={product}
              isSelected={selectedProductIds.includes(product.id)}
              onToggle={handleProductToggle}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
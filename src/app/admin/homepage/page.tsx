
"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Loader2, Eye, X } from "lucide-react"
// Use native selects here to avoid Radix portal/popper presence update cycles
import { useToast } from "@/hooks/use-toast"
import type { HomepageSection } from "../homepage-sections/actions"
import {
  getHomepageSectionsAction,
  createHomepageSectionAction,
  updateHomepageSectionAction,
  deleteHomepageSectionAction,
} from "./actions"
import { getAllProducts, type ProductWithDetails } from "@/lib/supabase/products"
import { ProductSelector } from "@/components/product-selector"

type SectionForm = Omit<HomepageSection, "id" | "created_at" | "updated_at">

export default function AdminHomepagePage() {
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [allProducts, setAllProducts] = useState<ProductWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<SectionForm>({
    section_type: "custom",
    name_ar: "",
    name_en: "",
    description: "",
    layout_type: "grid",
    background_color: "",
    show_title: true,
    show_description: true,
    product_ids: [],
    category_ids: [],
    custom_content: {},
    max_items: 8,
    display_order: 0,
    is_active: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [sectionsResult, productsResult] = await Promise.all([
        getHomepageSectionsAction(),
        getAllProducts(),
      ])
      if (sectionsResult.success && sectionsResult.data) {
        setSections(sectionsResult.data)
      } else {
        console.error('[v0] getHomepageSectionsAction failed', sectionsResult)
        toast({
          title: 'خطأ',
          description: sectionsResult?.error || 'فشل تحميل أقسام الصفحة الرئيسية',
          variant: 'destructive',
        })
        setSections([])
      }
      setAllProducts(productsResult?.data || [])
      if (!productsResult || !productsResult.data || productsResult.data.length === 0) {
        // Non-blocking warning if products failed to load or there are none
        toast({ title: 'تنبيه', description: 'فشل تحميل قائمة المنتجات أو لا توجد منتجات.', variant: 'destructive' })
      }
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      toast({
        title: "خطأ",
        description: "فشل تحميل البيانات",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = useCallback(() => {
    setFormData({
      section_type: "custom",
      name_ar: "",
      name_en: "",
      description: "",
      layout_type: "grid",
      background_color: "",
      show_title: true,
      show_description: true,
      product_ids: [],
      category_ids: [],
      custom_content: {},
      max_items: 8,
      display_order: 0,
      is_active: true,
    })
    setEditingSection(null)
  }, [])

  const handleEdit = (section: HomepageSection) => {
    setEditingSection(section)
    setFormData({
      section_type: section.section_type,
      name_ar: section.name_ar || "",
      name_en: section.name_en || "",
      description: section.description || "",
      layout_type: section.layout_type || "grid",
      background_color: section.background_color || "",
      show_title: section.show_title,
      show_description: section.show_description,
      product_ids: section.product_ids || [],
      category_ids: section.category_ids || [],
      custom_content: section.custom_content || {},
      max_items: section.max_items || 8,
      display_order: section.display_order,
      is_active: section.is_active,
    })
    setShowDialog(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)
      const sectionData = { ...formData }

      const result = editingSection
        ? await updateHomepageSectionAction(editingSection.id, sectionData)
        : await createHomepageSectionAction(sectionData)

      if (result.success) {
        toast({
          title: editingSection ? "تم التحديث" : "تم الإضافة",
          description: `تم ${editingSection ? "تحديث" : "إضافة"} القسم بنجاح`,
        })
        setShowDialog(false)
        resetForm()
        await loadData()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("[v0] Error saving section:", error)
      toast({ title: "خطأ", description: "فشل حفظ القسم", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${title}"؟`)) return

    try {
      const result = await deleteHomepageSectionAction(id)
      if (result.success) {
        toast({ title: "تم الحذف", description: "تم حذف القسم بنجاح" })
        await loadData()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("[v0] Error deleting section:", error)
      toast({ title: "خطأ", description: "فشل حذف القسم", variant: "destructive" })
    }
  }

  const handleProductSelectionChange = useCallback((newSelectedIds: string[]) => {
    setFormData((prev) => ({ ...prev, product_ids: newSelectedIds }))
  }, [])

  const handleDialogOpenChange = (open: boolean) => {
    setShowDialog(open)
    if (!open) {
      resetForm()
    }
  }

  const getSectionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      custom: "مخصص",
      best_sellers: "الأكثر مبيعاً",
      new_arrivals: "المنتجات الجديدة",
      featured: "المنتجات المميزة",
      categories: "التصنيفات",
      reviews: "آراء العملاء",
      hero: "بانر رئيسي",
      promotional: "قسم ترويجي",
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">إدارة الصفحة الرئيسية</h1>
          <p className="text-muted-foreground text-sm md:text-base">تحكم في محتوى وأقسام الصفحة الرئيسية</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild variant="outline" className="gap-2 bg-transparent w-full sm:w-auto">
            <a href="/" target="_blank" rel="noreferrer">
              <Eye className="h-4 w-4" />
              معاينة الموقع
            </a>
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90 gap-2"
            onClick={() => {
              resetForm()
              setShowDialog(true)
            }}
          >
            <Plus className="h-4 w-4" />
            إضافة قسم جديد
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {sections.map((section) => (
          <Card key={section.id} className="border-2 border-border hover:border-primary/50 transition-all">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                        <h3 className="text-xl font-bold text-foreground">{section.name_ar || "بدون عنوان"}</h3>
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          {getSectionTypeLabel(section.section_type)}
                        </Badge>
                        {!section.is_active && (
                          <Badge variant="outline" className="text-muted-foreground">
                            غير نشط
                          </Badge>
                        )}
                      </div>
                      {section.name_en && <p className="text-sm text-muted-foreground mb-2">{section.name_en}</p>}
                    </div>
                    <div className="text-sm text-muted-foreground">ترتيب: {section.display_order}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-muted-foreground">
                    {section.layout_type && <span>التخطيط: {section.layout_type}</span>}
                    {section.max_items && <span>عدد العناصر: {section.max_items}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 bg-transparent flex-1 sm:flex-none"
                      onClick={() => handleEdit(section)}
                    >
                      <Edit className="h-4 w-4" />
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent flex-1 sm:flex-none"
                      onClick={() => handleDelete(section.id, section.name_ar || "")}
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف
                    </Button>
                  </div>
                </div>
                <div className="w-full md:w-40 flex-shrink-0">
                  {(() => {
                    const content: any = section.custom_content || {}
                    const imageUrl = content?.image_url || content?.image || content?.src || (Array.isArray(content?.slides) && content.slides[0]?.image_url) || null
                    const subtitle = content?.subtitle_ar || content?.subtitle || section.name_en || null
                    if (imageUrl) {
                      return (
                        <div className="relative w-full md:w-40 h-40 md:h-24 rounded-md overflow-hidden bg-muted">
                          <img src={imageUrl} alt={section.name_ar || "preview"} className="w-full h-full object-cover" />
                        </div>
                      )
                    }
                    if (subtitle) {
                      return (
                        <div className="w-full md:w-40 h-24 rounded-md bg-muted p-3 flex items-center justify-center text-sm text-muted-foreground">
                          <div className="font-medium text-foreground mb-1">{subtitle}</div>
                        </div>
                      )
                    }
                    return <div className="w-full md:w-40 h-24 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">معاينة</div>
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sections.length === 0 && (
        <div className="text-center py-20">
          <h3 className="text-2xl font-bold mb-4 text-foreground">لا توجد أقسام</h3>
          <p className="text-muted-foreground mb-6">ابدأ بإضافة أقسام للصفحة الرئيسية</p>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => { resetForm(); setShowDialog(true); }}
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة قسم جديد
          </Button>
        </div>
      )}

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => handleDialogOpenChange(false)}>
          <div 
            className="bg-background rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background border-b px-4 md:px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">
                  {editingSection ? "تعديل القسم" : "إضافة قسم جديد"}
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  {editingSection ? `تعديل "${editingSection.name_ar}"` : "أضف قسم جديد للصفحة الرئيسية"}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDialogOpenChange(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 md:p-6">

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="section_type">نوع القسم</Label>
                <select
                  id="section_type"
                  value={formData.section_type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, section_type: e.target.value as any }))}
                  className="border-input rounded-md bg-transparent px-3 py-2 text-sm w-full"
                >
                  <option value="custom">مخصص (المنتجات المختارة)</option>
                  <option value="best_sellers">الأكثر مبيعاً</option>
                  <option value="new_arrivals">المنتجات الجديدة</option>
                  <option value="featured">المنتجات المميزة</option>
                  <option value="categories">التصنيفات</option>
                  <option value="reviews">آراء العملاء</option>
                  <option value="hero">بانر رئيسي</option>
                  <option value="promotional">قسم ترويجي</option>
                </select>
              </div>
              <div>
                <Label htmlFor="display_order">ترتيب العرض</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, display_order: Number(e.target.value) }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <input
                id="is_active"
                type="checkbox"
                checked={!!formData.is_active}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="h-5 w-10 rounded-full appearance-none bg-input checked:bg-primary relative align-middle cursor-pointer transition-colors"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                نشط
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name_ar">الاسم (عربي) *</Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name_ar: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name_en">الاسم (إنجليزي)</Label>
                <Input
                  id="name_en"
                  value={formData.name_en || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name_en: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">الوصف</Label>
              <textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             
              <div>
                <Label htmlFor="max_items">عدد العناصر</Label>
                <Input
                  id="max_items"
                  type="number"
                  value={formData.max_items || 8}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, max_items: Number(e.target.value) }))
                  }
                />
              </div>
             
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  id="show_title"
                  type="checkbox"
                  checked={!!formData.show_title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, show_title: e.target.checked }))}
                  className="h-5 w-10 rounded-full appearance-none bg-input checked:bg-primary relative align-middle cursor-pointer transition-colors"
                />
                <Label htmlFor="show_title" className="cursor-pointer">إظهار العنوان</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  id="show_description"
                  type="checkbox"
                  checked={!!formData.show_description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, show_description: e.target.checked }))}
                  className="h-5 w-10 rounded-full appearance-none bg-input checked:bg-primary relative align-middle cursor-pointer transition-colors"
                />
                <Label htmlFor="show_description" className="cursor-pointer">إظهار الوصف</Label>
              </div>
            </div>

            <ProductSelector
              allProducts={allProducts}
              selectedProductIds={formData.product_ids || []}
              onSelectionChange={handleProductSelectionChange}
            />

            <div className="flex flex-col-reverse sm:flex-row gap-4 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogOpenChange(false)}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                إلغاء
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 w-full sm:w-auto" disabled={saving}>
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin ml-2" /> جاري الحفظ...</>
                ) : (
                  "حفظ"
                )}
              </Button>
            </div>
          </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

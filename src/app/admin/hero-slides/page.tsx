
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Loader2, Eye, Upload, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import type { HeroSlide } from "@/lib/supabase/homepage"
import {
  getHeroSlidesAction,
  createHeroSlideAction,
  updateHeroSlideAction,
  deleteHeroSlideAction,
} from "./actions"
import { uploadHeroSlideImage } from "./upload-actions"
import { getPublishedPages, PageContent } from "@/lib/supabase/pages"

type SlideForm = Omit<HeroSlide, "id" | "created_at" | "updated_at">

export default function AdminHeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>("")
  const { toast } = useToast()

  const [formData, setFormData] = useState<SlideForm>({
    title_ar: "",
    title_en: "",
    subtitle_ar: "",
    subtitle_en: "",
    image_url: "",
    link_url: "",
    display_order: 0,
    is_active: true,
  })

  // Pages for link dropdown
  const [pages, setPages] = useState<Pick<PageContent, "id" | "page_path" | "page_title_ar">[]>([])
  const [pageQuery, setPageQuery] = useState("")
  const [showPageDropdown, setShowPageDropdown] = useState(false)

  useEffect(() => {
    loadSlides()
    loadPages()
  }, [])

  const loadPages = async () => {
    try {
      const p = await getPublishedPages()
      setPages(p || [])
    } catch (e) {
      console.warn("Failed to load pages for link dropdown", e)
    }
  }

  const loadSlides = async () => {
    try {
      setLoading(true)
      const result = await getHeroSlidesAction()
      if (result.success && result.data) {
        setSlides(result.data)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Error loading slides:", error)
      toast({
        title: "خطأ",
        description: "فشل تحميل شرائح العرض",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title_ar: "",
      title_en: "",
      subtitle_ar: "",
      subtitle_en: "",
      image_url: "",
      link_url: "",
      display_order: slides.length + 1,
      is_active: true,
    })
    setEditingSlide(null)
    setImagePreview("")
  }

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide)
    setFormData({
      title_ar: slide.title_ar || "",
      title_en: slide.title_en || "",
      subtitle_ar: slide.subtitle_ar || "",
      subtitle_en: slide.subtitle_en || "",
      image_url: slide.image_url || "",
      link_url: slide.link_url || "",
      display_order: slide.display_order,
      is_active: slide.is_active,
    })
    setImagePreview(slide.image_url || "")
    setShowDialog(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadHeroSlideImage(formData)

      if (result.success && result.url) {
        setFormData((prev) => ({ ...prev, image_url: result.url }))
        setImagePreview(result.url)
        toast({
          title: "تم الرفع",
          description: "تم رفع الصورة بنجاح",
        })
        // Reset file input
        const input = document.getElementById("image-upload") as HTMLInputElement
        if (input) input.value = ""
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("Error uploading image:", error)
      toast({
        title: "خطأ",
        description: error?.message || "فشل رفع الصورة",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image_url: "" }))
    setImagePreview("")
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    // validate display_order >= 1
    const dv = Number(formData.display_order || 0)
    if (dv < 1) {
      toast({ title: 'قيمة غير صالحة', description: 'يجب أن يكون ترتيب الشريحة 1 أو أكثر.', variant: 'destructive' })
      return
    }

    try {
      setSaving(true)

      const slideData = {
        ...formData,
      }

      let result
      if (editingSlide) {
        result = await updateHeroSlideAction(editingSlide.id, slideData)
        if (result.success) {
          toast({
            title: "تم التحديث",
            description: "تم تحديث الشريحة بنجاح",
          })
        }
      } else {
        result = await createHeroSlideAction(slideData)
        if (result.success) {
          toast({
            title: "تم الإضافة",
            description: "تم إضافة الشريحة بنجاح",
          })
        }
      }

      if (!result.success) {
        throw new Error(result.error)
      }

      setShowDialog(false)
      resetForm()
      await loadSlides()
    } catch (error) {
      console.error("Error saving slide:", error)
      toast({
        title: "خطأ",
        description: "فشل حفظ الشريحة",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteHeroSlideAction(id);
      if (result.success) {
        toast({
          title: "تم الحذف",
          description: "تم حذف الشريحة بنجاح",
        });
        await loadSlides();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error deleting slide:", error);
      toast({
        title: "خطأ",
        description: "فشل حذف الشريحة",
        variant: "destructive",
      });
    }
  };

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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">إدارة شرائح العرض</h1>
          <p className="text-muted-foreground text-sm md:text-base">تحكم في شرائح العرض في الصفحة الرئيسية</p>
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
            إضافة شريحة جديدة
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {slides.map((slide) => (
          <Card key={slide.id} className="border-2 border-border hover:border-primary/50 transition-all">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-32 h-48 md:h-32 bg-muted rounded-md overflow-hidden shrink-0">
                  <img src={slide.image_url || "/placeholder.svg"} alt={slide.title_ar} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                        <h3 className="text-xl font-bold text-foreground">{slide.title_ar || "بدون عنوان"}</h3>
                        {!slide.is_active && (
                          <Badge variant="outline" className="text-muted-foreground">
                            غير نشط
                          </Badge>
                        )}
                      </div>
                      {slide.title_en && <p className="text-sm text-muted-foreground mb-2">{slide.title_en}</p>}
                    </div>
                      <div className="text-sm text-muted-foreground">ترتيب: {Number(slide.display_order) > 0 ? slide.display_order : '-'}</div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    {slide.subtitle_ar}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 bg-transparent flex-1 sm:flex-none"
                      onClick={() => handleEdit(slide)}
                    >
                      <Edit className="h-4 w-4" />
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent flex-1 sm:flex-none"
                      onClick={() => {
                        const title = slide.title_ar || slide.title_en || "هذه الشريحة"
                        if (!confirm(`هل أنت متأكد من حذف "${title}"؟`)) return
                        handleDelete(slide.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {slides.length === 0 && (
        <div className="text-center py-20">
          <h3 className="text-2xl font-bold mb-4 text-foreground">لا توجد شرائح</h3>
          <p className="text-muted-foreground mb-6">ابدأ بإضافة شرائح عرض للصفحة الرئيسية</p>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => {
              resetForm()
              setShowDialog(true)
            }}
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة شريحة جديدة
          </Button>
        </div>
      )}

      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="max-w-3xl w-[95%] md:w-full max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold">
              {editingSlide ? "تعديل الشريحة" : "إضافة شريحة جديدة"}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              {editingSlide ? `تعديل "${editingSlide.title_ar}"` : "أضف شريحة جديدة للصفحة الرئيسية"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title_ar">العنوان (عربي)</Label>
                <Input
                  id="title_ar"
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="title_en">العنوان (إنجليزي)</Label>
                <Input
                  id="title_en"
                  value={formData.title_en || ""}
                  onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subtitle_ar">العنوان الفرعي (عربي)</Label>
                <Input
                  id="subtitle_ar"
                  value={formData.subtitle_ar || ""}
                  onChange={(e) => setFormData({ ...formData, subtitle_ar: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="subtitle_en">العنوان الفرعي (إنجليزي)</Label>
                <Input
                  id="subtitle_en"
                  value={formData.subtitle_en || ""}
                  onChange={(e) => setFormData({ ...formData, subtitle_en: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>صورة الشريحة</Label>
              <div className="mt-2 space-y-4">
                {/* Image upload button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => document.getElementById("image-upload")?.click()}
                    className="gap-2 w-full sm:w-auto"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        جاري الرفع...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        رفع صورة من الجهاز
                      </>
                    )}
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  {imagePreview && (
                    <span className="text-sm text-muted-foreground">صورة محملة</span>
                  )}
                </div>

                {/* Image preview */}
                {imagePreview && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted border-2 border-border">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Manual URL input (optional) */}
                <div>
                  <Label htmlFor="image_url" className="text-sm text-muted-foreground">
                    أو أدخل رابط الصورة يدوياً
                  </Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => {
                      setFormData({ ...formData, image_url: e.target.value })
                      setImagePreview(e.target.value)
                    }}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="relative">
              <Label htmlFor="link_url">رابط الانتقال</Label>
              <Input
                id="link_url"
                value={formData.link_url || ''}
                onChange={(e) => {
                  setFormData({ ...formData, link_url: e.target.value })
                  setPageQuery(e.target.value)
                  setShowPageDropdown(true)
                }}
                onFocus={() => setShowPageDropdown(true)}
                placeholder="ابحث في صفحات الموقع أو أدخل رابطاً مخصصاً (مثال: /products)"
                autoComplete="off"
              />

              {showPageDropdown && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-auto rounded-md border bg-white shadow">
                  <div className="p-2 border-b">
                    <input
                      type="text"
                      autoFocus={false}
                      className="w-full rounded-md border px-2 py-1"
                      placeholder="بحث في صفحات الموقع..."
                      value={pageQuery}
                      onChange={(e) => setPageQuery(e.target.value)}
                    />
                  </div>
                  <div>
                    {pages.filter(p => {
                      const q = (pageQuery || "").trim().toLowerCase()
                      if (!q) return true
                      return (p.page_path || "").toLowerCase().includes(q) || (p.page_title_ar || "").toLowerCase().includes(q)
                    }).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-center justify-between"
                        onClick={() => {
                          setFormData({ ...formData, link_url: p.page_path })
                          setPageQuery(p.page_path)
                          setShowPageDropdown(false)
                        }}
                      >
                        <div>
                          <div className="font-medium">{p.page_title_ar || p.page_path}</div>
                          <div className="text-xs text-muted-foreground">{p.page_path}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">اذهب</div>
                      </button>
                    ))}

                    {/* Allow creating/using the typed value as custom link */}
                    <div className="border-t p-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            // Use the typed value as custom link
                            const v = (pageQuery || "").trim()
                            if (!v) return
                            setFormData({ ...formData, link_url: v })
                            setShowPageDropdown(false)
                          }}
                        >
                          استخدم هذا الرابط
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setShowPageDropdown(false)
                          }}
                        >
                          إغلاق
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="display_order">ترتيب العرض</Label>
                <Input
                  id="display_order"
                  type="number"
                  min={1}
                  value={formData.display_order === 0 ? "" : String(formData.display_order)}
                  onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value || 0) })}
                />
              </div>
              <div className="flex items-center space-x-2 space-x-reverse pt-6">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  نشط
                </Label>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-4 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDialog(false)
                  resetForm()
                }}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                إلغاء
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 w-full sm:w-auto" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جاري الحفظ...
                  </>
                ) : (
                  "حفظ"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Trash2, Edit, Plus, Loader2 } from "lucide-react"
import { getAllCategories } from "@/lib/supabase/products"

type Category = {
  id: string
  name_ar: string
  name_en: string
  image_url?: string
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategory, setNewCategory] = useState({ name_ar: "", name_en: "", image: null as File | null })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ name_ar: string; name_en: string; image: File | null }>({ name_ar: "", name_en: "", image: null })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const data = await getAllCategories()
      setCategories(data)
    } catch {
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      let image_url = ""
      if (newCategory.image) {
        const formData = new FormData()
        formData.append("file", newCategory.image)
        const res = await fetch("/api/admin/categories/upload", { method: "POST", body: formData })
        const data = await res.json()
        if (!res.ok) {
          alert(data.error || "فشل رفع الصورة")
          setSaving(false)
          return
        }
        image_url = data.url
      }
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name_ar: newCategory.name_ar, name_en: newCategory.name_en, image_url }),
      })
      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "فشل إضافة الفئة")
        setSaving(false)
        return
      }
      setNewCategory({ name_ar: "", name_en: "", image: null })
      await loadCategories()
    } catch (error: any) {
      alert(error?.message || "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف الفئة؟")) return
    setSaving(true)
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" })
    await loadCategories()
    setSaving(false)
  }

  const handleEditCategory = (cat: Category) => {
    setEditingId(cat.id)
    setEditData({ name_ar: cat.name_ar, name_en: cat.name_en, image: null })
  }

  const handleSaveEdit = async (id: string) => {
    setSaving(true)
    try {
      let image_url = categories.find(c => c.id === id)?.image_url || ""
      if (editData.image) {
        const formData = new FormData()
        formData.append("file", editData.image)
        const res = await fetch("/api/admin/categories/upload", { method: "POST", body: formData })
        const data = await res.json()
        if (!res.ok) {
          alert(data.error || "فشل رفع الصورة")
          setSaving(false)
          return
        }
        image_url = data.url
      }
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name_ar: editData.name_ar, name_en: editData.name_en, image_url }),
      })
      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "فشل تحديث الفئة")
        setSaving(false)
        return
      }
      setEditingId(null)
      setEditData({ name_ar: "", name_en: "", image: null })
      await loadCategories()
    } catch (error: any) {
      alert(error?.message || "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">إدارة الفئات</h1>
      <form onSubmit={handleAddCategory} className="flex flex-col md:flex-row gap-4 mb-8 md:items-end">
        <div className="w-full">
          <Input
            placeholder="اسم الفئة (عربي)"
            value={newCategory.name_ar}
            onChange={e => setNewCategory({ ...newCategory, name_ar: e.target.value })}
            required
          />
        </div>
        <div className="w-full">
          <Input
            placeholder="اسم الفئة (إنجليزي)"
            value={newCategory.name_en}
            onChange={e => setNewCategory({ ...newCategory, name_en: e.target.value })}
          />
        </div>
        <div className="w-full">
          <Input
            type="file"
            accept="image/*"
            onChange={e => {
              const f = e.target.files?.[0] || null
              const MAX = 10 * 1024 * 1024 // 10 MB
              if (f && f.size > MAX) {
                alert('حجم الملف كبير جداً. الحد الأقصى المسموح به هو 10 ميغابايت.')
                e.currentTarget.value = ''
                setNewCategory({ ...newCategory, image: null })
                return
              }
              setNewCategory({ ...newCategory, image: f })
            }}
          />
        </div>
        <Button type="submit" disabled={saving} className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          إضافة فئة
        </Button>
      </form>
      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      ) : (
        <div className="grid gap-4">
          {categories.map(cat => (
            <Card key={cat.id} className="border-2 border-border">
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
                  {cat.image_url && (
                    <img src={cat.image_url} alt={cat.name_ar} className="w-16 h-16 rounded object-cover border self-start sm:self-center" />
                  )}
                  {editingId === cat.id ? (
                    <div className="flex flex-col gap-2 w-full">
                      <Input
                        value={editData.name_ar}
                        onChange={e => setEditData({ ...editData, name_ar: e.target.value })}
                        placeholder="اسم الفئة (عربي)"
                        required
                      />
                      <Input
                        value={editData.name_en}
                        onChange={e => setEditData({ ...editData, name_en: e.target.value })}
                        placeholder="اسم الفئة (إنجليزي)"
                      />
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const f = e.target.files?.[0] || null
                          const MAX = 10 * 1024 * 1024 // 10 MB
                          if (f && f.size > MAX) {
                            alert('حجم الملف كبير جداً. الحد الأقصى المسموح به هو 10 ميغابايت.')
                            e.currentTarget.value = ''
                            setEditData({ ...editData, image: null })
                            return
                          }
                          setEditData({ ...editData, image: f })
                        }}
                      />
                      <div className="flex gap-2">
                        <Button type="button" onClick={() => handleSaveEdit(cat.id)} disabled={saving}>
                          حفظ
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setEditingId(null)} disabled={saving}>
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold text-lg">{cat.name_ar}</div>
                      <div className="text-muted-foreground text-sm">{cat.name_en}</div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 self-end sm:self-center">
                  {editingId !== cat.id && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditCategory(cat)}
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteCategory(cat.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

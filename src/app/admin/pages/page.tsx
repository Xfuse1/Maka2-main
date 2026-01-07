
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Trash2, Edit, ExternalLink, Eye, EyeOff, RefreshCcw, Loader2, Upload, X } from "lucide-react"
import Link from "next/link"
import { updatePage, deletePage, type PageContent } from "@/lib/supabase/pages"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { uploadPageContentImage } from "./upload-actions"
import { useToast } from "@/hooks/use-toast"

type ContactInfoConfig = {
  phone: string;
  whatsapp: string;
  whatsappSubtitle?: string;
  email: string;
  address: string;
  workingHours: string;
};

const DEFAULT_CONTACT_INFO: ContactInfoConfig = {
  phone: "01234567890",
  whatsapp: "01234567890",
  whatsappSubtitle: "تواصل عبر واتساب",
  email: "info@mecca-fashion.com",
  address: "القاهرة، مصر",
  workingHours: "السبت - الخميس: 9:00 ص - 9:00 م\nالجمعة: 2:00 م - 9:00 م"
};

// Main component for the admin pages management
export default function AdminPagesPage() {
  const [pages, setPages] = useState<PageContent[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PageContent | null>(null)

  useEffect(() => {
    loadPages()
  }, [])

  async function loadPages() {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/pages")
      if (!response.ok) throw new Error("Failed to fetch pages")
      const data = await response.json()
      setPages(data)
    } catch (error) {
      console.error("[v0] Error loading pages:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeletePage(id: string, title: string) {
    if (!confirm(`هل أنت متأكد من حذف صفحة "${title}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) return

    try {
      await deletePage(id)
      loadPages()
    } catch (error) {
      console.error("[v0] Error deleting page:", error)
      alert("حدث خطأ أثناء حذف الصفحة")
    }
  }

  async function togglePublished(page: PageContent) {
    try {
      await updatePage(page.id, { is_published: !page.is_published })
      loadPages()
    } catch (error) {
      console.error("[v0] Error toggling published:", error)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">جاري تحميل بيانات الصفحات...</div>
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">إدارة الصفحات</h1>
        <p className="text-muted-foreground text-sm md:text-base">إجمالي الصفحات: {pages.length}</p>
      </div>

      <div className="grid gap-4">
        {pages.map((pg) => (
          <Card key={pg.id} className="border-2 border-border">
            <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1 w-full">
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold">{pg.page_title_ar}</div>
                  {pg.is_published ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">منشور</span>
                  ) : (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">مسودة</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  <span>{pg.page_path}</span>
                  {pg.is_published && (
                    <Link
                      href={pg.page_path}
                      target="_blank"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      عرض الصفحة
                    </Link>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {Object.keys(pg.sections || {}).length} قسم محتوى
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center w-full md:w-auto justify-between md:justify-end">
                <div className="flex items-center gap-2 px-0 md:px-3">
                  <button
                    type="button"
                    onClick={() => togglePublished(pg)}
                    className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border transition
                      ${pg.is_published
                        ? "bg-green-50 border-green-300 text-green-700"
                        : "bg-slate-50 border-slate-300 text-slate-500"
                      }`}
                  >
                    <span
                      className={`relative inline-flex h-4 w-8 items-center rounded-full transition
                        ${pg.is_published ? "bg-green-500" : "bg-slate-300"}`}
                    >
                      <span
                        className={`h-3 w-3 rounded-full bg-white shadow transition-transform
                          ${pg.is_published ? "translate-x-3" : "-translate-x-3"}`}
                      />
                    </span>

                    {pg.is_published ? (
                      <>
                        <Eye className="h-3 w-3" />
                        <span>ظاهر</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" />
                        <span>مخفي</span>
                      </>
                    )}
                  </button>
                </div>
                <Button
                  variant="outline"
                  className="gap-2 bg-transparent"
                  onClick={() => {
                    setEditing(pg)
                    setOpen(true)
                  }}
                >
                  <Edit className="h-4 w-4" /> تعديل المحتوى
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent"
                  onClick={() => handleDeletePage(pg.id, pg.page_title_ar)}
                >
                  <Trash2 className="h-4 w-4" /> حذف
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {pages.length === 0 && (
          <Card className="border-2 border-dashed border-border">
            <CardContent className="p-8 text-center text-muted-foreground">
              لا توجد صفحات حالياً.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl w-[95%] md:w-full max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold">تعديل: {editing?.page_title_ar}</DialogTitle>
          </DialogHeader>
          {editing && <PageEditor page={editing} onSave={() => { setOpen(false); loadPages(); }} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

const ABOUT_PAGE_KEYS = [
  "hero.title", "hero.subtitle", "story.title", "story.paragraph1",
  "story.paragraph2", "story.image_url", "values.title", "values.passion.title",
  "values.passion.description", "values.quality.title", "values.quality.description",
  "values.customers.title", "values.customers.description", "values.innovation.title",
  "values.innovation.description", "team.title", "team.paragraph1", "team.paragraph2",
  "team.image_url", "team.image_title", "team.image_subtitle", "cta.title",
  "cta.subtitle", "cta.button"
];

function PageEditor({ page, onSave }: { page: PageContent; onSave: () => void }) {
  const { toast } = useToast()
  const [titleAr, setTitleAr] = useState(page.page_title_ar)
  const [titleEn, setTitleEn] = useState(page.page_title_en)
  const [path, setPath] = useState(page.page_path)
  const [metaTitleAr, setMetaTitleAr] = useState(page.meta_title_ar || "")
  const [metaTitleEn, setMetaTitleEn] = useState(page.meta_title_en || "")
  const [metaDescAr, setMetaDescAr] = useState(page.meta_description_ar || "")
  const [metaDescEn, setMetaDescEn] = useState(page.meta_description_en || "")
  const [urlImage, setUrlImage] = useState(page.url_image || "")
  const [sections, setSections] = useState<Record<string, any>>(page.sections || {})
  const [sectionsImages, setSectionsImages] = useState<Record<string, string>>(page.sections_images || {})
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [uploadingMainImage, setUploadingMainImage] = useState(false)
  const [contactErrors, setContactErrors] = useState<Partial<Record<keyof ContactInfoConfig, string>>>({})

  // Contact Info State
  const [contactInfo, setContactInfo] = useState<ContactInfoConfig>(() => {
    if (page.page_path === '/contact' && sections['contact_info']) {
      try {
        const stored = typeof sections['contact_info'] === 'string' 
          ? JSON.parse(sections['contact_info']) 
          : sections['contact_info'];
        // Ensure we handle the case where stored might be [object Object] string literal if previously saved incorrectly
        if (stored === '[object Object]') return DEFAULT_CONTACT_INFO;
        return { ...DEFAULT_CONTACT_INFO, ...stored };
      } catch (e) {
        return DEFAULT_CONTACT_INFO;
      }
    }
    return DEFAULT_CONTACT_INFO;
  });

  const availableKeys = page.page_path === '/about/' ? ABOUT_PAGE_KEYS.filter(k => !(k in sections)) : []

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingMainImage(true)

      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadPageContentImage(formData)

      if (result.success && result.url) {
        setUrlImage(result.url)
        toast({
          title: "تم الرفع",
          description: "تم رفع الصورة الرئيسية بنجاح",
        })
        e.target.value = ""
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("Error uploading main image:", error)
      toast({
        title: "خطأ",
        description: error?.message || "فشل رفع الصورة",
        variant: "destructive",
      })
    } finally {
      setUploadingMainImage(false)
    }
  }

  const handleImageUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingKey(key)

      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadPageContentImage(formData)

      if (result.success && result.url) {
        // store section image separately (do not overwrite the textual content)
        setSectionsImages(prev => ({ ...prev, [key]: result.url }))
        toast({
          title: "تم الرفع",
          description: "تم رفع الصورة بنجاح",
        })
        e.target.value = ""
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
      setUploadingKey(null)
    }
  }

  async function handleSave() {
    setIsSaving(true)
    setContactErrors({});

    // Validation for Contact Page
    if (page.page_path === '/contact') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^(01[0-2,5][0-9]{8}|\+201[0-2,5][0-9]{8})$/;
      const errors: Partial<Record<keyof ContactInfoConfig, string>> = {};
      let hasError = false;

      const cleanPhone = contactInfo.phone.replace(/\s+/g, "");
      if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
        errors.phone = "رقم الهاتف غير صحيح (يجب أن يكون رقم مصري)";
        hasError = true;
      }
      
      const cleanWhatsapp = contactInfo.whatsapp.replace(/\s+/g, "");
      if (!cleanWhatsapp || !phoneRegex.test(cleanWhatsapp)) {
        errors.whatsapp = "رقم واتساب غير صحيح (يجب أن يكون رقم مصري)";
        hasError = true;
      }

      if (!contactInfo.email || !emailRegex.test(contactInfo.email)) {
        errors.email = "البريد الإلكتروني غير صحيح";
        hasError = true;
      }
      if (!contactInfo.address) {
        errors.address = "العنوان مطلوب";
        hasError = true;
      }
      if (!contactInfo.workingHours) {
        errors.workingHours = "ساعات العمل مطلوبة";
        hasError = true;
      }

      if (hasError) {
        setContactErrors(errors);
        toast({ title: "خطأ", description: "يرجى تصحيح الأخطاء في النموذج", variant: "destructive" });
        setIsSaving(false);
        return;
      }
    }

    try {
      const updatedSections = { ...sections };
      if (page.page_path === '/contact') {
        // Store as object directly, not stringified JSON
        updatedSections['contact_info'] = contactInfo;
      }

      await updatePage(page.id, {
        page_title_ar: titleAr, page_title_en: titleEn, page_path: path,
        meta_title_ar: metaTitleAr, meta_title_en: metaTitleEn,
        meta_description_ar: metaDescAr, meta_description_en: metaDescEn,
        url_image: urlImage,
        sections: updatedSections,
        sections_images: sectionsImages,
      })
      toast({ title: "تم الحفظ", description: "تم تحديث الصفحة بنجاح" });
      onSave()
    } catch (error) {
      console.error("[v0] Error saving page:", error)
      toast({ title: "خطأ", description: "حدث خطأ أثناء حفظ التغييرات", variant: "destructive" });
    } finally {
      setIsSaving(false)
    }
  }
  
  async function handleSeedAboutPage() {
    if (!confirm("هل أنت متأكد من أنك تريد استعادة المحتوى الافتراضي لصفحة من نحن؟ سيتم دمج المحتوى الافتراضي مع المحتوى الحالي.")) return;
    setIsSeeding(true);
    try {
      const response = await fetch('/api/seed-about', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to seed page');
      alert("تمت استعادة المحتوى الافتراضي بنجاح! سيتم تحديث الصفحة الآن.");
      onSave();
    } catch (error: any) {
      console.error("Error seeding page:", error);
      alert(`حدث خطأ: ${error?.message || 'خطأ غير معروف'}`);
    } finally {
      setIsSeeding(false);
    }
  }

  function addSection() {
    if (!newKey) return
    setSections({ ...sections, [newKey]: newValue })
    setNewKey("")
    setNewValue("")
  }

  function updateSection(key: string, value: string) {
    setSections({ ...sections, [key]: value })
  }

  function deleteSection(key: string) {
    const newSections = { ...sections }
    delete newSections[key]
    setSections(newSections)
    // also remove any stored image for this key
    const newSectionsImages = { ...sectionsImages }
    if (key in newSectionsImages) {
      delete newSectionsImages[key]
      setSectionsImages(newSectionsImages)
    }
  }

  return (
    <div className="space-y-6 p-1">
      <Card>
        <CardHeader><CardTitle>المعلومات الأساسية</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>العنوان بالعربية</Label><Input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} /></div>
            <div><Label>العنوان بالإنجليزية</Label><Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} /></div>
            <div className="md:col-span-2"><Label>المسار (Path)</Label><Input value={path} onChange={(e) => setPath(e.target.value)} /></div>
          </div>
          
          <div className="pt-4 border-t">
            <Label className="text-base font-semibold">الصورة الرئيسية للصفحة</Label>
            <p className="text-sm text-muted-foreground mb-3">اختر صورة رئيسية لهذه الصفحة</p>
            
            {urlImage && (
              <div className="mb-4 p-4 border rounded-md bg-muted/50 flex items-center justify-center">
                <Image 
                  src={urlImage} 
                  alt="الصورة الرئيسية" 
                  width={600} 
                  height={300} 
                  className="rounded-md object-contain max-h-[300px] w-auto" 
                  onError={(e) => {
                    e.currentTarget.style.display='none'
                    const errorDiv = document.createElement('div')
                    errorDiv.className = 'text-destructive text-sm'
                    errorDiv.textContent = 'فشل تحميل الصورة'
                    e.currentTarget.parentElement?.appendChild(errorDiv)
                  }} 
                />
              </div>
            )}
            
            <div className="flex gap-2">
              <Input 
                value={urlImage} 
                onChange={(e) => setUrlImage(e.target.value)} 
                placeholder="https://example.com/image.jpg" 
                className="font-mono text-xs"
              />
              <label htmlFor="upload-main-image">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingMainImage}
                  className="cursor-pointer"
                  onClick={() => document.getElementById('upload-main-image')?.click()}
                >
                  {uploadingMainImage ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <Upload className="h-4 w-4 ml-2" />
                  )}
                  رفع صورة
                </Button>
              </label>
              <input
                id="upload-main-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleMainImageUpload}
                disabled={uploadingMainImage}
              />
              {urlImage && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setUrlImage("")}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4 ml-2" />
                  حذف
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>تحسين محركات البحث (SEO)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>عنوان SEO بالعربية</Label><Input value={metaTitleAr} onChange={(e) => setMetaTitleAr(e.target.value)} placeholder={titleAr} /></div>
            <div><Label>عنوان SEO بالإنجليزية</Label><Input value={metaTitleEn} onChange={(e) => setMetaTitleEn(e.target.value)} placeholder={titleEn} /></div>
            <div><Label>وصف SEO بالعربية</Label><Textarea value={metaDescAr} onChange={(e) => setMetaDescAr(e.target.value)} rows={3} placeholder="وصف مختصر للصفحة يظهر في نتائج البحث" /></div>
            <div><Label>وصف SEO بالإنجليزية</Label><Textarea value={metaDescEn} onChange={(e) => setMetaDescEn(e.target.value)} rows={3} placeholder="Short description for search results" /></div>
          </div>
        </CardContent>
      </Card>

      {page.page_path === '/contact' && (
        <Card>
          <CardHeader><CardTitle>معلومات التواصل</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className={contactErrors.phone ? "text-destructive" : ""}>الهاتف</Label>
                <Input 
                  value={contactInfo.phone} 
                  onChange={(e) => {
                    setContactInfo({...contactInfo, phone: e.target.value})
                    if (contactErrors.phone) setContactErrors({...contactErrors, phone: undefined})
                  }} 
                  dir="ltr" 
                  placeholder="01xxxxxxxxx"
                  className={contactErrors.phone ? "border-destructive" : ""}
                />
                {contactErrors.phone && <p className="text-sm text-destructive mt-1">{contactErrors.phone}</p>}
              </div>
              <div>
                <Label className={contactErrors.whatsapp ? "text-destructive" : ""}>واتساب</Label>
                <Input 
                  value={contactInfo.whatsapp} 
                  onChange={(e) => {
                    setContactInfo({...contactInfo, whatsapp: e.target.value})
                    if (contactErrors.whatsapp) setContactErrors({...contactErrors, whatsapp: undefined})
                  }} 
                  dir="ltr"
                  placeholder="01xxxxxxxxx"
                  className={contactErrors.whatsapp ? "border-destructive" : ""}
                />
                {contactErrors.whatsapp && <p className="text-sm text-destructive mt-1">{contactErrors.whatsapp}</p>}
              </div>
              <div>
                <Label>نص واتساب (اختياري)</Label>
                <Input 
                  value={contactInfo.whatsappSubtitle || ""} 
                  onChange={(e) => setContactInfo({...contactInfo, whatsappSubtitle: e.target.value})} 
                  placeholder="تواصل عبر واتساب"
                />
              </div>
              <div>
                <Label className={contactErrors.email ? "text-destructive" : ""}>البريد الإلكتروني</Label>
                <Input 
                  value={contactInfo.email} 
                  onChange={(e) => {
                    setContactInfo({...contactInfo, email: e.target.value})
                    if (contactErrors.email) setContactErrors({...contactErrors, email: undefined})
                  }} 
                  dir="ltr"
                  placeholder="info@example.com"
                  className={contactErrors.email ? "border-destructive" : ""}
                />
                {contactErrors.email && <p className="text-sm text-destructive mt-1">{contactErrors.email}</p>}
              </div>
              <div className="md:col-span-2">
                <Label className={contactErrors.address ? "text-destructive" : ""}>العنوان</Label>
                <Input 
                  value={contactInfo.address} 
                  onChange={(e) => {
                    setContactInfo({...contactInfo, address: e.target.value})
                    if (contactErrors.address) setContactErrors({...contactErrors, address: undefined})
                  }} 
                  placeholder="العنوان التفصيلي..."
                  className={contactErrors.address ? "border-destructive" : ""}
                />
                {contactErrors.address && <p className="text-sm text-destructive mt-1">{contactErrors.address}</p>}
              </div>
              <div className="md:col-span-2">
                <Label className={contactErrors.workingHours ? "text-destructive" : ""}>ساعات العمل</Label>
                <Textarea 
                  value={contactInfo.workingHours} 
                  onChange={(e) => {
                    setContactInfo({...contactInfo, workingHours: e.target.value})
                    if (contactErrors.workingHours) setContactErrors({...contactErrors, workingHours: undefined})
                  }} 
                  rows={4}
                  placeholder="أدخل ساعات العمل..."
                  className={contactErrors.workingHours ? "border-destructive" : ""}
                />
                {contactErrors.workingHours && <p className="text-sm text-destructive mt-1">{contactErrors.workingHours}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
            <CardTitle>أقسام المحتوى الإضافية</CardTitle>
            <p className="text-sm text-muted-foreground pt-1">استخدم مفاتيح معرفة مسبقاً (مثل hero.title) أو أنشئ مفاتيح جديدة خاصة بك.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:grid md:grid-cols-[1fr_2fr_auto] gap-2 p-4 border rounded-lg bg-muted/50">
            <div className="w-full">
            {page.page_path === '/about/' ? (
              <Select value={newKey} onValueChange={setNewKey}>
                <SelectTrigger><SelectValue placeholder="اختر مفتاح لإضافته..." /></SelectTrigger>
                <SelectContent>
                  {availableKeys.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input placeholder="مثال: hero.title" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
            )}
            </div>
            <Textarea placeholder="المحتوى..." value={newValue} onChange={(e) => setNewValue(e.target.value)} rows={2} />
            <Button onClick={addSection} className="w-full md:w-auto"><Plus className="h-4 w-4 ml-2" />إضافة</Button>
          </div>

          <div className="space-y-3 mt-4">
            {Object.entries(sections).filter(([key]) => key !== 'contact_info').sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => (
              <div key={key} className="flex flex-col md:grid md:grid-cols-[1fr_2fr_auto] gap-3 items-start p-3 bg-transparent rounded-lg border">
                <Input value={key} disabled className="font-mono text-sm bg-muted self-center w-full md:w-auto" />
                
                <div className="space-y-2 w-full">
                  {key.includes("_url") && ((sectionsImages && sectionsImages[key]) || value) ? (
                    <div className="space-y-2">
                      <div className="p-4 border rounded-md bg-muted/50 flex items-center justify-center min-h-[200px]">
                        <Image 
                          src={(sectionsImages && sectionsImages[key]) || value} 
                          alt={`Preview for ${key}`} 
                          width={400} 
                          height={200} 
                          className="rounded-md object-contain max-h-[300px] w-auto" 
                          onError={(e) => {
                            e.currentTarget.style.display='none'
                            const errorDiv = document.createElement('div')
                            errorDiv.className = 'text-destructive text-sm'
                            errorDiv.textContent = 'فشل تحميل الصورة'
                            e.currentTarget.parentElement?.appendChild(errorDiv)
                          }} 
                        />
                      </div>
                      <div className="flex gap-2">
                        <label htmlFor={`upload-${key}`} className="flex-1">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={uploadingKey === key}
                            className="cursor-pointer w-full"
                            onClick={() => document.getElementById(`upload-${key}`)?.click()}
                          >
                            {uploadingKey === key ? (
                              <Loader2 className="h-4 w-4 animate-spin ml-2" />
                            ) : (
                              <Upload className="h-4 w-4 ml-2" />
                            )}
                            تغيير الصورة
                          </Button>
                        </label>
                        <input
                          id={`upload-${key}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(key, e)}
                          disabled={uploadingKey === key}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            const newImgs = { ...sectionsImages }
                            if (key in newImgs) {
                              delete newImgs[key]
                              setSectionsImages(newImgs)
                            }
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4 ml-2" />
                          حذف
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Textarea 
                        value={value} 
                        onChange={(e) => updateSection(key, e.target.value)} 
                        rows={key.includes("_url") ? 2 : 4} 
                        placeholder={key.includes("_url") ? "رابط الصورة أو ارفع صورة..." : "المحتوى..."} 
                        className={key.includes("_url") ? "font-mono text-xs flex-1" : "flex-1"}
                      />
                      <div className="flex flex-col gap-2">
                        <label htmlFor={`upload-${key}`}>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={uploadingKey === key}
                            className="cursor-pointer w-full"
                            onClick={() => document.getElementById(`upload-${key}`)?.click()}
                          >
                            {uploadingKey === key ? (
                              <Loader2 className="h-4 w-4 animate-spin ml-2" />
                            ) : (
                              <Upload className="h-4 w-4 ml-2" />
                            )}
                            رفع
                          </Button>
                        </label>
                        <input
                          id={`upload-${key}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(key, e)}
                          disabled={uploadingKey === key}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full md:w-auto flex justify-end md:justify-center">
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 self-center" onClick={() => deleteSection(key)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}

            {Object.keys(sections).length === 0 && (
              <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">لا توجد أقسام محتوى. قم بإضافة قسم جديد أعلاه.</div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
        <div className="w-full sm:w-auto">
          {page.page_path === '/about/' && (
              <Button variant="secondary" onClick={handleSeedAboutPage} disabled={isSeeding} className="w-full sm:w-auto">
                  {isSeeding ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <RefreshCcw className="h-4 w-4 ml-2" />} 
                  استعادة محتوى "من نحن"
              </Button>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => onSave()} className="flex-1 sm:flex-none">إلغاء</Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1 sm:flex-none">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin ml-2" />} 
            حفظ التغييرات
          </Button>
        </div>
      </div>
    </div>
  )
}

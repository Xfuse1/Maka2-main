"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useDesignStore } from "@/store/design-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Palette, Type, ImageIcon } from "lucide-react"
import { uploadLogo, getLogoUrl } from "@/lib/supabase/design"
import { saveDesignSettings } from "@/lib/supabase/design-settings"
import { useToast } from "@/hooks/use-toast"

export default function AdminDesignPage() {
  const { colors, fonts, layout, setColor, setFont, setLogo, reset, logoUrl } = useDesignStore()
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string>(logoUrl || "/placeholder-logo.svg")
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  // Ensure all values are strings
  const safeColors = {
    primary: colors?.primary || "#f70824",
    background: colors?.background || "#d06d6d",
    foreground: colors?.foreground || "#1a1a1a"
  }
  const safeFonts = {
    heading: fonts?.heading || "Cairo",
    body: fonts?.body || "Cairo"
  }
  const safeLayout = {
    containerWidth: layout?.containerWidth || "1280px",
    radius: layout?.radius || "0.5rem"
  }

  // Load current logo on mount
  useEffect(() => {
    loadCurrentLogo()
  }, [])

  const handleSaveColors = async () => {
    try {
      await saveDesignSettings("colors", safeColors)
      // Force immediate application
      setTimeout(() => applyColorsImmediately(), 0)
      toast({
        title: "تم بنجاح!",
        description: "تم حفظ ألوان الموقع بنجاح!"
      })
    } catch (error) {
      console.error("[AdminDesign] Error saving colors:", error)
      toast({
        title: "خطأ",
        description: "فشل حفظ ألوان الموقع",
        variant: "destructive",
      })
    }
  }

  const applyColorsImmediately = () => {
    const root = document.documentElement
    const body = document.body
    
    root.style.setProperty("--primary-hex", safeColors.primary)
    root.style.setProperty("--background-hex", safeColors.background)
    root.style.setProperty("--foreground-hex", safeColors.foreground)
    
    body.style.backgroundColor = safeColors.background
    root.style.backgroundColor = safeColors.background
    body.style.color = safeColors.foreground
    
    // Also apply to all major containers
    const containers = document.querySelectorAll('body, html, #__next, main, .bg-background')
    containers.forEach(el => {
      (el as HTMLElement).style.backgroundColor = safeColors.background
    })
  }

  // Apply colors immediately when they change (live preview)
  useEffect(() => {
    applyColorsImmediately()
  }, [safeColors.primary, safeColors.background, safeColors.foreground])

  const handleSaveFonts = async () => {
    try {
      await saveDesignSettings("fonts", safeFonts)
      const root = document.documentElement
      root.style.setProperty("--font-heading", safeFonts.heading)
      root.style.setProperty("--font-body", safeFonts.body)
      document.body.style.fontFamily = safeFonts.body
      
      toast({
        title: "تم بنجاح!",
        description: "تم حفظ الخطوط بنجاح!"
      })
    } catch (error) {
      console.error("[AdminDesign] Error saving fonts:", error)
      toast({
        title: "خطأ",
        description: "فشل حفظ الخطوط",
        variant: "destructive",
      })
    }
  }

  const loadCurrentLogo = async () => {
    try {
      const url = await getLogoUrl()
      setCurrentLogoUrl(url)
      setLogo(url)
    } catch (error) {
      console.error("Error loading logo:", error)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "خطأ",
          description: "حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت",
          variant: "destructive"
        })
        return
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
      if (!validTypes.includes(file.type)) {
        toast({
          title: "خطأ",
          description: "نوع الملف غير مدعوم. استخدم JPG, PNG, WebP أو SVG",
          variant: "destructive"
        })
        return
      }

      setLogoFile(file)
      toast({
        title: "تم اختيار الملف",
        description: file.name
      })
    }
  }

  const handleSaveLogo = async () => {
    if (!logoFile) {
      toast({
        title: "تنبيه",
        description: "الرجاء اختيار ملف الشعار أولاً",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    try {
      const publicUrl = await uploadLogo(logoFile)
      setCurrentLogoUrl(publicUrl)
      setLogo(publicUrl)
      setLogoFile(null)
      
      toast({
        title: "تم بنجاح!",
        description: "تم حفظ الشعار الجديد"
      })

      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error?.message || "فشل رفع الشعار",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">إعدادات التصميم</h1>
        <p className="text-muted-foreground text-sm md:text-base">تخصيص مظهر وألوان الموقع</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-2 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Palette className="h-5 w-5 text-primary" />
              الألوان الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-base font-medium mb-2 block">اللون الأساسي</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={safeColors.primary}
                  onChange={(e) => setColor("primary", e.target.value)}
                  className="w-20 h-12"
                />
                <Input
                  type="text"
                  value={safeColors.primary}
                  onChange={(e) => setColor("primary", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-base font-medium mb-2 block">لون الخلفية</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={safeColors.background}
                  onChange={(e) => setColor("background", e.target.value)}
                  className="w-20 h-12"
                />
                <Input
                  type="text"
                  value={safeColors.background}
                  onChange={(e) => setColor("background", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-base font-medium mb-2 block">لون النص</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={safeColors.foreground}
                  onChange={(e) => setColor("foreground", e.target.value)}
                  className="w-20 h-12"
                />
                <Input
                  type="text"
                  value={safeColors.foreground}
                  onChange={(e) => setColor("foreground", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleSaveColors}>
              تطبيق الألوان
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Type className="h-5 w-5 text-primary" />
              الخطوط
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-base font-medium mb-2 block">خط العناوين</Label>
              <Input 
                type="text" 
                value={safeFonts.heading} 
                onChange={(e) => setFont("heading", e.target.value)}
                className="text-base" 
              />
            </div>
            <div>
              <Label className="text-base font-medium mb-2 block">خط النصوص</Label>
              <Input 
                type="text" 
                value={safeFonts.body} 
                onChange={(e) => setFont("body", e.target.value)}
                className="text-base" 
              />
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleSaveFonts}>
              تطبيق الخطوط
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <ImageIcon className="h-5 w-5 text-primary" />
              شعار الموقع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-base font-medium mb-2 block">رفع شعار جديد</Label>
              <Input 
                type="file" 
                accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml" 
                onChange={handleLogoUpload} 
                className="text-base"
                disabled={isUploading}
              />
              {logoFile && <p className="text-sm text-muted-foreground mt-2">الملف المختار: {logoFile.name}</p>}
              <p className="text-xs text-muted-foreground mt-1">الحد الأقصى: 5 ميجابايت (JPG, PNG, WebP, SVG)</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">الشعار الحالي</p>
              <div className="flex justify-center items-center min-h-[80px]">
                <img 
                  src={currentLogoUrl} 
                  alt="الشعار الحالي" 
                  className="max-h-20 max-w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-logo.svg"
                  }}
                />
              </div>
            </div>
            <Button 
              className="w-full bg-primary hover:bg-primary/90" 
              onClick={handleSaveLogo}
              disabled={!logoFile || isUploading}
            >
              {isUploading ? "جاري الرفع..." : "حفظ الشعار الجديد"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex justify-center">
        <Button 
          variant="outline" 
          onClick={reset}
          className="border-destructive text-destructive hover:bg-destructive/10"
        >
          استرجاع الإعدادات الافتراضية
        </Button>
      </div>
    </div>
  )
}

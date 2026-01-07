"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSettingsStore } from "@/lib/settings-store"
import { FooterContactInfo } from "@/components/layout/FooterContactInfo"
import { useDesignStore } from "@/store/design-store"
import { getPublishedPages } from "@/lib/supabase/pages"

export function SiteFooter() {
  const { settings, loadSettings } = useSettingsStore()
  const { colors } = useDesignStore()

  const [mounted, setMounted] = useState(false)
  const [pages, setPages] = useState<{ id: string; page_path: string; page_title_ar: string }[]>([])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    setMounted(true)
    ;(async () => {
      try {
        const res = await getPublishedPages()
        setPages(res)
      } catch (err) {
        console.error("[v0] Error loading footer pages:", err)
      }
    })()
  }, [])

  // Apply CSS variables for dynamic colors
  const cssVars = mounted ? {
    '--footer-bg': colors.background,
    '--footer-fg': colors.foreground,
    '--footer-fg-muted': colors.foreground + 'CC',
    '--footer-border': colors.foreground + '20',
    '--footer-primary': colors.primary,
  } as React.CSSProperties : {}

  return (
    <footer 
      className="border-t py-12 transition-colors duration-300 bg-[--footer-bg] border-[--footer-border]"
      style={cssVars}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h5 className="font-bold text-lg mb-4 transition-colors duration-300 text-[--footer-fg]">
              عن {settings.siteName}
            </h5>
            <p className="leading-relaxed transition-colors duration-300 text-[--footer-fg-muted]">
              {settings.siteDescription}
            </p>
          </div>
          <div>
            <h5 className="font-bold text-lg mb-4 transition-colors duration-300 text-[--footer-fg]">
              روابط سريعة
            </h5>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/category/abayas" 
                  className="transition-colors duration-300 text-[--footer-fg-muted] hover:text-[--footer-primary]"
                >
                  عبايات
                </Link>
              </li>
              <li>
                <Link 
                  href="/category/cardigans" 
                  className="transition-colors duration-300 text-[--footer-fg-muted] hover:text-[--footer-primary]"
                >
                  كارديجان
                </Link>
              </li>
              <li>
                <Link 
                  href="/category/sutes" 
                  className="transition-colors duration-300 text-[--footer-fg-muted] hover:text-[--footer-primary]"
                >
                  بدل
                </Link>
              </li>
              <li>
                <Link 
                  href="/category/dresses" 
                  className="transition-colors duration-300 text-[--footer-fg-muted] hover:text-[--footer-primary]"
                >
                  فساتين
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-lg mb-4 transition-colors duration-300 text-[--footer-fg]">
              معلومات
            </h5>
            <ul className="space-y-2">
              {pages.map((p) => (
                <li key={p.id}>
                  <Link
                    href={p.page_path}
                    className="transition-colors duration-300 text-[--footer-fg-muted] hover:text-[--footer-primary]"
                  >
                    {p.page_title_ar}
                  </Link>
                </li>
              ))}
              {pages.length === 0 && (
                <>
                  <li>
                    <Link 
                      href="/about" 
                      className="transition-colors duration-300 text-[--footer-fg-muted] hover:text-[--footer-primary]"
                    >
                      من نحن
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/return-policy" 
                      className="transition-colors duration-300 text-[--footer-fg-muted] hover:text-[--footer-primary]"
                    >
                      سياسة الإرجاع
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/policies" 
                      className="transition-colors duration-300 text-[--footer-fg-muted] hover:text-[--footer-primary]"
                    >
                      سياسات الموقع
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-lg mb-4 transition-colors duration-300 text-[--footer-fg]">
              تواصل معنا
            </h5>
            <p className="leading-relaxed mb-4 transition-colors duration-300 text-[--footer-fg-muted]">
              <FooterContactInfo />
            </p>
            <Link href="/contact">
              <Button 
                variant="outline" 
                className="w-full transition-all duration-300 bg-transparent border-[--footer-primary] text-[--footer-fg] hover:bg-[--footer-primary]/10"
              >
                تواصل معنا
              </Button>
            </Link>
          </div>
        </div>
        <div className="text-center pt-8 border-t transition-all duration-300 border-[--footer-border]">
          <p className="text-sm transition-colors duration-300 text-[--footer-fg-muted]">
            © {new Date().getFullYear()} {settings.siteName}. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  )
}

"use client"

import { useEffect, useState } from "react"
import { getPageByPath, type PageContent } from "@/lib/supabase/pages"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Loader2 } from "lucide-react"

export default function PoliciesPage() {
  const [page, setPage] = useState<PageContent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // Try both path formats to be safe
        let data = await getPageByPath("/policies")
        if (!data) {
          data = await getPageByPath("policies/")
        }
        setPage(data)
      } catch (err) {
        console.error("Error loading policies:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const sections = page?.sections ?? {}
  const privacy = (sections.privacy_policy as string) || "هنا يتم كتابة سياسة الخصوصية الخاصة بالموقع..."
  const returns = (sections.return_policy as string) || "هنا يتم كتابة سياسة الاسترجاع والاستبدال الخاصة بالمتجر..."

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl" dir="rtl">
        <header className="space-y-4 text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {page?.page_title_ar || "سياسات الموقع"}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            هذه الصفحة توضح سياسة الخصوصية وقواعد الاسترجاع والاستبدال الخاصة بالمتجر.
          </p>
        </header>

        <section className="mb-10 space-y-4 bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl md:text-2xl font-semibold text-primary">سياسة الخصوصية</h2>
          <div className="text-base leading-relaxed whitespace-pre-line text-muted-foreground">
            {privacy}
          </div>
        </section>

        <section className="space-y-4 bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl md:text-2xl font-semibold text-primary">سياسة الاسترجاع</h2>
          <div className="text-base leading-relaxed whitespace-pre-line text-muted-foreground">
            {returns}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Award, Users, Sparkles, MoveRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getPageByPath } from "@/lib/supabase/pages"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { AnimatedSection } from "@/components/animated-section"
import { useSettingsStore } from "@/store/settings-store"

type PageContent = {
  sections: Record<string, string>
  sections_images?: Record<string, string>
  url_image?: string
}

export default function AboutPage() {
  const { settings, loadSettings } = useSettingsStore()
  const [pageData, setPageData] = useState<PageContent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    async function loadPage() {
      try {
        const page = await getPageByPath("/about")
        if (page) {
          setPageData(page)
        }
      } catch (error) {
        console.error("Error loading page:", error)
      } finally {
        setLoading(false)
      }
    }
    loadPage()
  }, [])

  const getSection = (key: string, fallback: string) => {
    // Prefer an explicit per-section image stored in `sections_images`.
    return pageData?.sections_images?.[key] || pageData?.sections?.[key] || fallback
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-xl text-foreground/70">جاري التحميل...</div>
      </div>
    )
  }

  // Hero Section Content
  const heroTitle = getSection("hero.title", "من نحن")
  const heroSubtitle = getSection("hero.subtitle", "رحلتنا في عالم الموضة المحتشمة")
  
  // Story Section Content
  const storyTitle = getSection("story.title", "قصتنا")
  const storyP1 = getSection(
    "story.paragraph1",
    `بدأت رحلة ${settings.siteName} من حلم بسيط: توفير أزياء نسائية راقية تجمع بين الأناقة العصرية والاحتشام الأصيل. نؤمن بأن كل امرأة تستحق أن تشعر بالثقة والجمال في ملابسها، دون التنازل عن قيمها ومبادئها.`
  )
  const storyP2 = getSection(
    "story.paragraph2",
    "منذ انطلاقتنا، كرسنا جهودنا لتقديم تصاميم فريدة تعكس الذوق الرفيع والجودة العالية. نختار أقمشتنا بعناية فائقة، ونهتم بأدق التفاصيل في كل قطعة نقدمها لكِ."
  )
  // Prefer general page `url_image` if set, otherwise fall back to the section value
  const storyImageUrl = pageData?.url_image || getSection("story.image_url", "/placeholder.jpg")

  // Values Section Content
  const valuesTitle = getSection("values.title", "قيمنا")
  const passionTitle = getSection("values.passion.title", "الشغف")
  const passionDesc = getSection(
    "values.passion.description",
    "نحب ما نقوم به ونسعى دائماً لتقديم الأفضل لعميلاتنا"
  )
  const qualityTitle = getSection("values.quality.title", "الجودة")
  const qualityDesc = getSection(
    "values.quality.description",
    "نختار أفضل الأقمشة ونهتم بأدق التفاصيل في كل منتج"
  )
  const customersTitle = getSection("values.customers.title", "العملاء")
  const customersDesc = getSection(
    "values.customers.description",
    "رضاكِ وسعادتكِ هما أولويتنا القصوى في كل ما نقدمه"
  )
  const innovationTitle = getSection("values.innovation.title", "الابتكار")
  const innovationDesc = getSection(
    "values.innovation.description",
    "نواكب أحدث صيحات الموضة مع الحفاظ على الأصالة"
  )

  // Team Section Content
  const teamTitle = getSection("team.title", "فريقنا وشغفنا")
  const teamP1 = getSection("team.paragraph1", `وراء كل قطعة فنية من ${settings.siteName}، يقف فريق من المصممين والحرفيين المهرة الذين يجمعهم شغف واحد: إبداع أزياء تعبر عنكِ. نحن عائلة تؤمن بقوة التفاصيل وتكرس وقتها لتحويل أجود الأقمشة إلى تصاميم تحاكي أحلامك.`)
  const teamP2 = getSection("team.paragraph2", "كل خيط، كل قصة، وكل تطريزة هي جزء من حكايتنا معكِ.")
  const teamImageUrl = getSection("team.image_url", "/placeholder-user.jpg")
  const teamImageTitle = getSection("team.image_title", `مؤسسي ${settings.siteName}`)
  const teamImageSubtitle = getSection("team.image_subtitle", "شغف يتوارثه الأجيال")

  // CTA Section Content
  const ctaTitle = getSection("cta.title", "ابدئي رحلتكِ معنا")
  const ctaSubtitle = getSection(
    "cta.subtitle",
    "اكتشفي مجموعتنا الحصرية من الأزياء الراقية"
  )
  const ctaButton = getSection("cta.button", "تسوقي الآن")

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero Section */}
      <AnimatedSection>
        <section className="relative bg-gradient-to-t from-background to-secondary/30 pt-24 pb-16 md:pt-32 md:pb-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-primary mb-4 tracking-tight">
              {heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
              {heroSubtitle}
            </p>
          </div>
        </section>
      </AnimatedSection>

      {/* Story Section */}
      <AnimatedSection>
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative w-full h-40 md:h-40 lg:h-80 rounded-2xl overflow-hidden shadow-2xl group">
                {storyImageUrl ? (
                  <img
                    src={storyImageUrl}
                    alt="قصتنا"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-muted/40" />
                )}
                <div className="absolute inset-0 bg-black/20"></div>
              </div>
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground border-r-4 border-primary pr-4">
                  {storyTitle}
                </h2>
                <div className="space-y-4 text-base md:text-lg text-foreground/80 leading-relaxed">
                  <p>{storyP1}</p>
                  <p>{storyP2}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Values Section */}
      <AnimatedSection>
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
              {valuesTitle}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Sparkles, title: innovationTitle, desc: innovationDesc },
                { icon: Award, title: qualityTitle, desc: qualityDesc },
                { icon: Users, title: customersTitle, desc: customersDesc },
                { icon: Heart, title: passionTitle, desc: passionDesc },
              ].map((item, i) => (
                <Card key={i} className="bg-background border-border/50 shadow-lg hover:shadow-primary/20 hover:-translate-y-2 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-primary/20">
                      <item.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">{item.title}</h3>
                    <p className="text-foreground/70 leading-relaxed text-sm">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>
      
      {/* Team Section */}
      <AnimatedSection>
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-5 gap-12 items-center">
              <div className="md:col-span-3 space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground border-r-4 border-primary pr-4">
                  {teamTitle}
                </h2>
                <div className="space-y-4 text-base md:text-lg text-foreground/80 leading-relaxed">
                  <p>{teamP1}</p>
                   <p>{teamP2}</p>
                </div>
              </div>
               <div className="md:col-span-2 relative w-full h-96 rounded-2xl overflow-hidden shadow-2xl group">
                <Image 
                  src={teamImageUrl} 
                  alt="فريقنا" 
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                <div className="absolute bottom-4 right-4 text-white">
                  <h4 className="font-bold text-lg">{teamImageTitle}</h4>
                  <p className="text-sm">{teamImageSubtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection>
        <section className="py-16 md:py-24 bg-secondary/20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{ctaTitle}</h2>
            <p className="text-lg text-foreground/80 mb-8 max-w-2xl mx-auto leading-relaxed">
              {ctaSubtitle}
            </p>
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-7 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <Link href="/">
                {ctaButton}
                <MoveRight className="mr-3 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </section>
      </AnimatedSection>

      <SiteFooter />
    </div>
  )
}

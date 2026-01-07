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
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto relative" />
          </div>
          <p className="text-lg text-muted-foreground">جاري التحميل...</p>
        </div>
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 text-foreground">
      <SiteHeader />

      {/* Hero Section */}
      <AnimatedSection>
        <section className="relative overflow-hidden py-24 md:py-32">
          {/* Decorative Background */}
          <div className="absolute inset-0">
            <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 text-center relative">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">تعرفي علينا</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-foreground mb-6 tracking-tight">
              {heroTitle}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {heroSubtitle}
            </p>
          </div>
        </section>
      </AnimatedSection>

      {/* Story Section */}
      <AnimatedSection>
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
                <div className="relative h-64 md:h-[450px] rounded-3xl overflow-hidden shadow-2xl">
                  {storyImageUrl ? (
                    <img
                      src={storyImageUrl}
                      alt="قصتنا"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
              </div>
              <div className="space-y-8">
                <div className="inline-block">
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground relative">
                    {storyTitle}
                    <span className="absolute -bottom-3 right-0 w-20 h-1.5 bg-primary rounded-full" />
                  </h2>
                </div>
                <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                  <p className="p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-border/30 shadow-lg">
                    {storyP1}
                  </p>
                  <p className="p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-border/30 shadow-lg">
                    {storyP2}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Values Section */}
      <AnimatedSection>
        <section className="py-20 md:py-28 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                <Award className="w-4 h-4" />
                <span className="text-sm font-medium">ما يميزنا</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                {valuesTitle}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Sparkles, title: innovationTitle, desc: innovationDesc, color: "from-purple-500 to-pink-500" },
                { icon: Award, title: qualityTitle, desc: qualityDesc, color: "from-yellow-500 to-orange-500" },
                { icon: Users, title: customersTitle, desc: customersDesc, color: "from-blue-500 to-cyan-500" },
                { icon: Heart, title: passionTitle, desc: passionDesc, color: "from-red-500 to-rose-500" },
              ].map((item, i) => (
                <Card 
                  key={i} 
                  className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 rounded-3xl overflow-hidden group"
                >
                  <CardContent className="p-8 text-center">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-foreground">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>
      
      {/* Team Section */}
      <AnimatedSection>
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-5 gap-16 items-center">
              <div className="md:col-span-3 space-y-8">
                <div className="inline-block">
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground relative">
                    {teamTitle}
                    <span className="absolute -bottom-3 right-0 w-20 h-1.5 bg-primary rounded-full" />
                  </h2>
                </div>
                <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                  <p className="p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-border/30 shadow-lg">
                    {teamP1}
                  </p>
                  <p className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20 shadow-lg font-medium text-foreground">
                    {teamP2}
                  </p>
                </div>
              </div>
              <div className="md:col-span-2 relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
                <div className="relative h-[450px] rounded-3xl overflow-hidden shadow-2xl">
                  <Image 
                    src={teamImageUrl} 
                    alt="فريقنا" 
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 right-6 left-6 text-white">
                    <div className="backdrop-blur-md bg-white/10 rounded-2xl p-4 border border-white/20">
                      <h4 className="font-bold text-xl mb-1">{teamImageTitle}</h4>
                      <p className="text-white/80">{teamImageSubtitle}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection>
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-primary/80 relative">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
                <div className="absolute bottom-10 left-10 w-60 h-60 bg-white rounded-full blur-3xl" />
              </div>
              <CardContent className="p-12 md:p-16 text-center relative">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">{ctaTitle}</h2>
                <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
                  {ctaSubtitle}
                </p>
                <Button
                  asChild
                  size="lg"
                  className="bg-white hover:bg-white/90 text-primary text-lg px-10 py-7 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
                >
                  <Link href="/">
                    {ctaButton}
                    <MoveRight className="mr-3 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </AnimatedSection>

      <SiteFooter />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Store, 
  Rocket, 
  Shield, 
  Zap, 
  Globe, 
  CreditCard,
  ArrowLeft,
  Check,
  Star,
  Users,
  ShoppingBag
} from "lucide-react"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { LandingHeader } from "@/components/landing-header"

interface SubscriptionPlan {
  id: string
  name: string
  name_en: string
  price: number
  duration_days: number
  features: string[]
  is_active: boolean
  is_default: boolean
}

export default function LandingPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const response = await fetch("/api/subscription-plans")
      const data = await response.json()

      if (response.ok && data.plans) {
        setPlans(data.plans)
      }
    } catch (error) {
      console.error("Error loading plans:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (days: number) => {
    if (days === 14) return "14 يوم تجربة"
    if (days === 30) return "شهري"
    if (days === 90) return "3 أشهر"
    if (days === 180) return "6 أشهر"
    if (days === 365) return "سنوي"
    return `${days} يوم`
  }

  const features = [
    {
      icon: <Store className="w-8 h-8" />,
      title: "متجر كامل",
      description: "إنشاء متجر إلكتروني احترافي في دقائق مع تصميم متجاوب",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "دومين فرعي مجاني",
      description: "احصل على رابط متجرك الخاص yourstore.xfuse.online",
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "بوابات دفع متعددة",
      description: "تكامل مع أفضل بوابات الدفع في المنطقة",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "أمان متكامل",
      description: "حماية بياناتك وبيانات عملائك بأعلى معايير الأمان",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "سرعة فائقة",
      description: "أداء عالي وتحميل سريع للصفحات",
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: "سهولة الاستخدام",
      description: "لوحة تحكم سهلة لإدارة متجرك بكفاءة",
    },
  ]

  const stats = [
    { label: "متجر نشط", value: "500+", icon: <ShoppingBag className="w-6 h-6" /> },
    { label: "عميل سعيد", value: "10,000+", icon: <Users className="w-6 h-6" /> },
    { label: "تقييم", value: "4.9", icon: <Star className="w-6 h-6" /> },
  ]

  return (
    <>
      <LandingHeader />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir="rtl">
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-6 text-center">
          <Badge className="mb-6 bg-purple-100 text-purple-700 hover:bg-purple-100">
            🚀 أنشئ متجرك في أقل من 5 دقائق
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            أنشئ متجرك الإلكتروني
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              بسهولة واحترافية
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            منصة XFuse تمنحك كل ما تحتاجه لبناء متجرك الإلكتروني الناجح. 
            ابدأ رحلتك في التجارة الإلكترونية اليوم!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="text-lg px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Link href="/create-store">
                أنشئ متجرك مجاناً
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <a href="#pricing">عرض الأسعار</a>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-2 text-purple-600">
                  {stat.icon}
                </div>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-gray-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              كل ما تحتاجه في مكان واحد
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              مميزات متكاملة لمساعدتك على النجاح في التجارة الإلكترونية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center text-purple-600 mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              أسعار مناسبة للجميع
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              اختر الباقة المناسبة لك وابدأ اليوم
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {isLoading ? (
              // Loading skeleton
              [1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-4">
                    <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded w-32"></div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </CardContent>
                </Card>
              ))
            ) : plans.length === 0 ? (
              // Default pricing if no plans in DB
              <Card className="md:col-span-3 text-center py-12">
                <CardContent>
                  <p className="text-gray-500">
                    الباقات قيد التحديث. تواصل معنا للمزيد من المعلومات.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/create-store">ابدأ تجربتك المجانية</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              plans.map((plan, index) => (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden ${
                    plan.is_default
                      ? "border-2 border-purple-500 shadow-xl scale-105"
                      : "border shadow-lg"
                  }`}
                >
                  {plan.is_default && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-1 text-sm font-medium">
                      الأكثر شيوعاً
                    </div>
                  )}
                  <CardHeader className={plan.is_default ? "pt-10" : ""}>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.price === 0 ? "مجاني" : plan.price.toLocaleString()}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-500">EGP / {formatDuration(plan.duration_days)}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      className={`w-full ${
                        plan.is_default
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          : ""
                      }`}
                      variant={plan.is_default ? "default" : "outline"}
                    >
                      <Link href={`/create-store?plan=${plan.id}`}>
                        {plan.price === 0 ? "ابدأ مجاناً" : "اختر هذه الباقة"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            جاهز لبدء رحلتك؟
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            انضم لآلاف التجار الذين يثقون في XFuse لإدارة متاجرهم
          </p>
          <Button asChild size="lg" className="text-lg px-8 bg-white text-purple-600 hover:bg-gray-100">
            <Link href="/create-store">
              أنشئ متجرك الآن
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-2 rounded-xl">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">XFuse</span>
            </div>
            <div className="flex items-center gap-6 text-gray-400">
              <a href="#" className="hover:text-white transition">سياسة الخصوصية</a>
              <a href="#" className="hover:text-white transition">الشروط والأحكام</a>
              <a href="#" className="hover:text-white transition">تواصل معنا</a>
            </div>
            <p className="text-gray-400">
              © {new Date().getFullYear()} XFuse. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </>
  )
}

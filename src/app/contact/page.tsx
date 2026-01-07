"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { useToast } from "@/hooks/use-toast"
import { getPageByPath } from "@/lib/supabase/pages"

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

export default function ContactPage() {
  const [contactInfo, setContactInfo] = useState<ContactInfoConfig>(DEFAULT_CONTACT_INFO)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<null | "success" | "error">(null)
  const [errorMsg, setErrorMsg] = useState("")

  const [fullNameError, setFullNameError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    async function fetchContactInfo() {
      try {
        const page = await getPageByPath("/contact")
        if (page && page.sections && page.sections['contact_info']) {
          const stored = typeof page.sections['contact_info'] === 'string'
            ? JSON.parse(page.sections['contact_info'])
            : page.sections['contact_info'];
          setContactInfo({ ...DEFAULT_CONTACT_INFO, ...stored });
        }
      } catch (error) {
        console.error("Failed to load contact info:", error);
      }
    }
    fetchContactInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    setErrorMsg("")

    setFullNameError("")
    setEmailError("")
    setPhoneError("")

    const trimmedName = fullName.trim()
    const trimmedEmail = email.trim()
    const trimmedPhone = phone.trim()
    const trimmedMessage = message.trim()

    // 3.1 Full name required
    if (!trimmedName) {
      setLoading(false)
      setStatus("error")
      setFullNameError("الاسم الكامل مطلوب.")
      setErrorMsg("يُرجى إدخال الاسم الكامل.")
      return
    }

    // 3.2 Message required
    if (!trimmedMessage) {
      setLoading(false)
      setStatus("error")
      setErrorMsg("الرسالة مطلوبة.")
      return
    }

    // 3.3 Email required + format validation
    if (!trimmedEmail) {
      setLoading(false)
      setStatus("error")
      setEmailError("البريد الإلكتروني مطلوب.")
      setErrorMsg("يُرجى إدخال البريد الإلكتروني.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setLoading(false)
      setStatus("error")
      setEmailError("من فضلك أدخل بريدًا إلكترونيًا صحيحًا.")
      setErrorMsg("تحقق من صحة البريد الإلكتروني.")
      return
    }

    // 3.4 Egyptian phone required + format validation
    if (!trimmedPhone) {
      setLoading(false)
      setStatus("error")
      setPhoneError("رقم الهاتف مطلوب.")
      setErrorMsg("يُرجى إدخال رقم الهاتف.")
      return
    }

    const cleanPhone = trimmedPhone.replace(/\s+/g, "")
    const localRegex = /^01[0125][0-9]{8}$/
    const intlRegex = /^\+201[0125][0-9]{8}$/
    const isValidPhone = localRegex.test(cleanPhone) || intlRegex.test(cleanPhone)

    if (!isValidPhone) {
      setLoading(false)
      setStatus("error")
      setPhoneError("من فضلك أدخل رقم هاتف مصري صحيح (مثال: 010xxxxxxxx أو +2010xxxxxxxx).")
      setErrorMsg("تحقق من رقم الهاتف.")
      return
    }

    // All validations passed — submit
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: trimmedName, email: trimmedEmail, phone: trimmedPhone, message: trimmedMessage }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setStatus('error')
        setErrorMsg(data.error || 'حدث خطأ أثناء إرسال الرسالة.')
        toast({ title: 'خطأ', description: data.error || 'فشل الإرسال', variant: 'destructive' })
      } else {
        setStatus('success')
        setFullName('')
        setEmail('')
        setPhone('')
        setMessage('')
        toast({ title: 'تم الإرسال', description: 'تم إرسال رسالتك بنجاح' })
      }
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err?.message || 'Unexpected error')
      toast({ title: 'خطأ', description: err?.message || 'فشل الإرسال', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-background border-b">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-2xl translate-y-1/2 translate-x-1/2" />
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <MessageCircle className="w-4 h-4" />
              نحن هنا لمساعدتك
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              تواصل معنا
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              نحن هنا للإجابة على استفساراتك ومساعدتك في أي وقت
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Form */}
            <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  أرسل لنا رسالة
                </CardTitle>
                <CardDescription className="text-base">سنرد عليك في أقرب وقت ممكن</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">الاسم</Label>
                    <Input
                      id="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                      required
                      className="h-12 border-2 transition-all focus:border-primary"
                    />
                    {fullNameError ? (
                      <p className="text-sm text-destructive mt-1">{fullNameError}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      required
                      className="h-12 border-2 transition-all focus:border-primary"
                    />
                    {emailError ? (
                      <p className="text-sm text-destructive mt-1">{emailError}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01234567890"
                      className="h-12 border-2 transition-all focus:border-primary"
                    />
                    {phoneError ? (
                      <p className="text-sm text-destructive mt-1">{phoneError}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium">الرسالة</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="اكتب رسالتك هنا..."
                      rows={5}
                      required
                      className="border-2 transition-all focus:border-primary resize-none"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all" 
                    size="lg" 
                    disabled={loading}
                  >
                    {status === 'success' ? '✓ تم الإرسال بنجاح!' : loading ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                  </Button>

                  {/* Status / error message area */}
                  {status === 'success' && (
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                      ✓ تم إرسال رسالتك بنجاح. سنرد عليك قريبًا.
                    </div>
                  )}
                  {status === 'error' && errorMsg && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                      {errorMsg}
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-4">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Phone className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">الهاتف</h3>
                      <p className="text-muted-foreground text-lg" dir="ltr">{contactInfo.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">واتساب</h3>
                      <p className="text-muted-foreground" dir="ltr">{contactInfo.whatsapp}</p>
                      <a
                        href={`https://wa.me/20${contactInfo.whatsapp.replace(/^0+/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium mt-2 transition-colors"
                      >
                        {contactInfo.whatsappSubtitle || "تواصل عبر واتساب"}
                        <span className="text-xs">→</span>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Mail className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">البريد الإلكتروني</h3>
                      <p className="text-muted-foreground">{contactInfo.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-red-500/20 to-red-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <MapPin className="w-7 h-7 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">العنوان</h3>
                      <p className="text-muted-foreground">{contactInfo.address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <span className="text-xl">🕐</span>
                    ساعات العمل
                  </h3>
                  <div className="space-y-2 text-muted-foreground whitespace-pre-line leading-relaxed">
                    {contactInfo.workingHours}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}

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
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">تواصل معنا</h2>
            <p className="text-xl text-muted-foreground">نحن هنا للإجابة على استفساراتك</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">أرسل لنا رسالة</CardTitle>
                <CardDescription>سنرد عليك في أقرب وقت ممكن</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم</Label>
                    <Input
                      id="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="أدخل اسمك"
                      required
                    />
                    {fullNameError ? (
                      <p className="text-sm text-destructive mt-1">{fullNameError}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      required
                    />
                    {emailError ? (
                      <p className="text-sm text-destructive mt-1">{emailError}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01234567890"
                    />
                    {phoneError ? (
                      <p className="text-sm text-destructive mt-1">{phoneError}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">الرسالة</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="اكتب رسالتك هنا..."
                      rows={5}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {status === 'success' ? 'تم الإرسال بنجاح!' : loading ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                  </Button>

                  {/* Status / error message area */}
                  {status === 'success' && (
                    <p className="text-sm text-success mt-2">تم إرسال رسالتك بنجاح. سنرد عليك قريبًا.</p>
                  )}
                  {status === 'error' && errorMsg && (
                    <p className="text-sm text-destructive mt-2">{errorMsg}</p>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">الهاتف</h3>
                      <p className="text-muted-foreground" dir="ltr">{contactInfo.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">واتساب</h3>
                      <p className="text-muted-foreground" dir="ltr">{contactInfo.whatsapp}</p>
                      <a
                        href={`https://wa.me/20${contactInfo.whatsapp.replace(/^0+/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {contactInfo.whatsappSubtitle || "تواصل عبر واتساب"}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">البريد الإلكتروني</h3>
                      <p className="text-muted-foreground">{contactInfo.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">العنوان</h3>
                      <p className="text-muted-foreground">{contactInfo.address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary/5">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">ساعات العمل</h3>
                  <div className="space-y-2 text-muted-foreground whitespace-pre-line">
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

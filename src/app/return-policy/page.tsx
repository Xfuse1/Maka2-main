import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Clock, Package, RefreshCw } from "lucide-react"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section */}
      <section className="bg-primary py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6">سياسة الإرجاع</h2>
          <p className="text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            نحن نهتم براحتكِ ورضاكِ التام عن مشترياتكِ
          </p>
        </div>
      </section>

      {/* Quick Info Cards */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="border-2 border-primary bg-primary/5">
              <CardContent className="p-6 text-center">
                <Clock className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="font-bold text-foreground">14 يوم</p>
                <p className="text-sm text-muted-foreground">فترة الإرجاع</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary bg-primary/5">
              <CardContent className="p-6 text-center">
                <RefreshCw className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="font-bold text-foreground">إرجاع مجاني</p>
                <p className="text-sm text-muted-foreground">بدون رسوم</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary bg-primary/5">
              <CardContent className="p-6 text-center">
                <Package className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="font-bold text-foreground">حالة جيدة</p>
                <p className="text-sm text-muted-foreground">بالعبوة الأصلية</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary bg-primary/5">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="font-bold text-foreground">استرداد سريع</p>
                <p className="text-sm text-muted-foreground">خلال 7 أيام</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Policy Details */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <Card className="border-2 border-border shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                  شروط الإرجاع
                </h3>
                <ul className="space-y-3 text-muted-foreground leading-relaxed">
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>يجب أن يكون المنتج في حالته الأصلية دون استخدام أو تعديل</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>يجب أن يكون المنتج في العبوة الأصلية مع جميع الملحقات والبطاقات</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>يجب تقديم طلب الإرجاع خلال 14 يوماً من تاريخ الاستلام</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>يجب إرفاق فاتورة الشراء الأصلية أو رقم الطلب</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-border shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-3">
                  <RefreshCw className="h-6 w-6 text-primary" />
                  كيفية الإرجاع
                </h3>
                <ol className="space-y-4 text-muted-foreground leading-relaxed">
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-primary">1.</span>
                    <span>تواصلي معنا عبر الواتساب على 01234567890 أو البريد الإلكتروني info@mecca-fashion.com</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-primary">2.</span>
                    <span>قدمي رقم الطلب وسبب الإرجاع</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-primary">3.</span>
                    <span>سنرسل لكِ تعليمات الإرجاع وعنوان الشحن</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-primary">4.</span>
                    <span>أعيدي المنتج في عبوته الأصلية</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-primary">5.</span>
                    <span>بعد استلام المنتج وفحصه، سنقوم باسترداد المبلغ خلال 7 أيام عمل</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card className="border-2 border-border shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-3">
                  <Package className="h-6 w-6 text-primary" />
                  المنتجات غير القابلة للإرجاع
                </h3>
                <ul className="space-y-3 text-muted-foreground leading-relaxed">
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>المنتجات المصنوعة حسب الطلب أو المقاسات الخاصة</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>المنتجات التي تم ارتداؤها أو استخدامها</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>المنتجات المعروضة بخصم أكثر من 50%</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>المنتجات التي تم إزالة البطاقات أو الملصقات منها</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary bg-primary/5 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-foreground">الاستبدال</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  نوفر خدمة الاستبدال في حالة وجود عيب في المنتج أو إذا كنتِ ترغبين في تغيير المقاس أو اللون. يرجى
                  التواصل معنا خلال 14 يوماً من تاريخ الاستلام.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">ملاحظة:</strong> الاستبدال متاح فقط في حالة توفر المنتج البديل في
                  المخزون.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-4xl font-bold text-foreground mb-6">هل لديكِ استفسار؟</h3>
          <p className="text-xl text-foreground/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            فريق خدمة العملاء لدينا جاهز لمساعدتكِ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-foreground hover:bg-foreground/90 text-background text-lg px-8 py-6">
              واتساب: 01234567890
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-foreground text-foreground hover:bg-foreground/10 text-lg px-8 py-6 bg-transparent"
            >
              <Link href="/">العودة للتسوق</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}

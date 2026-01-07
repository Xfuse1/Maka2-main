"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Ruler } from "lucide-react"

const sizeChart = [
  { size: "S", bust: "86-90", waist: "66-70", hips: "90-94", length: "140" },
  { size: "M", bust: "90-94", waist: "70-74", hips: "94-98", length: "142" },
  { size: "L", bust: "94-98", waist: "74-78", hips: "98-102", length: "144" },
  { size: "XL", bust: "98-104", waist: "78-84", hips: "102-108", length: "146" },
  { size: "XXL", bust: "104-110", waist: "84-90", hips: "108-114", length: "148" },
]

const customSizesInfo = [
  { measurement: "الصدر", description: "قياس محيط الصدر من أعرض نقطة" },
  { measurement: "الخصر", description: "قياس محيط الخصر الطبيعي" },
  { measurement: "الأرداف", description: "قياس محيط الأرداف من أعرض نقطة" },
  { measurement: "الطول الكلي", description: "من الكتف إلى الأرض" },
  { measurement: "طول الكم", description: "من الكتف إلى المعصم" },
  { measurement: "عرض الكتف", description: "من كتف إلى كتف" },
]

export function SizeChartDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="text-primary hover:text-primary/80 p-0 h-auto">
          <Ruler className="w-4 h-4 ml-1" />
          جدول المقاسات
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">جدول المقاسات</DialogTitle>
          <DialogDescription>جميع القياسات بالسنتيمتر</DialogDescription>
        </DialogHeader>

        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4 text-foreground">المقاسات القياسية</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary/10">
                  <th className="border-2 border-border p-3 text-right font-bold">المقاس</th>
                  <th className="border-2 border-border p-3 text-right font-bold">الصدر</th>
                  <th className="border-2 border-border p-3 text-right font-bold">الخصر</th>
                  <th className="border-2 border-border p-3 text-right font-bold">الأرداف</th>
                  <th className="border-2 border-border p-3 text-right font-bold">الطول</th>
                </tr>
              </thead>
              <tbody>
                {sizeChart.map((row) => (
                  <tr key={row.size} className="hover:bg-secondary/50">
                    <td className="border-2 border-border p-3 font-bold text-primary">{row.size}</td>
                    <td className="border-2 border-border p-3">{row.bust}</td>
                    <td className="border-2 border-border p-3">{row.waist}</td>
                    <td className="border-2 border-border p-3">{row.hips}</td>
                    <td className="border-2 border-border p-3">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4 text-foreground">المقاسات الخاصة</h3>
          <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-6">
            <p className="text-base text-foreground mb-4 font-medium">
              نوفر خدمة المقاسات الخاصة لضمان الملاءمة المثالية. يرجى تزويدنا بالقياسات التالية:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary/10">
                    <th className="border-2 border-border p-3 text-right font-bold">القياس</th>
                    <th className="border-2 border-border p-3 text-right font-bold">كيفية القياس</th>
                  </tr>
                </thead>
                <tbody>
                  {customSizesInfo.map((item) => (
                    <tr key={item.measurement} className="hover:bg-secondary/50">
                      <td className="border-2 border-border p-3 font-bold text-primary">{item.measurement}</td>
                      <td className="border-2 border-border p-3 text-sm">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 bg-accent/10 rounded-lg">
              <p className="text-sm text-foreground font-medium">
                📱 للطلب بمقاسات خاصة، تواصلي معنا عبر الواتساب:{" "}
                <span className="font-bold text-primary">01234567890</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                * قد تستغرق الطلبات بمقاسات خاصة 7-10 أيام عمل إضافية
              </p>
            </div>
          </div>
        </div>

        <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong>ملاحظة:</strong> إذا كانت قياساتك بين مقاسين، ننصح باختيار المقاس الأكبر. للمقاسات الخاصة، تواصلي
            معنا عبر الواتساب.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

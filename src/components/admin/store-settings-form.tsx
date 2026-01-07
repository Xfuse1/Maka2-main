"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Store, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateStoreSettingsAction } from "@/app/admin/settings/actions"

interface StoreSettingsFormProps {
  initialName: string
  initialDescription: string
}

export function StoreSettingsForm({ initialName, initialDescription }: StoreSettingsFormProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    store_name: initialName,
    store_description: initialDescription,
  })

  const handleSave = async () => {
    try {
      setSaving(true)
      const result = await updateStoreSettingsAction(formData)
      if (result.success) {
        toast({
          title: "تم الحفظ",
          description: "تم تحديث معلومات المتجر بنجاح",
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("Error saving settings:", error)
      toast({
        title: "خطأ",
        description: error.message || "فشل حفظ الإعدادات",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Store className="h-5 w-5 text-primary" />
            معلومات المتجر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-base font-medium mb-2 block">اسم المتجر</Label>
            <Input
              type="text"
              value={formData.store_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, store_name: e.target.value }))}
              className="text-base"
              placeholder="اسم المتجر"
            />
          </div>
          <div>
            <Label className="text-base font-medium mb-2 block">وصف المتجر</Label>
            <Textarea
              value={formData.store_description}
              onChange={(e) => setFormData((prev) => ({ ...prev, store_description: e.target.value }))}
              rows={4}
              className="text-base"
              placeholder="وصف المتجر"
            />
          </div>
          <Button 
              className="w-full bg-primary hover:bg-primary/90" 
              onClick={handleSave}
              disabled={saving}
          >
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> جاري الحفظ...</> : "حفظ المعلومات"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  DollarSign,
  Clock,
  Star,
  Check,
  X
} from "lucide-react"

interface SubscriptionPlan {
  id: string
  name: string
  name_en: string
  price: number
  duration_days: number
  features: string[]
  is_active: boolean
  is_default: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface PricingManagementProps {
  onRefresh?: () => void
}

export default function PricingManagement({ onRefresh }: PricingManagementProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    name_en: "",
    price: "",
    duration_days: "",
    features: "",
    is_active: true,
    is_default: false,
    sort_order: 0,
  })

  const loadPlans = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/super-admin/subscription-plans")
      if (!response.ok) {
        throw new Error("Failed to fetch plans")
      }
      const { plans } = await response.json()
      setPlans(plans || [])
    } catch (error) {
      console.error("Error loading plans:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  const openCreateDialog = () => {
    setFormData({
      name: "",
      name_en: "",
      price: "",
      duration_days: "",
      features: "",
      is_active: true,
      is_default: false,
      sort_order: plans.length,
    })
    setSelectedPlan(null)
    setIsCreating(true)
    setIsEditDialogOpen(true)
  }

  const openEditDialog = (plan: SubscriptionPlan) => {
    setFormData({
      name: plan.name,
      name_en: plan.name_en,
      price: plan.price.toString(),
      duration_days: plan.duration_days.toString(),
      features: plan.features.join("\n"),
      is_active: plan.is_active,
      is_default: plan.is_default,
      sort_order: plan.sort_order,
    })
    setSelectedPlan(plan)
    setIsCreating(false)
    setIsEditDialogOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const featuresArray = formData.features
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0)

      const payload = {
        ...formData,
        features: featuresArray,
        ...(selectedPlan && { id: selectedPlan.id }),
      }

      const response = await fetch("/api/super-admin/subscription-plans", {
        method: isCreating ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save plan")
      }

      setIsEditDialogOpen(false)
      loadPlans()
      onRefresh?.()
    } catch (error) {
      console.error("Error saving plan:", error)
      alert(error instanceof Error ? error.message : "فشل حفظ الباقة")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedPlan) return

    try {
      const response = await fetch(
        `/api/super-admin/subscription-plans?id=${selectedPlan.id}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete plan")
      }

      setIsDeleteDialogOpen(false)
      setSelectedPlan(null)
      loadPlans()
      onRefresh?.()
    } catch (error) {
      console.error("Error deleting plan:", error)
      alert(error instanceof Error ? error.message : "فشل حذف الباقة")
    }
  }

  const togglePlanStatus = async (plan: SubscriptionPlan) => {
    try {
      const response = await fetch("/api/super-admin/subscription-plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: plan.id,
          is_active: !plan.is_active,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update plan status")
      }

      loadPlans()
    } catch (error) {
      console.error("Error toggling plan:", error)
      alert("فشل تحديث حالة الباقة")
    }
  }

  const formatDuration = (days: number) => {
    if (days === 1) return "يوم واحد"
    if (days <= 7) return `${days} أيام`
    if (days === 14) return "أسبوعين"
    if (days === 30) return "شهر"
    if (days === 90) return "3 أشهر"
    if (days === 180) return "6 أشهر"
    if (days === 365) return "سنة"
    return `${days} يوم`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              إجمالي الباقات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{plans.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Check className="w-4 h-4" />
              الباقات النشطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {plans.filter((p) => p.is_active).length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="w-4 h-4" />
              الباقة الافتراضية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {plans.find((p) => p.is_default)?.name || "غير محددة"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>باقات الاشتراك</CardTitle>
              <CardDescription>إدارة أسعار وباقات اشتراك المتاجر</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={loadPlans} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                تحديث
              </Button>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة باقة
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الاسم (English)</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>المدة</TableHead>
                  <TableHead>المميزات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>افتراضية</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      لا توجد باقات. أضف باقة جديدة للبدء.
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>{plan.name_en}</TableCell>
                      <TableCell>
                        <span className="font-bold text-lg">
                          {plan.price === 0 ? "مجاني" : `${plan.price.toLocaleString()} EGP`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {formatDuration(plan.duration_days)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          {plan.features.slice(0, 2).map((f, i) => (
                            <div key={i} className="text-sm text-gray-600 truncate">
                              • {f}
                            </div>
                          ))}
                          {plan.features.length > 2 && (
                            <span className="text-xs text-gray-400">
                              +{plan.features.length - 2} more
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={plan.is_active ? "default" : "secondary"}
                          className={
                            plan.is_active
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-gray-400"
                          }
                        >
                          {plan.is_active ? "نشط" : "غير نشط"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {plan.is_default && (
                          <Badge className="bg-purple-500 hover:bg-purple-600">
                            <Star className="w-3 h-3 mr-1" />
                            افتراضية
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(plan)}
                            className="gap-1"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePlanStatus(plan)}
                            className={
                              plan.is_active
                                ? "text-red-600 hover:bg-red-50"
                                : "text-green-600 hover:bg-green-50"
                            }
                          >
                            {plan.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPlan(plan)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="text-red-600 hover:bg-red-50"
                            disabled={plan.is_default}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? "إضافة باقة جديدة" : "تعديل الباقة"}
            </DialogTitle>
            <DialogDescription>
              {isCreating
                ? "أدخل تفاصيل الباقة الجديدة"
                : "قم بتعديل تفاصيل الباقة"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم (عربي)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="مثال: الباقة الشهرية"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_en">الاسم (English)</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) =>
                    setFormData({ ...formData, name_en: e.target.value })
                  }
                  placeholder="e.g., Monthly Plan"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">السعر (EGP)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="0 للتجربة المجانية"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_days">المدة (بالأيام)</Label>
                <Input
                  id="duration_days"
                  type="number"
                  min="1"
                  value={formData.duration_days}
                  onChange={(e) =>
                    setFormData({ ...formData, duration_days: e.target.value })
                  }
                  placeholder="30 لشهر، 365 لسنة"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">المميزات (سطر لكل ميزة)</Label>
              <textarea
                id="features"
                value={formData.features}
                onChange={(e) =>
                  setFormData({ ...formData, features: e.target.value })
                }
                placeholder="متجر كامل&#10;دعم فني&#10;عدد منتجات غير محدود"
                className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-y"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">باقة نشطة</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_default: checked })
                  }
                />
                <Label htmlFor="is_default">الباقة الافتراضية</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : isCreating ? (
                "إضافة"
              ) : (
                "حفظ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف الباقة "{selectedPlan?.name}"؟
              <br />
              <span className="text-red-600 font-semibold">
                هذا الإجراء لا يمكن التراجع عنه!
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              حذف نهائياً
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

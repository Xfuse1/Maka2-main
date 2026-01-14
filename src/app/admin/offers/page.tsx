"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
// Using native <table> markup here; no custom Table exports required.
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const PAYMENT_METHODS = [
  { value: 'kashier', label: 'Kashier' },
  { value: 'cod', label: 'Cash on Delivery' },
]

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<any[]>([])
  const [, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ payment_method: 'kashier', discount_value: 10, is_active: false })
  const { toast } = useToast()

  const fetchOffers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/offers')
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || 'Failed')
      setOffers(body.offers || [])
    } catch (err: any) {
      toast({ title: 'خطأ', description: err?.message || String(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOffers() }, [])

  const openCreate = () => { setEditing(null); setForm({ payment_method: 'kashier', discount_value: 10, is_active: false }); setOpen(true) }
  const openEdit = (o: any) => { setEditing(o); setForm({ payment_method: o.payment_method, discount_value: Number(o.discount_value || 0), is_active: !!o.is_active }); setOpen(true) }

  const save = async () => {
    try {
      // validate discount is between 1 and 100
      const dv = Number(form.discount_value || 0)
      if (dv < 1) {
        toast({ title: 'قيمة غير صالحة', description: 'يجب أن تكون نسبة الخصم 1% أو أكثر.', variant: 'destructive' })
        return
      }
      if (dv > 100) {
        toast({ title: 'قيمة غير صالحة', description: 'نسبة الخصم يجب أن تكون أقل من أو تساوي 100%.', variant: 'destructive' })
        return
      }

      const payload = { ...form }
      let res
      if (editing) {
        res = await fetch(`/api/admin/offers/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
      } else {
        res = await fetch('/api/admin/offers', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
      }
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || 'Failed')
      toast({ title: 'تم', description: 'تم الحفظ بنجاح' })
      setOpen(false)
      fetchOffers()
    } catch (err: any) {
      toast({ title: 'خطأ', description: err?.message || String(err), variant: 'destructive' })
    }
  }

  const remove = async (id: string) => {
    if (!confirm('هل تريد حذف العرض؟')) return
    try {
      const res = await fetch(`/api/admin/offers/${id}`, { method: 'DELETE' })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || 'Failed')
      toast({ title: 'تم', description: 'تم الحذف' })
      fetchOffers()
    } catch (err: any) {
      toast({ title: 'خطأ', description: err?.message || String(err), variant: 'destructive' })
    }
  }

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">إدارة العروض</h1>
        <div className="flex items-center gap-2">
          <Button onClick={openCreate}>إنشاء عرض جديد</Button>
          <Button variant="outline" onClick={fetchOffers}>تحديث</Button>
        </div>
      </div>

      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle>العروض الحالية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3">الطريقة</th>
                  <th className="p-3">الخصم</th>
                  <th className="p-3">فعال</th>
                  <th className="p-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((o) => (
                  <tr key={o.id} className="border-b">
                    <td className="p-3">{o.payment_method}</td>
                    <td className="p-3">{Number(o.discount_value) > 0 ? `${Number(o.discount_value).toFixed(2)}%` : '-'}</td>
                    <td className="p-3">{o.is_active ? 'نعم' : 'لا'}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => openEdit(o)}>تعديل</Button>
                        <Button size="sm" variant="destructive" onClick={() => remove(o.id)}>حذف</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل العرض' : 'إنشاء عرض'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-2">
            <div>
              <Label>طريقة الدفع</Label>
              <Select value={form.payment_method} onValueChange={(v: any) => setForm((s) => ({ ...s, payment_method: v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>نسبة الخصم (%)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={form.discount_value === 0 ? "" : String(form.discount_value)}
                onChange={(e) => setForm((s) => ({ ...s, discount_value: Number(e.target.value || 0) }))}
                placeholder="1 - 100"
              />
              {form.discount_value > 100 && (
                <p className="text-red-500 text-sm mt-1">نسبة الخصم يجب أن تكون أقل من أو تساوي 100%</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label>فعال</Label>
              <Switch checked={form.is_active} onCheckedChange={(v: any) => setForm((s) => ({ ...s, is_active: !!v }))} />
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={() => setOpen(false)} variant="outline">إلغاء</Button>
              <Button onClick={save}>{editing ? 'حفظ' : 'إنشاء'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

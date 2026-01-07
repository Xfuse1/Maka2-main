"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/messages')
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || 'Failed')
      setMessages(body.messages || [])
    } catch (err: any) {
      toast({ title: 'خطأ', description: err?.message || String(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMessages() }, [])

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-bold">الرسائل الواردة</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={fetchMessages} variant="outline" className="w-full sm:w-auto">تحديث</Button>
        </div>
      </div>

      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle>جميع الرسائل</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-right text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3">الاسم</th>
                  <th className="p-3">البريد</th>
                  <th className="p-3">الهاتف</th>
                  <th className="p-3">الرسالة</th>
                  <th className="p-3">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id} className="border-b">
                    <td className="p-3">{m.full_name || '-'}</td>
                    <td className="p-3">{m.email || '-'}</td>
                    <td className="p-3">{m.phone || '-'}</td>
                    <td className="p-3 max-w-xl break-words">{m.message}</td>
                    <td className="p-3">{new Date(m.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

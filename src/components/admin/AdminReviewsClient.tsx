"use client"

import React, { useMemo, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import { ReviewActions } from "@/app/admin/reviews/ReviewActions"

type Review = any

export default function AdminReviewsClient({ reviews }: { reviews: Review[] }) {
  const [filter, setFilter] = useState<'all'|'approved'|'rejected'|'pending'>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return reviews
    if (filter === 'approved') return reviews.filter(r => r.is_approved === true)
    if (filter === 'rejected') return reviews.filter(r => r.is_approved === false)
    return reviews.filter(r => r.is_approved === null || typeof r.is_approved === 'undefined')
  }, [reviews, filter])

  const statusVariant: { [key: string]: "secondary" | "destructive" | "default" | "outline" } = {
    pending: "secondary",
    approved: "default",
    rejected: "destructive",
  };

  const statusTranslations: { [key: string]: string } = {
    approved: "مقبول",
    pending: "قيد المراجعة",
    rejected: "مرفوض",
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
          الكل
        </button>
        <button onClick={() => setFilter('approved')} className={`px-3 py-1 rounded text-sm ${filter === 'approved' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
          المقبول
        </button>
        <button onClick={() => setFilter('rejected')} className={`px-3 py-1 rounded text-sm ${filter === 'rejected' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
          المرفوض
        </button>
        <button onClick={() => setFilter('pending')} className={`px-3 py-1 rounded text-sm ${filter === 'pending' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
          قيد المراجعة
        </button>
        <div className="text-sm text-muted-foreground mr-4 w-full sm:w-auto mt-2 sm:mt-0">النتائج: <span className="font-medium">{filtered.length}</span></div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">المنتج</TableHead>
              <TableHead className="text-right">صاحب التقييم</TableHead>
              <TableHead className="text-center">التقييم</TableHead>
              <TableHead className="text-right">التعليق</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead className="text-right">تاريخ الإنشاء</TableHead>
              <TableHead className="text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((review: Review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium whitespace-nowrap text-right">{review.product?.name_ar || 'منتج محذوف'}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">{review.customer_name || review.reviewer_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill={i < review.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-right">{review.review_text || review.comment}</TableCell>
                  <TableCell className="text-center">
                    {(() => {
                      const derivedStatus = review.is_approved === true ? 'approved' : review.is_approved === false ? 'rejected' : 'pending'
                      return <Badge variant={statusVariant[derivedStatus] || 'default'} className="capitalize">{statusTranslations[derivedStatus] || derivedStatus}</Badge>
                    })()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">{review.created_at ? new Date(review.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</TableCell>
                  <TableCell className="text-center"><ReviewActions reviewId={review.id} currentStatus={review.is_approved === true ? 'approved' : review.is_approved === false ? 'rejected' : 'pending'} /></TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">لا توجد تقييمات لعرضها.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

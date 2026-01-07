"use client"

import { useRouter, usePathname } from "next/navigation"
import React from "react"

export default function ReviewsFilterBar({ current }: { current: 'all' | 'approved' | 'rejected' | 'pending' }) {
  const router = useRouter()
  const pathname = usePathname()

  const go = (status: string) => {
    const url = `${pathname}?status=${status}`
    // Force a full navigation so the server component receives the searchParams
    if (typeof window !== "undefined") {
      window.location.href = url
    } else {
      // fallback to client router push
      router.push(url)
    }
  }

  return (
    <div className="flex items-center gap-2 mb-4">
      <button onClick={() => go('all')} className={`px-3 py-1 rounded ${current === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
        الكل
      </button>
      <button onClick={() => go('approved')} className={`px-3 py-1 rounded ${current === 'approved' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
        المقبول
      </button>
      <button onClick={() => go('rejected')} className={`px-3 py-1 rounded ${current === 'rejected' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
        المرفوض
      </button>
      <button onClick={() => go('pending')} className={`px-3 py-1 rounded ${current === 'pending' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
        قيد المراجعة
      </button>
    </div>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { User } from "lucide-react"
import { Button } from "./ui/button"

interface Props {
  user: any
  profile?: { name?: string; image_url?: string } | null
}

export default function ProfileDropdown({ user, profile }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("click", onDocClick)
    return () => document.removeEventListener("click", onDocClick)
  }, [])

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    // Clear client caches/storage before redirecting
    try {
      const { clearClientData } = await import("@/lib/client/clearClientData")
      await clearClientData()
    } catch (e) {
      // ignore
    }
    // Force a hard reload / cache-bust after logout
    const target = `/auth?_cb=${Date.now()}`
    if (typeof window !== "undefined") {
      window.location.replace(target)
    } else {
      router.push("/auth")
    }
  }

  const initials = (() => {
    const name = profile?.name || user?.email || ""
    const parts = name.trim().split(" ")
    if (parts.length === 0) return "U"
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  })()

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" onClick={() => setOpen((s) => !s)} className="p-0 rounded-full">
        {profile?.image_url ? (
          <img src={profile.image_url} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">{initials}</div>
        )}
      </Button>

      {open && (
        <div className="absolute ltr:right-0 rtl:left-0 mt-2 min-w-[160px] w-44 bg-background border border-border rounded-md shadow-lg z-50">
          <nav className="flex flex-col">
            <Link href="/account" className="block px-4 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>حسابي</Link>
            <Link href="/orders" className="block px-4 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>طلباتي</Link>
            <button className="w-full text-left px-4 py-2 text-sm hover:bg-muted" onClick={signOut}>تسجيل الخروج</button>
          </nav>
        </div>
      )}
    </div>
  )
}

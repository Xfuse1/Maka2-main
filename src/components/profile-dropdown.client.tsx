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
      <Button 
        variant="ghost" 
        onClick={() => setOpen((s) => !s)} 
        className="p-0 rounded-full hover:bg-primary/10 transition-colors"
        title="القائمة الشخصية"
      >
        {profile?.image_url ? (
          <img src={profile.image_url} alt="avatar" className="h-9 w-9 rounded-full object-cover border-2 border-primary/20" />
        ) : (
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-semibold text-primary border-2 border-primary/20">
            {initials}
          </div>
        )}
      </Button>

      {open && (
        <div className="absolute ltr:right-0 rtl:left-0 mt-3 min-w-[200px] bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 duration-200">
          <div className="bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 border-b border-border/50">
            <p className="text-xs font-semibold text-muted-foreground">مرحباً</p>
            <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
          </div>
          <nav className="flex flex-col py-1">
            <Link 
              href="/account" 
              className="flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-primary/10 transition-colors" 
              onClick={() => setOpen(false)}
            >
              <User className="h-4 w-4" />
              حسابي وملفي الشخصي
            </Link>
            <button 
              className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-red-50 hover:text-red-600 transition-colors border-t border-border/50" 
              onClick={signOut}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              تسجيل الخروج
            </button>
          </nav>
        </div>
      )}
    </div>
  )
}

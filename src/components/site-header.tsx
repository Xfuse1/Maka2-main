"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { MainNavigation } from "./main-navigation"
import { MobileNavigation } from "./mobile-navigation"
import { CartIcon } from "./cart-icon"
import { Button } from "./ui/button"
import { SiteLogo } from "./site-logo"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { User as UserIcon } from "lucide-react"
import ProfileDropdown from "./profile-dropdown.client"
import { useSettingsStore } from "@/store/settings-store"

export function SiteHeader() {
  const supabase = getSupabaseBrowserClient()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { settings, loadSettings } = useSettingsStore()
  const lastEventRef = useRef<string>("")

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    let isMounted = true

    // Subscribe to auth state changes (most reliable)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return
      
      console.log("[Header] Auth state changed:", _event, !!session?.user, "lastEvent:", lastEventRef.current)
      
      // Ignore INITIAL_SESSION false after SIGNED_IN (race condition fix)
      if (_event === "INITIAL_SESSION" && !session?.user && lastEventRef.current === "SIGNED_IN") {
        console.log("[Header] Ignoring INITIAL_SESSION false after SIGNED_IN, keeping previous user state")
        return
      }
      
      lastEventRef.current = _event
      
      if (session?.user) {
        console.log("[Header] Setting user on auth change:", session.user.id)
        setUser(session.user)
        setIsLoading(false)
      } else {
        console.log("[Header] No user session found")
        setUser(null)
        setProfile(null)
        setIsLoading(false)
      }
    })

    // Also check current session as fallback
    const checkCurrentSession = async () => {
      // Small delay to let onAuthStateChange fire first
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (!isMounted) return
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return
        
        console.log("[Header] Session fallback check:", !!session?.user, session?.user?.id)
        
        if (session?.user && !user) {
          setUser(session.user)
          setIsLoading(false)
        }
      } catch (err) {
        console.error("[Header] Error checking current session:", err)
      }
    }

    checkCurrentSession()

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [user, supabase])

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <SiteLogo width={80} height={80} className="w-10 h-10 sm:w-20 sm:h-20" />
            <h1 className="text-lg sm:text-2xl font-bold text-primary block">{settings.siteName}</h1>
          </Link>

          {/* Desktop Navigation */}
          <MainNavigation />

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Cart Icon */}
            <CartIcon />

            {/* Auth Links */}
            <div>
                {isLoading ? (
                  <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                ) : user ? (
                  <ProfileDropdown user={user} profile={profile} />
                ) : (
                  <Button variant="outline" asChild className="hidden md:inline-flex">
                    <Link href="/auth">
                      تسجيل الدخول
                    </Link>
                  </Button>
                )}
            </div>
            
            {/* Mobile Navigation */}
            <MobileNavigation user={user} />
          </div>
        </div>
      </div>
    </header>
  )
}

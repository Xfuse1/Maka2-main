"use client"

import { useEffect, useState } from "react"
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
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { settings, loadSettings } = useSettingsStore()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    let isMounted = true

    // Subscribe to auth state first (this works even if session is not yet loaded)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return
      
      console.log("[Header] Auth state changed:", _event, !!session?.user)
      
      if (session?.user) {
        console.log("[Header] Setting user on auth change:", session.user.id)
        setUser(session.user)
        setIsLoading(false) // ✅ Stop loading immediately when user is found
        
        // Load profile
        try {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("name, image_url, phone_number")
            .eq("id", session.user.id)
            .single()
          
          if (!isMounted) return
          if (profileData) {
            setProfile(profileData)
          }
        } catch (err) {
          console.error("[Header] Profile load on auth change error:", err)
        }
      } else {
        console.log("[Header] No user session found")
        setUser(null)
        setProfile(null)
        setIsLoading(false) // ✅ Stop loading when no user
      }
    })

    // Also try to get current session immediately
    const checkCurrentSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return
        
        console.log("[Header] Checking current session immediately:", !!session?.user)
        
        if (session?.user && !user) {
          console.log("[Header] Current session found:", session.user.id)
          setUser(session.user)
          
          // Load profile
          try {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("name, image_url, phone_number")
              .eq("id", session.user.id)
              .single()
            
            if (!isMounted) return
            if (profileData) {
              setProfile(profileData)
            }
          } catch (err) {
            console.error("[Header] Profile load error:", err)
          }
          
          setIsLoading(false)
        } else if (!session?.user) {
          // No session, stop loading
          console.log("[Header] No session, setting isLoading to false")
          setIsLoading(false)
        }
      } catch (err) {
        console.error("[Header] Error checking current session:", err)
        setIsLoading(false)
      }
    }

    // Set a timeout to ensure loading stops even if session check takes time
    const timeout = setTimeout(() => {
      if (isMounted) {
        console.log("[Header] Loading timeout reached, setting isLoading to false")
        setIsLoading(false)
      }
    }, 2000)

    checkCurrentSession()

    return () => {
      isMounted = false
      clearTimeout(timeout)
      subscription?.unsubscribe()
    }
  }, [supabase])

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

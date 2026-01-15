"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "./ui/button"
import { SiteLogo } from "./site-logo"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { Menu, X } from "lucide-react"
import ProfileDropdown from "./profile-dropdown.client"

export function LandingHeader() {
  const supabase = getSupabaseBrowserClient()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    let isMounted = true
    let lastEvent = ""

    // Subscribe to auth state changes (most reliable)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      
      console.log("[LandingHeader] Auth state changed:", _event, !!session?.user)
      
      // Ignore INITIAL_SESSION false after SIGNED_IN (race condition fix)
      if (_event === "INITIAL_SESSION" && !session?.user && lastEvent === "SIGNED_IN") {
        console.log("[LandingHeader] Ignoring INITIAL_SESSION false after SIGNED_IN")
        return
      }
      
      lastEvent = _event
      
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      
      setIsLoading(false)
    })

    // Also check current session as fallback
    const checkCurrentSession = async () => {
      // Small delay to let onAuthStateChange fire first
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (!isMounted) return
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return
        
        console.log("[LandingHeader] Session fallback check:", !!session?.user, session?.user?.id)
        
        if (session?.user && !user) {
          setUser(session.user)
        }
      } catch (err) {
        console.error("[LandingHeader] Error checking session:", err)
      }
    }

    checkCurrentSession()

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [user, supabase])

  return (
    <header className="border-b border-gray-200 bg-white/98 backdrop-blur-md supports-[backdrop-filter]:bg-white/95 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0 hover:opacity-80 transition-opacity">
            <SiteLogo width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10" />
            <h1 className="text-sm sm:text-xl font-bold text-slate-900 hidden sm:block">
              Xfuse
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-10">
            <Link 
              href="#features" 
              className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors duration-200"
            >
              المميزات
            </Link>
            <Link 
              href="#pricing" 
              className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors duration-200"
            >
              الأسعار
            </Link>
            <Link 
              href="#faq" 
              className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors duration-200"
            >
              الأسئلة الشائعة
            </Link>
            <a 
              href="#contact" 
              className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors duration-200"
            >
              تواصل معنا
            </a>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {isLoading ? (
              <div className="h-10 w-10 bg-slate-200 rounded-full animate-pulse" />
            ) : user ? (
              <ProfileDropdown user={user} profile={null} />
            ) : (
              <div className="flex gap-2 items-center">
                <Button 
                  variant="outline" 
                  asChild 
                  size="sm"
                  className="hidden sm:inline-flex border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <Link href="/auth">تسجيل الدخول</Link>
                </Button>
                <Button 
                  asChild 
                  size="sm"
                  className="hidden sm:inline-flex bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Link href="/create-store">إنشاء متجر</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-slate-700" />
              ) : (
                <Menu className="h-5 w-5 text-slate-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 py-4 border-t border-gray-200 space-y-3">
            <Link 
              href="#features" 
              className="block text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              المميزات
            </Link>
            <Link 
              href="#pricing" 
              className="block text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              الأسعار
            </Link>
            <Link 
              href="#faq" 
              className="block text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              الأسئلة الشائعة
            </Link>
            <a 
              href="#contact" 
              className="block text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              تواصل معنا
            </a>
            {!user && (
              <div className="flex flex-col gap-2 pt-2">
                <Button variant="outline" asChild className="w-full border-slate-300 text-slate-700 hover:bg-slate-50">
                  <Link href="/auth">تسجيل الدخول</Link>
                </Button>
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href="/create-store">إنشاء متجر</Link>
                </Button>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}

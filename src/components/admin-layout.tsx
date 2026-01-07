"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, LogOut, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useSettingsStore } from "@/store/settings-store"

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const router = useRouter()
  const { isAuthenticated, logout } = useAuthStore()
  const { settings, loadSettings } = useSettingsStore()

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/idara-alkhasa")
    }
  }, [isAuthenticated, router])

  const handleLogout = () => {
    // Best-effort clear client data before redirect
    try {
      // fire-and-forget
      import("@/lib/client/clearClientData").then((m) => m.clearClientData()).catch(() => {})
    } catch (e) {
      // Silently ignore - clearing cache is optional cleanup
    }
    logout()
    router.push("/")
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    // suppressHydrationWarning: allow minor client-only DOM attribute differences
    // (e.g. browser extensions that inject attributes) without noisy React errors.
    <div suppressHydrationWarning className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/idara-alkhasa/dashboard"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <LayoutDashboard className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">لوحة التحكم</h1>
                <p className="text-sm text-muted-foreground">{settings.siteName}</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Button asChild variant="outline">
                <Link href="/">
                  <ShoppingBag className="w-4 h-4 ml-2" />
                  عرض الموقع
                </Link>
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="w-4 h-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">{title}</h2>
          {description && <p className="text-muted-foreground text-lg">{description}</p>}
        </div>
        {children}
      </main>
    </div>
  )
}
